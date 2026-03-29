"""SQLite database connection management and migration runner."""

import os
import json
import sqlite3
from datetime import datetime
from flask import g, current_app


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(current_app.config['DATABASE'])
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA journal_mode=WAL')
        g.db.execute('PRAGMA foreign_keys=ON')
    return g.db


def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def run_migrations(app):
    """Apply pending SQL migrations."""
    db = sqlite3.connect(app.config['DATABASE'])
    db.execute('PRAGMA journal_mode=WAL')

    # Ensure migrations table exists
    db.execute('''CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )''')

    migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'migrations')
    sql_files = sorted(f for f in os.listdir(migrations_dir) if f.endswith('.sql'))

    for sql_file in sql_files:
        already = db.execute('SELECT 1 FROM _migrations WHERE filename = ?', (sql_file,)).fetchone()
        if already:
            continue

        filepath = os.path.join(migrations_dir, sql_file)
        with open(filepath, 'r') as f:
            sql = f.read()

        db.executescript(sql)
        db.execute('INSERT INTO _migrations (filename) VALUES (?)', (sql_file,))
        db.commit()
        print(f'  Migration applied: {sql_file}')

    db.close()


def seed_data(app):
    """Load seed test definitions if test_definition table is empty."""
    db = sqlite3.connect(app.config['DATABASE'])
    db.row_factory = sqlite3.Row

    count = db.execute('SELECT COUNT(*) as c FROM test_definition').fetchone()['c']
    if count > 0:
        db.close()
        return

    seed_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'migrations', 'seed_tests.json')
    if not os.path.exists(seed_file):
        db.close()
        return

    with open(seed_file, 'r') as f:
        tests = json.load(f)

    for t in tests:
        db.execute('''INSERT INTO test_definition
            (code, name_en, name_fr, category, specimen_types, result_type, unit, reference_range_text, panic_low, panic_high, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (t['code'], t['name_en'], t['name_fr'], t['category'],
             json.dumps(t.get('specimen_types', [])), t['result_type'],
             t.get('unit'), t.get('reference_range_text'),
             t.get('panic_low'), t.get('panic_high'),
             t.get('display_order', 0)))

    # Seed site config from config.json
    site_exists = db.execute('SELECT 1 FROM site_config WHERE id = 1').fetchone()
    if not site_exists:
        db.execute('''INSERT INTO site_config (id, site_name, site_code, country, default_language, lab_number_prefix)
            VALUES (1, ?, ?, ?, ?, ?)''',
            (app.config['SITE_NAME'], app.config['SITE_CODE'],
             app.config['COUNTRY'], app.config['DEFAULT_LANGUAGE'],
             app.config['SITE_CODE'] + '-'))

    # Seed demo operators if LIMINAL_DEMO is set
    if os.environ.get('LIMINAL_DEMO'):
        op_count = db.execute('SELECT COUNT(*) as c FROM operator').fetchone()['c']
        if op_count == 0:
            from app.auth import generate_salt, hash_pin
            demo_ops = [
                ('Admin (demo)', '0777', 3),
                ('Supervisor (demo)', '0755', 2),
                ('Technician (demo)', '0644', 1),
            ]
            for name, pin, level in demo_ops:

                salt = generate_salt()
                pin_h = hash_pin(pin, salt)
                db.execute('INSERT INTO operator (name, pin_hash, pin_salt, level) VALUES (?, ?, ?, ?)',
                           (name, pin_h, salt, level))
            print('  Seeded 3 demo operators (LIMINAL_DEMO=1)')

        # Seed demo patients + samples
        pat_count = db.execute('SELECT COUNT(*) as c FROM patient').fetchone()['c']
        if pat_count == 0:
            from datetime import datetime, timedelta
            today = datetime.now().strftime('%Y-%m-%d')
            now_time = datetime.now().strftime('%H:%M')
            demo_patients = [
                ('P-0001', 'Jean Mukiza', 35, 'Y', 'M', 'Bukavu', '+243 991 234'),
                ('P-0002', 'Amina Diallo', 28, 'Y', 'F', 'Goma', '+243 812 567'),
                ('P-0003', 'Pierre Habimana', 42, 'Y', 'M', 'Uvira', None),
                ('P-0004', 'Fatou Keita', 8, 'Y', 'F', 'Kalemie', '+243 975 890'),
                ('P-0005', 'Joseph Ndayisaba', 55, 'Y', 'M', 'Bukavu', None),
                ('P-0006', 'Grace Akello', 22, 'Y', 'F', 'Goma', '+243 898 123'),
                ('P-0007', 'Ibrahim Sow', 3, 'M', 'M', 'Uvira', None),
                ('P-0008', 'Rose Ingabire', 67, 'Y', 'F', 'Bukavu', '+243 845 456'),
            ]
            for pnum, name, age, age_unit, sex, village, contact in demo_patients:
                db.execute('''INSERT INTO patient (patient_number, name, age, age_unit, sex, village, contact)
                    VALUES (?, ?, ?, ?, ?, ?, ?)''', (pnum, name, age, age_unit, sex, village, contact))

            # Seed some lab entries linked to patients
            prefix = db.execute('SELECT lab_number_prefix FROM site_config WHERE id = 1').fetchone()
            lab_prefix = prefix['lab_number_prefix'] if prefix else 'LAB-'
            year = datetime.now().strftime('%Y')
            demo_entries = [
                (1, 'Jean Mukiza', 35, 'Y', 'M', 'OPD', 'Blood', 'REGISTERED'),
                (2, 'Amina Diallo', 28, 'Y', 'F', 'IPD', 'Blood', 'IN_PROGRESS'),
                (3, 'Pierre Habimana', 42, 'Y', 'M', 'ER', 'Urine', 'REVIEW'),
                (4, 'Fatou Keita', 8, 'Y', 'F', 'PED', 'Blood', 'REGISTERED'),
                (5, 'Joseph Ndayisaba', 55, 'Y', 'M', 'IPD', 'Blood', 'COMPLETED'),
                (6, 'Grace Akello', 22, 'Y', 'F', 'MATER', 'Blood', 'REGISTERED'),
            ]
            for pat_fk, pname, age, age_unit, sex, ward, specimen, status in demo_entries:
                seq = db.execute('SELECT lab_number_sequence FROM site_config WHERE id = 1').fetchone()['lab_number_sequence'] + 1
                lab_num = f'{lab_prefix}{year}-{seq:04d}'
                db.execute('UPDATE site_config SET lab_number_sequence = ? WHERE id = 1', (seq,))
                db.execute('''INSERT INTO lab_register
                    (lab_number, patient_name, age, age_unit, sex, ward, specimen_type, status,
                     reception_date, reception_time, patient_fk)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                    (lab_num, pname, age, age_unit, sex, ward, specimen, status, today, now_time, pat_fk))

                # Add test requests for each entry
                entry_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
                test_codes = ['MAL_RDT', 'HB'] if specimen == 'Blood' else ['URINE']
                for code in test_codes:
                    test = db.execute('SELECT id FROM test_definition WHERE code = ?', (code,)).fetchone()
                    if test:
                        db.execute('INSERT INTO lab_result (register_id, test_id, requested) VALUES (?, ?, 1)',
                                   (entry_id, test['id']))
                        # Add results for IN_PROGRESS, REVIEW, COMPLETED entries
                        if status in ('IN_PROGRESS', 'REVIEW', 'COMPLETED'):
                            val = 'NEG' if code == 'MAL_RDT' else '12.5' if code == 'HB' else 'Normal'
                            db.execute('UPDATE lab_result SET result_value = ? WHERE register_id = ? AND test_id = ?',
                                       (val, entry_id, test['id']))

            print(f'  Seeded {len(demo_patients)} demo patients + {len(demo_entries)} samples')

    db.commit()
    db.close()
    print(f'  Seeded {len(tests)} test definitions')


def init_app(app):
    """Initialize database for the Flask app."""
    print('Initializing database...')
    run_migrations(app)
    seed_data(app)
    app.teardown_appcontext(close_db)
