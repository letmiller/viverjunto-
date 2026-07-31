CREATE TABLE signup_attempts (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL DEFAULT (datetime('now'))
);
