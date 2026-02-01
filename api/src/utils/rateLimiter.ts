interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  /**
   * Check if a key is rate limited.
   * Returns { limited: false, remaining, resetAt } if allowed,
   * or { limited: true, remaining: 0, resetAt } if blocked.
   */
  check(key: string): { limited: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // No entry or window expired — start fresh
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + this.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { limited: false, remaining: this.maxRequests - 1, resetAt };
    }

    // Within window
    entry.count++;

    if (entry.count > this.maxRequests) {
      return { limited: true, remaining: 0, resetAt: entry.resetAt };
    }

    return { limited: false, remaining: this.maxRequests - entry.count, resetAt: entry.resetAt };
  }

  /** Reset a specific key (useful for testing) */
  reset(key: string): void {
    this.store.delete(key);
  }

  /** Clear all entries */
  clear(): void {
    this.store.clear();
  }
}
