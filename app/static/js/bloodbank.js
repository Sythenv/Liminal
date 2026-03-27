/* Blood Bank Module */

let currentTab = 'donors';

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
            document.getElementById('tab-' + currentTab).style.display = 'block';
            loadTab();
        });
    });

    document.getElementById('bbFab').addEventListener('click', fabAction);
    document.getElementById('bbModalClose').addEventListener('click', closeModal);

    loadTab();
});

function loadTab() {
    if (currentTab === 'donors') loadDonors();
    else if (currentTab === 'stock') loadUnits();
    else if (currentTab === 'transfusions') loadTransfusions();
}

function closeModal() {
    document.getElementById('bbModal').style.display = 'none';
}

function fabAction() {
    if (currentTab === 'donors') openAddDonor();
    else if (currentTab === 'stock') openNewCollection();
    else if (currentTab === 'transfusions') openIssueUnit();
}

// ===== DONORS =====

function loadDonors() {
    authFetch('/api/bloodbank/donors', {}).then(r => r.json()).then(donors => {
        const list = document.getElementById('donorList');
        const empty = document.getElementById('donorEmpty');
        list.innerHTML = '';

        if (donors.length === 0) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';

        donors.forEach(d => {
            const card = document.createElement('div');
            card.className = 'sample-card donor-card';

            // Top row: blood group badge + donor info
            const row = document.createElement('div');
            row.className = 'donor-row';

            const bgBadge = document.createElement('div');
            bgBadge.className = 'donor-bg-badge';
            bgBadge.textContent = d.blood_group || '?';
            row.appendChild(bgBadge);

            const info = document.createElement('div');
            // (info is appended to row after building its children)
            info.className = 'donor-info';

            const name = document.createElement('div');
            name.className = 'donor-name';
            name.textContent = d.name;
            info.appendChild(name);

            const meta = document.createElement('div');
            meta.className = 'donor-meta';
            const parts = [d.donor_number];
            if (d.age) parts.push(d.age + (d.sex ? d.sex : ''));
            if (d.last_donation_date) parts.push('Last ' + d.last_donation_date);
            meta.textContent = parts.join(' \u00b7 ');
            info.appendChild(meta);

            row.appendChild(info);

            // Barcode aligned right
            const barcodeDiv = document.createElement('div');
            barcodeDiv.className = 'donor-barcode';
            barcodeDiv.appendChild(createBarcode(d.donor_number, { height: 28, barWidth: 1 }));
            row.appendChild(barcodeDiv);

            card.appendChild(row);

            list.appendChild(card);
        });
    });
}

