/**
 * Cloudflare R2 Storage Service
 * Handles persistent object storage for generated Share Cards (IG Stories / Postcards)
 * and TTS audio files with Zero Egress Bandwidth Fees.
 */

export class StorageService {
  private static localCache = new Map<string, { data: Uint8Array; contentType: string }>();

  /**
   * Upload an asset to Cloudflare R2 or fallback local storage
   */
  static async putObject(
    key: string,
    data: Uint8Array | ArrayBuffer,
    contentType: string,
    env?: { TAROT_STORAGE?: any }
  ): Promise<string> {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

    if (env?.TAROT_STORAGE) {
      await env.TAROT_STORAGE.put(key, bytes, {
        httpMetadata: { contentType },
      });
      return `/api/storage/${key}`;
    }

    // Local / In-memory fallback
    this.localCache.set(key, { data: bytes, contentType });
    return `/api/storage/${key}`;
  }

  /**
   * Fetch an asset from Cloudflare R2 or fallback local storage
   */
  static async getObject(
    key: string,
    env?: { TAROT_STORAGE?: any }
  ): Promise<{ data: Uint8Array; contentType: string } | null> {
    if (env?.TAROT_STORAGE) {
      const obj = await env.TAROT_STORAGE.get(key);
      if (!obj) return null;
      const data = new Uint8Array(await obj.arrayBuffer());
      const contentType = obj.httpMetadata?.contentType || "application/octet-stream";
      return { data, contentType };
    }

    return this.localCache.get(key) || null;
  }
}
