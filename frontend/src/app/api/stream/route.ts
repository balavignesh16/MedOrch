import { getSessionUser } from '@/lib/auth/guard';
import type { SessionUser } from '@/lib/auth/session';
import { NextRequest } from 'next/server';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import {
  getAnalyticsGatewayAddress,
  getAnalyticsRequestTimeoutMs,
} from '@/lib/serverConfig';
import { validateAnalyticsRequest } from '@/lib/analyticsRequest';
import { apiError } from '@/lib/apiResponse';
import type { ExecutionStatus } from '@/lib/assistantTypes';

const PROTO_PATH = path.resolve(process.cwd(), '../protos/healthcare_analytics.proto');
export interface QueryRequest {
  query_id: string;
  natural_language_prompt: string;
  user_role: string;
  agent_target: string;
  model_profile_id: string;
}

export interface InsightResponse {
  summary_text: string;
  visualization_data_json: string;
  execution_status?: ExecutionStatus;
  is_final?: boolean;
  error_code?: string;
  pii_detected?: boolean;
  pii_redacted?: boolean;
  executed_sql?: string;
  audit_id?: string;
  model_version?: string;
}

// Development-only: exposes provenance fields (generated SQL, audit id) in
// the SSE payload. Must stay false by default — Phase 3 authentication is
// not complete, so nothing beyond the summary/visualization is trusted for
// browser exposure until an operator explicitly opts in for local debugging.
const DEV_PROVENANCE_ENABLED = process.env.ANALYTICS_DEV_PROVENANCE === 'true';

export interface AnalyticsClient {
  ProcessQuery(
    request: QueryRequest,
    options: grpc.CallOptions,
  ): grpc.ClientReadableStream<InsightResponse>;
  close(): void;
}

type AnalyticsClientConstructor = new (
  address: string,
  credentials: grpc.ChannelCredentials,
) => AnalyticsClient;

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as grpc.GrpcObject;
const healthcarePackage = protoDescriptor.healthcare as grpc.GrpcObject;
const AnalyticsEngineClient = healthcarePackage.AnalyticsEngine as unknown as AnalyticsClientConstructor;

interface AnalyticsRouteDependencies {
  /** The signed-in user for the request, or null. Identity always comes from the signed session cookie. */
  resolveUser(request: NextRequest): SessionUser | null;
  createClient(): AnalyticsClient;
  randomUUID(): string;
  now(): number;
}

export function createAnalyticsPostHandler(dependencies: AnalyticsRouteDependencies) {
  return async function analyticsPost(req: NextRequest) {
  const user = dependencies.resolveUser(req);
  if (!user) return apiError('unauthorized', 'Sign in to use the assistant', 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('invalid_json', 'Request body must be valid JSON', 400);
  }

  const validation = validateAnalyticsRequest(body);
  if (!validation.ok) return apiError('invalid_request', validation.error, 400);
  const { prompt, agentTarget, modelProfileId } = validation.value;

  const client = dependencies.createClient();
  const encoder = new TextEncoder();
  const request: QueryRequest = {
    query_id: `q-${dependencies.randomUUID()}`,
    natural_language_prompt: prompt,
    // Recorded in the audit log as the requester; derived from the signed session, never from the request body.
    user_role: `${user.username}:${user.role}`,
    agent_target: agentTarget,
    model_profile_id: modelProfileId,
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        client.close();
        controller.close();
      };
      const sendEvent = (data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      const call = client.ProcessQuery(request, {
        deadline: new Date(dependencies.now() + getAnalyticsRequestTimeoutMs()),
      });

      const abort = () => {
        call.cancel();
        close();
      };
      req.signal.addEventListener('abort', abort, { once: true });

      call.on('data', (response: InsightResponse) => {
        sendEvent({
          summaryText: response.summary_text,
          visualizationDataJson: response.visualization_data_json,
          executionStatus: response.execution_status ?? 'EXECUTION_STATUS_UNSPECIFIED',
          isFinal: response.is_final ?? false,
          errorCode: response.error_code ?? '',
          piiDetected: response.pii_detected ?? false,
          piiRedacted: response.pii_redacted ?? false,
          modelVersion: response.model_version ?? '',
          ...(DEV_PROVENANCE_ENABLED
            ? { executedSql: response.executed_sql, auditId: response.audit_id }
            : {}),
        });
      });
      call.on('end', () => {
        req.signal.removeEventListener('abort', abort);
        close();
      });
      call.on('error', (error: grpc.ServiceError) => {
        req.signal.removeEventListener('abort', abort);
        if (error.code !== grpc.status.CANCELLED) {
          console.error('gRPC stream error:', error.message);
          sendEvent({
            summaryText: 'The analytics service is unavailable.',
            visualizationDataJson: '{}',
            executionStatus: 'EXECUTION_STATUS_ERROR',
            isFinal: true,
            errorCode: 'INTERNAL_ERROR',
            piiDetected: false,
            piiRedacted: false,
          });
        }
        close();
      });
    },
    cancel() {
      client.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
    },
  });
  };
}

export const POST = createAnalyticsPostHandler({
  resolveUser: (request) => getSessionUser(request),
  createClient: () => new AnalyticsEngineClient(
    getAnalyticsGatewayAddress(),
    grpc.credentials.createInsecure(),
  ),
  randomUUID: () => crypto.randomUUID(),
  now: () => Date.now(),
});
