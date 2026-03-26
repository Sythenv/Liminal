"""Laboratory Register API - CRUD operations."""

import json
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from app.db import get_db

bp = Blueprint('register', __name__)


def generate_lab_number():
    """Generate next sequential lab number."""
    db = get_db()
    site = db.execute('SELECT * FROM site_config WHERE id = 1').fetchone()
    if not site:
        return 'LAB-0001'

    seq = site['lab_number_sequence'] + 1
    year = datetime.now().year
    fmt = current_app.config.get('LAB_NUMBER_FORMAT', '{site_code}-{year}-{seq:04d}')
    lab_number = fmt.format(site_code=site['site_code'], year=year, seq=seq)

    db.execute('UPDATE site_config SET lab_number_sequence = ? WHERE id = 1', (seq,))
    db.commit()
    return lab_number


@bp.route('/entries', methods=['GET'])
def list_entries():
    """List register entries, filterable by date range."""
    db = get_db()
    date_from = request.args.get('date_from', datetime.now().strftime('%Y-%m-%d'))
    date_to = request.args.get('date_to', date_from)
    search = request.args.get('search', '')

    query = '''SELECT * FROM lab_register
               WHERE reception_date BETWEEN ? AND ?'''
    params = [date_from, date_to]

    if search:
        query += ' AND (patient_name LIKE ? OR lab_number LIKE ?)'
        params.extend([f'%{search}%', f'%{search}%'])

    query += ' ORDER BY lab_number ASC'
    entries = db.execute(query, params).fetchall()

    # Get all test definitions for building grid
    tests = db.execute('SELECT * FROM test_definition WHERE is_active = 1 ORDER BY display_order').fetchall()

    result = []
    for entry in entries:
        e = dict(entry)
        # Get results for this entry
        results = db.execute('''SELECT lr.*, td.code as test_code
            FROM lab_result lr JOIN test_definition td ON lr.test_id = td.id
            WHERE lr.register_id = ?''', (entry['id'],)).fetchall()
        e['results'] = {r['test_code']: dict(r) for r in results}
        result.append(e)

    return jsonify({
        'entries': result,
        'tests': [dict(t) for t in tests],
        'date_from': date_from,
        'date_to': date_to
    })


@bp.route('/entries', methods=['POST'])
def create_entry():
    """Create a new register entry."""
    db = get_db()
    data = request.get_json()

    lab_number = generate_lab_number()

    db.execute('''INSERT INTO lab_register
        (lab_number, reception_date, reception_time, patient_name, patient_id,
         age, age_unit, sex, ward, requesting_clinician, specimen_type,
         technician_initials, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (lab_number,
         data.get('reception_date', datetime.now().strftime('%Y-%m-%d')),
         data.get('reception_time', datetime.now().strftime('%H:%M')),
         data['patient_name'],
         data.get('patient_id'),
         data.get('age'),
         data.get('age_unit', 'Y'),
         data.get('sex'),
         data.get('ward'),
         data.get('requesting_clinician'),
         data.get('specimen_type'),
         data.get('technician_initials'),
         data.get('remarks')))

    entry_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]

    # Create lab_result rows for requested tests
    requested_tests = data.get('requested_tests', [])
    tests = db.execute('SELECT id, code FROM test_definition WHERE is_active = 1').fetchall()
    for test in tests:
        requested = 1 if test['code'] in requested_tests else 0
        db.execute('''INSERT INTO lab_result (register_id, test_id, requested)
            VALUES (?, ?, ?)''', (entry_id, test['id'], requested))

    db.commit()

    entry = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    return jsonify(dict(entry)), 201


@bp.route('/entries/<int:entry_id>', methods=['PUT'])
def update_entry(entry_id):
    """Update a register entry."""
    db = get_db()
    data = request.get_json()

    fields = []
    values = []
    allowed = ['patient_name', 'patient_id', 'age', 'age_unit', 'sex', 'ward',
               'requesting_clinician', 'specimen_type', 'reporting_date',
               'technician_initials', 'remarks', 'status']

    for field in allowed:
        if field in data:
            fields.append(f'{field} = ?')
            values.append(data[field])

    if not fields:
        return jsonify({'error': 'No fields to update'}), 400

    fields.append("updated_at = datetime('now')")
    values.append(entry_id)

    db.execute(f'UPDATE lab_register SET {", ".join(fields)} WHERE id = ?', values)
    db.commit()

    entry = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    return jsonify(dict(entry))


@bp.route('/entries/<int:entry_id>/results', methods=['POST'])
def update_results(entry_id):
    """Batch-update test results for an entry."""
    db = get_db()
    data = request.get_json()
    # data is a dict: {"test_code": {"result_value": "...", "requested": 1}, ...}

    for test_code, result_data in data.items():
        test = db.execute('SELECT id FROM test_definition WHERE code = ?', (test_code,)).fetchone()
        if not test:
            continue

        existing = db.execute('SELECT id FROM lab_result WHERE register_id = ? AND test_id = ?',
                              (entry_id, test['id'])).fetchone()

        result_value = result_data.get('result_value')
        requested = result_data.get('requested', 1 if result_value else 0)
        result_status = 'RESULTED' if result_value else ('PENDING' if requested else 'NOT_DONE')

        if existing:
            db.execute('''UPDATE lab_result SET
                requested = ?, result_value = ?, result_status = ?,
                resulted_at = CASE WHEN ? IS NOT NULL THEN datetime('now') ELSE resulted_at END,
                resulted_by = COALESCE(?, resulted_by),
                updated_at = datetime('now')
                WHERE id = ?''',
                (requested, result_value, result_status,
                 result_value, result_data.get('resulted_by'),
                 existing['id']))
        else:
            db.execute('''INSERT INTO lab_result
                (register_id, test_id, requested, result_value, result_status, resulted_by)
                VALUES (?, ?, ?, ?, ?, ?)''',
                (entry_id, test['id'], requested, result_value, result_status,
                 result_data.get('resulted_by')))

    # Auto-update register status
    all_results = db.execute('''SELECT requested, result_status FROM lab_result
        WHERE register_id = ? AND requested = 1''', (entry_id,)).fetchall()
    if all_results:
        all_done = all(r['result_status'] == 'RESULTED' for r in all_results)
        any_done = any(r['result_status'] == 'RESULTED' for r in all_results)
        if all_done:
            new_status = 'COMPLETED'
        elif any_done:
            new_status = 'IN_PROGRESS'
        else:
            new_status = 'REGISTERED'
        db.execute("UPDATE lab_register SET status = ?, reporting_date = CASE WHEN ? = 'COMPLETED' THEN date('now') ELSE reporting_date END, updated_at = datetime('now') WHERE id = ?",
                   (new_status, new_status, entry_id))

    db.commit()
    return jsonify({'ok': True})


@bp.route('/entries/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    """Soft-delete: mark as REJECTED."""
    db = get_db()
    db.execute("UPDATE lab_register SET status = 'REJECTED', updated_at = datetime('now') WHERE id = ?",
               (entry_id,))
    db.commit()
    return jsonify({'ok': True})
