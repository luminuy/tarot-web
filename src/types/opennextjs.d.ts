declare module "@opennextjs/cloudflare" {
  export interface CloudflareContext {
    env: Record<string, unknown>;
    ctx: {
      waitUntil?: (promise: Promise<unknown>) => void;
      passThroughOnException?: () => void;
    };
    cf?: Record<string, unknown>;
  }

  export function getCloudflareContext(options?: { async?: boolean }): Promise<CloudflareContext>;
}
