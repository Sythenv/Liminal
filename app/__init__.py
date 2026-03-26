"""MSF Laboratory Registration System - App Factory."""

import os
import json
from flask import Flask, redirect, url_for


def create_app(config_path=None):
    app = Flask(__name__)

    # Load site config
    if config_path is None:
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'config.json')
    with open(config_path, 'r') as f:
        site_config = json.load(f)

    app.config['SITE_NAME'] = site_config.get('site_name', 'MSF Laboratory')
    app.config['SITE_CODE'] = site_config.get('site_code', 'LAB')
    app.config['COUNTRY'] = site_config.get('country', 'SSD')
    app.config['DEFAULT_LANGUAGE'] = site_config.get('default_language', 'en')
    app.config['LAB_NUMBER_FORMAT'] = site_config.get('lab_number_format', '{site_code}-{year}-{seq:04d}')
    app.config['HOST'] = site_config.get('host', '127.0.0.1')
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
    app.register_blueprint(register_bp, url_prefix='/api/register')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(export_bp, url_prefix='/api/export')
    app.register_blueprint(config_bp, url_prefix='/api/config')

    # Page routes
    from .pages import bp as pages_bp
    app.register_blueprint(pages_bp)

    @app.route('/')
    def index():
        return redirect(url_for('pages.register'))

    return app
