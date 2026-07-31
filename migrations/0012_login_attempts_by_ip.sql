DROP TABLE IF EXISTS login_attempts;

CREATE TABLE login_attempts (
  email TEXT NOT NULL,
  ip TEXT NOT NULL,
  failed_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (email, ip)
);
