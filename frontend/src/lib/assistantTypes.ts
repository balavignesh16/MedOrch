/**
 * Manually maintained TypeScript mirror of protos/healthcare_analytics.proto.
 *
 * The frontend has no generated protobuf stubs by design: it loads the
 * .proto file directly at runtime via @grpc/proto-loader. These types must
 * be kept in sync by hand whenever the proto changes. Do not add generated
 * stub tooling here unless that architecture is deliberately changed.
 */

export type ExecutionStatus =
  | 'EXECUTION_STATUS_UNSPECIFIED'
  | 'EXECUTION_STATUS_ANALYZING'
  | 'EXECUTION_STATUS_OK'
  | 'EXECUTION_STATUS_UNSUPPORTED'
  | 'EXECUTION_STATUS_REJECTED'
  | 'EXECUTION_STATUS_ERROR'
  | 'EXECUTION_STATUS_TIMEOUT';

/** Raw gRPC message shape as decoded by @grpc/proto-loader (snake_case, keepCase: true). */
export interface InsightResponseMessage {
  response_id: string;
  summary_text: string;
  visualization_data_json: string;
  research_citations?: Array<{ title: string; url: string; snippet: string }>;
  pii_scrubbed: boolean;
  executed_sql: string;
  execution_status: ExecutionStatus;
  model_version: string;
  audit_id: string;
  is_final: boolean;
  error_code: string;
  pii_detected: boolean;
  pii_redacted: boolean;
}

/**
 * Fields this application is willing to forward to the browser over SSE.
 * Provenance fields (executed_sql, audit_id) are development-only and must
 * never reach the client unless explicitly enabled — see
 * ANALYTICS_DEV_PROVENANCE handling in app/api/stream/route.ts.
 */
export interface AssistantStreamEvent {
  summaryText: string;
  visualizationDataJson: string;
  executionStatus: ExecutionStatus;
  isFinal: boolean;
  errorCode: string;
  piiDetected: boolean;
  piiRedacted: boolean;
  executedSql?: string;
  auditId?: string;
}

/** Mirrors config/assistant_capabilities.json. Kept in sync by hand. */
export interface AssistantCapabilityContext {
  id: string;
  display_name: string;
  description: string;
  available: boolean;
  required_tables: string[];
  required_columns: string[];
  suggested_prompts: string[];
  unsupported_examples: string[];
  safety_limitations: string[];
  unavailable_reason: string | null;
}

export interface AssistantCapabilitiesFile {
  version: number;
  source_table: string;
  contexts: AssistantCapabilityContext[];
}
