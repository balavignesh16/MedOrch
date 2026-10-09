import { EventEmitter } from 'node:events';
import type * as grpc from '@grpc/grpc-js';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import {
  AnalyticsClient,
  createAnalyticsPostHandler,
  InsightResponse,
  QueryRequest,
} from './route';

class FakeCall extends EventEmitter {
  cancelled = false;

  cancel(): void {
    this.cancelled = true;
  }
}

class FakeClient implements AnalyticsClient {
  call = new FakeCall();
  closed = false;
  request: QueryRequest | null = null;

  ProcessQuery(request: QueryRequest): grpc.ClientReadableStream<InsightResponse> {
    this.request = request;
    return this.call as unknown as grpc.ClientReadableStream<InsightResponse>;
  }

  close(): void {
    this.closed = true;
  }
}

function makeHandler(client: FakeClient) {
  return createAnalyticsPostHandler({
    createClient: () => client,
    randomUUID: () => 'test-id',
    now: () => 1_000,
  });
}

function jsonRequest(body: unknown, signal?: AbortSignal): NextRequest {
  return new NextRequest('http://localhost/api/stream', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    signal,
  });
}

describe('POST /api/stream', () => {
  it('rejects malformed JSON before creating a gateway client', async () => {
    const createClient = vi.fn(() => new FakeClient());
    const handler = createAnalyticsPostHandler({
      createClient,
      randomUUID: () => 'test-id',
      now: () => 1_000,
    });
    const request = new NextRequest('http://localhost/api/stream', {
      method: 'POST',
      body: '{',
      headers: { 'content-type': 'application/json' },
    });

    const response = await handler(request);
    expect(response.status).toBe(400);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('forwards validated requests and emits SSE data', async () => {
    const client = new FakeClient();
    const response = await makeHandler(client)(jsonRequest({ prompt: 'count encounters', agent_target: 'general' }));

    queueMicrotask(() => {
      client.call.emit('data', { summary_text: '42 encounters', visualization_data_json: '{}' });
      client.call.emit('end');
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    expect(await response.text()).toContain('42 encounters');
    expect(client.request).toMatchObject({
      query_id: 'q-test-id',
      natural_language_prompt: 'count encounters',
      user_role: 'unauthenticated-demo',
      agent_target: 'general',
    });
    expect(client.closed).toBe(true);
  });

  it('emits a safe message when the gateway fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const client = new FakeClient();
    const response = await makeHandler(client)(jsonRequest({ prompt: 'count encounters' }));

    queueMicrotask(() => {
      client.call.emit('error', { code: 14, message: 'private upstream detail' });
    });

    const body = await response.text();
    expect(body).toContain('The analytics service is unavailable.');
    expect(body).not.toContain('private upstream detail');
    expect(client.closed).toBe(true);
  });

  it('cancels the gateway stream when the request is aborted', async () => {
    const abortController = new AbortController();
    const client = new FakeClient();
    const response = await makeHandler(client)(jsonRequest({ prompt: 'count encounters' }, abortController.signal));

    abortController.abort();
    await response.text();

    expect(client.call.cancelled).toBe(true);
    expect(client.closed).toBe(true);
  });

  it('maps a terminal OK response including is_final and execution_status', async () => {
    const client = new FakeClient();
    const response = await makeHandler(client)(jsonRequest({ prompt: 'count encounters' }));

    queueMicrotask(() => {
      client.call.emit('data', {
        summary_text: '3 encounters',
        visualization_data_json: '{"columns":["count"],"rows":[[3]]}',
        execution_status: 'EXECUTION_STATUS_OK',
        is_final: true,
        error_code: '',
        pii_detected: false,
        pii_redacted: false,
        executed_sql: 'SELECT COUNT(*) FROM hospital_readmissions;',
        audit_id: 'audit-1',
      });
      client.call.emit('end');
    });

    const body = await response.text();
    expect(body).toContain('"executionStatus":"EXECUTION_STATUS_OK"');
    expect(body).toContain('"isFinal":true');
  });

  it('does not forward executedSql or auditId unless dev provenance is explicitly enabled', async () => {
    const client = new FakeClient();
    const response = await makeHandler(client)(jsonRequest({ prompt: 'count encounters' }));

    queueMicrotask(() => {
      client.call.emit('data', {
        summary_text: '3 encounters',
        visualization_data_json: '{}',
        executed_sql: 'SELECT COUNT(*) FROM hospital_readmissions;',
        audit_id: 'audit-secret',
        is_final: true,
      });
      client.call.emit('end');
    });

    const body = await response.text();
    expect(body).not.toContain('audit-secret');
    expect(body).not.toContain('executedSql');
  });

  it('maps an UNSUPPORTED terminal response with no executed SQL', async () => {
    const client = new FakeClient();
    const response = await makeHandler(client)(jsonRequest({ prompt: 'forecast next quarter' }));

    queueMicrotask(() => {
      client.call.emit('data', {
        summary_text: 'This request cannot be answered from the available dataset.',
        visualization_data_json: '{}',
        execution_status: 'EXECUTION_STATUS_UNSUPPORTED',
        is_final: true,
        error_code: 'UNSUPPORTED_REQUEST',
      });
      client.call.emit('end');
    });

    const body = await response.text();
    expect(body).toContain('EXECUTION_STATUS_UNSUPPORTED');
    expect(body).toContain('UNSUPPORTED_REQUEST');
  });

  it('gateway failure produces exactly one final error event', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const client = new FakeClient();
    const response = await makeHandler(client)(jsonRequest({ prompt: 'count encounters' }));

    queueMicrotask(() => {
      client.call.emit('error', { code: 14, message: 'upstream unavailable' });
    });

    const body = await response.text();
    const events = body.split('\n\n').filter((line) => line.startsWith('data: '));
    expect(events).toHaveLength(1);
    expect(events[0]).toContain('"isFinal":true');
    expect(events[0]).toContain('"executionStatus":"EXECUTION_STATUS_ERROR"');
  });
});
