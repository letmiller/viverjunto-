ALTER TABLE household_tasks ADD COLUMN time_spent_minutes INTEGER;
ALTER TABLE household_tasks ADD COLUMN completed_by TEXT REFERENCES users(id);