function openAddDonor() {
    const body = document.getElementById('bbModalBody');
    const footer = document.getElementById('bbModalFooter');
    document.getElementById('bbModalTitle').textContent = 'New Donor';
    body.innerHTML = '';

    const fields = [
        { id: 'dName', label: 'Name', type: 'text' },
        { id: 'dAge', label: 'Age', type: 'number' },
    ];
    fields.forEach(f => {
        const div = document.createElement('div');
        div.className = 'big-field';
        const lbl = document.createElement('label');
        lbl.textContent = f.label;
        const inp = document.createElement('input');
        inp.type = f.type;
        inp.id = f.id;
        inp.className = 'big-input';
        div.appendChild(lbl);
        div.appendChild(inp);
        body.appendChild(div);
    });

    // Sex buttons
    const sexDiv = document.createElement('div');
    sexDiv.className = 'big-field';
    const sexLbl = document.createElement('label');
    sexLbl.textContent = 'Sex';
    sexDiv.appendChild(sexLbl);
    const sexBtns = document.createElement('div');
    sexBtns.className = 'sex-btns';
    ['M', 'F'].forEach(s => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sex-btn';
        btn.textContent = s;
        btn.dataset.value = s;
        btn.addEventListener('click', () => {
            sexBtns.querySelectorAll('.sex-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        sexBtns.appendChild(btn);
    });
    sexDiv.appendChild(sexBtns);
    body.appendChild(sexDiv);

    // Blood group buttons
    const bgDiv = document.createElement('div');
    bgDiv.className = 'big-field';
    const bgLbl = document.createElement('label');
    bgLbl.textContent = 'Blood Group';
    bgDiv.appendChild(bgLbl);
    const bgBtns = document.createElement('div');
    bgBtns.className = 'bg-btns';
    ['A+','A-','B+','B-','AB+','AB-','O+','O-'].forEach(bg => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bg-btn';
        btn.textContent = bg;
        btn.dataset.value = bg;
        btn.addEventListener('click', () => {
            bgBtns.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        bgBtns.appendChild(btn);
    });
    bgDiv.appendChild(bgBtns);
    body.appendChild(bgDiv);

    // Contact
    const cDiv = document.createElement('div');
    cDiv.className = 'big-field';
    const cLbl = document.createElement('label');
    cLbl.textContent = 'Contact';
    const cInp = document.createElement('input');
    cInp.type = 'text';
    cInp.id = 'dContact';
    cInp.className = 'big-input';
    cDiv.appendChild(cLbl);
    cDiv.appendChild(cInp);
    body.appendChild(cDiv);

    footer.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wiz-btn wiz-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', closeModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'wiz-btn wiz-btn-confirm';
    saveBtn.textContent = 'Register Donor';
    saveBtn.addEventListener('click', saveDonor);
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    document.getElementById('bbModal').style.display = 'flex';
}

function saveDonor() {
    const sexBtn = document.querySelector('#bbModalBody .sex-btn.active');
    const bgBtn = document.querySelector('#bbModalBody .bg-btn.active');
    const payload = {
        name: document.getElementById('dName').value,
        age: document.getElementById('dAge').value ? parseInt(document.getElementById('dAge').value) : null,
        sex: sexBtn ? sexBtn.dataset.value : null,
        blood_group: bgBtn ? bgBtn.dataset.value : null,
        contact: document.getElementById('dContact').value || null
    };
    authFetch('/api/bloodbank/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(r => { if (r.ok) { closeModal(); loadDonors(); } });
}

// ===== STOCK =====

function buildStockSummary(units) {
    const groups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    const statuses = ['AVAILABLE', 'RESERVED', 'ISSUED', 'EXPIRED'];
    const today = new Date().toISOString().split('T')[0];

    // Count per group x status + expiring
    const counts = {};
    groups.forEach(g => {
        counts[g] = {};
        statuses.forEach(s => counts[g][s] = 0);
        counts[g].EXPIRING = 0;
    });

    units.forEach(u => {
        if (!counts[u.blood_group]) return;
        counts[u.blood_group][u.status] = (counts[u.blood_group][u.status] || 0) + 1;
        if (u.status === 'AVAILABLE') {
            const daysLeft = Math.ceil((new Date(u.expiry_date) - new Date(today)) / 86400000);
            if (daysLeft <= 7 && daysLeft > 0) counts[u.blood_group].EXPIRING++;
        }
    });

    const table = document.createElement('table');
    table.className = 'stock-summary';

    // Header
    const thead = document.createElement('thead');
    const hRow = document.createElement('tr');
    ['', 'AVAIL', 'RSRVD', 'ISSUED', 'EXPRD', 'EXP<7d'].forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        hRow.appendChild(th);
    });
    thead.appendChild(hRow);
    table.appendChild(thead);

    // Rows
    const tbody = document.createElement('tbody');
    groups.forEach(g => {
        const c = counts[g];
        const total = c.AVAILABLE + c.RESERVED + c.ISSUED + c.EXPIRED;
        if (total === 0 && c.EXPIRING === 0) return; // Skip empty groups

        const row = document.createElement('tr');

        const bgCell = document.createElement('td');
        bgCell.className = 'stock-bg-cell';
        bgCell.textContent = g;
        row.appendChild(bgCell);

        const vals = [c.AVAILABLE, c.RESERVED, c.ISSUED, c.EXPIRED, c.EXPIRING];
        const cls = ['stock-avail', 'stock-reserved', 'stock-issued', 'stock-expired', 'stock-expiring'];
        vals.forEach((v, i) => {
            const td = document.createElement('td');
            td.textContent = v || '-';
            if (v > 0) td.className = cls[i];
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    return table;
}

function loadUnits() {
    authFetch('/api/bloodbank/units', {}).then(r => r.json()).then(units => {
        const list = document.getElementById('unitList');
        const empty = document.getElementById('unitEmpty');
        list.innerHTML = '';

        if (units.length === 0) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';

        // Summary table first
        list.appendChild(buildStockSummary(units));

        const statusColors = { AVAILABLE: 'status-completed', RESERVED: 'status-in_progress',
                               ISSUED: 'status-registered', EXPIRED: 'status-rejected' };

        units.forEach(u => {
            const card = document.createElement('div');
            card.className = 'sample-card ' + (statusColors[u.status] || '');

            const top = document.createElement('div');
            top.className = 'card-top';
            const num = document.createElement('span');
            num.className = 'card-lab-number';
            num.textContent = u.unit_number;
            const st = document.createElement('span');
            st.className = 'card-status ' + u.status.toLowerCase();
            st.textContent = u.status;
            top.appendChild(num);
            top.appendChild(st);
            card.appendChild(top);

            const bg = document.createElement('div');
            bg.className = 'card-patient';
            bg.textContent = u.blood_group;
            card.appendChild(bg);

            const det = document.createElement('div');
            det.className = 'card-details';
            const parts = [u.volume_ml + 'ml'];
            if (u.donor_name) parts.push('Donor: ' + u.donor_number || u.donor_name);
            parts.push('Exp: ' + u.expiry_date);
            det.textContent = parts.join(' \u00b7 ');
            card.appendChild(det);

            // Expiry warning on its own line
            const today = new Date().toISOString().split('T')[0];
            const daysLeft = Math.ceil((new Date(u.expiry_date) - new Date(today)) / 86400000);
            if (u.status === 'AVAILABLE' && daysLeft <= 7 && daysLeft > 0) {
                const warn = document.createElement('div');
                warn.className = 'rejection-badge';
                warn.style.marginTop = '6px';
                warn.textContent = daysLeft + 'd left';
                card.appendChild(warn);
            }

            // Screening badges
            const tests = document.createElement('div');
            tests.className = 'card-tests';
            ['hiv', 'hbv', 'hcv', 'syphilis'].forEach(s => {
                const val = u['screening_' + s];
                if (!val) return;
                const badge = document.createElement('span');
                badge.className = 'card-test-badge ' + (val === 'POS' ? 'result-positive' : 'has-result');
                badge.textContent = s.toUpperCase() + ': ' + val;
                tests.appendChild(badge);
            });
            card.appendChild(tests);

            list.appendChild(card);
        });
    });
}

function openNewCollection() {
    const body = document.getElementById('bbModalBody');
    const footer = document.getElementById('bbModalFooter');
    document.getElementById('bbModalTitle').textContent = 'New Collection';
    body.innerHTML = '';

    // Donor search
    const dDiv = document.createElement('div');
    dDiv.className = 'big-field';
    const dLbl = document.createElement('label');
    dLbl.textContent = 'Donor (search)';
    const dInp = document.createElement('input');
    dInp.type = 'text';
    dInp.id = 'uDonorSearch';
    dInp.className = 'big-input';
    dInp.placeholder = 'Type donor name...';
    const dSugg = document.createElement('div');
    dSugg.className = 'suggestions';
    dSugg.id = 'uDonorSuggestions';
    const dSelected = document.createElement('div');
    dSelected.id = 'uDonorSelected';
    dSelected.style.display = 'none';
    dSelected.className = 'confirm-row';
    dDiv.appendChild(dLbl);
    dDiv.appendChild(dInp);
    dDiv.appendChild(dSugg);
    dDiv.appendChild(dSelected);
    body.appendChild(dDiv);

    let selectedDonorId = null;
    dInp.addEventListener('input', () => {
        const q = dInp.value;
        if (q.length < 2) { dSugg.innerHTML = ''; return; }
        authFetch('/api/bloodbank/donors?search=' + encodeURIComponent(q), {})
            .then(r => r.json()).then(donors => {
                dSugg.innerHTML = '';
                donors.forEach(d => {
                    const div = document.createElement('div');
                    div.textContent = d.name + ' (' + (d.blood_group || '?') + ') - ' + d.donor_number;
                    div.addEventListener('click', () => {
                        selectedDonorId = d.id;
                        dInp.style.display = 'none';
                        dSugg.innerHTML = '';
                        dSelected.textContent = d.name + ' - ' + d.donor_number + ' (' + (d.blood_group || '?') + ')';
                        dSelected.style.display = 'block';
                        // Auto-set blood group
                        if (d.blood_group) {
                            const bgBtn = body.querySelector('.bg-btn[data-value="' + d.blood_group + '"]');
                            if (bgBtn) {
                                body.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
                                bgBtn.classList.add('active');
                            }
                        }
                    });
                    dSugg.appendChild(div);
                });
            });
    });

    // Blood group
    const bgDiv = document.createElement('div');
    bgDiv.className = 'big-field';
    const bgLbl = document.createElement('label');
    bgLbl.textContent = 'Blood Group';
    bgDiv.appendChild(bgLbl);
    const bgBtns = document.createElement('div');
    bgBtns.className = 'bg-btns';
    ['A+','A-','B+','B-','AB+','AB-','O+','O-'].forEach(bg => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bg-btn';
        btn.textContent = bg;
        btn.dataset.value = bg;
        btn.addEventListener('click', () => {
            bgBtns.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        bgBtns.appendChild(btn);
    });
    bgDiv.appendChild(bgBtns);
    body.appendChild(bgDiv);

    // Volume
    const vDiv = document.createElement('div');
    vDiv.className = 'big-field';
    const vLbl = document.createElement('label');
    vLbl.textContent = 'Volume (ml)';
    const vInp = document.createElement('input');
    vInp.type = 'number';
    vInp.id = 'uVolume';
    vInp.className = 'big-input';
    vInp.value = '450';
    vDiv.appendChild(vLbl);
    vDiv.appendChild(vInp);
    body.appendChild(vDiv);

    // Screening: 4 POS/NEG rows
    ['HIV', 'HBV', 'HCV', 'Syphilis'].forEach(s => {
        const sDiv = document.createElement('div');
        sDiv.className = 'big-field';
        const sLbl = document.createElement('label');
        sLbl.textContent = s + ' Screening';
        sDiv.appendChild(sLbl);
        const sBtns = document.createElement('div');
        sBtns.className = 'posneg-btns';
        ['NEG', 'POS'].forEach(v => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'posneg-btn ' + v.toLowerCase();
            btn.textContent = v;
            btn.dataset.screening = s.toLowerCase();
            btn.dataset.value = v;
            btn.addEventListener('click', () => {
                sBtns.querySelectorAll('.posneg-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
            sBtns.appendChild(btn);
        });
        sDiv.appendChild(sBtns);
        body.appendChild(sDiv);
    });

    footer.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wiz-btn wiz-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', closeModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'wiz-btn wiz-btn-confirm';
    saveBtn.textContent = 'Register Unit';
    saveBtn.addEventListener('click', () => {
        const bgActive = body.querySelector('.bg-btn.active');
        const screenings = {};
        body.querySelectorAll('.posneg-btn.selected').forEach(b => {
            screenings['screening_' + b.dataset.screening] = b.dataset.value;
        });
        const payload = {
            donor_id: selectedDonorId,
            blood_group: bgActive ? bgActive.dataset.value : null,
            volume_ml: parseInt(document.getElementById('uVolume').value) || 450,
            ...screenings
        };
        authFetch('/api/bloodbank/units', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(r => { if (r.ok) { closeModal(); loadUnits(); } });
    });
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    document.getElementById('bbModal').style.display = 'flex';
}

// ===== TRANSFUSIONS =====

function loadTransfusions() {
    authFetch('/api/bloodbank/transfusions', {}).then(r => r.json()).then(trs => {
        const list = document.getElementById('transfusionList');
        const empty = document.getElementById('trEmpty');
        list.innerHTML = '';

        if (trs.length === 0) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';

        trs.forEach(tr => {
            const card = document.createElement('div');
            const completed = tr.transfusion_completed;
            card.className = 'sample-card ' + (completed ? 'status-completed' : 'status-in_progress');

            const top = document.createElement('div');
            top.className = 'card-top';
            const num = document.createElement('span');
            num.className = 'card-lab-number';
            num.textContent = tr.unit_number;
            const st = document.createElement('span');
            st.className = 'card-status ' + (completed ? 'completed' : 'in_progress');
            st.textContent = completed ? 'completed' : 'issued';
            top.appendChild(num);
            top.appendChild(st);
            card.appendChild(top);

            const name = document.createElement('div');
            name.className = 'card-patient';
            name.textContent = tr.patient_name;
            card.appendChild(name);

            const det = document.createElement('div');
            det.className = 'card-details';
            const parts = [tr.unit_blood_group];
            if (tr.issued_to_ward) parts.push(tr.issued_to_ward);
            if (tr.issued_date) parts.push(tr.issued_date);
            if (tr.crossmatch_result) parts.push('XM: ' + tr.crossmatch_result);
            det.textContent = parts.join(' \u00b7 ');
            card.appendChild(det);

            if (tr.adverse_reaction) {
                const badge = document.createElement('span');
                badge.className = 'rejection-badge';
                badge.textContent = 'ADVERSE REACTION';
                card.appendChild(badge);
            }

            // Complete button for issued (not yet completed)
            if (!completed) {
                card.addEventListener('click', () => openCompleteTr(tr));
            }

            list.appendChild(card);
        });
    });
}

function openIssueUnit() {
    const body = document.getElementById('bbModalBody');
    const footer = document.getElementById('bbModalFooter');
    document.getElementById('bbModalTitle').textContent = 'Issue Unit';
    body.innerHTML = '';

    // Load available units
    let selectedUnitId = null;
    const uDiv = document.createElement('div');
    uDiv.className = 'big-field';
    const uLbl = document.createElement('label');
    uLbl.textContent = 'Available Unit';
    uDiv.appendChild(uLbl);
    const uList = document.createElement('div');
    uList.className = 'card-list';
    uList.id = 'availableUnits';
    uDiv.appendChild(uList);
    body.appendChild(uDiv);

    authFetch('/api/bloodbank/units?status=AVAILABLE', {}).then(r => r.json()).then(units => {
        if (units.length === 0) {
            uList.textContent = 'No available units';
            return;
        }
        units.forEach(u => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ward-btn';
            btn.textContent = u.unit_number + ' ' + u.blood_group + ' (' + u.volume_ml + 'ml)';
            btn.style.width = '100%';
            btn.style.marginBottom = '4px';
            btn.addEventListener('click', () => {
                uList.querySelectorAll('.ward-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedUnitId = u.id;
            });
            uList.appendChild(btn);
        });
    });

    // Patient name
    const pDiv = document.createElement('div');
    pDiv.className = 'big-field';
    const pLbl = document.createElement('label');
    pLbl.textContent = 'Patient Name';
    const pInp = document.createElement('input');
    pInp.type = 'text';
    pInp.id = 'trPatient';
    pInp.className = 'big-input';
    pDiv.appendChild(pLbl);
    pDiv.appendChild(pInp);
    body.appendChild(pDiv);

    // Patient blood group
    const bgDiv = document.createElement('div');
    bgDiv.className = 'big-field';
    const bgLbl = document.createElement('label');
    bgLbl.textContent = 'Patient Blood Group';
    bgDiv.appendChild(bgLbl);
    const bgBtns = document.createElement('div');
    bgBtns.className = 'bg-btns';
    ['A+','A-','B+','B-','AB+','AB-','O+','O-'].forEach(bg => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bg-btn';
        btn.textContent = bg;
        btn.dataset.value = bg;
        btn.addEventListener('click', () => {
            bgBtns.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        bgBtns.appendChild(btn);
    });
    bgDiv.appendChild(bgBtns);
    body.appendChild(bgDiv);

    // Crossmatch
    const xDiv = document.createElement('div');
    xDiv.className = 'big-field';
    const xLbl = document.createElement('label');
    xLbl.textContent = 'Crossmatch';
    xDiv.appendChild(xLbl);
    const xBtns = document.createElement('div');
    xBtns.className = 'posneg-btns';
    ['COMPATIBLE', 'INCOMPATIBLE'].forEach(v => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'posneg-btn ' + (v === 'COMPATIBLE' ? 'neg' : 'pos');
        btn.textContent = v;
        btn.dataset.value = v;
        btn.addEventListener('click', () => {
            xBtns.querySelectorAll('.posneg-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
        xBtns.appendChild(btn);
    });
    xDiv.appendChild(xBtns);
    body.appendChild(xDiv);

    // Ward
    const wDiv = document.createElement('div');
    wDiv.className = 'big-field';
    const wLbl = document.createElement('label');
    wLbl.textContent = 'Ward';
    wDiv.appendChild(wLbl);
    const wBtns = document.createElement('div');
    wBtns.className = 'ward-btns';
    ['OPD','IPD','PED','ER','MATER','ICU','ITFC','NCD'].forEach(w => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ward-btn';
        btn.textContent = w;
        btn.dataset.value = w;
        btn.addEventListener('click', () => {
            wBtns.querySelectorAll('.ward-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        wBtns.appendChild(btn);
    });
    wDiv.appendChild(wBtns);
    body.appendChild(wDiv);

    footer.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wiz-btn wiz-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', closeModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'wiz-btn wiz-btn-confirm';
    saveBtn.textContent = 'Issue Unit';
    saveBtn.addEventListener('click', () => {
        const bgActive = body.querySelector('.bg-btns .bg-btn.active');
        const xmActive = body.querySelector('.posneg-btn.selected');
        const wActive = body.querySelector('.ward-btns .ward-btn.active');
        const payload = {
            unit_id: selectedUnitId,
            patient_name: document.getElementById('trPatient').value,
            patient_blood_group: bgActive ? bgActive.dataset.value : null,
            crossmatch_result: xmActive ? xmActive.dataset.value : null,
            issued_to_ward: wActive ? wActive.dataset.value : null
        };
        authFetch('/api/bloodbank/transfusions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(r => {
            if (r.ok) { closeModal(); loadTransfusions(); }
            else { r.json().then(d => showModal({ title: 'Error', message: d.error || 'Error', type: 'danger' })); }
        });
    });
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    document.getElementById('bbModal').style.display = 'flex';
}

function openCompleteTr(tr) {
    const body = document.getElementById('bbModalBody');
    const footer = document.getElementById('bbModalFooter');
    document.getElementById('bbModalTitle').textContent = 'Complete Transfusion';
    body.innerHTML = '';

    const info = document.createElement('div');
    info.className = 'confirm-summary';
    info.innerHTML = '';
    const rows = [
        ['Unit', tr.unit_number + ' (' + tr.unit_blood_group + ')'],
        ['Patient', tr.patient_name],
        ['Ward', tr.issued_to_ward || '-'],
        ['Issued', tr.issued_date || '-']
    ];
    rows.forEach(([l, v]) => {
        const row = document.createElement('div');
        row.className = 'confirm-row';
        const lbl = document.createElement('span');
        lbl.className = 'confirm-label';
        lbl.textContent = l;
        const val = document.createElement('span');
        val.className = 'confirm-value';
        val.textContent = v;
        row.appendChild(lbl);
        row.appendChild(val);
        info.appendChild(row);
    });
    body.appendChild(info);

    // Adverse reaction
    const aDiv = document.createElement('div');
    aDiv.className = 'big-field';
    aDiv.style.marginTop = '16px';
    const aLbl = document.createElement('label');
    aLbl.textContent = 'Adverse Reaction?';
    aDiv.appendChild(aLbl);
    const aBtns = document.createElement('div');
    aBtns.className = 'posneg-btns';
    ['NO', 'YES'].forEach(v => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'posneg-btn ' + (v === 'NO' ? 'neg' : 'pos');
        btn.textContent = v;
        btn.dataset.value = v;
        btn.addEventListener('click', () => {
            aBtns.querySelectorAll('.posneg-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
        aBtns.appendChild(btn);
    });
    aDiv.appendChild(aBtns);
    body.appendChild(aDiv);

    footer.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wiz-btn wiz-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', closeModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'wiz-btn wiz-btn-confirm';
    saveBtn.textContent = 'Complete Transfusion';
    saveBtn.addEventListener('click', () => {
        const aActive = body.querySelector('.posneg-btn.selected');
        const payload = {
            transfusion_completed: new Date().toISOString().replace('T', ' ').substring(0, 19),
            adverse_reaction: aActive && aActive.dataset.value === 'YES' ? 1 : 0
        };
        authFetch('/api/bloodbank/transfusions/' + tr.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(r => { if (r.ok) { closeModal(); loadTransfusions(); } });
    });
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    document.getElementById('bbModal').style.display = 'flex';
}
