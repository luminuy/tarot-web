/**
 * แคชคำตอบ GET สาธารณะที่ขอบด้วย Workers Cache API (A9-02)
 * ---------------------------------------------------------------------------
 * ทำไมต้องมี: `/api/*` อยู่ใน `run_worker_first` ทุกคำขอจึงวิ่งเข้า Worker ก่อนเสมอ และ
 * response ที่ Worker สร้างเอง **ไม่ผ่านแคช CDN** — หัว `s-maxage` / `CDN-Cache-Control`
 * จึงไม่มีผลอะไรที่ขอบ ทุกคำขอไปอ่าน D1/KV ใหม่ทั้งหมด
 *
 * ตัวช่วยนี้เก็บคำตอบไว้ใน `caches.default` (แคชของ data center นั้น) ตามอายุ `s-maxage`
 * ที่ route ประกาศอยู่แล้ว · Worker ยังถูกปลุกทุกคำขอ (Cache API ไม่ได้ตัดตรงนั้น)
 * แต่คำขอที่เจอในแคชไม่ต้องแตะ D1/KV และตอบได้เร็วกว่า
 *
 * กติกาความปลอดภัย:
 *   - ใช้กับเส้นที่คำตอบเหมือนกันทุกคนเท่านั้น (route เป็นคนเลือกเรียก) — ห้ามใช้กับเส้นที่อ่านผู้ใช้
 *   - คำขอที่มี `Authorization` ไม่แตะแคชเลย
 *   - **เก็บลงแคชเฉพาะคำขอที่ไม่มีคุกกี้** — ต่อให้วันหน้ามีโค้ดชั้นในไปอ่านคุกกี้ คำตอบของคนที่ล็อกอิน
 *     ก็ไม่มีทางถูกเก็บไปเสิร์ฟคนอื่น (คำขอที่มีคุกกี้ยังได้คำตอบจากแคชที่คนไม่มีคุกกี้สร้างไว้)
 *   - เก็บเฉพาะ 200 ที่ประกาศ `public` + `s-maxage`/`max-age` > 0 และไม่มี `Set-Cookie`
 *   - ไม่มี `caches.default` (Node · `next dev` · ชุดทดสอบ) = ทำงานตรงเหมือนไม่มีแคช
 *
 * ตอนเสิร์ฟจากแคชจะใส่หัว `Age` ให้ถูก — เบราว์เซอร์จึงนับอายุ `max-age` ต่อจากตอนที่สร้างจริง
 * (สำคัญกับไพ่ประจำวันที่ทุกชั้นต้องหมดอายุไม่เกินเที่ยงคืนเวลาไทย — A2-06)
 */
import { getWaitUntil } from "@/lib/platform/cf";

