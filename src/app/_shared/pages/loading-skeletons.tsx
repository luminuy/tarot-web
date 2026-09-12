/**
 * ⏳ โครงกระดูกตอนโหลด (Loading Skeletons — UX-18)
 * ---------------------------------------------------------------------------
 * ก่อนหน้านี้ทั้งโปรเจกต์ **ไม่มี `loading.tsx` เลยสักไฟล์ใน 49 เส้นทาง**
 * Next.js App Router จะรอ server component เสร็จก่อนจึงวาดหน้าใหม่
 * เมื่อไม่มี fallback ผู้ใช้จึงเห็นหน้าเดิมค้างนิ่ง ๆ โดยไม่มีอะไรบอกว่าระบบกำลังทำงาน
 *
 * 🎯 กติกาของโครงกระดูกในบ้านนี้
 *
 * 1. **ต้องมีรูปร่างตรงกับเนื้อหาจริง** ไม่ใช่สปินเนอร์กลางจอ
 *    กริดไพ่ = สี่เหลี่ยมสัดส่วน 300:520 เท่ากับ `<CardImage>` จริง
 *    เพื่อไม่ให้เกิด layout shift ตอนของจริงมาแทน
 * 2. **ต้องมี `aria-busy` และชื่อบอกว่ากำลังโหลดอะไร** ไม่ใช่แค่กล่องเทา ๆ เงียบ ๆ
 * 3. **ต้องยังเห็นว่าเคลื่อนไหว** แม้ในโหมด `prefers-reduced-motion`
 *    `globals.css` เตือนไว้แล้วว่าห้ามใช้ `animation: none !important` เพราะจะฆ่า
 *    แอนิเมชันที่ทำหน้าที่สื่อ "สถานะกำลังทำงาน" จนผู้ใช้ไม่รู้ว่าระบบยังไม่ตาย
 *    — กฎนั้นย่อ duration ให้สั้นลงแทน ซึ่งถูกต้องแล้ว โครงกระดูกจึงใช้
 *    `animate-pulse` ได้ตามปกติ
 *
 * ⚠️ ห้ามใส่ข้อความจริงลงในโครงกระดูก — มันจะถูกอ่านออกมาสองรอบ
 * (รอบโครงกระดูก + รอบเนื้อหาจริง) ใช้ `aria-hidden` กับกล่องทุกใบ
 *
 * ⚠️ **ไฟล์นี้เป็น server component โดยเจตนา** (ไม่มี "use client") เพราะโครงกระดูก
 * ไม่ควรลาก JS เข้ามาแม้แต่ไบต์เดียว — มันมีชีวิตอยู่แค่เสี้ยววินาที
 * ผลคือใช้ hook `useLocale` ไม่ได้ ภาษาจึงต้องแยกเป็นคนละ export
 * (`CardsLoading` สำหรับไทย · `CardsLoadingEn` สำหรับอังกฤษ)
 *
 * ⚠️ ทุกครั้งที่เพิ่มโครงกระดูกใหม่ **ต้องเพิ่มคู่ภาษาอังกฤษด้วยเสมอ**
 * ไม่งั้น `aria-label` ภาษาไทยจะไปโผล่ในหน้า /en — ด่าน `test-en-routing`
 * จับได้ทันที (และจับผมได้จริงตอนเพิ่มไฟล์นี้รอบแรก)
 */

/** แถบข้อความหลอก 1 บรรทัด */
function Bar({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-md bg-inset animate-pulse ${className}`} />;
}

/** หัวเรื่องหน้า — ใช้ซ้ำได้ทุกหน้า */
function PageHeadSkeleton() {
  return (
    <div className="space-y-3 text-center">
      <Bar className="h-3 w-28 mx-auto" />
      <Bar className="h-7 w-3/4 mx-auto" />
      <Bar className="h-4 w-2/3 mx-auto" />
    </div>
  );
}

function Shell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      role="status"
      aria-busy="true"
      aria-label={label}
      className="min-h-screen bg-canvas px-4 py-6 sm:px-6 sm:py-10"
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
    </main>
  );
}

/** กริดไพ่ — สัดส่วน 300:520 ตรงกับ `<CardImage>` จริง จึงไม่เกิด layout shift */
function CardsLoadingBody({ label }: { label: string }) {
  return (
    <Shell label={label}>
      <PageHeadSkeleton />
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Bar className="w-full aspect-[300/520]" />
            <Bar className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function CardsLoading() {
  return <CardsLoadingBody label="กำลังโหลดคลังไพ่" />;
}

export function CardsLoadingEn() {
  return <CardsLoadingBody label="Loading card library" />;
}

/** รายการบทความ — การ์ดแนวนอนมีหัวข้อกับคำโปรย */
function BlogLoadingBody({ label }: { label: string }) {
  return (
    <Shell label={label}>
      <PageHeadSkeleton />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2.5 rounded-xl border border-line bg-surface p-5">
            <Bar className="h-3 w-20" />
            <Bar className="h-5 w-full" />
            <Bar className="h-5 w-4/5" />
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function BlogLoading() {
  return <BlogLoadingBody label="กำลังโหลดบทความ" />;
}

export function BlogLoadingEn() {
  return <BlogLoadingBody label="Loading articles" />;
}

/** คลังผัง — การ์ดที่มีแผนผังสี่เหลี่ยมจัตุรัสอยู่ด้านบน */
function SpreadsLoadingBody({ label }: { label: string }) {
  return (
    <Shell label={label}>
      <PageHeadSkeleton />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-line bg-surface p-5">
            <Bar className="h-32 w-full" />
            <Bar className="h-5 w-3/4" />
            <Bar className="h-3 w-full" />
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function SpreadsLoading() {
  return <SpreadsLoadingBody label="กำลังโหลดคลังผังพยากรณ์" />;
}

export function SpreadsLoadingEn() {
  return <SpreadsLoadingBody label="Loading spread library" />;
}

/** ทำเนียบแม่หมอ — การ์ดที่มีรูปกลมกับข้อความข้าง ๆ */
function ReadersLoadingBody({ label }: { label: string }) {
  return (
    <Shell label={label}>
      <PageHeadSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 rounded-xl border border-line bg-surface p-4">
            <Bar className="h-14 w-14 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bar className="h-4 w-2/3" />
              <Bar className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function ReadersLoading() {
  return <ReadersLoadingBody label="กำลังโหลดทำเนียบแม่หมอ" />;
}

export function ReadersLoadingEn() {
  return <ReadersLoadingBody label="Loading reader directory" />;
}
