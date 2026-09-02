# 🔐 แผนปิดช่องว่าง Provably-Fair ที่เหลือ 2 จุด — handoff ให้ Gemini

> ต่อจาก `docs/AUDIT_2026-09-01.md` (P0-1/P0-2/P0-3) ที่แก้ไปแล้ว
> สถานะปัจจุบัน (ตรวจโค้ด `origin/main` `1e9e475`): แกนหลักปิดแล้ว — `serverSeed` ไม่รั่วก่อนจั่ว (`session-token.ts:65`), secret throw ใน prod (`:26-32`), token มี `exp` 2 ชม., `/shuffle` มี replay guard (`:72`) + origin + rate limit
> **เหลือ 2 จุด** ที่ทำให้เคลม "provably-fair ที่ตรวจสอบได้จริง" ไม่เต็มปาก — เอกสารนี้คือแผนปิดทั้งคู่

**ขอบเขต:** 4 PR · effort รวม ~M+ · ไม่แตะ security model เดิม เพิ่ม verifiability + ปิด integrity gap

---

## 🎯 ช่องว่างที่ต้องปิด

### GAP-1 · ไม่มี UI ให้ผู้ใช้ตรวจสอบเอง
`proof: { serverSeed, clientSeed, commitment }` ถูกส่งถึง browser แล้ว (`read/route.ts:110`) เก็บใน `page.tsx` state `proof` (`:112`) + sessionStorage + ส่งเข้า `StreamReader` (`page.tsx:838`) — **แต่ `StreamReader.tsx:44` แค่ destructure `proof` ไม่เคย render** `ProvablyFairBadge` เดิมถูกลบใน PR #45 (และของเดิมก็แค่โชว์ค่า ไม่ได้ verify จริง — ดู `git show c9910b0^:src/components/verification/ProvablyFairBadge.tsx`)

→ ต้องมี component ที่ **คำนวณซ้ำในเบราว์เซอร์จริง**: `sha256(serverSeed) === commitment` **และ** re-derive `drawCards()` เทียบกับไพ่ที่ได้

### GAP-2 · `/shuffle` failover ข้าม isolate ทำ provably-fair พังเงียบ ๆ
`/start` token ตอนนี้ไม่มี `serverSeed` (โดยตั้งใจ) → ถ้า in-memory store หายระหว่าง `/start`→`/shuffle` (Cloudflare cold isolate เกิดได้จริง) → `verifyReadingSessionToken` คืน record ที่ `serverSeed === undefined` → `shuffle/route.ts:101` เรียก `drawCards({ serverSeed: undefined, ... })` → `shuffle.ts:140` `sha256("undefined|" + clientSeed)` → ได้ deck ที่ **ไม่ตรงกับ `commitment`** โดยไม่มีที่ไหนเรียก `verifyCommitment()` ก่อนเสิร์ฟ · แถม attacker เดา deck ได้เพราะ seed = string `"undefined"` เป๊ะ

→ ต้อง (ก) persist record ลง KV ให้ `serverSeed` รอดข้าม isolate + (ข) `/shuffle` reject ถ้าไม่มี `serverSeed` จริง + (ค) `verifyCommitment` gate ก่อน `/read`

---

## 📦 PR 1 — `pf-verifier-core` : พอร์ต algorithm ให้รันในเบราว์เซอร์ได้ (effort M)

### 1.1 สร้าง `src/lib/tarot/verify-client.ts` (ใหม่)

พอร์ต `SeededStream` + `drawCards` + `verifyCommitment` จาก `src/lib/tarot/shuffle.ts` โดยเปลี่ยน `node:crypto` → **Web Crypto** (`crypto.subtle.digest`)

**ข้อกำหนดความถูกต้อง (สำคัญที่สุด):** output ต้อง **byte-identical** กับ `shuffle.ts` เดิม สำหรับ input เดียวกันทุกกรณี ไม่งั้น verifier จะรายงาน "ไม่ตรง" ทั้งที่ระบบทำถูก

**สเปก algorithm ที่ต้องเลียนแบบเป๊ะ** (อ่านจาก `shuffle.ts:36,63-157`):

