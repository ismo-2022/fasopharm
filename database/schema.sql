
-- SCHEMA POUR SUPABASE (PostgreSQL)

-- 1. Table des Pharmacies
CREATE TABLE IF NOT EXISTS pharmacies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    status TEXT DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    "pharmacyId" TEXT REFERENCES pharmacies(id),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    role TEXT NOT NULL
);

-- 3. Table des Médicaments (Drugs)
CREATE TABLE IF NOT EXISTS drugs (
    id TEXT PRIMARY KEY,
    "pharmacyId" TEXT NOT NULL REFERENCES pharmacies(id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    dosage TEXT,
    "expiryDate" TEXT,
    "supplierId" TEXT
);

-- 4. Table des Fournisseurs (Suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    "pharmacyId" TEXT NOT NULL REFERENCES pharmacies(id),
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    address TEXT
);

-- 5. Table des Assurances (Insurances)
CREATE TABLE IF NOT EXISTS insurances (
    id TEXT PRIMARY KEY,
    "pharmacyId" TEXT NOT NULL REFERENCES pharmacies(id),
    name TEXT NOT NULL,
    "defaultCoverage" INTEGER NOT NULL DEFAULT 0
);

-- 6. Table des Ventes (Sales)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    "pharmacyId" TEXT NOT NULL REFERENCES pharmacies(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "servedBy" TEXT NOT NULL,
    "insuranceId" TEXT,
    "insuranceName" TEXT,
    "insuranceCoverageRate" NUMERIC,
    "insuranceAmount" NUMERIC,
    "patientAmount" NUMERIC,
    "patientName" TEXT,
    "policyNumber" TEXT,
    "amountReceived" NUMERIC,
    "changeGiven" NUMERIC
);

-- 7. Table des Logs
CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DONNÉES INITIALES (SEED)

-- Pharmacies
INSERT INTO pharmacies (id, name, address, phone, status)
VALUES ('pharma_1', 'Pharmacie du Centre', 'Avenue Kwamé Nkrumah, Ouagadougou', '+226 25 30 00 01', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Utilisateurs
INSERT INTO users (id, "pharmacyId", username, password, "fullName", role)
VALUES 
('super_1', NULL, 'superadmin', 'root', 'Directeur Général', 'SUPER_ADMIN'),
('admin_1', 'pharma_1', 'admin', '123', 'Dr. Sawadogo', 'ADMIN'),
('vendeur_1', 'pharma_1', 'vendeur', '123', 'Aline', 'SELLER'),
('caisse_1', 'pharma_1', 'caisse', '123', 'Thomas', 'CASHIER')
ON CONFLICT (id) DO NOTHING;

-- Médicaments
INSERT INTO drugs (id, "pharmacyId", name, description, price, stock, category, dosage, "expiryDate")
VALUES ('d1', 'pharma_1', 'Paracétamol 500mg', 'Antalgique et antipyrétique', 1500, 100, 'Douleur', 'Boîte de 20 comprimés', '2025-12-31')
ON CONFLICT (id) DO NOTHING;

-- Fournisseurs
INSERT INTO suppliers (id, "pharmacyId", name, contact, email, address)
VALUES ('s1', 'pharma_1', 'CAMEG', '+226 25 30 00 00', 'contact@cameg.bf', 'Ouagadougou')
ON CONFLICT (id) DO NOTHING;

-- Assurances
INSERT INTO insurances (id, "pharmacyId", name, "defaultCoverage")
VALUES ('i1', 'pharma_1', 'SONAR', 80)
ON CONFLICT (id) DO NOTHING;
