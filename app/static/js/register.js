/* MSF Lab Register - Card/Workflow UX */

let currentTests = [];
let currentDate = new Date().toISOString().split('T')[0];
let wizardData = {};
let currentEntryId = null;
let debounceTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    // Load tests first, then entries
    fetch('/api/config/tests').then(r => r.json()).then(tests => {
        currentTests = tests.filter(t => t.is_active);
        updateDateDisplay();
        loadEntries();
    });

    // Button group handlers
    setupButtonGroups();
});

// ===== DATE NAVIGATION =====

function updateDateDisplay() {
    const d = new Date(currentDate + 'T12:00:00');
    const today = new Date().toISOString().split('T')[0];
    const label = document.querySelector('.day-label');

    if (currentDate === today) {
        label.textContent = getCurrentLang() === 'fr' ? "Aujourd'hui" : 'Today';
    } else {
        label.textContent = d.toLocaleDateString(getCurrentLang() === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long' });
    }
    document.getElementById('currentDate').textContent = d.toLocaleDateString(
        getCurrentLang() === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }
    );
}

function changeDay(delta) {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    currentDate = d.toISOString().split('T')[0];
    updateDateDisplay();
    loadEntries();
}

// ===== LOAD & RENDER ENTRIES =====

function loadEntries() {
    fetch(`/api/register/entries?date_from=${currentDate}&date_to=${currentDate}`)
        .then(r => r.json())
        .then(data => renderCards(data.entries));
}

