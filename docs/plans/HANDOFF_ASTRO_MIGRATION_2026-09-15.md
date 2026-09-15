# 🪶 แผนย้ายเว็บไปสถาปัตยกรรม Astro + React Island

> **สถานะ**: คลื่นที่ 1 เสร็จแล้วและขึ้น production ได้ (`/cards/**` 174 หน้า)
> **คำสั่งเจ้าของโปรเจกต์**: หน้าแรกกับหน้าแอป 18 หน้า ➔ React island · หน้าที่เหลือทั้งหมด ➔ Astro
> **วันที่**: 2026-09-15 · ทุกตัวเลขในเอกสารนี้วัดจากบิลด์จริงบนเครื่อง ไม่ได้คัดลอกต่อจากที่ไหน

---

## 0. ทำไมต้องย้าย (ตัวเลขจริง)

หน้าเนื้อหาไม่มีสถานะอะไรให้จำ ผู้ใช้แค่อ่าน แต่ Next.js ส่ง React runtime + router +
เพย์โหลด RSC มาให้ครบทุกหน้าเสมอ · วัดจากบิลด์ production ก่อนย้าย:

| เส้นทาง | JS (gzip) ก่อน | JS (gzip) หลัง | HTML (gzip) ก่อน | หลัง |
|---|---|---|---|---|
| `/cards/<ไพ่>` (156 หน้า) | 187 KB | **96 KB** (−49%) | 23 KB | **17 KB** |
| `/cards` | 171 KB | **109 KB** (−36%) | 23 KB | 23 KB |
| `/cards/all` | 173 KB | **104 KB** (−40%) | 27 KB | 27 KB |
| `/cards/birth-card` | 182 KB | **104 KB** (−43%) | 21 KB | 21 KB |

และที่สำคัญกว่าตัวเลข: **แท็ก `<script>` ในหน้าไพ่รายใบลดจาก 20 ก้อนเหลือ 0 ก้อน**
(island โหลดตัวเองตอนเบราว์เซอร์ว่างด้วย `client:idle`) · HTML ของ Next ยังพ่วง
"หน้าโครงระหว่างโหลด" (loading skeleton) มาในไฟล์เดียวกับเนื้อหาจริงเสมอ — Astro ไม่มีส่วนนั้นเลย

นอกจากนี้หน้าที่ย้ายแล้วถูก **Cloudflare ตอบจากขอบโดยไม่ปลุก Worker** จึงไม่มีค่าคำขอ
และไม่ต้องบูต runtime ของ Next (ดู `docs/plans/HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md`)

---

## 1. สถาปัตยกรรมที่ใช้ (อ่านก่อนแตะอะไรทั้งสิ้น)

```
next build  ➔ .next/            ➔ opennextjs-cloudflare build ➔ .open-next/{worker.js,assets}
astro build ➔ dist/             ─────────────────────────────┐
                                                             ▼
                              scripts/merge-astro-assets.ts คัดลอก dist/ ทับลง .open-next/assets
                                                             ▼
                               Cloudflare: ไฟล์ static มาก่อน Worker เสมอ
```

* หน้าที่ย้ายแล้ว = ไฟล์ HTML ใน assets ➔ ตอบที่ขอบ ไม่ผ่าน Worker
* หน้าที่ยังไม่ย้าย + `/api/*` + `sitemap.xml` ➔ ตกไปที่ Worker ตามเดิม (ไม่มีอะไรเปลี่ยน)
* `wrangler.jsonc` เขียน `html_handling` · `not_found_handling` · `run_worker_first` ไว้ตรง ๆ แล้ว
  (อย่าลบ — พฤติกรรมของครึ่งเว็บไม่ควรขึ้นกับค่าเริ่มต้นที่ผู้ให้บริการอาจเปลี่ยน)

### ชั้นแปลงปลั๊ก — หัวใจที่ทำให้ไม่ต้องเขียนคอมโพเนนต์ใหม่เลยสักตัว

