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
  ): Promise<SwRegistrationLike>;
}

/** worker ที่รอขึ้นทำงาน — ใช้แค่ state กับ postMessage */
export interface SwWorkerLike {
  state: string;
  onstatechange: (() => void) | null;
  postMessage?: (message: unknown) => void;
}

export interface SwRegistrationLike {
  installing: SwWorkerLike | null;
  waiting?: SwWorkerLike | null;
  onupdatefound: (() => void) | null;
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
  /**
   * A4-06: ผูกตัวจับ "ผู้ใช้กำลังออกจากหน้านี้" (ของจริงคือ `pagehide`) — คืนฟังก์ชันถอดสาย
   * ไม่ส่งมา = ไม่สั่ง SKIP_WAITING เลย (พฤติกรรมเดิม)
   */
  onPageHide?: (fn: () => void) => () => void;
  /**
   * ธงข้ามหน้า (ของจริงคือ sessionStorage) ว่าหน้าก่อนเพิ่งสั่ง SKIP_WAITING ไป
   * หน้าใหม่ที่เพิ่งโหลดจากเครือข่าย (network-first) สดอยู่แล้ว เจอ controllerchange ไม่ต้องรีโหลดซ้ำ
   */
  skipFlag?: { mark: () => void; consumeRecent: () => boolean };
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
    // หน้านี้เพิ่งโหลดสด ๆ หลังหน้าก่อนสั่งตัวใหม่ขึ้นทำงาน — ไม่มี chunk เก่าให้ซิงก์
    if (env.skipFlag?.consumeRecent()) return;
    if (reloading) return;
    reloading = true;
    reload();
  };
  container.addEventListener("controllerchange", onControllerChange);

  /*
   * A4-06: ตัวใหม่ค้าง waiting ตลอดถ้าไม่มีใครส่ง SKIP_WAITING — เพราะมันจะขึ้นทำงานได้ก็ต่อเมื่อ
   * ไม่มีแท็บไหนถูกตัวเก่าคุมอยู่ การรีโหลด/เปลี่ยนหน้าในแท็บเดียวไม่พอ
   * จังหวะที่ปลอดภัยคือ "ตอนผู้ใช้ออกจากหน้านี้" (pagehide) — ไม่รีโหลดหน้าที่เขากำลังใช้อยู่
   * และหน้าถัดไปโหลดจากเครือข่าย (network-first) จึงได้ของรุ่นใหม่อยู่แล้ว
   */
  let waitingWorker: SwWorkerLike | null = null;
  let detachPageHide: (() => void) | null = null;
  const armSkipWaiting = (worker: SwWorkerLike | null | undefined) => {
    if (!worker || !container.controller || !env.onPageHide || typeof worker.postMessage !== "function") return;
    waitingWorker = worker;
    if (detachPageHide) return;
    detachPageHide = env.onPageHide(() => {
      if (!waitingWorker?.postMessage) return;
      env.skipFlag?.mark();
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      waitingWorker = null;
    });
  };

  const registerSW = () => {
    void container
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        armSkipWaiting(registration.waiting);
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state !== "installed") return;
            armSkipWaiting(installingWorker);
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
    detachPageHide?.();
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

/** ธงข้ามหน้าบน sessionStorage — อายุ 30 วินาที กันธงค้างไปกดทับการรีโหลดที่จำเป็นในภายหลัง */
export function createSessionSkipFlag(storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null, key: string, now: () => number = Date.now) {
  return {
    mark: () => {
      try {
        storage?.setItem(key, String(now()));
      } catch {
        // โหมดส่วนตัว/ที่เก็บเต็ม — ไม่มีธงก็แค่รีโหลดเพิ่มหนึ่งครั้ง
      }
    },
    consumeRecent: () => {
      try {
        const raw = storage?.getItem(key);
        if (!raw) return false;
        storage?.removeItem(key);
        return now() - Number(raw) < 30_000;
      } catch {
        return false;
      }
    },
  };
}

/** sessionStorage ของเบราว์เซอร์ — เข้าถึงแล้ว throw ได้ (คุกกี้ถูกบล็อก/โหมดส่วนตัวบางเครื่อง) */
export function safeSessionStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}
