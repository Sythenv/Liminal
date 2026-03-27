"""Laboratory Register API - CRUD operations with audit trail."""

import re
import json
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from app.db import get_db
from app.audit import log_action, get_audit_trail, verify_hash
from app.auth import get_current_operator_name

bp = Blueprint('register', __name__)

# Input validation
MAX_FIELD_LEN = 200
ALLOWED_SEX = {'M', 'F', None, ''}
ALLOWED_STATUS = {'REGISTERED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'REJECTED'}
ALLOWED_REJECTION_REASONS = {
    'HEMOLYZED', 'CLOTTED', 'QNS', 'UNLABELLED', 'WRONG_CONTAINER',
    'INADEQUATE_VOLUME', 'IMPROPER_SAMPLING', 'SAMPLE_TOO_OLD', 'IV_ACCESS_SITE'
}
DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
TIME_RE = re.compile(r'^\d{2}:\d{2}$')


def sanitize_str(val, max_len=MAX_FIELD_LEN):
    """Strip and truncate string input."""
    if val is None:
        return None
    return str(val).strip()[:max_len]


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

    status_filter = request.args.get('status', '')
    if status_filter:
        statuses = [s.strip() for s in status_filter.split(',') if s.strip() in ALLOWED_STATUS]
        if statuses:
            placeholders = ','.join('?' * len(statuses))
            query += f' AND status IN ({placeholders})'
            params.extend(statuses)

    query += ' ORDER BY lab_number ASC'
    entries = db.execute(query, params).fetchall()

    tests = db.execute('SELECT * FROM test_definition WHERE is_active = 1 ORDER BY display_order').fetchall()

    result = []
    for entry in entries:
        e = dict(entry)
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


@bp.route('/entries/stats', methods=['GET'])
def entry_stats():
    """Get entry counts by status (defaults to last 30 days)."""
    db = get_db()
    date_from = request.args.get('date_from', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
    date_to = request.args.get('date_to', datetime.now().strftime('%Y-%m-%d'))

    rows = db.execute('''SELECT status, COUNT(*) as count FROM lab_register
        WHERE reception_date BETWEEN ? AND ?
        GROUP BY status''', (date_from, date_to)).fetchall()

    stats = {s: 0 for s in ALLOWED_STATUS}
    for r in rows:
        stats[r['status']] = r['count']

    return jsonify(stats)


@bp.route('/entries/<int:entry_id>/context', methods=['GET'])
def entry_context(entry_id):
    """Get validation context: who entered results, when, turnaround, patient history."""
    db = get_db()
    entry = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404

    # Who entered results and when (from audit log)
    result_audit = db.execute('''SELECT operator, timestamp, field_name, new_value
        FROM audit_log WHERE table_name = 'lab_register' AND record_id = ? AND action = 'RESULT'
        ORDER BY timestamp DESC''', (entry_id,)).fetchall()

    entered_by = result_audit[0]['operator'] if result_audit else None
    entered_at = result_audit[0]['timestamp'] if result_audit else None

    # Turnaround time
    turnaround = None
    if entry['collection_time'] and entered_at:
        try:
            collect = datetime.strptime(f"{entry['reception_date']} {entry['collection_time']}", '%Y-%m-%d %H:%M')
            result_time = datetime.strptime(entered_at, '%Y-%m-%d %H:%M:%S')
            delta = result_time - collect
            minutes = int(delta.total_seconds() / 60)
            if minutes >= 0:
                turnaround = f'{minutes // 60}h{minutes % 60:02d}' if minutes >= 60 else f'{minutes}min'
        except (ValueError, TypeError):
            pass

    # Patient history (last 5 entries for same patient)
    history = []
    if entry['patient_fk']:
        hist_rows = db.execute('''SELECT lr.lab_number, lr.reception_date, lr.status,
                GROUP_CONCAT(td.code || ':' || COALESCE(res.result_value, ''), ', ') as results_summary
            FROM lab_register lr
            LEFT JOIN lab_result res ON res.register_id = lr.id AND res.requested = 1 AND res.result_value IS NOT NULL
            LEFT JOIN test_definition td ON td.id = res.test_id
            WHERE lr.patient_fk = ? AND lr.id != ?
            GROUP BY lr.id
            ORDER BY lr.reception_date DESC, lr.id DESC
            LIMIT 5''', (entry['patient_fk'], entry_id)).fetchall()
        history = [dict(h) for h in hist_rows]

    # Panic thresholds for requested tests
    panic_thresholds = {}
    test_rows = db.execute('''SELECT td.code, td.panic_low, td.panic_high
        FROM lab_result lr JOIN test_definition td ON td.id = lr.test_id
        WHERE lr.register_id = ? AND lr.requested = 1
        AND (td.panic_low IS NOT NULL OR td.panic_high IS NOT NULL)''', (entry_id,)).fetchall()
    for t in test_rows:
        panic_thresholds[t['code']] = {'low': t['panic_low'], 'high': t['panic_high']}

    return jsonify({
        'entered_by': entered_by,
        'entered_at': entered_at,
        'turnaround': turnaround,
        'collection_time': entry['collection_time'],
        'reception_time': entry['reception_time'],
        'ward': entry['ward'],
        'specimen_type': entry['specimen_type'],
        'history': history,
        'panic_thresholds': panic_thresholds
    })


@bp.route('/entries/lookup', methods=['GET'])
def lookup_entry():
    """Lookup a single entry by exact lab_number (for scanner/manual input)."""
    db = get_db()
    lab_number = request.args.get('lab_number', '').strip()
    if not lab_number:
        return jsonify({'error': 'lab_number parameter is required'}), 400

    entry = db.execute('SELECT * FROM lab_register WHERE lab_number = ?', (lab_number,)).fetchone()
    if not entry:
        return jsonify({'error': 'Not found'}), 404

    e = dict(entry)
    results = db.execute('''SELECT lr.*, td.code as test_code
        FROM lab_result lr JOIN test_definition td ON lr.test_id = td.id
        WHERE lr.register_id = ?''', (entry['id'],)).fetchall()
    e['results'] = {r['test_code']: dict(r) for r in results}

    tests = db.execute('SELECT * FROM test_definition WHERE is_active = 1 ORDER BY display_order').fetchall()

    return jsonify({'entry': e, 'tests': [dict(t) for t in tests]})


@bp.route('/entries', methods=['POST'])

def create_entry():
    """Create a new register entry."""
    db = get_db()
    data = request.get_json()
    operator = get_current_operator_name()

    patient_name = sanitize_str(data.get('patient_name'))
    if not patient_name:
        return jsonify({'error': 'patient_name is required'}), 400

    sex = data.get('sex')
    if sex not in ALLOWED_SEX:
        return jsonify({'error': 'Invalid sex value'}), 400

    age = data.get('age')
    if age is not None:
        try:
            age = int(age)
            if age < 0 or age > 200:
                return jsonify({'error': 'Invalid age'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid age'}), 400

    lab_number = generate_lab_number()

    collection_time = data.get('collection_time')
    if collection_time and not TIME_RE.match(collection_time):
        collection_time = None

    # Link to patient record if patient_fk provided
    patient_fk = data.get('patient_fk')

    db.execute('''INSERT INTO lab_register
        (lab_number, reception_date, reception_time, collection_time, patient_name, patient_id,
         age, age_unit, sex, ward, requesting_clinician, specimen_type,
         technician_initials, remarks, patient_fk)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (lab_number,
         data.get('reception_date', datetime.now().strftime('%Y-%m-%d')),
         data.get('reception_time', datetime.now().strftime('%H:%M')),
         collection_time,
         patient_name,
         sanitize_str(data.get('patient_id'), 50),
         age,
         sanitize_str(data.get('age_unit', 'Y'), 1),
         sex or None,
         sanitize_str(data.get('ward'), 20),
         sanitize_str(data.get('requesting_clinician')),
         sanitize_str(data.get('specimen_type'), 20),
         sanitize_str(data.get('technician_initials'), 5),
         sanitize_str(data.get('remarks')),
         patient_fk))

    entry_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]

    # Create lab_result rows for requested tests
    requested_tests = data.get('requested_tests', [])
    tests = db.execute('SELECT id, code FROM test_definition WHERE is_active = 1').fetchall()
    for test in tests:
        requested = 1 if test['code'] in requested_tests else 0
        db.execute('''INSERT INTO lab_result (register_id, test_id, requested)
            VALUES (?, ?, ?)''', (entry_id, test['id'], requested))

    # Audit: log creation
    log_action(db, 'CREATE', 'lab_register', entry_id,
               [('lab_number', None, lab_number),
                ('patient_name', None, patient_name),
                ('tests', None, ','.join(requested_tests))],
               operator)

    db.commit()

    entry = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    return jsonify(dict(entry)), 201


@bp.route('/entries/<int:entry_id>', methods=['PUT'])

def update_entry(entry_id):
    """Update a register entry."""
    db = get_db()
    data = request.get_json()
    operator = get_current_operator_name()

    # Get current values for audit
    current = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    if not current:
        return jsonify({'error': 'Entry not found'}), 404

    fields = []
    values = []
    changes = []
    allowed = ['patient_name', 'patient_id', 'age', 'age_unit', 'sex', 'ward',
               'requesting_clinician', 'specimen_type', 'collection_time', 'reporting_date',
               'technician_initials', 'remarks', 'status', 'rejection_reason', 'patient_fk']

    for field in allowed:
        if field in data:
            old_val = current[field]
            new_val = data[field]
            if str(old_val) != str(new_val):
                changes.append((field, old_val, new_val))
            fields.append(f'{field} = ?')
            values.append(new_val)

    if not fields:
        return jsonify({'error': 'No fields to update'}), 400

    fields.append("updated_at = datetime('now')")
    values.append(entry_id)

    db.execute(f'UPDATE lab_register SET {", ".join(fields)} WHERE id = ?', values)

    # Audit: log each changed field
    if changes:
        log_action(db, 'UPDATE', 'lab_register', entry_id, changes, operator)

    db.commit()

    entry = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    return jsonify(dict(entry))


@bp.route('/entries/<int:entry_id>/results', methods=['POST'])

def update_results(entry_id):
    """Batch-update test results for an entry."""
    db = get_db()
    data = request.get_json()
    operator = get_current_operator_name()

    changes = []

    for test_code, result_data in data.items():
        if test_code == 'operator':
            continue

        test = db.execute('SELECT id FROM test_definition WHERE code = ?', (test_code,)).fetchone()
        if not test:
            continue

        existing = db.execute('SELECT * FROM lab_result WHERE register_id = ? AND test_id = ?',
                              (entry_id, test['id'])).fetchone()

        result_value = result_data.get('result_value')
        requested = result_data.get('requested', 1 if result_value else 0)
        result_status = 'RESULTED' if result_value else ('PENDING' if requested else 'NOT_DONE')
        panic_ack = 1 if result_data.get('panic_acknowledged') else 0

        old_value = existing['result_value'] if existing else None

        if existing:
            db.execute('''UPDATE lab_result SET
                requested = ?, result_value = ?, result_status = ?, panic_acknowledged = ?,
                resulted_at = CASE WHEN ? IS NOT NULL THEN datetime('now') ELSE resulted_at END,
                resulted_by = COALESCE(?, resulted_by),
                updated_at = datetime('now')
                WHERE id = ?''',
                (requested, result_value, result_status, panic_ack,
                 result_value, result_data.get('resulted_by'),
                 existing['id']))
        else:
            db.execute('''INSERT INTO lab_result
                (register_id, test_id, requested, result_value, result_status, panic_acknowledged, resulted_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (entry_id, test['id'], requested, result_value, result_status, panic_ack,
                 result_data.get('resulted_by')))

        # Track result changes for audit
        if result_value != old_value:
            changes.append((test_code, old_value, result_value))

    # Auto-update register status
    all_results = db.execute('''SELECT requested, result_status FROM lab_result
        WHERE register_id = ? AND requested = 1''', (entry_id,)).fetchall()
    if all_results:
        all_done = all(r['result_status'] in ('RESULTED', 'VALIDATED') for r in all_results)
        any_done = any(r['result_status'] in ('RESULTED', 'VALIDATED') for r in all_results)
        if all_done:
            new_status = 'REVIEW'
        elif any_done:
            new_status = 'IN_PROGRESS'
        else:
            new_status = 'REGISTERED'
        db.execute("UPDATE lab_register SET status = ?, updated_at = datetime('now') WHERE id = ?",
                   (new_status, entry_id))

    # Audit: log result changes
    if changes:
        log_action(db, 'RESULT', 'lab_register', entry_id, changes, operator)

    db.commit()
    return jsonify({'ok': True})


@bp.route('/entries/<int:entry_id>/reject', methods=['POST'])

def reject_entry(entry_id):
    """Reject a sample with a constrained reason."""
    db = get_db()
    data = request.get_json()
    reason = data.get('reason', '').upper().strip()
    operator = get_current_operator_name()

    if reason not in ALLOWED_REJECTION_REASONS:
        return jsonify({'error': 'Invalid rejection reason'}), 400

    entry = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404

    old_status = entry['status']

    db.execute("""UPDATE lab_register SET status = 'REJECTED', rejection_reason = ?,
                  updated_at = datetime('now') WHERE id = ?""", (reason, entry_id))

    # Audit
    log_action(db, 'REJECT', 'lab_register', entry_id,
               [('status', old_status, 'REJECTED'),
                ('rejection_reason', None, reason)],
               operator)

    db.commit()

    updated = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    return jsonify(dict(updated))


@bp.route('/entries/<int:entry_id>/validate', methods=['POST'])

def validate_entry(entry_id):
    """Validate all results (preliminary -> final) and mark entry COMPLETED."""
    db = get_db()
    data = request.get_json() or {}
    operator = get_current_operator_name()

    entry = db.execute('SELECT id, status FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    if entry['status'] != 'REVIEW':
        return jsonify({'error': 'Entry must be in REVIEW status to validate'}), 400

    # Four-eyes rule: validator must differ from person who entered results
    from app.auth import check_four_eyes
    four_eyes_error = check_four_eyes(db, entry_id, operator)
    bypass = data.get('bypass_four_eyes', False)
    if four_eyes_error and not bypass:
        return jsonify({'error': four_eyes_error, 'four_eyes': True}), 403
    if four_eyes_error and bypass:
        # Log non-conformity
        log_action(db, 'FOUR_EYES_BYPASS', 'lab_register', entry_id,
                   [('bypass_reason', None, 'Self-validation override'),
                    ('operator', None, operator)],
                   operator)

    # Get results being validated for audit
    results = db.execute('''SELECT td.code, lr.result_value FROM lab_result lr
        JOIN test_definition td ON lr.test_id = td.id
        WHERE lr.register_id = ? AND lr.result_status = 'RESULTED' AND lr.requested = 1''',
        (entry_id,)).fetchall()

    db.execute("""UPDATE lab_result SET result_status = 'VALIDATED', updated_at = datetime('now')
                  WHERE register_id = ? AND result_status = 'RESULTED'""", (entry_id,))

    db.execute("""UPDATE lab_register SET status = 'COMPLETED', reporting_date = date('now'),
                  updated_at = datetime('now') WHERE id = ?""", (entry_id,))

    # Audit
    changes = [('status', 'REVIEW', 'COMPLETED')]
    for r in results:
        changes.append((r['code'] + '_status', 'RESULTED', 'VALIDATED'))
    log_action(db, 'VALIDATE', 'lab_register', entry_id, changes, operator)

    db.commit()

    updated = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    return jsonify(dict(updated))


@bp.route('/entries/<int:entry_id>/unreject', methods=['POST'])

def unreject_entry(entry_id):
    """Reverse a rejection, restore to REGISTERED status."""
    db = get_db()
    data = request.get_json() or {}
    operator = get_current_operator_name()

    entry = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    if entry['status'] != 'REJECTED':
        return jsonify({'error': 'Entry is not rejected'}), 400

    old_reason = entry['rejection_reason']

    db.execute("""UPDATE lab_register SET status = 'REGISTERED', rejection_reason = NULL,
                  updated_at = datetime('now') WHERE id = ?""", (entry_id,))

    # Audit
    log_action(db, 'UNREJECT', 'lab_register', entry_id,
               [('status', 'REJECTED', 'REGISTERED'),
                ('rejection_reason', old_reason, None)],
               operator)

    db.commit()

    updated = db.execute('SELECT * FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    return jsonify(dict(updated))


@bp.route('/entries/<int:entry_id>/audit', methods=['GET'])

def entry_audit(entry_id):
    """Get audit trail for an entry (ISO 15189 §5.10)."""
    db = get_db()
    entry = db.execute('SELECT id FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404

    trail = get_audit_trail(db, 'lab_register', entry_id)
    integrity = verify_hash(db, 'lab_register', entry_id)

    return jsonify({
        'entry_id': entry_id,
        'integrity': integrity,
        'trail': trail
    })


@bp.route('/entries/<int:entry_id>', methods=['DELETE'])

def delete_entry(entry_id):
    """Soft-delete: mark as REJECTED."""
    db = get_db()

    entry = db.execute('SELECT status FROM lab_register WHERE id = ?', (entry_id,)).fetchone()
    old_status = entry['status'] if entry else None

    db.execute("UPDATE lab_register SET status = 'REJECTED', updated_at = datetime('now') WHERE id = ?",
               (entry_id,))

    log_action(db, 'DELETE', 'lab_register', entry_id,
               [('status', old_status, 'REJECTED')], 'SYSTEM')

    db.commit()
    return jsonify({'ok': True})