`astro.config.mjs` ชี้ `next/link` · `next/navigation` · `next/script` ไปที่ `astro/shims/*`
ตอนบิลด์ด้วย Astro เท่านั้น · คอมโพเนนต์ทั้ง 90 ตัวใน `src/components/**` จึงใช้ได้
**ทั้งสองเครื่องมือโดยไม่ต้องแก้แม้แต่บรรทัดเดียว**

> ⚠️ ห้ามไล่แก้ `src/components/**` ให้เลิกใช้ `next/link` เพื่อการนี้
> ตราบใดที่ Next ยังเรนเดอร์หน้าแอปอยู่ ทั้งสองฝั่งต้องใช้ไฟล์เดียวกัน

### กติกา island (ผิดข้อเดียวบันเดิลพุ่ง 10 เท่า)

1. **ห้ามนำเข้าข้อมูลก้อนใหญ่ในไฟล์ที่มี island** — Astro มัดรวมทั้งไฟล์ลงบันเดิลไคลเอนต์
   เผลอ `import { cardById }` ครั้งเดียว บันเดิลพุ่งจาก 24 KB เป็น **980 KB** (วัดจริง)
2. **คอมโพเนนต์ที่เรนเดอร์เป็น HTML แล้วจบ ต้องอยู่คนละไฟล์กับ island**
   (ดู `astro/components/` เทียบกับ `astro/islands/`)
3. **ส่วนที่ต้องโต้ตอบให้ส่งเข้าไปทาง slot** ไม่ใช่เรนเดอร์ซ้อนใน React
   island วางซ้อนข้างใน React ไม่ได้ — มันต้องอยู่ระดับเทมเพลตของ Astro
   (ตัวอย่าง: `CardsIndexBody` รับ `explorer` · `CardDetailView` รับ `related`)
4. **ใช้ `client:idle` เป็นค่าเริ่มต้น** ห้าม `client:load` ถ้าไม่ใช่ของที่ผู้ใช้ต้องกดทันที
5. **ภาษาถูกตรึงตาม URL** ในหน้าที่เรนเดอร์ด้วย Astro (ทุก island ต้องรับ `locale` แล้วส่งเข้า
   `forcedLocale`) — เหตุผลเต็มอยู่ในหัวไฟล์ `astro/layouts/BaseLayout.astro`

---

## 2. สิ่งที่ทำไปแล้ว (คลื่นที่ 1)

| ของ | ที่อยู่ |
|---|---|
| ตั้งค่า Astro + ชั้นแปลงปลั๊ก | `astro.config.mjs` · `astro/shims/*` |
| โครง `<html>` ฝาแฝดของ `RootHtml.tsx` | `astro/layouts/BaseLayout.astro` |
| ตัวแปลง `Metadata` ของ Next ➔ แท็ก `<head>` | `astro/lib/metadata.ts` |
| หน้า `/cards/**` ทั้งไทยและอังกฤษ 174 หน้า | `astro/pages/cards/*` · `astro/pages/en/cards/*` |
| รวมผลลัพธ์เข้ากับ Worker assets | `scripts/merge-astro-assets.ts` |
| รายการว่าเส้นไหนเป็นของเครื่องมือไหน | `src/lib/routing/astro-routes.ts` |

### งานร่วมที่ต้องทำเพราะสองเครื่องมือใช้ของชุดเดียวกัน

* **ฟอนต์ย้ายออกจาก `next/font`** ➔ ประกาศ `@font-face` เองใน `globals.css` ชี้ `/fonts/*.woff2`
  (ค่าชดเชยเมตริกคัดลอกมาจากที่ `next/font` คำนวณไว้แบบเป๊ะทุกหลัก — ห้ามแก้ด้วยการเดา)
  ไม่งั้นผู้ใช้ที่เดินข้ามสองฝั่งต้องโหลดฟอนต์ชุดเดิมใหม่ทั้งหมดเพราะ URL คนละตัว
