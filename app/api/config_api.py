"""Configuration API - read-only test menu (config comes from config.json)."""

from flask import Blueprint, jsonify
from app.db import get_db

bp = Blueprint('config', __name__)


@bp.route('/tests', methods=['GET'])
def list_tests():
    db = get_db()
    tests = db.execute('SELECT * FROM test_definition WHERE is_active = 1 ORDER BY display_order').fetchall()
    return jsonify([dict(t) for t in tests])
