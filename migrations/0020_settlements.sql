CREATE TABLE settlements (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  from_user_id TEXT NOT NULL REFERENCES users(id),
  to_user_id TEXT NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  settled_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_settlements_household ON settlements(household_id, settled_at);
