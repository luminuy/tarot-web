# A5-ux-ui

## ความคืบหน้า

## ข้อค้นพบ

### 🟠 A5-01 · focus trap ของ `useDialogBehavior` รั่วเมื่อปุ่มสุดท้ายถูก `disabled`
- ที่: `src/lib/use-dialog-behavior.ts` (FOCUSABLE_SELECTOR `'button, [href], input, ...'` + ตรรกะ first/last) · เจอจริงที่ `src/components/reading/QuickFortunePicker.tsx:577`
- ปัญหา: ตัวเลือกนับ `button` ที่ `disabled` ด้วย ทั้งที่มันรับโฟกัสไม่ได้ → `last` กลายเป็นปุ่มที่ไม่มีวันถูกโฟกัส เงื่อนไข `activeElement === last` จึงไม่มีวันจริง
- ผลกระทบ/สถานการณ์พัง: หน้าต่าง "ระบุชื่อเล่นและคำถาม" ใน QuickFortunePicker — ตอนยังไม่พิมพ์ชื่อ ปุ่มยืนยัน (ตัวท้ายสุด) ถูก disabled → ผู้ใช้คีย์บอร์ด/screen reader กด Tab จากปุ่มยกเลิก โฟกัสหลุดออกไปหลังฉากที่ `aria-modal="true"` ซ่อนไว้ (ละเมิด WCAG 2.4.3/2.1.2 เชิงปฏิบัติ) · ShareModal ก็มีปุ่ม `disabled={isGenerating}` แบบเดียวกัน
- แนวแก้: ใช้ `button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])` และกรอง `el.offsetParent !== null`; เพิ่มกรณีโฟกัสอยู่นอก container ให้ดึงกลับเข้า `first`

### 🟠 A5-02 · การ์ดในสมุดบันทึกดวงกางรายละเอียดได้ด้วยเมาส์เท่านั้น
- ที่: `src/components/history/ReadingHistoryModal.tsx:478-480` (ส่วนที่กาง `:680`)
- ปัญหา: `<div onClick={() => setExpandedId(...)}>` ไม่มี `role="button"` · `tabIndex` · `onKeyDown` · `aria-expanded` และไม่มีปุ่มอื่นให้กาง
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้คีย์บอร์ด/screen reader เปิดดู "คำแนะนำและสิ่งที่ควรทำ" + "ช่วงเวลา" ของคำทำนายเก่าไม่ได้เลย (WCAG 2.1.1) · ภาคผนวก B ของ HANDOFF_UX_UI_AUDIT บอกว่า div คลิกได้ผ่านครบ 7 ไฟล์ — ไฟล์นี้หลุดรอบนั้น
- แนวแก้: เพิ่มปุ่ม `<button type="button" aria-expanded={isExpanded} aria-controls=...>` "ดูคำแนะนำ" ในแถวบน (ปุ่มลบ/โน้ตกด stopPropagation อยู่แล้ว) แทนการผูก onClick ทั้งการ์ด

### 🟡 A5-03 · อิโมจิการ์ตูนหลุดขึ้นจอผู้ใช้ (ผิดกฎเหล็กข้อ 2)
- ที่: `src/components/history/ReadingHistoryModal.tsx:403,404,598,696` (⏳) · `src/components/blog/ArticleReadingClient.tsx:69,285` (⏱) · `src/app/(th)/readers/[id]/page.tsx:187` (🔒)
- ปัญหา: อิโมจิสีเรนเดอร์ในข้อความที่ผู้ใช้เห็น (แท็บ "⏳ รอผล" · "⏳ ช่วงเวลา:" · "⏱ เวลาอ่าน" · ข้อความ PDPA หน้าแม่หมอ) — กฎข้อ 2 อนุญาตเฉพาะ ✦ ✨ และไม่มีด่าน CI จับ (สแกนเจอเฉพาะสามไฟล์นี้ นอกนั้นอยู่ในคอมเมนต์/หลังบ้าน)
- ผลกระทบ/สถานการณ์พัง: ลุคพรีเมียมเสีย · ทุกแพลตฟอร์มวาดอิโมจิต่างกัน · screen reader อ่านออกเสียงว่า "hourglass not done / stopwatch / locked" นำหน้าข้อความ
- แนวแก้: เปลี่ยนเป็นไอคอน SVG `aria-hidden` หรือ ✦ / ตัดทิ้ง · เพิ่มด่านสแกนช่วง U+1F300–1FAFF, U+2300–23FF ใน JSX text (ไม่นับคอมเมนต์)

