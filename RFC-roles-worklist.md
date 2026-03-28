# RFC — Rôles terrain & Worklist labtech

**Auteur :** Thomas + Sébastien + Claude
**Date :** 2026-03-28
**Statut :** Draft — validé par Thomas sur les principes, détails à confirmer
**IDs :** R1 (rôles), R2 (worklist), R3 (mobile)

---

## Contexte

Le modèle actuel (3 niveaux numériques L1/L2/L3) est hérité du POC. Il fonctionne pour les contextes simples mais ne reflète pas la réalité opérationnelle d'un labo MSF structuré :

- Le **labtech** est le pivot du labo. Il reçoit les échantillons, fait les analyses, entre les résultats. Il a besoin de voir sa file de travail.
- Le **superviseur** valide les résultats, modifie les dossiers, supervise la qualité.
- L'**administrateur** gère la configuration, les utilisateurs, les analyses disponibles.

Le flow actuel (landing → wizard → résultat → validation) est linéaire. Il manque la notion de **"qu'est-ce qui m'attend"** pour le labtech.

> **Retour Thomas :** "Le niveau simplissime max, c'est bien pour les POC quand les analyses sont réalisées par des aides soignants. En pratique dans les labos, les labtechs doivent avoir accès au 'en cours' pour voir où ils en sont dans leur boulot."

---

## R1 — Redéfinition des rôles

### 4 niveaux (dont 1 optionnel)

| Niveau | Rôle | Profil terrain | Statut |
|--------|------|---------------|--------|
| L0 | Aide-soignant / en formation | Enregistre les prélèvements uniquement | **Optionnel** — à valider avec les équipes terrain (Thomas) |
| L1 | Labtech | Technicien qualifié, pivot du labo | **Confirmé** |
| L2 | Superviseur | Responsable labo, valide les résultats | **Confirmé** |
| L3 | Administrateur | Config, utilisateurs, analyses | **Confirmé** |

> **Retour Thomas :** "Il faudra un niveau supervisor séparé du niveau admin."
>
> Sur le niveau aide-soignant : "C'est la partie innovante. Il faut que je vois avec les équipes pour la pertinence de l'utilisation du LIMS directement dans les services."
>
> **Sébastien :** "Ça peut être également le niveau 'en formation' — le gars arrive mais il a juste le flux métier pour ses premières semaines."

### Matrice d'accès (confirmée par Thomas)

| Action | L0 (optionnel) | L1 Labtech | L2 Superviseur | L3 Admin |
|--------|:-:|:-:|:-:|:-:|
| Enregistrer patients | x | x | x | x |
| Enregistrer échantillons (wizard) | x | x | x | x |
| Saisir résultats | — | x | x | x |
| Rejeter un échantillon | — | x | x | x |
| Accès worklist "en cours" | — | x | x | x |
| Voir résultats terminés | — | x | x | x |
| Imprimer résultats validés | — | x | x | x |
| Modifier résultats | — | — | x | x |
| Valider résultats | — | — | x | x |
| Supprimer dossiers | — | — | x | x |
| Unreject | — | — | x | x |
| Créer/modifier analyses disponibles | — | — | — | x |
| Gestion opérateurs | — | — | — | x |
| Configuration site | — | — | — | x |
| Backup/restore | — | — | — | x |
| Rapports & export | — | — | x | x |
| Équipements (créer/modifier) | — | — | — | x |
| Log maintenance | x | x | x | x |

> **Thomas sur le reject :** "Les deux [labtech et superviseur]. Comme c'est le labtech qui fait l'enregistrement des échantillons, il est formé pour reconnaître leur conformité."

### Impact ROUTE_LEVELS

Le L0 (si implémenté) partage le niveau 1 en base mais avec un flag `restricted` sur l'opérateur. Pour la v1, on implémente L1/L2/L3 et on réserve L0 pour une itération future.

