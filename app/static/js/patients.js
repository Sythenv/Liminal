/* Patients page - search and view patient records with lab history */

let searchTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('patientSearch');
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadPatients(searchInput.value), 300);
    });

    document.getElementById('btnClosePatient').addEventListener('click', closePatientModal);
    document.getElementById('btnClosePatientFooter').addEventListener('click', closePatientModal);

    loadPatients('');
});

function loadPatients(query) {
    const url = query ? '/api/patients?q=' + encodeURIComponent(query) : '/api/patients';
    authFetch(url).then(r => r.json()).then(patients => {
        const list = document.getElementById('patientList');
        const empty = document.getElementById('patientEmpty');
        list.innerHTML = '';

        if (patients.length === 0) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';

        patients.forEach(p => {
            const parts = [];
            if (p.age) parts.push(p.age + (p.age_unit || 'Y'));
            if (p.village) parts.push(p.village);
            if (p.contact) parts.push(p.contact);

            const card = createCard({
                id: p.patient_number,
                status: p.sex || '?',
                statusClass: 'completed',
                title: p.name,
                subtitle: parts.join(' \u00b7 '),
                onClick: () => openPatientDetail(p.id)
            });

            list.appendChild(card);
        });
    });
}

function openPatientDetail(patientId) {
    authFetch('/api/patients/' + patientId)
        .then(r => r.json())
        .then(data => {
            document.getElementById('patientNumber').textContent = data.patient_number;
            document.getElementById('patientModalName').textContent = data.name;

            const body = document.getElementById('patientModalBody');
            body.innerHTML = '';

            // Demographics
            const demo = document.createElement('div');
            demo.className = 'confirm-summary';
            const rows = [
                [t('age'), data.age ? data.age + (data.age_unit || 'Y') : '-'],
                [t('sex'), data.sex || '-'],
                [t('pat_village'), data.village || '-'],
                [t('contact'), data.contact || '-'],
                [t('pat_registered'), data.created_at || '-']
            ];
            rows.forEach(([label, value]) => {
                const row = document.createElement('div');
                row.className = 'confirm-row';
                const lbl = document.createElement('span');
                lbl.className = 'confirm-label';
                lbl.textContent = label;
                const val = document.createElement('span');
                val.className = 'confirm-value';
                val.textContent = value;
                row.appendChild(lbl);
                row.appendChild(val);
                demo.appendChild(row);
            });
            body.appendChild(demo);

            // Lab history
            const histTitle = document.createElement('h3');
            histTitle.textContent = t('pat_lab_history') + ' (' + data.lab_history.length + ')';
            histTitle.className = 'lab-history-title';
            body.appendChild(histTitle);

            if (data.lab_history.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'result-readonly';
                empty.textContent = t('pat_no_records');
                body.appendChild(empty);
            } else {
                data.lab_history.forEach(entry => {
                    const card = document.createElement('div');
                    card.className = 'result-item';

                    const top = document.createElement('div');
                    top.className = 'result-item-top';

                    const labNum = document.createElement('span');
                    labNum.className = 'result-lab-number';
                    labNum.textContent = entry.lab_number;
                    top.appendChild(labNum);

                    const status = document.createElement('span');
                    const statusClassMap = { COMPLETED: 'status-completed', REVIEW: 'status-review',
                        IN_PROGRESS: 'status-in_progress', REGISTERED: 'status-registered', REJECTED: 'status-rejected' };
                    status.className = 'result-status ' + (statusClassMap[entry.status] || '');
                    status.textContent = entry.status;
                    top.appendChild(status);

                    card.appendChild(top);

                    const date = document.createElement('div');
                    date.className = 'result-date-line';
                    date.textContent = entry.reception_date;
                    if (entry.ward) date.textContent += ' \u00b7 ' + entry.ward;
                    if (entry.specimen_type) date.textContent += ' \u00b7 ' + entry.specimen_type;
                    card.appendChild(date);

                    if (entry.test_codes) {
                        const tests = document.createElement('div');
                        tests.className = 'card-tests';
                        tests.classList.add('u-mt-6');
                        entry.test_codes.split(',').forEach(code => {
                            const badge = document.createElement('span');
                            badge.className = 'card-test-badge';
                            badge.textContent = code;
                            tests.appendChild(badge);
                        });
                        card.appendChild(tests);
                    }

                    body.appendChild(card);
                });
            }

            document.getElementById('patientModal').style.display = 'flex';
        });
}

function closePatientModal() {
    document.getElementById('patientModal').style.display = 'none';
}
