/* Lab Register - Card/Workflow UX */

let currentTests = [];
let currentDate = new Date().toISOString().split('T')[0];
let wizardData = {};
let currentEntryId = null;
let currentEntryData = null;
let debounceTimer = null;
let isRegisterMode = false;
let isWorklistMode = false;
let worklistStatusFilter = '';

const URGENCY_WARDS = ['URGENCES', 'EMERGENCY', 'ER', 'URG'];

// ===== STRUCTURED TEST DEFINITIONS =====
const STRUCTURED_TESTS = {
    'CBC': {
        fields: [
            { key: 'WBC', label: 'WBC', type: 'numeric', unit: 'x10\u00b3/\u00b5L', panic_low: 2.0, panic_high: 30.0 },
            { key: 'PLT', label: 'PLT', type: 'numeric', unit: 'x10\u00b3/\u00b5L', panic_low: 50, panic_high: 600 },
            { key: 'HCT', label: 'HCT', type: 'numeric', unit: '%', panic_low: 15, panic_high: 55 }
        ]
    },
    'MAL_BS': {
        fields: [
            { key: 'species', label: 'Species', type: 'select', options: ['Negative', 'Pf', 'Pv', 'Pm', 'Po', 'Mixed'] },
            { key: 'density', label: 'Density', type: 'buttons', options: ['1+', '2+', '3+', '4+'], showIf: 'species', hideValue: 'Negative' }
        ]
    },
    'URINE': {
        fields: [
            { key: 'LEU', label: 'Leukocytes', type: 'buttons', options: ['NEG', 'TRACE', '+', '++', '+++'] },
            { key: 'NIT', label: 'Nitrites', type: 'buttons', options: ['NEG', '+'] },
            { key: 'PRO', label: 'Protein', type: 'buttons', options: ['NEG', 'TRACE', '+', '++', '+++'] },
            { key: 'BLD', label: 'Blood', type: 'buttons', options: ['NEG', 'TRACE', '+', '++', '+++'] },
            { key: 'GLU', label: 'Glucose', type: 'buttons', options: ['NEG', 'TRACE', '+', '++', '+++'] }
        ]
    }
};

