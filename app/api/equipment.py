"""Equipment & Maintenance API."""

from flask import Blueprint, request, jsonify
from app.db import get_db
from app.audit import log_action
from app.auth import get_current_operator_name

bp = Blueprint('equipment', __name__)

ALLOWED_CONDITIONS = {'Good', 'Fair', 'Poor', 'Out of service'}
ALLOWED_MAINT_TYPES = {'PREVENTIVE', 'CORRECTIVE', 'CALIBRATION'}
EQUIPMENT_CATEGORIES = [
    'Freezer', 'Refrigerator', 'Microscope', 'Centrifuge', 'Analyzer',
    'Incubator', 'Autoclave', 'Balance', 'Timer', 'Thermometer',
    'Pipette', 'Water Bath', 'Vortex', 'Safety Cabinet', 'Generator',
    'UPS', 'Other'
]


@bp.route('', methods=['GET'])
def list_equipment():
    db = get_db()
    rows = db.execute('SELECT * FROM equipment ORDER BY name ASC').fetchall()
    result = []
    for eq in rows:
        d = dict(eq)
        # Get last maintenance and next scheduled
        last = db.execute('''SELECT log_date, maintenance_type, next_scheduled
            FROM maintenance_log WHERE equipment_id = ? ORDER BY log_date DESC LIMIT 1''',
            (eq['id'],)).fetchone()
        d['last_maintenance'] = dict(last) if last else None
        result.append(d)
    return jsonify(result)


@bp.route('', methods=['POST'])

def create_equipment():
    db = get_db()
    data = request.get_json()

    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'name is required'}), 400

    condition = data.get('physical_condition', 'Good')
    if condition not in ALLOWED_CONDITIONS:
        return jsonify({'error': 'Invalid condition'}), 400

    db.execute('''INSERT INTO equipment
        (name, model, serial_number, manufacturer, installation_date, location,
         category, physical_condition, maintenance_frequency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (name,
         (data.get('model') or '').strip() or None,
         (data.get('serial_number') or '').strip() or None,
         (data.get('manufacturer') or '').strip() or None,
         data.get('installation_date'),
         (data.get('location') or '').strip() or None,
         data.get('category'),
         condition,
         data.get('maintenance_frequency')))

    eq_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]

    log_action(db, 'CREATE', 'equipment', eq_id,
               [('name', None, name), ('category', None, data.get('category'))],
               get_current_operator_name())

    db.commit()
    eq = db.execute('SELECT * FROM equipment WHERE id = ?', (eq_id,)).fetchone()
    return jsonify(dict(eq)), 201


@bp.route('/<int:eq_id>', methods=['PUT'])

def update_equipment(eq_id):
    db = get_db()
    data = request.get_json()

    current = db.execute('SELECT * FROM equipment WHERE id = ?', (eq_id,)).fetchone()
    if not current:
        return jsonify({'error': 'Equipment not found'}), 404

    allowed = ['name', 'model', 'serial_number', 'manufacturer', 'installation_date',
               'location', 'category', 'physical_condition', 'maintenance_frequency', 'is_active']
    changes = []
    fields = []
    values = []

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

    values.append(eq_id)
    db.execute(f'UPDATE equipment SET {", ".join(fields)} WHERE id = ?', values)

    if changes:
        log_action(db, 'UPDATE', 'equipment', eq_id, changes,
                   get_current_operator_name())

    db.commit()
    eq = db.execute('SELECT * FROM equipment WHERE id = ?', (eq_id,)).fetchone()
    return jsonify(dict(eq))


@bp.route('/<int:eq_id>/maintenance', methods=['GET'])
def list_maintenance(eq_id):
    db = get_db()
    rows = db.execute('''SELECT * FROM maintenance_log
        WHERE equipment_id = ? ORDER BY log_date DESC''', (eq_id,)).fetchall()
    return jsonify([dict(r) for r in rows])


@bp.route('/<int:eq_id>/maintenance', methods=['POST'])

def add_maintenance(eq_id):
    db = get_db()
    data = request.get_json()

    eq = db.execute('SELECT id FROM equipment WHERE id = ?', (eq_id,)).fetchone()
    if not eq:
        return jsonify({'error': 'Equipment not found'}), 404

    mtype = (data.get('maintenance_type') or '').upper()
    if mtype not in ALLOWED_MAINT_TYPES:
        return jsonify({'error': 'Invalid maintenance type'}), 400

    from datetime import datetime
    log_date = data.get('log_date', datetime.now().strftime('%Y-%m-%d'))

    db.execute('''INSERT INTO maintenance_log
        (equipment_id, log_date, maintenance_type, description, parts_replaced,
         next_scheduled, performed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)''',
        (eq_id, log_date, mtype,
         (data.get('description') or '').strip() or None,
         (data.get('parts_replaced') or '').strip() or None,
         data.get('next_scheduled'),
         (data.get('performed_by') or '').strip() or None))

    log_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]

    log_action(db, 'CREATE', 'maintenance_log', log_id,
               [('equipment_id', None, str(eq_id)), ('type', None, mtype)],
               get_current_operator_name())

    db.commit()
    entry = db.execute('SELECT * FROM maintenance_log WHERE id = ?', (log_id,)).fetchone()
    return jsonify(dict(entry)), 201
