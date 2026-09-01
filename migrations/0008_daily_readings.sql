-- 0008: บันทึกการเปิดไพ่ประจำวันและระบบ Streak (Daily Readings & Habit Loop)

CREATE TABLE IF NOT EXISTS daily_readings (
  id          TEXT PRIMARY KEY,
  user_key    TEXT NOT NULL,
  date_key    TEXT NOT NULL,
  reading_id  TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_user_date ON daily_readings(user_key, date_key);
CREATE INDEX IF NOT EXISTS idx_daily_user ON daily_readings(user_key, created_at);
