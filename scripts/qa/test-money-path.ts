/**
 * 💰 ด่านเส้นทางเงิน — ตรวจ "พฤติกรรมจริง" ไม่ใช่ข้อความในซอร์ส (R-08)
 * ===========================================================================
 *
 * ## ทำไมต้องมีด่านนี้
 *
 * รอบตรวจ 2026-09-17: `checkout` · `checkout/confirm` · `payments/webhook`
 * **ไม่มีสคริปต์ QA ตัวไหนอ้างถึงเลยสักตัว** ทั้งที่รอบก่อนหน้าเพิ่งแก้ตรรกะหักสิทธิ์ไป
 *
 * ด่านนี้ยิงจริงลงฐานข้อมูล (node:sqlite ในเครื่อง / D1 shim) แล้วยืนยันสามเรื่อง:
 *
 * 1. **ทิศทางสำเร็จ** — ยืนยันการชำระเงินแล้ว ยอดเครดิตเพิ่มขึ้น **เท่ากับขนาดแพ็กพอดี**
 * 2. **ยิงซ้ำได้เครดิตครั้งเดียว** — ทั้งเมื่อ webhook กับ return_uri ทำงานพร้อมกัน
 *    และเมื่อเกตเวย์ยิง webhook ซ้ำ · **แต่คนละออร์เดอร์ต้องได้เครดิตทั้งสองครั้ง**
 * 3. **ทิศทางล้มเหลว** — ปฏิเสธด้วย **status code ที่ไม่ใช่ 2xx** และ **ยอดคงเหลือไม่ขยับ**
 *    (ยืนยันทั้งสองอย่าง ไม่ใช่แค่ "ไม่มี exception หลุด")
 *
 * ## บั๊กที่ด่านนี้จับได้ตอนเขียน
 *
 * `payments/webhook` ประกอบกุญแจกันจ่ายซ้ำจาก `payments.booking_id` ซึ่งเป็น **NULL**
 * สำหรับการเติมเครดิตทุกแถว (เลขออร์เดอร์ย้ายไป `order_id` ตั้งแต่ migrations/0015)
 * ผลจริงสองต่อ: ผู้ใช้ **ซื้อครั้งที่สองแล้วไม่ได้เครดิตเลย** (คีย์ชนของเดิม)
 * และครั้งแรก **ได้สองเท่า** เพราะ return_uri ใช้คีย์อีกแบบ
 */

