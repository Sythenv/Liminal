"""Centralized auth engine — PIN verification + route-level access control.

How it works:
- ROUTE_LEVELS defines the required level for each (method, path) pair
- A single before_request middleware resolves the operator from X-Operator-Pin header
- If the route requires a level, the middleware enforces it
- Endpoints read g.operator without caring about auth logic
- Four-eyes rule is enforced in the validate endpoint via audit_log check
- Rate limiting: 5 failed attempts → 60s lockout per IP

No decorators on endpoints. No auth imports in API modules (except get_current_operator_name).
"""

import os
import re
import hashlib
import time

# PINs blocked: duress patterns + common weak sequences
WEAK_PINS = {'0000','1111','2222','3333','4444','5555','6666','7777','8888','9999',
             '1234','4321','0123','1230','9876','6789'}

# Rate limiting: global counter (localhost = single IP, per-IP is useless)
RATE_LIMIT_MAX = 5       # max failures before lockout
RATE_LIMIT_WINDOW = 60   # lockout duration in seconds
_failed_attempts = {'count': 0, 'first_fail': 0, 'locked_until': 0}

from flask import Blueprint, request, jsonify, g
from app.db import get_db

bp = Blueprint('auth', __name__)


# ===== ROUTE ACCESS TABLE =====
# (method, path_pattern) → minimum level required
# Patterns use * as wildcard for path segments
# Routes not listed here: no auth required (public)

ROUTE_LEVELS = {
    # Register — Level 1 (operator)
    ('POST', '/api/register/entries'):              1,
    ('POST', '/api/register/entries/*/results'):    1,
    ('POST', '/api/register/entries/*/reject'):     1,
    ('PUT',  '/api/register/entries/*'):            2,
    ('DELETE', '/api/register/entries/*'):           2,

    # Register — Level 2 (supervisor)
    ('POST', '/api/register/entries/*/validate'):   2,
    ('POST', '/api/register/entries/*/unreject'):    2,
    ('GET',  '/api/register/entries/*/audit'):       2,

    # Patients — search is public, create/list is level 1, edit is level 2
    ('POST', '/api/patients'):                      1,
    ('GET',  '/api/patients'):                      1,
    ('PUT',  '/api/patients/*'):                    2,

    # Blood Bank — Level 3 for donors/units, Level 2 for transfusions
    ('GET',  '/api/bloodbank/donors'):              3,
    ('POST', '/api/bloodbank/donors'):              3,
    ('GET',  '/api/bloodbank/units'):               2,
    ('POST', '/api/bloodbank/units'):               3,
    ('PUT',  '/api/bloodbank/units/*'):             3,
    ('GET',  '/api/bloodbank/transfusions'):        2,
    ('POST', '/api/bloodbank/transfusions'):        2,
    ('PUT',  '/api/bloodbank/transfusions/*'):      2,

    # Equipment — Level 3 for create/edit, Level 1 for maintenance log
    ('POST', '/api/equipment'):                     3,
    ('PUT',  '/api/equipment/*'):                   3,
    ('POST', '/api/equipment/*/maintenance'):       1,

    # Reports — Level 2
    ('POST', '/api/reports/monthly'):               2,

    # Export — Level 2 (POST to generate, GET download is public — generation is already gated)
    ('POST', '/api/export/excel'):                  2,
    ('POST', '/api/export/csv'):                    2,

    # Auth — Level 3 for operator management
    ('GET',  '/api/auth/operators'):                3,
    ('POST', '/api/auth/operators'):                3,
    ('PUT',  '/api/auth/operators/*'):              3,
    ('DELETE', '/api/auth/operators/*'):             3,

    # Backup — Level 3 (GET list/download public — POST create/restore gated)
    ('POST', '/api/backup'):                        3,
    ('GET',  '/api/backup'):                        3,
    ('POST', '/api/backup/restore'):                3,

    # Config — Level 3
    ('PUT',  '/api/config'):                        3,
    ('PUT',  '/api/config/tests'):                  3,
}

# Paths that skip auth entirely (no PIN needed, no level check)
SKIP_AUTH = {
    '/api/auth/setup',
    '/api/auth/verify',
}

