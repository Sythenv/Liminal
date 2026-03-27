-- Laboratory Registration System - Initial Schema
-- MVP + RFC tables

-- Track applied migrations
CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Site configuration
CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    site_name TEXT NOT NULL,
    site_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'SSD',
    default_language TEXT NOT NULL DEFAULT 'en',
    lab_number_prefix TEXT,
    lab_number_sequence INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Configurable test menu
CREATE TABLE IF NOT EXISTS test_definition (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    category TEXT NOT NULL,
    specimen_types TEXT,
    result_type TEXT NOT NULL,
    unit TEXT,
    reference_range_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Main registration book (MVP)
CREATE TABLE IF NOT EXISTS lab_register (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_number TEXT NOT NULL UNIQUE,
    reception_date TEXT NOT NULL,
    reception_time TEXT,
    patient_name TEXT NOT NULL,
    patient_id TEXT,
    age INTEGER,
    age_unit TEXT DEFAULT 'Y',
    sex TEXT CHECK (sex IN ('M', 'F')),
    ward TEXT,
    requesting_clinician TEXT,
    specimen_type TEXT,
    reporting_date TEXT,
    technician_initials TEXT,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'REGISTERED',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Test results (MVP)
CREATE TABLE IF NOT EXISTS lab_result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    register_id INTEGER NOT NULL REFERENCES lab_register(id),
    test_id INTEGER NOT NULL REFERENCES test_definition(id),
    requested INTEGER NOT NULL DEFAULT 0,
    result_value TEXT,
    result_status TEXT DEFAULT 'PENDING',
    resulted_at TEXT,
    resulted_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(register_id, test_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_register_date ON lab_register(reception_date);
CREATE INDEX IF NOT EXISTS idx_register_patient ON lab_register(patient_name);
CREATE INDEX IF NOT EXISTS idx_register_lab_number ON lab_register(lab_number);
CREATE INDEX IF NOT EXISTS idx_result_register ON lab_result(register_id);

-- ========== BLOOD BANK (RFC) ==========

CREATE TABLE IF NOT EXISTS blood_donor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    age INTEGER,
    sex TEXT CHECK (sex IN ('M', 'F')),
    blood_group TEXT,
    contact TEXT,
    last_donation_date TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blood_unit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_number TEXT NOT NULL UNIQUE,
    donor_id INTEGER REFERENCES blood_donor(id),
    blood_group TEXT NOT NULL,
    collection_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    volume_ml INTEGER,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    screening_hiv TEXT,
    screening_hbv TEXT,
    screening_hcv TEXT,
    screening_syphilis TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transfusion_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL REFERENCES blood_unit(id),
    patient_name TEXT NOT NULL,
    patient_id TEXT,
    patient_blood_group TEXT,
    crossmatch_result TEXT,
    crossmatch_by TEXT,
    issued_date TEXT,
    issued_to_ward TEXT,
    transfusion_started TEXT,
    transfusion_completed TEXT,
    adverse_reaction INTEGER DEFAULT 0,
    reaction_details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========== EQUIPMENT MAINTENANCE (RFC) ==========

CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    model TEXT,
    serial_number TEXT,
    manufacturer TEXT,
    installation_date TEXT,
    location TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id),
    log_date TEXT NOT NULL,
    maintenance_type TEXT NOT NULL,
    description TEXT,
    parts_replaced TEXT,
    next_scheduled TEXT,
    performed_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========== IQC (RFC) ==========

CREATE TABLE IF NOT EXISTS qc_target (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL REFERENCES test_definition(id),
    equipment_id INTEGER REFERENCES equipment(id),
    qc_material TEXT,
    lot_number TEXT,
    expiry_date TEXT,
    target_mean REAL,
    target_sd REAL,
    acceptable_range_low REAL,
    acceptable_range_high REAL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qc_result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qc_target_id INTEGER NOT NULL REFERENCES qc_target(id),
    result_date TEXT NOT NULL,
    measured_value REAL NOT NULL,
    pass_fail TEXT NOT NULL CHECK (pass_fail IN ('PASS', 'FAIL')),
    corrective_action TEXT,
    technician TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
