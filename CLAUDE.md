# Liminal

LIMS offline-first pour laboratoires de terrain MSF. Flask + SQLite + vanilla JS.

## Commandes

```bash
./start.sh               # Lancer (Linux/Mac)
python -m app.run         # Direct
pytest tests/ -v          # Tests (obligatoire avant commit)
rm data/lab.db            # Reset DB (recréée au démarrage)
```

## Règles

- Nouvel endpoint API → ajouter dans `ROUTE_LEVELS` (app/auth.py)
- Toute mutation de données → `log_action()` (app/audit.py)
- Pas de sessions : PIN vérifié par requête via header `X-Operator-Pin`, opérateur dans `g.operator`
- Migrations immutables : nouveau fichier SQL dans migrations/, jamais modifier les existants
- SQL paramétré uniquement (`?`), jamais de concat de strings
- Vanilla JS : pas de framework frontend
- Dates ISO 8601 : YYYY-MM-DD, HH:MM
- Réponses API : toujours JSON, y compris les erreurs

## Langue

Code et commits en **anglais**. Communication avec l'utilisateur en **français**.
