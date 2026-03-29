# RFC: Internal Quality Control (IQC) Module

## Context

Field labs run daily quality controls on their analyzers. Results must not be released to patients until QC is validated. This is a regulatory requirement (ISO 15189 §5.6.2) and current MSF practice.

## Requirements (from Thomas, labtech MSF — 2026-03-29)

### Analyzers requiring QC

| Analyzer | Type | QC Frequency | Levels |
|----------|------|-------------|--------|
| Sysmex XP 300 | Hematology (CBC) | Daily | 3 (Low/Normal/High) |
| Humalyzer 3000 / ERBA XL200 | Biochemistry | Daily | 3 |
| Hemocue HbA1C | HbA1C | Monthly | 3 |
| Statstrip Xpress | Glucose (POC) | Weekly | 3 |
| Hemocue Hb301 | Hemoglobin (POC) | Weekly | 3 |

### Rules

- **Blocking**: no patient results may be released while QC is non-conforming for that analyzer
- **Non-conforming QC**: operator must perform corrective actions, re-run QC, and document the resolution before results can be released
- **Levey-Jennings graph**: track QC values over time, visualize trends, detect shifts/drifts

### Westgard rules (standard in clinical labs)

- **1-2s warning**: single control > 2 SD from mean (warning, not rejection)
- **1-3s rejection**: single control > 3 SD from mean → QC fails
- **2-2s rejection**: 2 consecutive controls > 2 SD on the same side → QC fails
- **R-4s rejection**: range between 2 controls in the same run > 4 SD → QC fails

## Data Model

### Migration: `008_iqc.sql`

```sql
-- QC lot: a batch of control material with known target values
CREATE TABLE qc_lot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analyzer TEXT NOT NULL,           -- e.g. 'Sysmex XP 300'
    test_code TEXT NOT NULL,          -- links to test_definition.code
    lot_number TEXT NOT NULL,
    level INTEGER NOT NULL,           -- 1=Low, 2=Normal, 3=High
    target_value REAL NOT NULL,       -- expected mean
    sd REAL NOT NULL,                 -- standard deviation (from manufacturer)
    unit TEXT,
    expiry_date TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- QC result: daily/weekly/monthly control measurement
CREATE TABLE qc_result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_id INTEGER NOT NULL REFERENCES qc_lot(id),
    value REAL NOT NULL,
    run_date TEXT NOT NULL DEFAULT (date('now')),
    run_time TEXT,
    operator TEXT,                    -- who ran the QC
    status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, ACCEPTED, REJECTED, CORRECTED
    comment TEXT,                     -- corrective action if rejected
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_qc_result_lot ON qc_result(lot_id, run_date);
```

### Westgard evaluation (server-side)

```python
def evaluate_westgard(lot_id, new_value):
    """Evaluate Westgard rules for a new QC result.
    Returns: {'status': 'ACCEPTED'|'WARNING'|'REJECTED', 'rules': [...]}
    """
    # Fetch lot target + SD
    # Fetch last N results for this lot
    # Apply rules: 1-3s, 2-2s, R-4s → REJECTED
    # Apply rules: 1-2s → WARNING
    # Otherwise → ACCEPTED
```

## API Endpoints

```
GET    /api/qc/lots                    — list active QC lots
POST   /api/qc/lots                    — create QC lot (admin)
PUT    /api/qc/lots/:id                — update lot (admin)

POST   /api/qc/results                 — enter QC result (auto-evaluates Westgard)
GET    /api/qc/results?lot_id=&from=&to=  — get results for Levey-Jennings graph
GET    /api/qc/status                  — current QC status per analyzer (conforming/non-conforming)

POST   /api/qc/results/:id/accept      — accept a warning result (supervisor)
POST   /api/qc/results/:id/correct     — mark as corrected after corrective action
```

## Route levels

```python
('POST', '/api/qc/lots'):           3,   # admin creates lots
('PUT',  '/api/qc/lots/*'):         3,
('POST', '/api/qc/results'):        1,   # tech enters QC
('POST', '/api/qc/results/*/accept'): 2, # supervisor accepts
('POST', '/api/qc/results/*/correct'): 1,# tech documents correction
```

## UI

### Settings > QC Lots (admin)
- List of active lots with analyzer, test, level, target ± SD, expiry
- Add/edit lot form

### QC Entry page (new nav item, or sub-section of worklist)
- Select analyzer → shows lots for that analyzer
- Enter values for each level (1/2/3)
- Immediate Westgard evaluation with visual feedback:
  - Green check → ACCEPTED
  - Orange warning → 1-2s (can accept with supervisor override)
  - Red X → REJECTED (must re-run after corrective action)

### Levey-Jennings graph
- Per lot: X axis = date, Y axis = value
- Lines at mean, ±1SD, ±2SD, ±3SD
- Points colored by status (green/orange/red)
- Pure SVG, no chart library (offline constraint)

### Blocking integration with register
- When entering results, check QC status for each requested test
- If QC is non-conforming for that test → show warning banner
- Supervisor can override with PIN + justification (logged in audit)

## Open questions

1. **QC entry frequency enforcement** — should Liminal prevent patient results if no QC has been run today? Or just warn?
2. **Corrective action workflow** — free text comment enough, or structured (re-calibrate, new reagent, re-run)?
3. **QC lot management** — who enters target values? Admin from manufacturer insert sheet? Or auto-calculated from first N runs?
4. **Multi-parameter analyzers** — Sysmex gives WBC, RBC, HGB, PLT, etc. in one run. One QC lot per parameter, or one per analyzer run?
5. **Graph rendering** — inline SVG (like barcode generator) or separate page?

## Implementation estimate

- Migration + API: 1 session
- Westgard evaluation: 1 session
- QC entry UI: 1 session
- Levey-Jennings graph (SVG): 1 session
- Blocking integration: 1 session
- Total: ~5 sessions