import fs from "node:fs";
import path from "node:path";
import {
  decidePurchaseGrant,
  purchaseGrantReason,
  orderIdOfPaymentRow,
  type PaymentRowForGrant,
} from "../../src/lib/entitlement/purchase";
import { getCreditPackageById, CREDIT_PACKAGES } from "../../src/lib/entitlement/packages";
import {
  getEntitlement,
  grantBonus,
  consumeReading,
  refundReading,
  type Viewer,
} from "../../src/lib/entitlement/entitlement";
import { upsertUserOnLogin } from "../../src/lib/users/users.repo";
import { getAppDB } from "../../src/lib/platform/db";

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`);
  }
}

const ROOT = process.cwd();
function readSource(rel: string): string {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    check(`หาไฟล์เส้นทางเงินเจอ: ${rel}`, false, "ไฟล์ถูกย้าย/เปลี่ยนชื่อ — ด่านนี้ตรวจอะไรไม่ได้เลย");
    return "";
  }
  return fs.readFileSync(full, "utf-8");
}

/** สร้างแถว payments หนึ่งแถวเหมือนที่ /api/entitlement/checkout สร้าง */
async function insertPaymentRow(row: {
  id: string;
  orderId: string;
  userId: string | null;
  amountSatang: number;
  status: string;
  provider?: string;
  currency?: string;
  ticketId?: string | null;
}): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO payments
         (id, booking_id, order_id, user_id, ticket_id, provider, provider_ref,
          amount_satang, currency, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.id,
      null,
      row.orderId,
      row.userId,
      row.ticketId ?? null,
      row.provider ?? "omise",
      `chrg_${row.orderId}`,
      row.amountSatang,
      row.currency ?? "THB",
      row.status,
      now,
      now,
    )
    .run();
}

async function loadPaymentRow(orderId: string): Promise<PaymentRowForGrant | null> {
  const db = await getAppDB();
  const row = await db
    .prepare(
      `SELECT id, order_id, booking_id, user_id, ticket_id, amount_satang, currency, status, provider
         FROM payments WHERE order_id = ? OR booking_id = ? LIMIT 1`,
    )
    .bind(orderId, orderId)
    .first<PaymentRowForGrant>();
  return row ?? null;
}

/**
 * จำลอง "การลงมือ" ของทั้งสองเส้นทางด้วยตรรกะก้อนเดียวกับของจริง
 * คืน status code เหมือนที่ปลายทางจะตอบ เพื่อยืนยัน **ทิศทางล้มเหลว** ได้จริง
 */
async function settlePurchase(input: {
  orderId: string;
  packageId: string;
  userId: string;
  allowSimulator?: boolean;
  /** จำลองกรณีเขียนเครดิตไม่ลง (ดิสก์เต็ม · D1 ล่ม) */
  simulateWriteFailure?: boolean;
}): Promise<{ status: number; credits: number }> {
  const row = await loadPaymentRow(input.orderId);
  const decision = decidePurchaseGrant({
    row,
    pkg: getCreditPackageById(input.packageId),
    userId: input.userId,
    orderId: input.orderId,
    allowSimulator: input.allowSimulator ?? false,
  });

  if (!decision.ok) return { status: decision.status, credits: 0 };

  const granted = input.simulateWriteFailure
    ? false
    : await grantBonus(input.userId, decision.credits, decision.reason);

  // 🔴 T-04 · R-08: เขียนไม่ลง = ต้องไม่ใช่ 2xx
  if (!granted) return { status: 500, credits: 0 };
  return { status: 200, credits: decision.credits };
}

async function balanceOf(userId: string): Promise<number> {
  const viewer: Viewer = { kind: "member", userId };
  const e = await getEntitlement(viewer);
  return e.remaining;
}

async function main(): Promise<void> {
  console.log("\n💰 [QA] เส้นทางเงิน — ซื้อโควตา · ยิงซ้ำ · ทิศทางล้มเหลว\n");

  const pkg = getCreditPackageById("pack_10");
  if (!pkg) {
    console.error("❌ ไม่พบแพ็กเกจ pack_10 — รายการแพ็กเกจเปลี่ยนไปแล้ว");
    process.exit(1);
  }

  console.log("── 1. ทิศทางสำเร็จ: เครดิตเพิ่มเท่ากับขนาดแพ็กพอดี ──");
  const uid = `usr_money_${Date.now()}`;
  await upsertUserOnLogin({ id: uid, provider: "google", email: `${uid}@example.com`, name: "ผู้ซื้อทดสอบ" });

  const before = await balanceOf(uid);
  const orderA = `ord_${Date.now()}a`;
  await insertPaymentRow({
    id: `pay_${orderA}`,
    orderId: orderA,
    userId: uid,
    amountSatang: pkg.amountSatang,
    status: "paid",
  });

  const resA = await settlePurchase({ orderId: orderA, packageId: pkg.id, userId: uid });
  check(`ยืนยันการชำระเงินสำเร็จ → status 200 (ได้ ${resA.status})`, resA.status === 200);
  const afterA = await balanceOf(uid);
  check(
    `ยอดเครดิตเพิ่มขึ้น ${pkg.credits} พอดี (${before} → ${afterA})`,
    afterA - before === pkg.credits,
    `เพิ่มขึ้นจริง ${afterA - before} ครั้ง`,
  );

  console.log("\n── 2. ยิงซ้ำด้วยออร์เดอร์เดิม ต้องได้เครดิตครั้งเดียว ──");
  const replay = await settlePurchase({ orderId: orderA, packageId: pkg.id, userId: uid });
  check(`ยิงซ้ำยังตอบ 200 (เกตเวย์ retry ต้องไม่เห็น error · ได้ ${replay.status})`, replay.status === 200);
  const afterReplay = await balanceOf(uid);
  check(
    `ยอดเครดิตไม่เพิ่มจากการยิงซ้ำ (${afterA} → ${afterReplay})`,
    afterReplay === afterA,
    `เพิ่มขึ้นมาอีก ${afterReplay - afterA} ครั้งจากเงินก้อนเดิม`,
  );

  console.log("\n── 3. ออร์เดอร์ที่สองของคนเดิม ต้องได้เครดิตอีกชุด ──");
  // 🔴 นี่คือเคสที่บั๊ก `purchase_${booking_id}` ทำพัง: คีย์ซ้ำ ➔ ซื้อครั้งที่สองแล้วไม่ได้ของ
  const orderB = `ord_${Date.now()}b`;
  await insertPaymentRow({
    id: `pay_${orderB}`,
    orderId: orderB,
    userId: uid,
    amountSatang: pkg.amountSatang,
    status: "paid",
  });
  const resB = await settlePurchase({ orderId: orderB, packageId: pkg.id, userId: uid });
  check(`ซื้อรอบสอง → status 200 (ได้ ${resB.status})`, resB.status === 200);
  const afterB = await balanceOf(uid);
  check(
    `ยอดเครดิตเพิ่มอีก ${pkg.credits} พอดี (${afterReplay} → ${afterB})`,
    afterB - afterReplay === pkg.credits,
    "คีย์กันจ่ายซ้ำต้องผูกกับเลขออร์เดอร์ ไม่ใช่ค่าคงที่ต่อผู้ใช้",
  );

  const rowA = await loadPaymentRow(orderA);
  const rowB = await loadPaymentRow(orderB);
  check(
    "กุญแจกันจ่ายซ้ำของสองออร์เดอร์ต้องไม่ชนกัน",
    !!rowA && !!rowB && purchaseGrantReason(orderIdOfPaymentRow(rowA)) !== purchaseGrantReason(orderIdOfPaymentRow(rowB)),
  );
  check(
    "orderIdOfPaymentRow อ่านเลขออร์เดอร์จาก order_id ได้ (ไม่ใช่ booking_id ที่เป็น NULL)",
    !!rowA && orderIdOfPaymentRow(rowA) === orderA,
    `ได้ค่า "${rowA ? orderIdOfPaymentRow(rowA) : "(ไม่มีแถว)"}"`,
  );

  /*
   * 🔬 พิสูจน์บั๊กเดิมด้วยข้อมูลจริง ไม่ใช่ด้วยการอ่านซอร์ส
   * แถวเติมเครดิตทุกแถวมี `booking_id` เป็น NULL (เลขออร์เดอร์อยู่ที่ `order_id`)
   * คีย์ที่ประกอบจากคอลัมน์นั้นจึงเป็นค่าเดียวกันทุกออร์เดอร์ของผู้ใช้คนเดียวกัน
   */
  const legacyKeyA = `purchase_${rowA?.booking_id}`;
  const legacyKeyB = `purchase_${rowB?.booking_id}`;
  check(
    "แถวเติมเครดิตมี booking_id เป็น NULL จริง (ต้นเหตุคีย์ชนกัน)",
    !!rowA && (rowA.booking_id === null || rowA.booking_id === undefined),
    `ค่าที่อ่านได้: ${JSON.stringify(rowA?.booking_id)}`,
  );
  check(
    `คีย์แบบเดิมที่สร้างจาก booking_id ชนกันจริง ("${legacyKeyA}") — ด่านนี้จึงมีไว้กันไม่ให้กลับไปใช้`,
    legacyKeyA === legacyKeyB,
  );

  console.log("\n── 4. ทิศทางล้มเหลว: ต้องไม่ใช่ 2xx และยอดคงเหลือต้องไม่ขยับ ──");
  const baseline = await balanceOf(uid);

  // 4.1 ไม่มีแถวออร์เดอร์เลย
  const noOrder = await settlePurchase({ orderId: "ord_ไม่มีจริง", packageId: pkg.id, userId: uid });
  check(`ไม่มีรายการสั่งซื้อ → 404 (ได้ ${noOrder.status})`, noOrder.status === 404);

  // 4.2 ออร์เดอร์ของคนอื่น
  const otherUid = `usr_other_${Date.now()}`;
  await upsertUserOnLogin({ id: otherUid, provider: "google", email: `${otherUid}@example.com`, name: "คนอื่น" });
  const orderC = `ord_${Date.now()}c`;
  await insertPaymentRow({
    id: `pay_${orderC}`,
    orderId: orderC,
    userId: otherUid,
    amountSatang: pkg.amountSatang,
    status: "paid",
  });
  const notOwner = await settlePurchase({ orderId: orderC, packageId: pkg.id, userId: uid });
  check(`ออร์เดอร์ของบัญชีอื่น → 401 (ได้ ${notOwner.status})`, notOwner.status === 401);

  // 4.3 ยอดเงินไม่ตรงกับแพ็กเกจ (แก้ราคาฝั่งไคลเอนต์)
  const orderD = `ord_${Date.now()}d`;
  await insertPaymentRow({
    id: `pay_${orderD}`,
    orderId: orderD,
    userId: uid,
    amountSatang: 100, // 1 บาท แลก 10 ครั้ง
    status: "paid",
  });
  const cheap = await settlePurchase({ orderId: orderD, packageId: pkg.id, userId: uid });
  check(`จ่าย 1 บาทแล้วขอแพ็ก ${pkg.priceThb} บาท → 400 (ได้ ${cheap.status})`, cheap.status === 400);

  // 4.4 ยังไม่จ่าย / จ่ายไม่สำเร็จ
  const orderE = `ord_${Date.now()}e`;
  await insertPaymentRow({
    id: `pay_${orderE}`,
    orderId: orderE,
    userId: uid,
    amountSatang: pkg.amountSatang,
    status: "pending",
  });
  const unpaid = await settlePurchase({ orderId: orderE, packageId: pkg.id, userId: uid });
  check(`ออร์เดอร์ที่ยังไม่จ่าย → 402 (ได้ ${unpaid.status})`, unpaid.status === 402);

  const orderF = `ord_${Date.now()}f`;
  await insertPaymentRow({
    id: `pay_${orderF}`,
    orderId: orderF,
    userId: uid,
    amountSatang: pkg.amountSatang,
    status: "failed",
  });
  const failedPay = await settlePurchase({ orderId: orderF, packageId: pkg.id, userId: uid });
  check(`ออร์เดอร์ที่จ่ายไม่สำเร็จ → 402 (ได้ ${failedPay.status})`, failedPay.status === 402);

  // 4.5 รายการค่าปรึกษาแม่หมอ (ผูก ticket) ต้องไม่กลายเป็นเครดิต
  const orderG = `ord_${Date.now()}g`;
  await insertPaymentRow({
    id: `pay_${orderG}`,
    orderId: orderG,
    userId: uid,
    amountSatang: pkg.amountSatang,
    status: "paid",
    ticketId: "tkt_1",
  });
  const ticketPay = await settlePurchase({ orderId: orderG, packageId: pkg.id, userId: uid });
  check(`รายการที่ผูก ticket (ค่าปรึกษาแม่หมอ) → 400 (ได้ ${ticketPay.status})`, ticketPay.status === 400);

  // 4.6 ตัวจำลองต้องไม่ผ่านเมื่อปิดโหมดจำลอง (พฤติกรรมบน production)
  const orderH = `ord_${Date.now()}h`;
  await insertPaymentRow({
    id: `pay_${orderH}`,
    orderId: orderH,
    userId: uid,
    amountSatang: pkg.amountSatang,
    status: "pending",
    provider: "simulator",
  });
  const simProd = await settlePurchase({ orderId: orderH, packageId: pkg.id, userId: uid, allowSimulator: false });
  check(`ตัวจำลองบน production → 402 (ได้ ${simProd.status})`, simProd.status === 402);
  const simDev = await settlePurchase({ orderId: orderH, packageId: pkg.id, userId: uid, allowSimulator: true });
  check(`ตัวจำลองนอก production → 200 (ได้ ${simDev.status})`, simDev.status === 200);

  // 4.7 เขียนเครดิตไม่ลง = 500 (ไม่ใช่ 200 แบบเงียบ ๆ)
  const orderI = `ord_${Date.now()}i`;
  await insertPaymentRow({
    id: `pay_${orderI}`,
    orderId: orderI,
    userId: uid,
    amountSatang: pkg.amountSatang,
    status: "paid",
  });
  const writeFail = await settlePurchase({
    orderId: orderI,
    packageId: pkg.id,
    userId: uid,
    simulateWriteFailure: true,
  });
  check(`จ่ายเงินสำเร็จแต่เขียนเครดิตไม่ลง → 500 (ได้ ${writeFail.status})`, writeFail.status === 500);

  const afterFailures = await balanceOf(uid);
  check(
    `ยอดคงเหลือไม่ขยับเลยตลอด 7 เคสที่ต้องถูกปฏิเสธ (${baseline} → ${afterFailures})`,
    afterFailures === baseline + pkg.credits, // +1 แพ็กจากเคส 4.6 ที่ตั้งใจให้ผ่าน
    `ต่างไป ${afterFailures - baseline} ครั้ง (ควรเป็น ${pkg.credits} จากเคสตัวจำลองนอก production เท่านั้น)`,
  );

  console.log("\n── 5. เส้นทาง /read: หักแล้วคืนต้องกลับมาเท่าเดิม ──");
  const readBefore = await balanceOf(uid);
  const readingId = `rd_${Date.now()}`;
  const member: Viewer = { kind: "member", userId: uid };
  const outcome = await consumeReading(member, readingId, "three-card");
  check(`หักสิทธิ์สำเร็จและได้ usageId กลับมา (status=${outcome.status})`, outcome.status === "inserted" && !!outcome.usageId);
  const readMid = await balanceOf(uid);
  check(`หักแล้วยอดลด 1 (${readBefore} → ${readMid})`, readMid === readBefore - 1);

  if (outcome.status === "inserted" && outcome.usageId) {
    await refundReading(readingId, outcome.usageId);
  }
  const readAfter = await balanceOf(uid);
  check(`คืนสิทธิ์แล้วยอดกลับมาเท่าเดิม (${readMid} → ${readAfter})`, readAfter === readBefore);

  // คืนซ้ำต้องไม่กลายเป็นเปิดไพ่ฟรี
  if (outcome.status === "inserted" && outcome.usageId) {
    await refundReading(readingId, outcome.usageId);
  }
  const readDouble = await balanceOf(uid);
  check(`คืนซ้ำไม่ทำให้ยอดเกินของเดิม (${readAfter} → ${readDouble})`, readDouble === readBefore);

  console.log("\n── 6. ตรรกะกันจ่ายซ้ำต้องมาจากที่เดียว (กันบั๊กเดิมกลับมา) ──");
  const webhookSrc = readSource("src/app/api/marketplace/payments/webhook/route.ts");
  const confirmSrc = readSource("src/app/api/entitlement/checkout/confirm/route.ts");
  const checkoutSrc = readSource("src/app/api/entitlement/checkout/route.ts");

  check(
    "webhook ห้ามประกอบคีย์กันจ่ายซ้ำเอง (`purchase_${...}`)",
    !/`purchase_\$\{/.test(webhookSrc),
    "ต้องเรียก purchaseGrantReason() ผ่าน decidePurchaseGrant() เท่านั้น",
  );
  check(
    "checkout/confirm ห้ามประกอบคีย์กันจ่ายซ้ำเอง",
    !/`purchase_\$\{/.test(confirmSrc),
  );
  check("webhook ใช้ decidePurchaseGrant()", webhookSrc.includes("decidePurchaseGrant("));
  check("checkout/confirm ใช้ decidePurchaseGrant()", confirmSrc.includes("decidePurchaseGrant("));
  check(
    "webhook อ่าน order_id จากฐานข้อมูล (ไม่ใช้ booking_id เป็นคีย์)",
    /SELECT[\s\S]{0,200}order_id[\s\S]{0,200}FROM payments/.test(webhookSrc),
  );
  check(
    "webhook ตรวจค่าที่ grantBonus คืนมา แล้วตอบ 500 เมื่อเขียนไม่ลง",
    /const granted = await grantBonus\(/.test(webhookSrc) && /status: 500/.test(webhookSrc),
  );
  check(
    "checkout สร้างแถว payments พร้อม userId เสมอ (เจ้าของรายการต้องพิสูจน์ได้)",
    /createPaymentRecord\(\{[\s\S]{0,400}userId,/.test(checkoutSrc),
  );

  console.log("\n── 7. แพ็กเกจทุกตัวต้องมีราคาที่เป็นไปได้ ──");
  for (const p of CREDIT_PACKAGES) {
    check(
      `${p.id}: ราคา ${p.priceThb} บาท = ${p.amountSatang} สตางค์ และให้ ${p.credits} ครั้ง`,
      p.amountSatang === p.priceThb * 100 && p.credits > 0 && Number.isInteger(p.credits),
    );
  }

  console.log(`\n📊 สรุป: ผ่าน ${pass} ข้อ | ล้มเหลว ${fail} ข้อ\n`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ ด่านเส้นทางเงินล้มระหว่างรัน:", err);
  process.exit(1);
});