| ส่วน | logic เดิม (`shuffle.ts`) | พอร์ตเป็น |
| :-- | :-- | :-- |
| `sha256(input)` | `createHash("sha256").update(input,"utf8").digest()` → 32-byte Buffer | `new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)))` |
| stream seed | `sha256(\`${serverSeed}\|${clientSeed}\`).toString("hex")` (64 hex chars) | เหมือนกัน (hex ของ 32 bytes) |
| `SeededStream.refill()` | `buffer = sha256(\`${seed}:${counter++}\`)` (32 bytes, offset=0) | เหมือนกัน |
| `nextUint32()` | `buffer.readUInt32BE(offset)`; `offset += 4`; refill เมื่อ `offset+4 > buffer.length` | `new DataView(buf.buffer).getUint32(offset, false)` (big-endian) |
| `nextInt(maxInclusive)` | `range = max+1`; `limit = floor(0x100000000/range)*range`; loop `nextUint32()` จน `< limit`; return `value % range` | เหมือนกันเป๊ะ (rejection sampling) |
| `nextFloat()` | `nextUint32() / 0x100000000` | เหมือนกัน |
| Fisher–Yates | `for i=deckSize-1; i>0; i--: j=nextInt(i); swap(deck[i],deck[j])` | เหมือนกัน |
| เลือกไพ่ | `pickedIndices ? pickedIndices.map(fi => deck[fi]) : deck.slice(0,count)` | เหมือนกัน |
| reversal | หลังเลือกครบ: ต่อ `map((cardIndex,order) => ({..., isReversed: stream.nextFloat() < 0.4}))` | `REVERSAL_RATE = 0.4` เหมือนกัน — **ลำดับสำคัญ**: reversal draw เกิด**หลัง**เลือก cardIndex ครบทุกใบ |

**ปัญหา async:** `crypto.subtle.digest` เป็น async แต่ `SeededStream` ดึง uint32 แบบ sync on-demand
**ทางแก้:** precompute pool — จำนวน uint32 ที่ใช้จริง ≈ `(deckSize-1) + count` + rejection (แทบไม่เกิดกับ range เล็ก) ≤ ~155 uint32 = ~620 bytes ≈ 20 sha256 blocks

