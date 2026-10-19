#!/usr/bin/env bash
# ด่านยืนยันว่า Worker ของ Next "รันได้จริง" หลัง deploy และหลังถอยกลับ (A10-02 · A10-03)
# ---------------------------------------------------------------------------
# ทำไมต้องยิงเข้า Worker ตรง ๆ ไม่ใช่หน้าแรก:
#   หน้าแรกและหน้า Astro ทั้งเว็บถูกชั้น assets ตอบที่ขอบ ไม่ปลุก Worker เลย
#   Worker ล้ม (เช่น INC-0285: ทุกเส้น Next ตอบ 1101) หน้าแรกจึงยังตอบ 200 ปกติ — เช็กหน้าแรกไม่เห็นอาการนี้
#
# ยิงสองเส้นที่ "ต้องผ่าน Worker" เท่านั้น (อยู่ใน `run_worker_first` ของ wrangler.jsonc):
#   1. GET  /readers                     ➔ หน้าที่ Next เรนเดอร์ ต้อง 200
#   2. POST /api/cron/daily-digest       ➔ ไม่แนบ Bearer ต้องได้ 401/403 (route fail-closed ตอบจากโค้ดจริง)
#      Worker ล้ม = 5xx/1101/ต่อไม่ติด จึงแยกออกจาก "ตอบปฏิเสธถูกต้อง" ได้ชัด
#
# ยิงเข้า `*.workers.dev` ไม่ใช่โดเมนหลัก — Bot Fight Mode ของโซนท้าทาย IP ของ GitHub (INC-0142)
# และ `/api/*` อื่นบนโฮสต์นี้ถูกส่งกลับโดเมนหลักแล้ว (A10-07 · next.config.ts) จึงใช้เฉพาะ `/api/cron/*` ที่ยกเว้นไว้
#
# ใช้: bash .github/scripts/worker-smoke.sh   (ผ่าน = exit 0 · ไม่ผ่านครบทุกรอบ = exit 1)
# ปรับได้ด้วย env: SMOKE_BASE_URL · SMOKE_TRIES (ค่าเริ่มต้น 6) · SMOKE_WAIT_SECONDS (ค่าเริ่มต้น 10)
set -u

BASE="${SMOKE_BASE_URL:-https://tarot-web.bankjack10452.workers.dev}"
TRIES="${SMOKE_TRIES:-6}"
WAIT="${SMOKE_WAIT_SECONDS:-10}"

probe() {
  # พิมพ์เฉพาะรหัส HTTP · ต่อไม่ติด/หมดเวลา = 000
  curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -X "$1" "${BASE}$2" 2>/dev/null || echo "000"
}

for i in $(seq 1 "$TRIES"); do
  readers="$(probe GET /readers)"
  cron="$(probe POST /api/cron/daily-digest)"
  echo "ครั้งที่ ${i}/${TRIES}: GET /readers = ${readers} · POST /api/cron/daily-digest (ไม่มี Bearer) = ${cron}"
  if [ "$readers" = "200" ] && { [ "$cron" = "401" ] || [ "$cron" = "403" ]; }; then
    echo "ผ่าน — Worker ตอบจากโค้ดจริงทั้งหน้าและ API"
    exit 0
  fi
  if [ "$i" -lt "$TRIES" ]; then sleep "$WAIT"; fi
done

echo "::error::Worker ไม่ผ่านด่านหลัง deploy — /readers ต้อง 200 และ /api/cron/daily-digest (ไม่มี Bearer) ต้อง 401/403 (ครั้งสุดท้าย: ${readers} · ${cron})"
exit 1
