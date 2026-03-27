"""Blood Bank API - Donors, Units, Transfusions."""

from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from app.db import get_db
from app.audit import log_action
from app.auth import get_current_operator_name

bp = Blueprint('bloodbank', __name__)

ALLOWED_BLOOD_GROUPS = {'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'}
ALLOWED_SCREENING = {'POS', 'NEG', None, ''}
ALLOWED_UNIT_STATUS = {'AVAILABLE', 'RESERVED', 'ISSUED', 'EXPIRED', 'DISCARDED'}


def _next_donor_number(db):
    row = db.execute('SELECT MAX(id) as m FROM blood_donor').fetchone()
    seq = (row['m'] or 0) + 1
    return f'D-{seq:04d}'


def _next_unit_number(db):
    now = datetime.now()
    prefix = f'U-{now.strftime("%y%m")}'
    row = db.execute("SELECT COUNT(*) as c FROM blood_unit WHERE unit_number LIKE ?",
                     (prefix + '%',)).fetchone()
    seq = row['c'] + 1
    return f'{prefix}-{seq:03d}'


# ===== DONORS =====

@bp.route('/donors', methods=['GET'])

def list_donors():
    db = get_db()
    search = request.args.get('search', '')
    query = 'SELECT * FROM blood_donor'
    params = []
    if search:
        query += ' WHERE name LIKE ?'
        params.append(f'%{search}%')
    query += ' ORDER BY name ASC'
    donors = db.execute(query, params).fetchall()
    return jsonify([dict(d) for d in donors])


@bp.route('/donors', methods=['POST'])

def create_donor():
    db = get_db()
    data = request.get_json()

    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'name is required'}), 400

    blood_group = data.get('blood_group')
    if blood_group and blood_group not in ALLOWED_BLOOD_GROUPS:
        return jsonify({'error': 'Invalid blood group'}), 400

    donor_number = _next_donor_number(db)

    db.execute('''INSERT INTO blood_donor (donor_number, name, age, sex, blood_group, contact)
        VALUES (?, ?, ?, ?, ?, ?)''',
        (donor_number, name, data.get('age'), data.get('sex'),
         blood_group, (data.get('contact') or '').strip() or None))

    donor_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]

    log_action(db, 'CREATE', 'blood_donor', donor_id,
               [('donor_number', None, donor_number), ('name', None, name)],
               get_current_operator_name())

    db.commit()
    donor = db.execute('SELECT * FROM blood_donor WHERE id = ?', (donor_id,)).fetchone()
    return jsonify(dict(donor)), 201


# ===== BLOOD UNITS =====

@bp.route('/units', methods=['GET'])

def list_units():
    db = get_db()
    status = request.args.get('status')
    query = '''SELECT bu.*, bd.name as donor_name FROM blood_unit bu
               LEFT JOIN blood_donor bd ON bu.donor_id = bd.id'''
    params = []
    if status:
        query += ' WHERE bu.status = ?'
        params.append(status)
    query += ' ORDER BY bu.expiry_date ASC'
    units = db.execute(query, params).fetchall()

    # Auto-expire units past expiry date
    today = datetime.now().strftime('%Y-%m-%d')
    expired_ids = []
    result = []
    for u in units:
        d = dict(u)
        if d['status'] == 'AVAILABLE' and d['expiry_date'] < today:
            d['status'] = 'EXPIRED'
            expired_ids.append(d['id'])
        result.append(d)

    if expired_ids:
        for eid in expired_ids:
            db.execute("UPDATE blood_unit SET status = 'EXPIRED', updated_at = datetime('now') WHERE id = ?", (eid,))
        db.commit()

    return jsonify(result)


@bp.route('/units', methods=['POST'])