function renderCards(entries) {
    const list = document.getElementById('cardList');
    const empty = document.getElementById('emptyState');
    const count = document.getElementById('entryCount');
    const lang = getCurrentLang();

    count.textContent = entries.length === 0 ? '' :
        `${entries.length} ${lang === 'fr' ? 'echantillon(s)' : 'sample(s)'}`;

    if (entries.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    list.innerHTML = entries.map(entry => {
        const statusClass = `status-${entry.status.toLowerCase()}`;
        const statusLabel = entry.status.toLowerCase().replace('_', ' ');
        const age = entry.age ? `${entry.age}${entry.age_unit || 'Y'}` : '';
        const details = [age, entry.sex, entry.ward].filter(Boolean).join(' · ');

        // Test badges
        const badges = currentTests.map(t => {
            const r = entry.results[t.code];
            if (!r || !r.requested) return '';
            const name = lang === 'fr' ? t.name_fr : t.name_en;
            let cls = 'card-test-badge';
            if (r.result_value) {
                const v = r.result_value.toUpperCase();
                if (v === 'POS' || v === 'POSITIVE' || v === '+') cls += ' result-positive';
                else cls += ' has-result';
            }
            return `<span class="${cls}" title="${name}">${t.code}${r.result_value ? ': ' + r.result_value : ''}</span>`;
        }).filter(Boolean).join('');

        return `
        <div class="sample-card ${statusClass}" onclick="openResults(${entry.id})">
            <div class="card-top">
                <span class="card-lab-number">${entry.lab_number}</span>
                <span class="card-status ${entry.status.toLowerCase()}">${statusLabel}</span>
            </div>
            <div class="card-patient">${entry.patient_name}</div>
            <div class="card-details">${details}</div>
            <div class="card-tests">${badges}</div>
        </div>`;
    }).join('');
}

// ===== WIZARD: NEW ENTRY =====

function startNewEntry() {
    wizardData = { age_unit: 'Y' };
    document.getElementById('wPatientName').value = '';
    document.getElementById('wAge').value = '';
    document.querySelectorAll('.sex-btn, .ward-btn, .unit-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.unit-btn[data-unit="Y"]').classList.add('active');

    // Build test selection
    buildTestSelection();

    document.getElementById('wizardModal').style.display = 'flex';
    goStep(1);
    setTimeout(() => document.getElementById('wPatientName').focus(), 300);
}

function closeWizard() {
    document.getElementById('wizardModal').style.display = 'none';
}

function goStep(n) {
    [1, 2, 3].forEach(i => {
        document.getElementById(`step${i}`).style.display = i === n ? 'block' : 'none';
    });
    if (n === 3) buildConfirmSummary();
}

function buildTestSelection() {
    const container = document.getElementById('testCategories');
    const lang = getCurrentLang();
    const categories = {};

    currentTests.forEach(t => {
        if (!categories[t.category]) categories[t.category] = [];
        categories[t.category].push(t);
    });

    container.innerHTML = Object.entries(categories).map(([cat, tests]) => `
        <div class="test-cat-label">${cat}</div>
        <div class="test-btns">
            ${tests.map(t => {
                const name = lang === 'fr' ? t.name_fr : t.name_en;
                return `<button type="button" class="test-btn" data-code="${t.code}" onclick="toggleTestBtn(this)">${name}</button>`;
            }).join('')}
        </div>
    `).join('');
}

function toggleTestBtn(btn) {
    btn.classList.toggle('selected');
}

function buildConfirmSummary() {
    // Collect wizard data
    wizardData.patient_name = document.getElementById('wPatientName').value;
    wizardData.age = document.getElementById('wAge').value || null;
    const sexBtn = document.querySelector('.sex-btn.active');
    wizardData.sex = sexBtn ? sexBtn.dataset.sex : null;
    const wardBtn = document.querySelector('.ward-btn.active');
    wizardData.ward = wardBtn ? wardBtn.dataset.ward : null;

    // Selected tests
    wizardData.requested_tests = [];
    document.querySelectorAll('.test-btn.selected').forEach(b => {
        wizardData.requested_tests.push(b.dataset.code);
    });

    const lang = getCurrentLang();
    const testNames = wizardData.requested_tests.map(code => {
        const t = currentTests.find(t => t.code === code);
        return t ? (lang === 'fr' ? t.name_fr : t.name_en) : code;
    });

    document.getElementById('confirmSummary').innerHTML = `
        <div class="confirm-row">
            <span class="confirm-label">${lang === 'fr' ? 'Patient' : 'Patient'}</span>
            <span class="confirm-value">${wizardData.patient_name || '-'}</span>
        </div>
        <div class="confirm-row">
            <span class="confirm-label">${lang === 'fr' ? 'Age' : 'Age'}</span>
            <span class="confirm-value">${wizardData.age ? wizardData.age + wizardData.age_unit : '-'}</span>
        </div>
        <div class="confirm-row">
            <span class="confirm-label">${lang === 'fr' ? 'Sexe' : 'Sex'}</span>
            <span class="confirm-value">${wizardData.sex || '-'}</span>
        </div>
        <div class="confirm-row">
            <span class="confirm-label">${lang === 'fr' ? 'Service' : 'Ward'}</span>
            <span class="confirm-value">${wizardData.ward || '-'}</span>
        </div>
        <div class="confirm-row">
            <span class="confirm-label">${lang === 'fr' ? 'Analyses' : 'Tests'} (${testNames.length})</span>
        </div>
        <div class="confirm-tests">
            ${testNames.map(n => `<span class="confirm-test-tag">${n}</span>`).join('')}
        </div>
    `;
}

function submitEntry() {
    if (!wizardData.patient_name) {
        goStep(1);
        document.getElementById('wPatientName').focus();
        return;
    }

    const payload = {
        patient_name: wizardData.patient_name,
        age: wizardData.age ? parseInt(wizardData.age) : null,
        age_unit: wizardData.age_unit,
        sex: wizardData.sex,
        ward: wizardData.ward,
        specimen_type: 'BLOOD',
        requested_tests: wizardData.requested_tests
    };

    fetch('/api/register/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(entry => {
        closeWizard();
        showSuccess(entry.lab_number);
        loadEntries();
    });
}

function showSuccess(labNumber) {
    const overlay = document.getElementById('successOverlay');
    document.getElementById('successLabNumber').textContent = labNumber;
    overlay.style.display = 'flex';
    setTimeout(() => { overlay.style.display = 'none'; }, 2000);
}

// ===== RESULT ENTRY =====

