"""Auth engine tests — PIN verification, level enforcement, four-eyes."""

ADMIN_PIN = '123456'
SUPER_PIN = '2222'
OPER_PIN = '3333'


def H(pin):
    return {'X-Operator-Pin': pin}


def setup_operators(client):
    """Create all 3 operator levels."""
    client.post('/api/auth/setup', json={'name': 'Admin', 'pin': ADMIN_PIN})
    client.post('/api/auth/operators', json={'name': 'Supervisor', 'pin': SUPER_PIN, 'level': 2},
                headers=H(ADMIN_PIN))
    client.post('/api/auth/operators', json={'name': 'Operator', 'pin': OPER_PIN, 'level': 1},
                headers=H(ADMIN_PIN))


class TestSetup:

    def test_first_setup_creates_admin(self, client):
        resp = client.post('/api/auth/setup', json={'name': 'Admin', 'pin': '1234'})
        assert resp.status_code == 201

    def test_setup_fails_if_admin_exists(self, client):
        client.post('/api/auth/setup', json={'name': 'Admin', 'pin': '1234'})
        resp = client.post('/api/auth/setup', json={'name': 'Hacker', 'pin': '0000'})
        assert resp.status_code == 400

    def test_pin_must_be_digits(self, client):
        resp = client.post('/api/auth/setup', json={'name': 'Admin', 'pin': 'abcd'})
        assert resp.status_code == 400

    def test_pin_min_4_digits(self, client):
        resp = client.post('/api/auth/setup', json={'name': 'Admin', 'pin': '12'})
        assert resp.status_code == 400


class TestPINVerification:

    def test_verify_correct_pin(self, client):
        client.post('/api/auth/setup', json={'name': 'Admin', 'pin': ADMIN_PIN})
        resp = client.post('/api/auth/verify', json={'pin': ADMIN_PIN})
        assert resp.status_code == 200
        assert resp.get_json()['name'] == 'Admin'
        assert resp.get_json()['level'] == 3

    def test_verify_wrong_pin(self, client):
        client.post('/api/auth/setup', json={'name': 'Admin', 'pin': ADMIN_PIN})
        resp = client.post('/api/auth/verify', json={'pin': '0000'})
        assert resp.status_code == 401

    def test_verify_inactive_operator(self, client):
        setup_operators(client)
        # Deactivate operator
        ops = client.get('/api/auth/operators', headers=H(ADMIN_PIN)).get_json()
        oper_id = next(o['id'] for o in ops if o['name'] == 'Operator')
        client.delete(f'/api/auth/operators/{oper_id}', headers=H(ADMIN_PIN))
        # Verify should fail
        resp = client.post('/api/auth/verify', json={'pin': OPER_PIN})
        assert resp.status_code == 401