* **metadata ระดับราก** ย้ายมาอยู่ที่ `src/app/_shared/root-metadata.ts` ที่เดียว
* **ส่วนหัวความปลอดภัย** ย้ายมาอยู่ที่ `src/lib/config/security-headers.ts` ที่เดียว
  แล้วคัดลอกลง `public/_headers` (ไฟล์ static ไม่ผ่าน Worker จึงไม่ได้รับจาก `next.config.ts`)
* **`LocaleLink`** ตรวจ `isAstroRoute()` แล้วคืน `<a>` ธรรมดาสำหรับปลายทางที่ย้ายแล้ว

### ด่านตรวจใหม่ 3 ด่าน (57 ➔ 60)

| ด่าน | กันอะไร |
|---|---|
| `test-astro-routes.ts` | หน้าเดียวอยู่สองที่ · รายการกลางไม่ตรงกับของจริง · ฝาแฝดย้ายไม่ครบคู่ |
| `test-render-parity.ts` | `<head>` ของสองเครื่องมือหลุดจากกัน (ฟอนต์ · JSON-LD · PDPA · speculation rules) |
| `test-static-headers.ts` | ไฟล์ static ไม่มี CSP/HSTS · กฎแคชครอบหน้าเว็บจนแก้เนื้อหาแล้วไม่ถึงผู้ใช้ |

พร้อมกับแก้ด่านเดิม 6 ด่านให้มองเห็นผลลัพธ์ของทั้งสองเครื่องมือ (เดิมมองแต่ `.next/`)

---

## 3. คลื่นถัดไป (เรียงตามลำดับที่ควรทำ)

### คลื่น 2 — `/blog/**` (56 หน้า) และ `/spreads/**` (64 หน้า)
รูปแบบเดียวกับ `/cards` เป๊ะ: `_shared/pages/blog-*.tsx` และ `spread-*.tsx` มีอยู่แล้ว
* ต้องแยกส่วนที่ต้องโต้ตอบออกเป็น slot ก่อน (เช่น `ArticleReadingClient` · `SpreadDetailClient`)
* เพิ่ม `"/blog"` และ `"/spreads"` ลง `ASTRO_ROUTE_PREFIXES` แล้วลบ `page.tsx` ฝั่ง Next ในคอมมิตเดียวกัน
* ⚠️ `/blog` คือหน้าที่ TBT แย่ที่สุดของเว็บ (660 ms · ดู `HANDOFF_BLOG_TBT_2026-09-12.md`)
  คลื่นนี้น่าจะปิดเคสนั้นไปในตัว — **ต้องยิง Lighthouse วัดซ้ำแล้วบันทึกผล**

### คลื่น 3 — หน้าเนื้อหาที่เหลือ
`/about` · `/privacy` · `/contact` · `/readers` · `/s/[id]`
(`/s/[id]` เป็นหน้าแชร์ผลอ่าน ต้องดูก่อนว่าเป็น dynamic จริงไหม — ถ้าใช่ ให้อยู่กับ Worker ต่อ)

### คลื่น 4 — หน้าแรก + หน้าแอป 18 หน้า ➔ React island บน Astro
นี่คือก้อนที่ยากที่สุด และ **ต้องทำหลังสุดเสมอ**
* หน้าเหล่านี้คุยกับ `/api/*` · มีสถานะผู้ใช้ · สตรีมคำอ่านจาก AI
* ทางที่แนะนำ: หน้า `.astro` บาง ๆ + island ก้อนเดียวครอบทั้งแอป (`client:load`)
  แล้วค่อยซอยย่อยทีหลัง — ห้ามพยายามแตก island ตั้งแต่รอบแรก