function openResults(entryId) {
    currentEntryId = entryId;

    fetch(`/api/register/entries?date_from=2020-01-01&date_to=2099-12-31&search=`)
        .then(r => r.json())
        .then(data => {
            const entry = data.entries.find(e => e.id === entryId);
            if (!entry) return;

            document.getElementById('resultPatientName').textContent =
                `${entry.lab_number} · ${entry.patient_name}`;

            const lang = getCurrentLang();
            const fields = document.getElementById('resultFields');
            fields.innerHTML = '';

            currentTests.forEach(t => {
                const r = entry.results[t.code];
                if (!r || !r.requested) return;

                const name = lang === 'fr' ? t.name_fr : t.name_en;
                const currentVal = r.result_value || '';

                let inputHtml = '';
                if (t.result_type === 'POSITIVE_NEGATIVE') {
                    inputHtml = `
                    <div class="posneg-btns">
                        <button type="button" class="posneg-btn pos ${currentVal === 'POS' ? 'selected' : ''}"
                            onclick="selectPosNeg(this, '${t.code}', 'POS')">POS</button>
                        <button type="button" class="posneg-btn neg ${currentVal === 'NEG' ? 'selected' : ''}"
                            onclick="selectPosNeg(this, '${t.code}', 'NEG')">NEG</button>
                    </div>`;
                } else if (t.result_type === 'BLOOD_GROUP') {
                    inputHtml = `<div class="bg-btns">
                        ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg =>
                            `<button type="button" class="bg-btn ${currentVal === bg ? 'selected' : ''}"
                                onclick="selectBG(this, '${t.code}', '${bg}')">${bg}</button>`
                        ).join('')}
                    </div>`;
                } else if (t.result_type === 'NUMERIC') {
                    inputHtml = `
                    <div class="result-numeric">
                        <input type="number" step="any" value="${currentVal}" data-code="${t.code}" class="result-input">
                        <span class="result-unit">${t.unit || ''}</span>
                    </div>`;
                } else {
                    inputHtml = `<input type="text" value="${currentVal}" data-code="${t.code}" class="result-text-input result-input">`;
                }

                const item = document.createElement('div');
                item.className = 'result-item';
                item.innerHTML = `<div class="result-item-name">${name}</div>${inputHtml}`;
                fields.appendChild(item);
            });

            document.getElementById('resultModal').style.display = 'flex';
        });
}

function selectPosNeg(btn, code, value) {
    const container = btn.parentElement;
    container.querySelectorAll('.posneg-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    btn.dataset.code = code;
    btn.dataset.value = value;
}

function selectBG(btn, code, value) {
    const container = btn.parentElement;
    container.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    btn.dataset.code = code;
    btn.dataset.value = value;
}

function saveResults() {
    const payload = {};

    // Collect POS/NEG selections
    document.querySelectorAll('.posneg-btn.selected').forEach(btn => {
        if (btn.dataset.code) payload[btn.dataset.code] = { result_value: btn.dataset.value };
    });

    // Collect blood group selections
    document.querySelectorAll('.bg-btn.selected').forEach(btn => {
        if (btn.dataset.code) payload[btn.dataset.code] = { result_value: btn.dataset.value };
    });

    // Collect numeric and text inputs
    document.querySelectorAll('.result-input').forEach(input => {
        const code = input.dataset.code;
        if (code && input.value.trim()) {
            payload[code] = { result_value: input.value.trim() };
        }
    });

    fetch(`/api/register/entries/${currentEntryId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(r => {
        if (r.ok) {
            closeResultModal();
            showSuccess(getCurrentLang() === 'fr' ? 'Sauvegarde' : 'Saved');
            loadEntries();
        }
    });
}

function closeResultModal() {
    document.getElementById('resultModal').style.display = 'none';
}

// ===== BUTTON GROUP HANDLERS =====

function setupButtonGroups() {
    // Sex buttons
    document.querySelectorAll('.sex-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sex-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wizardData.sex = btn.dataset.sex;
        });
    });

    // Age unit buttons
    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wizardData.age_unit = btn.dataset.unit;
        });
    });

    // Ward buttons
    document.querySelectorAll('.ward-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ward-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wizardData.ward = btn.dataset.ward;
        });
    });

    // Patient autocomplete
    const nameInput = document.getElementById('wPatientName');
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => searchPatients(e.target.value), 300);
        });
    }
}

function searchPatients(query) {
    const container = document.getElementById('wSuggestions');
    if (query.length < 2) { container.innerHTML = ''; return; }

    fetch(`/api/patients/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(patients => {
            container.innerHTML = '';
            patients.forEach(p => {
                const div = document.createElement('div');
                div.textContent = `${p.patient_name} (${p.sex || '?'}, ${p.age || '?'}) - ${p.ward || ''}`;
                div.onclick = () => {
                    document.getElementById('wPatientName').value = p.patient_name;
                    if (p.age) document.getElementById('wAge').value = p.age;
                    if (p.sex) {
                        document.querySelectorAll('.sex-btn').forEach(b => b.classList.remove('active'));
                        const btn = document.querySelector(`.sex-btn[data-sex="${p.sex}"]`);
                        if (btn) btn.classList.add('active');
                        wizardData.sex = p.sex;
                    }
                    if (p.ward) {
                        document.querySelectorAll('.ward-btn').forEach(b => b.classList.remove('active'));
                        const btn = document.querySelector(`.ward-btn[data-ward="${p.ward}"]`);
                        if (btn) btn.classList.add('active');
                        wizardData.ward = p.ward;
                    }
                    container.innerHTML = '';
                };
                container.appendChild(div);
            });
        });
}

function getCurrentLang() {
    return localStorage.getItem('lang') || 'en';
}