```python
ROUTE_LEVELS = {
    # Register — L1 (labtech)
    ('POST', '/api/register/entries'):              1,
    ('POST', '/api/register/entries/*/results'):    1,
    ('POST', '/api/register/entries/*/reject'):     1,

    # Register — L2 (superviseur)
    ('POST', '/api/register/entries/*/validate'):   2,  # was 2, stays 2
    ('POST', '/api/register/entries/*/unreject'):    2,  # was 2, stays 2
    ('PUT',  '/api/register/entries/*'):            2,  # was 3
    ('DELETE', '/api/register/entries/*'):           2,  # was 3

    # Audit — L2
    ('GET',  '/api/register/entries/*/audit'):       2,

    # Patients
    ('POST', '/api/patients'):                      1,
    ('GET',  '/api/patients'):                      1,  # labtech needs patient access
    ('PUT',  '/api/patients/*'):                    2,

    # Reports & Export — L2
    ('POST', '/api/reports/monthly'):               2,
    ('POST', '/api/export/excel'):                  2,
    ('POST', '/api/export/csv'):                    2,

    # Equipment — L3 for create/edit, L1 for maintenance
    ('POST', '/api/equipment'):                     3,
    ('PUT',  '/api/equipment/*'):                   3,
    ('POST', '/api/equipment/*/maintenance'):       1,

    # Auth — L3 (admin)
    ('GET',  '/api/auth/operators'):                3,
    ('POST', '/api/auth/operators'):                3,
    ('PUT',  '/api/auth/operators/*'):              3,
    ('DELETE', '/api/auth/operators/*'):             3,

    # Backup — L3 (admin)
    ('POST', '/api/backup'):                        3,
    ('GET',  '/api/backup'):                        3,
    ('POST', '/api/backup/restore'):                3,

    # Config — L3 (admin)
    ('PUT',  '/api/config'):                        3,
    ('PUT',  '/api/config/tests'):                  3,

    # Blood Bank — to be refined
    ('GET',  '/api/bloodbank/donors'):              3,
    ('POST', '/api/bloodbank/donors'):              3,
    ('GET',  '/api/bloodbank/units'):               2,
    ('POST', '/api/bloodbank/units'):               3,
    ('PUT',  '/api/bloodbank/units/*'):             3,
    ('GET',  '/api/bloodbank/transfusions'):        2,
    ('POST', '/api/bloodbank/transfusions'):        2,
    ('PUT',  '/api/bloodbank/transfusions/*'):      2,
}
```

### Four-eyes

Le four-eyes devient naturel :
- **L1 labtech entre le résultat** → **L2 superviseur valide**
- Le contrôle four-eyes existant (même opérateur ≠ saisie + validation) reste comme filet de sécurité
- Cas dégradé : un seul labtech + un seul superviseur → le flow fonctionne (personnes différentes par définition)

---

## R2 — Worklist labtech

### Le problème

Le labtech arrive le matin. Il a 30 échantillons à traiter. Aujourd'hui il voit le registre complet (tous statuts mélangés), aucun tri par priorité, pas de notion de "ce qui m'attend". Il doit cliquer sur chaque entrée pour savoir où elle en est.

> **Thomas :** "Comme il y a un turn dans les shifts, chaque labtech doit avoir accès à l'ensemble du travail qu'il y a à faire."

### Proposition : registre orienté action

**Pas un dashboard.** Pas de graphiques, pas de stats. Une **liste d'échantillons filtrée et triable** avec action directe.

#### Vue par défaut (filtre `REGISTERED` + `IN_PROGRESS`)

```
┌─────────────────────────────────────────────────────┐
│  ● 30 échantillons en attente          [Tous ▾]    │
├─────────────────────────────────────────────────────┤
│  🔴 SSD-2026-0031  Kamal, M, 45Y  ── URGENCES     │
│     SANG · NFS, Palu GE         15 min             │
│                                                     │
│  ⚪ SSD-2026-0030  Amira, F, 28Y  ── MATERNITÉ    │
│     URINE · ECBU                 42 min             │
│                                                     │
│  ⚪ SSD-2026-0029  Jean, M, 12Y  ── PÉDIATRIE     │
│     SANG · HB, GLU              1h05                │
│                                                     │
│  Tap = entrer résultats directement                 │
└─────────────────────────────────────────────────────┘
```

#### Principes

| Principe | Détail |
|----------|--------|
| **Un tap = une action** | Tap sur un échantillon → ouvre directement la saisie résultat |
| **Tri par urgence** | Ward "URGENCES" / "EMERGENCY" en haut, puis par ancienneté (FIFO) |
| **TAT visible** | Temps écoulé depuis l'enregistrement (vert < 1h, orange < 2h, rouge > 2h) |
| **Filtres rapides** | Tabs : `En attente` (défaut) · `En cours` · `Review` · `Terminés` · `Tous` |
| **Tous les échantillons** | Tout le labo, pas juste "les siens" — shifts et rotation |
| **Pas de pagination** | Volumes terrain (10-80/jour) ne justifient pas la pagination |

#### Filtres

| Filtre | Statuts affichés | Cible |
|--------|-----------------|-------|
| **En attente** | `REGISTERED` | Échantillons reçus, aucun résultat saisi |
| **En cours** | `IN_PROGRESS` | Résultats partiellement saisis |
| **Review** | `REVIEW` | En attente de validation superviseur |
| **Terminés** | `COMPLETED` | Résultats validés, imprimables |
| **Tous** | Tous statuts | Vue complète registre |

