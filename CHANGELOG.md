# Changelog

## [v0.5.0-alpha] — 2026-03-29

### Multilingual, impression, securite, refonte UX

L'application parle maintenant francais, anglais et arabe. Les etiquettes specimens
s'impriment sur des planches Avery standard. L'interface a ete simplifiee : un seul
menu en bas de l'ecran, des cartes uniformes, et un filtre intelligent qui montre a
chaque operateur ce qu'il a a faire.

### Nouveau
- **Traduction complete** — toute l'interface en anglais, francais et arabe (280 cles)
- **Impression configurable** — etiquettes specimens (Avery 2x7, 3x8) avec code-barres Code 128, rapport de resultats ameliore (code-barres optionnel, pied de page, signatures)
- **Page Impression dans Settings** — l'administrateur choisit le format d'etiquettes, les champs a afficher, le nombre de copies par specimen
- **Mode demo** — `LIMINAL_DEMO=1` pre-charge 3 operateurs (0777/0755/0644), 8 patients et 6 echantillons dans tous les statuts
- **Bouton deconnexion** dans le header (a cote des langues)
- **Nom de l'operateur** affiche dans le header apres connexion

### Securite
- **Hashage PIN renforce** — SHA-256 remplace par scrypt (brute-force offline passe de <1ms a ~8h pour un PIN 4 chiffres). Migration automatique des anciens hash au prochain login.
- **Rate limiting global** — 5 echecs PIN → verrouillage 60s, log en audit trail
- **Verrouillage inactivite** — 5 minutes sans interaction → session effacee, retour au PIN

### UX
- **Menu unifie** — barre de navigation en bas sur tous les ecrans (desktop = mobile), icones + textes
- **Filtre par role** — le technicien voit ses echantillons a traiter, le superviseur voit ceux a valider. Un bouton "Show all" pour tout afficher.
- **Cartes uniformes** — plus de boutons sur les cartes, toutes les actions (valider, rejeter, imprimer) sont dans le detail au clic
- **Reports + Export fusionnes** — une seule page au lieu de deux
- **Patients accessible a tous** les operateurs (niveau 1+)
- **Navigation coherente** — plus de saut de layout entre les pages, auto-unlock si session active

### Corrections
- Race condition au login (verify async avant unlock nav)
- Cache navigateur servait l'ancien JS (desactive en dev)
- Bouton vert (+) cache par le menu du bas
- Chevauchement texte/lien sur la page rapports
- Page Patients n'affichait rien (fetch sans PIN)

---

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
- `start.bat`: set working directory (`cd /d %~dp0`) for standalone kit compatibility
- `start.bat` + `start.sh`: wait for server ready before opening browser (replaces fixed 2s delay)

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
