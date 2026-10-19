# A8-deadcode

> ผู้ตรวจ: A8 (โค้ดตาย · โค้ดซ้ำ · CSS/ไฟล์ตาย) · ฐาน `47efdef` · 2026-10-18
> ตรวจอย่างเดียว ไม่แก้โค้ด · ทุกข้อยืนยันด้วย `grep -rnw` ข้าม `src astro scripts mobile` + config

## ความคืบหน้า

## ข้อค้นพบ

### 🟡 A8-01 · ไฟล์กำพร้า 3 ไฟล์ + ภาพผัง SVG 26 ตัวที่ห้อยอยู่กับไฟล์กำพร้า (~800 บรรทัด) — `spread-categories.ts` ต้องเก็บ
- ที่:

| ไฟล์ | บรรทัด | ผู้ import | คำตัดสิน |
|---|---|---|---|
| `src/components/spread/spread-illustrations.tsx` (`renderSpreadIllustration`) | 95 | 0 (src/astro/scripts/mobile) | ✅ ลบได้ — แต่ลบแล้ว **ต้องลบ 26 `*SpreadArt` + แก้ด่าน** (ดูข้างล่าง) |
| `src/components/spread/SpreadPositionMap.tsx` | 60 | 0 | ✅ ลบได้ — ไม่มีด่านอ่านเป็นข้อความ · แก้คอมเมนต์ที่อ้างถึง 2 จุด: `src/lib/tarot/spread-map-geometry.ts:6` ("ตัวเลขที่ `SpreadPositionMap.tsx` ใช้วาด") และ `scripts/qa/test-spreads.ts:116` ("เรขาคณิตชุดเดียวกับที่ `SpreadPositionMap.tsx` ใช้วาดจริง") ให้ชี้ผู้ใช้จริง (`SpreadsLibrary` · `SpreadDetailClient` · `SpreadBoard` · `TopicSpreadList` · `RitualChrome` · `SpreadBuilder` + แอป `mobile/`) |
| `src/components/ui/use-rail.ts` (`useRail`) | 80 | 0 (`useRail` ใน `SpreadBoard.tsx:91` เป็นตัวแปรชื่อซ้ำ ไม่ใช่ฮุกนี้) | ✅ ลบได้ · แก้คอมเมนต์ `src/components/ui/RailArrows.tsx:4` ("สถานะมาจาก `useRail`") — ผู้ใช้ `RailArrows` ที่เหลือคนเดียว (`PickACardClient.tsx:394`) ส่ง `canPrev/canNext` จาก index เอง |
| `src/data/spread-categories.ts` | 46 | **`mobile/app/(tabs)/index.tsx:28` · `read.tsx:9`** ผ่าน `@core/*` | ❌ **เก็บไว้** — knip ไม่ไล่ `mobile/` · เคยถูกลบแล้ว CI มือถือแดงมาแล้ว (INC-0281) |

