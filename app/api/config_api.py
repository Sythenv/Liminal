"""Configuration API - site settings and test menu management."""

import json
from flask import Blueprint, request, jsonify
from app.db import get_db

bp = Blueprint('config', __name__)


@bp.route('/site', methods=['GET'])
def get_site():
    db = get_db()
    site = db.execute('SELECT * FROM site_config WHERE id = 1').fetchone()
    return jsonify(dict(site) if site else {})


@bp.route('/site', methods=['PUT'])
def update_site():
    db = get_db()
    data = request.get_json()
    fields = []
    values = []
    for field in ['site_name', 'site_code', 'country', 'default_language']:
        if field in data:
            fields.append(f'{field} = ?')
            values.append(data[field])
    if fields:
        fields.append("updated_at = datetime('now')")
        values.append(1)
        db.execute(f'UPDATE site_config SET {", ".join(fields)} WHERE id = ?', values)
        db.commit()
    site = db.execute('SELECT * FROM site_config WHERE id = 1').fetchone()
    return jsonify(dict(site))


@bp.route('/tests', methods=['GET'])
def list_tests():
    db = get_db()
    tests = db.execute('SELECT * FROM test_definition ORDER BY display_order').fetchall()
    return jsonify([dict(t) for t in tests])


@bp.route('/tests', methods=['POST'])
def add_test():
    db = get_db()
    data = request.get_json()
    db.execute('''INSERT INTO test_definition
        (code, name_en, name_fr, category, specimen_types, result_type, unit, reference_range_text, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (data['code'], data['name_en'], data.get('name_fr', data['name_en']),
         data.get('category', 'OTHER'), json.dumps(data.get('specimen_types', [])),
         data.get('result_type', 'TEXT'), data.get('unit'),
         data.get('reference_range_text'),
         data.get('display_order', 99)))
    db.commit()
    return jsonify({'ok': True}), 201


@bp.route('/tests/<int:test_id>', methods=['PUT'])
def update_test(test_id):
    db = get_db()
    data = request.get_json()
    fields = []
    values = []
    for field in ['name_en', 'name_fr', 'category', 'result_type', 'unit',
                  'reference_range_text', 'display_order', 'is_active']:
        if field in data:
            fields.append(f'{field} = ?')
            values.append(data[field])
    if 'specimen_types' in data:
        fields.append('specimen_types = ?')
        values.append(json.dumps(data['specimen_types']))
    if fields:
        values.append(test_id)
        db.execute(f'UPDATE test_definition SET {", ".join(fields)} WHERE id = ?', values)
        db.commit()
    test = db.execute('SELECT * FROM test_definition WHERE id = ?', (test_id,)).fetchone()
    return jsonify(dict(test))


@bp.route('/tests/<int:test_id>/toggle', methods=['PUT'])
def toggle_test(test_id):
    db = get_db()
    db.execute('UPDATE test_definition SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?',
               (test_id,))
    db.commit()
    test = db.execute('SELECT * FROM test_definition WHERE id = ?', (test_id,)).fetchone()
    return jsonify(dict(test))