// ===== SECURITY: HTML escaping =====
function esc(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

// ===== LANDING MODE =====

let errorTimer = null;

function showInputError(msg) {
    const input = document.getElementById('labNumberInput');
    input.value = msg;
    input.classList.add('error');
    input.setSelectionRange(0, 0);
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(clearInputError, 3000);
}

function clearInputError() {
    const input = document.getElementById('labNumberInput');
    if (input.classList.contains('error')) {
        input.value = '';
        input.classList.remove('error');
        input.focus();
    }
    if (errorTimer) { clearTimeout(errorTimer); errorTimer = null; }
    // Remove search results dropdown too
    const results = document.getElementById('landingResults');
    if (results) results.remove();
}

function isLabNumber(val) {
    // Matches patterns like LAB-2026-0042, TST-2026-0001, etc.
    return /^[A-Z]{2,5}-\d{4}-\d{3,5}$/i.test(val);
}

function lookupLabNumber() {
    const input = document.getElementById('labNumberInput');
    const val = input.value.trim();
    if (!val) return;

    if (isLabNumber(val)) {
        fetch(`/api/register/entries/lookup?lab_number=${encodeURIComponent(val)}`)
            .then(r => {
                if (r.ok) return r.json();
                throw new Error('not_found');
            })
            .then(data => {
                input.value = '';
                currentTests = data.tests || currentTests;
                openResultsDirect(data.entry);
            })
            .catch(() => {
                showInputError(`< ${val} not found >`);
            });
    } else {
        // Search by patient name or DOB
        searchFromLanding(val);
    }
}

function searchFromLanding(query) {
    fetch(`/api/patients/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(results => {
            showSearchResults(results, query);
        });
}

function showSearchResults(results, query) {
    let existing = document.getElementById('landingResults');
    if (existing) existing.remove();

    const list = document.createElement('div');
    list.id = 'landingResults';
    list.className = 'landing-results';

    if (results.length === 0) {
        showInputError(`< ${query} not found >`);
        return;
    }

    results.forEach(p => {
        const item = document.createElement('div');
        item.className = 'landing-result-item';

        const name = document.createElement('span');
        name.className = 'landing-result-name';
        name.textContent = p.name;
        item.appendChild(name);

        const addCol = (val) => {
            const col = document.createElement('span');
            col.className = 'landing-result-col';
            col.textContent = val || '';
            item.appendChild(col);
        };
        addCol(p.patient_number || '');
        addCol(p.sex || '');
        addCol(p.age ? p.age + (p.age_unit || 'Y') : '');
        addCol(p.date_of_birth || '');

        item.addEventListener('click', () => {
            list.remove();
            if (p.id) {
                // Open patient history — fetch lab entries for this patient
                openPatientFromLanding(p.id);
            }
        });
        list.appendChild(item);
    });

    // Insert after the input group
    const action = document.querySelector('.landing-action');
    const inputGroup = document.querySelector('.landing-input-group');
    inputGroup.parentNode.insertBefore(list, inputGroup.nextSibling);
}

function openPatientFromLanding(patientId) {
    const input = document.getElementById('labNumberInput');
    input.value = '';

    fetch(`/api/patients/${patientId}`)
        .then(r => r.json())
        .then(data => {
            if (data.lab_history && data.lab_history.length > 0) {
                // Open the most recent entry
                const latest = data.lab_history[0];
                // Fetch full entry with results via lookup
                fetch(`/api/register/entries/lookup?lab_number=${encodeURIComponent(latest.lab_number)}`)
                    .then(r => r.json())
                    .then(d => {
                        currentTests = d.tests || currentTests;
                        openResultsDirect(d.entry);
                    });
            } else {
                showInputError(`< ${data.name} — no records >`);
            }
        });
}

function openResultsDirect(entry) {
    currentEntryId = entry.id;
    currentEntryData = entry;
    openResults(entry.id, entry);
}

function enterRegisterMode() {
    isRegisterMode = true;
    isWorklistMode = false;
    document.getElementById('landingMode').style.display = 'none';
    document.getElementById('worklistMode').style.display = 'none';
    document.getElementById('registerMode').style.display = 'block';
    document.getElementById('btnNewEntry').style.display = 'flex';
    const nav = document.getElementById('appNav');
    const header = document.getElementById('appHeader');
    if (nav) nav.style.display = '';
    if (header) header.style.display = '';
    loadEntries();
}

// ===== WORKLIST MODE =====

function enterWorklist(level) {
    isWorklistMode = true;
    isRegisterMode = false;
    document.getElementById('landingMode').style.display = 'none';
    document.getElementById('worklistMode').style.display = 'block';
    document.getElementById('btnNewEntry').style.display = 'flex';
    const nav = document.getElementById('appNav');
    const header = document.getElementById('appHeader');
    if (nav) nav.style.display = '';
    if (header) header.style.display = '';

    // Show operator name
    const opEl = document.getElementById('worklistOperator');
    if (opEl && currentOperatorName) opEl.textContent = currentOperatorName;

    // Configure tabs based on level
    configureTabs(level);

    // Load entries for default tab
    const activeTab = document.querySelector('.wl-tab.active');
    if (activeTab) loadWorklistEntries(activeTab.dataset.status);
}

function configureTabs(level) {
    const tabs = document.querySelectorAll('.wl-tab');
    tabs.forEach(t => t.classList.remove('active'));

    if (level >= 2) {
        // Supervisor/admin: default to REVIEW
        const tab = document.querySelector('.wl-tab[data-status="REVIEW"]');
        if (tab) tab.classList.add('active');
    } else {
        // Labtech: default to REGISTERED (en attente)
        const tab = document.querySelector('.wl-tab[data-status="REGISTERED"]');
        if (tab) tab.classList.add('active');
    }
}

function loadWorklistEntries(statusFilter) {
    worklistStatusFilter = statusFilter;
    const url = statusFilter
        ? `/api/register/entries?date_from=2020-01-01&date_to=2099-12-31&status=${statusFilter}`
        : `/api/register/entries?date_from=2020-01-01&date_to=2099-12-31`;

    fetch(url)
        .then(r => r.json())
        .then(data => {
            currentTests = data.tests || currentTests;
            let entries = data.entries;

            // Sort: urgency wards first, then FIFO (oldest first)
            entries = sortByUrgency(entries);

            const container = document.getElementById('worklistCards');
            const empty = document.getElementById('worklistEmpty');
            const countEl = document.getElementById('worklistCount');
            container.innerHTML = '';

            countEl.textContent = entries.length + (getCurrentLang() === 'fr' ? ' échantillon(s)' : ' sample(s)');

            if (entries.length === 0) {
                empty.style.display = 'block';
                return;
            }
            empty.style.display = 'none';

            if (statusFilter === 'REVIEW' && currentLevel >= 2) {
                container.appendChild(buildReviewTable(entries));
            } else {
                entries.forEach(entry => {
                    container.appendChild(buildWorklistCard(entry));
                });
            }
        });
}

function sortByUrgency(entries) {
    return entries.sort((a, b) => {
        const aUrg = URGENCY_WARDS.includes((a.ward || '').toUpperCase()) ? 0 : 1;
        const bUrg = URGENCY_WARDS.includes((b.ward || '').toUpperCase()) ? 0 : 1;
        if (aUrg !== bUrg) return aUrg - bUrg;
        // FIFO: oldest first
        const aTime = a.reception_date + ' ' + (a.reception_time || '00:00');
        const bTime = b.reception_date + ' ' + (b.reception_time || '00:00');
        return aTime.localeCompare(bTime);
    });
}

function buildWorklistCard(entry) {
    const card = buildCard(entry);

    // Add TAT indicator
    const tat = computeTAT(entry);
    const tatEl = document.createElement('span');
    tatEl.className = 'card-tat tat-' + tat.color;
    tatEl.textContent = tat.label;

    const top = card.querySelector('.card-top');
    if (top) top.appendChild(tatEl);

    return card;
}

function computeTAT(entry) {
    const timeStr = entry.reception_date + 'T' + (entry.reception_time || '00:00') + ':00';
    const then = new Date(timeStr);
    const now = new Date();
    const diffMin = Math.floor((now - then) / 60000);

    if (diffMin < 0) return { label: '0min', color: 'green' };

    let label;
    if (diffMin < 60) {
        label = diffMin + 'min';
    } else {
        const h = Math.floor(diffMin / 60);
        const m = diffMin % 60;
        label = h + 'h' + String(m).padStart(2, '0');
    }

    let color;
    if (diffMin < 60) color = 'green';
    else if (diffMin < 120) color = 'orange';
    else color = 'red';

    return { label, color };
}

function refreshWorklist() {
    if (isWorklistMode) loadWorklistEntries(worklistStatusFilter);
    else if (isRegisterMode) loadEntries();
}

function loadDashboard() {
    // Fetch stats
    fetch('/api/register/entries/stats')
        .then(r => r.json())
        .then(stats => {
            document.querySelector('#statReview .stat-count').textContent = stats.REVIEW || 0;
            document.querySelector('#statPending .stat-count').textContent = (stats.REGISTERED || 0) + (stats.IN_PROGRESS || 0);
            document.querySelector('#statRejected .stat-count').textContent = stats.REJECTED || 0;
            document.querySelector('#statCompleted .stat-count').textContent = stats.COMPLETED || 0;
        });

    // Load cards for active filter
    const active = document.querySelector('.stat-card.active');
    if (active) loadDashboardCards(active.dataset.status);
}

function loadDashboardCards(statusFilter) {
    fetch(`/api/register/entries?date_from=2020-01-01&date_to=2099-12-31&status=${statusFilter}`)
        .then(r => r.json())
        .then(data => {
            currentTests = data.tests || currentTests;
            const container = document.getElementById('dashboardCards');
            container.innerHTML = '';
            if (data.entries.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:32px;color:#999">No entries</div>';
                return;
            }
            if (statusFilter === 'REVIEW') {
                container.appendChild(buildReviewTable(data.entries));
            } else {
                data.entries.forEach(entry => {
                    container.appendChild(buildCard(entry));
                });
            }
        });
}

function buildReviewTable(entries) {
    const table = document.createElement('table');
    table.className = 'review-table';

    const thead = document.createElement('thead');
    const hrow = document.createElement('tr');
    ['#', 'Patient', 'Spec', 'Results', 'By', 'TAT', 'History', ''].forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    entries.forEach(entry => {
        const tr = document.createElement('tr');

        // Lab #
        const tdLab = document.createElement('td');
        tdLab.className = 'rv-lab';
        tdLab.textContent = entry.lab_number.split('-').pop();
        tr.appendChild(tdLab);

        // Patient
        const tdPatient = document.createElement('td');
        tdPatient.className = 'rv-patient';
        const nameSpan = document.createElement('div');
        nameSpan.className = 'rv-patient-name';
        nameSpan.textContent = entry.patient_name;
        tdPatient.appendChild(nameSpan);
        const metaSpan = document.createElement('div');
        metaSpan.className = 'rv-patient-meta';
        const age = entry.age ? `${entry.age}${entry.age_unit || 'Y'}` : '';
        metaSpan.textContent = [age, entry.sex, entry.ward].filter(Boolean).join(' · ');
        tdPatient.appendChild(metaSpan);
        tr.appendChild(tdPatient);

        // Specimen
        const tdSpec = document.createElement('td');
        tdSpec.className = 'rv-spec';
        if (entry.specimen_type) {
            const specBadge = document.createElement('span');
            specBadge.className = `rv-spec-badge specimen-${entry.specimen_type.toLowerCase()}`;
            specBadge.textContent = entry.specimen_type;
            tdSpec.appendChild(specBadge);
        }
        tr.appendChild(tdSpec);

        // Results (panic flags added async after context loads)
        const tdResults = document.createElement('td');
        tdResults.className = 'rv-results';
        currentTests.forEach(t => {
            const r = entry.results[t.code];
            if (!r || !r.requested || !r.result_value) return;
            const badge = document.createElement('span');
            badge.className = 'rv-result-badge';
            badge.dataset.code = t.code;
            badge.dataset.value = r.result_value;
            const displayVal = STRUCTURED_TESTS[t.code]
                ? formatStructuredBadge(t.code, r.result_value) : r.result_value;
            badge.textContent = t.code + ': ' + displayVal;
            if (r.result_value === 'POS') badge.classList.add('rv-pos');
            tdResults.appendChild(badge);
        });
        tr.appendChild(tdResults);

        // By, TAT, History — filled async
        const tdBy = document.createElement('td');
        tdBy.className = 'rv-by';
        const tdTat = document.createElement('td');
        tdTat.className = 'rv-tat';
        const tdHist = document.createElement('td');
        tdHist.className = 'rv-history';

        fetch(`/api/register/entries/${entry.id}/context`)
            .then(r => r.json())
            .then(ctx => {
                tdBy.textContent = ctx.entered_by ? ctx.entered_by.replace('Tech. ', '').replace('Sup. ', '') : '—';
                tdTat.textContent = ctx.turnaround || '—';

                // Panic flags
                if (ctx.panic_thresholds) {
                    tdResults.querySelectorAll('.rv-result-badge').forEach(badge => {
                        const code = badge.dataset.code;
                        const val = badge.dataset.value;
                        const thresh = ctx.panic_thresholds[code];
                        if (!thresh) return;
                        // For structured tests, check sub-values
                        if (STRUCTURED_TESTS[code]) {
                            try {
                                const parsed = JSON.parse(val);
                                // Check each numeric sub-field
                                const struct = STRUCTURED_TESTS[code];
                                let hasPanic = false;
                                struct.fields.forEach(f => {
                                    if (f.type === 'numeric' && parsed[f.key]) {
                                        const v = parseFloat(parsed[f.key]);
                                        if ((f.panic_low != null && v < f.panic_low) || (f.panic_high != null && v > f.panic_high)) {
                                            hasPanic = true;
                                        }
                                    }
                                });
                                if (hasPanic) badge.classList.add('rv-panic');
                            } catch(e) {}
                        } else {
                            const numVal = parseFloat(val);
                            if (!isNaN(numVal)) {
                                if ((thresh.low != null && numVal < thresh.low) || (thresh.high != null && numVal > thresh.high)) {
                                    badge.classList.add('rv-panic');
                                }
                            }
                        }
                    });
                }

                // History
                if (ctx.history && ctx.history.length > 0) {
                    ctx.history.slice(0, 2).forEach(h => {
                        const row = document.createElement('div');
                        row.className = 'rv-hist-row';
                        const summary = (h.results_summary || '').split(', ').map(s => {
                            const parts = s.split(':');
                            if (parts.length < 2 || parts[1].startsWith('{')) return parts[0];
                            return parts[0] + ':' + parts[1];
                        }).filter(Boolean).join(' ');
                        row.textContent = h.reception_date.slice(5) + ' ' + summary;
                        tdHist.appendChild(row);
                    });
                } else {
                    tdHist.textContent = '—';
                }
            });
        tr.appendChild(tdBy);
        tr.appendChild(tdTat);
        tr.appendChild(tdHist);

        // Actions
        const tdActions = document.createElement('td');
        tdActions.className = 'rv-actions';
        const vBtn = document.createElement('button');
        vBtn.className = 'rv-validate';
        vBtn.textContent = 'Validate';
        vBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            executeValidate(entry.id);
        });
        tdActions.appendChild(vBtn);
        tr.appendChild(tdActions);

        tr.addEventListener('click', () => openResults(entry.id));
        tr.style.cursor = 'pointer';

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
}

function showFullRegister() {
    document.getElementById('dashboardMode').style.display = 'none';
    document.getElementById('registerMode').style.display = 'block';
    loadEntries();
}

document.addEventListener('DOMContentLoaded', () => {
    // Load tests (but NOT entries — landing mode shows nothing)
    fetch('/api/config/tests').then(r => r.json()).then(tests => {
        currentTests = tests.filter(t => t.is_active);
        updateDateDisplay();
    });

    // Landing mode buttons
    document.getElementById('btnNewSample').addEventListener('click', startNewEntry);
    document.getElementById('btnLookup').addEventListener('click', lookupLabNumber);
    const labInput = document.getElementById('labNumberInput');
    labInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); lookupLabNumber(); }
        else { clearInputError(); }
    });
    labInput.addEventListener('focus', clearInputError);
    document.getElementById('landingUnlockBtn').addEventListener('click', () => {
        if (typeof unlockNav === 'function') unlockNav();
    });

    // Register mode buttons
    document.getElementById('btnPrevDay').addEventListener('click', () => changeDay(-1));
    document.getElementById('btnNextDay').addEventListener('click', () => changeDay(1));
    document.getElementById('btnNewEntry').addEventListener('click', startNewEntry);
    document.getElementById('btnCollectionNow').addEventListener('click', setCollectionTimeNow);
    document.getElementById('btnStep1Next').addEventListener('click', () => goStep(2));
    document.getElementById('btnStep2Back').addEventListener('click', () => goStep(1));
    document.getElementById('btnStep2Next').addEventListener('click', () => goStep(3));
    document.getElementById('btnStep3Back').addEventListener('click', () => goStep(2));
    document.getElementById('btnSubmitEntry').addEventListener('click', submitEntry);
    document.getElementById('btnCloseResult').addEventListener('click', closeResultModal);
    document.getElementById('btnCloseResultFooter').addEventListener('click', closeResultModal);
    document.getElementById('btnSaveResults').addEventListener('click', saveResults);
    document.getElementById('btnStartReject').addEventListener('click', startRejectFlow);
    document.getElementById('btnClearPatient').addEventListener('click', clearPatientSelection);

    // All close-wizard buttons
    document.querySelectorAll('.btn-close-wizard').forEach(btn => {
        btn.addEventListener('click', closeWizard);
    });

    // Button group handlers
    setupButtonGroups();

    // Worklist tabs
    document.querySelectorAll('.wl-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.wl-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadWorklistEntries(tab.dataset.status);
        });
    });
    document.getElementById('btnShowAll').addEventListener('click', () => {
        document.getElementById('worklistMode').style.display = 'none';
        enterRegisterMode();
    });

    // Listen for nav unlock to switch to worklist
    document.addEventListener('navUnlocked', e => {
        if (e.detail.level >= 1) enterWorklist(e.detail.level);
    });
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

    list.innerHTML = '';
    entries.forEach(entry => {
        list.appendChild(buildCard(entry));
    });
}

function buildCard(entry) {
    const card = document.createElement('div');
    card.className = `sample-card status-${entry.status.toLowerCase()}`;
    card.addEventListener('click', () => openResults(entry.id));

    const top = document.createElement('div');
    top.className = 'card-top';
    const labNum = document.createElement('span');
    labNum.className = 'card-lab-number';
    labNum.textContent = entry.lab_number;
    const statusSpan = document.createElement('span');
    statusSpan.className = `card-status ${entry.status.toLowerCase()}`;
    statusSpan.textContent = entry.status.toLowerCase().replace('_', ' ');
    top.appendChild(labNum);
    top.appendChild(statusSpan);
    card.appendChild(top);

    const patient = document.createElement('div');
    patient.className = 'card-patient';
    if (entry.status === 'REJECTED') patient.className += ' rejected-text';
    patient.textContent = entry.patient_name;
    card.appendChild(patient);

    const age = entry.age ? `${entry.age}${entry.age_unit || 'Y'}` : '';
    const details = [age, entry.sex, entry.ward].filter(Boolean).join(' \u00b7 ');
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'card-details';
    detailsDiv.textContent = details;

    if (entry.specimen_type && entry.specimen_type !== 'BLOOD') {
        const specBadge = document.createElement('span');
        specBadge.className = `specimen-badge specimen-${entry.specimen_type.toLowerCase()}`;
        specBadge.textContent = entry.specimen_type;
        detailsDiv.appendChild(document.createTextNode(' '));
        detailsDiv.appendChild(specBadge);
    }
    card.appendChild(detailsDiv);

    if (entry.status === 'REJECTED' && entry.rejection_reason) {
        const rejBadge = document.createElement('span');
        rejBadge.className = 'rejection-badge';
        rejBadge.textContent = entry.rejection_reason.replace(/_/g, ' ');
        card.appendChild(rejBadge);
    }

    const testsDiv = document.createElement('div');
    testsDiv.className = 'card-tests';
    currentTests.forEach(t => {
        const r = entry.results[t.code];
        if (!r || !r.requested) return;
        const badge = document.createElement('span');
        let cls = 'card-test-badge';
        if (r.result_value) {
            const v = r.result_value.toUpperCase();
            if (v === 'POS' || v === 'POSITIVE' || v === '+') cls += ' result-positive';
            else cls += ' has-result';
        }
        if (r.panic_acknowledged) cls += ' panic-flagged';
        badge.className = cls;
        badge.title = t.name_en;
        const displayVal = r.result_value && STRUCTURED_TESTS[t.code]
            ? formatStructuredBadge(t.code, r.result_value) : r.result_value;
        badge.textContent = t.code + (displayVal ? ': ' + displayVal : '');
        testsDiv.appendChild(badge);
    });
    card.appendChild(testsDiv);

    return card;
}

// ===== WIZARD: NEW ENTRY =====

function startNewEntry() {
    wizardData = { age_unit: 'Y', patient_fk: null };
    document.getElementById('wPatientName').value = '';
    document.getElementById('wAge').value = '';
    document.getElementById('wCollectionTime').value = '';
    document.querySelectorAll('.sex-btn, .ward-btn, .unit-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.unit-btn[data-unit="Y"]').classList.add('active');
    clearPatientSelection();

    buildTestSelection();

    document.getElementById('wizardModal').style.display = 'flex';
    goStep(1);
    setTimeout(() => document.getElementById('wPatientName').focus(), 300);
}

function selectPatient(patient) {
    wizardData.patient_fk = patient.id;
    wizardData.patient_name = patient.name;
    wizardData.age = patient.age;
    wizardData.age_unit = patient.age_unit || 'Y';
    wizardData.sex = patient.sex;

    // Show banner
    const banner = document.getElementById('patientSelected');
    document.getElementById('patientSelectedInfo').textContent =
        (patient.patient_number || '') + ' \u00b7 ' + patient.name +
        (patient.age ? ' \u00b7 ' + patient.age + (patient.age_unit || 'Y') : '') +
        (patient.sex ? ' \u00b7 ' + patient.sex : '');
    banner.style.display = 'flex';

    // Hide name field, fill demographics
    document.getElementById('patientNameField').style.display = 'none';
    document.getElementById('wSuggestions').innerHTML = '';
    if (patient.age) document.getElementById('wAge').value = patient.age;
    if (patient.age_unit) {
        document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        const ub = document.querySelector('.unit-btn[data-unit="' + patient.age_unit + '"]');
        if (ub) ub.classList.add('active');
    }
    if (patient.sex) {
        document.querySelectorAll('.sex-btn').forEach(b => b.classList.remove('active'));
        const sb = document.querySelector('.sex-btn[data-sex="' + patient.sex + '"]');
        if (sb) sb.classList.add('active');
        wizardData.sex = patient.sex;
    }
}

function clearPatientSelection() {
    wizardData.patient_fk = null;
    document.getElementById('patientSelected').style.display = 'none';
    document.getElementById('patientNameField').style.display = 'block';
    document.getElementById('wPatientName').value = '';
    document.getElementById('wAge').value = '';
    document.querySelectorAll('.sex-btn').forEach(b => b.classList.remove('active'));
}

function closeWizard() {
    document.getElementById('wizardModal').style.display = 'none';
}

function goStep(n) {
    [1, 2, 3].forEach(i => {
        document.getElementById(`step${i}`).style.display = i === n ? 'flex' : 'none';
    });
    if (n === 3) buildConfirmSummary();
}

function setCollectionTimeNow() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('wCollectionTime').value = `${hh}:${mm}`;
}

function buildTestSelection() {
    const container = document.getElementById('testCategories');
    const lang = getCurrentLang();
    const categories = {};

    currentTests.forEach(t => {
        if (!categories[t.category]) categories[t.category] = [];
        categories[t.category].push(t);
    });

    container.innerHTML = '';
    Object.entries(categories).forEach(([cat, tests]) => {
        const label = document.createElement('div');
        label.className = 'test-cat-label';
        label.textContent = cat;
        container.appendChild(label);

        const btnsDiv = document.createElement('div');
        btnsDiv.className = 'test-btns';
        tests.forEach(t => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'test-btn';
            btn.dataset.code = t.code;
            btn.textContent = lang === 'fr' ? t.name_fr : t.name_en;
            btn.addEventListener('click', () => btn.classList.toggle('selected'));
            btnsDiv.appendChild(btn);
        });
        container.appendChild(btnsDiv);
    });
}

// ===== SPECIMEN TYPE AUTO-DETECTION =====

function detectSpecimenType(testCodes) {
    const types = new Set();
    testCodes.forEach(code => {
        const test = currentTests.find(t => t.code === code);
        if (test && test.specimen_types) {
            try {
                const st = typeof test.specimen_types === 'string'
                    ? JSON.parse(test.specimen_types) : test.specimen_types;
                st.forEach(s => types.add(s));
            } catch (e) {
                types.add('BLOOD');
            }
        }
    });
    if (types.size === 0) return { auto: 'BLOOD', options: null };
    if (types.size === 1) return { auto: [...types][0], options: null };
    return { auto: null, options: [...types] };
}

function buildConfirmSummary() {
    wizardData.patient_name = document.getElementById('wPatientName').value;
    wizardData.age = document.getElementById('wAge').value || null;
    wizardData.collection_time = document.getElementById('wCollectionTime').value || null;
    const sexBtn = document.querySelector('.sex-btn.active');
    wizardData.sex = sexBtn ? sexBtn.dataset.sex : null;
    const wardBtn = document.querySelector('.ward-btn.active');
    wizardData.ward = wardBtn ? wardBtn.dataset.ward : null;

    wizardData.requested_tests = [];
    document.querySelectorAll('.test-btn.selected').forEach(b => {
        wizardData.requested_tests.push(b.dataset.code);
    });

    const specimen = detectSpecimenType(wizardData.requested_tests);
    if (specimen.auto) {
        wizardData.specimen_type = specimen.auto;
    }

    const lang = getCurrentLang();
    const testNames = wizardData.requested_tests.map(code => {
        const t = currentTests.find(t => t.code === code);
        return t ? (lang === 'fr' ? t.name_fr : t.name_en) : code;
    });

    // Build confirm summary with DOM API
    const summary = document.getElementById('confirmSummary');
    summary.innerHTML = '';

    const rows = [
        ['Patient', wizardData.patient_name || '-'],
        ['Age', wizardData.age ? wizardData.age + wizardData.age_unit : '-'],
        ['Sex', wizardData.sex || '-'],
        ['Ward', wizardData.ward || '-'],
    ];
    if (wizardData.collection_time) {
        rows.push(['Collection Time', wizardData.collection_time]);
    }

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
        summary.appendChild(row);
    });

    // Specimen type
    if (specimen.options) {
        const specRow = document.createElement('div');
        specRow.className = 'confirm-row';
        const specLabel = document.createElement('span');
        specLabel.className = 'confirm-label';
        specLabel.textContent = 'Specimen Type';
        specRow.appendChild(specLabel);
        summary.appendChild(specRow);

        const specBtns = document.createElement('div');
        specBtns.className = 'specimen-btns';
        specimen.options.forEach(s => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'specimen-btn' + (wizardData.specimen_type === s ? ' active' : '');
            btn.textContent = s;
            btn.addEventListener('click', () => {
                specBtns.querySelectorAll('.specimen-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                wizardData.specimen_type = s;
            });
            specBtns.appendChild(btn);
        });
        summary.appendChild(specBtns);
    } else {
        const specRow = document.createElement('div');
        specRow.className = 'confirm-row';
        const specLabel = document.createElement('span');
        specLabel.className = 'confirm-label';
        specLabel.textContent = 'Specimen';
        const specVal = document.createElement('span');
        specVal.className = `confirm-value specimen-badge specimen-${(wizardData.specimen_type || 'blood').toLowerCase()}`;
        specVal.textContent = wizardData.specimen_type || 'BLOOD';
        specRow.appendChild(specLabel);
        specRow.appendChild(specVal);
        summary.appendChild(specRow);
    }

    // Tests count
    const testRow = document.createElement('div');
    testRow.className = 'confirm-row';
    const testLabel = document.createElement('span');
    testLabel.className = 'confirm-label';
    testLabel.textContent = `Tests (${testNames.length})`;
    testRow.appendChild(testLabel);
    summary.appendChild(testRow);

    const testTags = document.createElement('div');
    testTags.className = 'confirm-tests';
    testNames.forEach(name => {
        const tag = document.createElement('span');
        tag.className = 'confirm-test-tag';
        tag.textContent = name;
        testTags.appendChild(tag);
    });
    summary.appendChild(testTags);
}

function submitEntry() {
    const patientName = (wizardData.patient_name || document.getElementById('wPatientName').value || '').trim();
    if (!patientName) {
        goStep(1);
        document.getElementById('wPatientName').focus();
        showModal({ title: 'Required', message: 'Patient name is required.', type: 'warning' });
        return;
    }

    const doSubmit = (patientFk) => {
        const payload = {
            patient_name: patientName,
            age: wizardData.age ? parseInt(wizardData.age) : null,
            age_unit: wizardData.age_unit,
            sex: wizardData.sex,
            ward: wizardData.ward,
            collection_time: wizardData.collection_time,
            specimen_type: wizardData.specimen_type || 'BLOOD',
            requested_tests: wizardData.requested_tests,
            patient_fk: patientFk
        };

        authFetch('/api/register/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(r => r.json())
        .then(entry => {
            closeWizard();
            showSuccess(entry.lab_number);
            if (isWorklistMode) loadWorklistEntries(worklistStatusFilter);
            else if (isRegisterMode) loadEntries();
            else setTimeout(refocusLanding, 2100);
        });
    };

    if (wizardData.patient_fk) {
        // Existing patient selected
        doSubmit(wizardData.patient_fk);
    } else {
        // New patient — create record first, then submit entry
        authFetch('/api/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: patientName,
                age: wizardData.age ? parseInt(wizardData.age) : null,
                age_unit: wizardData.age_unit,
                sex: wizardData.sex
            })
        })
        .then(r => r.json())
        .then(patient => {
            doSubmit(patient.id);
        });
    }
}

function showSuccess(labNumber, color) {
    const overlay = document.getElementById('successOverlay');
    document.getElementById('successLabNumber').textContent = labNumber;
    overlay.style.background = color || '';
    overlay.style.display = 'flex';
    setTimeout(() => { overlay.style.display = 'none'; overlay.style.background = ''; }, 2000);
}

// ===== STRUCTURED TEST HELPERS =====

function parseStructuredValue(val) {
    if (!val) return {};
    try { return JSON.parse(val); } catch (e) { return {}; }
}

function formatStructuredBadge(code, val) {
    let parsed;
    try { parsed = JSON.parse(val); } catch (e) { return val; } // Legacy plain text
    if (!parsed || typeof parsed !== 'object') return val;

    if (code === 'CBC') {
        const parts = [];
        if (parsed.WBC) parts.push('WBC:' + parsed.WBC);
        if (parsed.PLT) parts.push('PLT:' + parsed.PLT);
        if (parsed.HCT) parts.push('HCT:' + parsed.HCT);
        return parts.join(' ') || val;
    }
    if (code === 'MAL_BS') {
        if (parsed.species === 'Negative') return 'Neg';
        return [parsed.species, parsed.density].filter(Boolean).join(' ') || val;
    }
    if (code === 'URINE') {
        const abnormal = [];
        for (const [k, v] of Object.entries(parsed)) {
            if (v && v !== 'NEG') abnormal.push(k + v);
        }
        return abnormal.length > 0 ? abnormal.join(' ') : 'Normal';
    }
    return val;
}

function isJsonObject(val) {
    if (!val) return false;
    try { const p = JSON.parse(val); return typeof p === 'object' && p !== null; } catch (e) { return false; }
}

function renderStructuredField(item, test, currentVal, isRejected) {
    const struct = STRUCTURED_TESTS[test.code];
    const isLegacy = currentVal && !isJsonObject(currentVal);
    const parsed = isLegacy ? {} : parseStructuredValue(currentVal);

    if (isLegacy && !isRejected) {
        const note = document.createElement('div');
        note.className = 'legacy-note';
        note.textContent = 'Previous: ' + currentVal;
        item.appendChild(note);
    }

    const container = document.createElement('div');
    container.className = 'structured-fields';
    container.dataset.code = test.code;

    struct.fields.forEach(field => {
        const row = document.createElement('div');
        row.className = 'sub-field-row';
        row.dataset.key = field.key;

        // Conditional visibility (MAL_BS density hidden if species=Negative)
        if (field.showIf) {
            row.dataset.showIf = field.showIf;
            row.dataset.hideValue = field.hideValue || '';
            const parentVal = parsed ? parsed[field.showIf] : null;
            if (parentVal === field.hideValue || !parentVal) {
                row.style.display = 'none';
            }
        }

        const label = document.createElement('div');
        label.className = 'sub-field-label';
        label.textContent = field.label;
        row.appendChild(label);

        const savedVal = parsed ? (parsed[field.key] || '') : '';

        if (isRejected) {
            const ro = document.createElement('div');
            ro.className = 'result-readonly';
            ro.textContent = savedVal || '\u2014';
            row.appendChild(ro);
        } else if (field.type === 'numeric') {
            const numRow = document.createElement('div');
            numRow.className = 'result-numeric';
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.value = savedVal;
            input.dataset.subKey = field.key;
            input.className = 'result-input sub-numeric-input';
            input.addEventListener('input', () => checkSubPanic(input, field));
            numRow.appendChild(input);
            const unit = document.createElement('span');
            unit.className = 'result-unit';
            unit.textContent = field.unit || '';
            numRow.appendChild(unit);
            row.appendChild(numRow);

            const warning = document.createElement('div');
            warning.className = 'panic-warning';
            warning.style.display = 'none';
            warning.textContent = 'CRITICAL VALUE - verify result';
            row.appendChild(warning);

            if (savedVal) checkSubPanic(input, field);
        } else if (field.type === 'buttons') {
            const btns = document.createElement('div');
            btns.className = 'sub-field-btns';
            field.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'sub-btn' + (savedVal === opt ? ' selected' : '');
                btn.textContent = opt;
                btn.dataset.subKey = field.key;
                btn.dataset.value = opt;
                btn.addEventListener('click', () => {
                    btns.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                });
                btns.appendChild(btn);
            });
            row.appendChild(btns);
        } else if (field.type === 'select') {
            const btns = document.createElement('div');
            btns.className = 'sub-field-btns sub-select-btns';
            field.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'sub-btn' + (savedVal === opt ? ' selected' : '');
                if (opt === 'Negative') btn.className += ' sub-btn-neg';
                btn.textContent = opt;
                btn.dataset.subKey = field.key;
                btn.dataset.value = opt;
                btn.addEventListener('click', () => {
                    btns.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    // Handle conditional fields (show/hide density based on species)
                    updateConditionalFields(container, field.key, opt);
                });
                btns.appendChild(btn);
            });
            row.appendChild(btns);
        }

        container.appendChild(row);
    });

    item.appendChild(container);
}

function updateConditionalFields(container, changedKey, changedValue) {
    container.querySelectorAll('.sub-field-row[data-show-if]').forEach(row => {
        if (row.dataset.showIf === changedKey) {
            row.style.display = changedValue === row.dataset.hideValue ? 'none' : 'block';
        }
    });
}

function checkSubPanic(input, field) {
    const val = parseFloat(input.value);
    const warning = input.closest('.sub-field-row').querySelector('.panic-warning');
    const container = input.closest('.result-numeric');

    if (isNaN(val) || input.value === '') {
        container.classList.remove('panic');
        if (warning) warning.style.display = 'none';
        updateSaveButton();
        return;
    }

    let isPanic = false;
    if (field.panic_low != null && val < field.panic_low) isPanic = true;
    if (field.panic_high != null && val > field.panic_high) isPanic = true;

    if (isPanic) {
        container.classList.add('panic');
        if (warning) warning.style.display = 'block';
    } else {
        container.classList.remove('panic');
        if (warning) warning.style.display = 'none';
    }
    updateSaveButton();
}

function collectStructuredResult(code) {
    const container = document.querySelector(`.structured-fields[data-code="${code}"]`);
    if (!container) return null;

    const result = {};
    const struct = STRUCTURED_TESTS[code];

    struct.fields.forEach(field => {
        const row = container.querySelector(`.sub-field-row[data-key="${field.key}"]`);
        if (!row) return;

        if (field.type === 'numeric') {
            const input = row.querySelector('.sub-numeric-input');
            if (input && input.value.trim()) result[field.key] = input.value.trim();
        } else if (field.type === 'buttons' || field.type === 'select') {
            const selected = row.querySelector('.sub-btn.selected');
            if (selected) result[field.key] = selected.dataset.value;
        }
    });

    return Object.keys(result).length > 0 ? JSON.stringify(result) : null;
}

// ===== RESULT ENTRY =====

function openResults(entryId, prefetchedEntry) {
    currentEntryId = entryId;

    const render = (entry) => {
            currentEntryData = entry;

            document.getElementById('resultPatientName').textContent =
                `${entry.lab_number} · ${entry.patient_name}`;

            const isRejected = entry.status === 'REJECTED';
            const isReview = entry.status === 'REVIEW';
            const isReadOnly = isRejected || isReview;
            const banner = document.getElementById('rejectionBanner');
            const resultFooter = document.getElementById('resultFooter');
            const rejectFooter = document.getElementById('rejectFooter');

            if (isRejected) {
                banner.textContent = `REJECTED: ${(entry.rejection_reason || 'No reason').replace(/_/g, ' ')}`;
                banner.style.display = 'block';
                resultFooter.style.display = 'none';
                rejectFooter.style.display = 'flex';
                rejectFooter.innerHTML = '';
                const unrejectBtn = document.createElement('button');
                unrejectBtn.className = 'wiz-btn unreject-btn';
                unrejectBtn.textContent = 'Undo Rejection';
                unrejectBtn.addEventListener('click', () => executeUnreject(entry.id));
                rejectFooter.appendChild(unrejectBtn);
            } else if (isReview) {
                banner.textContent = 'REVIEW';
                banner.style.display = 'block';
                banner.style.background = 'var(--purple)';
                resultFooter.style.display = 'none';
                rejectFooter.style.display = 'flex';
                rejectFooter.innerHTML = '';
                rejectFooter.style.flexDirection = 'column';
                rejectFooter.style.alignItems = 'center';
                rejectFooter.style.gap = '8px';

                const validateBtn = document.createElement('button');
                validateBtn.className = 'wiz-btn validate-btn';
                validateBtn.textContent = 'Validate Results';
                validateBtn.style.width = '100%';
                validateBtn.addEventListener('click', () => executeValidate(entry.id));
                rejectFooter.appendChild(validateBtn);

                const rejectBtn = document.createElement('button');
                rejectBtn.className = 'reject-pill';
                rejectBtn.textContent = 'Reject sample';
                rejectBtn.addEventListener('click', () => startRejectFlow());
                rejectFooter.appendChild(rejectBtn);

                // Fetch validation context
                fetch(`/api/register/entries/${entry.id}/context`)
                    .then(r => r.json())
                    .then(ctx => {
                        const fields = document.getElementById('resultFields');
                        const ctxDiv = document.createElement('div');
                        ctxDiv.className = 'validation-context';

                        // Meta line: who, when, turnaround
                        const meta = document.createElement('div');
                        meta.className = 'ctx-meta';
                        const parts = [];
                        if (ctx.entered_by) parts.push(ctx.entered_by);
                        if (ctx.entered_at) parts.push(ctx.entered_at.split(' ')[1] || ctx.entered_at);
                        if (ctx.turnaround) parts.push('TAT ' + ctx.turnaround);
                        if (ctx.ward) parts.push(ctx.ward);
                        if (ctx.specimen_type) parts.push(ctx.specimen_type);
                        meta.textContent = parts.join('  ·  ');
                        ctxDiv.appendChild(meta);

                        // Patient history
                        if (ctx.history && ctx.history.length > 0) {
                            const histDiv = document.createElement('div');
                            histDiv.className = 'ctx-history';
                            const histTitle = document.createElement('div');
                            histTitle.className = 'ctx-history-title';
                            histTitle.textContent = 'Previous';
                            histDiv.appendChild(histTitle);

                            ctx.history.forEach(h => {
                                const row = document.createElement('div');
                                row.className = 'ctx-history-row';
                                const date = document.createElement('span');
                                date.className = 'ctx-history-date';
                                date.textContent = h.reception_date;
                                row.appendChild(date);
                                const results = document.createElement('span');
                                results.className = 'ctx-history-results';
                                results.textContent = (h.results_summary || '').replace(/:,/g, ': —,');
                                row.appendChild(results);
                                histDiv.appendChild(row);
                            });
                            ctxDiv.appendChild(histDiv);
                        }

                        fields.insertBefore(ctxDiv, fields.firstChild);
                    });
            } else {
                banner.style.display = 'none';
                banner.style.background = '';
                resultFooter.style.display = 'flex';
                rejectFooter.style.display = 'flex';
                resetSaveButton();
                const rejectBtn = document.getElementById('btnStartReject');
                if (rejectBtn) {
                    rejectBtn.replaceWith(rejectBtn.cloneNode(true));
                    document.getElementById('btnStartReject').addEventListener('click', startRejectFlow);
                }
            }

            const fields = document.getElementById('resultFields');
            fields.innerHTML = '';

            currentTests.forEach(t => {
                const r = entry.results[t.code];
                if (!r || !r.requested) return;

                const currentVal = r.result_value || '';

                const item = document.createElement('div');
                item.className = 'result-item';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'result-item-name';
                nameDiv.textContent = t.name_en;
                item.appendChild(nameDiv);

                if (isReadOnly) {
                    if (STRUCTURED_TESTS[t.code] && currentVal) {
                        const display = document.createElement('div');
                        display.className = 'result-readonly';
                        display.textContent = formatStructuredBadge(t.code, currentVal);
                        item.appendChild(display);
                    } else {
                        const readOnly = document.createElement('div');
                        readOnly.className = 'result-readonly';
                        readOnly.textContent = currentVal || '\u2014';
                        item.appendChild(readOnly);
                    }
                } else if (t.result_type === 'POSITIVE_NEGATIVE') {
                    const container = document.createElement('div');
                    container.className = 'posneg-btns';
                    ['POS', 'NEG'].forEach(val => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = `posneg-btn ${val.toLowerCase()} ${currentVal === val ? 'selected' : ''}`;
                        btn.textContent = val;
                        btn.dataset.code = t.code;
                        btn.dataset.value = val;
                        btn.addEventListener('click', () => selectPosNeg(btn, t.code, val));
                        container.appendChild(btn);
                    });
                    item.appendChild(container);
                } else if (t.result_type === 'BLOOD_GROUP') {
                    const container = document.createElement('div');
                    container.className = 'bg-btns';
                    ['A+','A-','B+','B-','AB+','AB-','O+','O-'].forEach(bg => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = `bg-btn ${currentVal === bg ? 'selected' : ''}`;
                        btn.textContent = bg;
                        btn.dataset.code = t.code;
                        btn.dataset.value = bg;
                        btn.addEventListener('click', () => selectBG(btn, t.code, bg));
                        container.appendChild(btn);
                    });
                    item.appendChild(container);
                } else if (t.result_type === 'NUMERIC') {
                    const container = document.createElement('div');
                    container.className = 'result-numeric';
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.step = 'any';
                    input.value = currentVal;
                    input.dataset.code = t.code;
                    input.className = 'result-input';
                    input.addEventListener('input', () => checkPanicValue(input, t));
                    container.appendChild(input);
                    const unit = document.createElement('span');
                    unit.className = 'result-unit';
                    unit.textContent = t.unit || '';
                    container.appendChild(unit);

                    const warning = document.createElement('div');
                    warning.className = 'panic-warning';
                    warning.style.display = 'none';
                    warning.textContent = 'CRITICAL VALUE - verify result';

                    item.appendChild(container);
                    item.appendChild(warning);

                    if (currentVal) checkPanicValue(input, t);
                } else if (STRUCTURED_TESTS[t.code]) {
                    renderStructuredField(item, t, currentVal, isRejected);
                } else {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = currentVal;
                    input.dataset.code = t.code;
                    input.className = 'result-text-input result-input';
                    item.appendChild(input);
                }

                fields.appendChild(item);
            });

            // History link
            const historyLink = document.createElement('div');
            historyLink.className = 'audit-history-link';
            const histBtn = document.createElement('button');
            histBtn.type = 'button';
            histBtn.className = 'history-btn';
            histBtn.textContent = 'History';
            histBtn.addEventListener('click', () => loadAuditTrail(entry.id));
            historyLink.appendChild(histBtn);
            fields.appendChild(historyLink);

            document.getElementById('resultModal').style.display = 'flex';
    };

    if (prefetchedEntry) {
        render(prefetchedEntry);
    } else {
        fetch(`/api/register/entries?date_from=2020-01-01&date_to=2099-12-31&search=`)
            .then(r => r.json())
            .then(data => {
                const entry = data.entries.find(e => e.id === entryId);
                if (entry) render(entry);
            });
    }
}

function loadAuditTrail(entryId) {
    fetch(`/api/register/entries/${entryId}/audit`)
        .then(r => r.json())
        .then(data => {
            const fields = document.getElementById('resultFields');
            fields.innerHTML = '';

            const integ = document.createElement('div');
            integ.className = data.integrity === true ? 'audit-integrity ok' : 'audit-integrity fail';
            integ.textContent = data.integrity === true ? 'Integrity: OK' :
                data.integrity === false ? 'Integrity: TAMPER DETECTED' : 'Integrity: No audit data';
            fields.appendChild(integ);

            if (data.trail.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'result-readonly';
                empty.textContent = 'No audit history (created before audit was enabled)';
                fields.appendChild(empty);
                return;
            }

            data.trail.forEach(log => {
                const row = document.createElement('div');
                row.className = 'audit-row';

                const time = document.createElement('span');
                time.className = 'audit-time';
                time.textContent = log.timestamp;
                row.appendChild(time);

                const action = document.createElement('span');
                action.className = 'audit-action audit-action-' + log.action.toLowerCase();
                action.textContent = log.action;
                row.appendChild(action);

                const detail = document.createElement('span');
                detail.className = 'audit-detail';
                if (log.field_name) {
                    const parts = [log.field_name + ':'];
                    if (log.old_value) parts.push(log.old_value + ' \u2192');
                    parts.push(log.new_value || '(empty)');
                    detail.textContent = parts.join(' ');
                }
                row.appendChild(detail);

                const op = document.createElement('span');
                op.className = 'audit-operator';
                op.textContent = log.operator;
                row.appendChild(op);

                fields.appendChild(row);
            });
        });
}

// ===== PANIC VALUE CHECKING =====

function checkPanicValue(input, test) {
    const val = parseFloat(input.value);
    const warning = input.closest('.result-item').querySelector('.panic-warning');
    const container = input.closest('.result-numeric');

    if (isNaN(val) || input.value === '') {
        container.classList.remove('panic');
        if (warning) warning.style.display = 'none';
        updateSaveButton();
        return;
    }

    const low = test.panic_low != null ? parseFloat(test.panic_low) : null;
    const high = test.panic_high != null ? parseFloat(test.panic_high) : null;
    let isPanic = false;

    if (low !== null && val < low) isPanic = true;
    if (high !== null && val > high) isPanic = true;

    if (isPanic) {
        container.classList.add('panic');
        if (warning) warning.style.display = 'block';
    } else {
        container.classList.remove('panic');
        if (warning) warning.style.display = 'none';
    }
    updateSaveButton();
}

function hasPanicValues() {
    return document.querySelectorAll('.result-numeric.panic').length > 0;
}

function updateSaveButton() {
    const btn = document.getElementById('btnSaveResults');
    if (!btn) return;

    if (hasPanicValues()) {
        btn.textContent = 'Confirm Critical Values';
        btn.className = 'wiz-btn wiz-btn-panic-confirm';
    } else {
        resetSaveButton();
    }
}

function resetSaveButton() {
    const btn = document.getElementById('btnSaveResults');
    if (!btn) return;
    btn.textContent = 'Save Results';
    btn.className = 'wiz-btn wiz-btn-confirm';
}

// ===== REJECTION FLOW =====

const REJECTION_REASONS = [
    'HEMOLYZED', 'CLOTTED', 'QNS',
    'UNLABELLED', 'WRONG_CONTAINER', 'INADEQUATE_VOLUME',
    'IMPROPER_SAMPLING', 'SAMPLE_TOO_OLD', 'IV_ACCESS_SITE'
];

function startRejectFlow() {
    const fields = document.getElementById('resultFields');
    const resultFooter = document.getElementById('resultFooter');
    const rejectFooter = document.getElementById('rejectFooter');

    fields.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'reject-title';
    title.textContent = 'Select rejection reason:';
    fields.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'reject-reasons';
    REJECTION_REASONS.forEach(reason => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'reject-reason-btn';
        btn.textContent = reason.replace(/_/g, ' ');
        btn.addEventListener('click', () => confirmReject(reason));
        grid.appendChild(btn);
    });
    fields.appendChild(grid);

    resultFooter.style.display = 'none';
    rejectFooter.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wiz-btn wiz-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', cancelReject);
    rejectFooter.appendChild(cancelBtn);
}

function confirmReject(reason) {
    const fields = document.getElementById('resultFields');
    const rejectFooter = document.getElementById('rejectFooter');

    const labNum = currentEntryData ? currentEntryData.lab_number : '';

    fields.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'reject-confirm-box';
    const icon = document.createElement('div');
    icon.className = 'reject-confirm-icon';
    icon.textContent = '!';
    const text = document.createElement('div');
    text.className = 'reject-confirm-text';
    text.innerHTML = '';
    text.appendChild(document.createTextNode('Reject '));
    const strong1 = document.createElement('strong');
    strong1.textContent = labNum;
    text.appendChild(strong1);
    text.appendChild(document.createTextNode(' as '));
    const strong2 = document.createElement('strong');
    strong2.textContent = reason.replace(/_/g, ' ');
    text.appendChild(strong2);
    text.appendChild(document.createTextNode('?'));
    box.appendChild(icon);
    box.appendChild(text);
    fields.appendChild(box);

    rejectFooter.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wiz-btn wiz-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', cancelReject);
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'wiz-btn wiz-btn-reject-confirm';
    confirmBtn.textContent = 'Confirm Rejection';
    confirmBtn.addEventListener('click', () => executeReject(reason));
    rejectFooter.appendChild(cancelBtn);
    rejectFooter.appendChild(confirmBtn);
}

function executeReject(reason) {
    authFetch(`/api/register/entries/${currentEntryId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason })
    }).then(r => {
        if (r.ok) {
            closeResultModal();
            showSuccess('REJECTED', 'var(--primary)');
            refreshWorklist();
        } else {
            r.json().then(d => showModal({ title: 'Error', message: d.error || 'Rejection failed', type: 'danger' }));
        }
    });
}