```ts
// src/lib/tarot/verify-client.ts
const REVERSAL_RATE = 0.4;
const POOL_BLOCKS = 48; // 48 * 32B = 1536B ≈ 384 uint32 — เผื่อ rejection เยอะ ๆ

async function sha256Bytes(input: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(buf);
}
const toHex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

class ClientSeededStream {
  private view: DataView;
  private offset = 0;
  private readonly len: number;
  constructor(pool: Uint8Array) {
    this.view = new DataView(pool.buffer, pool.byteOffset, pool.byteLength);
    this.len = pool.byteLength;
  }
  private nextUint32(): number {
    if (this.offset + 4 > this.len) throw new Error("VERIFY_POOL_EXHAUSTED");
    const v = this.view.getUint32(this.offset, false); // big-endian = readUInt32BE
    this.offset += 4;
    return v;
  }
  nextInt(maxInclusive: number): number {
    if (maxInclusive <= 0) return 0;
    const range = maxInclusive + 1;
    const limit = Math.floor(0x1_0000_0000 / range) * range;
    let v: number;
    do { v = this.nextUint32(); } while (v >= limit);
    return v % range;
  }
  nextFloat(): number { return this.nextUint32() / 0x1_0000_0000; }
}

async function buildPool(streamSeedHex: string): Promise<Uint8Array> {
  const out = new Uint8Array(POOL_BLOCKS * 32);
  for (let i = 0; i < POOL_BLOCKS; i++) {
    out.set(await sha256Bytes(`${streamSeedHex}:${i}`), i * 32);
  }
  return out;
}

export interface ClientDrawnCard { order: number; cardIndex: number; isReversed: boolean; }

export async function drawCardsClient(params: {
  serverSeed: string; clientSeed: string; count: number;
  pickedIndices?: number[]; deckSize?: number;
}): Promise<ClientDrawnCard[]> {
  const { serverSeed, clientSeed, count, pickedIndices, deckSize = 78 } = params;
  const streamSeedHex = toHex(await sha256Bytes(`${serverSeed}|${clientSeed}`));
  const stream = new ClientSeededStream(await buildPool(streamSeedHex));

  const deck = Array.from({ length: deckSize }, (_, i) => i);
  for (let i = deckSize - 1; i > 0; i--) {
    const j = stream.nextInt(i);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const chosen = pickedIndices ? pickedIndices.map((fi) => deck[fi]) : deck.slice(0, count);
  return chosen.map((cardIndex, order) => ({
    order, cardIndex, isReversed: stream.nextFloat() < REVERSAL_RATE,
  }));
}

export async function verifyCommitmentClient(serverSeed: string, commitment: string): Promise<boolean> {
  const expected = toHex(await sha256Bytes(serverSeed));
  // constant-time-ish string compare (ค่า public อยู่แล้ว ไม่ critical)
  if (expected.length !== commitment.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ commitment.charCodeAt(i);
  return diff === 0;
}

export interface VerificationResult {
  commitmentOk: boolean;              // sha256(serverSeed) === commitment
  drawMatches: boolean;              // re-derived draw === displayed draw
  expectedDraw: ClientDrawnCard[];
  mismatchDetail?: string;
}

export async function verifyReading(params: {
  serverSeed: string; clientSeed: string; commitment: string;
  drawn: { order: number; cardIndex: number; isReversed: boolean }[];
  pickedIndices?: number[]; deckSize?: number;
}): Promise<VerificationResult> {
  const commitmentOk = await verifyCommitmentClient(params.serverSeed, params.commitment);
  const expectedDraw = await drawCardsClient({
    serverSeed: params.serverSeed, clientSeed: params.clientSeed,
    count: params.drawn.length, pickedIndices: params.pickedIndices, deckSize: params.deckSize,
  });
  const sortByOrder = <T extends { order: number }>(a: T[]) => [...a].sort((x, y) => x.order - y.order);
  const A = sortByOrder(expectedDraw), B = sortByOrder(params.drawn);
  let drawMatches = A.length === B.length;
  let mismatchDetail: string | undefined;
  for (let i = 0; i < A.length && drawMatches; i++) {
    if (A[i].cardIndex !== B[i].cardIndex || A[i].isReversed !== B[i].isReversed) {
      drawMatches = false;
      mismatchDetail = `ตำแหน่ง ${i + 1}: คาดว่า #${A[i].cardIndex}${A[i].isReversed ? " (กลับ)" : ""} แต่ได้ #${B[i].cardIndex}${B[i].isReversed ? " (กลับ)" : ""}`;
    }
  }
  return { commitmentOk, drawMatches, expectedDraw, mismatchDetail };
}
```

### 1.2 Parity test — `scripts/verify-shuffle-parity.ts` (ใหม่) + เพิ่มใน `repo:verify`

```ts
// เทียบ drawCardsClient (Web Crypto) กับ drawCards (node:crypto) ต้องตรงเป๊ะ 1000 เคส
import { drawCards } from "../src/lib/tarot/shuffle";
import { drawCardsClient } from "../src/lib/tarot/verify-client";
import { webcrypto } from "node:crypto";
// polyfill: globalThis.crypto = webcrypto (Node 20+ มีอยู่แล้ว)

