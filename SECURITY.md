# Security

## Management Overview

Liminal is a laboratory information management system designed for MSF field deployments where internet connectivity is unreliable or absent. Every security decision reflects three constraints:

1. **Offline-first** — no dependency on external authentication providers, certificate authorities, or cloud services
2. **Field-reality** — operators wear gloves, share workstations, and work under pressure; security must not block patient care
3. **Single-machine** — the application, database, and user interface run on one laptop bound to localhost

Liminal is **not** a general-purpose web application. It does not face the internet. It does not store credentials for external services. Its threat model assumes a trusted local network perimeter and focuses on **data integrity, access control, and auditability** within that perimeter.

---

## Architecture

```
┌─────────────────────────────────┐
│         Browser (localhost)      │
│         Vanilla JS, no state    │
└──────────┬──────────────────────┘
           │ HTTP (localhost only)
           │ X-Operator-Pin header per request
┌──────────▼──────────────────────┐
│         Flask application        │
│  ┌────────────┐ ┌─────────────┐ │
│  │ Auth layer │ │ Audit layer │ │
│  │ (auth.py)  │ │ (audit.py)  │ │
│  └────────────┘ └─────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ Crypto module (crypto.py)   │ │
│  │ AES-256-GCM, PBKDF2        │ │
│  └─────────────────────────────┘ │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│   SQLite (data/lab.db)          │
│   WAL mode, foreign keys ON     │
└─────────────────────────────────┘
```

**Network exposure:** The application binds to `127.0.0.1` only. A `before_request` middleware rejects any request whose `Host` header is not `127.0.0.1` or `localhost` (HTTP 403).

---

## Authentication

### PIN-based, stateless

There are no sessions, cookies, or tokens. Every API request carries the operator's PIN in the `X-Operator-Pin` header. The server verifies it against a salted hash on each call.

