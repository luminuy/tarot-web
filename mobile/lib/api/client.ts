import { fetch as streamingFetch } from "expo/fetch";

import { API_BASE_URL, APP_VERSION } from "@/lib/config";
import { getToken } from "@/lib/auth/session";
import type { ApiErrorBody, ReadEvent } from "@/lib/api/types";

/**
 * ตัวเรียกหลังบ้านตัวเดียวของแอป
 * - แนบ `Authorization: Bearer` เมื่อมีโทเคน · `X-Client: ios` · `X-App-Version` ทุกคำขอ
 * - ใช้ `expo/fetch` ทั้งหมด เพราะ `fetch` ของ React Native อ่านสตรีม SSE ไม่ได้ (แผนข้อ 3.5)
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(message);
  }
}

function headers(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "X-Client": "ios",
    "X-App-Version": APP_VERSION,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function apiJson<T>(
  path: string,
  init: { method?: "GET" | "POST" | "DELETE"; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const res = await streamingFetch(`${API_BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers: headers(init.headers),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const body = (await res.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!res.ok) {
    throw new ApiError(body.error ?? body.message ?? "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ", res.status, body);
  }
  return body;
}

/**
 * อ่านสตรีม SSE ของ `/api/reading/[id]/read` ทีละเหตุการณ์
 * รูปแบบ: `event: <ชื่อ>\ndata: <JSON>\n\n`
 */
export async function* streamReading(readingId: string, readingToken: string): AsyncGenerator<ReadEvent> {
  const res = await streamingFetch(`${API_BASE_URL}/api/reading/${readingId}/read`, {
    method: "POST",
    headers: headers({ "x-reading-token": readingToken }),
    body: "{}",
  });

  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(body.error ?? "อ่านไพ่ไม่สำเร็จ ลองใหม่อีกครั้งนะ", res.status, body);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const event = /^event: (.+)$/m.exec(raw)?.[1];
      const data = /^data: (.+)$/m.exec(raw)?.[1];
      if (!event || !data) continue;
      try {
        yield { ...JSON.parse(data), type: event } as ReadEvent;
      } catch {
        // เหตุการณ์ที่แกะไม่ได้ถูกข้าม — สตรีมขาดจริงจะไม่มี `done` แล้วหน้าจอขึ้น "โหลดใหม่อีกครั้ง"
      }
    }
  }
}