// สุ่ม serverSeed/clientSeed/count/pickedIndices → assert JSON.stringify เท่ากัน
// รวมเคส: ไม่มี pickedIndices, มี pickedIndices ครบ spread ทุกขนาด (1,3,5,7,10), deckSize 78
```
- เพิ่ม `"verify:parity": "tsx scripts/verify-shuffle-parity.ts"` ใน `package.json`
- เพิ่มลง CHECKS ใน `scripts/github-auto.ts` (ให้ `repo:verify` รันด้วย) — **ถ้า parity แตก = block PR**

### Acceptance PR 1
- [ ] `npm run verify:parity` ผ่าน 1000/1000 เคส
- [ ] `verify-client.ts` ไม่ import `node:*` เลย (browser-safe) — ใช้ `crypto.subtle` + `TextEncoder`/`DataView`
- [ ] typecheck ผ่าน

---

## 📦 PR 2 — `pf-verifier-ui` : panel ตรวจสอบจริง + โชว์ commitment ก่อนสับ (effort M)

### 2.1 เพิ่ม `pickedIndices` เข้า proof (server-authoritative)

- `src/server/store.ts` — `ReadingRecord` เพิ่ม field `pickedIndices?: number[]`
- `src/app/api/reading/[id]/shuffle/route.ts:120` — `updateReading(id, { drawn, clientSeed, pickedIndices: pickedIndices ?? undefined })`
- `src/lib/security/session-token.ts:52` — เพิ่ม `pickedIndices: record.pickedIndices` ลง `compactPayload`
- `src/app/api/reading/[id]/read/route.ts:110,167` — `proof: { serverSeed, clientSeed, commitment, pickedIndices: record.pickedIndices, deckSize: 78 }`
- `src/components/reading/StreamReader.tsx:26-30` — ขยาย type `proof`

### 2.2 สร้าง `src/components/reading/ProvablyFairPanel.tsx` (ใหม่)

Props: `{ commitment: string; proof?: {serverSeed?; clientSeed?; commitment?; pickedIndices?; deckSize?}; drawn: {order;cardIndex;isReversed}[] }`

**3 สถานะ:**
1. **ก่อนเฉลย** (`proof.serverSeed` ยังไม่มี — ระหว่าง/ก่อนอ่านไพ่): โชว์แค่ `commitment` (SHA-256) + ข้อความ *"เซิร์ฟเวอร์ผูกมัดกับผลไพ่นี้แล้วตั้งแต่ก่อนคุณสับ — `serverSeed` จะถูกเฉลยหลังอ่านไพ่จบ ให้คุณตรวจย้อนหลังได้"*
2. **เฉลยแล้ว ยังไม่กดตรวจ**: โชว์ commitment / serverSeed / clientSeed (แต่ละอันมีปุ่มคัดลอก, `select-all`, `break-all` font-mono) + ปุ่ม **"ตรวจสอบความโปร่งใส"**
3. **ตรวจแล้ว**: เรียก `verifyReading()` จาก PR 1 → แสดง 2 เช็ค:
   - ✓/✗ **คำมั่นตรงกับ seed** — `sha256(serverSeed) === commitment` (`result.commitmentOk`)
   - ✓/✗ **ไพ่ที่ได้ตรงกับการคำนวณซ้ำ** — re-derive แล้ว cardIndex+isReversed ตรงทุกใบ (`result.drawMatches`); ถ้าไม่ตรงโชว์ `result.mismatchDetail`
   - ทั้งคู่ ✓ → แถบเขียว *"✦ การเปิดไพ่นี้พิสูจน์แล้วว่าโปร่งใส — ไพ่ถูกกำหนดจาก seed ที่ผูกมัดไว้ล่วงหน้า ไม่มีการเลือกทีหลัง"*
   - มีอันใด ✗ → แถบแดง + ปุ่ม "รายงานปัญหา" (mailto หรือ link ไป support) + log `recordEvents(["pf_verify_failed"])` ผ่าน endpoint เบา ๆ (optional)
   - ปุ่มรอง: *"ตรวจสอบด้วยตัวเองแบบอิสระ"* → เปิด `<details>` แสดง pseudo-code algorithm + ค่าทั้งหมดในรูปแบบ copy-paste ได้ (เพื่อให้ dev ภายนอกรัน verify เองได้โดยไม่เชื่อ JS ของเรา)

**a11y:** เป็น `<section aria-label="ตรวจสอบความโปร่งใส Provably-Fair">`; ปุ่มตรวจสอบมี `aria-busy` ระหว่างคำนวณ; ผลลัพธ์ใน `aria-live="polite"`; ผ่าน `<Modal>` primitive ถ้าทำเป็น dialog (FDN-4 ใน `UX_PERF_PLAN.md`) หรือ inline ใน summary tab ก็ได้
**motion:** ใช้ token จาก `src/lib/motion.ts` (`DUR`, `EASE`); reduced-motion ปลอดภัยอยู่แล้วผ่าน `MotionConfig`

### 2.3 Wire เข้า UI 2 จุด

**จุด A — summary tab ของ StreamReader** (`StreamReader.tsx:402` บล็อก `activeTab === "summary"`, ใกล้ ๆ `<OracleMantraCard>` / `<AccuracyRatingWidget>`):
```tsx
<ProvablyFairPanel commitment={proof?.commitment ?? ""} proof={proof} drawn={drawnCards.map(c => ({ order: c.order, cardIndex: c.cardIndex, isReversed: c.isReversed }))} />
```
> ตรวจว่า `DrawnSlotCard` มี `cardIndex` + `isReversed` + `order` — ถ้าไม่มีให้ thread ผ่าน `drawn` จาก `page.tsx` state แยก (page มี `drawnCards` ที่มาจาก `/shuffle` response `drawn`)

**จุด B — ShuffleRitual** (`ShuffleRitual.tsx` — รับ `commitment` prop อยู่แล้วแต่ไม่ render): เพิ่มบรรทัดเล็ก ๆ ใต้หัวข้อ ก่อนปุ่มสับ
```tsx
<p className="text-[10px] font-mono text-[#e5c07b]/70 break-all">
  คำมั่นความสุ่ม (SHA-256): {commitment.slice(0, 16)}…{commitment.slice(-8)}
  <button onClick={() => navigator.clipboard.writeText(commitment)} aria-label="คัดลอกคำมั่น">⧉</button>
