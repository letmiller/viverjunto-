CREATE TABLE login_attempts (
  email TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT NOT NULL DEFAULT (datetime('now'))
);
