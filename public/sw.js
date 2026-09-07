/**
 * SeerTarot Service Worker (Edge-Native PWA Cache Engine)
 * -------------------------------------------------------------
 * 1. Cache-First: Next.js static chunks (/_next/static/*), ภาพไพ่ 78 ใบ (/cards/*), ฟอนต์ และไอคอน
 * 2. Stale-While-Revalidate: หน้าเว็บหลัก (HTML Shell: /, /cards, /spreads, /blog, /daily)
 * 3. Network-Only: Dynamic API (/api/*), Admin (/admin/*), Account (/account/*) และ Queue
 * 4. Offline Fallback: เสิร์ฟหน้า /offline.html เมื่อผู้ใช้อยู่นอกสัญญาณเน็ต
 * 5. Cache Invalidation: กำจัดแคชเวอร์ชันเก่าอัตโนมัติเมื่อมีการอัปเดตเวอร์ชัน
 */

const CACHE_VERSION = "v-b77d8e2";
const STATIC_CACHE_NAME = `seertarot-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `seertarot-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/offline.html",
  "/favicon.ico",
  "/icon.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/manifest.webmanifest",
];

// เพดานจำนวนหน้า HTML ที่เก็บไว้ในแคชระหว่างใช้งาน (ตัดแบบเก่าสุดออกก่อน)
const RUNTIME_CACHE_LIMIT = 30;

async function trimCache(cache, maxEntries) {
  try {
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    // cache.keys() คืนรายการตามลำดับที่ถูกใส่เข้าไป — ตัดหัวแถวคือตัวที่เก่าที่สุด
    await Promise.all(
      keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key))
    );
  } catch {
    // ถ้าเก็บกวาดไม่สำเร็จก็ไม่ควรทำให้คำขอที่กำลังเสิร์ฟอยู่พัง
  }
}

// ติดตั้ง Service Worker และโหลด Precache สำคัญ
// ⚠️ ห้ามเรียก self.skipWaiting() ตรงนี้เด็ดขาด
// ถ้า skip ทันทีตอน install → activate ทำงานต่อทันที ลบแคช `seertarot-static-<เวอร์ชันเก่า>`
// ทิ้ง แล้ว clients.claim() ยึดหน้าที่ผู้ใช้เปิดค้างอยู่ · แต่เอกสารหน้านั้นยังอ้างอิง
// `/_next/static/chunks/*.js` ชื่อเก่าซึ่งตอนนี้หายไปทั้งจากแคชและจาก origin
// พอผู้ใช้กดเปิดโมดัลที่โหลดแบบ dynamic (ประวัติ, เติมโควตา, แผงแอดมิน) จะได้ ChunkLoadError
// ปล่อยให้ตัวใหม่รอเป็น waiting worker แล้วขึ้นทำงานตอนโหลดหน้าครั้งถัดไปแทน
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// กำจัดแคชเวอร์ชันเก่าเมื่อ Service Worker ใหม่ถูกเปิดใช้งาน
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE_NAME, RUNTIME_CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// จัดการคำขอ Network
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // รองรับเฉพาะคำขอ GET จาก origin เดียวกัน
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // เส้นทางไดนามิก ห้ามแคชเด็ดขาด (Network-Only)
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/account") ||
    url.pathname.startsWith("/readers/console") ||
    url.pathname.startsWith("/readers/queue")
  ) {
    return;
  }

  // 1. Static Assets & Images: Cache-First
  // ครอบคลุม /_next/static/*, /cards/*, /icons/* และไฟล์ทรัพยากรคงที่
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/cards/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:webp|png|jpg|jpeg|svg|gif|woff2|woff|ttf|css|js)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== "basic"
            ) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => {
            // ถ้าเป็นรูปภาพแล้วออฟไลน์ คืนค่า empty หรือ fallback หากมี
            return new Response("", { status: 408, statusText: "Offline" });
          });
      })
    );
    return;
  }

  // 2. Navigation / HTML Requests: Stale-While-Revalidate with Offline Fallback
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE_NAME).then(async (cache) => {
              await cache.put(request, responseToCache);
              // เว็บมีหน้า prerender ~299 หน้า ถ้าเก็บทุกหน้าที่ผู้ใช้เดินผ่านโดยไม่จำกัด
              // โควตาที่เก็บข้อมูลของ origin จะเต็ม แล้วเบราว์เซอร์ล้าง **ทั้งถัง** ทิ้ง
              // รวมถึง /offline.html ที่ precache ไว้ — หน้าสำรองตอนออฟไลน์จึงเงียบหายไปเฉย ๆ
              await trimCache(cache, RUNTIME_CACHE_LIMIT);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // หากไม่มีในแคช ให้ส่งหน้า fallback ออฟไลน์
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) {
            return offlinePage;
          }

          return new Response("ออฟไลน์ - ไม่สามารถเชื่อมต่อระบบได้ในขณะนี้", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        })
    );
    return;
  }
});

// รองรับข้อความจากไคลเอนต์เพื่อ skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
