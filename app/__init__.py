"""Laboratory Registration System - App Factory."""

import os
import json
from flask import Flask, redirect, url_for, request, jsonify

__version__ = 'dev'


def create_app(config_path=None):
    app = Flask(__name__)
    app.config['VERSION'] = __version__
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable static file caching in dev

    # Load site config
    if config_path is None:
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'config.json')
    with open(config_path, 'r') as f:
        site_config = json.load(f)

    app.config['SITE_NAME'] = site_config.get('site_name', 'Laboratory')
    app.config['SITE_CODE'] = site_config.get('site_code', 'LAB')
    app.config['COUNTRY'] = site_config.get('country', 'SSD')
    app.config['DEFAULT_LANGUAGE'] = site_config.get('default_language', 'en')
    app.config['LAB_NUMBER_FORMAT'] = site_config.get('lab_number_format', '{site_code}-{year}-{seq:04d}')
    app.config['HOST'] = os.environ.get('LIMINAL_HOST', site_config.get('host', '127.0.0.1'))
    app.config['PORT'] = site_config.get('port', 5000)
    app.config['DEBUG'] = site_config.get('debug', False)

    # Data directory
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(os.path.join(data_dir, 'exports'), exist_ok=True)
    app.config['DATA_DIR'] = os.path.abspath(data_dir)
    app.config['DATABASE'] = os.path.join(app.config['DATA_DIR'], 'lab.db')

    # Initialize database
    from .db import init_app
    init_app(app)

    # Register API blueprints
    from .api.register import bp as register_bp
    from .api.patients import bp as patients_bp
    from .api.export import bp as export_bp
    from .api.config_api import bp as config_bp
    from .api.reports import bp as reports_bp
    from .api.backup import bp as backup_bp
    app.register_blueprint(register_bp, url_prefix='/api/register')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(export_bp, url_prefix='/api/export')
    app.register_blueprint(config_bp, url_prefix='/api/config')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(backup_bp, url_prefix='/api/backup')

    from .api.bloodbank import bp as bloodbank_bp
    from .api.equipment import bp as equipment_bp
    app.register_blueprint(bloodbank_bp, url_prefix='/api/bloodbank')
    app.register_blueprint(equipment_bp, url_prefix='/api/equipment')

    from .auth import bp as auth_bp, auth_middleware
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.before_request(auth_middleware)

    # Page routes
    from .pages import bp as pages_bp
    app.register_blueprint(pages_bp)

    # Security headers
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'"
        )
        return response

    # Input validation: reject oversized payloads
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max (backup restore)

    # Bind safety: restrict to localhost unless LAN mode enabled
    @app.before_request
    def check_host():
        bind_host = app.config.get('HOST', '127.0.0.1')
        if bind_host == '0.0.0.0':
            return  # LAN mode: accept all connections
        allowed = {'127.0.0.1', 'localhost'}
        host = request.host.split(':')[0]
        if host not in allowed:
            return jsonify({'error': 'Access denied'}), 403

    @app.route('/')
    def index():
        return redirect(url_for('pages.register'))

    return app
