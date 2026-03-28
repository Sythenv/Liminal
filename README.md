<p align="center">
  <img src="app/static/img/logo.svg" alt="Liminal" width="400">
</p>

<p align="center">
  <strong>Offline-first LIMS for MSF field laboratories</strong>
</p>

<p align="center">
  <a href="https://github.com/Sythenv/Liminal/releases">Releases</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

## What is Liminal?

Liminal is a lightweight Laboratory Information Management System designed for MSF (Médecins Sans Frontières) field labs. It runs fully offline on a single machine — no internet, no server, no cloud dependency.

- **Offline-first** — SQLite database, zero network requirement
- **Standalone kits** — bundled with embedded Python for Linux & Windows
- **PIN-based auth** — no passwords, no sessions, three access levels
- **Audit trail** — every action logged with SHA-256 integrity hashing
- **Field-ready** — designed for low-resource, high-pressure environments

## Features

| Module | Description |
|--------|-------------|
| **Lab Register** | Sample registration, status workflow, barcode (Code 128) |
| **Results** | Numeric, POS/NEG, structured (CBC, urinalysis, malaria smear) |
| **Validation** | Supervisor review, four-eyes principle, TAT tracking |
| **Blood Bank** | Donors, units, screening, transfusions, expiry tracking |
| **Equipment** | WHO LQSI categories, maintenance logs |
| **Reporting** | Monthly PDF sitrep, Excel/CSV export |
| **Security** | AES-256 encryption, duress PIN, full audit trail |

## Quick Start

### Standalone kit (recommended)

Download the latest kit from [Releases](https://github.com/Sythenv/Liminal/releases), unzip, and run:

```bash
# Linux
./start.sh

# Windows
start.bat
```

No installation required — Python is embedded in the kit.

### From source

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./start.sh
```

Open `http://localhost:5000` in your browser.

## Tech Stack

- **Backend:** Flask + SQLite
- **Frontend:** Vanilla JS (no framework)
- **Auth:** PIN per request (`X-Operator-Pin` header)
- **Packaging:** Standalone kits with embedded Python

## Development

```bash
# Run tests
pytest tests/ -v

# Reset database (recreated on startup)
rm data/lab.db
```

## License

MIT
