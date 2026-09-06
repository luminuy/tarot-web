# 🔎 แผนต่อ UI ค้นหาเชิงความหมาย — ปลุก Vectorize + Workers AI ที่สร้างไว้แล้วให้ได้ใช้จริง (2026-09-06)

> **สถานะ**: แผน (ยังไม่ลงมือ) · **ฐานที่ตรวจ**: `b77d8e2` (main หลัง #330) · **ผู้ตรวจ**: Claude Opus 5
> **ที่มา**: เจ้าของเลือก "ทาง ข — ต่อ UI จริง" จากข้อ M-06 ใน
> [`HANDOFF_MEDIA_FIX_2026-09-06.md`](HANDOFF_MEDIA_FIX_2026-09-06.md)
>
> **ข้อสรุปสำคัญ**: ระบบหลังบ้าน **พร้อมใช้งาน 100% อยู่แล้ว** — ยิงทดสอบบน production แล้วได้ผลดีมาก
> ขาดแค่ "ไม่มีหน้าเว็บไหนต่อเข้ามา" เท่านั้น งานนี้จึงเป็นงาน **frontend เป็นหลัก** ไม่ใช่งานสร้างระบบใหม่

---

## 0. สรุปผู้บริหาร

| # | งาน | ผลที่ได้ | ระดับ | แรง |
| :-- | :--- | :--- | :-- | :-- |
| **Q-01** | แคชผลค้นหาบน Upstash + จำกัดโควตาต่อ IP | **ต้องทำก่อนเปิด UI** ไม่งั้นโควตา Workers AI หมดใน 1 วัน | 🔴 บังคับ | ปานกลาง |
| **Q-02** | `/api/search` เพิ่ม rate limit ข้าม edge (ตอนนี้มีแค่ตรวจ origin) | กันคนยิงเผาโควตา | 🔴 บังคับ | เล็ก |
| **U-01** | โหมด "ค้นด้วยความรู้สึก" ในหน้า `/cards` | ฟีเจอร์ที่ MyHora ไม่มี · ใช้ของที่สร้างไว้แล้ว | 🟠 | ปานกลาง |
| **U-02** | ใช้คอมโพเนนต์เดิมซ้ำที่ `/blog` | ครอบคลุมบทความ 26 บท | 🟡 | เล็ก |
| **U-03** | แถบ "บทความที่ตรงกับคำถามคุณ" ในโฟลว์ดูดวง | เปลี่ยนคนอ่านเป็นคนเปิดไพ่ | 🔵 เฟส 2 | ปานกลาง |
| **G-01** | ด่านตรวจว่า UI ต่อกับ API จริง (กันกำพร้าซ้ำ) | กันปัญหาเดิมกลับมา | 🟡 | เล็ก |

**ลำดับบังคับ**: Q-01 → Q-02 → U-01 → G-01 → U-02 → (U-03 ถ้าโควตาเหลือ)

> ⛔ **ห้ามทำ U-01 ก่อน Q-01/Q-02 เด็ดขาด** — เปิด UI โดยไม่มีแคชและโควตา
> = ทุกคนที่พิมพ์ในช่องค้นหายิง Workers AI ทันที โควตาฟรีจะหมดตั้งแต่วันแรก
> และเมื่อหมด **ระบบ AI อ่านไพ่ (`src/lib/safety/ai-classifier.ts`) จะพลอยใช้ไม่ได้ตามไปด้วย**

---

## 1. ของที่มีอยู่แล้ว — พร้อมใช้ ไม่ต้องสร้างใหม่

| ชิ้นส่วน | ไฟล์ | สถานะ |
| :--- | :--- | :--- |
| ฟังก์ชันค้นหา | [`src/lib/search/vectorize.ts`](../../src/lib/search/vectorize.ts) | ✅ `semanticSearch()` · `relatedTo()` · `buildSearchCorpus()` |
| API | [`src/app/api/search/route.ts`](../../src/app/api/search/route.ts) | ✅ รับ `?q=` `?like=` `&type=` `&topK=` |
| โมเดล embedding | `@cf/baai/bge-m3` (1024 มิติ · cosine) | ✅ รองรับไทยดีมาก |
| Vectorize index | `card-meanings` (ประกาศใน `wrangler.jsonc`) | ✅ **มีข้อมูลจริงแล้ว** |
| corpus | ไพ่ 78 ใบ + บทความ 26 บท | ✅ มีด่านที่ 24 คุมความครบ |
| ปุ่มสร้าง index ใหม่ | `/api/admin/rebuild-search-index` | ✅ อยู่ในแผงแอดมิน |

### หลักฐานว่าใช้งานได้จริง (ยิงบน production แล้ว)

```bash
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'
curl -s "https://seertarot.net/api/search?q=อกหักแล้วจะกลับมาไหม&topK=5" \
  -H "User-Agent: $UA" -H 'Origin: https://seertarot.net' -H 'Referer: https://seertarot.net/cards'
```

ผลที่ได้จริง (คำค้นเป็นความรู้สึกล้วน ไม่มีชื่อไพ่เลยสักคำ):

| อันดับ | ผลลัพธ์ | คะแนน | ทำไมถึงตรง |
| :-- | :--- | ---: | :--- |
| 1 | บทความ "แฟนเก่าจะกลับมาไหม? ส่อง 5 สัญญาณ" | 0.551 | ตรงหัวข้อเป๊ะ |
| 2 | ไพ่ **การตื่นขึ้น (Judgement)** | 0.495 | ไพ่แห่งการหวนคืน/ฟื้นคืน |
| 3 | ไพ่ **หกถ้วย (Six of Cups)** | 0.494 | ไพ่แห่งความหลัง/คนเก่ากลับมา |

> 💡 นี่คือคุณค่าที่ระบบค้นหาแบบจับคำ (`toLowerCase().includes()`) ที่ใช้อยู่ใน `/cards`
> **ทำไม่ได้เลย** — ผู้ใช้พิมพ์ความรู้สึกของตัวเอง ไม่ได้พิมพ์ชื่อไพ่

---

## 2. Q-01 · แคชผลค้นหา + คุมโควตา (ต้องทำก่อน) 🔴

### ทำไมบังคับ

การค้นหา 1 ครั้ง = **1 embedding call ไป Workers AI** + 1 Vectorize query
Workers AI แพ็กเกจฟรีมีเพดานรายวัน และ **ใช้ร่วมกับตัวจำแนกความปลอดภัย**
(`src/lib/safety/ai-classifier.ts`) ถ้าค้นหากินหมด ระบบกันคำถามเสี่ยงทำร้ายตัวเองจะพลอยล้มด้วย
ซึ่งร้ายแรงกว่าเรื่องค้นหาหลายเท่า

### ทางแก้ — ใช้ Upstash ที่ต่อไว้แล้ว

โครงสร้างพร้อมอยู่แล้วใน [`src/lib/platform/redis.ts`](../../src/lib/platform/redis.ts)
และ [`src/lib/platform/kv-counter.ts`](../../src/lib/platform/kv-counter.ts) (INCRBY แบบ atomic ข้าม edge)

**ชั้นที่ 1 — แคชผลลัพธ์ตามคำค้น**

```ts
// src/lib/search/search-cache.ts (ใหม่)
import { redisGetJSON, redisSetJSON, isRedisEnabled } from "@/lib/platform/redis";
import type { SearchResult } from "./vectorize";

const TTL_SEC = 60 * 60 * 24; // 24 ชั่วโมง — corpus เปลี่ยนน้อยมาก

/** normalize ให้คำค้นที่ต่างกันแค่ช่องว่าง/ตัวพิมพ์ ใช้แคชก้อนเดียวกัน */
function cacheKey(q: string, type?: string, topK = 8): string {
  const norm = q.trim().toLowerCase().replace(/\s+/g, " ");
  return `app:search:${type ?? "all"}:${topK}:${norm}`;
}

export async function getCachedSearch(q: string, type?: string, topK?: number) {
  if (!(await isRedisEnabled())) return null;
  return redisGetJSON<SearchResult[]>(cacheKey(q, type, topK));
}

export async function setCachedSearch(q: string, results: SearchResult[], type?: string, topK?: number) {
  if (!(await isRedisEnabled())) return;
  await redisSetJSON(cacheKey(q, type, topK), results, TTL_SEC);
}
```

**ชั้นที่ 2 — เพดานรายวันของทั้งระบบ**

```ts
// ใน route: กันไม่ให้ค้นหากินโควตา AI จนกระทบระบบอ่านไพ่
import { bumpCounter, readCounter } from "@/lib/platform/kv-counter";
import { utcDay } from "@/lib/stats/record";

const SEARCH_DAILY_CAP = Number(process.env.SEARCH_DAILY_CAP) || 1500;
const key = `app:search:daily:${utcDay()}`;
if ((await readCounter(key)) >= SEARCH_DAILY_CAP) {
  // เกินเพดาน → ถอยไปใช้การกรองแบบจับคำในหน้าเว็บ ไม่ต้อง error
  return NextResponse.json({ results: [], degraded: true }, { headers: NO_STORE_ON_ERR });
}
```

**เกณฑ์ผ่าน**
- ค้นคำเดิมซ้ำครั้งที่ 2 ต้อง**ไม่**เพิ่มตัวเลข Commands ใน Upstash console แบบยิง AI ใหม่
  (ตรวจที่ Cloudflare → AI → Workers AI Analytics ว่าจำนวน request ไม่ขึ้น)
- ตั้ง `SEARCH_DAILY_CAP=3` ชั่วคราวแล้วค้น 4 ครั้ง → ครั้งที่ 4 ต้องได้ `degraded: true` ไม่ใช่ error
- **วัดค่าใช้จ่ายจริงก่อนตั้งเพดานถาวร** — ดูที่ Cloudflare → AI → Workers AI Analytics
  หลังเปิดใช้ 1 วัน แล้วค่อยปรับ `SEARCH_DAILY_CAP` ให้เหลือ headroom ให้ `ai-classifier` อย่างน้อย 50%

> ⚠️ **ห้ามเดาตัวเลข neuron ที่โมเดลใช้** — ต้องอ่านจากแดชบอร์ดจริงเท่านั้น
> ค่าในเอกสารนี้ (1500) เป็นค่าเริ่มต้นแบบระมัดระวัง ไม่ใช่ค่าที่วัดมา

---

## 3. Q-02 · จำกัดจำนวนครั้งต่อ IP ข้าม edge 🔴

### ปัญหา

`/api/search` ตอนนี้มีแค่ `isRequestAuthorizedOrigin(request)` — ตรวจ `Origin`/`Referer`
ซึ่ง**ปลอมได้ด้วย `curl -H` บรรทัดเดียว** และ `checkRateLimit()` ที่มีอยู่ใน
[`src/lib/utils/rate-limit.ts`](../../src/lib/utils/rate-limit.ts) เก็บสถานะ **ในหน่วยความจำของ isolate**
จึงกันคนที่กระจายคำขอข้าม edge ไม่ได้

### ทางแก้

```ts
import { getClientIdentifier } from "@/lib/utils/rate-limit";
import { bumpCounter, readCounter } from "@/lib/platform/kv-counter";
import { utcDay } from "@/lib/stats/record";

const PER_IP_DAILY = 40;
const ipKey = `app:search:ip:${utcDay()}:${hashIp(getClientIdentifier(request))}`;
if ((await readCounter(ipKey)) >= PER_IP_DAILY) {
  return NextResponse.json({ results: [], degraded: true }, { status: 429 });
}
// นับเฉพาะตอนที่ "พลาดแคชแล้วต้องยิง AI จริง" เท่านั้น — คำค้นซ้ำไม่ควรกินโควตาผู้ใช้
bumpCounter(ipKey, 60 * 60 * 26);
```

**เกณฑ์ผ่าน**
- ยิง 41 คำค้น**ที่ไม่ซ้ำกัน** จาก IP เดียว → ครั้งที่ 41 ได้ 429
- ยิงคำค้น**เดิมซ้ำ** 50 ครั้ง → ไม่โดนจำกัด (เพราะมาจากแคช ไม่ได้ยิง AI)
- ใช้ `hashIp` แบบเดียวกับ `ai-budget.ts` (SHA-256 ตัด 16 ตัว) **ห้ามเก็บ IP ดิบลง Redis** (PDPA)

---

## 4. U-01 · โหมด "ค้นด้วยความรู้สึก" ในหน้า `/cards` 🟠

### หลักการออกแบบ

หน้า `/cards` มีช่องค้นหาแบบจับคำอยู่แล้วใน
[`CardsExplorer.tsx:78`](../../src/components/encyclopedia/CardsExplorer.tsx)
(`searchQuery` → `toLowerCase().includes()`) ซึ่งเร็ว 0ms และไม่กินโควตา

> ✅ **ห้ามแทนที่ของเดิม** — คนที่พิมพ์ "ถ้วย" หรือ "The Fool" ต้องได้ผลทันทีเหมือนเดิม
> ค้นหาเชิงความหมายเป็น **ทางเลือกเสริม** ไม่ใช่ตัวแทน

### พฤติกรรมที่ต้องการ

1. ผู้ใช้พิมพ์ในช่องเดิม → กรองแบบจับคำทำงานทันทีเหมือนเดิม (0ms)
2. ถ้าพิมพ์ **≥ 6 ตัวอักษร** และ **ผลจับคำน้อยกว่า 3 ใบ** → แสดงปุ่ม
   `✦ ค้นด้วยความรู้สึกแทน` ใต้ช่องค้นหา
3. กดปุ่ม → เรียก `/api/search?q=...&type=card&topK=8` → แสดงผลในส่วนแยกหัวข้อ
   **"ไพ่ที่ตรงกับความรู้สึกของคุณ"** พร้อมคะแนนความใกล้เคียง

> 💡 **ทำไมต้องให้กดปุ่ม ไม่ใช่ค้นอัตโนมัติ** — ค้นอัตโนมัติทุกครั้งที่พิมพ์
> = ยิง AI ทุก keystroke แม้จะ debounce แล้วก็ยังเปลือง · การให้กดเองยังทำให้ผู้ใช้
> เข้าใจว่า "นี่คือโหมดพิเศษ" และเรารู้ว่ามีคนใช้จริงแค่ไหนจาก analytics

### โครงคอมโพเนนต์

```tsx
// src/components/encyclopedia/SemanticSearchPanel.tsx (ใหม่ · "use client")
// โหลดแบบ dynamic เพื่อไม่ให้เพิ่มน้ำหนักบันเดิลหน้า /cards ที่ตึงอยู่แล้ว
// (ดู HANDOFF_SMOOTH_FAST — /cards อยู่ที่ 313 KB gzip เกินเกณฑ์ 1.8 เท่า)

interface Props { query: string; onPick: (cardId: string) => void; }

export function SemanticSearchPanel({ query, onPick }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<SearchResult[]>([]);

  async function run() {
    setState("loading");
    try {
      const r = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=card&topK=8`,
        { credentials: "same-origin" },
      );
      const d = await r.json();
      setResults(Array.isArray(d.results) ? d.results : []);
      setState(d.degraded ? "error" : "done");
      trackEvent("semantic_search", { query_len: query.length, results: d.results?.length ?? 0 });
    } catch { setState("error"); }
  }
  …
}
```

เรียกใช้แบบ lazy ใน `CardsExplorer`:

```tsx
const SemanticSearchPanel = dynamic(
  () => import("./SemanticSearchPanel").then((m) => m.SemanticSearchPanel),
  { ssr: false, loading: () => null },
);
```

### ⚠️ กฎเหล็กข้อ 14 ครอบข้อนี้โดยตรง

API คืน `ref` เป็น **id ของไพ่** เท่านั้น ฝั่ง UI ต้องแปลงเป็นไพ่จริงด้วย
`cardById()` (หรือ `cardSummaryById()` หลังทำ F-01 ในแผน SMOOTH_FAST)

```tsx
const card = cardById(result.ref);
if (!card) return null;   // ← หาไม่เจอ = ไม่แสดง ห้ามกุไพ่มาแทนเด็ดขาด
```

**ห้าม**เอา `title`/`subtitle` ที่มากับ metadata ของ Vectorize มาแสดงเป็นชื่อไพ่ตรง ๆ
เพราะเป็นข้อมูลที่ถูก snapshot ไว้ตอนสร้าง index — ถ้า corpus เปลี่ยนแล้วยังไม่ rebuild
ชื่อจะไม่ตรงกับสำรับจริง

### เกณฑ์ผ่าน

- พิมพ์ **"อกหักแล้วจะกลับมาไหม"** → กดปุ่ม → ต้องได้ไพ่ที่เกี่ยวกับการหวนคืน
  (คาดว่าได้ Judgement / Six of Cups ตามผลทดสอบในหัวข้อ 1)
- พิมพ์ **"ถ้วย"** → การกรองแบบจับคำต้องยังทำงานทันทีเหมือนเดิม และ**ไม่**ขึ้นปุ่มค้นด้วยความรู้สึก
  (เพราะผลจับคำมี 14 ใบ ซึ่ง ≥ 3)
- ปิดเน็ตแล้วกดปุ่ม → ต้องขึ้นข้อความบอกผู้ใช้ ไม่ใช่หน้าขาวหรือ error ใน console
- `npm run test:budget` → `/cards` **ต้องไม่เกินงบเดิม** (ถ้าเกิน แปลว่า dynamic import ไม่ทำงาน)
- `npm run repo:verify` → 34/34 ผ่าน

---

## 5. U-02 · ใช้ซ้ำที่ `/blog` 🟡

corpus มีบทความ 26 บทอยู่แล้ว (`buildSearchCorpus()` ใส่ `title + description + keywords + categoryTh`)
ใช้คอมโพเนนต์เดียวกัน เปลี่ยนแค่ `type=article` และหัวข้อเป็น **"บทความที่ตรงกับสิ่งที่คุณสงสัย"**

**เกณฑ์ผ่าน** — พิมพ์ "ดูไพ่เองยังไงให้แม่น" แล้วต้องได้บทความสอนอ่านไพ่ ไม่ใช่บทความความรัก

---

## 6. U-03 · แถบ "บทความที่ตรงกับคำถามคุณ" ในโฟลว์ดูดวง 🔵 (เฟส 2)

ผู้ใช้พิมพ์คำถามอยู่แล้วใน
[`IntentionAltarInput.tsx`](../../src/components/reading/IntentionAltarInput.tsx)
(เช่น *"กำลังคุยกับคนเก่า"*) — เอาข้อความนั้นไปค้นบทความ แล้วแสดงใต้ผลคำทำนาย
เป็นการเปลี่ยนคนอ่านบทความให้เป็นคนเปิดไพ่ และกลับกัน

> ⚠️ **อย่าเพิ่งทำจนกว่าจะมีตัวเลขโควตาจริงจาก U-01** — เส้นนี้อยู่ในทางเดินหลักของการดูดวง
> ถ้าเพิ่ม AI call ตรงนี้แล้วโควตาหมด **การอ่านไพ่จะพังทั้งระบบ** ไม่ใช่แค่ค้นหาใช้ไม่ได้
> ต้องยิงหลังคำทำนายสตรีมจบแล้วเท่านั้น และห่อด้วย `waitUntil` ไม่ให้หน่วงผู้ใช้

---

## 7. G-01 · ด่านกันกำพร้าซ้ำรอย 🟡

ปัญหาเดิมเกิดเพราะ PR #248 ย้าย `RelatedCards` ไปฝั่งเซิร์ฟเวอร์แล้วลบ `fetch()` ทิ้ง
แต่ไม่มีอะไรเตือนว่า API กลายเป็นกำพร้า จึงลอยอยู่หลายเดือนโดยไม่มีใครรู้

เพิ่มใน `scripts/qa/test-search-corpus.ts` (ด่านที่ 24 ที่มีอยู่แล้ว):

```ts
// ถ้ามี /api/search อยู่ ต้องมีโค้ดฝั่งหน้าเว็บเรียกมันจริงอย่างน้อย 1 ที่
const hasRoute = fs.existsSync("src/app/api/search/route.ts");
const callers = execSync(`grep -rl "api/search" src --include='*.tsx' || true`).toString().trim();
assert(
  !hasRoute || callers.length > 0,
  "/api/search ไม่มีโค้ดฝั่งหน้าเว็บเรียกเลย — ถ้าเลิกใช้ให้ลบทั้งชุด ถ้ายังใช้ให้ต่อ UI (บทเรียนจาก PR #248)",
);
```

**เกณฑ์ผ่าน** — ลองลบการเรียกใน `SemanticSearchPanel` ชั่วคราวแล้วรัน `repo:verify` → ต้องแดง

---

## 8. สิ่งที่ตรวจแล้ว "ไม่ต้องทำ"

| รายการ | เหตุผล |
| :--- | :--- |
| สร้าง Vectorize index ใหม่ | มีข้อมูลจริงแล้ว — ยิงทดสอบได้ผลตรงความหมาย |
| เขียน `semanticSearch()` เอง | มีอยู่แล้วใน `vectorize.ts` และทำงานถูกต้อง |
| เปลี่ยนโมเดล embedding | `@cf/baai/bge-m3` รองรับภาษาไทยได้ดีมาก (เห็นจากผลทดสอบ) |
| ทำ `RelatedCards` ให้กลับไปเรียก API | **ห้าม** — PR #248 ย้ายไป static ด้วยเหตุผล SEO ที่ถูกต้อง (312 ลิงก์ต้องอยู่ใน HTML) |
| ใช้ MiniSearch/FlexSearch แทน | คนละงาน — จับคำมีอยู่แล้วใน `CardsExplorer` · งานนี้คือ "เข้าใจความหมาย" |

---

## 9. หมายเหตุถึงทีมที่รับไปทำ

1. **Q-01 และ Q-02 คือเงื่อนไขบังคับ** ไม่ใช่ของเสริม — เปิด UI ก่อนทำสองข้อนี้
   จะทำให้โควตา Workers AI หมด และลาก `ai-classifier` (ตัวกันคำถามทำร้ายตัวเอง) ล้มตามไปด้วย
2. **วัดโควตาจริงจากแดชบอร์ด** Cloudflare → AI → Workers AI Analytics
   ตัวเลขในเอกสารนี้เป็นค่าเริ่มต้นแบบระมัดระวัง ไม่ได้วัดมา
3. **กฎเหล็กข้อ 14** — ผลค้นหาต้องแปลง `ref` เป็นไพ่จริงเสมอ หาไม่เจอให้ข้าม ห้ามกุ
4. หน้า `/cards` ตอนนี้ JS **313 KB gzip เกินเกณฑ์ 1.8 เท่า** อยู่แล้ว
   (ดู [`HANDOFF_SMOOTH_FAST_2026-09-06.md`](HANDOFF_SMOOTH_FAST_2026-09-06.md))
   คอมโพเนนต์ใหม่**ต้อง** `dynamic(..., { ssr: false })` เท่านั้น
5. ผลค้นหา**ห้าม** SSR และห้ามสร้าง URL ที่ index ได้ — ถ้าใส่ query param ต้อง `robots: noindex`
6. เปิด PR ด้วย `npm run pr:auto` เท่านั้น (กฎข้อ 13)