</p>
```
> จุดนี้สำคัญ: commit-reveal จะ "พิสูจน์ได้" ก็ต่อเมื่อผู้ใช้เห็น commitment **ก่อน** สับไพ่ ตอนนี้ค่าถูกส่งมาแต่ไม่โชว์

### 2.4 footer copy (`page.tsx:1007`)
`"Provably-Fair Cryptographic Shuffle · …"` → เพิ่ม link/anchor ไปที่ panel หรือคำอธิบายสั้น ๆ; ให้แน่ใจว่าคำที่ใช้ไม่เกินจริง (ตอนนี้ ok — ไม่มี "100%" ใน user-facing แล้ว; ระวังอย่าเผลอเพิ่ม)

### Acceptance PR 2
- [ ] เปิดไพ่จบ → ไปแท็บ "สรุป" → เห็น panel → กด "ตรวจสอบ" → ทั้ง 2 เช็คขึ้น ✓ เขียว (ทดสอบด้วยเบราว์เซอร์จริง flow 5 ขั้น)
- [ ] ระหว่าง shuffle เห็น commitment (16+8 chars) + คัดลอกได้
- [ ] ทดสอบ negative: แก้ `proof.serverSeed` มั่ว ๆ ใน devtools → panel ต้องขึ้น ✗ แดง + mismatchDetail
- [ ] ก่อนเฉลย (ยัง stream อยู่) panel โชว์แค่ commitment ไม่ error
- [ ] keyboard + screen reader: ปุ่มตรวจสอบ focusable, ผล announce ผ่าน aria-live

---

## 📦 PR 3 — `pf-shuffle-integrity` : ปิด GAP-2 (effort M)

### 3.1 Persist reading record ลง KV (durable backstop ข้าม isolate)

ใช้ platform layer ที่มีแล้ว (`src/lib/platform/kv-store.ts`) — namespace `NEXT_INC_CACHE_KV`, prefix `app:`

- `src/lib/platform/kv-store.ts` — เพิ่ม `KEY.reading = (id: string) => \`app:reading:${id}\``
- สร้าง `src/server/reading-store.ts` (ใหม่, บาง ๆ) หรือเพิ่มใน `src/server/store.ts`:
  ```ts
  import { kvGetJSON, kvPutJSON, kvDelete, KEY } from "@/lib/platform/kv-store";
  const READING_TTL_SEC = 7200; // ตรงกับ token exp + memory TTL

  export async function persistReading(r: ReadingRecord): Promise<void> {
    try { await kvPutJSON(KEY.reading(r.id), r, { expirationTtl: READING_TTL_SEC }); } catch {}
  }
  export async function loadReadingFromKV(id: string): Promise<ReadingRecord | null> {
    try { return await kvGetJSON<ReadingRecord>(KEY.reading(id)); } catch { return null; }
  }
  ```
- `start/route.ts:95` — หลัง `saveReading(record)` → `await persistReading(record)` (หรือผ่าน `getWaitUntil()` ให้ไม่บล็อก response)
- `shuffle/route.ts:120` + `read/route.ts` (`done` handler ที่ set `result`) — เขียนทับ KV ด้วย record ที่อัปเดตแล้ว
- **ลำดับ failover ใหม่** ใน `shuffle` / `read`:
  1. `getReading(id)` (memory — hot path)
  2. ถ้าไม่มี → `await loadReadingFromKV(id)` (durable, serverSeed อยู่ครบ)
  3. ถ้ายังไม่มี → recover จาก token (เดิม) — แต่ตอนนี้ใช้เป็น last resort เท่านั้น