- ภาพผัง 26 ตัวที่ตายตาม: `src/components/ui/TarotArtIcons.tsx:143-760` (`DailySpreadArt` … `StudySpreadArt` · ~620 บรรทัด SVG) ผู้ import คนเดียวคือ `spread-illustrations.tsx` ที่เป็นไฟล์กำพร้า (`CelticCrossSpreadArt` ถูกเรียกใน `MonthlyTenSpreadArt:720` ซึ่งก็ตายเหมือนกัน · `DailySpreadArt` บรรทัด 203 เป็นแค่คอมเมนต์)
- ปัญหา: ไฟล์ทั้ง 3 ไม่มีผู้เรียกตั้งแต่ UI 2.0 เปลี่ยนหน้า `/spreads` ไปใช้ `mapLayout()` (แผน UI_2_0_SPREADS) และหน้าแรกเลิกใช้แถวปัด `useRail` (#629)
- ผลกระทบ: ไม่พังรันไทม์ (tree-shake ได้) แต่ ~830 บรรทัดที่ดูเหมือน "ของจริง" — คอมเมนต์ใน `spread-map-geometry.ts` ยังบอกว่าเป็น "แหล่งความจริงเดียวของตัวเลขที่ `SpreadPositionMap.tsx` ใช้วาด" ทำให้คนแก้เรขาคณิตไปตามไฟล์ที่ไม่ถูกเรนเดอร์แล้ว · ด่านกฎข้อ 7 (TarotArtIcons ต้องเป็นภาพไพ่ล้วน) ยังต้องสแกน SVG ตาย 620 บรรทัด
- 🪤 **กับดักด่าน**: `scripts/qa/test-seo-wave3.ts:66-75` assert ว่า `TarotArtIcons.tsx` ต้องมีข้อความ `export const LoveSixSpreadArt|MonthlyTenSpreadArt|FamilySpreadArt|LuckSpreadArt|StudySpreadArt` — เป็นด่านแบบ "ตรวจการมีอยู่" (บทเรียน INC-0195) ที่ปกป้องโค้ดตาย · ลบ SpreadArt แล้วด่านนี้ตกทันที ➔ ต้องแก้ด่านให้ตรวจสิ่งที่ผู้ใช้เห็นจริง (ผัง 5 ตัวมีแผนผังใน `SpreadsLibrary`/`mapLayout`) ใน PR เดียวกัน
- หลักฐาน: `grep -rn "spread-illustrations\|renderSpreadIllustration" src astro scripts mobile` = เฉพาะบรรทัดประกาศ + คอมเมนต์ใน SpreadPositionMap · `grep -rn "use-rail\|from.*use-rail" …` = 0 · `grep -rn "SpreadPositionMap" …` = ประกาศ 1 + คอมเมนต์ 2 · `grep -rhn "@core/" mobile` = `data/spreads` 8 · `data/personas` 4 · `data/cards` 4 · `spread-map-geometry` 2 · `data/spread-categories` 2
- แนวแก้: ลบ 3 ไฟล์ + 26 `*SpreadArt` (และ import ที่ค้าง) + แก้ `test-seo-wave3.ts` ข้อ 66-75 + แก้คอมเมนต์ 3 จุด · **ห้ามแตะ `spread-categories.ts`** · หลังลบรัน `npm run typecheck` ใน `mobile/` ด้วย (กฎ INC-0281)
- ความมั่นใจ: ยืนยันแล้ว

### 🟡 A8-02 · ประกาศที่ไม่มีใครเรียกเลยทั้งในไฟล์ตัวเองและข้างนอก — ลบได้ 11 จุด (~120 บรรทัด) + ไฟล์ `stats/breakdown.ts` ตายทั้งไฟล์
- ที่ (ยืนยันแล้วว่า `inner code refs = 0` และ ext = 0 ใน `src astro scripts mobile .github`):

| ไฟล์:บรรทัด | สัญลักษณ์ | อ้างอิง | คำตัดสิน |
|---|---|---|---|
| `src/lib/stats/breakdown.ts` (ทั้งไฟล์ 16 บรรทัด) + `src/lib/stats/read.ts:186` (`export { breakdown } from …`) | `breakdown` | 0 ผู้เรียก (คำว่า `breakdown` ใน `ElementalBalanceWidget`/`AiHealthPanel` เป็นตัวแปร/คอมเมนต์คนละตัว) | ✅ ลบไฟล์ + บรรทัด re-export · knip มองไม่เห็นเพราะ re-export |
| `src/lib/analytics-consent.ts:21-30` | `readConsent()` | 0 — โค้ดจริงอ่าน `localStorage.getItem(CONSENT_STORAGE_KEY)` ตรง ๆ (`analytics-bootstrap.ts:192,305`) · ด่าน `test-analytics-integrity.ts:334` ตรวจว่า banner **ไม่** เรียกมัน · คอมเมนต์ `RootHtml.tsx:176` อ้างถึง | ✅ ลบได้ (แก้คอมเมนต์ RootHtml.tsx:176 ให้ชี้ `CONSENT_STORAGE_KEY`) |
| `src/components/ui/TarotArtIcons.tsx:782` · `:813` · `:830` (~66 บรรทัด SVG) | `HeartTabIcon` · `CrystalBallTabIcon` · `AllSpreadsTabIcon` | 0 (ไอคอนแท็บรุ่นก่อน UI 2.0 — ที่เหลือใช้จริงคือ `SparkleTabIcon` `PentacleTabIcon` `SpeakerTabIcon` `CrownTabIcon` `ExpandTabIcon` และธาตุ 3 ตัว) | ✅ ลบได้ |
| `src/components/entitlement/EntitlementIcons.tsx:54-61` | `CoinSealIcon` | 0 | ✅ ลบได้ |
| `src/components/marketplace/ConsultIcons.tsx:61-65` | `ChevronIcon` | 0 ผู้ import จาก ConsultIcons (ผู้ใช้ไฟล์นี้มีแค่ `ConsultStage.tsx:2` · `readers/[id]/page.tsx:15` ซึ่งไม่ดึงตัวนี้ · ไฟล์อื่น ๆ ที่มีคำว่า `ChevronIcon` ประกาศของตัวเองใน `LineIcons.tsx`) | ✅ ลบได้ |
| `src/data/questions/index.ts:18-20` | `questionStaticParams()` | 0 (ผู้ใช้ข้อมูลชุดนี้ใช้ `QUESTIONS`/`getQuestion` — `sitemap.ts` · `spread-topic.tsx` · Astro `[slug].astro`) | ✅ ลบได้ |
| `src/lib/marketplace/booking-policy.ts:361` | `WEEKDAY_SHORT_LABELS` | 0 (`TH_WEEKDAY_SHORT` ในไฟล์ยังใช้ที่ :385 :409 — ลบแค่บรรทัด export) | ✅ ลบได้ |
| `src/lib/marketplace/offer.ts:23` | `CONSULTATION_PRICE_LABEL` | 0 (ป้าย "299 บาท · 30 นาที" ที่ผู้ใช้เห็นประกอบจาก `readerPriceThb` เอง) | ✅ ลบได้ |
| `src/lib/privacy/user-data.ts:83-85` | `registerUserDataSource()` | 0 · คอมเมนต์เขียนว่า "ฟีเจอร์ที่โหลดทีหลังลงทะเบียนเพิ่มได้" แต่ไม่มีฟีเจอร์ไหนลงทะเบียน (`SOURCES` เป็นอาร์เรย์คงที่) | ✅ ลบได้ — ⚠️ มี `registeredUserDataKeys()` ที่ด่าน 4 ตัวใช้ ห้ามแตะ |
| `src/lib/storage/keys.ts:30` | `STORAGE_PREFIX` | ใช้ที่เดียวคือ**ในคอมเมนต์** (`:116` "คีย์ใหม่ให้ใช้ `STORAGE_PREFIX` เสมอ") — `STORAGE_KEYS` เขียนสตริง `"tarot_…"` ตรง ๆ ไม่ได้ประกอบจากค่านี้ | ถอดแค่ export (หรือใช้ประกอบคีย์จริง) — ค่าคงที่ที่ไม่ได้ทำงานแต่คอมเมนต์สั่งให้ใช้ |
| `src/lib/marketplace/payments.repo.ts:11` · `:179` | `CONSULTATION_PRICE_SATANG` · `getPaymentByTicketId` | 0 | **เก็บไว้** — กลุ่ม "`payments.repo`" ที่รอบ 2026-09-17 §3.3 ตั้งใจเก็บ (ราคาสตางค์มีคอมเมนต์เตือนกันรับราคาจาก request) |

- ปัญหา: โค้ดค้างจากหน้า/ตัวห่อที่ย้ายไป Astro + UI 2.0 · `readConsent` และ `registerUserDataSource` ให้ภาพว่ามีทางเข้า "ทางการ" ทั้งที่ไม่มีใครเดินผ่าน
- ผลกระทบ: ไม่พังรันไทม์ (tree-shake ออก) · แต่ `readConsent` อยู่ในไฟล์ PDPA/ความยินยอมซึ่งคนจะอ่านเป็น "ทางอ่านความยินยอม" ทั้งที่โค้ดจริงอ่านด้วยวิธีอื่น 3 จุด
- หลักฐาน: สคริปต์ขูดต่อสัญลักษณ์ (นับบรรทัดที่ใช้ในไฟล์ตัวเองที่ไม่ใช่คอมเมนต์ + ไฟล์อื่นที่ใช้ใน `src astro scripts mobile .github knip.jsonc package.json`) ครบทั้ง 177 ตัว · ตรวจเพิ่มด้วยตา: `grep -rn "stats/breakdown\|registerUserDataSource\|questionStaticParams\|WEEKDAY_SHORT" src astro scripts docs` · ไม่มีด่านใดตรวจข้อความ `export const|function <ชื่อพวกนี้>` (`grep -rnE "export\s+(const|function)\s+(<177 ชื่อ>)" scripts` = 1 จุดเดียวคือ `joinGeminiAnswerParts` ดู A8-04)
- แนวแก้: ✅ ลบได้ปลอดภัย (ยกเว้นแถว `STORAGE_PREFIX` และ `payments.repo`) · หลังลบ `npm run typecheck` ทั้งเว็บและ `mobile/` (กฎ INC-0281 — ไม่มีจุดไหนในตารางนี้ที่ `mobile/` import)
- ความมั่นใจ: ยืนยันแล้ว

### 🟡 A8-03 · re-export "ทางผ่าน" 13 จุดที่ไม่มีใคร import ผ่านทางนั้น (ผู้ใช้ทุกคน import จากไฟล์ต้นทางตรง)
- ที่:

| barrel (ไฟล์:บรรทัด) | ชื่อที่ re-export เกิน | ผู้ใช้จริง import จาก |
|---|---|---|
| `src/data/spreads.ts:10-14` | `getSpreadName` `getSpreadTagline` `getSpreadDescription` `getPositionName` `getPositionMeaning` | `@/data/spreads-helpers` (`SpreadBoard.tsx:6` · `chat-fallback.ts:18` · `mock-reading.ts:17` …) |
| `src/data/articles.ts:1663-1664` | `getArticleCategory` `getArticleAuthor` | `@/data/article-helpers` |
| `src/lib/entitlement/copy.ts:36-39` | `SIGNUP_BONUS` `STANDARD_SPREAD_IDS` `MASTER_PERSONA_IDS` | `@/lib/entitlement/limits` |
| `src/lib/entitlement/entitlement.ts:141` | `GUEST_BLOCK_REASON` | `@/lib/entitlement/limits` (7 ไฟล์) |
| `src/lib/config/site.ts:19` | `isMeasurableHostname` | `@/lib/config/site-constants` (`analytics-bootstrap.ts:38`) |
| `src/lib/ai/gemini.ts:25` | `streamMockGeminiReading` (+ `MockReason`) | `@/lib/ai/mock-reading` (ด่าน 3 ตัวและ `run-eval-snapshots.ts` import ตรง) |

- ปัญหา: barrel ที่เหลือจากรอบแยกไฟล์ (helpers/limits/site-constants) — ชื่อเดียวกันมี 2 ทางเข้า คนใหม่เลือกทางที่ไม่ใช่ทางหลัก · `copy.ts`/`entitlement.ts` re-export ชุดเดียวกันซ้อน 2 ชั้น (`limits` ➔ `entitlement.ts` ➔ `copy.ts`)
- ผลกระทบ: ไม่พังรันไทม์ · เสี่ยงเกิด import วนถ้าวันหนึ่งใครสลับไปนำเข้าผ่าน barrel (`copy.ts` ➔ `limits` ➔ `copy.ts`)
- หลักฐาน: `grep -rn "<ชื่อ>" src astro scripts mobile | grep -E "import|from"` ต่อชื่อ = 0 ที่ import จาก barrel (ต้นทางตรงเท่านั้น) · knip ฟ้องตรงกัน · mobile = 0 (mobile import `@core/data/spreads` เฉพาะ `Spread` type / `SPREADS` ฯลฯ ไม่ใช่ 5 ฟังก์ชันนี้)
- แนวแก้: ✅ ลบชื่อออกจากรายการ re-export (ไม่ต้องแตะต้นทาง) · ระวัง: `mobile/` import `@core/data/spreads` อยู่ 8 จุด — ก่อนลบบรรทัด `spreads.ts:10-14` ให้ `grep -rn "getSpreadName\|getPosition" mobile` ซ้ำ (ตอนตรวจ = 0)
- ความมั่นใจ: ยืนยันแล้ว

### 🟡 A8-04 · export เกินที่ใช้ในไฟล์ตัวเอง 112 ตัว + type 8 ตัว + alias ซ้ำ 5 คู่ — ไม่ใช่โค้ดตาย ถอดแค่ `export` (รายงาน knip รก ทำให้ของตายจริง 13 จุดจมหาย)
- ที่: ตารางจัดกลุ่มตามไฟล์ (ทุกตัว: ใช้ในไฟล์ตัวเองจริง ≥ 1 จุดที่ไม่ใช่คอมเมนต์ · 0 ผู้ใช้ข้างนอก · `mobile/` = 0)

| ไฟล์ | สัญลักษณ์ที่ถอด `export` ได้ |
|---|---|
| `src/app/_shared/pages/` | `daily-th.tsx` `DAILY_DECO_CARDS` · `home.tsx` `buildWebAppJsonLd` · `question-page.tsx` `QUESTIONS_HUB_PATH` `questionPath` |
| `src/app/_shared/` | `root-metadata.ts` `SITE_AUTHORS` `SITE_CREATOR` `SITE_PUBLISHER` `SITE_ROBOTS` · `speculation-rules.ts` `PRERENDER_URLS_TH` `PRERENDER_URLS_EN` |
| `src/components/` | `account/AccountParts.tsx` `ChevronRight` · `admin/DailySummary.tsx` `shiftDay` · `admin/ExecCharts.tsx` `Legend` · `home/flow-access.ts` `ALLOWED` · `layout/nav-links.ts` `FOOTER_COLUMNS` · `reading/FollowUpChat.tsx` `ASK_ORACLE_SECTION_ID` |
| `src/data/` | `home-seo.ts` `HOME_FAQS` `HOME_HOW_TO_STEPS` · `personas.ts` `DEFAULT_PERSONA` · `spreads.ts` `SPREAD_BY_ID` |
| `src/lib/ai/` | `abort.ts` `STREAM_IDLE_TIMEOUT_MS` · `cosmic.ts` `calculateMoonPhase` `calculateDayRuler` · `gemini.ts` `GEMINI_OUTPUT_BUDGET` · `groq.ts` `GROQ_DEFAULT_TIMEOUT_MS` `GROQ_OUTPUT_CEILING` · `language.ts` `CHINESE_LEAK_MAP` `countObjectForeignCharacters` · `openrouter.ts` `getOpenRouterApiKey` · `prompt.ts` `SYSTEM_CORE_KNOWLEDGE_EN` · `thai-quality.ts` `collectThaiText` `AUTOFIXABLE_CODES` · `zodiac-context.ts` `personalZodiacCards` |
| `src/lib/` (ราก/auth/config/content/entitlement) | `account/delete-all-data.ts` `deleteAllDataConfirmMessage` · `analytics-bootstrap.ts` `loadRuntimeAnalyticsConfig` `scheduleWhenUserEngages` · `analytics.ts` `getGoogleAdsConversionLabel` · `auth/admin-auth.ts` `readAdminSessionId` · `auth/auth-tokens.repo.ts` `pruneExpiredAuthTokens` · `auth/password.ts` `PasswordConfigError` · `auth/reader-auth.ts` `READER_COOKIE_NAME` · `auth/session.ts` `AUTH_SESSION_MAX_AGE` `authCookieOptions` `isAppClientRequest` · `config/meta-length.ts` `clampText` · `content/overrides.ts` `CATEGORIES` `YESNO_VALUES` · `entitlement/copy.ts` `MEMBER_BENEFITS` `ACCESS_PLANS` · `entitlement/daily.ts` `yesterdayDateKey` · `entitlement/signin-gate.ts` `SIGN_IN_GATE_MESSAGE` `MEMBERS_ONLY_CHAT_MESSAGE` |
| `src/lib/` (journal/marketplace/media/platform/safety/schema/security/seo/stats) | `journal/journal.repo.ts` `computeContentHash` · `journal/journal.schema.ts` `JournalCardSchema` `JournalOutcomeSchema` `JournalMoodSchema` `JournalTagSchema` `JournalTagsSchema` `JournalBasisSchema` `JournalRitualKindSchema` `JournalRitualSchema` · `journal/patterns.ts` `BANNED_REFLECTION` · `marketplace/beauty-filter.ts` `BEAUTY_LEVELS` `BEAUTY_PRESETS` · `marketplace/booking-policy.ts` `BOOKING_LEAD_HOURS` `PAID_GRACE_MIN_LEAD_MINUTES` `formatDayLabel` · `marketplace/call.repo.ts` `CALL_PRESENCE_WINDOW_MS` `MAX_SDP_LENGTH` · `marketplace/invites.repo.ts` `INVITE_TTL_HOURS` · `marketplace/payment-gateway.ts` `checkoutBranding` `readCheckoutSession` · `marketplace/readers.repo.ts` `toPublicReaderProfile` · `marketplace/turn.ts` `TURN_CREDENTIAL_TTL_SEC` · `media/cloudinary.ts` `getCloudinaryCloudName` · `media/og-card-art.ts` `OG_CARD_ART` · `platform/kv-counter.ts` `flushCounters` · `safety/normalize.ts` `toneStrippedForm` `spacedForm` `squeezeRepeats` · `schema/reading.ts` `CardReadingSchema` · `security/abuse-guard.ts` `INJECTION_WINDOW_SEC` `INJECTION_COOLDOWN_SEC` · `security/ai-budget.ts` `getAiDailyCap` · `seo/rotating-neighbors.ts` `rotatingNeighbors` · `stats/entitlement-events.ts` `ENTITLEMENT_EVENTS` · `stats/read.ts` `previousDay` |
| `src/lib/` (studio/tarot/theme/users) | `studio/brand.ts` `MIN_TEXT_CONTRAST` `luminance` · `studio/draft.ts` `cardKey` · `studio/plan.ts` `defaultPassPriceThb` · `studio/queue-import.ts` `IMPORT_WINDOW_DAYS` `TICKET_ID` `customerSourceHash` · `studio/share.ts` `VIEW_COOKIE_PREFIX` · `tarot/card-image.ts` `getImageKitEndpoint` · `tarot/custom-spread-client.ts` `LOCAL_CUSTOM_SPREADS_MAX` `listLocalSpreads` `fetchMySpreads` · `tarot/custom-spread.repo.ts` `countCustomSpreads` · `tarot/custom-spread.server.ts` `CustomSpreadInputSchema` · `tarot/custom-spread.ts` `CUSTOM_MIN_CARDS` · `tarot/spread-map-geometry.ts` `MAP_CARD_W_MAX` `halfExtentOf` `mapYScale` · `tarot/zodiac.ts` `decanEnd` · `theme/theme-script.ts` `SITE_THEME_COLOR_DARK` `THEME_STORAGE_KEY` · `users/users.repo.ts` `getTokenVersion` |

- **ต้องเก็บ `export` (ห้ามถอด)**:
  - `src/lib/ai/gemini.ts:138` `joinGeminiAnswerParts` — ด่าน `scripts/qa/test-gemini-parts.ts:105` อ่านไฟล์เป็นข้อความแล้ว assert `"export function joinGeminiAnswerParts"` (ถอด `export` = ด่านตก) · เป็นด่านแบบ "ตรวจการมีอยู่" (INC-0195) ที่ผูกกับรูปแบบการเขียน
  - กลุ่มที่รอบ 2026-09-17 §3.3 / A7 ของ 2026-09-23 ตั้งใจเก็บ: `HOME_FAQS_EN` `HOME_HOW_TO_STEPS_EN` `MEMBER_BENEFITS_EN` `ACCESS_PLANS_EN` `CREDIT_PACKAGES_EN` (คู่อังกฤษ) · `CRISIS_RULES_TH` `CRISIS_RULES_LATIN` `FOREIGN_SCRIPT_REGEX` `LATIN_LEAK_MAP` (ตารางกฎความปลอดภัย/ภาษา) · `embedTexts` `payments.repo` (โครงสร้างรอเฟสถัดไป)
- type 8 ตัวที่ knip ฟ้อง (`FooterColumn` · `ApiOk` · `ApiFail` · `DigestChannel` · `JournalPatch` · `PickACardDraw` · `CardReading` · `StorageKey`): ไม่มีผู้ใช้เลยแม้ในไฟล์ตัวเอง (grep -w = 1 = บรรทัดประกาศ) · `ApiOk`/`ApiFail` เก็บตามกลุ่ม `apiOk/apiFail` ของ R-31 · ที่เหลือ 6 ตัวลบได้ (`CardReading` ใน `schema/reading.ts:131` — `flow-reading.ts` ที่เห็นชื่อนี้เป็นตัวแปรท้องถิ่น)
- alias ซ้ำ 5 คู่ที่ knip ฟ้อง (`LocaleLink|default` · `DECK|ALL_CARDS` · `DECK_SIZE|TOTAL_CARDS` · `refreshEntitlement|mutateEntitlement` · `getAppDB|getDB`): ทั้งสองชื่อยังมีผู้ใช้จริงทุกคู่ ➔ ไม่แตะ · ข้อสังเกต: `getDB` (alias ของ `getAppDB` ที่ `platform/db.ts:649`) ใช้ที่เดียวคือ `src/app/api/feedback/route.ts:3,65,109` ➔ เปลี่ยนเป็น `getAppDB` (อีก 55 ไฟล์ใช้ชื่อนี้) แล้วลบ alias ได้ · `TOTAL_CARDS` (`data/cards/index.ts:50`) ใช้แค่ด่าน `test-no-fake-card.ts:9,80`
- ปัญหา: จำนวนเพิ่มจากรอบก่อน (~90 ➔ 112 ตัวที่ใช้แค่ในไฟล์) จาก UI 2.0 / marketplace / studio ที่ทยอยเพิ่มโมดูลใหม่ · knip ตั้ง `ignoreExportsUsedInFile` เฉพาะ `type`/`interface` ไม่รวมค่า/ฟังก์ชัน ทำให้รายงาน 177 จุดมีของตายจริงแค่ ~65 (A8-01 ถึง A8-03) ที่เหลือคือ "export เกิน"
- ผลกระทบ: ไม่พังรันไทม์ · ความเสี่ยงคือ API ภายในที่ดูเหมือนสาธารณะ (เช่น `checkoutBranding` `readCheckoutSession` ใน `payment-gateway.ts` ที่ดูเหมือนเรียกจากนอกได้ — ทั้งที่จ่ายเงินจริงควรผ่านฟังก์ชันระดับสูงกว่า) และเสียงดังในรายงาน knip จนไม่มีใครอ่าน
- หลักฐาน: ต่อสัญลักษณ์: บรรทัดโค้ดในไฟล์ตัวเองที่ไม่ใช่คอมเมนต์ ≥ 1 · `grep -rlw <ชื่อ> src astro scripts mobile .github` ที่เหลือเป็นไฟล์ที่ประกาศชื่อเดียวกันของตัวเอง (`shiftDay` ซ้ำ 2 ไฟล์ · `ALLOWED` ซ้ำ 3 ไฟล์ · `cardKey` ซ้ำ 3 ไฟล์ · `CATEGORIES` ซ้ำใน `mobile/app/(tabs)/read.tsx:13` เป็นของมือถือเอง) · `grep -rnE "export\s+(const|function|class)\s+<ชื่อ>" scripts` = เฉพาะ `joinGeminiAnswerParts`
- แนวแก้: ถอดแค่ `export` ตามตาราง (เว้นรายการ "ต้องเก็บ") หรือทางลัด: ตั้ง `ignoreExportsUsedInFile: true` ใน `knip.jsonc` (รายงานจะเหลือแต่ของตายจริง) · ไม่เร่ง
- ความมั่นใจ: ยืนยันแล้ว

### 🟡 A8-05 · CSS ตายราว 9–10 KB ดิบ (~1.7%) หลัง UI 2.0 — กฎของคลาสที่ไม่มี markup ไหนใช้แล้ว 17 กลุ่ม + override โหมดมืดของ Tailwind 14 คลาส
- ที่: (ไล่ทั้ง 33 ไฟล์ใน `src/styles/` + `src/app/globals.css` + `src/app/theme-dark.css` ด้วย postcss — ดึง class จาก selector แล้วเทียบกับ token ทั้งหมดใน `src astro scripts public` · คลาสที่ประกอบแบบไดนามิก `is-${…}` · `--ui2-note-${n}` ตรวจมือแล้วว่ายังมีชีวิต · **ไฟล์ CSS ทุกไฟล์ยังถูก import** — ไม่มีไฟล์ CSS กำพร้า)

| ไฟล์:บรรทัด | คลาสตาย | ขนาดประมาณ | หมายเหตุ |
|---|---|---|---|
| `ui2-core.css:215` · `ui2-dawn.css:84,222` · `ui2-page.css:375` · `ui2-spreads.css:128,733` | `.ui2-btn-arrow` (ลูกศรเหลี่ยมวาดด้วย CSS ประดับปุ่ม — 7 กฎ) | ~1.0 KB | markup เลิกใช้แล้วเมื่อกฎข้อ 2 ขยาย (ห้ามลูกศรประดับปุ่ม) — กฎ CSS ค้าง |
| `ui2-page.css:577-680` · `ui2-dawn.css:93,96` | `.ui2-ph-links` `.ui2-ph-chips` (+`.is-scroll`) `.ui2-ph-chip` `.ui2-ph-tagline` (11 กฎ) | ~2.2 KB | แถบชิปลิงก์ใต้หัวหน้ารุ่นก่อน — แทนด้วยแท็บหมวดของ `Ui2Showcase` |
| `ui2-page.css:758` · `:903-928` | `.ui2-cx-panel` · `.ui2-mag-cover` `.ui2-mag-art` `.ui2-mag-title` (6 กฎ) | ~1.0 KB | หน้า cards/magazine รุ่นก่อน |
| `ui2-page.css:793` | `.bg-ink\/90` (Tailwind ในตัวเลือก `.card-tile-cv`) | 87 B | |
| `ui2-spreads.css:195` | `.ui2-sp-jump` (ตัวเดี่ยว — `-link` `-dot` `-count` ยังใช้) | 110 B | |
| `ui2.css:1311-1331,2614` | `.ui2-arrow-ne` (ลูกศรเฉียง CSS — 4 กฎ) | ~0.8 KB | ลูกศรประดับเช่นกัน |
| `v2-cards.css:9-25` | `.v2-cx-head` `.v2-cx-title` `.v2-cx-lede` | ~0.5 KB | |
| `v2-card-detail.css:217` · `v2-ritual.css:635` | `.v2-cd-h2` · `.v2-rt-go-arrow` | ~0.3 KB | |
| `globals.css:1640` · `:2554-2600` · `:2834` | `.anim-tarot-idle` · `.home-rail` (9 กฎ; `.home-rail-btn` ยังใช้โดย `RailArrows`) · `.mobile-preview-8/12` | ~1.0 KB | แถวปัดหน้าแรกเลิกใช้ใน #629 (ตรงกับไฟล์กำพร้า `use-rail.ts` ใน A8-01) |
| `theme-dark.css:311-320` | `html[data-theme="dark"] .hero-wash::after` `.hero-text-halo` `.hero-fan-card` | ~0.5 KB | หัวหน้าแรกรุ่นก่อน UI 2.0 |
| `theme-dark.css:371-439` | override ของ Tailwind arbitrary-value 14 คลาสที่ไม่มีใครเขียนในโค้ดแล้ว: `text-[#4A3E31]` `text-[#5E390A]` `text-[#8F2E1A]` `bg-[#F7F5F0]` `bg-[#F6F2EA]/70` `bg-[#F0FFF4]` `bg-[#FAF0ED]` `border-[#E8C5BE]` `decoration-[#E4DED2]` `to-[#F5EFE4]` `to-[#F7F3EB]` `hover:text-[#5E390A]` `hover:bg-[#DDD8CD]` `group-hover:text-[#E8D5B5]` | ~1.5 KB | 5 กฎเดี่ยวตายทั้งกฎ ส่วนที่เหลือเป็นสมาชิกตายในลิสต์ `:is(…)` |

- ปัญหา: UI 2.0 เปลี่ยนภาษาภาพหลายรอบ (หัวหน้า · ชิป · ลูกศร · แถวปัด) โดยลบ markup แต่ไม่ได้ลบกฎ CSS ตาม · custom property ที่ไม่มีใคร `var()` อ้าง: `--dur-instant` `--dur-slow` `--dur-ritual` (`globals.css:231-236,439-444` ประกาศ 2 รอบ) · `--z-content` `--z-header` · `--ui2-radius-lg` (`ui2-base.css:36`)
- ผลกระทบ: ไม่พังรันไทม์ · ต้นทุนจริงเล็ก (~10 KB ดิบ ≈ 1.5–2 KB หลังบีบ ในสไตล์ชีต 560 KB ทั้งชุด) — แต่ **`ui2-btn-arrow` / `ui2-arrow-ne` คือ "รูปทรงตกแต่งที่วาดด้วย CSS" ซึ่งกฎเหล็กข้อ 2 ห้ามไว้** ยังอยู่ในสไตล์ชีต: คนที่ใส่คลาสนี้ลงปุ่มใหม่จะได้ลูกศรกลับมาโดยไม่มีด่านจับ (ด่าน A5-03 ตรวจตัวอักษร/SVG ในโค้ด ไม่ได้ตรวจ CSS `border-top/right + rotate(45deg)`)
- หลักฐาน: สคริปต์ postcss ขูดทุกกฎที่ **ทุก selector ในรายการมีคลาสที่ไม่ปรากฏเป็น token ในโค้ดเลย** ➔ 71 กฎ · หักคลาสไดนามิกที่ตรวจมือแล้วยังใช้ (`is-wide/tall/amber/teal` จาก `Ui2Blocks.tsx:88,91` · `is-${tint}` `FrMock` · `is-${mode}` `SpreadBoard.tsx:229` · `is-t${tierIdx % 3}` `InteractiveCardFan.tsx:316`) ➔ เหลือ 53 กฎ ที่ยืนยันด้วย `grep -rF -e "<คลาส>" src astro scripts public` = 0 (ยกเว้น `ui2-sp-jump`/`home-rail` ที่พบเฉพาะคำต่อท้ายคนละคลาส) · ตัวเลขนี้ **ต่ำกว่าความจริง** เพราะนับเฉพาะกฎที่ตายทั้งกฎ (สมาชิกตายในลิสต์ `:is()` ไม่นับ ยกเว้นแถว theme-dark)
- แนวแก้: ✅ ลบกฎตามตารางได้ปลอดภัย · ควรเพิ่มด่านเล็ก ๆ ใน `test-code-debt` ให้เทียบคลาสใน `src/styles/**` กับโค้ด (สคริปต์เดียวกับที่ใช้ตรวจรอบนี้ ~40 บรรทัด) ถ้าอยากไม่ให้ค้างอีก
- ความมั่นใจ: ยืนยันแล้ว

### 🟡 A8-06 · API route 3 เส้นที่ไม่มีผู้เรียกเลยทั้งเว็บ · แอป · สคริปต์ · CI · cron (ยังเปิดรับคำขอจริงบน production)
- ที่: ไล่ครบ 121 เส้นใน `src/app/api/**/route.ts` — แปลง segment `[id]` เป็น wildcard แล้วค้นข้าม `src astro mobile public/sw.js scripts .github wrangler.jsonc package.json docs` (รวม template string `${…}` และตัวช่วย `makeStudioCall("/…")`) · เหลือ 22 เส้นที่ไม่มีผู้เรียกในโค้ดผลิตภัณฑ์ — คัดออกเมื่อเป็น cron (4) · webhook (1) · เส้นสตูดิโอที่เรียกผ่าน `studio-api.ts` `${path}` (14) ➔ เหลือ 3 + 1 สำรองไว้ให้ iOS:

| route | บรรทัด | ผู้เรียก | คำตัดสิน |
|---|---|---|---|
| `GET /api/admin/payouts` | `src/app/api/admin/payouts/route.ts` (45) | 0 — แผงแอดมินแท็บ "ยอดโอนให้แม่หมอ" ใช้ `/api/admin/bookings` ซึ่งคำนวณ `calculateReaderEarnings` ต่อแม่หมอซ้ำกันเอง (`bookings/route.ts:29`) · มีแค่ในเอกสาร (`MARKETPLACE.md:367,408`) | ✅ ลบได้ (ตรรกะซ้ำกับ `/api/admin/bookings`) · ⚠️ ถ้าเก็บ ต้องยืนยันว่าตรวจสิทธิ์ `requireAdmin` ทุกเมธอด (ตอนนี้มี `GET` เดียว) |
| `GET /api/readers` | `src/app/api/readers/route.ts` (17) | 0 — หน้า `/readers` อ่านจาก `listPublicApprovedReaders()` ตรง (`readers/(directory)/page.tsx:59`) · มีแค่ในสเปก | ✅ ลบได้ หรือประกาศเป็น API สาธารณะแล้วใส่แคช (ตอนนี้ไม่มี `Cache-Control` ➔ ทุกคำขอยิง D1) |
| `GET /api/marketplace/readers/[id]/availability` | `src/app/api/marketplace/readers/[id]/availability/route.ts` | 0 — หน้าแม่หมอ/หน้าจองเรียก `getReaderLiveAvailability` ฝั่งเซิร์ฟเวอร์ตรง (`readers/[id]/page.tsx:48` · `book/page.tsx:59`) · `/featured` คืนสถานะ live มาให้แล้ว | ✅ ลบได้ |
| `GET /api/config/app` | `src/app/api/config/app/route.ts` (27) | 0 ใน `mobile/` — **ตั้งใจเก็บ**: แผน iOS หัวข้อ 4.6 / ข้อ 0.7 ให้แอปถามเวอร์ชันขั้นต่ำ แต่แอป MVP ยังไม่เรียก (`grep -rn "config/app" mobile` = 0) | เก็บไว้ (รอแอปต่อสาย) |

- ปัญหา: route เหล่านี้เป็นเส้นสาธารณะ/แอดมินที่ไม่มีใครใช้ แต่ยังรับคำขอและแตะ D1 · `payouts` ต่างจาก `bookings` นิดเดียว ทำให้มีสองที่ที่คำนวณเงินส่วนแบ่งแม่หมอ (A2 ดูเรื่องความถูกต้องของ `calculateReaderEarnings` ไปแล้ว)
- ผลกระทบ: พื้นผิวโจมตี/ภาระดูแลเกินจำเป็นเล็กน้อย — `/api/readers` และ `/availability` ไม่ต้องล็อกอิน + `/api/readers` คืนรายชื่อทั้งหมดไม่แคช (ยิงรัวได้ ~1 query/คำขอ) · ไม่มีผลกับผู้ใช้
- หลักฐาน: สคริปต์ regex ต่อเส้น (ผลดิบ: เหลือ 22 ก่อนคัดออกตามเหตุผลข้างบน) · `grep -rn "api/readers\|/availability" src astro mobile scripts .github public` = เฉพาะบรรทัดคอมเมนต์/ไฟล์ route เอง · cron 4 เส้นมีผู้เรียกใน `.github/workflows/{booking-reminders,daily-digest,push-reminders}.yml` · webhook `/api/marketplace/payments/webhook` อ้างใน `scripts/cloudflare-phase1.ts` + ด่าน `test-money-path.ts`
- แนวแก้: ลบ 3 เส้นแรก (ถ้ามีด่านที่ลิสต์ route ทั้งหมด เช่น `test-api-routes` ให้แก้ด้วย — ตอนตรวจไม่พบด่านที่ hardcode 3 เส้นนี้) · เก็บ `/api/config/app`
- ความมั่นใจ: ยืนยันแล้ว (ยกเว้นมีลูกค้านอกเว็บ/แอปที่เรียก API สาธารณะ `/api/readers` ซึ่ง repo ตรวจไม่ได้)

### 🟡 A8-07 · รูปแนวคิดโลโก้ 2 ไฟล์ค้างที่รากโปรเจกต์ (192 KB) — ไม่มีใครอ้าง · และธงที่ "ตายด้วยค่าคงที่"
- ที่: `8df02e35-5215-4bf1-8692-9061d0255e75.jpeg` (55 KB · โลโก้พระจันทร์ + "SEER") · `Screen Shot 2569-09-03 at 09.25.41.png` (138 KB · โลโก้ "SEERada") — ทั้งคู่ commit มากับ `d6b1ba1` (#546 INC-0203) ซึ่งเป็นงานแก้ www redirect ไม่เกี่ยวกัน
- ปัญหา: ไฟล์ภาพเคยหลุดเข้า PR โดยไม่ตั้งใจ · `grep -rn "8df02e35\|Screen Shot"` ทั้ง repo (ไม่รวม node_modules/.git/dist) = 0 · ไม่อยู่ใน `public/` จึงไม่ถูกเสิร์ฟ · ชื่อ "SEERada" ไม่ตรงแบรนด์ปัจจุบัน (SeerTarot)
- ผลกระทบ: ไม่กระทบเว็บ แต่เป็นขยะใน git ถาวร (ประวัติ) + รากโปรเจกต์รก · ภาพไม่มีข้อมูลลับ (ดูแล้ว)
- หลักฐาน: `git log --oneline -- <ไฟล์>` = `d6b1ba1` เท่านั้น · `ls public/` ตรวจแล้ว: **ไฟล์ใน `public/` 37 ไฟล์นอก `cards/` ถูกอ้างครบ ยกเว้น 1** (`ui2/grain.webp` ← `ui2-fx-full.css` · ฟอนต์ ← `@font-face` · `icons/shortcut-*` ← `app/manifest.ts` · `checkout/{credits,consultation}.jpg` ← `pricing.tsx:250` + `payment-gateway.ts:112` (`/checkout/${kind}.jpg`) · ไฟล์ยืนยันเจ้าของโดเมน `google2c921e….html` และ `9a6df76e….txt` เป็นของภายนอก ตั้งใจ) · **ข้อยกเว้น: `public/og/share-base.png` (96 KB)** ไม่มีโค้ดผลิตภัณฑ์ไหนอ้างถึง — เป็นผลลัพธ์ของ `npm run og:share-base` ที่ commit ไว้ และเอกสาร (`HANDOFF_OG_IMAGES` :469) เรียกว่า "ทางถอย" · ตรวจไม่ได้ว่า Cloudinary ภายนอกดึงไปเป็นภาพฐานหรือไม่ ➔ ถามเจ้าของก่อนลบ · การ์ดไพ่ 78 JPG + 6 โฟลเดอร์ WebP (w64/128/256/320/512b/768b) ล้วนถูกสร้างจาก `CARD_IMAGE_VARIANTS` ที่ `CardImage` อ้างครบทุกขนาด — ไม่มีขนาดไหนเป็นของเหลือ
- แนวแก้: ย้ายไป `docs/brand/` (ถ้าเจ้าของอยากเก็บร่างโลโก้) หรือ `git rm` · คำถามให้เจ้าของเคาะ ไม่ใช่งานเร่ง
- ความมั่นใจ: ยืนยันแล้ว

**ธงที่ตายด้วยค่าคงที่** (ไม่ใช่ finding แยก — บันทึกผลตรวจ):
- `GUEST_LIMIT = 0` (`src/lib/entitlement/limits.ts:22`, คำสั่งเจ้าของ 2026-09-09) ➔ `REQUIRE_SIGNUP_TO_READ = true` ถาวร ทำให้ระบบ "ทดลองฟรีผู้เยี่ยมชม" ตายตามค่า: `guest.ts` (124 บรรทัด) · `viewer.ts` ส่วน `isGuestUsedOnServer` · `POST /api/entitlement/guest-consume` (67) · ตัวเรียก `TarotFlow.tsx:1483` · สถานะ `"guest-allowed"` (`entitlement.ts:394`) · ถ้อยคำทดลองใน `copy.ts` (`:198-202,:296,:377,:440,:511`) · ข้อความ `AnnouncementBanner.tsx:52,62` · `EntitlementAdmin.tsx:169,335` · รวมราว 300–400 บรรทัด — **ไม่แนะนำให้ลบ**: ไฟล์ `limits.ts` ระบุชัดว่าเป็นสวิตช์ย้อนกลับ (ตั้งเป็น 1 เปิดทดลองอีกครั้ง) และด่าน QA อ่านค่าจากที่นี่ · เก็บไว้ (เหตุผล: สวิตช์ธุรกิจที่เจ้าของตั้งใจ) แต่ถ้าตัดสินใจไม่กลับ ➔ ลบพร้อมกันเป็นก้อนเดียว
- ธง KV `entitlement.enforced` (default เปิด) · `entitlement.announce` · `studio.pass_price_thb` — ค่าจริงบน production อ่านได้เฉพาะ `npm run flags:show` (ไม่มีสิทธิ์ KV ในรอบนี้) ➔ ตรวจไม่ได้ว่าถูกตั้ง `false` ค้างหรือไม่ (ไม่ใช่เรื่องโค้ดตาย)
- env `RELATIONS_IN_PROMPT=1` (`src/lib/ai/prompt.ts:439`) ปิดโดยตั้งใจ (แผน REFLECTION_JOURNAL รอผล ai:judge) · `GA_MEASUREMENT_ID` `AW_CONVERSION_ID` `SEARCH_DAILY_CAP` อ่านใน src แต่ไม่มีใน `wrangler.jsonc`/`.env.example`/`PENDING_SETUP.md` (เป็นค่าตัวเลือกที่มีค่าเริ่มต้นในโค้ด — ไม่ใช่บั๊ก แต่ควรลงทะเบียนในเอกสาร)