# Prefixes that skip auth (HTML pages, static files)
SKIP_PREFIXES = ('/static/', '/register', '/patients', '/reports',
                 '/bloodbank', '/equipment', '/export', '/settings')


def _match_route(method, path):
    """Find the required level for a (method, path) pair. Returns None if no rule matches."""
    for (rule_method, rule_pattern), level in ROUTE_LEVELS.items():
        if method != rule_method:
            continue
        # Convert pattern to regex: * matches one path segment
        regex = '^' + rule_pattern.replace('*', '[^/]+') + '$'
        if re.match(regex, path):
            return level
    return None


# ===== PIN HELPERS =====

def generate_salt():
    return os.urandom(16).hex()


def hash_pin(pin, salt):
    """Hash PIN with scrypt (CPU+memory hard, resistant to brute-force).
    Falls back to SHA-256 check for legacy hashes during migration."""
    salt_bytes = bytes.fromhex(salt)
    dk = hashlib.scrypt(str(pin).encode('utf-8'), salt=salt_bytes, n=16384, r=8, p=1, dklen=32)
    return dk.hex()


def _hash_pin_legacy(pin, salt):
    """Legacy SHA-256 hash for migration compatibility."""
    return hashlib.sha256((str(pin) + salt).encode('utf-8')).hexdigest()


def verify_pin(pin, operator_row):
    """Verify PIN against stored hash. Supports both scrypt and legacy SHA-256."""
    salt = operator_row['pin_salt']
    stored = operator_row['pin_hash']
    # Try scrypt first
    if hash_pin(pin, salt) == stored:
        return True
    # Fallback to legacy SHA-256 (pre-migration hashes)
    if _hash_pin_legacy(pin, salt) == stored:
        return True
    return False


def validate_new_pin(db, pin):
    """Validate a new PIN. Returns error string or None if OK."""
    if len(pin) < 4 or len(pin) > 8 or not pin.isdigit():
        return 'PIN must be 4-8 digits'
    if pin in WEAK_PINS:
        return 'PIN too weak (common pattern)'
    # Check for duplicates
    for op in db.execute('SELECT pin_hash, pin_salt FROM operator WHERE is_active = 1').fetchall():
        if hash_pin(pin, op['pin_salt']) == op['pin_hash']:
            return 'PIN already in use by another operator'
    return None


def get_operator_by_pin(db, pin):
    operators = db.execute('SELECT * FROM operator WHERE is_active = 1').fetchall()
    for op in operators:
        if verify_pin(pin, op):
            # Auto-upgrade legacy SHA-256 hash to scrypt on successful login
            scrypt_hash = hash_pin(pin, op['pin_salt'])
            if op['pin_hash'] != scrypt_hash:
                db.execute('UPDATE operator SET pin_hash = ? WHERE id = ?', (scrypt_hash, op['id']))
                db.commit()
            return op
    return None


def get_current_operator_name():
    """Get the name of the authenticated operator, or 'SYSTEM' if none."""
    op = getattr(g, 'operator', None)
    return op['name'] if op else 'SYSTEM'


# ===== RATE LIMITING =====

def _check_rate_limit():
    """Returns seconds remaining in lockout, or 0 if OK."""
    if _failed_attempts['locked_until'] > time.time():
        return int(_failed_attempts['locked_until'] - time.time())
    if time.time() - _failed_attempts['first_fail'] > RATE_LIMIT_WINDOW:
        _failed_attempts['count'] = 0
        _failed_attempts['first_fail'] = 0
        _failed_attempts['locked_until'] = 0
    return 0


def _record_failure():
    """Record a failed attempt. Returns True if now locked out."""
    now = time.time()
    if _failed_attempts['count'] == 0 or now - _failed_attempts['first_fail'] > RATE_LIMIT_WINDOW:
        _failed_attempts['count'] = 1
        _failed_attempts['first_fail'] = now
        _failed_attempts['locked_until'] = 0
        return False
    _failed_attempts['count'] += 1
    if _failed_attempts['count'] >= RATE_LIMIT_MAX:
        _failed_attempts['locked_until'] = now + RATE_LIMIT_WINDOW
        return True
    return False