/** ส่วนของ Cache API ที่ใช้ (Cloudflare `caches.default`) */
export interface EdgeCacheStore {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

/** หัวภายใน: เก็บ Cache-Control เดิมไว้คืนให้เบราว์เซอร์ + เวลาที่เก็บ (ไม่ส่งออกนอก Worker) */
const ORIGINAL_CC_HEADER = "x-edge-original-cache-control";
const STORED_AT_HEADER = "x-edge-stored-at";
/** หัวที่ส่งให้ผู้เรียก — ใช้ตรวจบน production ว่าแคชทำงานจริง (`curl -sI … | grep x-edge-cache`) */
export const EDGE_CACHE_STATUS_HEADER = "x-edge-cache";

let storeOverride: EdgeCacheStore | null | undefined;

/** ชุดทดสอบเท่านั้น — ใส่แคชในหน่วยความจำแทน `caches.default` (`undefined` = กลับไปใช้ของจริง) */
export function setEdgeCacheStoreForTests(store: EdgeCacheStore | null | undefined): void {
  storeOverride = store;
}

function getStore(): EdgeCacheStore | null {
  if (storeOverride !== undefined) return storeOverride;
  const storage = (globalThis as { caches?: { default?: EdgeCacheStore } }).caches;
  return storage?.default ?? null;
}

/** อายุที่ขอบ (วินาที) จาก `s-maxage` ก่อน แล้วค่อย `max-age` · 0 = ห้ามเก็บ */
export function edgeTtlSeconds(cacheControl: string | null): number {
  if (!cacheControl) return 0;
  const cc = cacheControl.toLowerCase();
  if (!/(^|[\s,])public([\s,]|$)/.test(cc)) return 0;
  if (/(^|[\s,])(private|no-store|no-cache)([\s,=]|$)/.test(cc)) return 0;
  const pick = (name: string) => {
    const m = cc.match(new RegExp(`(?:^|[\\s,])${name}=(\\d+)`));
    return m ? Number(m[1]) : null;
  };
  const ttl = pick("s-maxage") ?? pick("max-age") ?? 0;
  return Number.isFinite(ttl) && ttl > 0 ? Math.floor(ttl) : 0;
}

function withStatus(response: Response, status: "HIT" | "MISS"): Response {
  const headers = new Headers(response.headers);
  headers.set(EDGE_CACHE_STATUS_HEADER, status);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/**
 * ตอบ GET สาธารณะผ่านแคชที่ขอบ
 * @param request คำขอจริง (ใช้ดูเมธอด/หัว และเป็นคีย์ตั้งต้น)
 * @param produce สร้างคำตอบเมื่อไม่เจอในแคช — ห้ามขึ้นกับตัวผู้ใช้
 * @param options.key คีย์แคช (URL เต็ม) — ไม่ใส่ = URL ของคำขอ · เส้นที่ไม่อ่าน query ควรส่งคีย์ที่ตัด query ทิ้ง
 */
export async function withEdgeCache(
  request: Request,
  produce: () => Promise<Response>,
  options: { key?: string } = {},
): Promise<Response> {
  const store = getStore();
  if (!store || request.method !== "GET" || request.headers.has("authorization")) return produce();

  let cacheKey: Request;
  try {
    cacheKey = new Request(options.key ?? request.url, { method: "GET" });
  } catch {
    return produce();
  }

  try {
    const hit = await store.match(cacheKey);
    if (hit) {
      const headers = new Headers(hit.headers);
      const original = headers.get(ORIGINAL_CC_HEADER);
      if (original) headers.set("Cache-Control", original);
      const storedAt = Number(headers.get(STORED_AT_HEADER));
      if (Number.isFinite(storedAt) && storedAt > 0) {
        headers.set("Age", String(Math.max(0, Math.floor((Date.now() - storedAt) / 1000))));
      }
      headers.delete(ORIGINAL_CC_HEADER);
      headers.delete(STORED_AT_HEADER);
      headers.set(EDGE_CACHE_STATUS_HEADER, "HIT");
      return new Response(hit.body, { status: hit.status, statusText: hit.statusText, headers });
    }
  } catch {
    // แคชอ่านไม่ได้ = สร้างคำตอบตามปกติ
  }

  const response = await produce();
  const ttl = edgeTtlSeconds(response.headers.get("Cache-Control"));
  const storable =
    response.status === 200 && ttl > 0 && !response.headers.has("set-cookie") && !request.headers.has("cookie");
  if (!storable) return response;

  // สำเนาที่เก็บ: อายุที่ขอบ = s-maxage ที่ route ประกาศ (Cache API อ่าน Cache-Control ของสำเนานี้)
  const headers = new Headers(response.headers);
  headers.set(ORIGINAL_CC_HEADER, response.headers.get("Cache-Control") ?? "");
  headers.set(STORED_AT_HEADER, String(Date.now()));
  headers.set("Cache-Control", `public, max-age=${ttl}`);
  const copy = new Response(response.clone().body, { status: response.status, headers });
  try {
    const waitUntil = await getWaitUntil();
    waitUntil(store.put(cacheKey, copy).catch(() => {}));
  } catch {
    // เก็บไม่ได้ก็แค่ไม่มีแคชรอบนี้
  }
  return withStatus(response, "MISS");
}
