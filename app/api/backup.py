"""Backup and restore API for the lab database."""

import os
import re
import shutil
import sqlite3
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from app.auth import get_current_operator_name
from app.db import get_db

bp = Blueprint('backup', __name__)


def _backup_dir():
    """Return the backup directory path, creating it if needed."""
    d = os.path.join(current_app.config['DATA_DIR'], 'backups')
    os.makedirs(d, exist_ok=True)
    return d


@bp.route('', methods=['POST'])
def create_backup():
    """Create a backup of the current database."""
    db_path = current_app.config['DATABASE']
    if not os.path.exists(db_path):
        return jsonify({'error': 'Database not found'}), 404

    now = datetime.now()
    filename = f"lab_{now.strftime('%Y-%m-%d_%H%M')}.db"
    dest = os.path.join(_backup_dir(), filename)

    shutil.copy2(db_path, dest)
    size = os.path.getsize(dest)

    # Log the backup action directly (no compute_hash since there's no backup table)
    db = get_db()
    operator = get_current_operator_name()
    db.execute('''INSERT INTO audit_log
        (action, table_name, record_id, field_name, old_value, new_value, operator)
        VALUES (?, ?, ?, ?, ?, ?, ?)''',
        ('BACKUP', 'system', 0, 'filename', None, filename, operator))
    db.commit()

    return jsonify({'filename': filename, 'size': size}), 201


@bp.route('', methods=['GET'])
def list_backups():
    """List all available backups sorted by date descending."""
    backup_dir = _backup_dir()
    backups = []
    for f in os.listdir(backup_dir):
        if f.endswith('.db'):
            path = os.path.join(backup_dir, f)
            stat = os.stat(path)
            backups.append({
                'filename': f,
                'size': stat.st_size,
                'created': datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
    backups.sort(key=lambda b: b['created'], reverse=True)
    return jsonify({'backups': backups}), 200


@bp.route('/<filename>', methods=['GET'])
def download_backup(filename):
    """Download a specific backup file."""
    # Validate filename — no path traversal
    if not re.match(r'^[a-zA-Z0-9_\-\.]+\.db$', filename):
        return jsonify({'error': 'Invalid filename'}), 400
    if '..' in filename or '/' in filename:
        return jsonify({'error': 'Invalid filename'}), 400

    backup_dir = _backup_dir()
    filepath = os.path.join(backup_dir, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Backup not found'}), 404

    return send_from_directory(backup_dir, filename, as_attachment=True)


@bp.route('/restore', methods=['POST'])
def restore_backup():
    """Restore the database from an uploaded file."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    # Save uploaded file to a temp location
    backup_dir = _backup_dir()
    tmp_path = os.path.join(backup_dir, '_restore_tmp.db')
    file.save(tmp_path)

    # Validate it's a valid SQLite database with lab_register table
    try:
        conn = sqlite3.connect(tmp_path)
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='lab_register'"
        )
        if cursor.fetchone() is None:
            conn.close()
            os.remove(tmp_path)
            return jsonify({'error': 'Invalid database: lab_register table not found'}), 400
        conn.close()
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        return jsonify({'error': 'Invalid SQLite database'}), 400

    # Auto-backup current DB before restore
    db_path = current_app.config['DATABASE']
    if os.path.exists(db_path):
        now = datetime.now()
        auto_name = f"lab_{now.strftime('%Y-%m-%d_%H%M')}_prerestore.db"
        shutil.copy2(db_path, os.path.join(backup_dir, auto_name))

    # Replace current DB
    shutil.move(tmp_path, db_path)

    return jsonify({'ok': True, 'message': 'Restored. Restart required.'}), 200
