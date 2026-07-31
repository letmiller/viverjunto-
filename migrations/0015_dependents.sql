CREATE TABLE dependents (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🧒',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_dependents_household ON dependents(household_id);

ALTER TABLE household_tasks ADD COLUMN assigned_dependent_id TEXT REFERENCES dependents(id);
