# RFC — Liminal Operational Roadmap

## État des lieux

### Ce qui fonctionne (testé, déployable)
- **Registre labo** : wizard 3 étapes, lab_number auto, statuts REGISTERED→REVIEW→COMPLETED
- **Saisie résultats** : tests simples (POS/NEG), numériques, structurés (NFS, ECBU, goutte épaisse)
- **Validation** : table superviseur, contexte (TAT, historique patient, panic), four-eyes enforced
- **Banque de sang** : schéma complet (donneurs, poches, transfusions), UI fonctionnelle
- **Équipements** : registre WHO LQSI, log maintenance (préventif/correctif/étalonnage)
- **Rapports** : PDF mensuel (volumes, positivité, TAT, par service)
- **Export** : Excel/CSV avec filtre date
- **Sécurité** : PIN 3 niveaux, audit trail SHA256, chiffrement AES-256 donneurs, duress PIN
- **Auth** : middleware ROUTE_LEVELS, setup first-run, gestion opérateurs
- **Release** : kits standalone Linux+Windows (Python embarqué, 0 dépendance, clé USB ready)

### Ce qui manque pour le terrain

| Fonction | Impact | Statut |
|----------|--------|--------|
| Backup/restore UI | Perte de données si crash | Absent |
| Onboarding first-run | Confusion jour 1 | Absent |
| IQC (contrôle qualité) | Résultats non vérifiables | Schéma DB uniquement |
| i18n FR/AR complète | Barrière langue | EN seul |
| Impression étiquettes/résultats | Transition papier impossible | Absent |
| Sync multi-site (HQ ↔ terrain) | HQ aveugle | Absent |
| PIN sur lectures inutiles | PIN demandé pour naviguer/consulter | À auditer |
| Config UI (tests, seuils, services) | Nécessite accès DB direct | Absent |

---

## P0 — Prérequis déploiement (bloquants)

### P0.1 Backup & Restore
**Why:** Si le laptop tombe, toutes les données sont perdues. Inacceptable en contexte médical.
- Bouton "Backup Now" dans l'UI admin → copie `lab.db` horodatée dans `data/backups/`
- Option export vers clé USB (copie dans un chemin sélectionné)
- Restore : upload d'un fichier `.db`, vérification intégrité, remplacement
- Backup automatique quotidien (rotation 7 jours)
- Chiffrement optionnel du backup (AES, clé dérivée du PIN L3)

### P0.2 Onboarding first-run
**Why:** Le déployeur (MIO) n'est pas développeur. Le setup doit être guidé.
- Après création du PIN admin → wizard config :
  1. Nom du site, code site, pays
  2. Langue par défaut (EN/FR/AR)
  3. Tests actifs sur ce site (checklist depuis seed_tests.json)
  4. Création d'au moins 1 opérateur L1 et 1 superviseur L2
- Message d'accueil expliquant les 3 niveaux et le fonctionnement du PIN
- Mode démo optionnel (sample fictif pour tester le flow)

### P0.3 PIN = signature d'écriture, pas login
**Why:** Le PIN signe chaque action dans l'audit trail (ISO 15189 §5.9.3). C'est la preuve de qui a fait quoi. Pas un mécanisme de session.
- **PIN demandé** : toute écriture sur le registre (register, save results, validate, reject, issue blood, log maintenance, modifier config)
- **Pas de PIN** : navigation, consultation, recherche patient, vue stock, lecture audit trail
- Les routes GET restent protégées par niveau (L1/L2/L3 via ROUTE_LEVELS) mais sans re-saisie PIN
- Vérifier que l'implémentation actuelle ne demande pas le PIN pour les actions de lecture pure

### P0.4 Version et numéro de build
**Why:** Le terrain doit pouvoir dire "j'ai la version X" quand il signale un bug.
- Afficher `vX.Y.Z` dans le footer
- Injecter depuis le tag git au build (CI)
- Endpoint `/api/version` pour diagnostic à distance

---

## P1 — Qualité résultats

### P1.1 Module IQC (contrôle qualité interne)
**Why:** Manuel QA organisationnel Ch. 5.3 — IQC quotidien obligatoire avant résultats patients.
- Saisie QC quotidienne par test/instrument (matériel contrôle, lot, valeur mesurée)
- Pass/fail automatique (valeur dans ±2SD de la cible)
- Détection violations Westgard (1-2s, 1-3s, 2-2s, R-4s, 4-1s, 10x)
- **Blocage** : résultats patients refusés si IQC du jour non passé pour ce test
- Graphique Levey-Jennings (tendance 30 jours)
- Export cahier QC (format organisationnel 6.7)

### P1.2 Confirmation panic values
**Why:** Valeurs critiques (HB < 5, K+ > 6.5) doivent être explicitement confirmées, pas juste badgées.
- Modal de confirmation obligatoire avant sauvegarde d'un résultat panic
- Champ "panic acknowledged by" dans audit_log
- Notification visuelle persistante dans la table review pour le superviseur
- Affichage des intervalles de référence pendant la validation (pas seulement panic)

