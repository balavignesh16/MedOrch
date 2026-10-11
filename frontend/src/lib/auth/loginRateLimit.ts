export interface LimitStatus {
  blocked: boolean;
  retryAfterSeconds: number;
}

/** Sliding-window limiter: after maxFailures failed logins inside the window, further attempts are refused until the oldest failure ages out. */
export class LoginLimiter {
  private readonly failures = new Map<string, number[]>();

  constructor(
    private readonly maxFailures = 5,
    private readonly windowMs = 15 * 60 * 1000,
  ) {}

  private recent(key: string, nowMs: number): number[] {
    const kept = (this.failures.get(key) ?? []).filter((time) => nowMs - time < this.windowMs);
    if (kept.length > 0) this.failures.set(key, kept);
    else this.failures.delete(key);
    return kept;
  }

  check(key: string, nowMs: number): LimitStatus {
    const kept = this.recent(key, nowMs);
    if (kept.length < this.maxFailures) return { blocked: false, retryAfterSeconds: 0 };
    const oldest = kept[kept.length - this.maxFailures];
    return { blocked: true, retryAfterSeconds: Math.max(1, Math.ceil((oldest + this.windowMs - nowMs) / 1000)) };
  }

  recordFailure(key: string, nowMs: number): void {
    const kept = this.recent(key, nowMs);
    kept.push(nowMs);
    this.failures.set(key, kept);
  }

  reset(key: string): void {
    this.failures.delete(key);
  }
}
