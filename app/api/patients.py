"""Patient API — CRUD and search."""

from flask import Blueprint, request, jsonify
from app.db import get_db
from app.audit import log_action
from app.auth import get_current_operator_name

bp = Blueprint('patients', __name__)


def _next_patient_number(db):
    row = db.execute('SELECT MAX(id) as m FROM patient').fetchone()
    seq = (row['m'] or 0) + 1
    return f'P-{seq:04d}'


@bp.route('/search', methods=['GET'])
def search():
    """Search patients by name or date of birth for autocomplete."""
    q = request.args.get('q', '')
    if len(q) < 2:
        return jsonify([])

    db = get_db()

    # Detect if query looks like a date (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
    import re
    dob_match = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', q)
    if not dob_match:
        # Try DD/MM/YYYY or DD-MM-YYYY
        dob_match2 = re.match(r'^(\d{2})[/\-](\d{2})[/\-](\d{4})$', q)
        if dob_match2:
            q_dob = f'{dob_match2.group(3)}-{dob_match2.group(2)}-{dob_match2.group(1)}'
        else:
            q_dob = None
    else:
        q_dob = q

    if q_dob:
        results = db.execute('''SELECT id, patient_number, name, date_of_birth, age, age_unit, sex, village
            FROM patient
            WHERE date_of_birth = ?
            ORDER BY name ASC
            LIMIT 10''', (q_dob,)).fetchall()
        return jsonify([dict(r) for r in results])

    # Search by name
    results = db.execute('''SELECT id, patient_number, name, date_of_birth, age, age_unit, sex, village
        FROM patient
        WHERE name LIKE ?
        ORDER BY name ASC
        LIMIT 10''', (f'%{q}%',)).fetchall()

    if results:
        return jsonify([dict(r) for r in results])

    # Fallback: search lab_register directly (for entries without patient records)
    results = db.execute('''SELECT DISTINCT patient_name as name, patient_id, age, sex, ward
        FROM lab_register
        WHERE patient_name LIKE ?
        ORDER BY reception_date DESC
        LIMIT 10''', (f'%{q}%',)).fetchall()

    return jsonify([dict(r) for r in results])


@bp.route('', methods=['GET'])

def list_patients():
    """List patients with optional search."""
    db = get_db()
    q = request.args.get('q', '')
    if q:
        patients = db.execute('''SELECT * FROM patient WHERE name LIKE ? OR patient_number LIKE ?
            ORDER BY name ASC LIMIT 50''', (f'%{q}%', f'%{q}%')).fetchall()
    else:
        patients = db.execute('SELECT * FROM patient ORDER BY name ASC LIMIT 100').fetchall()
    return jsonify([dict(p) for p in patients])


@bp.route('', methods=['POST'])

def create_patient():
    """Create a new patient record."""
    db = get_db()
    data = request.get_json()

    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'name is required'}), 400

    patient_number = _next_patient_number(db)

    sex = data.get('sex')
    if sex and sex not in ('M', 'F'):
        return jsonify({'error': 'Invalid sex'}), 400

    age = data.get('age')
    if age is not None:
        try:
            age = int(age)
        except (ValueError, TypeError):
            age = None

    db.execute('''INSERT INTO patient (patient_number, name, date_of_birth, age, age_unit, sex, contact, village)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (patient_number, name, data.get('date_of_birth'),
         age, data.get('age_unit', 'Y'), sex or None,
         (data.get('contact') or '').strip() or None,
         (data.get('village') or '').strip() or None))

    patient_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]

    log_action(db, 'CREATE', 'patient', patient_id,
               [('patient_number', None, patient_number), ('name', None, name)],
               get_current_operator_name())

    db.commit()
    patient = db.execute('SELECT * FROM patient WHERE id = ?', (patient_id,)).fetchone()
    return jsonify(dict(patient)), 201


@bp.route('/<int:patient_id>', methods=['GET'])

def get_patient(patient_id):
    """Get patient with lab history."""
    db = get_db()
    patient = db.execute('SELECT * FROM patient WHERE id = ?', (patient_id,)).fetchone()
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404

    # Get all lab requests for this patient
    entries = db.execute('''SELECT lr.*, GROUP_CONCAT(td.code) as test_codes
        FROM lab_register lr
        LEFT JOIN lab_result res ON res.register_id = lr.id AND res.requested = 1
        LEFT JOIN test_definition td ON td.id = res.test_id
        WHERE lr.patient_fk = ?
        GROUP BY lr.id
        ORDER BY lr.reception_date DESC, lr.lab_number DESC''',
        (patient_id,)).fetchall()

    result = dict(patient)
    result['lab_history'] = [dict(e) for e in entries]
    return jsonify(result)


@bp.route('/<int:patient_id>', methods=['PUT'])

def update_patient(patient_id):
    """Update patient demographics."""
    db = get_db()
    data = request.get_json()

    current = db.execute('SELECT * FROM patient WHERE id = ?', (patient_id,)).fetchone()
    if not current:
        return jsonify({'error': 'Patient not found'}), 404

    allowed = ['name', 'date_of_birth', 'age', 'age_unit', 'sex', 'contact', 'village']
    fields = []
    values = []
    changes = []

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
    values.append(patient_id)
    db.execute(f'UPDATE patient SET {", ".join(fields)} WHERE id = ?', values)

    if changes:
        log_action(db, 'UPDATE', 'patient', patient_id, changes,
                   get_current_operator_name())

    db.commit()
    patient = db.execute('SELECT * FROM patient WHERE id = ?', (patient_id,)).fetchone()
    return jsonify(dict(patient))
