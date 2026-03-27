-- Equipment: add WHO LQSI fields (category, physical condition, maintenance frequency)

ALTER TABLE equipment ADD COLUMN category TEXT;
ALTER TABLE equipment ADD COLUMN physical_condition TEXT DEFAULT 'Good';
ALTER TABLE equipment ADD COLUMN maintenance_frequency TEXT;