def _clear_failures():
    """Clear failures on successful auth."""
    _failed_attempts['count'] = 0
    _failed_attempts['first_fail'] = 0
    _failed_attempts['locked_until'] = 0


# ===== MIDDLEWARE =====

def auth_middleware():
    """Single before_request hook that handles ALL auth logic."""
    path = request.path
    method = request.method

    # Skip auth for specific paths
    if path in SKIP_AUTH or path == '/':
        return None
    for prefix in SKIP_PREFIXES:
        if path.startswith(prefix):
            return None

    # Find required level for this route
    required_level = _match_route(method, path)

    # No rule = public endpoint (GET /api/config/tests, GET /api/register/entries, etc.)
    if required_level is None:
        g.operator = None
        return None

    # Route requires auth — check for operators first
    db = get_db()
    count = db.execute('SELECT COUNT(*) as c FROM operator').fetchone()['c']
    if count == 0:
        # No operators yet (first-run) — allow everything
        g.operator = None
        return None

    # Check PIN header
    pin = request.headers.get('X-Operator-Pin')
    if not pin:
        return jsonify({'error': 'Authentication required', 'required_level': required_level}), 401

    # Rate limit check (global — localhost means per-IP is useless)
    lockout = _check_rate_limit()
    if lockout > 0:
        return jsonify({'error': f'Too many failed attempts. Retry in {lockout}s', 'locked': True}), 429

    operator = get_operator_by_pin(db, pin)
    if not operator:
        locked = _record_failure()
        if locked:
            from app.audit import log_action
            log_action(db, 'LOCKOUT', 'auth', 0, [], 'SYSTEM')
            db.commit()
        return jsonify({'error': 'Invalid PIN'}), 401

    _clear_failures()

    if operator['level'] < required_level:
        return jsonify({'error': f'Level {required_level} required, you are level {operator["level"]}'}), 403

    g.operator = dict(operator)
    return None


# ===== FOUR-EYES CHECK (called from validate endpoint) =====

def check_four_eyes(db, entry_id, current_operator_name):
    """Returns error message if four-eyes rule is violated, None if OK."""
    # Skip four-eyes if no operators configured or operator is SYSTEM (first-run/tests)
    if current_operator_name == 'SYSTEM':
        return None
    last_result = db.execute('''SELECT operator FROM audit_log
        WHERE table_name = 'lab_register' AND record_id = ? AND action = 'RESULT'
        ORDER BY id DESC LIMIT 1''', (entry_id,)).fetchone()
    if last_result and last_result['operator'] == current_operator_name:
        return 'Cannot validate your own results (four-eyes rule)'
    return None


# ===== AUTH API ENDPOINTS =====

@bp.route('/setup', methods=['POST'])
def setup():
    """First-run: create admin operator. Fails if any operator exists."""
    db = get_db()
    count = db.execute('SELECT COUNT(*) as c FROM operator').fetchone()['c']
    if count > 0:
        return jsonify({'error': 'Setup already completed'}), 400

    data = request.get_json()
    name = (data.get('name') or '').strip()
    pin = str(data.get('pin', ''))

    if not name:
        return jsonify({'error': 'name is required'}), 400

    pin_error = validate_new_pin(db, pin)
    if pin_error:
        return jsonify({'error': pin_error}), 400

    salt = generate_salt()
    pin_h = hash_pin(pin, salt)

    db.execute('INSERT INTO operator (name, pin_hash, pin_salt, level) VALUES (?, ?, ?, 3)',
               (name, pin_h, salt))
    db.commit()

    op_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
    from app.audit import log_action
    log_action(db, 'SETUP', 'operator', op_id,
               [('name', None, name), ('level', None, '3')],
               name)
    db.commit()

    return jsonify({'ok': True, 'message': f'Admin operator "{name}" created'}), 201


