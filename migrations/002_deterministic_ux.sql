-- Deterministic UX: rejection reasons, panic values, collection time

-- 1. Rejection reason on lab_register
ALTER TABLE lab_register ADD COLUMN rejection_reason TEXT;

-- 2. Collection time on lab_register (separate from reception_time per QA guidelines)
ALTER TABLE lab_register ADD COLUMN collection_time TEXT;

-- 3. Panic value thresholds on test_definition
ALTER TABLE test_definition ADD COLUMN panic_low REAL;
ALTER TABLE test_definition ADD COLUMN panic_high REAL;

-- 4. Panic acknowledgement flag on lab_result
ALTER TABLE lab_result ADD COLUMN panic_acknowledged INTEGER DEFAULT 0;

-- 5. Seed panic values for standard tests
UPDATE test_definition SET panic_low = 5.0, panic_high = 20.0 WHERE code = 'HB';
UPDATE test_definition SET panic_low = 2.0, panic_high = 25.0 WHERE code = 'GLU';
UPDATE test_definition SET panic_low = 30.0, panic_high = 800.0 WHERE code = 'CREAT';
UPDATE test_definition SET panic_high = 200.0 WHERE code = 'CRP';
UPDATE test_definition SET panic_high = 500.0 WHERE code = 'TGO';
UPDATE test_definition SET panic_high = 500.0 WHERE code = 'TGP';
UPDATE test_definition SET panic_high = 10.0 WHERE code = 'HBA1C';
