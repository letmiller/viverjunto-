CREATE TABLE shopping_purchase_log (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  item_name TEXT NOT NULL,
  purchased_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_shopping_purchase_log_household_name ON shopping_purchase_log(household_id, item_name);
