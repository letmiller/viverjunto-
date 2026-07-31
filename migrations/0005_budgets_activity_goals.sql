CREATE TABLE budgets (
  household_id TEXT NOT NULL REFERENCES households(id),
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  PRIMARY KEY (household_id, category)
);

ALTER TABLE goals ADD COLUMN saved_amount REAL NOT NULL DEFAULT 0;

CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_activity_log_household ON activity_log(household_id, created_at);

CREATE TABLE activity_reactions (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activity_log(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  emoji TEXT NOT NULL,
  UNIQUE (activity_id, user_id)
);