> **PDPA note (ISSUE-007):** record มี `question`/`intake`/`nickname` KV เก็บชั่วคราว TTL 2 ชม. = อายุ session พอดี ไม่ใช่ profile ถาวร · เขียนใน `docs/KNOWN_ISSUES.md` ว่า reading session ถูก persist ใน KV 2 ชม. เพื่อ edge resilience และถูกลบอัตโนมัติ · ถ้ากังวลกว่านั้น: แยกเก็บเฉพาะ field เชิง crypto (`id, serverSeed, commitment, clientSeed, drawn, pickedIndices, spreadId, createdAt`) ลง KV และคง PII ไว้แค่ใน token + memory

### 3.2 `/shuffle` — reject ถ้าไม่มี serverSeed จริง (guard สุดท้าย)

`shuffle/route.ts` หลังได้ `record` (ก่อนบรรทัด 66) เพิ่ม:
```ts
if (!record.serverSeed || record.serverSeed.length < 64) {
  return NextResponse.json(
    { error: "เซสชันหมดอายุระหว่างการสับไพ่ กรุณาเริ่มดูดวงใหม่", code: "SESSION_SEED_LOST" },
    { status: 410 },
  );
}
```
- `page.tsx` `handleShuffleComplete` — จับ `code: "SESSION_SEED_LOST"` / status 410 → `setErrorMsg("เซสชันหมดอายุ กรุณาเริ่มดูดวงใหม่")` + ปุ่มเริ่มใหม่ (ไม่ retry เงียบ ๆ)

### 3.3 `verifyCommitment` gate ก่อนเสิร์ฟผล

- `shuffle/route.ts` — หลัง `drawCards()` สำเร็จ (ก่อน `updateReading`):
  ```ts
  import { verifyCommitment } from "@/lib/tarot/shuffle";
  if (!verifyCommitment(record.serverSeed, record.commitment)) {
    // ไม่ควรเกิดถ้า record ถูกต้อง — เป็น integrity tripwire
    console.error("[PF] commitment mismatch on shuffle", { id });
    return NextResponse.json({ error: "เกิดข้อผิดพลาดด้านความสมบูรณ์ของข้อมูล กรุณาเริ่มใหม่" }, { status: 500 });
  }
  ```
- `read/route.ts` — ต้นฟังก์ชัน หลังได้ `record` ที่มี `drawn`: เช็คเดียวกัน + optionally re-run `drawCards` server-side เทียบ `record.drawn` (paranoid mode — คนละ ~1ms)
- ทั้ง 2 จุด: ถ้า fail → `recordEvents(["pf_integrity_fail"])` + พิจารณา auto-incident (`npm run incident`)

### 3.4 align client identifier (cleanup)

`src/server/store.ts:97` `clientKeyFromRequest` เช็ค `x-forwarded-for` ก่อน (spoofable) — ให้ตรงกับ `src/lib/utils/rate-limit.ts:41` ที่เช็ค `cf-connecting-ip` ก่อน:
```ts
export function clientKeyFromRequest(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  // ... เดิมเป็น fallback
}
```
> หรือดีกว่า: ลบ `clientKeyFromRequest` ทิ้ง แล้วให้ `start`/`shuffle` import `getClientIdentifier` จาก `rate-limit.ts` (มี logic เดียว) — แต่ระวัง `checkRateLimit` 2 ตัวมี signature ต่างกัน (`store.ts` = positional, `rate-limit.ts` = options object) ตรวจ call site ก่อนรวม

### Acceptance PR 3
- [ ] deploy production → `curl` `/start` แล้ว `/shuffle` จากคนละ region / หลัง `wrangler tail` ยืนยัน KV hit เมื่อ memory miss (ISSUE-004: ทดสอบจริงได้แค่บน production)
- [ ] simulate isolate loss (ลบ key memory ใน dev shim หรือ restart dev ระหว่าง flow) → `/shuffle` ดึงจาก KV ได้ `serverSeed` ครบ → deck ตรง commitment
- [ ] ยิง `/shuffle` ด้วย `/start` token เดิมหลัง KV key หมดอายุ → ได้ 410 `SESSION_SEED_LOST` ไม่ใช่ deck มั่ว
- [ ] `verifyCommitment` gate: inject record ที่ commitment ไม่ตรง → 500 + log
- [ ] flow 5 ขั้นปกติยังผ่าน (regression)

