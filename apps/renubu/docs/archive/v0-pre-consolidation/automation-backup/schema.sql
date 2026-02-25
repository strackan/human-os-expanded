-- Companies Table (Multi-tenant customers of Renubu)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (CSMs/owners)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Customers Table (The actual customer accounts being managed)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    domain TEXT,
    arr DECIMAL(12,2) NOT NULL,
    renewal_date DATE,
    owner TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (owner) REFERENCES users(id)
);

-- Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    contract_number TEXT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_arr DECIMAL(12,2) NOT NULL DEFAULT 0,
    initial_onetime DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT 1,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Renewals Table (tracks each renewal event for a contract)
CREATE TABLE IF NOT EXISTS renewals (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew_period INTEGER DEFAULT 60,
    starting_arr DECIMAL(12,2) NOT NULL,
    ending_arr DECIMAL(12,2),
    status TEXT,
    active_stage TEXT,
    opp_id TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

-- Customer Properties Table (For future metadata)
CREATE TABLE IF NOT EXISTS customer_properties (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    property_key TEXT NOT NULL,
    property_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    UNIQUE(customer_id, property_key)
);

-- Account Plans Table (tracks which plan types customers have)
CREATE TABLE IF NOT EXISTS account_plan (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    plan_type TEXT NOT NULL CHECK(plan_type IN ('invest', 'manage', 'monitor', 'expand')),
    active BOOLEAN DEFAULT 1,
    start_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner ON customers(owner);
CREATE INDEX IF NOT EXISTS idx_customers_renewal_date ON customers(renewal_date);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_active ON contracts(active);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_renewals_contract_id ON renewals(contract_id);
CREATE INDEX IF NOT EXISTS idx_renewals_active ON renewals(active);
CREATE INDEX IF NOT EXISTS idx_renewals_status ON renewals(status);
CREATE INDEX IF NOT EXISTS idx_renewals_end_date ON renewals(end_date);
CREATE INDEX IF NOT EXISTS idx_customer_properties_customer_id ON customer_properties(customer_id);
CREATE INDEX IF NOT EXISTS idx_account_plan_customer_id ON account_plan(customer_id);
CREATE INDEX IF NOT EXISTS idx_account_plan_active ON account_plan(active);
