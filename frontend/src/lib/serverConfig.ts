function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getAnalyticsGatewayAddress(): string {
  return process.env.ANALYTICS_GATEWAY_ADDRESS?.trim() || '127.0.0.1:50051';
}

export function getAnalyticsRequestTimeoutMs(): number {
  return positiveInteger(process.env.ANALYTICS_REQUEST_TIMEOUT_MS, 45_000);
}