---

## 📦 PR 4 — `pf-docs-copy` : เก็บกวาดเอกสาร + ถ้อยคำ (effort S)

- `docs/KNOWN_ISSUES.md`:
  - ISSUE-010b — ยืนยันสถานะ "แก้แล้ว (throw ใน prod)" ให้ตรงโค้ดจริง `session-token.ts:26-32`
  - เพิ่ม entry ใหม่: "Provably-Fair verifier UI + KV session persistence (PR 1-3, 2026-09) — provably-fair ตรวจสอบได้จาก client แล้ว"
- `src/lib/security/session-token.ts:13` — comment `"รับประกันความปลอดภัย 100% ไม่สามารถปลอมแปลงไพ่หรือ Seed ได้"` → แก้ให้ตรงจริง เช่น `"ป้องกันการปลอมแปลง drawn/seed ด้วย HMAC-SHA256 + commit-reveal (serverSeed ไม่เปิดเผยจนกว่าจะจั่วเสร็จ)"`
- `docs/ARCHITECTURE.md` — อัปเดต section provably-fair flow ให้มีขั้น "client verification" + KV backstop
- `docs/AUDIT_2026-09-01.md` — mark P1-11 / P1-12 (verifier UI) เป็น done, อ้าง PR
- `docs/WORK_LOG.md` — บันทึกตามปกติ
- ตรวจ user-facing copy ทั้งหมด (`grep -rn "โปร่งใส\|Provably\|พิสูจน์\|100%" src --include=*.tsx`): ต้องไม่มีคำเคลมที่ยังพิสูจน์ไม่ได้เกินจากที่ panel ทำจริง

### Acceptance PR 4
- [ ] `grep` แล้วไม่มีคำเคลม "100%" / "การันตี" ใน user-facing
- [ ] `npm run repo:verify` ผ่าน (รวม parity test จาก PR 1)

---

## 📋 ลำดับ + กติกา

| PR | ชื่อ branch | ขึ้นกับ |
| :-- | :-- | :-- |
| 1 | `pf-verifier-core` | — |
| 2 | `pf-verifier-ui` | PR 1 merged |
| 3 | `pf-shuffle-integrity` | อิสระ (ทำคู่ขนาน PR 2 ได้) |
| 4 | `pf-docs-copy` | PR 1-3 merged |

**ทุก PR:** `git fetch origin && git checkout -B <branch> origin/main` → แก้ → `npm run repo:verify` → `npm run pr:auto -- "<title>" "<body>"` → รอ merge → `git:tidy`
**commit ผ่าน** `npm run commit` เท่านั้น · `--type fix` (ถ้ามี) ต้องมี `--cause` + `--prevention` (CLAUDE.md กฎ 0)
**1 milestone = 1 PR** (INC-0017) · ห้าม push main (INC-0015)
**ทดสอบเบราว์เซอร์จริง** flow 5 ขั้นหลังทุก PR — ไพ่คว่ำหน้าเริ่มต้น (Golden Rule 5) · `npm run dev` port 3000

---

## ✅ นิยาม "เสร็จ" (ปิด GAP ทั้ง 2)

1. ผู้ใช้เปิดไพ่จบ → กดปุ่มเดียวในแอป → เห็นด้วยตาว่า `sha256(serverSeed) === commitment` **และ** ไพ่ที่ได้ = ผลการคำนวณซ้ำจาก seed ที่ผูกมัดไว้ก่อนสับ
2. ผู้ใช้เห็น `commitment` **ก่อน** กดสับไพ่
3. `serverSeed` รอดข้าม Cloudflare isolate ผ่าน KV — `/shuffle` ไม่มีวันจั่วด้วย seed = `undefined` อีก (ได้ 410 แทน)
4. `verifyCommitment` เป็น gate จริงใน `/shuffle` + `/read` — commitment ไม่ตรง = ปฏิเสธ ไม่ใช่เสิร์ฟเงียบ ๆ
5. dev ภายนอกมีข้อมูลครบ (algorithm + ค่าทุกตัว) รัน verify เองได้โดยไม่เชื่อโค้ดฝั่งเรา
