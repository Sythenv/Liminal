-- Print configuration (report + specimen labels)
ALTER TABLE site_config ADD COLUMN print_config TEXT NOT NULL DEFAULT '{"report":{"show_barcode":false,"show_signatures":true,"footer_text":""},"labels":{"enabled":false,"format":"avery_2x7","copies_per_specimen":3,"fields":["barcode","patient_name","specimen_type","collection_date"]}}';
