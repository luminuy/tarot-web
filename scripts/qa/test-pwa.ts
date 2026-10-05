import { readFileSync, existsSync } from "node:fs";
import manifest from "@/app/manifest";
import { b64urlDecode, b64urlEncode, encryptPayload, isAllowedPushEndpoint, vapidJwt } from "@/lib/push/webpush";
import { encyclopediaPaths, goodNetworkForPrefetch, shouldOfferInstall } from "@/lib/pwa/pwa-client";
import { claimMorning, deleteAllPushSubscriptions, listMorningDue, listUserSubscriptions, recordPushResult, upsertPushSubscription } from "@/lib/push/push.repo";
import { registeredUserDataKeys } from "@/lib/privacy/user-data";
import { upsertUserOnLogin } from "@/lib/users/users.repo";

/**
 * QA — PWA (REFLECTION_JOURNAL_PLAN 1.10): Web Push RFC 8291/8292 · ตรรกะชวนติดตั้ง · สารานุกรมออฟไลน์ · manifest · SW
 * รันด้วย: npx tsx scripts/qa/test-pwa.ts
 * ⚠️ ยังไม่ลงทะเบียนใน `repo:verify` — เพิ่มตอนเปิด PR พร้อมแก้เลขจำนวนด่านในเอกสาร
 */
let pass = 0;
let fail = 0;
const check = (label: string, ok: boolean) => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`❌ ${label}`);
  }
};