### 🟠 A5-04 · ปุ่มล้างคำค้นหน้าแม่หมอไม่มีชื่อ + เป้ากดเล็กกว่า 24px
- ที่: `src/components/readers/ReadersDirectory.tsx:58-64`
- ปัญหา: `<button>✕</button>` ไม่มี `aria-label` · คลาส `text-xs` ไม่มี padding/min-size → กล่องกดราว 12×16px
- ผลกระทบ/สถานการณ์พัง: screen reader อ่านว่า "multiplication x, button" ไม่รู้ว่าเป็นปุ่มล้าง (WCAG 4.1.2) · มือถือกดพลาดไปโดนช่องค้นหา (SC 2.5.8)
- แนวแก้: `aria-label="ล้างคำค้นหา"` + `<span aria-hidden>✕</span>` + `min-w-6 min-h-6 grid place-items-center` (หรือ `tap-overlay`)

### 🟠 A5-05 · สวิตช์ "เปิดรับคิวสด" ของแม่หมอไม่มีชื่อและไม่บอกสถานะ
- ที่: `src/app/(th)/readers/console/page.tsx:206-213`
- ปัญหา: ปุ่ม toggle มีแค่ `<span>` วงกลม ไม่มี `aria-label`/`role="switch"`/`aria-checked` · ยังใส่ `focus:outline-none` (ถูก `:focus-visible` กลางกู้ไว้ แต่ชื่อยังว่าง) · ข้อความสถานะอยู่ใน `<p>` ข้างๆ ไม่ได้ผูกด้วย `aria-labelledby`
- ผลกระทบ/สถานการณ์พัง: แม่หมอที่ใช้ screen reader ได้ยินแค่ "button" — ไม่รู้ว่ากดแล้วเปิดหรือปิดคิวสด อาจปิดคิวโดยไม่ตั้งใจ = เสียรายได้
- แนวแก้: `role="switch" aria-checked={isLiveOpen} aria-label="เปิดรับคิวสด"` (หรือ `aria-labelledby` ชี้ `<p>` สถานะ)

### 🟡 A5-06 · ช่องวันหมดอายุในหน้าแอดมินรหัสแลกสิทธิ์ไม่มี label ผูก
- ที่: `src/components/admin/RedeemCodesManager.tsx:820-821` (สร้าง) · `:914` (แก้ไข)
- ปัญหา: หัวข้อ "วันหมดอายุ (เวลาไทย)" เป็น `<span>` ไม่ใช่ `<label htmlFor>` และ `<input type="date" required>` ไม่มี `aria-label`
- ผลกระทบ/สถานการณ์พัง: screen reader อ่านแค่ "date, required" — แอดมินแยกไม่ออกว่าเป็นวันอะไร · กดคลิกที่ข้อความแล้วไม่โฟกัสช่อง
- แนวแก้: เปลี่ยน `<span>` เป็น `<label htmlFor={expiryId}>` + `useId()`

### 🟠 A5-07 · ห้องแชทแม่หมอ (`/reading/chat`) ไม่เคารพ prefers-reduced-motion
- ที่: `src/components/reading/FollowUpChat.tsx:5,115,144,168,431,446,508,559` · โหลดผ่าน `src/app/_shared/pages/reading-chat-th.tsx:23` (`dynamic(...)` ธรรมดา) · `astro/islands/ReadingChatRoot.tsx`
- ปัญหา: คอมโพเนนต์อื่นที่ใช้ `motion/react` ถูกห่อด้วย `withMotionScope` ซึ่งใส่ `<MotionConfig reducedMotion="user">` แต่ FollowUpChat โหลดตรงด้วย `dynamic()` ไม่มี MotionConfig ครอบเลย · กฎ CSS `@media (prefers-reduced-motion)` ใน globals.css:1075 คุมได้แค่ CSS animation/transition ไม่ถึงแอนิเมชัน JS ของ motion
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้ที่เปิด "ลดการเคลื่อนไหว" (เวียนหัว/vestibular) ยังเห็นฟองแชทเด้ง `y`/`scale`/`x` ทุกข้อความ ตลอดบทสนทนา (WCAG 2.3.3) — ขัดกับคำยืนยันในภาคผนวก B ว่า reduced-motion "ครบ"
- แนวแก้: โหลดผ่าน `withMotionScope(() => import(".../FollowUpChat")...)` แบบเดียวกับ TarotFlow หรือครอบ `<MotionConfig reducedMotion="user">` ใน ReadingChatBody

