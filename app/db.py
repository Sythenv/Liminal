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

    db.commit()
    db.close()
    print(f'  Seeded {len(tests)} test definitions')


def init_app(app):
    """Initialize database for the Flask app."""
    print('Initializing database...')
    run_migrations(app)
    seed_data(app)
    app.teardown_appcontext(close_db)
