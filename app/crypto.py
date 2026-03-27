"""Field-level encryption for sensitive data (donor names, screening results).

Uses AES-256-GCM with PBKDF2-derived key. Encrypted values are prefixed with 'ENC:'
to distinguish from plaintext (backward compatibility with existing data).
"""

import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

# Site-level salt for key derivation (generated once, stored in site_config)
# This is NOT the same as the operator PIN salt
ENCRYPTION_SALT_KEY = 'encryption_salt'


def derive_key(pin, salt_bytes):
    """Derive a 256-bit AES key from a PIN using PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt_bytes,
        iterations=100_000,
    )
    return kdf.derive(str(pin).encode('utf-8'))


def encrypt_field(value, key):
    """Encrypt a string value with AES-256-GCM. Returns 'ENC:' prefixed base64."""
    if value is None:
        return None
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, value.encode('utf-8'), None)
    encoded = base64.b64encode(nonce + ciphertext).decode('ascii')
    return f'ENC:{encoded}'


def decrypt_field(encrypted, key):
    """Decrypt an 'ENC:' prefixed value. Returns plaintext or None on failure."""
    if encrypted is None:
        return None
    if not encrypted.startswith('ENC:'):
        return encrypted  # Not encrypted (legacy data)
    try:
        raw = base64.b64decode(encrypted[4:])
        nonce = raw[:12]
        ciphertext = raw[12:]
        aesgcm = AESGCM(key)
        return aesgcm.decrypt(nonce, ciphertext, None).decode('utf-8')
    except Exception:
        return None  # Decryption failed (wrong key or corrupted data)


def is_encrypted(value):
    """Check if a value is encrypted."""
    return value is not None and value.startswith('ENC:')


def get_encryption_salt(db):
    """Get or create the site encryption salt (stored in site_config)."""
    row = db.execute("SELECT lab_number_prefix FROM site_config WHERE id = 1").fetchone()
    # Reuse lab_number_prefix field? No, add a dedicated column via migration.
    # For now, use a fixed salt derived from site_code — deterministic per site.
    site = db.execute("SELECT site_code FROM site_config WHERE id = 1").fetchone()
    site_code = site['site_code'] if site else 'LAB'
    # Combine site_code with a fixed app-level secret to get a salt
    return (site_code + ':lims-encryption-salt-v1').encode('utf-8')


def get_encryption_key(db, admin_pin):
    """Get the site encryption key, derived from admin PIN + site salt."""
    salt_bytes = get_encryption_salt(db)
    return derive_key(admin_pin, salt_bytes)
