# Playbook de test — Liminal v0.3

Ce document est une checklist à jouer par un humain sur une installation fraîche.
Chaque case cochée = testé et fonctionnel. Chaque case non cochée = bug à corriger.

## Prérequis
- Kit standalone extrait (clé USB ou dossier)
- Double-clic sur `start.sh` (Linux) ou `start.bat` (Windows)
- Navigateur ouvert sur http://127.0.0.1:5000

---

## 1. First-run & Setup

- [ ] L'écran de setup s'affiche au premier lancement (numpad + champ nom)
- [ ] Créer l'admin : entrer un nom + PIN 4-8 chiffres → confirmer le PIN
- [ ] Le wizard onboarding s'affiche (config site, tests, opérateurs)
- [ ] Configurer : nom du site, code site, pays, langue
- [ ] Sélectionner les tests actifs du site
- [ ] Créer 1 superviseur (L2) + 1 technicien (L1)
- [ ] L'écran de bienvenue s'affiche avec le récap
- [ ] Cliquer "Start" → page /register s'affiche
- [ ] Le nom du site apparaît dans le header
- [ ] La version apparaît en bas à droite

## 2. Navigation

- [ ] Les pages Register, Equipment, Reports sont accessibles sans PIN
- [ ] Les pages Patients, Blood Bank, Export, Settings sont verrouillées
- [ ] Cliquer le cadenas → PIN admin → les pages se déverrouillent
- [ ] La session de lecture dure 15 min sans re-demander le PIN
- [ ] Chaque page charge sans erreur console (F12)

## 3. Enregistrement d'un échantillon

- [ ] Page /register : le champ de recherche est visible et focusé
- [ ] Cliquer "New Sample" (ou bouton +)
- [ ] **Step 1** : entrer nom patient, âge, sexe → les boutons M/F fonctionnent
- [ ] Rechercher un patient existant → autocomplete fonctionne
- [ ] **Step 2** : sélectionner le service (OPD, IPD, ER...) + type spécimen (BLOOD, URINE...)
- [ ] **Step 3** : les tests s'affichent → cocher MAL_RDT + HB
- [ ] PIN technicien demandé → valider → succès affiché avec lab_number
- [ ] L'entrée apparaît dans la liste du jour en statut REGISTERED
- [ ] Le lab_number est au format {CODE}-{ANNEE}-{SEQ}

## 4. Saisie des résultats

- [ ] Cliquer sur la card REGISTERED → modal résultats s'ouvre
- [ ] Les tests demandés sont affichés (MAL_RDT, HB)
- [ ] Sélectionner MAL_RDT = POS (bouton)
- [ ] Entrer HB = 12.5 (champ numérique)
- [ ] Cliquer "Save Results" → PIN demandé → sauvegarde OK
- [ ] La card passe en statut REVIEW

### 4b. Valeur critique (panic)

- [ ] Ouvrir une entrée, entrer HB = 3.0
- [ ] Le champ HB pulse rouge + warning "CRITICAL VALUE"
- [ ] Le bouton change en "Confirm Critical Values"
- [ ] Cliquer → modal panic s'affiche avec seuil (< 5.0)
- [ ] Le bouton "Confirm & Save" est grisé
- [ ] Cocher "I have verified" → bouton actif → cliquer → sauvé
- [ ] Le badge HB dans la card montre le flag panic

### 4c. Test structuré (NFS/CBC)

- [ ] Créer une entrée avec test CBC
- [ ] Ouvrir les résultats → champs WBC, PLT, HCT affichés
- [ ] Entrer des valeurs → sauvegarder → les 3 valeurs sont enregistrées
- [ ] Si valeur hors seuil panic → même flow panic que 4b

### 4d. Test URINE (structuré 5-10 paramètres)

- [ ] Créer une entrée avec test URINE
- [ ] Ouvrir → boutons LEU/NIT/PRO/BLD/GLU affichés
- [ ] Sélectionner des valeurs → sauvegarder → OK

## 5. Validation (superviseur)

- [ ] Se connecter en tant que superviseur (PIN L2)
- [ ] Le dashboard s'affiche avec les compteurs (To validate, In progress, etc.)
- [ ] Cliquer "To validate" → les entrées en REVIEW apparaissent
- [ ] Cliquer sur une entrée → modal avec contexte (qui a saisi, TAT, historique)
- [ ] Bouton "Validate Results" visible + bouton "Reject sample" en dessous
- [ ] Cliquer "Validate Results" → PIN demandé UNE seule fois → COMPLETED
- [ ] La card disparaît de "To validate" et apparaît dans "Completed"
- [ ] Le reporting_date est renseigné