This design eliminates session fixation, session hijacking, and token theft. The trade-off is a smaller keyspace (see [Limitations](#limitations)).

### PIN storage

| Parameter | Value |
|-----------|-------|
| Algorithm | SHA-256 |
| Salt | 16 bytes (`os.urandom(16)`), unique per operator |
| Storage | `pin_hash` + `pin_salt` columns in `operator` table |

### PIN strength rules

- Length: 4–8 digits, numeric only
- 16 weak patterns blacklisted (repeats: `0000`–`9999`, sequences: `1234`, `4321`, `0123`, `9876`, etc.)
- Uniqueness enforced: no two active operators may share a PIN

### Access levels

| Level | Role | Examples |
|-------|------|----------|
| 1 | Operator | Register samples, enter results, log maintenance |
| 2 | Supervisor | Validate results, unreject entries, view audit trail |
| 3 | Admin | Manage operators, backup/restore, modify site config |

Route-level enforcement is centralized in `ROUTE_LEVELS` (auth.py). Every new endpoint must be registered there.

### First-run behavior

When no operators exist in the database, all routes are accessible to allow initial setup via `/api/auth/setup`. Once the first admin operator is created, authentication is enforced globally.

---

## Authorization

### Four-eyes principle

The operator who entered a result **cannot** validate it. Enforced at `POST /api/register/entries/<id>/validate` by querying the audit trail for the last `RESULT` action on that entry. A bypass flag exists for emergencies and is audit-logged as `FOUR_EYES_BYPASS`.

### Route-level access control

A centralized `ROUTE_LEVELS` dictionary maps `(HTTP method, path pattern)` to a minimum access level. Wildcard matching (`*`) covers parameterized segments. The middleware runs before every request handler.

---

## Audit Trail

Implements ISO 15189 §5.9.3 (action traceability) and §5.10 (record integrity).

### What is logged

Every data mutation produces an `audit_log` row:

| Field | Content |
|-------|---------|
| `timestamp` | UTC datetime |
| `action` | CREATE, UPDATE, RESULT, REJECT, UNREJECT, VALIDATE, DELETE, FOUR_EYES_BYPASS, BACKUP, RESTORE, CONFIG_UPDATE, SETUP |
| `table_name` | Affected table |
| `record_id` | Primary key of affected record |
| `field_name` | Specific field (null if batch) |
| `old_value` | Previous value |
| `new_value` | New value |
| `operator` | Operator name or `SYSTEM` |
| `entry_hash` | SHA-256 integrity hash |

### Integrity hashing

Each audit entry includes a SHA-256 hash of the full record state at that point in time (JSON-serialized, sorted keys, UTF-8). The `verify_hash()` function can detect any modification made outside the audit trail by comparing the current record hash against the last logged hash.

### Immutability

The audit table is append-only. The application never issues UPDATE or DELETE on `audit_log`.

---

## Encryption

### Field-level encryption

| Parameter | Value |
|-----------|-------|
| Cipher | AES-256-GCM (authenticated encryption) |
| Nonce | 12 bytes, generated per encryption |
| Key derivation | PBKDF2-HMAC-SHA256, 100,000 iterations |
| Key material | Admin PIN + site-specific salt (`site_code + ':lims-encryption-salt-v1'`) |

Encrypted fields are prefixed with `ENC:` followed by Base64-encoded `nonce || ciphertext`. Plaintext fields (legacy or unencrypted) are returned as-is.

### Key management

Keys are derived on-demand from the admin PIN. No key is stored on disk. This means encrypted data is unreadable without a valid admin PIN, even with direct database access.

### Current scope

The crypto module is fully implemented and tested. It is designed for sensitive blood bank fields (donor identity, screening results). Integration is progressive — fields are encrypted as the module is wired into each API endpoint.

---

## HTTP Security Headers

Applied to every response via `after_request` middleware:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

Request body size is capped at 16 MB (`MAX_CONTENT_LENGTH`).

---

## Input Validation

### SQL injection

All queries use parameterized statements (`?` placeholders). String concatenation in SQL is forbidden by project convention (see CLAUDE.md).

### String sanitization

`sanitize_str(val, max_len=200)` strips whitespace and truncates input. Applied to all user-provided text fields (patient names, wards, remarks).

### Enumeration constraints

Controlled vocabularies are enforced server-side for: sex, sample status, rejection reasons, blood groups, blood unit status, maintenance types.

### Date/time format

Strict regex validation: `YYYY-MM-DD` for dates, `HH:MM` for times.

### Backup filename

Regex `^[a-zA-Z0-9_\-\.]+\.db$` with explicit rejection of `..` and `/` to prevent path traversal.

---

## Backup & Restore

- Backups are timestamped copies of `lab.db` stored in `data/backups/`
- Restore validates the uploaded file is a valid SQLite database containing expected tables
- A pre-restore safety backup is created automatically before overwriting the production database
- Both operations require Level 3 (admin) and are audit-logged

---

## Database

| Setting | Value | Purpose |
|---------|-------|---------|
| `journal_mode` | WAL | Concurrent reads, atomic writes |
| `foreign_keys` | ON | Referential integrity |

Migrations are append-only SQL files in `migrations/`. Existing migration files are never modified.

---

## Limitations

This section documents known limitations and their rationale. These are conscious trade-offs, not oversights.

### PIN keyspace

A 4-digit numeric PIN has 10,000 possible combinations. With the weak-pattern blacklist, the effective keyspace is smaller. This is accepted because:

- Physical access to the machine is required (localhost binding)
- The threat model does not include remote brute-force
- Gloved hands and shared workstations make complex passwords impractical
- Rate limiting can be added if field conditions change

### No TLS

Traffic never leaves localhost. TLS would require certificate management infrastructure that does not exist in field deployments and would add complexity without meaningful protection for loopback traffic.

### Physical device theft

Liminal is an application, not a full-disk encryption solution. If the device is stolen, the SQLite database is readable unless the host OS provides disk-level encryption.

**What Liminal does:**
- Field-level AES-256-GCM encryption for sensitive data (blood bank donor information)
- No persistent sessions or cached credentials to extract
- PIN hashes are salted (database dump does not reveal PINs)

**What the deploying organization must provide:**
- Full-disk encryption (BitLocker, LUKS, FileVault)
- Physical security policies (locked storage, Kensington locks)
- Device wipe / remote wipe capability where available
- Disk destruction procedures at end of mission

### Duress PIN

A duress PIN mechanism (allowing an operator under coercion to signal distress) is designed but not yet implemented.

### No network-level controls

Liminal does not implement firewalling, VPN, or network segmentation. These are the responsibility of the IT infrastructure team at the deployment site.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please report it via [GitHub Issues](https://github.com/Sythenv/Liminal/issues) with the label `security`. For sensitive disclosures, contact the maintainers directly before opening a public issue.
