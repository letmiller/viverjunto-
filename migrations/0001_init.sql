CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  whatsapp_number TEXT,
  avatar_url TEXT,
  usage_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE households (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE household_members (
  household_id TEXT NOT NULL REFERENCES households(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (household_id, user_id)
);

CREATE TABLE invites (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  method TEXT NOT NULL,
  email TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  title TEXT NOT NULL,
  icon TEXT,
  target_amount REAL,
  target_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE financial_accounts (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  color TEXT
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  account_id TEXT REFERENCES financial_accounts(id),
  category TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE financial_settings (
  household_id TEXT PRIMARY KEY REFERENCES households(id),
  monthly_income REAL,
  split_method TEXT,
  categories TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL'
);

CREATE TABLE routine_settings (
  household_id TEXT PRIMARY KEY REFERENCES households(id),
  lives_together TEXT,
  has_pets TEXT,
  has_children TEXT,
  work_mode TEXT,
  task_balance TEXT
);

CREATE TABLE household_tasks (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  title TEXT NOT NULL,
  icon TEXT,
  assigned_to TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TEXT,
  recurrence TEXT
);

CREATE TABLE shopping_lists (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  name TEXT NOT NULL DEFAULT 'Lista de Compras',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE shopping_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES shopping_lists(id),
  category TEXT,
  name TEXT NOT NULL,
  price REAL,
  checked INTEGER NOT NULL DEFAULT 0,
  added_by TEXT REFERENCES users(id)
);

CREATE INDEX idx_household_members_user ON household_members(user_id);
CREATE INDEX idx_transactions_household ON transactions(household_id, date);
CREATE INDEX idx_household_tasks_household ON household_tasks(household_id);
CREATE INDEX idx_shopping_items_list ON shopping_items(list_id);
