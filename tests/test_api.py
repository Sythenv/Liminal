"""API endpoint tests — happy path and edge cases."""

import json


class TestPatientAPI:

    def test_create_patient(self, client):
        resp = client.post('/api/patients', json={
            'name': 'Deng Mawien', 'age': 28, 'sex': 'M'
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['patient_number'].startswith('P-')
        assert data['name'] == 'Deng Mawien'

    def test_create_patient_no_name(self, client):
        resp = client.post('/api/patients', json={'age': 28})
        assert resp.status_code == 400

    def test_search_patient(self, client, sample_patient):
        resp = client.get('/api/patients/search?q=Test')
        data = resp.get_json()
        assert len(data) >= 1

    def test_search_too_short(self, client):
        resp = client.get('/api/patients/search?q=T')
        assert resp.get_json() == []

    def test_patient_history(self, client, sample_entry):
        patient_id = sample_entry['patient_fk']
        resp = client.get(f'/api/patients/{patient_id}')
        data = resp.get_json()
        assert data['name'] == 'Test Patient'
        assert len(data['lab_history']) >= 1

    def test_update_patient(self, client, sample_patient):
        resp = client.put(f'/api/patients/{sample_patient["id"]}', json={
            'village': 'Test Town'
        })
        assert resp.status_code == 200
        assert resp.get_json()['village'] == 'Test Town'


class TestRegisterAPI:

    def test_create_entry(self, client, sample_patient):
        resp = client.post('/api/register/entries', json={
            'patient_name': 'Test Patient',
            'age': 30, 'sex': 'M', 'ward': 'OPD',
            'requested_tests': ['MAL_RDT'],
            'patient_fk': sample_patient['id']
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['lab_number'].startswith('TST-')
        assert data['status'] == 'REGISTERED'

    def test_create_entry_no_name(self, client):
        resp = client.post('/api/register/entries', json={'age': 30})
        assert resp.status_code == 400

    def test_create_entry_invalid_sex(self, client):
        resp = client.post('/api/register/entries', json={
            'patient_name': 'X', 'sex': 'INVALID'
        })
        assert resp.status_code == 400

    def test_create_entry_invalid_age(self, client):
        resp = client.post('/api/register/entries', json={
            'patient_name': 'X', 'age': 999
        })
        assert resp.status_code == 400

    def test_list_entries(self, client, sample_entry):
        resp = client.get('/api/register/entries?date_from=2020-01-01&date_to=2099-12-31')
        data = resp.get_json()
        assert len(data['entries']) >= 1

    def test_collection_time(self, client):
        resp = client.post('/api/register/entries', json={
            'patient_name': 'Time Test',
            'collection_time': '08:30',
            'requested_tests': []
        })
        assert resp.status_code == 201
        assert resp.get_json()['collection_time'] == '08:30'

    def test_collection_time_invalid(self, client):
        resp = client.post('/api/register/entries', json={
            'patient_name': 'Time Test',
            'collection_time': 'not-a-time',
            'requested_tests': []
        })
        assert resp.status_code == 201
        assert resp.get_json()['collection_time'] is None


    def test_lookup_by_lab_number(self, client, sample_entry):
        lab = sample_entry['lab_number']
        resp = client.get(f'/api/register/entries/lookup?lab_number={lab}')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['entry']['lab_number'] == lab
        assert 'results' in data['entry']
        assert 'tests' in data

    def test_lookup_not_found(self, client):
        resp = client.get('/api/register/entries/lookup?lab_number=FAKE-0000')
        assert resp.status_code == 404

    def test_lookup_missing_param(self, client):
        resp = client.get('/api/register/entries/lookup')
        assert resp.status_code == 400


class TestResultsAPI:

    def test_enter_result(self, client, sample_entry):
        entry_id = sample_entry['id']
        resp = client.post(f'/api/register/entries/{entry_id}/results', json={
            'MAL_RDT': {'result_value': 'POS'}
        })
        assert resp.status_code == 200

    def test_result_updates_status_to_review(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/results', json={
            'MAL_RDT': {'result_value': 'NEG'},
            'HB': {'result_value': '12.5'}
        })
        resp = client.get('/api/register/entries?date_from=2020-01-01&date_to=2099-12-31')
        entry = next(e for e in resp.get_json()['entries'] if e['id'] == entry_id)
        assert entry['status'] == 'REVIEW'

    def test_panic_acknowledged(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/results', json={
            'HB': {'result_value': '3.0', 'panic_acknowledged': True}
        })
        resp = client.get('/api/register/entries?date_from=2020-01-01&date_to=2099-12-31')
        entry = next(e for e in resp.get_json()['entries'] if e['id'] == entry_id)
        assert entry['results']['HB']['panic_acknowledged'] == 1

    def test_structured_result_cbc(self, client):
        cbc_json = json.dumps({'WBC': '8.5', 'PLT': '220', 'HCT': '38'})
        resp = client.post('/api/register/entries', json={
            'patient_name': 'CBC Test', 'requested_tests': ['CBC']
        })
        eid = resp.get_json()['id']
        client.post(f'/api/register/entries/{eid}/results', json={
            'CBC': {'result_value': cbc_json}
        })
        resp = client.get('/api/register/entries?date_from=2020-01-01&date_to=2099-12-31')
        entry = next(e for e in resp.get_json()['entries'] if e['id'] == eid)
        stored = json.loads(entry['results']['CBC']['result_value'])
        assert stored['WBC'] == '8.5'


class TestValidateAPI:

    def test_validate_from_review(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/results', json={
            'MAL_RDT': {'result_value': 'NEG'}, 'HB': {'result_value': '12.0'}
        })
        resp = client.post(f'/api/register/entries/{entry_id}/validate', json={})
        assert resp.status_code == 200
        assert resp.get_json()['status'] == 'COMPLETED'

    def test_validate_non_review_fails(self, client, sample_entry):
        resp = client.post(f'/api/register/entries/{sample_entry["id"]}/validate', json={})
        assert resp.status_code == 400


class TestRejectAPI:

    def test_reject(self, client, sample_entry):
        resp = client.post(f'/api/register/entries/{sample_entry["id"]}/reject', json={
            'reason': 'HEMOLYZED'
        })
        assert resp.status_code == 200
        assert resp.get_json()['status'] == 'REJECTED'

    def test_reject_invalid_reason(self, client, sample_entry):
        resp = client.post(f'/api/register/entries/{sample_entry["id"]}/reject', json={
            'reason': 'INVALID'
        })
        assert resp.status_code == 400

    def test_unreject(self, client, sample_entry):
        entry_id = sample_entry['id']
        client.post(f'/api/register/entries/{entry_id}/reject', json={'reason': 'QNS'})
        resp = client.post(f'/api/register/entries/{entry_id}/unreject', json={})
        assert resp.status_code == 200
        assert resp.get_json()['status'] == 'REGISTERED'

    def test_unreject_non_rejected_fails(self, client, sample_entry):
        resp = client.post(f'/api/register/entries/{sample_entry["id"]}/unreject', json={})
        assert resp.status_code == 400


class TestBloodBankAPI:

    def test_create_donor(self, client):
        resp = client.post('/api/bloodbank/donors', json={
            'name': 'Donor Test', 'age': 25, 'sex': 'M', 'blood_group': 'O+'
        })
        assert resp.status_code == 201

    def test_create_donor_invalid_bg(self, client):
        resp = client.post('/api/bloodbank/donors', json={
            'name': 'Bad BG', 'blood_group': 'Z+'
        })
        assert resp.status_code == 400

    def test_create_unit(self, client):
        dr = client.post('/api/bloodbank/donors', json={
            'name': 'Donor', 'blood_group': 'A+'
        }).get_json()
        resp = client.post('/api/bloodbank/units', json={
            'donor_id': dr['id'], 'blood_group': 'A+',
            'screening_hiv': 'NEG', 'screening_hbv': 'NEG',
            'screening_hcv': 'NEG', 'screening_syphilis': 'NEG'
        })
        assert resp.status_code == 201
        assert resp.get_json()['status'] == 'AVAILABLE'

    def test_issue_transfusion(self, client):
        dr = client.post('/api/bloodbank/donors', json={
            'name': 'Donor', 'blood_group': 'O+'
        }).get_json()
        unit = client.post('/api/bloodbank/units', json={
            'donor_id': dr['id'], 'blood_group': 'O+'
        }).get_json()
        resp = client.post('/api/bloodbank/transfusions', json={
            'unit_id': unit['id'],
            'patient_name': 'Recipient',
            'patient_blood_group': 'O+',
            'crossmatch_result': 'COMPATIBLE',
            'issued_to_ward': 'ER'
        })
        assert resp.status_code == 201


class TestEquipmentAPI:

    def test_create_equipment(self, client):
        resp = client.post('/api/equipment', json={
            'name': 'Microscope', 'category': 'Microscope',
            'model': 'CX23', 'physical_condition': 'Good'
        })
        assert resp.status_code == 201

    def test_create_equipment_invalid_condition(self, client):
        resp = client.post('/api/equipment', json={
            'name': 'Bad', 'physical_condition': 'BROKEN'
        })
        assert resp.status_code == 400

    def test_add_maintenance(self, client):
        eq = client.post('/api/equipment', json={
            'name': 'Centrifuge', 'category': 'Centrifuge'
        }).get_json()
        resp = client.post(f'/api/equipment/{eq["id"]}/maintenance', json={
            'maintenance_type': 'PREVENTIVE',
            'description': 'Cleaned rotor',
            'performed_by': 'Tech A'
        })
        assert resp.status_code == 201

    def test_invalid_maintenance_type(self, client):
        eq = client.post('/api/equipment', json={'name': 'X'}).get_json()
        resp = client.post(f'/api/equipment/{eq["id"]}/maintenance', json={
            'maintenance_type': 'INVALID'
        })
        assert resp.status_code == 400


class TestExportAPI:

    def test_export_excel(self, client, sample_entry):
        resp = client.post('/api/export/excel', json={
            'date_from': '2020-01-01', 'date_to': '2099-12-31'
        })
        assert resp.status_code == 200

    def test_export_csv(self, client, sample_entry):
        resp = client.post('/api/export/csv', json={
            'date_from': '2020-01-01', 'date_to': '2099-12-31'
        })
        assert resp.status_code == 200

    def test_download_path_traversal(self, client):
        resp = client.get('/api/export/download/../../../etc/passwd')
        assert resp.status_code in (400, 404)