### 5b. Four-eyes

- [ ] Le superviseur saisit LUI-MÊME des résultats puis tente de valider
- [ ] Modal "Four-Eyes Rule" s'affiche (pas un alert JS natif)
- [ ] Cliquer "Go back" → rien ne se passe
- [ ] Cliquer "Override & validate" → validation passe + FOUR_EYES_BYPASS dans audit

### 5c. Rejet depuis REVIEW

- [ ] Sur une entrée REVIEW, cliquer "Reject sample"
- [ ] Les raisons de rejet s'affichent (HEMOLYZED, QNS, etc.)
- [ ] Sélectionner une raison → confirmer → statut REJECTED
- [ ] L'entrée apparaît dans "Rejected" avec la raison affichée

### 5d. Unreject

- [ ] Ouvrir une entrée REJECTED → bouton "Undo Rejection"
- [ ] Cliquer → PIN superviseur → statut revient à REGISTERED

## 6. Banque de sang

- [ ] Aller sur /bloodbank (PIN admin L3 pour déverrouiller la nav)
- [ ] **Onglet Donors** : cliquer + → formulaire New Donor
- [ ] Remplir nom, âge, sexe, groupe sanguin → Register → donneur créé
- [ ] La card donneur affiche : badge groupe, nom, meta, code-barres Code 128
- [ ] **Onglet Stock** : cliquer + → formulaire New Collection
- [ ] Rechercher le donneur → sélectionner → groupe auto-rempli
- [ ] Screenings : mettre tout NEG → Register Unit → statut AVAILABLE
- [ ] Créer une 2e unité avec HIV = POS → statut automatiquement DISCARDED
- [ ] **Onglet Transfusions** : cliquer + → Issue Unit
- [ ] Sélectionner une unité AVAILABLE
- [ ] Crossmatch = INCOMPATIBLE → erreur affichée (modal, pas alert natif)
- [ ] Crossmatch = COMPATIBLE → transfusion créée → unité passe en ISSUED
- [ ] Cliquer sur la transfusion → modal Complete → adverse reaction YES/NO → compléter

## 7. Équipements

- [ ] Aller sur /equipment
- [ ] Créer un équipement (PIN admin) : nom, catégorie, modèle, condition
- [ ] La card équipement s'affiche avec la condition color-coded
- [ ] Cliquer sur la card → log maintenance visible
- [ ] Ajouter une maintenance : type PREVENTIVE, description → PIN technicien → créé
- [ ] Le log maintenance apparaît sous la card

## 8. Rapports & Export

- [ ] Aller sur /reports
- [ ] Sélectionner mois/année → "Generate" → PIN superviseur
- [ ] PDF généré → lien de téléchargement → le PDF s'ouvre avec les stats
- [ ] Aller sur /export
- [ ] Sélectionner dates → Export Excel → fichier téléchargé
- [ ] Ouvrir le fichier → les données sont là avec les bons résultats
- [ ] Export CSV → même vérification

## 9. Backup & Settings

- [ ] Aller sur /settings (PIN admin)
- [ ] Cliquer "Backup Now" → backup créé, affiché dans la liste
- [ ] Cliquer sur un backup → téléchargement du fichier .db
- [ ] Restore : uploader un fichier invalide → erreur
- [ ] Restore : uploader le backup téléchargé → message succès

## 10. Sécurité

- [ ] Tentative de saisie sans PIN → numpad apparaît
- [ ] PIN incorrect → erreur + shake
- [ ] Technicien (L1) ne peut PAS valider → erreur de niveau
- [ ] Technicien ne peut PAS accéder aux donneurs → erreur 401
- [ ] Superviseur (L2) ne peut PAS gérer les opérateurs → erreur de niveau
- [ ] Admin (L3) peut tout faire
- [ ] L'audit trail est consultable sur chaque entrée (historique des actions)
- [ ] L'intégrité hash est valide (pas de tamper detected)

## 11. Offline & Standalone

- [ ] Couper internet (mode avion / débrancher)
- [ ] Toutes les fonctions ci-dessus fonctionnent identiquement
- [ ] Aucune requête réseau échouée dans la console (F12 → Network)

## 12. Multi-OS

- [ ] **Linux** : extraire le kit, `./start.sh`, navigateur s'ouvre, tout fonctionne
- [ ] **Windows** : extraire le zip, double-clic `start.bat`, navigateur s'ouvre, tout fonctionne

---

## Résultat

- **Total cases** : ~70
- **Passées** : ___
- **Échouées** : ___
- **Notes** :
