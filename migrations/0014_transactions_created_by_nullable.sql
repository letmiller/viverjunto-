CREATE TABLE transactions_new (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  account_id TEXT REFERENCES financial_accounts(id),
  category TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date TEXT NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  payment_method TEXT,
  recurrence TEXT,
  series_id TEXT
);

INSERT INTO transactions_new SELECT * FROM transactions;
DROP TABLE transactions;
ALTER TABLE transactions_new RENAME TO transactions;

CREATE INDEX idx_transactions_household ON transactions(household_id, date);
