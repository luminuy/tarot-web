# A3-frontend-reading

## ความคืบหน้า

## ข้อค้นพบ

### 🔴 A3-01 · ท่อ AI กลาง (`useAiReading`) ไม่ฟังเหตุการณ์ `error` และไม่มีด่าน "สตรีมจบแต่ไม่มี done" → ค้างสถานะ streaming ตลอดกาล
- ที่: `src/lib/reading/use-ai-reading.ts:377-420` (switch ไม่มี `case "error"` + หลัง `while` ไม่เช็กว่าได้ `done` หรือยัง)
- ปัญหา: เซิร์ฟเวอร์ `/api/reading/[id]/read` ส่ง `event: error` (route.ts:303, 471, 481 — ไพ่หาไม่เจอ / AI ล่ม / exception) แล้ว `close()` สตรีม แต่ hook ตก `default: break` แล้วออกจากลูปเงียบ ๆ ส่วน `TarotFlow.tsx:1312-1326` มีทั้ง `case error` และ guard `!streamCompleted` (P1-4) แต่ท่อกลางไม่ได้ลอกมา
- ผลกระทบ/สถานการณ์พัง: หน้า `/daily` · `/love/1-card` · `/pick-a-card` · `/cards/birth-card` เมื่อ AI ล่ม/สตรีมขาด → `state.status` ค้าง `"streaming"` ไม่มีข้อความผิดพลาด ไม่มีปุ่มโหลดใหม่ ผู้ใช้เห็นตัวโหลดหมุนไม่รู้จบ (เซิร์ฟเวอร์คืนโควตาแล้วแต่ UI ไม่รู้)
- แนวแก้: เพิ่ม `case "error": dispatch({type:"fail", message: payload.message || failMessage}); gotTerminal = true` และหลังลูป `if (!gotTerminal) dispatch({type:"fail", message: <ข้อความสตรีมขาด>})` แบบเดียวกับ TarotFlow

### 🔴 A3-02 · `OneCardRitual` ทิ้งค่า `isReversed` จากเซิร์ฟเวอร์ → โชว์ไพ่หัวตั้ง + คีย์เวิร์ดหัวตั้ง ขณะที่ AI อ่านเป็นไพ่กลับหัว
- ที่: `src/components/reading/one-card/OneCardRitual.tsx:137-156` (ใช้แค่ `oracle.rawDrawn[0]?.cardIndex`), `:288-296` (`<TarotCard>` ไม่ส่ง `isReversed`), `:324` (`keywords?.upright` ตายตัว)
- ปัญหา: `/shuffle` สุ่มกลับหัวจริง (`src/lib/tarot/shuffle.ts:155` `REVERSAL_RATE`) และ `/read` ให้ AI ตีความตามทิศนั้น แต่หน้า one-card ไม่เคยอ่าน `rawDrawn[0].isReversed` เลยสักจุด (ขณะที่ `PickACardClient.tsx:630` อ่าน)
- ผลกระทบ/สถานการณ์พัง: `/daily` · `/love/1-card` · birth-card — ผู้ใช้เห็นไพ่ตั้งตรงพร้อมคีย์เวิร์ดด้านบวก แต่คำอ่าน AI ด้านล่างพูดถึง "ไพ่กลับหัว" ขัดกันเองในหน้าเดียว ทำลายความน่าเชื่อถือ/Provably Fair (ภาพที่โชว์ ≠ ผลที่ตรวจสอบได้) · `onRevealed(drawnCard)` ส่งต่อผลผิดทิศไปยังสตรีก/ประวัติด้วย
- แนวแก้: เก็บ `const reversed = !!oracle.rawDrawn[0]?.isReversed` → ส่ง `isReversed={reversed}` ให้ `TarotCard` (คว่ำ/เปิด) และใช้ `resolveDisplayKeywords({..., isReversed: reversed})` แทน `keywords.upright` + ส่งทิศไปกับ `onRevealed`

