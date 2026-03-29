"""Configuration API - site config and test menu management."""

import json
from flask import Blueprint, jsonify, request
from app.db import get_db
from app.audit import log_action
from app.auth import get_current_operator_name

bp = Blueprint('config', __name__)


@bp.route('/tests', methods=['GET'])
def list_tests():
    db = get_db()
    tests = db.execute('SELECT * FROM test_definition WHERE is_active = 1 ORDER BY display_order').fetchall()
    return jsonify([dict(t) for t in tests])


@bp.route('/tests/all', methods=['GET'])
def list_all_tests():
    """List all tests including inactive ones."""
    db = get_db()
    tests = db.execute('SELECT * FROM test_definition ORDER BY display_order').fetchall()
    return jsonify([dict(t) for t in tests])


@bp.route('/tests', methods=['PUT'])
def update_active_tests():
    """Update which tests are active. Body: {"active_tests": ["MAL_RDT", "HB", ...]}"""
    db = get_db()
    data = request.get_json()
    active_codes = data.get('active_tests', [])

    if not isinstance(active_codes, list):
        return jsonify({'error': 'active_tests must be a list'}), 400

    # Deactivate all, then activate selected
    db.execute('UPDATE test_definition SET is_active = 0')
    if active_codes:
        placeholders = ','.join('?' for _ in active_codes)
        db.execute(
            f'UPDATE test_definition SET is_active = 1 WHERE code IN ({placeholders})',
            active_codes
        )
    log_action(db, 'CONFIG_UPDATE', 'test_definition', 0,
               [('active_tests', None, ','.join(active_codes))],
               get_current_operator_name())
    db.commit()

    # Return updated list
    tests = db.execute('SELECT code, name_en, is_active FROM test_definition ORDER BY display_order').fetchall()
    return jsonify({'ok': True, 'tests': [dict(t) for t in tests]})


@bp.route('', methods=['GET'])
def get_site_config():
    """Get site configuration."""
    db = get_db()
    config = db.execute('SELECT * FROM site_config WHERE id = 1').fetchone()
    if not config:
        return jsonify({'error': 'No site config found'}), 404
    return jsonify(dict(config))


@bp.route('', methods=['PUT'])
def update_site_config():
    """Update site configuration."""
    db = get_db()
    data = request.get_json()

    allowed_fields = ['site_name', 'site_code', 'country', 'default_language', 'print_config']
    updates = []
    values = []

    # Validate and serialize print_config if present
    if 'print_config' in data:
        pc = data['print_config']
        if isinstance(pc, str):
            try:
                pc = json.loads(pc)
            except json.JSONDecodeError:
                return jsonify({'error': 'print_config must be valid JSON'}), 400
        if not isinstance(pc, dict):
            return jsonify({'error': 'print_config must be a JSON object'}), 400
        data['print_config'] = json.dumps(pc)

    for field in allowed_fields:
        if field in data:
            val = data[field]
            if field != 'print_config':
                val = (val or '').strip()
                if not val:
                    return jsonify({'error': f'{field} cannot be empty'}), 400
            updates.append(f'{field} = ?')
            values.append(val)

    if not updates:
        return jsonify({'error': 'No valid fields to update'}), 400

    # Validate site_code length
    if 'site_code' in data:
        code = data['site_code'].strip()
        if len(code) < 3 or len(code) > 5:
            return jsonify({'error': 'site_code must be 3-5 characters'}), 400

    # Update lab_number_prefix if site_code changed
    if 'site_code' in data:
        updates.append('lab_number_prefix = ?')
        values.append(data['site_code'].strip() + '-')

    updates.append("updated_at = datetime('now')")
    values.append(1)  # WHERE id = 1

    # Build audit changes from the fields being updated
    current = db.execute('SELECT * FROM site_config WHERE id = 1').fetchone()
    audit_changes = []
    for field in allowed_fields:
        if field in data:
            old_val = current[field] if current else None
            new_val = data[field].strip() if isinstance(data[field], str) and field != 'print_config' else data[field]
            audit_changes.append((field, old_val, new_val))

    db.execute(f"UPDATE site_config SET {', '.join(updates)} WHERE id = ?", values)
    if audit_changes:
        log_action(db, 'CONFIG_UPDATE', 'site_config', 1, audit_changes, get_current_operator_name())
    db.commit()

    config = db.execute('SELECT * FROM site_config WHERE id = 1').fetchone()
    return jsonify({'ok': True, 'config': dict(config)})