function executeValidate(entryId, bypassFourEyes) {
    const payload = bypassFourEyes ? { bypass_four_eyes: true } : {};
    authFetch(`/api/register/entries/${entryId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(r => {
        if (r.ok) {
            closeResultModal();
            showSuccess('Validated');
            refreshWorklist();
        } else {
            r.json().then(d => {
                if (d.four_eyes) {
                    showModal({
                        title: 'Four-Eyes Rule',
                        message: 'You are validating results you entered yourself.<br>This will be logged as a <b>non-conformity</b>.',
                        type: 'warning',
                        actions: [
                            { label: 'Go back', cls: 'cancel' },
                            { label: 'Override & validate', cls: 'danger', callback: () => executeValidate(entryId, true) }
                        ]
                    });
                } else {
                    showModal({ title: 'Error', message: d.error || 'Validation failed', type: 'danger' });
                }
            });
        }
    });
}

function executeUnreject(entryId) {
    authFetch(`/api/register/entries/${entryId}/unreject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).then(r => {
        if (r.ok) {
            closeResultModal();
            showSuccess('Restored');
            refreshWorklist();
        } else {
            r.json().then(d => showModal({ title: 'Error', message: d.error || 'Unreject failed', type: 'danger' }));
        }
    });
}

function cancelReject() {
    closeResultModal();
    openResults(currentEntryId);
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

function collectPayload() {
    const payload = {};
    const panicCodes = new Set();

    document.querySelectorAll('.result-numeric.panic .result-input').forEach(input => {
        if (input.dataset.code) panicCodes.add(input.dataset.code);
    });

    document.querySelectorAll('.posneg-btn.selected').forEach(btn => {
        if (btn.dataset.code) payload[btn.dataset.code] = { result_value: btn.dataset.value };
    });

    document.querySelectorAll('.bg-btn.selected').forEach(btn => {
        if (btn.dataset.code) payload[btn.dataset.code] = { result_value: btn.dataset.value };
    });

    // Collect structured test results (CBC, MAL_BS, URINE)
    document.querySelectorAll('.structured-fields').forEach(container => {
        const code = container.dataset.code;
        const val = collectStructuredResult(code);
        if (val) {
            payload[code] = {
                result_value: val,
                panic_acknowledged: container.querySelectorAll('.result-numeric.panic').length > 0 ? 1 : 0
            };
        }
    });

    // Collect regular numeric and text inputs (skip sub-numeric-inputs which belong to structured tests)
    document.querySelectorAll('.result-input:not(.sub-numeric-input)').forEach(input => {
        const code = input.dataset.code;
        if (code && input.value.trim()) {
            payload[code] = {
                result_value: input.value.trim(),
                panic_acknowledged: panicCodes.has(code) ? 1 : 0
            };
        }
    });

    return payload;
}

function submitPayload(payload) {
    authFetch(`/api/register/entries/${currentEntryId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(r => {
        if (r.ok) {
            closeResultModal();
            showSuccess(getCurrentLang() === 'fr' ? 'Sauvegarde' : 'Saved');
            refreshWorklist();
        } else {
            r.json().then(d => showModal({ title: 'Error', message: d.error || 'Save failed', type: 'danger' }));
        }
    });
}

function saveResults() {
    const payload = collectPayload();

    if (hasPanicValues()) {
        showPanicModal(payload);
    } else {
        submitPayload(payload);
    }
}

function showPanicModal(payload) {
    const list = document.getElementById('panicList');
    const checkbox = document.getElementById('panicCheckbox');
    const confirmBtn = document.getElementById('panicConfirm');
    list.innerHTML = '';
    checkbox.checked = false;
    confirmBtn.disabled = true;

    // Build list of panic values with thresholds
    document.querySelectorAll('.result-numeric.panic').forEach(container => {
        const input = container.querySelector('.result-input') || container.querySelector('.sub-numeric-input');
        if (!input) return;
        const code = input.dataset.code || input.closest('.structured-fields')?.dataset.code;
        const val = input.value;
        const test = currentTests.find(t => t.code === code);
        const unit = test ? (test.unit || '') : '';

        // Find thresholds (from test or structured sub-field)
        let low = test ? test.panic_low : null;
        let high = test ? test.panic_high : null;
        const subKey = input.dataset.subKey;
        if (subKey && STRUCTURED_TESTS[code]) {
            const field = STRUCTURED_TESTS[code].fields.find(f => f.key === subKey);
            if (field) { low = field.panic_low; high = field.panic_high; }
        }

        const item = document.createElement('div');
        item.className = 'panic-item';
        const label = subKey ? `${code} / ${subKey}` : code;
        let threshold = '';
        if (low != null && parseFloat(val) < low) threshold = `< ${low}`;
        if (high != null && parseFloat(val) > high) threshold = `> ${high}`;
        item.innerHTML = `<span class="panic-item-test">${label}</span>` +
            `<span class="panic-item-value">${val} ${unit}</span>` +
            `<span class="panic-item-threshold">Threshold: ${threshold}</span>`;
        list.appendChild(item);
    });

    // Checkbox enables confirm button
    checkbox.onchange = () => { confirmBtn.disabled = !checkbox.checked; };

    // Cancel
    document.getElementById('panicCancel').onclick = () => {
        document.getElementById('panicModal').style.display = 'none';
    };

    // Confirm
    confirmBtn.onclick = () => {
        document.getElementById('panicModal').style.display = 'none';
        submitPayload(payload);
    };

    document.getElementById('panicModal').style.display = 'flex';
}

function closeResultModal() {
    document.getElementById('resultModal').style.display = 'none';
    refocusLanding();
}

function refocusLanding() {
    if (!isRegisterMode) {
        const input = document.getElementById('labNumberInput');
        if (input) { input.value = ''; input.focus(); }
    }
}

// ===== BUTTON GROUP HANDLERS =====

function setupButtonGroups() {
    document.querySelectorAll('.sex-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sex-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wizardData.sex = btn.dataset.sex;
        });
    });

    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wizardData.age_unit = btn.dataset.unit;
        });
    });

    document.querySelectorAll('.ward-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ward-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wizardData.ward = btn.dataset.ward;
        });
    });

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
                const pNum = p.patient_number || '';
                const pName = p.name || p.patient_name || '';
                div.textContent = `${pNum ? pNum + ' \u00b7 ' : ''}${pName} (${p.sex || '?'}, ${p.age || '?'}${p.age_unit || 'Y'})`;
                div.addEventListener('click', () => {
                    if (p.id && p.patient_number) {
                        // Existing patient record — select it
                        selectPatient(p);
                    } else {
                        // Legacy entry without patient record — fill fields manually
                        document.getElementById('wPatientName').value = pName;
                        if (p.age) document.getElementById('wAge').value = p.age;
                        if (p.sex) {
                            document.querySelectorAll('.sex-btn').forEach(b => b.classList.remove('active'));
                            const btn = document.querySelector(`.sex-btn[data-sex="${p.sex}"]`);
                            if (btn) btn.classList.add('active');
                            wizardData.sex = p.sex;
                        }
                    }
                    container.innerHTML = '';
                });
                container.appendChild(div);
            });
        });
}

function getCurrentLang() {
    return localStorage.getItem('lang') || 'en';
}