### 🟠 A3-03 · `OneCardRitual` ไม่แสดง error ของขั้น start/shuffle และ effect ประกอบไพ่ `throw` ใน async ลอย → ผู้ใช้กดแล้วเงียบ
- ที่: `src/components/reading/one-card/OneCardRitual.tsx:141-151` (`void (async () => { ... throw new Error(...) })()`), `:351` (`AiReadingPanel` แสดง `oracle.state.error` เฉพาะตอน `status === "revealed"`)
- ปัญหา: (1) เมื่อ `/start` ตอบ 5xx / `/shuffle` 410 / ไพ่ไม่ครบ ท่อ dispatch `fail` แต่หน้านี้ยังอยู่ `status="idle"` ซึ่งไม่เรนเดอร์ `oracle.state.error` เลย (2) `DECK_TH[drawnIndex]` ไม่เจอ หรือ `getDeck()` โหลด chunk ล้ม → throw ใน IIFE ที่ไม่มีใครจับ = unhandled rejection
- ผลกระทบ/สถานการณ์พัง: ปุ่ม "เปิดไพ่" กลับมากดได้เฉย ๆ ไม่มีข้อความ "โหลดใหม่อีกครั้ง" ที่กฎเหล็กข้อ 14 บังคับ; เคส (2) ผู้ใช้เสียโควตาไปแล้ว (AI กำลังสตรีม) แต่ไม่เห็นไพ่ ไม่เห็นคำอ่าน ค้างที่หน้า idle
- แนวแก้: แสดง `oracle.state.error` ในจังหวะ idle ด้วย (หรือเรนเดอร์ `AiReadingPanel` ทุกสถานะเมื่อมี error) และ `catch` ใน IIFE → `setLoadError("ไม่พบข้อมูลไพ่ กรุณาโหลดใหม่อีกครั้ง")` แสดงบนจอ

### 🟠 A3-04 · `/daily` เรนเดอร์ `new Date()` ตอน render ในหน้า Astro static → วันที่ในป้ายค้างเป็น "วันบิลด์" + hydration mismatch ทุกวันที่ไม่ใช่วัน deploy
- ที่: `src/components/daily/DailyClient.tsx:112-117` (`Intl.DateTimeFormat(...).format(new Date())` ในตัว render) · island ถูก prerender จาก `astro/pages/daily.astro:17` (`client:load`, `output: "static"`)
- ปัญหา: HTML ถูกสร้างครั้งเดียวตอน build (โซนเวลา UTC ของเครื่องบิลด์) ข้อความวันที่จึงฝังเป็นวันบิลด์; เปิดหน้าวันอื่น/คนละโซนเวลา → ข้อความ server ≠ client → React 19 แจ้ง hydration mismatch แล้วทิ้ง DOM ทั้ง root เรนเดอร์ใหม่ฝั่ง client
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้/บอตที่ยังไม่รัน JS เห็น "วันที่ผิด" บนหน้า "ไพ่ประจำวัน"; หลัง hydrate มีกระพริบ + CLS + เสียงาน render ทั้ง island ทุกครั้งที่ไม่ใช่วัน deploy; ช่วง 00:00–07:00 น. ไทย วันบิลด์ UTC ต่างจากวันไทยอยู่แล้ว
- แนวแก้: ตั้ง state วันที่เป็น `null` แล้วคำนวณใน `useEffect` (หรือ `useSyncExternalStore` ที่ server snapshot = `null`) แสดง placeholder ระหว่างรอ; หรือใส่ `suppressHydrationWarning` บน element ป้ายพร้อมอัปเดตใน effect
- (ส่วนเสริม A3-02) ผลต่อเนื่อง: `DailyClient.tsx:167,172` และ `LoveOneCardClient.tsx:201,205,409-411` บันทึกประวัติ `isReversed: false` + `meanings.*.upright` ตายตัว → สมุดประวัติบันทึกทิศไพ่ผิดด้วย ต้องแก้พร้อมกันโดยรับทิศจาก `onRevealed`
PROGRESS: [x] src/lib/reading/use-ai-reading.ts
PROGRESS: [x] src/components/reading/one-card
PROGRESS: [x] src/components/daily
PROGRESS: [x] src/components/love
PROGRESS: [x] src/components/pick-a-card
PROGRESS: [x] src/components/reading/FollowUpChat.tsx

### 🟡 A3-05 · `StreamReader` ขึ้นป้ายเขียว "อ่านคำทำนายครบถ้วนแล้ว" แม้สตรีมล้มกลางทาง
- ที่: `src/components/reading/StreamReader.tsx:210-218` (เลือกป้ายจาก `isStreaming` อย่างเดียว) ขณะที่ `:279` แสดงแบนเนอร์ `errorMsg` พร้อมกัน
- ปัญหา: reducer `fail` ตั้ง `status: "idle"` → `isStreaming=false` → ป้ายตกไปฝั่ง "ครบถ้วน" ทั้งที่มี `errorMsg` และคำอ่านอาจมีแค่ครึ่งเดียว
- ผลกระทบ/สถานการณ์พัง: AI ขาดกลางสตรีม → ผู้ใช้เห็นป้าย "ครบถ้วน" สีเขียวคู่กับแบนเนอร์ "โหลดใหม่อีกครั้ง" ขัดกันเอง อาจเข้าใจว่าคำอ่านครึ่งเดียวคือฉบับเต็ม
- แนวแก้: `isStreaming ? … : errorMsg ? <ป้ายโทนเตือน "คำทำนายยังไม่ครบ"> : <ป้ายครบถ้วน>` (หรือเช็ก `reading?.summary` ว่ามีจริงก่อนขึ้นป้ายครบ)
PROGRESS: [x] src/components/reading/StreamReader.tsx
PROGRESS: [x] src/components/reading/QuickFortunePicker.tsx+QuickChatResult.tsx
PROGRESS: [x] src/components/deck

