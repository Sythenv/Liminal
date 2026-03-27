"""Audit trail for ISO 15189 compliance.

Every modification to patient data or results is logged with:
- Who (operator)
- What (action, field, old/new values)
- When (timestamp)
- Integrity hash (SHA256 of record state)
"""

import hashlib
import json


def compute_hash(db, table_name, record_id):
    """Compute SHA256 hash of a record's current state."""
    row = db.execute(f'SELECT * FROM {table_name} WHERE id = ?', (record_id,)).fetchone()
    if not row:
        return None
    data = {k: str(row[k]) if row[k] is not None else None for k in row.keys()}
    serialized = json.dumps(data, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()


def log_action(db, action, table_name, record_id, changes, operator='SYSTEM'):
    """Log one or more field changes to the audit trail.

    Args:
        db: SQLite connection
        action: CREATE, UPDATE, RESULT, REJECT, UNREJECT, VALIDATE, DELETE
        table_name: lab_register or lab_result
        record_id: ID of the affected record
        changes: list of (field_name, old_value, new_value) tuples
        operator: technician initials or 'SYSTEM'
    """
    entry_hash = compute_hash(db, table_name, record_id)

    if not changes:
        changes = [(None, None, None)]

    for field_name, old_value, new_value in changes:
        db.execute('''INSERT INTO audit_log
            (action, table_name, record_id, field_name, old_value, new_value, operator, entry_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (action, table_name, record_id, field_name,
             str(old_value) if old_value is not None else None,
             str(new_value) if new_value is not None else None,
             operator, entry_hash))


def verify_hash(db, table_name, record_id):
    """Verify record integrity by comparing current hash with last logged hash.

    Returns True if the record matches its last audit hash, False if tampered.
    Returns None if no audit trail exists for this record.
    """
    last_log = db.execute('''SELECT entry_hash FROM audit_log
        WHERE table_name = ? AND record_id = ? AND entry_hash IS NOT NULL
        ORDER BY id DESC LIMIT 1''',
        (table_name, record_id)).fetchone()

    if not last_log:
        return None

    current_hash = compute_hash(db, table_name, record_id)
    return current_hash == last_log['entry_hash']


def get_audit_trail(db, table_name, record_id):
    """Get full audit trail for a record, ordered by timestamp."""
    rows = db.execute('''SELECT * FROM audit_log
        WHERE table_name = ? AND record_id = ?
        ORDER BY timestamp ASC, id ASC''',
        (table_name, record_id)).fetchall()
    return [dict(r) for r in rows]
