ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;

CREATE TABLE email_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_email_verifications_token ON email_verifications(token);
