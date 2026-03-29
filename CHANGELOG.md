# Changelog

## [v0.4.0-alpha] — 2026-03-29

### Mobile & UX overhaul, worklist, result validation

### Added
- **Worklist** with role-based task model and result validation workflow
- **Patient linkage** across lab register and blood bank
- **Mobile UX** — bottom nav bar with icons, larger touch targets, active states
- **Mobile review** — card-based layout replacing review table
- **Print results** — A4 report template with CSS `@media print`
- **Fuzzy search** — token-based split with AND matching
- **Wizard autosave** — state persisted in sessionStorage
- **LAN access** — `LIMINAL_HOST=0.0.0.0` to serve on local network
- README with Liminal logo, SECURITY.md, GPL v3 license

### Fixed
- 5 edge-case bugs: workflow guards, expiry check, race condition
- Missing i18n keys for equipment, patients, bloodbank nav
- Mobile nav: icon + short label bottom bar
- Host check simplified for LAN mode (skip filter on `0.0.0.0`)

### Changed
- Audit trail 100% coverage + onboarding redesign
- RFC rewritten as roles & worklist operational spec

---

## [v0.1.0-alpha] — 2026-03-27

First release. Standalone kits Linux + Windows (Python embarqué, 0 dépendance).

### Core
- Lab register: 3-step wizard, lab_number auto, status workflow (REGISTERED→REVIEW→COMPLETED)
- Result entry: numeric, POS/NEG, structured (CBC, URINE, malaria blood smear)
- Validation: supervisor review table, four-eyes enforcement, TAT, patient history context
- Reject/unreject with constrained reasons

### Blood Bank
- Donor register, blood unit inventory, transfusion tracking
- Screening fields (HIV, HBV, HCV, Syphilis)
- Expiry tracking, auto-expire on list

### Equipment
- WHO LQSI categories, maintenance log (preventive/corrective/calibration)

### Reporting & Export
- Monthly PDF sitrep (volumes, positivity, TAT, by ward)
- Excel/CSV export with date range filter

### Security
- PIN-based auth (3 levels: operator/supervisor/admin)
- Audit trail with SHA256 integrity hashing
- AES-256 encryption for donor data
- Duress PIN (fake data screen)
- Security headers (CSP, X-Frame-Options, etc.)

### Infrastructure
- Standalone release workflow (GitHub Actions)
- Python embedded runtime (python-build-standalone)
- start.sh/start.bat auto-detect embedded vs system Python

---

## [v0.3.0-alpha] — 2026-03-27

### Sprint 1 features + v0.2 refactor + bugfix cycle

### Added
- **P3.1** Screening POS auto-discards blood unit (create + update)
- **P3.2** Incompatible crossmatch blocks transfusion issue
- **P0.4** Version display in footer, injected from git tag in CI
- **P0.3** PIN session 15min for reads, PIN required on every write (signature d'action)
- **P1.2** Panic confirmation modal — blocking checkbox before saving critical values
- Code 128 barcode generator (components.js, pure SVG)
- Barcode on donor cards (scannable by USB HID scanner)
- Demo PINs on numpad (chmod mnemonics: 0777/0755/0644)
- **P0.1** Backup/Restore: create, list, download, restore with SQLite validation
- **P0.2** Onboarding first-run wizard: site config, test selection, operator creation
- Settings page with backup management UI
- Config API: GET/PUT site config, GET/PUT active tests

### Fixed
- PIN session persisted in sessionStorage (survives page navigation)
- Equipment: create + maintenance now use authFetch
- Export: Excel/CSV now use authFetch
- Empty patient name validation with modal warning
- bloodbank.js: all API calls use authFetch instead of raw fetch
- register.js: validate, reject, unreject use authFetch + JSON body
- Removed double PIN prompt on validate/reject/unreject (pinProtect + authFetch redundancy)
- Donor card redesign (blood group badge + name + barcode inline)
- Footer version positioning (fixed bottom-right)
- PIN logo spacing reduced

### Changed
- CSS refactor: 52 variables → 15 core + signal palette (ok/alert/critical)
- Unified signal system for badges and buttons
- 3 text sizes, 2 radius values, 1 shadow
- Legacy aliases preserved for backward compat
- createCard() helper in components.js — declarative card building
- Unified auth: single authFetch() pattern, removed pinProtect redundancy
- Inline styles migrated to CSS utility classes (bloodbank, equipment, patients)
- RFC rewritten as operational roadmap with sprint planning
- CLAUDE.md compressed (79→22 lines)