class TestLevelEnforcement:

    def test_no_pin_returns_401(self, client):
        setup_operators(client)
        resp = client.post('/api/register/entries', json={
            'patient_name': 'Test', 'requested_tests': []
        })
        assert resp.status_code == 401

    def test_invalid_pin_returns_401(self, client):
        setup_operators(client)
        resp = client.post('/api/register/entries', json={
            'patient_name': 'Test', 'requested_tests': []
        }, headers=H('9999'))
        assert resp.status_code == 401

    def test_level1_can_register(self, client):
        setup_operators(client)
        resp = client.post('/api/register/entries', json={
            'patient_name': 'Test', 'requested_tests': ['MAL_RDT']
        }, headers=H(OPER_PIN))
        assert resp.status_code == 201

    def test_level1_can_enter_results(self, client):
        setup_operators(client)
        entry = client.post('/api/register/entries', json={
            'patient_name': 'Test', 'requested_tests': ['MAL_RDT']
        }, headers=H(OPER_PIN)).get_json()
        resp = client.post(f'/api/register/entries/{entry["id"]}/results', json={
            'MAL_RDT': {'result_value': 'POS'}
        }, headers=H(OPER_PIN))
        assert resp.status_code == 200

    def test_level1_cannot_validate(self, client):
        setup_operators(client)
        entry = client.post('/api/register/entries', json={
            'patient_name': 'Test', 'requested_tests': ['MAL_RDT']
        }, headers=H(OPER_PIN)).get_json()
        client.post(f'/api/register/entries/{entry["id"]}/results', json={
            'MAL_RDT': {'result_value': 'POS'}
        }, headers=H(OPER_PIN))
        resp = client.post(f'/api/register/entries/{entry["id"]}/validate',
                           json={}, headers=H(OPER_PIN))
        assert resp.status_code == 403

    def test_level1_cannot_export(self, client):
        setup_operators(client)
        resp = client.post('/api/export/excel', json={
            'date_from': '2020-01-01', 'date_to': '2099-12-31'
        }, headers=H(OPER_PIN))
        assert resp.status_code == 403

    def test_level1_cannot_access_donors(self, client):
        setup_operators(client)
        resp = client.get('/api/bloodbank/donors', headers=H(OPER_PIN))
        assert resp.status_code == 403

    def test_level2_can_validate(self, client):
        setup_operators(client)
        entry = client.post('/api/register/entries', json={
            'patient_name': 'Test', 'requested_tests': ['MAL_RDT']
        }, headers=H(OPER_PIN)).get_json()
        client.post(f'/api/register/entries/{entry["id"]}/results', json={
            'MAL_RDT': {'result_value': 'POS'}
        }, headers=H(OPER_PIN))
        # Supervisor validates (different person = four-eyes OK)
        resp = client.post(f'/api/register/entries/{entry["id"]}/validate',
                           json={}, headers=H(SUPER_PIN))
        assert resp.status_code == 200

    def test_level2_can_export(self, client):
        setup_operators(client)
        resp = client.post('/api/export/excel', json={
            'date_from': '2020-01-01', 'date_to': '2099-12-31'
        }, headers=H(SUPER_PIN))
        assert resp.status_code == 200

    def test_level2_cannot_access_donors(self, client):
        setup_operators(client)
        resp = client.get('/api/bloodbank/donors', headers=H(SUPER_PIN))
        assert resp.status_code == 403

    def test_level3_can_access_donors(self, client):
        setup_operators(client)
        resp = client.get('/api/bloodbank/donors', headers=H(ADMIN_PIN))
        assert resp.status_code == 200

    def test_public_routes_no_auth(self, client):
        """GET endpoints without rules in ROUTE_LEVELS should work without PIN."""
        setup_operators(client)
        # GET entries list is public (no rule in ROUTE_LEVELS)
        resp = client.get('/api/register/entries?date_from=2020-01-01&date_to=2099-12-31')
        assert resp.status_code == 200
        # GET config is public
        resp = client.get('/api/config/tests')
        assert resp.status_code == 200
        # Patient search is public
        resp = client.get('/api/patients/search?q=test')
        assert resp.status_code == 200


class TestFourEyes:

    def test_same_operator_cannot_validate_own_results(self, client):
        setup_operators(client)
        # Supervisor enters results AND tries to validate
        entry = client.post('/api/register/entries', json={
            'patient_name': 'FourEyes', 'requested_tests': ['MAL_RDT']
        }, headers=H(SUPER_PIN)).get_json()
        client.post(f'/api/register/entries/{entry["id"]}/results', json={
            'MAL_RDT': {'result_value': 'POS'}
        }, headers=H(SUPER_PIN))
        resp = client.post(f'/api/register/entries/{entry["id"]}/validate',
                           json={}, headers=H(SUPER_PIN))
        assert resp.status_code == 403
        assert 'four-eyes' in resp.get_json()['error'].lower()

    def test_different_operator_can_validate(self, client):
        setup_operators(client)
        # Operator enters results
        entry = client.post('/api/register/entries', json={
            'patient_name': 'FourEyes OK', 'requested_tests': ['MAL_RDT']
        }, headers=H(OPER_PIN)).get_json()
        client.post(f'/api/register/entries/{entry["id"]}/results', json={
            'MAL_RDT': {'result_value': 'NEG'}
        }, headers=H(OPER_PIN))
        # Supervisor validates — different person
        resp = client.post(f'/api/register/entries/{entry["id"]}/validate',
                           json={}, headers=H(SUPER_PIN))
        assert resp.status_code == 200
        assert resp.get_json()['status'] == 'COMPLETED'


class TestOperatorInAudit:

    def test_action_tagged_with_operator_name(self, client):
        setup_operators(client)
        entry = client.post('/api/register/entries', json={
            'patient_name': 'Audit Name', 'requested_tests': ['MAL_RDT']
        }, headers=H(OPER_PIN)).get_json()
        resp = client.get(f'/api/register/entries/{entry["id"]}/audit', headers=H(SUPER_PIN))
        trail = resp.get_json()['trail']
        operators = [t['operator'] for t in trail]
        assert 'Operator' in operators
