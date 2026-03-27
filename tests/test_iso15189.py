"""ISO 15189 compliance tests — audit trail, data integrity, workflow enforcement."""


class TestAuditTrail:

    def test_create_entry_generates_audit(self, client, sample_entry):
        entry_id = sample_entry['id']
        resp = client.get(f'/api/register/entries/{entry_id}/audit')
        data = resp.get_json()
        assert len(data['trail']) > 0
        assert 'CREATE' in [t['action'] for t in data['trail']]

    def test_result_entry_generates_audit(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/results', json={
            'MAL_RDT': {'result_value': 'POS'}
        })
        resp = client.get(f'/api/register/entries/{entry_id}/audit')
        trail = resp.get_json()['trail']
        assert any(t['action'] == 'RESULT' for t in trail)

    def test_reject_generates_audit(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/reject', json={'reason': 'CLOTTED'})
        resp = client.get(f'/api/register/entries/{entry_id}/audit')
        trail = resp.get_json()['trail']
        assert any(t['action'] == 'REJECT' for t in trail)

    def test_validate_generates_audit(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/results', json={
            'MAL_RDT': {'result_value': 'NEG'}, 'HB': {'result_value': '13.0'}
        })
        client.post(f'/api/register/entries/{entry_id}/validate', json={})
        resp = client.get(f'/api/register/entries/{entry_id}/audit')
        trail = resp.get_json()['trail']
        assert any(t['action'] == 'VALIDATE' for t in trail)

    def test_unreject_generates_audit(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/reject', json={'reason': 'QNS'})
        client.post(f'/api/register/entries/{entry_id}/unreject', json={})
        resp = client.get(f'/api/register/entries/{entry_id}/audit')
        trail = resp.get_json()['trail']
        assert any(t['action'] == 'UNREJECT' for t in trail)


class TestDataIntegrity:

    def test_integrity_ok_after_create(self, client, sample_entry):
        resp = client.get(f'/api/register/entries/{sample_entry["id"]}/audit')
        assert resp.get_json()['integrity'] is True

    def test_integrity_fails_on_tamper(self, client, sample_entry, app):
        entry_id = sample_entry['id']
        with app.app_context():
            from app.db import get_db
            db = get_db()
            db.execute("UPDATE lab_register SET patient_name='TAMPERED' WHERE id=?", (entry_id,))
            db.commit()
        resp = client.get(f'/api/register/entries/{entry_id}/audit')
        assert resp.get_json()['integrity'] is False

    def test_hash_stored_on_every_action(self, client, sample_entry):
        resp = client.get(f'/api/register/entries/{sample_entry["id"]}/audit')
        for log in resp.get_json()['trail']:
            assert log['entry_hash'] is not None
            assert len(log['entry_hash']) == 64


class TestWorkflowEnforcement:

    def test_new_entry_is_registered(self, client, sample_entry):
        assert sample_entry['status'] == 'REGISTERED'

    def test_partial_results_is_in_progress(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/results', json={
            'MAL_RDT': {'result_value': 'POS'}
        })
        resp = client.get('/api/register/entries?date_from=2020-01-01&date_to=2099-12-31')
        entry = next(e for e in resp.get_json()['entries'] if e['id'] == entry_id)
        assert entry['status'] == 'IN_PROGRESS'

    def test_all_results_is_review(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/results', json={
            'MAL_RDT': {'result_value': 'NEG'}, 'HB': {'result_value': '14.0'}
        })
        resp = client.get('/api/register/entries?date_from=2020-01-01&date_to=2099-12-31')
        entry = next(e for e in resp.get_json()['entries'] if e['id'] == entry_id)
        assert entry['status'] == 'REVIEW'

    def test_cannot_validate_without_review(self, client, sample_entry):
        resp = client.post(f'/api/register/entries/{sample_entry["id"]}/validate', json={})
        assert resp.status_code == 400

    def test_validate_completes_entry(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/results', json={
            'MAL_RDT': {'result_value': 'NEG'}, 'HB': {'result_value': '12.0'}
        })
        resp = client.post(f'/api/register/entries/{entry_id}/validate', json={})
        assert resp.get_json()['status'] == 'COMPLETED'

    def test_validate_sets_reporting_date(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/results', json={
            'MAL_RDT': {'result_value': 'NEG'}, 'HB': {'result_value': '12.0'}
        })
        resp = client.post(f'/api/register/entries/{entry_id}/validate', json={})
        assert resp.get_json()['reporting_date'] is not None

    def test_cannot_unreject_non_rejected(self, client, sample_entry):
        resp = client.post(f'/api/register/entries/{sample_entry["id"]}/unreject', json={})
        assert resp.status_code == 400
