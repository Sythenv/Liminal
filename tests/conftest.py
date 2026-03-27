"""Shared test fixtures."""

import os
import json
import pytest
from app import create_app


@pytest.fixture
def app(tmp_path):
    """Create a test app with a temporary database."""
    config_path = tmp_path / 'config.json'
    config_path.write_text(json.dumps({
        'site_name': 'Test Lab',
        'site_code': 'TST',
        'country': 'XX',
        'default_language': 'en',
        'host': '127.0.0.1',
        'port': 5000,
        'debug': False
    }))

    app = create_app(str(config_path))
    app.config['DATA_DIR'] = str(tmp_path / 'data')
    app.config['DATABASE'] = str(tmp_path / 'data' / 'test.db')
    os.makedirs(os.path.join(app.config['DATA_DIR'], 'exports'), exist_ok=True)

    from app.db import run_migrations, seed_data
    run_migrations(app)
    seed_data(app)

    yield app


@pytest.fixture
def client(app):
    """Test client."""
    return app.test_client()


@pytest.fixture
def sample_patient(client):
    """Create a sample patient and return the response data."""
    resp = client.post('/api/patients', json={
        'name': 'Test Patient',
        'age': 30,
        'age_unit': 'Y',
        'sex': 'M'
    })
    return resp.get_json()


@pytest.fixture
def sample_entry(client, sample_patient):
    """Create a sample entry linked to a patient."""
    resp = client.post('/api/register/entries', json={
        'patient_name': 'Test Patient',
        'age': 30,
        'sex': 'M',
        'ward': 'OPD',
        'specimen_type': 'BLOOD',
        'requested_tests': ['MAL_RDT', 'HB'],
        'patient_fk': sample_patient['id']
    })
    return resp.get_json()
