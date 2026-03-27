-- Separate patient entity from lab_register (ISO 15189 §5.4)
-- Patient record is reusable across multiple lab requests

CREATE TABLE IF NOT EXISTS patient (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    date_of_birth TEXT,
    age INTEGER,
    age_unit TEXT DEFAULT 'Y',
    sex TEXT CHECK (sex IN ('M', 'F')),
    contact TEXT,
    village TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_patient_name ON patient(name);
CREATE INDEX IF NOT EXISTS idx_patient_number ON patient(patient_number);

-- Add FK to lab_register (nullable for backward compat with existing entries)
ALTER TABLE lab_register ADD COLUMN patient_fk INTEGER REFERENCES patient(id);

-- Migrate existing entries: create patient records from distinct patient data
INSERT OR IGNORE INTO patient (patient_number, name, age, age_unit, sex)
SELECT
    'P-' || printf('%04d', ROW_NUMBER() OVER (ORDER BY MIN(id))),
    patient_name,
    age,
    age_unit,
    sex
FROM lab_register
GROUP BY patient_name, sex;

-- Link existing entries to their patient records
UPDATE lab_register SET patient_fk = (
    SELECT p.id FROM patient p
    WHERE p.name = lab_register.patient_name
    AND (p.sex = lab_register.sex OR (p.sex IS NULL AND lab_register.sex IS NULL))
    LIMIT 1
)
WHERE patient_fk IS NULL;
