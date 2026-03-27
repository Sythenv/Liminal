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
    fetch(url).then(r => r.json()).then(patients => {
        const list = document.getElementById('patientList');
        const empty = document.getElementById('patientEmpty');
        list.innerHTML = '';

        if (patients.length === 0) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';

        patients.forEach(p => {
            const card = document.createElement('div');
            card.className = 'sample-card';
            card.addEventListener('click', () => openPatientDetail(p.id));

            const top = document.createElement('div');
            top.className = 'card-top';
            const num = document.createElement('span');
            num.className = 'card-lab-number';
            num.textContent = p.patient_number;
            const sexBadge = document.createElement('span');
            sexBadge.className = 'card-status completed';
            sexBadge.textContent = p.sex || '?';
            top.appendChild(num);
            top.appendChild(sexBadge);
            card.appendChild(top);

            const name = document.createElement('div');
            name.className = 'card-patient';
            name.textContent = p.name;
            card.appendChild(name);

            const details = document.createElement('div');
            details.className = 'card-details';
            const parts = [];
            if (p.age) parts.push(p.age + (p.age_unit || 'Y'));
            if (p.village) parts.push(p.village);
            if (p.contact) parts.push(p.contact);
            details.textContent = parts.join(' \u00b7 ');
            card.appendChild(details);

            list.appendChild(card);
        });
    });
}

function openPatientDetail(patientId) {
    fetch('/api/patients/' + patientId)
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
                ['Age', data.age ? data.age + (data.age_unit || 'Y') : '-'],
                ['Sex', data.sex || '-'],
                ['Village', data.village || '-'],
                ['Contact', data.contact || '-'],
                ['Registered', data.created_at || '-']
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
            histTitle.textContent = 'Lab History (' + data.lab_history.length + ')';
            histTitle.style.margin = '16px 0 8px';
            histTitle.style.color = 'var(--primary)';
            histTitle.style.fontSize = '16px';
            body.appendChild(histTitle);

            if (data.lab_history.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'result-readonly';
                empty.textContent = 'No lab records';
                body.appendChild(empty);
            } else {
                data.lab_history.forEach(entry => {
                    const card = document.createElement('div');
                    card.className = 'result-item';

                    const top = document.createElement('div');
                    top.style.display = 'flex';
                    top.style.justifyContent = 'space-between';
                    top.style.marginBottom = '4px';

                    const labNum = document.createElement('span');
                    labNum.style.fontFamily = 'monospace';
                    labNum.style.fontSize = '13px';
                    labNum.style.color = 'var(--gray)';
                    labNum.textContent = entry.lab_number;
                    top.appendChild(labNum);

                    const status = document.createElement('span');
                    const statusColors = { COMPLETED: 'var(--green-dark)', REVIEW: 'var(--purple)',
                        IN_PROGRESS: 'var(--orange)', REGISTERED: 'var(--blue)', REJECTED: 'var(--primary)' };
                    status.style.fontSize = '11px';
                    status.style.fontWeight = '700';
                    status.style.textTransform = 'uppercase';
                    status.style.color = statusColors[entry.status] || 'var(--gray)';
                    status.textContent = entry.status;
                    top.appendChild(status);

                    card.appendChild(top);

                    const date = document.createElement('div');
                    date.style.fontSize = '14px';
                    date.style.fontWeight = '700';
                    date.textContent = entry.reception_date;
                    if (entry.ward) date.textContent += ' \u00b7 ' + entry.ward;
                    if (entry.specimen_type) date.textContent += ' \u00b7 ' + entry.specimen_type;
                    card.appendChild(date);

                    if (entry.test_codes) {
                        const tests = document.createElement('div');
                        tests.className = 'card-tests';
                        tests.style.marginTop = '6px';
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