@bp.route('/verify', methods=['POST'])
def verify():
    """Verify a PIN and return operator info."""
    lockout = _check_rate_limit()
    if lockout > 0:
        return jsonify({'error': f'Too many failed attempts. Retry in {lockout}s', 'locked': True}), 429

    data = request.get_json()
    pin = str(data.get('pin', ''))

    db = get_db()
    operator = get_operator_by_pin(db, pin)
    if not operator:
        locked = _record_failure()
        if locked:
            from app.audit import log_action
            log_action(db, 'LOCKOUT', 'auth', 0, [], 'SYSTEM')
            db.commit()
        return jsonify({'error': 'Invalid PIN'}), 401

    _clear_failures()
    return jsonify({
        'id': operator['id'],
        'name': operator['name'],
        'level': operator['level']
    })


@bp.route('/operators', methods=['GET'])
def list_operators():
    """List all operators (admin only — enforced by ROUTE_LEVELS)."""
    db = get_db()
    operators = db.execute(
        'SELECT id, name, level, is_active, created_at FROM operator ORDER BY level DESC, name ASC'
    ).fetchall()
    return jsonify([dict(op) for op in operators])


@bp.route('/operators', methods=['POST'])
def create_operator():
    """Create a new operator (admin only)."""
    db = get_db()
    data = request.get_json()

    name = (data.get('name') or '').strip()
    pin = str(data.get('pin', ''))
    level = data.get('level', 1)

    if not name:
        return jsonify({'error': 'name is required'}), 400
    if level not in (1, 2, 3):
        return jsonify({'error': 'Invalid level'}), 400

    pin_error = validate_new_pin(db, pin)
    if pin_error:
        return jsonify({'error': pin_error}), 400

    salt = generate_salt()
    pin_h = hash_pin(pin, salt)

    db.execute('INSERT INTO operator (name, pin_hash, pin_salt, level) VALUES (?, ?, ?, ?)',
               (name, pin_h, salt, level))
    db.commit()

    op_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
    from app.audit import log_action
    log_action(db, 'CREATE', 'operator', op_id,
               [('name', None, name), ('level', None, str(level))],
               get_current_operator_name())
    db.commit()

    return jsonify({'id': op_id, 'name': name, 'level': level}), 201


@bp.route('/operators/<int:op_id>', methods=['PUT'])
def update_operator(op_id):
    """Update an operator (admin only)."""
    db = get_db()
    data = request.get_json()

    current = db.execute('SELECT * FROM operator WHERE id = ?', (op_id,)).fetchone()
    if not current:
        return jsonify({'error': 'Operator not found'}), 404

    changes = []

    if 'name' in data:
        changes.append(('name', current['name'], data['name']))
        db.execute('UPDATE operator SET name = ? WHERE id = ?', (data['name'], op_id))

    if 'level' in data:
        if data['level'] not in (1, 2, 3):
            return jsonify({'error': 'Invalid level'}), 400
        changes.append(('level', str(current['level']), str(data['level'])))
        db.execute('UPDATE operator SET level = ? WHERE id = ?', (data['level'], op_id))

    if 'is_active' in data:
        changes.append(('is_active', str(current['is_active']), str(data['is_active'])))
        db.execute('UPDATE operator SET is_active = ? WHERE id = ?', (data['is_active'], op_id))

    if 'pin' in data:
        new_pin = str(data['pin'])
        pin_error = validate_new_pin(db, new_pin)
        if pin_error:
            return jsonify({'error': pin_error}), 400
        salt = generate_salt()
        pin_h = hash_pin(new_pin, salt)
        db.execute('UPDATE operator SET pin_hash = ?, pin_salt = ? WHERE id = ?', (pin_h, salt, op_id))
        changes.append(('pin', '***', '***'))

    if changes:
        from app.audit import log_action
        log_action(db, 'UPDATE', 'operator', op_id, changes, get_current_operator_name())

    db.commit()
    op = db.execute('SELECT id, name, level, is_active, created_at FROM operator WHERE id = ?',
                    (op_id,)).fetchone()
    return jsonify(dict(op))


@bp.route('/operators/<int:op_id>', methods=['DELETE'])
def deactivate_operator(op_id):
    """Deactivate an operator (admin only)."""
    db = get_db()
    db.execute('UPDATE operator SET is_active = 0 WHERE id = ?', (op_id,))
    from app.audit import log_action
    log_action(db, 'UPDATE', 'operator', op_id,
               [('is_active', '1', '0')], get_current_operator_name())
    db.commit()
    return jsonify({'ok': True})