### 🟡 A3-06 · `CardImage` ถอยไปไฟล์ในเครื่องได้ "ครั้งเดียวต่อ DOM node" — ถ้า component เดิมเปลี่ยนไพ่ ภาพใบถัดไปพังถาวร
- ที่: `src/components/card/CardImage.tsx:74-91` (`el.dataset.fellBack` + `sources.forEach(s => s.remove())`)
- ปัญหา: ธง `data-fell-back` และการถอด `<source>` ทำกับ DOM ตรง ๆ ซึ่ง React ไม่รู้; เมื่อ instance เดิมรับ `image` ใหม่ (สลับไพ่ในแผง/โมดัลที่ไม่ได้ใส่ `key` ต่อใบ) React แค่เปลี่ยน `src` ของ `<img>` ตัวเดิม → ธงยังค้าง → ภาพใหม่จาก ImageKit ล้มอีกจะไม่ถอยไป `/cards/...` อีกแล้ว และ `<source>` ที่ React ยังถืออยู่เป็นโหนดหลุดจาก DOM (webp/avif ใบใหม่ไม่ถูกใช้)
- ผลกระทบ/สถานการณ์พัง: ช่วง ImageKit ล่ม (M-03) ผู้ใช้กดสลับไพ่ใบที่ 2, 3 ในที่เดียวกัน → ได้ไอคอนภาพแตกแทนภาพไพ่จริง ขัดกฎเหล็กข้อ 8 ที่ตั้งใจให้ท่อเดียวทนทาน
- แนวแก้: ใส่ `key={src}` ให้ `<picture>`/`<img>` ใน `CardImage` (บังคับ remount ต่อภาพ ธงและ `<source>` เริ่มใหม่) หรือเก็บสถานะถอยเป็น `useState` ที่รีเซ็ตเมื่อ `src` เปลี่ยน แล้วเรนเดอร์ `<img src={fallback}>` แทนการแก้ DOM ตรง
PROGRESS: [x] src/components/card
PROGRESS: [x] src/components/spread

### 🟡 A3-07 · `BuyCreditsModal` ตั้ง `setTimeout(onClose, 2000)` หลังชำระสำเร็จโดยไม่มีตัวเคลียร์
- ที่: `src/components/entitlement/BuyCreditsModal.tsx:169-173`
- ปัญหา: ไทม์เมอร์ไม่ถูกเก็บ ref / ไม่ถูกล้างตอนปิดเองหรือ unmount
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้กดปิดเองแล้วเปิดโมดัลใหม่ภายใน 2 วินาที (เช่นจะซื้อเพิ่มอีกแพ็ก) → ไทม์เมอร์เก่ายิง `setCheckoutData(null)` + `onClose()` ปิดโมดัลที่เพิ่งเปิดใหม่ทิ้งกลางคัน / ล้าง `checkoutData` ของรายการใหม่ระหว่างกำลังจ่าย
- แนวแก้: เก็บ id ลง `useRef` แล้ว `clearTimeout` ใน `resetModalState` และใน `useEffect` cleanup (หรือเมื่อ `isOpen` เปลี่ยนเป็น false)
PROGRESS: [x] src/components/entitlement

### 🟠 A3-08 · ประวัติการดูดวง: ตัวกันคำตอบเก่า (`mutationRef`) รั่ว 2 ทาง — บันทึกโน้ตไม่นับรุ่น และ `fetchServerReadings` เขียน localStorage ก่อนถูกกัน
- ที่: `src/components/history/ReadingHistoryModal.tsx:141-147` (`handleSaveNote` ไม่มี `mutationRef.current += 1`) · `:95-101` + `src/lib/utils/history.ts:147-149` (`writeStorage(...)` อยู่ในฟังก์ชันดึง จึงเกิดก่อนเช็ก `generation`)
- ปัญหา: (1) เปิดโมดัล → GET `/api/journal` ยังไม่กลับ → ผู้ใช้เขียนโน้ตแล้วกดบันทึก → คำตอบเก่ากลับมา generation ยังตรง → `setReadings(serverItems)` ทับ โน้ตหายจากจอทันที (2) แม้ลบ/ล้างทั้งหมดจะเพิ่มรุ่นแล้ว แต่ `fetchServerReadings` เขียนรายการเก่าลง `STORAGE_KEY` ไปก่อนแล้ว ความเห็นในโค้ดบรรทัด 82-85 อ้างว่ากันไว้ แต่จริง ๆ กันแค่ state
- ผลกระทบ/สถานการณ์พัง: สมาชิกเน็ตช้า: โน้ต/ผลลัพธ์ที่เพิ่งบันทึกหายไปต่อหน้า และ localStorage ถูกทับด้วยรายการเก่า (รายการที่ลบไปแล้วโผล่กลับในแคช ใช้โดยหน้าอื่นที่อ่าน `getReadings()` เช่นชิปประวัติ/สตรีก จนกว่าจะซิงก์รอบหน้า)
- แนวแก้: เพิ่ม `mutationRef.current += 1` ใน `handleSaveNote`; ย้าย `writeStorage` ออกจาก `fetchServerReadings` ให้ผู้เรียกเขียนเองหลังผ่านเช็กรุ่น (หรือส่ง callback `shouldCommit()` เข้าไป)
PROGRESS: [x] src/components/history
PROGRESS: [x] src/components/safety