def create_unit():
    db = get_db()
    data = request.get_json()

    donor_id = data.get('donor_id')
    blood_group = data.get('blood_group')
    if not blood_group or blood_group not in ALLOWED_BLOOD_GROUPS:
        return jsonify({'error': 'Valid blood_group is required'}), 400

    unit_number = _next_unit_number(db)
    collection_date = data.get('collection_date', datetime.now().strftime('%Y-%m-%d'))
    expiry_date = data.get('expiry_date')
    if not expiry_date:
        exp = datetime.strptime(collection_date, '%Y-%m-%d') + timedelta(days=35)
        expiry_date = exp.strftime('%Y-%m-%d')

    db.execute('''INSERT INTO blood_unit
        (unit_number, donor_id, blood_group, collection_date, expiry_date, volume_ml,
         screening_hiv, screening_hbv, screening_hcv, screening_syphilis)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (unit_number, donor_id, blood_group, collection_date, expiry_date,
         data.get('volume_ml', 450),
         data.get('screening_hiv'), data.get('screening_hbv'),
         data.get('screening_hcv'), data.get('screening_syphilis')))

    unit_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]

    # Update donor's last donation date
    if donor_id:
        db.execute('UPDATE blood_donor SET last_donation_date = ? WHERE id = ?',
                   (collection_date, donor_id))

    log_action(db, 'CREATE', 'blood_unit', unit_id,
               [('unit_number', None, unit_number), ('blood_group', None, blood_group)],
               get_current_operator_name())

    db.commit()
    unit = db.execute('SELECT * FROM blood_unit WHERE id = ?', (unit_id,)).fetchone()
    return jsonify(dict(unit)), 201


@bp.route('/units/<int:unit_id>', methods=['PUT'])

def update_unit(unit_id):
    db = get_db()
    data = request.get_json()

    current = db.execute('SELECT * FROM blood_unit WHERE id = ?', (unit_id,)).fetchone()
    if not current:
        return jsonify({'error': 'Unit not found'}), 404

    new_status = data.get('status')
    if new_status and new_status not in ALLOWED_UNIT_STATUS:
        return jsonify({'error': 'Invalid status'}), 400

    if new_status:
        old_status = current['status']
        db.execute("UPDATE blood_unit SET status = ?, updated_at = datetime('now') WHERE id = ?",
                   (new_status, unit_id))
        log_action(db, 'UPDATE', 'blood_unit', unit_id,
                   [('status', old_status, new_status)],
                   get_current_operator_name())

    db.commit()
    unit = db.execute('SELECT * FROM blood_unit WHERE id = ?', (unit_id,)).fetchone()
    return jsonify(dict(unit))


# ===== TRANSFUSIONS =====

@bp.route('/transfusions', methods=['GET'])

def list_transfusions():
    db = get_db()
    rows = db.execute('''SELECT tr.*, bu.unit_number, bu.blood_group as unit_blood_group
        FROM transfusion_record tr
        JOIN blood_unit bu ON tr.unit_id = bu.id
        ORDER BY tr.created_at DESC''').fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route('/transfusions', methods=['POST'])

def create_transfusion():
    db = get_db()
    data = request.get_json()

    unit_id = data.get('unit_id')
    if not unit_id:
        return jsonify({'error': 'unit_id is required'}), 400

    unit = db.execute('SELECT * FROM blood_unit WHERE id = ?', (unit_id,)).fetchone()
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    if unit['status'] != 'AVAILABLE':
        return jsonify({'error': 'Unit is not available'}), 400

    patient_name = (data.get('patient_name') or '').strip()
    if not patient_name:
        return jsonify({'error': 'patient_name is required'}), 400

    crossmatch = data.get('crossmatch_result')
    if crossmatch and crossmatch not in ('COMPATIBLE', 'INCOMPATIBLE'):
        return jsonify({'error': 'Invalid crossmatch result'}), 400

    db.execute('''INSERT INTO transfusion_record
        (unit_id, patient_name, patient_id, patient_blood_group, crossmatch_result,
         crossmatch_by, issued_date, issued_to_ward)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (unit_id, patient_name, data.get('patient_id'),
         data.get('patient_blood_group'), crossmatch,
         data.get('crossmatch_by'),
         data.get('issued_date', datetime.now().strftime('%Y-%m-%d')),
         data.get('issued_to_ward')))

    tr_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]

    # Mark unit as ISSUED
    db.execute("UPDATE blood_unit SET status = 'ISSUED', updated_at = datetime('now') WHERE id = ?",
               (unit_id,))

    log_action(db, 'CREATE', 'transfusion_record', tr_id,
               [('unit_id', None, str(unit_id)), ('patient_name', None, patient_name)],
               get_current_operator_name())

    db.commit()
    tr = db.execute('SELECT * FROM transfusion_record WHERE id = ?', (tr_id,)).fetchone()
    return jsonify(dict(tr)), 201


@bp.route('/transfusions/<int:tr_id>', methods=['PUT'])

def update_transfusion(tr_id):
    db = get_db()
    data = request.get_json()

    current = db.execute('SELECT * FROM transfusion_record WHERE id = ?', (tr_id,)).fetchone()
    if not current:
        return jsonify({'error': 'Transfusion not found'}), 404

    changes = []
    if 'transfusion_completed' in data:
        db.execute('UPDATE transfusion_record SET transfusion_completed = ? WHERE id = ?',
                   (data['transfusion_completed'], tr_id))
        changes.append(('transfusion_completed', current['transfusion_completed'],
                       data['transfusion_completed']))

    if 'adverse_reaction' in data:
        db.execute('UPDATE transfusion_record SET adverse_reaction = ?, reaction_details = ? WHERE id = ?',
                   (data['adverse_reaction'], data.get('reaction_details'), tr_id))
        changes.append(('adverse_reaction', str(current['adverse_reaction']),
                       str(data['adverse_reaction'])))

    if changes:
        log_action(db, 'UPDATE', 'transfusion_record', tr_id, changes,
                   get_current_operator_name())

    db.commit()
    tr = db.execute('SELECT * FROM transfusion_record WHERE id = ?', (tr_id,)).fetchone()
    return jsonify(dict(tr))