* ⚠️ ที่ต้องแก้ก่อน: `useRouter().push` ใน shim เป็นการโหลดหน้าใหม่จริง
  หน้าแอปที่พึ่งการนำทางฝั่งไคลเอนต์ (เช่นเปลี่ยนสเตปในพิธีเปิดไพ่) ต้องตรวจทีละจุด

### คลื่น 5 — ย้าย `/api/*` 68 เส้นออกจาก Next แล้วถอด Next ทิ้ง
ทำได้ต่อเมื่อคลื่น 4 จบแล้วเท่านั้น · ต้องใช้ adapter ของ Astro บน Cloudflare
และย้าย `getCloudflareContext()` ไปเป็น `locals.runtime.env`

---

## 4. กับดักที่เหยียบมาแล้ว (อย่าเหยียบซ้ำ)

| กับดัก | อาการ | บันทึก |
|---|---|---|
| `import` ข้อมูลในไฟล์ island | บันเดิล 24 KB ➔ **980 KB** | คอมเมนต์ใน `astro/islands/CardDetailRoot.tsx` |
| กฎ `/cards/*` ใน `_headers` | หน้าไพ่ถูกแคช 1 ปีแบบ immutable แก้แล้วไม่ถึงผู้ใช้ | INC-0166 |
| ลำดับกฎใน `sw.js` | หน้าไพ่ถูกเสิร์ฟแบบ cache-first · ออฟไลน์ได้ 408 แทนหน้าสำรอง | INC-0164 |
| ด่านงบน้ำหนักมองไม่เห็น JS ของ Astro | รายงาน 0 KB แล้วขึ้นเขียว | INC-0165 |
| `build.format: "directory"` | เส้นทางกลายเป็น `/cards/x/index` ด่านทั้งชุดมองไม่เห็นหน้า | คอมเมนต์ใน `astro.config.mjs` |
| `*/` ในคอมเมนต์ไฟล์ `.tsx` | บิลด์ Astro ล้มด้วย "Unexpected token" ที่บรรทัดคอมเมนต์ | — |
| เขียน `<link rel="preload">` เองใน `<head>` ของ Next | React 19 ยกขึ้นให้อีกชุด ได้แท็กซ้ำสองเท่า | ใช้ `ReactDOM.preload` |

---

## 5. สิ่งที่ยัง **ไม่ได้** พิสูจน์บนเครื่อง (ต้องตรวจหลัง deploy)

เครื่องที่ทำงานรอบนี้เป็น macOS 12.6 ซึ่ง **รัน workerd ไม่ได้** (ต้องการ 13.5+)
จึงเปิด `opennextjs-cloudflare preview` ไม่ได้เลย · สิ่งที่ตรวจแทนคือเสิร์ฟ
`.open-next/assets` ด้วยเซิร์ฟเวอร์ static ธรรมดาแล้วยิงจริงผ่านเบราว์เซอร์ (ผ่านทุกหน้า)

**เช็กลิสต์ 5 ข้อหลัง deploy รอบแรก** (ใช้เวลาไม่ถึงสองนาที):

```bash
curl -sI https://seertarot.net/cards/major-00 | grep -i "content-security-policy\|cache-control"
curl -sI https://seertarot.net/cards/major-00.jpg | grep -i cache-control   # ต้องมี immutable
curl -sI https://seertarot.net/cards/            | head -1                  # ต้อง 301 ไป /cards
curl -s  https://seertarot.net/cards/major-00 | grep -c astro-island        # ต้องได้ 3
curl -sI https://seertarot.net/daily | grep -i x-nextjs-cache               # หน้าแอปต้องยังผ่าน Worker
```

ถ้าข้อใดข้อหนึ่งไม่ผ่าน ให้ย้อนกลับด้วยการ revert คอมมิตเดียว — หน้าเก่ายังอยู่ครบใน git
และ `ASTRO_ROUTE_PREFIXES` กับ `page.tsx` ที่ลบไปกลับมาพร้อมกันเสมอ