### 🟡 A5-08 · สมุดบันทึกดวงที่เปิดจากหน้า `/account` ข้าม MotionConfig เช่นกัน
- ที่: `src/components/account/AccountClient.tsx:18-21` (เทียบ `src/components/home/TarotFlow.tsx:71` ที่ใช้ `withMotionScope`)
- ปัญหา: ReadingHistoryModal ตัวเดียวกันถูกโหลดสองทาง — หน้าแรกห่อ `withMotionScope` (reducedMotion="user") แต่หน้าบัญชีใช้ `dynamic()` ตรง ๆ
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้ reduced-motion เปิดสมุดจากหน้าบัญชีแล้วแผงยังสไลด์ `y` เข้ามา (`ReadingHistoryModal.tsx:205-213`) ต่างจากเปิดจากหน้าแรก — พฤติกรรมไม่ตรงกันสองหน้า
- แนวแก้: เปลี่ยนเป็น `withMotionScope(...)` แบบ TarotFlow · ควรมีด่านห้าม `dynamic(import(...))` ไฟล์ที่ import `motion/react` โดยไม่ผ่าน withMotionScope

### 🟠 A5-09 · ข้อความสีฮาร์ดโค้ดตกเกณฑ์คอนทราสต์ 4.5:1 บนแผงกระจก
- ที่: `src/components/reading/StreamReader.tsx:467` (`text-[#8C7A6B]` 11px italic "ภาพบนหน้าไพ่") · `#7A6F5D` 14 จุด: `src/components/encyclopedia/BirthCardCalculator.tsx:251,334,346,418,423,457,502,590,602,614` · `src/components/spread/TopicSpreadList.tsx:67,96` · `src/components/spread/SpreadDetailClient.tsx:193` · `src/components/love/LoveOneCardClient.tsx:490`
- ปัญหา: คำนวณตามสูตร WCAG บนสีแผงกระจกจริง (`--glass-fill` 0.62 ทับจุดมืดสุด `#DBDCD0` ≈ `#F1F0E8` ตามวิธีของ HANDOFF_GLASS_HOME): `#8C7A6B` = **3.59:1** · `#7A6F5D` = **4.31:1** — ทั้งคู่ต่ำกว่า 4.5 สำหรับตัวอักษร 11–14px (โทเคน `text-muted` #635B4E ได้ 5.86)
- ผลกระทบ/สถานการณ์พัง: คำอธิบายใต้หัวข้อหน้า birth-card · คำโปรยผัง · ข้อความ "ภาพบนหน้าไพ่" อ่านยากกลางแดด/จอสว่างต่ำ · ด่าน a11y ไม่จับเพราะอ่านโทเคน ไม่อ่านสีฮาร์ดโค้ด (กับดักที่ HANDOFF_GLASS_HOME เตือนไว้)
- แนวแก้: เปลี่ยนเป็น `text-muted` ทั้งหมด (เปลี่ยนคลาสล้วน ไม่กระทบเลย์เอาต์) และเพิ่ม `#7A6F5D`/`#8C7A6B` ในรายการห้ามของด่านสีฮาร์ดโค้ด

### 🟠 A5-10 · ลดความทึบโทเคนสีตัวอักษร (`/70` `/80`) จนตกเกณฑ์ 4.5:1
- ที่: `src/components/reading/QuickChatResult.tsx:206` (`text-gold-ink/80` 11px "อ่านสรุปนี้ก่อน") · `:227` (`text-gold-ink/70` 11px) · `src/components/encyclopedia/CardYesNoAnswer.tsx:56` (`text-muted/80` 12px — ข้อความปฏิเสธความรับผิดใน 78 หน้าไพ่) · `src/components/encyclopedia/SemanticSearchPanel.tsx:202` · `src/components/pick-a-card/PickACardClient.tsx:661` (`text-muted/80` 11px + `animate-pulse`)
- ปัญหา: โทเคนผ่านเกณฑ์ แต่พอคูณ opacity กลับตก — คำนวณบนพื้นจริง: gold-ink/70 = **2.82–3.08** · gold-ink/80 = **3.36–3.74** · muted/80 = **3.75–4.15** (บนขาว/กระจก/canvas) ทั้งหมดเป็นตัวอักษร ≤12px
- ผลกระทบ/สถานการณ์พัง: หัวบล็อกสรุปผลคำทำนาย (ส่วนที่ "ให้อ่านก่อนใคร") และคำเตือนในหน้าไพ่อ่านยาก · ด่าน a11y ที่อ่านค่าโทเคนมองไม่เห็นเพราะ `/80` ไม่ใช่สีใหม่
- แนวแก้: ตัด suffix opacity ออก (ใช้ `text-gold-ink` / `text-muted` เต็ม) · เพิ่มกฎด่าน: ห้าม `text-(muted|gold-ink|ink)/\d\d` กับข้อความ (ยกเว้น SVG ตกแต่ง `aria-hidden`)

### 🟡 A5-11 · แท็บ "อ่านรายใบ / สรุปภาพรวม" ในหน้าผลคำทำนายชี้ไปแผงที่ไม่มีอยู่
- ที่: `src/components/reading/StreamReader.tsx:215-251`
- ปัญหา: `aria-controls="chamber-panel-card"` / `"chamber-panel-summary"` แต่ทั้งไฟล์ (และทั้ง `src/`) ไม่มี element ที่มี id นี้ ไม่มี `role="tabpanel"` · ไม่มี roving `tabIndex` และไม่มีปุ่มลูกศรซ้าย/ขวา (ต่างจาก `CardsExplorer.tsx:257-266` · `SpreadCardSelector.tsx:269-281` ที่ทำครบ)
- ผลกระทบ/สถานการณ์พัง: screen reader ประกาศ "tab 1 of 2" แต่กระโดดไปแผงไม่ได้ · ARIA อ้างอิง id ผิด (axe: `aria-valid-attr-value`) · ผู้ใช้คีย์บอร์ดคาดหวังลูกศรตามแพตเทิร์น tab แต่ไม่ทำงาน — หน้านี้คือหน้าที่สำคัญที่สุดของเว็บ
- แนวแก้: ใส่ `id="chamber-panel-card|summary" role="tabpanel" aria-labelledby="chamber-tab-..."` ที่แผงเนื้อหา + `tabIndex={active?0:-1}` + onKeyDown ลูกศรแบบ CardsExplorer

### 🟠 A5-12 · ข้อผิดพลาดหลักของพิธีเปิดไพ่ (หน้าแรก) ไม่ประกาศให้ screen reader
- ที่: `src/components/home/TarotFlow.tsx:1494-1496` · (แบบเดียวกัน `src/components/marketplace/BookQueueModal.tsx:102-104`)
- ปัญหา: กล่อง `errorMsg` ที่โผล่ระหว่างสับ/จั่ว/เริ่มอ่าน ไม่มี `role="alert"` หรือ `aria-live` และไม่มี live region ครอบ — ต่างจาก StreamReader:283 · QuickChatResult:124 · BirthCardCalculator · BuyCreditsModal ที่ใส่ `role="alert"` แล้ว (สถานะผิดพลาดไม่สม่ำเสมอทั้งเว็บ)
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้ตาบอดกดจั่วไพ่แล้วเซสชันล้ม/ข้อมูลไพ่หาย (กรณีกฎข้อ 14 ที่ต้องบอก "โหลดใหม่") — ไม่ได้ยินอะไรเลย คิดว่าระบบค้าง (WCAG 4.1.3) · BookQueueModal: กดยืนยันคิวโดยไม่ติ๊ก PDPA ก็ไม่ได้ยินข้อความเตือน
- แนวแก้: เพิ่ม `role="alert"` ที่ `<div>` ของ error ทั้งสองจุด (หรือห่อด้วย `aria-live="assertive"` ที่อยู่ใน DOM ตลอด) · พิจารณาทำคอมโพเนนต์ `<ErrorNotice>` กลางใช้ร่วม

### 🟠 A5-13 · ปุ่มตัวกรอง/สวิตช์โหมดบอกสถานะ "ถูกเลือก" ด้วยสีอย่างเดียว (ไม่มี aria-pressed)
- ที่: `src/components/encyclopedia/BirthCardCalculator.tsx:328,340` (สลับ พ.ศ./ค.ศ.) · `src/components/encyclopedia/AllCardsTable.tsx:120` (แท็บชุดไพ่ `/cards/all`) · `src/components/history/ReadingHistoryModal.tsx:356,367,380,393` (ตัวกรองผล) · `src/components/marketplace/BookQueueModal.tsx:122,133` (คิวสด/จองล่วงหน้า) · `src/components/readers/ReadersDirectory.tsx:78,90` (ความถนัด)
- ปัญหา: ทุกจุดสลับแค่คลาสสี (`isActive ? "btn-gold-glass" : ...`) ไม่มี `aria-pressed`/`aria-selected`/`aria-current` (ขณะที่ CardsExplorer/SpreadCardSelector ทำครบแล้ว)
- ผลกระทบ/สถานการณ์พัง: สำคัญสุดที่ BirthCardCalculator — ผู้ใช้ screen reader ไม่รู้ว่าตอนนี้ช่องปีเกิดตีความเป็น พ.ศ. หรือ ค.ศ. → กรอก 1990 ขณะอยู่โหมด พ.ศ. ได้ไพ่ประจำตัวผิด (หรือ error) โดยไม่รู้สาเหตุ (WCAG 1.3.1/4.1.2) · BookQueueModal: ไม่รู้ว่ากำลังจองคิวแบบไหน
- แนวแก้: ใส่ `aria-pressed={isActive}` ให้ปุ่มกลุ่มสลับ และห่อกลุ่มด้วย `role="group" aria-label="..."` (หรือเปลี่ยนเป็น radio group)

### 🟡 A5-14 · เลขลำดับบนหลังไพ่ในพัดไพ่ (#1–#78) คอนทราสต์ ~2:1
- ที่: `src/components/deck/InteractiveCardFan.tsx:101-102` (`text-gold-ink/90` + `opacity-80` บน `.card-back-pattern` `#382518` — globals.css:966)
- ปัญหา: สีทองเข้ม `#8F5C1A` ถูกออกแบบมาสำหรับพื้นสว่าง แต่วางบนหลังไพ่น้ำตาลเข้ม — เต็มความทึบได้ 2.57:1 พอคูณ 0.9×0.8 เหลือ **1.97:1** ที่ 12px (โทเคนผูกกับพื้นที่ที่วาง — บทเรียนข้อ 3 ของ HANDOFF_UX_UI_AUDIT ซ้ำอีกครั้ง)
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้สายตาเลือนรางมองไม่เห็นเลขใบในขั้นจั่วไพ่ (ใช้อ้างอิง "ไพ่ใบที่ N" ที่ aria-label ประกาศ) · ด่านโทเคนไม่จับเพราะ gold-ink ผ่านบนพื้นสว่าง
- แนวแก้: ใช้สีทองอ่อนสำหรับพื้นมืด (เช่นโทนเดียวกับ `rgba(228,192,159)` ในลาย card-back ≈ `#E4C09F` ได้ >7:1) และเอา opacity ซ้อนออก หรือถ้าเป็นลายประดับล้วนให้ `aria-hidden` และยอมรับว่าไม่ใช่ข้อความ
PROGRESS: [x] dialogs/modals (src/lib/use-dialog-behavior + 6 modals)

### 🟠 A5-15 · `text-gold` (#A58A5C) ยังถูกใช้เป็นตัวอักษร 37 จุด — ด่าน palette-drift จับแค่ที่มีคลาสขนาด "เล็ก" ติดมาด้วย
- ที่: หัวข้อ `<h2 className="text-lg font-bold text-gold">` ทุกหัวข้อใน `src/app/_shared/pages/privacy-th.tsx:53,86,105,124,153,204` · `privacy-en.tsx` 6 จุด · `contact-th.tsx:97,113,129,153,169` · `contact-en.tsx` 5 จุด · `about-th.tsx:115,134,151,163,185,201` (รวม "ถ้าคุณกำลังรู้สึกแย่มาก" ที่นำไปสู่สายด่วน) · ข้อความสืบทอดขนาดจากพ่อ: `src/components/history/ReadingHistoryModal.tsx:492,635` · `src/components/blog/ArticleReadingClient.tsx:65,251` · `src/components/encyclopedia/CardDetailView.tsx:133,212` · `src/components/encyclopedia/CardsExplorer.tsx:292` · `src/components/spread/SpreadDetailClient.tsx:163,269`
- ปัญหา: `#A58A5C` ได้ 3.29 บนขาว · 2.87 บนแผงกระจก · 2.83 บน canvas — `text-lg` (18px) bold ยัง **ไม่ใช่** "ตัวใหญ่" ตาม WCAG (ต้อง ≥18.66px bold หรือ 24px) จึงต้องได้ 4.5 และบนกระจกตกแม้เกณฑ์ 3:1 · `scripts/qa/test-palette-drift.ts:149` ตรวจ `GOLD_AS_TEXT && SMALL_TEXT` บนคลาสเดียวกัน จึงปล่อยผ่านทั้งหัวข้อ `text-lg` และ `<span className="text-gold">` ที่ไม่มีคลาสขนาด (รับ 13px จากพ่อ)
- ผลกระทบ/สถานการณ์พัง: หัวข้อทุกหัวในหน้า about/privacy/contact (หน้าที่ต้องอ่านเพื่อความเชื่อใจ + PDPA) และหมวดบทความ/ชื่อแม่หมอ อ่านยาก — ตรงข้ามกับที่ UX-14 ประกาศว่าปิดแล้ว
- แนวแก้: เปลี่ยนเป็น `text-gold-ink` ทั้ง 37 จุด · แก้ด่านให้ถือว่า "ไม่มีคลาสขนาด" และ `text-lg`/`text-xl` ที่ไม่ใช่ ≥24px เป็นตัวเล็กด้วย (หรือกลับด้าน: อนุญาต `text-gold` เฉพาะ svg/border/decoration)
PROGRESS: [x] contrast / color tokens (src/components, src/app/_shared)

### 🟡 A5-16 · ผลการแชร์/คัดลอกลิงก์ไม่ประกาศ และคัดลอกพลาดแล้วเงียบ
- ที่: `src/components/reading/ShareModal.tsx:553-562` (toast ภายในหน้าต่างแชร์ ไม่มี `role="status"`/`aria-live`) · `astro/scripts/article-share.ts` (`if (!ok) return;`) + ป้าย `src/components/blog/ArticleReadingClient.tsx:248`
- ปัญหา: ShareModal แสดงข้อความ "คัดลอกข้อความแล้ว! กำลังเปิด Facebook…" / "ไม่สามารถเปิดแอปได้ กรุณากดปุ่มบันทึกรูปภาพแทน" ในกล่องที่ mount ใหม่ทุกครั้งโดยไม่มี live region (ขณะที่ `ToastNotification.tsx:103` ทำถูกแล้ว) · ปุ่ม "คัดลอกลิงก์" ในบทความ: เปลี่ยนป้ายเป็น "คัดลอกลิงก์สำเร็จ!" โดยไม่มี live region และถ้า clipboard ถูกปฏิเสธ (iOS WebView/LINE in-app, http) ไม่มีข้อความใดเลย
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้ screen reader ไม่รู้ว่าแคปชันถูกคัดลอกแล้ว/แชร์ล้ม · ผู้ใช้ทั่วไปใน LINE in-app browser กดคัดลอกแล้วไม่มีอะไรเกิดขึ้น นึกว่าปุ่มเสีย
- แนวแก้: ห่อ toast ด้วย `<div role="status" aria-live="polite">` ที่อยู่ใน DOM ตลอด · ใน article-share ใส่ `aria-live="polite"` ที่ `data-copy-label` และแสดง "คัดลอกไม่ได้ ลองกดค้างที่แถบที่อยู่แทน" เมื่อ `ok === false`

### 🟠 A5-17 · ปุ่ม "ขยาย" บนไพ่ในผังกดด้วยคีย์บอร์ดไม่ได้ (ถูกช่องไพ่แม่ที่เป็น role="button" กลืน)
- ที่: `src/components/spread/SpreadBoard.tsx:181-199` (ช่องไพ่ `role="button"` + `onKeyDown` ที่ `preventDefault()` Enter/Space) ครอบ `<button>` ขยาย `:211-224`
- ปัญหา: (1) interactive ซ้อน interactive (ARIA ห้าม `button` ใน `role="button"` — children presentational) (2) กด Enter/Space ที่ปุ่ม "ขยาย" → keydown bubble ขึ้นไปที่ช่องแม่ ซึ่งเรียก `e.preventDefault()` แล้ว `handleCardClick` — การ preventDefault บน keydown ยกเลิกการ activate ปุ่มลูก (มี `stopPropagation` เฉพาะใน onClick ไม่ใช่ onKeyDown)
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้คีย์บอร์ดเปิด CardZoomModal จากผังไม่ได้เลย กดแล้วกลายเป็นเลือกไพ่ใบนั้นแทน · screen reader อาจไม่ประกาศปุ่ม "ขยาย" เพราะอยู่ในลูกของ role=button
- แนวแก้: ใน onKeyDown ของช่องแม่ใส่ `if (e.target !== e.currentTarget) return;` (แก้เร็ว) · ระยะยาวย้ายปุ่มขยายออกมาเป็นพี่น้องของช่องไพ่ (absolute ทับตำแหน่งเดิม) ไม่ซ้อนใน role=button

### 🟠 A5-18 · `/daily` และ `/love/1-card`: จั่วไพ่ล้มแล้วเงียบ ไม่มีข้อความ "โหลดใหม่"
- ที่: `src/components/reading/one-card/OneCardRitual.tsx:125-131` (oracle.run) · `:135-155` (useEffect ประกอบไพ่) · ตัวแสดง error อยู่ใน `AiReadingPanel` ที่ `:351` ซึ่งเรนเดอร์เฉพาะ `status === "revealed"`
- ปัญหา: (1) ถ้า `start`/`shuffle` ล้ม (เน็ตหลุด/5xx/429) `use-ai-reading.ts:425` ส่ง `fail` เข้า `oracle.state` แต่ตอนนั้น `status` ยังเป็น `"idle"` — ไม่มีจุดไหนในจังหวะ idle อ่าน `oracle.state` เลย ปุ่มแค่กลับเป็น "เปิดไพ่ 1 ใบ" (2) ใน useEffect `throw new Error("ไม่พบข้อมูลไพ่ กรุณาโหลดใหม่อีกครั้ง")` อยู่ใน `void (async…)()` → กลายเป็น unhandled rejection ข้อความนี้ไม่เคยถึงผู้ใช้ (เช่นเดียวกับกรณี `getDeck()` โหลด chunk ไม่ได้)
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้กด "เปิดไพ่" → ปุ่มขึ้น "กำลังเชื่อมสัญญาณ…" แล้วเด้งกลับเฉย ๆ ไม่มีคำอธิบาย ต่างจากหน้าแรก (TarotFlow:1494) ที่มีกล่อง error + ปุ่มโหลดใหม่ — ขัดเจตนากฎเหล็กข้อ 14 ที่ต้อง "แจ้งผู้ใช้ให้โหลดใหม่" · ทั้งสองหน้าเป็นหน้าทราฟฟิกสูง
- แนวแก้: ในจังหวะ idle แสดง `oracle.state` ที่เป็น error ด้วยกล่อง `role="alert"` + ปุ่ม "ลองอีกครั้ง" (ใช้คอมโพเนนต์ร่วมกับ TarotFlow) · ใน useEffect เปลี่ยน `throw` เป็น `setLocalError(...)` แล้ว catch `getDeck()` ด้วย
PROGRESS: [x] src/components (reading, history, spread, deck, encyclopedia, marketplace, readers, one-card, blog)

### 🟠 A5-19 · ลบบันทึกคำทำนายทีละรายการด้วยการแตะ ✕ ครั้งเดียว — ไม่ยืนยัน ไม่มี undo และโฟกัสหลุด
- ที่: `src/components/history/ReadingHistoryModal.tsx:107-113` (handleDelete) · ปุ่ม `:500-507`
- ปัญหา: ปุ่ม ✕ (`p-1 text-xs` + `tap-overlay-y` ขยายแค่แนวตั้ง → กว้างจริง ~16px) วางชิดวันที่ในการ์ดที่ทั้งใบกดได้ (A5-02) ลบทันทีโดยไม่ confirm/undo — ขณะที่ "ล้างทั้งหมด" (`:115-119`) มี confirm · หลังลบ ปุ่มที่ถือโฟกัสหายจาก DOM → โฟกัสตกไป `<body>` หลุดออกนอก dialog (focus trap ของ useDialogBehavior ไม่ดึงกลับ)
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้มือถือตั้งใจแตะการ์ดเพื่อกางดูคำแนะนำ แต่นิ้วโดน ✕ → คำทำนายพร้อม "บันทึกผลจริง" ที่พิมพ์ไว้หายถาวร (เก็บใน localStorage ไม่มีสำรอง) · ผู้ใช้คีย์บอร์ดลบแล้ว Tab ต่อไปโดนหน้าหลังฉาก
- แนวแก้: แสดง toast "ลบแล้ว · เลิกทำ" 5 วินาที (หรือ confirm แบบเดียวกับล้างทั้งหมด) · ขยายเป้ากดเป็น ≥24×24 (`min-w-6 min-h-6`) · หลังลบย้ายโฟกัสไปการ์ดถัดไป/ช่องค้นหา

### 🟡 A5-20 · ปุ่ม "▼ ดูวิธีคำนวณ" ใน Provably Fair ไม่มี aria-expanded และให้ SR อ่านสัญลักษณ์สามเหลี่ยม
- ที่: `src/components/reading/ProvablyFairPanel.tsx:380-398`
- ปัญหา: ปุ่มกาง/หุบคู่มือตรวจสอบเอง ใช้ `▲/▼` ในข้อความ ไม่มี `aria-expanded`/`aria-controls` (ปุ่มแผงหลักของไฟล์เดียวกัน `:102-103` ทำถูกแล้ว)
- ผลกระทบ/สถานการณ์พัง: screen reader อ่าน "black down-pointing triangle ดูวิธีคำนวณ, button" และไม่รู้ว่ากดแล้วเนื้อหากางออกที่ไหน — ฟีเจอร์ "พิสูจน์ความยุติธรรม" คือจุดขายหลักของเว็บ
- แนวแก้: `aria-expanded={showIndependentGuide} aria-controls="pf-independent-guide"` + ใส่ id ที่แผง · ห่อสามเหลี่ยมด้วย `<span aria-hidden="true">`

### 🟡 A5-21 · เลื่อนแบบ smooth ที่สั่งจาก JS ไม่ฟัง prefers-reduced-motion
- ที่: `src/components/reading/QuickFortunePicker.tsx:253` · `src/components/reading/PersonaCardSelector.tsx:100-101` · `src/components/reading/FollowUpChat.tsx:221-223` · `src/components/spread/SpreadCardSelector.tsx:219,231` · `src/components/pick-a-card/PickACardClient.tsx:120` (ค่าเริ่มต้น `"smooth"`)
- ปัญหา: กฎ `scroll-behavior: auto !important` ใน globals.css:1077-1088 คุมได้แค่การเลื่อนที่ไม่ระบุ behavior — เมื่อ JS ส่ง `behavior: "smooth"` ตรง ๆ เบราว์เซอร์ใช้ค่าจาก JS เสมอ · ใน repo มีฮุก `useMotionSafe` อยู่แล้ว (SpreadBoard ใช้ถูก) แต่ 5 จุดนี้ไม่ได้ใช้
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้ reduced-motion กดจุดสไลด์หัวข้อ/แม่หมอ หรือส่งข้อความแชท → รางไพ่และกล่องแชทเลื่อนไหลยาว ๆ ทุกครั้ง
- แนวแก้: `behavior: motionSafe ? "smooth" : "auto"` ผ่าน `useMotionSafe()` ทุกจุด
PROGRESS: [x] astro/pages · astro/layouts · astro/components · astro/scripts (header drawer/tabs/orientation ผ่าน)
PROGRESS: [x] src/app/globals.css (reduced-motion กลางครบ · ปัญหาอยู่ที่ JS — A5-07/08/21)
PROGRESS: [x] อิโมจิ/ภาษาไทย (ไม่พบ นะค่ะ · เเ · ไม้ยมกติดคำ ในข้อความที่แสดงผล)

## สรุป
- 🔴 0 · 🟠 13 (A5-01,02,04,05,07,09,10,12,13,15,17,18,19) · 🟡 8 (A5-03,06,08,11,14,16,20,21)
- ตรวจแล้วผ่าน (ไม่ต้องทำซ้ำ): เมนูลิ้นชักหัวเว็บ (visibility hidden + trap + Esc) · AuthModal trap (กรอง disabled แล้ว) · แท็บ /spreads (roving + ลูกศร) · CrisisNotice 1323 (min-h-11, สีโทเคน) · viewport ไม่ล็อกซูม · CardImage บังคับ alt
STATUS: DONE
