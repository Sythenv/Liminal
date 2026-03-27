"""Security tests — XSS, SQL injection, path traversal, headers."""


class TestXSSPrevention:

    def test_xss_in_patient_name(self, client):
        payload = '<script>alert("xss")</script>'
        resp = client.post('/api/register/entries', json={
            'patient_name': payload, 'requested_tests': []
        })
        assert resp.status_code == 201
        assert '<script>' in resp.get_json()['patient_name']

    def test_xss_in_patient_name_truncated(self, client):
        long_name = 'A' * 300
        resp = client.post('/api/register/entries', json={
            'patient_name': long_name, 'requested_tests': []
        })
        assert resp.status_code == 201
        assert len(resp.get_json()['patient_name']) == 200


class TestSQLInjection:

    def test_sqli_in_patient_name(self, client):
        resp = client.post('/api/register/entries', json={
            'patient_name': "'; DROP TABLE lab_register; --",
            'requested_tests': []
        })
        assert resp.status_code == 201
        resp2 = client.get('/api/register/entries?date_from=2020-01-01&date_to=2099-12-31')
        assert resp2.status_code == 200

    def test_sqli_in_search(self, client):
        resp = client.get("/api/patients/search?q=' OR 1=1 --")
        assert resp.status_code == 200

    def test_sqli_in_entry_search(self, client):
        resp = client.get("/api/register/entries?search=' OR 1=1 --&date_from=2020-01-01&date_to=2099-12-31")
        assert resp.status_code == 200


class TestPathTraversal:

    def test_path_traversal_dotdot(self, client):
        resp = client.get('/api/export/download/../../etc/passwd')
        assert resp.status_code in (400, 404)

    def test_path_traversal_encoded(self, client):
        resp = client.get('/api/export/download/..%2F..%2Fetc%2Fpasswd')
        assert resp.status_code in (400, 404)

    def test_path_traversal_absolute(self, client):
        resp = client.get('/api/export/download//etc/passwd')
        assert resp.status_code in (400, 404)


class TestSecurityHeaders:

    def test_csp_header(self, client):
        resp = client.get('/register')
        csp = resp.headers.get('Content-Security-Policy', '')
        assert "script-src 'self'" in csp

    def test_xframe_header(self, client):
        resp = client.get('/register')
        assert resp.headers.get('X-Frame-Options') == 'DENY'

    def test_content_type_options(self, client):
        resp = client.get('/register')
        assert resp.headers.get('X-Content-Type-Options') == 'nosniff'

    def test_referrer_policy(self, client):
        resp = client.get('/register')
        assert 'strict-origin' in resp.headers.get('Referrer-Policy', '')


class TestInputValidation:

    def test_rejection_reason_constrained(self, client, sample_entry):
        resp = client.post(f'/api/register/entries/{sample_entry["id"]}/reject', json={
            'reason': 'FREE_TEXT_NOT_ALLOWED'
        })
        assert resp.status_code == 400

    def test_sex_constrained(self, client):
        resp = client.post('/api/register/entries', json={
            'patient_name': 'Test', 'sex': 'X'
        })
        assert resp.status_code == 400

    def test_age_range(self, client):
        resp = client.post('/api/register/entries', json={
            'patient_name': 'Test', 'age': -1
        })
        assert resp.status_code == 400
        resp = client.post('/api/register/entries', json={
            'patient_name': 'Test', 'age': 201
        })
        assert resp.status_code == 400

    def test_blood_group_constrained(self, client):
        resp = client.post('/api/bloodbank/donors', json={
            'name': 'Test', 'blood_group': 'Z+'
        })
        assert resp.status_code == 400

    def test_equipment_condition_constrained(self, client):
        resp = client.post('/api/equipment', json={
            'name': 'Test', 'physical_condition': 'INVALID'
        })
        assert resp.status_code == 400

    def test_maintenance_type_constrained(self, client):
        eq = client.post('/api/equipment', json={'name': 'X'}).get_json()
        resp = client.post(f'/api/equipment/{eq["id"]}/maintenance', json={
            'maintenance_type': 'INVALID'
        })
        assert resp.status_code == 400