async function main() {
  // ── RFC 8291 ภาคผนวก A — ทุกไบต์ ──
  const body = await encryptPayload(
    new TextEncoder().encode("When I grow up, I want to be a watermelon"),
    b64urlDecode("BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"),
    b64urlDecode("BTBZMqHH6r4Tts7J_aSIgg"),
    {
      asPrivate: b64urlDecode("yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw"),
      asPublic: b64urlDecode("BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8"),
      salt: b64urlDecode("DGv6ra1nlYgDCS1FRnbzlw"),
    },
  );
  check(
    "เข้ารหัสตรงเวกเตอร์ RFC 8291 ทุกไบต์",
    b64urlEncode(body) ===
      "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
  );
  const rnd = await encryptPayload(new TextEncoder().encode("x"), b64urlDecode("BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"), b64urlDecode("BTBZMqHH6r4Tts7J_aSIgg"));
  const rnd2 = await encryptPayload(new TextEncoder().encode("x"), b64urlDecode("BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"), b64urlDecode("BTBZMqHH6r4Tts7J_aSIgg"));
  check("ใช้งานจริงสุ่มกุญแจ/salt ใหม่ทุกข้อความ", b64urlEncode(rnd) !== b64urlEncode(rnd2));
  let badPoint = false;
  try {
    await encryptPayload(new Uint8Array([1]), new Uint8Array(65).fill(4), b64urlDecode("BTBZMqHH6r4Tts7J_aSIgg"));
  } catch {
    badPoint = true;
  }
  check("ปฏิเสธจุดที่ไม่อยู่บนเส้นโค้ง P-256 (RFC 8291 §7)", badPoint);

  // ── VAPID JWT ลงนาม ES256 แล้วตรวจกลับด้วยกุญแจสาธารณะได้ ──
  const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const d = (await crypto.subtle.exportKey("jwk", pair.privateKey)).d!;
  const jwt = await vapidJwt("https://fcm.googleapis.com", "mailto:test@example.com", d, b64urlEncode(pubRaw));
  const [h, p, s] = jwt.split(".");
  const verified = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pair.publicKey, b64urlDecode(s), new TextEncoder().encode(`${h}.${p}`));
  const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(p)));
  check("VAPID JWT ตรวจลายเซ็นผ่าน", verified);
  check("VAPID aud/sub/exp ถูกต้อง (≤ 24 ชม.)", claims.aud === "https://fcm.googleapis.com" && claims.sub === "mailto:test@example.com" && claims.exp - Date.now() / 1000 <= 24 * 3600);

  // ── กัน SSRF ──
  check("endpoint FCM ผ่าน", isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"));
  check("endpoint Apple ผ่าน", isAllowedPushEndpoint("https://web.push.apple.com/abc"));
  check("endpoint Mozilla ผ่าน", isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"));
  check("endpoint แปลกปลอมไม่ผ่าน", !isAllowedPushEndpoint("https://evil.example.com/x") && !isAllowedPushEndpoint("http://fcm.googleapis.com/x") && !isAllowedPushEndpoint("https://fcm.googleapis.com.evil.com/x"));

  // ── ชวนติดตั้งเฉพาะหลังเห็นคุณค่า ──
  const now = Date.now();
  check("เข้าเว็บครั้งแรกไม่ชวน", !shouldOfferInstall({ ritualDays: [], readingsSaved: 0 }, { standalone: false, now }));
  check("พิธีเช้าครบ 2 วันชวน", shouldOfferInstall({ ritualDays: ["2026-10-01", "2026-10-02"], readingsSaved: 0 }, { standalone: false, now }));
  check("บันทึกคำอ่านครั้งที่ 2 ชวน", shouldOfferInstall({ ritualDays: [], readingsSaved: 2 }, { standalone: false, now }));
  check("ปิดไปไม่ถึง 30 วันไม่ชวนซ้ำ", !shouldOfferInstall({ ritualDays: [], readingsSaved: 5, dismissedAt: now - 5 * 86_400_000 }, { standalone: false, now }));
  check("ปิดเกิน 30 วันชวนได้อีก", shouldOfferInstall({ ritualDays: [], readingsSaved: 5, dismissedAt: now - 31 * 86_400_000 }, { standalone: false, now }));
  check("ติดตั้งแล้วไม่ชวน", !shouldOfferInstall({ ritualDays: [], readingsSaved: 5 }, { standalone: true, now }));

  // ── สารานุกรมออฟไลน์ ──
  check("ไม่โหลดล่วงหน้าเมื่อประหยัดดาต้า/เน็ตมือถือ/2g", !goodNetworkForPrefetch({ saveData: true }) && !goodNetworkForPrefetch({ type: "cellular" }) && !goodNetworkForPrefetch({ effectiveType: "slow-2g" }));
  check("Wi-Fi/4g โหลดได้", goodNetworkForPrefetch({ effectiveType: "4g", type: "wifi" }) && goodNetworkForPrefetch(undefined));
  const th = encyclopediaPaths(false);
  const en = encyclopediaPaths(true);
  check("หน้าไพ่ครบ 78 + หน้าหลัก 3", th.length === 81 && en.length === 81 && en.every((x) => x.startsWith("/en/")));
  const sw = readFileSync("public/sw.js", "utf8");
  const reSrc = /\/\^(.*?)\$\/\.test\(path\)/.exec(sw)?.[1];
  const re = reSrc ? new RegExp(`^${reSrc.replace(/\\\\/g, "\\")}$`) : null;
  check("SW รับเส้นทางสารานุกรมทุกหน้า", !!re && th.every((x) => re.test(x)) && en.every((x) => re.test(x)));
  check("SW ไม่เก็บ API/บัญชี/หน้าส่วนตัว", !!re && !re.test("/api/journal") && !re.test("/account") && !re.test("/reset-password"));
  check("SW มี push + notificationclick", /addEventListener\("push"/.test(sw) && /addEventListener\("notificationclick"/.test(sw));
  check("SW กันลิงก์แจ้งเตือนพาออกนอกเว็บ", /msg\.url\.startsWith\("\/"\) && !msg\.url\.startsWith\("\/\/"\)/.test(sw));
  check("SW ยัง network-only กับ /api/", /url\.pathname\.startsWith\("\/api\/"\)/.test(sw));

  // ── manifest ──
  const m = manifest();
  check("manifest มี id/scope/shortcuts 3 ปุ่ม", m.id === "/" && m.scope === "/" && m.shortcuts?.length === 3);
  check("ทางลัดไม่มีอิโมจิ", (m.shortcuts ?? []).every((s) => !/\p{Extended_Pictographic}/u.test(`${s.name}${s.short_name ?? ""}${s.description ?? ""}`)));
  check("ไอคอนทางลัดมีไฟล์จริง", (m.shortcuts ?? []).every((s) => (s.icons ?? []).every((i) => existsSync(`public${i.src}`))));

  // ── subscription (SQLite จริง) ──
  const u = `test_push_${Date.now()}`;
  await upsertUserOnLogin({ id: u, provider: "google", email: `${u}@example.com`, name: "ทดสอบแจ้งเตือน" });
  const ep = `https://fcm.googleapis.com/fcm/send/${u}`;
  await upsertPushSubscription(u, { endpoint: ep, p256dh: "p".repeat(87), auth: "a".repeat(22) }, { lang: "th", morningHour: 7, checkins: true });
  await upsertPushSubscription(u, { endpoint: ep, p256dh: "p".repeat(87), auth: "a".repeat(22) }, { lang: "en", morningHour: 8, checkins: false });
  const subs = await listUserSubscriptions(u);
  check("endpoint เดิม = อัปเดต ไม่ซ้ำ", subs.length === 1 && subs[0].morningHour === 8 && subs[0].lang === "en" && !subs[0].checkins);
  const due = await listMorningDue(8, "2026-10-05", 1000);
  const mine = due.find((x) => x.endpoint === ep);
  check("ถึงชั่วโมงที่ตั้ง = อยู่ในคิว", !!mine);
  check("จองส่งได้ครั้งเดียวต่อวัน", (await claimMorning(mine!.id, "2026-10-05")) && !(await claimMorning(mine!.id, "2026-10-05")));
  check("ส่งแล้ววันนี้ไม่โผล่ซ้ำ", !(await listMorningDue(8, "2026-10-05", 1000)).some((x) => x.endpoint === ep));
  await recordPushResult(mine!.id, { ok: false, gone: true });
  check("410/404 = ลบ subscription ทิ้ง", (await listUserSubscriptions(u)).length === 0);
  check("ทะเบียน PDPA มีการแจ้งเตือน", registeredUserDataKeys().includes("pushReminders"));
  await deleteAllPushSubscriptions(u);

  // ── cron fail-closed + เนื้อหาไม่มีข้อมูลส่วนตัว ──
  const cron = readFileSync("src/app/api/cron/push-reminders/route.ts", "utf8");
  check("cron แจ้งเตือน fail-closed", /if \(!secret \|\| !presented/.test(cron));
  const checkin = readFileSync("src/app/api/cron/checkins/route.ts", "utf8");
  check("แจ้งเตือนนัดเช็กใช้ชื่อเรื่อง ไม่ใช้คำถาม", /thread\?\.title/.test(checkin) && !/\.question/.test(checkin));

  console.log(`\n✦ pwa: ผ่าน ${pass} · ไม่ผ่าน ${fail}`);
  if (fail > 0) process.exit(1);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
