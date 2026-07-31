CREATE TABLE daily_checkins (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  mood TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (household_id, user_id, date)
);

CREATE INDEX idx_daily_checkins_household_date ON daily_checkins(household_id, date);
