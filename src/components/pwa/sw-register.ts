/**
 * 🔌 ตรรกะลงทะเบียน Service Worker — แยกออกจาก React โดยตั้งใจ
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องเป็นไฟล์ธรรมดา ไม่ใช่โค้ดใน `useEffect`
 *
 * บทเรียน R-01: บั๊กที่ทำให้ **ผู้ใช้ใหม่ทุกคนโหลดทั้งหน้าสองรอบ** อยู่ในตรรกะ 5 บรรทัด
 * ที่ฝังอยู่ใน `useEffect` ของคอมโพเนนต์ — ทดสอบไม่ได้เลยถ้าไม่มี jsdom ทั้งชุด
 * จึงมองไม่เห็นมาตลอดจนกว่าจะมีคนยิง Lighthouse แล้วสังเกตว่าเอกสารถูกขอสองครั้ง
 *
 * ย้ายมาเป็นฟังก์ชันที่รับ "สภาพแวดล้อม" เข้ามาทางพารามิเตอร์ ด่าน CI จึงป้อนของปลอม
 * แล้ว**รันโค้ดเส้นเดียวกับที่ผู้ใช้จริงรัน**ได้ ไม่ใช่ตรวจว่ามีข้อความนี้ในไฟล์ไหม
 *
 * ⚠️ ห้ามย้ายตรรกะการตัดสินใจกลับเข้าไปในคอมโพเนนต์ — ด่าน `test-sw-reload.ts` เฝ้าอยู่
 */

/** ส่วนของ `navigator.serviceWorker` ที่ตรรกะนี้ใช้จริง */
export interface SwContainerLike {
  controller: unknown;
  addEventListener(type: "controllerchange", listener: () => void): void;
  removeEventListener(type: "controllerchange", listener: () => void): void;
  register(
    url: string,
    options?: { scope?: string },
  ): Promise<{ installing: { state: string; onstatechange: (() => void) | null } | null; onupdatefound: (() => void) | null }>;
}

/** สภาพแวดล้อมที่ `setupServiceWorker()` ต้องใช้ — ฉีดเข้ามาได้ทั้งหมดเพื่อให้ทดสอบได้ */
export interface SwEnv {
  container: SwContainerLike;
  /** โหลดหน้าใหม่ (ของจริงคือ `window.location.reload`) */
  reload: () => void;
  /** สั่งลงทะเบียนทันที หรือรอ `load` — ของจริงอ่านจาก `document.readyState` */
  isDocumentReady: () => boolean;
  onWindowLoad: (fn: () => void) => void;
  offWindowLoad: (fn: () => void) => void;
  /** บันทึกเหตุการณ์ (ของจริงคือ `console`) */
  log?: (level: "info" | "warn", message: string, detail?: unknown) => void;
}

/**
 * ผูกทุกอย่างเข้ากับสภาพแวดล้อมที่ให้มา แล้วคืนฟังก์ชันถอดสาย
 *
 * 🔴 หัวใจของ R-01 อยู่ที่ `hadController`
 * ---------------------------------------------------------------------------
 * `controllerchange` ยิงสองสถานการณ์ที่ต่างกันโดยสิ้นเชิง:
 *
 *   1. **ยึดครั้งแรก** — ผู้เข้าชมใหม่ยังไม่มี SW ตัวไหนคุมเอกสารนี้ · `register()` ทำงาน
 *      แล้ว `sw.js` เรียก `self.clients.claim()` ตอน `activate` เข้ายึดหน้าที่เปิดอยู่
 *      **ไม่มีเวอร์ชันไหนเพี้ยน ไม่มี chunk เก่าให้ต้องซิงก์ ➔ ห้ามโหลดใหม่**
 *
 *   2. **เปลี่ยนตัวคุม** — มี SW คุมอยู่แล้วและมีตัวใหม่เข้ามาแทน (เช่นถูกส่ง SKIP_WAITING)
 *      เอกสารที่เปิดค้างอ้างอิงชื่อ chunk เก่าที่หายไปแล้ว ➔ **ต้องโหลดใหม่หนึ่งครั้ง**
 *
 * ของเดิมไม่แยกสองกรณีนี้ จึงโหลดใหม่ในกรณีที่ 1 ด้วย = ผู้ใช้ใหม่ · บอตค้นหา ·
 * และคนที่กดมาจากลิงก์แชร์ **ทุกคน** โหลดทั้งหน้าสองรอบ
 * (ผู้ใช้ที่กลับมาซ้ำไม่โดนเพราะมีตัวคุมอยู่แล้ว · `curl` มองไม่เห็นเพราะเป็นฝั่งไคลเอนต์ล้วน)
 */
export function setupServiceWorker(env: SwEnv): () => void {
  const { container, reload, isDocumentReady, onWindowLoad, offWindowLoad } = env;
  const log = env.log ?? (() => {});

  // ⚠️ ต้องอ่าน **ก่อน** ผูก listener เสมอ — อ่านทีหลังจะได้ตัวคุมตัวใหม่ที่เพิ่งยึดไปแล้ว
  const hadController = Boolean(container.controller);

  let reloading = false;
  const onControllerChange = () => {
    if (!hadController) return; // ยึดครั้งแรก — ไม่ใช่การเปลี่ยนเวอร์ชัน
    if (reloading) return;
    reloading = true;
    reload();
  };
  container.addEventListener("controllerchange", onControllerChange);

  const registerSW = () => {
    void container
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state !== "installed") return;
            log(
              "info",
              container.controller
                ? "SeerTarot: New content available; please refresh."
                : "SeerTarot: Content cached for offline use.",
            );
          };
        };
      })
      .catch((error) => {
        log("warn", "SeerTarot: Service Worker registration failed:", error);
      });
  };

  if (isDocumentReady()) {
    registerSW();
  } else {
    onWindowLoad(registerSW);
  }

  return () => {
    container.removeEventListener("controllerchange", onControllerChange);
    offWindowLoad(registerSW);
  };
}

/** true เมื่อหน้านี้อยู่บน HTTPS หรือเครื่องตัวเอง — นอกจากนี้ห้ามลงทะเบียน SW */
export function isServiceWorkerAllowed(protocol: string, hostname: string): boolean {
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "[::1]" ||
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(hostname);
  return protocol === "https:" || isLocalhost;
}
