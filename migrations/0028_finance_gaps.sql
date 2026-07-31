ALTER TABLE household_members ADD COLUMN monthly_contribution_target REAL;
ALTER TABLE financial_accounts ADD COLUMN initial_balance REAL NOT NULL DEFAULT 0;
ALTER TABLE bills ADD COLUMN account_id TEXT REFERENCES financial_accounts(id);
