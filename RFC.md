# RFC - LIMPS Roadmap

## Priority 1: Reporting Module
**Why:** The core pain point. Raw Excel export exists but coordination/MTL need formatted monthly reports (sitrep). Without this, we digitized the notebook but didn't solve the reporting problem.
- Monthly sitrep generation (volumes by test, by ward, by period)
- Positivity rates (malaria RDT, HIV, etc.)
- Turnaround time metrics (reception to result)
- Exportable as Excel/PDF matching MSF sitrep format
- Dashboard view for supervisor (today's stats, pending results)

## Priority 2: Blood Bank Module
**Why:** Explicitly requested. Aweil processes 250 bags/month, 320 transfusions/month. Currently paper-only.
- Donor register (donor info, screening, blood group, donation history)
- Blood unit inventory (stock, expiry tracking, status: available/reserved/issued/expired)
- Transfusion register (crossmatch, issue, adverse reaction tracking)
- Deterministic UI: donor eligibility checklist as guided flow, not free text

## Priority 3: Deterministic UX Improvements (MSF QA Manual alignment)
**Why:** Operators have minimal training. System must make it hard to do the wrong thing.
- Rejection reasons as constrained dropdown (hemolyzed, clotted, QNS, unlabelled, wrong container, inadequate volume, improper sampling, sample too old, IV access site)
- Panic values: add panic_low/panic_high on test_definition, block result validation with explicit confirmation when out of range
- Collection time field (separate from reception time, per MSF 6.3)
- Result status: preliminary vs final (per MSF report form requirements)
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
**Why:** MSF QA Manual Ch. 5.3 requires IQC daily before patient samples. Currently paper-only.
- QC targets per test/instrument (material, lot, expiry, mean, SD, acceptable range)
- Daily QC result entry with pass/fail
- Westgard rule violation detection (1-2s, 1-3s, 2-2s, R-4s, 4-1s, 10x)
- Levey-Jennings chart visualization
- Block patient result entry if daily IQC not passed
- QC workbook export (per MSF 6.7)

## Priority 6: SharePoint Sync
**Why:** Data needs to reach MSF servers for centralized reporting.
- Auto-export when connectivity detected
- Push to SharePoint via Microsoft Graph API (OAuth)
- Or simpler: generate export file + script to upload via CLI
- Conflict resolution for multi-site aggregation

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

## Security Tier 3: Access Control
- PIN per technician (identification, not authentication)
- Each action linked to an operator
- Role-based visibility (tech vs supervisor vs admin)

## Planned Evolutions
- Port to Go binary for zero-dependency deployment
- Automated tests (pytest)
- README with setup/backup instructions