#### Ce que ce n'est PAS

- **Pas un dashboard superviseur** — les stats restent dans le module rapports (L2+)
- **Pas une attribution** — on n'assigne pas un échantillon à un labtech, tout le monde voit tout
- **Pas un Kanban** — pas de drag & drop, pas de colonnes, juste une liste triée

### Impact UI

Le registre actuel (`/register`) devient la worklist. Pas de nouvelle page :
1. **Filtre par défaut** : `REGISTERED` + `IN_PROGRESS` au lieu de tout afficher
2. **Tri** : ward urgence en haut, puis FIFO
3. **TAT coloré** : temps depuis `created_at`
4. **Tabs de filtre** : en haut du registre
5. **Tap direct** : ouvrir la saisie résultat sans passer par un détail intermédiaire
6. **Tab "Terminés"** : accès aux résultats validés + bouton imprimer

### Impact API

Aucun nouveau endpoint requis. `GET /api/register/entries` supporte déjà le filtre par statut. Ajouts :
- Paramètre `sort=urgency` (tri ward urgence + ancienneté)
- Inclure le `created_at` dans la réponse pour calculer le TAT côté client

---

## Interaction rôles + vues

| Rôle | Ce qu'il voit en premier | Actions possibles |
|------|-------------------------|-------------------|
| L0 (optionnel, futur) | Landing patient → wizard enregistrement uniquement | Créer patient, enregistrer échantillon |
| L1 (labtech) | **Worklist** (en attente/en cours) + bouton enregistrement | Enregistrer, saisir résultats, rejeter, imprimer validés |
| L2 (superviseur) | Table validation (REVIEW) + accès worklist | Valider, modifier, supprimer, unreject, rapports, export |
| L3 (admin) | Vue admin (config, opérateurs, équipements) | Tout |

Chaque rôle atterrit sur **sa vue principale** selon son niveau.

---

## R3 — Mobile (non prioritaire)

### Statut : feature secondaire, pas de contrainte bloquante

> **Thomas :** "Pour l'instant, ça n'est pas la priorité. Mais ça peut être une feature très intéressante pour les activités 'outreach'. Pouvoir tout rentrer sur un téléphone, ça facilite énormément la logistique."

### Opportunité identifiée
- Le téléphone peut servir de **scanner de codes-barres** (caméra)
- Autonomie du missionnaire sur le terrain
- UI déjà fonctionnelle sur mobile (wizard responsive)

### Contrainte scanner

> **Thomas :** "On a essayé d'utiliser la caméra comme lecteur de code-barres dans le Mini-LIMS, et ça galèrait grave."

Action : Thomas fournit des échantillons de codes-barres (y compris froissés) pour tester la robustesse.

### Règle : pas de barcode affiché à l'écran

> **Thomas :** "Il faut éviter les copier-coller. Plutôt que de zapper le code collé sur l'échantillon, ils zapperont le code-barre sur l'écran, créant un security breach."

Le barcode ne doit **jamais** être affiché à l'écran dans l'application. Le scan doit toujours se faire sur le **tube physique**.

### Plan mobile
1. Responsive CSS (en cours — fix wizard plein écran mobile fait)
2. Test robustesse scanner caméra avec vrais codes-barres terrain
3. Si validé : APK wrapper (WebView) pour installation offline

---

## Migration

### Données
Aucune migration DB requise. Les niveaux numériques (1, 2, 3) restent identiques en base. Seule la sémantique change. L0 sera ajouté si validé par les équipes terrain.

### Opérateurs existants
Les opérateurs devront être re-catégorisés selon les nouveaux rôles. Action admin à documenter dans les release notes.

### Rétrocompatibilité
- Les PINs existants restent valides
- Le `ROUTE_LEVELS` est mis à jour en une seule modification
- Le four-eyes continue de fonctionner (compare les noms d'opérateurs, pas les niveaux)

---

## Questions ouvertes

1. **L0 aide-soignant / formation** : Thomas doit valider avec les équipes terrain si ce niveau a du sens ou si c'est prématuré
2. **Banque de sang** : le labtech (L1) fait-il les screenings ? Si oui, ouvrir certaines routes blood bank à L1
3. **Seuils TAT** : les couleurs vert/orange/rouge configurables par site ou hardcodées ?
4. **Landing conditionnel** : détection du niveau au PIN → redirection automatique vers la vue appropriée ?
5. **Mini-LIMS** : Thomas demande l'accès aux IT pour montrer les fonctionnalités existantes — à benchmarker
