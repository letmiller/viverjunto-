CREATE TABLE bills (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  due_date TEXT NOT NULL,
  paid INTEGER NOT NULL DEFAULT 0,
  recurrence TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_bills_household_due ON bills(household_id, due_date);
