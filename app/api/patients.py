"""Patient autocomplete API."""

from flask import Blueprint, request, jsonify
from app.db import get_db

bp = Blueprint('patients', __name__)


@bp.route('/search', methods=['GET'])
def search():
    """Search patients by name for autocomplete."""
    q = request.args.get('q', '')
    if len(q) < 2:
        return jsonify([])

    db = get_db()
    results = db.execute('''SELECT DISTINCT patient_name, patient_id, age, sex, ward
        FROM lab_register
        WHERE patient_name LIKE ?
        ORDER BY reception_date DESC
        LIMIT 10''', (f'%{q}%',)).fetchall()

    return jsonify([dict(r) for r in results])
