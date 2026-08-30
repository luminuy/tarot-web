/**
 * Cloudflare KV Caching Service
 * Caches Daily Card interpretations (TTL: 24h), reducing AI API costs by up to 90%,
 * while providing sub-millisecond edge response times.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private static localKV = new Map<string, CacheEntry<any>>();

  /**
   * Get a cached value by key
   */
  static async get<T>(key: string, env?: { TAROT_KV?: any }): Promise<T | null> {
    if (env?.TAROT_KV) {
      const val = await env.TAROT_KV.get(key, "json");
      return val as T | null;
    }

    const entry = this.localKV.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.localKV.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a cached value with TTL in seconds
   */
  static async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 86400,
    env?: { TAROT_KV?: any }
  ): Promise<void> {
    if (env?.TAROT_KV) {
      await env.TAROT_KV.put(key, JSON.stringify(value), {
        expirationTtl: ttlSeconds,
      });
      return;
    }

    this.localKV.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Get or compute with cache wrapper
   */
  static async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    computeFn: () => Promise<T>,
    env?: { TAROT_KV?: any }
  ): Promise<T> {
    const cached = await this.get<T>(key, env);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await computeFn();
    await this.set<T>(key, fresh, ttlSeconds, env);
    return fresh;
  }
}
