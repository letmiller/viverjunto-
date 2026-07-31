ALTER TABLE goals ADD COLUMN assigned_to TEXT REFERENCES users(id);