### 🟠 A3-09 · ShareModal: เปิดแท็บรอด้วย `"noopener"` → `window.open` คืน `null` เสมอ ตัวกันป็อปอัปบล็อกไม่เคยทำงาน + เหลือแท็บว่างค้าง
- ที่: `src/components/reading/ShareModal.tsx:366-376`
- ปัญหา: ตามสเปก HTML เมื่อใส่ `noopener` ใน features, `window.open()` **คืน `null` เสมอ** (แต่ยังเปิดแท็บ `about:blank` จริง) → `pendingPopup` เป็น null ทุกครั้ง → `openOrRedirect` ตกไปเรียก `window.open(target)` **หลัง** `await buildShareLink()` (สร้างภาพ + อัปโหลด R2 หลายวินาที) ซึ่งหมด user activation แล้ว
- ผลกระทบ/สถานการณ์พัง: กดแชร์ Facebook/X/Threads → ได้แท็บขาวว่างค้าง 1 แท็บ แล้วแท็บจริงโดน popup blocker บล็อก (iOS Safari บล็อกแน่นอนหลัง await) = ปุ่มแชร์หลัก 3 ช่องใช้ไม่ได้บนมือถือ; บนเดสก์ท็อปที่ไม่บล็อกได้ 2 แท็บ (ว่าง 1 + จริง 1)
- แนวแก้: เปิดแท็บรอด้วย `window.open("", "_blank")` (ไม่ใส่ noopener) เก็บ reference ไว้ แล้วตั้ง `pendingPopup.opener = null` ทันทีก่อน await จากนั้นเปลี่ยน `location.href`; ถ้าล้มให้ `pendingPopup.close()` ใน catch

### 🟡 A3-10 · ปุ่ม "ลองใหม่" ของคำอ่าน AI ในหน้า one-card = จั่วไพ่ใบใหม่ทั้งรอบ (ไพ่ที่ผู้ใช้เปิดไปแล้วเปลี่ยนใบ)
- ที่: `src/components/reading/one-card/OneCardRitual.tsx:351` (`onRetry={handleDraw}`) ร่วมกับ `:137-156` (effect ตั้ง `status="ready"` เมื่อ `drawnIndex` เปลี่ยน)
- ปัญหา: เมื่อ AI ล่มหลังผู้ใช้พลิกไพ่แล้ว (`status="revealed"`) การกดลองใหม่เรียก `oracle.run()` ใหม่ทั้งท่อ → `/start` + `/shuffle` เมล็ดใหม่ → ได้ไพ่อีกใบ → effect ดีดหน้ากลับไปไพ่คว่ำใบใหม่
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้เห็นไพ่ "The Star" แล้วคำอ่านล้ม กด "ลองใหม่" กลายเป็นไพ่ใบอื่น — ดูเหมือนระบบสุ่มจนกว่าจะได้ใบที่ถูกใจ ขัดหลัก Provably Fair / "ไพ่ใบเดียวที่ผู้ใช้จับ"; ถ้าบังเอิญได้เลขเดิม effect ไม่ทำงานและหน้าค้างที่ไพ่เดิม (พฤติกรรมไม่คงที่)
- แนวแก้: แยก "อ่านซ้ำ" ให้ยิงเฉพาะ `/api/reading/{id}/read` ด้วย `readingId`+token เดิม (เพิ่มเมธอด `retryRead()` ใน `useAiReading`) หรืออย่างน้อยเปลี่ยนป้ายปุ่มเป็น "เปิดไพ่ใหม่" และรีเซ็ต `status`/`drawnCard` ก่อนเรียก `handleDraw`
PROGRESS: [x] src/components/reading/ShareModal.tsx, ai/, TTS, ProvablyFair, AccuracyRating, DailyCardStrip
PROGRESS: [x] src/components/reading (rest)
PROGRESS: [x] src/lib/use-*.ts, motion.ts, pick-a-card
STATUS: DONE