### P1.3 Workflow specimen-first
**Why:** L'opérateur reçoit un tube physique → doit sélectionner le type AVANT les tests.
- Step 2 du wizard : gros boutons SANG/URINE/SELLES/LCR (avec code couleur tube)
- Step 3 : tests filtrés par type de spécimen compatible
- 1 lab_number = 1 spécimen (plusieurs spécimens = plusieurs enregistrements)

---

## P2 — Transition papier → digital

### P2.1 Impression étiquettes
**Why:** Sans étiquettes imprimées, les tubes restent écrits à la main. Pas de transition réelle.
- Génération feuille A4 avec étiquettes découpables (pas d'imprimante thermique requise)
- Par étiquette : QR code + lab_number + nom patient + date
- Batch print : étiquettes du jour
- Impression depuis le navigateur (CSS @media print)

### P2.2 Impression résultats
**Why:** Le service demandeur a besoin d'un document papier avec les résultats validés.
- Feuille de résultats imprimable par entrée validée (COMPLETED)
- Format : en-tête site, patient, tests + résultats + intervalles ref + panic flags
- Bouton "Imprimer" sur chaque entrée validée
- CSS @media print (pas de dépendance serveur)

### P2.3 Étiquettes banque de sang
**Why:** Guidelines Ch.2 §8.3 — chaque poche doit être étiquetée avec les champs réglementaires.
- Étiquette par unité : numéro don (code-barres Code 128), date collecte, date péremption
- Groupe sanguin ajouté après 2e détermination
- Post-qualification : résultats screening, type composant, volume
- Aucune info identifiant le donneur sur l'étiquette (§8.2)

---

## P3 — Banque de sang (complétion)

### P3.1 Screening-positive bloque le stock
**Why:** Un résultat POS (VIH, VHB, VHC, Syphilis) doit auto-discard la poche. Actuellement : aucune automatisation.
- POS sur n'importe quel screening → statut auto DISCARDED + alerte opérateur
- Log dans audit_trail

### P3.2 Crossmatch bloque issue incompatible
**Why:** Si crossmatch = INCOMPATIBLE, le bouton "Issue" doit être désactivé. Actuellement : pas de validation.

### P3.3 Questionnaire éligibilité donneur
**Why:** Guidelines Ch.2 §3 — checklist guidée avant collecte.
- Contre-indications, historique médical, fréquence de don (max 3/an F, 4/an H, min 8 semaines)
- Consentement éclairé (checkbox + date)
- Blocage si inéligible

### P3.4 Grille stock résumé
**Why:** Vue instantanée : groupe sanguin (lignes) x statut (colonnes) avec comptages.
- Avant la liste de cartes
- Ex: O+ = 12 dispo, 3 réservés, 2 expirent dans 7j
- Critique pour savoir ce qui est disponible avant une demande de transfusion

### P3.5 Actions sur cartes stock
**Why:** Les cartes ne sont pas interactives. Pas de workflow de changement de statut.
- Clic → modal avec actions selon statut : AVAILABLE → [Reserve/Discard/Issue], RESERVED → [Release/Issue]
- Anonymisation : stock view ne montre que donor_number, jamais le nom

---

## P4 — Équipements (complétion)

### P4.1 Rappels maintenance
**Why:** RFC existant demande "automated reminders when maintenance is overdue". Absent.
- Badge alerte si `next_scheduled < today`
- Liste des équipements en retard sur le dashboard superviseur
- Notification visuelle au login

### P4.2 Cartes interactives
**Why:** Pas d'édition possible après création. Condition physique non modifiable.
- Clic carte → modal édition (nom, modèle, localisation, condition physique)
- Boutons condition : Good/Fair/Poor/Out of service
- Toggle actif/inactif
- Tout logué dans audit_trail

### P4.3 Propriété / acquisition
**Why:** Impacts responsabilité maintenance et remplacement.
- Champ contraint : OWNED / LEASED / DONATED / BORROWED

---

## P5 — Configuration UI

### P5.1 Page Settings (admin L3)
**Why:** Actuellement toute config nécessite accès DB ou API direct.
- Nom site, code site, pays, langue
- Liste des tests actifs (toggle on/off)
- Seuils panic par test (éditable)
- Liste des services/wards (dropdown contraint, plus de texte libre)
- Liste des cliniciens demandeurs (autocomplete depuis existants)

### P5.2 Import config HQ
**Why:** HQ doit pouvoir pousser des mises à jour de config aux sites terrain.
- Upload `config-update.json` sur la page Settings
- Validation + preview des changements avant application
- Log dans audit_trail

---

## P6 — i18n complet

### P6.1 Traductions FR/AR
**Why:** Opérateurs terrain francophones/arabophones. EN seul = barrière.
- Compléter toutes les strings dans i18n.js (FR obligatoire, AR souhaité)
- Labels formulaires, messages d'erreur, tooltips, boutons
- Noms de tests bilingues (déjà `name_en`/`name_fr` dans test_definition)

### P6.2 Langue par défaut appliquée
**Why:** Le bouton langue existe mais le changement ne persiste pas entre pages.
- Stocker la langue choisie en localStorage
- Appliquer au chargement de chaque page

---

## P7 — Échange données HQ ↔ terrain

### P7.1 Export signé (terrain → HQ)
**Why:** HQ a besoin de visibilité. Pas de sync temps réel (pas de réseau fiable).
- Bouton superviseur : génère un bundle JSON/CSV signé (SHA256)
- Contenu : agrégats mensuels, résumé audit trail, stock, état équipements
- Exportable vers USB / email
- Anonymisé par défaut (pas de noms patients sauf export L3 explicite)

### P7.2 Import config (HQ → terrain)
- Même que P5.2

---

## P8 — Connectivité instruments

### P8.1 Import CSV GeneXpert
**Why:** 80/20 — le GeneXpert exporte en CSV. Import le plus simple.
- Upload CSV → mapping automatique vers test_definition
- Preview + validation avant import
- Résultats créés comme si saisis manuellement (même workflow validation)

### P8.2 Interface ASTM (Humalyzer, Sysmex)
**Why:** RS232/ASTM pour les analyseurs connectés. Plus complexe.
- Serveur série local écoutant le port COM
- Parsing ASTM → résultats dans lab_result
- Scope limité aux 2-3 analyseurs terrain identifiés

---

## Maintenance code (non-bloquant)

### M1 Split register.js
- `landing.js` — recherche, lookup
- `wizard.js` — wizard 3 étapes
- `results.js` — modal résultats, validation, rejet
- Zero changement logique, découpe uniquement

### M2 Cohérence boutons
- Standardiser `.selected` (pas `.active`) sur tous les modules
- Extraire `createButtonGroup()` dans components.js

### M3 Architecture patient-centric
- Page dédiée `/patient/{id}` (pas modal)
- Vue chronologique : tous les lab orders, tendances résultats, groupe sanguin, historique transfusions
- Remplace le comportement "ouvrir l'entrée la plus récente"

---

## Matrice de priorisation

| ID | Fonction | Impact terrain | Effort | Dépendances |
|----|----------|---------------|--------|-------------|
| **P0.1** | Backup/Restore | CRITIQUE | 4h | — |
| **P0.2** | Onboarding | CRITIQUE | 6h | — |
| **P0.3** | PIN = signature écriture | MOYEN | 2h | Audit auth.py + pin.js |
| **P0.4** | Version/build | FAIBLE | 30min | CI |
| **P1.1** | IQC | HAUT | 8h | Schéma DB existant |
| **P1.2** | Panic confirmation | HAUT | 2h | — |
| **P1.3** | Specimen-first | MOYEN | 3h | — |
| **P2.1** | Étiquettes | HAUT | 3h | — |
| **P2.2** | Impression résultats | HAUT | 2h | — |
| **P2.3** | Étiquettes sang | MOYEN | 2h | — |
| **P3.1** | Screening→discard | HAUT | 1h | — |
| **P3.2** | Crossmatch block | HAUT | 30min | — |
| **P3.3** | Éligibilité donneur | MOYEN | 4h | — |
| **P3.4** | Grille stock | MOYEN | 2h | — |
| **P3.5** | Actions cartes stock | MOYEN | 3h | — |
| **P4.1** | Rappels maintenance | MOYEN | 2h | — |
| **P4.2** | Cartes interactives | FAIBLE | 3h | — |
| **P4.3** | Propriété équip. | FAIBLE | 30min | Migration |
| **P5.1** | Settings UI | MOYEN | 6h | — |
| **P5.2** | Import config HQ | FAIBLE | 3h | P5.1 |
| **P6.1** | Traductions FR/AR | HAUT | 6h | — |
| **P6.2** | Langue persistante | FAIBLE | 30min | — |
| **P7.1** | Export signé | MOYEN | 4h | — |
| **P8.1** | Import GeneXpert | FAIBLE | 3h | — |

## Ordre de marche suggéré

**PRE-RELEASE** : Supprimer les PINs dev hardcodés (0777/0755/0644) — forcer le first-run setup sur chaque déploiement terrain.

**Sprint 1 — MVP terrain** : P0.1, P0.2, P0.3, P0.4, P1.2, P3.1, P3.2
→ Backup, onboarding, session PIN, version, panic confirm, screening block, crossmatch block

**Sprint 2 — Qualité** : P1.1, P1.3, P6.1, P6.2
→ IQC complet, specimen-first, i18n français

**Sprint 3 — Papier→digital** : P2.1, P2.2, P2.3, P3.4, P3.5
→ Impression étiquettes/résultats/sang, stock grid, actions cartes

**Sprint 4 — Config & terrain** : P4.1, P4.2, P5.1, P3.3
→ Rappels maintenance, cartes interactives, settings UI, éligibilité donneur

**Sprint 5 — HQ** : P5.2, P7.1, P8.1
→ Import config, export signé, import GeneXpert
