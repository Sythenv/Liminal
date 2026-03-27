# RFC - Liminal Roadmap

## Priority 1: Reporting Module
**Why:** The core pain point. Raw Excel export exists but coordination/MTL need formatted monthly reports (sitrep). Without this, we digitized the notebook but didn't solve the reporting problem.
- Monthly sitrep generation (volumes by test, by ward, by period)
- Positivity rates (malaria RDT, HIV, etc.)
- Turnaround time metrics (reception to result)
- Exportable as Excel/PDF matching organizational sitrep format
- Dashboard view for supervisor (today's stats, pending results)

## Priority 2: Blood Bank Module
**Why:** Explicitly requested. Site processes ~250 bags/month, ~320 transfusions/month. Currently paper-only.
- Donor register (donor info, screening, blood group, donation history)
- Blood unit inventory (stock, expiry tracking, status: available/reserved/issued/expired)
- Transfusion register (crossmatch, issue, adverse reaction tracking)
- Deterministic UI: donor eligibility checklist as guided flow, not free text

## Priority 3: Deterministic UX Improvements (organizational QA Manual alignment)
**Why:** Operators have minimal training. System must make it hard to do the wrong thing.
- Rejection reasons as constrained dropdown (hemolyzed, clotted, QNS, unlabelled, wrong container, inadequate volume, improper sampling, sample too old, IV access site)
- Panic values: add panic_low/panic_high on test_definition, block result validation with explicit confirmation when out of range
- Collection time field (separate from reception time, per organizational 6.3)
- Result status: preliminary vs final (per organizational report form requirements)
- Guided workflow: registration -> IQC check prompt -> result entry -> review -> release
- Impossible to skip steps (no result without registration, no release without review)

## Priority 4: Equipment & Maintenance Module
**Why:** Explicitly requested. WHO LQSI template provides the standard structure.
- Equipment register with WHO categories (25 predefined: Freezer, Microscope, Centrifuge, etc.)
- Fields from WHO template: category, label, serial, manufacturer, purchase date, location, physical condition (Good/Fair/Poor/Out of service), service provider, maintenance frequency (weekly/monthly/quarterly/yearly)
- Maintenance log per equipment (preventive/corrective/calibration)
- Automated reminders when maintenance is overdue
- Deterministic: all fields are dropdowns or constrained inputs, no free text for category/condition/frequency

## Priority 5: IQC Module
**Why:** organizational QA Manual Ch. 5.3 requires IQC daily before patient samples. Currently paper-only.
- QC targets per test/instrument (material, lot, expiry, mean, SD, acceptable range)
- Daily QC result entry with pass/fail
- Westgard rule violation detection (1-2s, 1-3s, 2-2s, R-4s, 4-1s, 10x)
- Levey-Jennings chart visualization
- Block patient result entry if daily IQC not passed
- QC workbook export (per organizational 6.7)

## Priority 6: Data Exchange (HQ ↔ Field)
**Why:** Data needs to flow both ways — aggregated reports up to coordination, config updates down to field sites. Direct API sync (SharePoint/DHIS2) is unreliable on intermittent connectivity.

**Upward (field → HQ):**
- Supervisor-triggered export (not auto-sync that fails silently)
- Signed JSON/CSV bundle (data + SHA256 hash for integrity verification)
- Includes: monthly aggregates, audit trail summary, stock levels, equipment status
- Exportable to USB/email attachment for manual upload when connectivity allows

**Downward (HQ → field):**
- Config update file (`config-update.json`): test menu changes, panic values, reference ranges, site name/code
- Supervisor imports via Settings page (file upload → validate → apply)
- Software updates: new version folder replaces old one (portable app model)

**Not in scope for MVP:**
- Direct SharePoint/DHIS2 API integration (requires stable VPN + OAuth)
- Real-time sync (conflict resolution is complex for offline-first)
- Push notifications from HQ

## Priority 7: Instrument Connectivity
**Why:** 80/20 approach. Most results are manual entry, but some analyzers support ASTM/serial.
- Humalyzer 4000: RS232/ASTM
- Sysmex: ASTM/HL7
- GeneXpert: CSV import
- Hemocue: manual (no LIS interface on most models)

## Security Tier 2: Audit Trail & Data Integrity
- audit_log table: who, what, when, old value, new value
- SHA256 hash per record for tamper detection
- Weekly backup reminder/automation

## Security Tier 3: Access Control + PIN Integrity

### Threat model
- Operator may be coerced or malicious (hostile actor demands patient HIV status)
- Laptop may be seized (data at rest must protect sensitive fields)
- Donor data is geopolitically sensitive (screening results = stigmatization risk)
- No reliable network — security cannot depend on connectivity

### 3 levels
**Level 1 — Operator (lab technician):**
- Register samples, enter results
- View stock (anonymized), log maintenance
- Navigate days for result entry (delayed results from reference labs)
- Cannot: validate, export, search globally, access patients list, view donor details, modify config

**Level 2 — Supervisor (lab manager/MTL):**
- Everything Level 1 +
- Validate results (four-eyes: validator ≠ person who entered results, asynchronous)
- Generate reports, export data, search patients
- View audit trail, reject/unreject
- Cannot: modify site config, manage test menu, manage operators, view donor names

**Level 3 — Admin (MIO/siège):**
- Everything Level 2 +
- Site config, test menu, operator management
- Donor register (decrypted names visible)
- Full audit trail with integrity verification
- Encryption key derived from this level's PIN

### PIN model — per-action integrity, not session login
- **Default state: app locked** (PIN screen with numpad)
- PIN unlocks a **15-minute session** — reading/navigating allowed
- **Critical actions require PIN re-entry:** register sample, save results, validate, reject, issue blood unit, modify config
- Each action is cryptographically tied to the operator who entered the PIN
- No "logged in as" concept — the PIN at the moment of action IS the proof

### Four-eyes validation (asynchronous)
- Results entered by operator A (PIN A at save)
- Entry moves to REVIEW
- Validation requires PIN B where B ≠ A (server-side enforcement)
- If same PIN → rejected with "Cannot validate your own results"

### PIN storage
- `operator` table: id, name, pin_hash (SHA256 + salt), level, is_active
- PIN never stored in clear — hashed with per-operator salt
- First setup: admin creates their PIN (no default PIN)
- PIN reset: level 3 can reset level 1-2. Nobody resets level 3 — reinstall required (by design)

### Sensitive field encryption
- Donor names and screening results encrypted at application level (AES-256)
- Encryption key derived from level 3 PIN (PBKDF2)
- Level 1-2 see donor numbers only (D-xxxx), never decrypted names
- If laptop seized: DB readable but donor identities are ciphertext

### Admin Dashboard (macro view)
- KPI cards: samples today/week/month, pending results, rejection rate, overdue maintenance
- Blood bank stock summary (group x status grid)
- Equipment alerts (overdue maintenance, out of service)
- Operator activity (who did what today)
- Audit alerts (integrity failures)
- Trend sparklines: daily volume 30 days, positivity rates
- Single page `/dashboard`, accessible Level 3 only

## Architecture: Sync Opportuniste (field ↔ HQ)

### Principle: 100% offline-capable, sync when available
The LIMS is fully autonomous. No server dependency for any operation. HQ visibility is opportunistic, not required.

```
LIMS (terrain)                              HQ (serveur)
┌──────────────┐                       ┌──────────────┐
│ SQLite local │  ── when connected ──→ │ Aggregation  │
│ Key = local  │  ←── when connected ── │ Config push  │
│ Works offline│                       │ Monitoring   │
└──────────────┘                       └──────────────┘
```

### Upward (field → HQ) — when connectivity available
- Encrypted data bundle: anonymized aggregates, audit trail summary, stock levels
- Signed with site key for authenticity verification
- HQ stores but cannot modify field data (append-only)
- No raw patient data unless level 3 explicitly exports with PIN

### Downward (HQ → field) — when connectivity available
- Config updates: test menu, panic values, site settings
- Operator list updates (add/deactivate operators remotely)
- Security alerts (force PIN rotation)
- Supervisor applies manually after verification

### No connectivity for months: zero impact
- All operations continue normally
- Data accumulates locally
- Next connection: bulk sync catches up
- No key dependency, no heartbeat requirement, no remote wipe illusion

## UX Improvements (field feedback)
- **Patient entity separation (ISO 15189 §5.4).** Current schema embeds patient info (name, age, sex) directly in lab_register — duplicated on every visit. Correct architecture:
  - **Step 1: Patient** — search existing patient (autocomplete on name/ID) OR create new. Patient gets a unique patient_number (P-0001). Stores: name, age, dob, sex, contact, village.
  - **Step 2: Lab Order** — linked to patient via FK. Contains: specimen type, requested tests, collection time, ward, requesting clinician.
  - Patient history view: click a patient → see all past lab orders and results in chronological order. Enables trend tracking (HB over time).
  - Schema: new `patient` table, `lab_register.patient_id` FK replaces `patient_name`/`age`/`sex` columns (keep for backward compat, populate from patient record).
  - Migration path: existing entries create auto-generated patient records from distinct patient_name values.
- Add date display/picker on patient registration page (Step 1 of wizard)
- Service (ward) list: validate with field team which services exist on site
- **Urinalysis: complete 10-parameter dipstick.** Current structured input has 5 params (LEU, NIT, PRO, BLD, GLU). Standard dipstick has 10: add URO (Urobilinogen: NEG/Normal/+/++), BIL (Bilirubin: NEG/+/++/+++), KET (Ketones: NEG/TRACE/+/++/+++), SG (Specific Gravity: numeric 1.000-1.030), pH (numeric 5.0-8.5). Validate with field team which params they actually read — some sites use 5-strip not 10-strip.
- **Blood Bank: donor anonymization (§1.5, §1.6).** Stock and transfusion views must NOT display donor name — only donor number (D-xxxx). Donor name is only visible in the Donors tab (which should be access-controlled via Tier 3 PIN). Currently `donor_name` is shown on stock cards — must be removed. API `GET /units` should return `donor_number` instead of `donor_name`.
- **Blood Bank: donor eligibility questionnaire.** Ch.2 §3: guided checklist before collection (contra-indications, medical history, donation frequency — max 3/year women, 4/year men, min 8 weeks interval). Currently no eligibility check.
- **Blood Bank: informed consent tracking.** Ch.2 §1.3: donor must consent to screening and potential exclusion. Add a consent checkbox/confirmation step before collection. Track consent_date on blood_donor.
- **Blood Bank: screening-positive blocks stock.** Currently a POS screening (HIV, HBV, HCV, Syphilis) does NOT prevent the unit from being AVAILABLE. A POS result should auto-set status to DISCARDED and alert the operator.
- **Blood Bank: crossmatch blocks incompatible issue.** Currently INCOMPATIBLE crossmatch does not prevent issuing. If crossmatch = INCOMPATIBLE, the Issue button should be disabled.
- **Blood Bank: unit status management.** Clicking a stock card should open a modal with actions based on current status: AVAILABLE → [Reserve/Discard/Issue], RESERVED → [Release/Issue], EXPIRED → [Discard]. Currently cards are not interactive.
- **Blood Bank Stock: "7d left" expiry badge misaligned.** The expiry warning badge is appended inside the card-details div inline with text, causing layout break. Move it to its own line or style as a block-level badge below the details.
- **Blood Bank Stock: add summary table.** Before the card list, show a recap grid: blood group (rows) x status (columns) with counts. E.g. O+ = 12 available, 3 reserved, 2 expiring. Gives instant visual overview of stock levels. Critical for knowing what's available before a transfusion request comes in.
- **Button state inconsistency (multi-level fix needed):**
  - **Level 1 - Convention:** Standardize on ONE class for selected state. Currently register.js uses `.selected`, bloodbank.js uses `.active`, equipment.js uses `.active`. Pick one (`selected`) and align all modules.
  - **Level 2 - Shared component:** Extract a `createButtonGroup(options, onSelect)` utility function in a shared `components.js`. All button groups (sex, ward, blood group, specimen, screening, crossmatch, maintenance type, equipment category) use the same pattern — they should share the same code instead of reimplementing selection logic per module.
  - **Level 3 - CSS token:** Single `.btn-group-item.selected` class for all toggle buttons. Remove `.active` variants. One style, one behavior, one source of truth. The BG buttons (A+, A-, B+, etc.) don't register selection when tapped. Debug: check if `selectBG()` is correctly wired via addEventListener, and if the `.bg-btn.active` class is being applied vs `.bg-btn.selected`.
- **Reports page: generated report overlaps UI.** After generating a PDF report on `/reports`, the result summary and download link overlap with the form. Fix layout/spacing of the export-result div.
- **Validate Results button non-functional.** The "Validate Results" button appears on REVIEW entries but does nothing in the UI. Debug: check if the `executeValidate()` function is correctly wired, if the API call succeeds, and if the modal closes + reloads after validation.
- **Wizard flow reorder (specimen-first):** Current flow auto-detects specimen type from tests (confusing). Correct lab workflow: operator receives a physical specimen → selects specimen type (Step 2: big buttons BLOOD/URINE/STOOL/CSF with tube color coding) → tests are filtered by specimen (Step 3: only compatible tests shown). Multiple specimens = multiple registrations (1 lab number per specimen, matches paper register). Removes silent auto-detection logic.

## Barcode / QR Code Integration
- **Standard retenu : Code 128 HID.** Les scanners USB terrain sont des HID — ils tapent le contenu du code-barres comme un clavier + Enter. Code 128 encode l'alphanumérique (lab_number, donation number). Compatible avec tous les scanners USB terrain ($20).
- **Accession number = lab_number** — unique ID per act already exists (e.g. LAB-2026-0001). No new numbering scheme needed.
- **QR Code per sample** — generate QR containing lab_number (+ optional patient_number, date). Displayable in success overlay after registration, printable on A4 label sheet. Scannable by phone camera → opens sample directly in LIMS. Library: `qrcode` (pure Python, SVG output, no system deps).
- **Printable label sheet** — batch-print labels for day's samples. A4 paper with cut lines, no label printer required. QR + lab_number + patient name + date in each cell.
- **Blood bank labeling (per guidelines Ch.2 §8.3, NOT ISBT 128).** ISBT 128 requires ICCBBA licensing and is designed for national blood services — overkill for field operations that label bags by hand. Instead, generate a printable label per unit with guideline-mandated fields: donation number (Code 128 barcode), collection date, expiry date. Blood group added after 2nd determination. Post-qualification: screening results, component type, volume. No donor identifying info on the label (§8.2).
- **Scanner integration** — USB barcode scanners act as keyboard input (HID). No driver/integration needed — scanner types the scanned value into the active search field. Landing page = un champ unique auto-focus, le scanner tape le lab_number + Enter → le flow se déclenche.
- **Hardware dependency** — QR works without scanner (phone camera). Code 128 needs a dedicated scanner ($20 USB). Label printing works on any printer. No thermal printer required.

### Questions pour Thomas (matériel terrain)
- Quels modèles de scanners USB sont disponibles/prévus sur les sites ? (marque, 1D seul ou 1D+2D ?)
- Quelles imprimantes sont sur site ? (jet d'encre, laser, thermique ?) Format papier disponible (A4, étiquettes pré-découpées type Avery ?)
- Les tubes sont étiquetés comment aujourd'hui ? (écriture manuelle, étiquette pré-imprimée, autre ?)
- Volume quotidien d'étiquettes à imprimer ? (pour savoir si batch A4 suffit ou si thermique est nécessaire)
- Les poches de sang sont étiquetées comment actuellement ? (étiquette manuelle, pré-imprimée fournisseur ?)

## Equipment UX
- **Equipment: cards not interactive.** Clicking an equipment card shows maintenance log below but doesn't allow editing the equipment itself. Need a modal on card click with: edit fields (name, model, location, etc.), change physical condition (Good/Fair/Poor/Out of service buttons), deactivate/reactivate toggle. All changes logged to audit trail.
- **Equipment: ownership/acquisition type.** Add constrained field: OWNED / LEASED / DONATED / BORROWED. Impacts who is responsible for maintenance and replacement. Add to equipment registration form as button group.
- **Equipment: admin-only access.** Equipment management (add/edit/deactivate) should be restricted to Level 3 operators (admin). Regular operators can view equipment list and log maintenance but not modify the register. Depends on Tier 3 PIN/access control implementation.
- **Equipment: autocomplete on model/manufacturer from existing entries.** Instead of a static dataset of all lab equipment brands (overkill for 10-20 items per site), offer autocomplete suggestions based on equipment already registered at this site. First entry is free text, subsequent entries suggest existing values. Same pattern as patient name autocomplete. Prevents typo variants ("Olimpus" vs "Olympus") without maintaining an external reference dataset.

## Architecture: Code Maintainability

### JS Split (register.js → 3 files)
**Why:** register.js is 1300+ lines doing landing, wizard, and results. Hard to maintain, hard to debug.
- `landing.js` — search, lookup, results dropdown, landing mode logic
- `wizard.js` — 3-step registration wizard, patient autocomplete, test selection
- `results.js` — result modal, save, validate, reject, audit trail
- Zero logic change — cut and move, functions stay identical
- Load order in register.html: landing.js → wizard.js → results.js

### CSS Split (optional)
**Why:** style.css is 1500+ lines. Documented sections help but separate files help more.
- `base.css` — variables, reset, header, nav, typography
- `landing.css` — landing mode, pitch, search results
- `register.css` — cards, wizard, results, badges
- Or keep single file with clear section headers (lower priority)

### Patient-Centric Architecture
**Why:** The app is evolving from tube-centric (LIMS) to patient-centric (CRM-like). Patient is now the master entity with lab orders, blood bank, history linked via FK. The search-by-name-or-DOB flow confirms this shift.
- Dedicated `/patient/{id}` page — not a modal, a full page
- Shows: demographics, all lab orders chronologically, result trends (HB over time), blood group, transfusion history
- Replaces the current "open most recent entry" behavior from landing search
- Security implication: patient page = full history access, needs careful level enforcement
- This is the feature that transforms LIMS into a patient-centered tool

## Validation Context (question pour Thomas)
**Why:** Le superviseur valide des résultats sans contexte. Il voit le résultat mais pas qui l'a saisi, quand, ni l'historique du patient. Il ne peut pas juger si le résultat est plausible.
- **Qui + quand** : afficher l'opérateur qui a saisi et le timestamp dans le modal de validation
- **Turnaround time** : temps entre collecte et résultat (un délai long = qualité dégradée)
- **Historique patient** : les 3 derniers résultats du même patient (trend tracking, détection d'incohérence type HIV NEG après POS)
- **Panic values** : mettre en évidence visuelle les valeurs critiques dans le modal
- **IQC du jour** : est-ce que le contrôle qualité du jour a été validé pour cet instrument/test ? (dépend du module IQC, RFC P5)
- **Question pour Thomas** : de ces éléments, lesquels sont indispensables pour valider ? Lesquels sont "nice to have" ? Y a-t-il d'autres critères de décision qu'on oublie ?

## Security: Duress PIN
- Each operator has a secondary "duress PIN" — entered under coercion
- App appears to function normally but: donor data stays encrypted, patient screens show empty/dummy data, silent DURESS flag in audit_log
- No visual indication that duress mode is active — attacker sees a working app
- Standard in physical security (safes, alarm systems) and encrypted volumes (VeraCrypt hidden OS)
- Implementation: add `duress_pin_hash` + `duress_pin_salt` columns to operator table, check in auth middleware, set `g.duress = True`, filter sensitive data in bloodbank/patient endpoints

## Planned Evolutions
- Port to Go binary for zero-dependency deployment
- Automated tests (pytest)
- README with setup/backup instructions
