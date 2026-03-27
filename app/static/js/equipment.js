/* Equipment & Maintenance Module */

let selectedEquipId = null;

const CATEGORIES = [
    'Freezer', 'Refrigerator', 'Microscope', 'Centrifuge', 'Analyzer',
    'Incubator', 'Autoclave', 'Balance', 'Timer', 'Thermometer',
    'Pipette', 'Water Bath', 'Vortex', 'Safety Cabinet', 'Generator', 'UPS', 'Other'
];

const CONDITIONS = ['Good', 'Fair', 'Poor', 'Out of service'];
const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('eqFab').addEventListener('click', () => {
        if (selectedEquipId) openAddMaintenance();
        else openAddEquipment();
    });
    document.getElementById('eqModalClose').addEventListener('click', closeModal);
    loadEquipment();
});

function closeModal() {
    document.getElementById('eqModal').style.display = 'none';
}

function loadEquipment() {
    fetch('/api/equipment').then(r => r.json()).then(items => {
        const list = document.getElementById('equipList');
        const empty = document.getElementById('equipEmpty');
        list.innerHTML = '';

        if (items.length === 0) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';

        const today = new Date().toISOString().split('T')[0];

        items.forEach(eq => {
            const isActive = eq.is_active;
            const condClass = {Good: 'completed', Fair: 'in_progress', Poor: 'review'}[eq.physical_condition] || 'registered';

            const parts = [];
            if (eq.model) parts.push(eq.model);
            if (eq.serial_number) parts.push('S/N: ' + eq.serial_number);
            if (eq.location) parts.push(eq.location);

            // Maintenance badges
            const badges = [];
            if (eq.last_maintenance) {
                badges.push({ text: 'Last: ' + eq.last_maintenance.log_date + ' (' + eq.last_maintenance.maintenance_type + ')', cls: 'has-result' });
                if (eq.last_maintenance.next_scheduled) {
                    const overdue = eq.last_maintenance.next_scheduled < today;
                    badges.push({ text: (overdue ? 'OVERDUE: ' : 'Next: ') + eq.last_maintenance.next_scheduled, cls: overdue ? 'result-positive' : '' });
                }
            }

            const card = createCard({
                id: eq.category || 'Other',
                status: eq.physical_condition || 'Good',
                statusClass: condClass,
                title: eq.name,
                subtitle: parts.join(' \u00b7 '),
                badges: badges,
                borderClass: isActive ? '' : 'status-rejected',
                onClick: () => selectEquipment(eq)
            });

            // Highlight selected
            if (selectedEquipId === eq.id) card.classList.add('u-selected-border');

            list.appendChild(card);
        });
    });
}

function selectEquipment(eq) {
    selectedEquipId = eq.id;
    document.getElementById('maintTitle').textContent = eq.name + ' - Maintenance Log';
    document.getElementById('maintSection').style.display = 'block';
    loadEquipment(); // Re-render to highlight
    loadMaintenance(eq.id);
}

function loadMaintenance(eqId) {
    fetch('/api/equipment/' + eqId + '/maintenance').then(r => r.json()).then(logs => {
        const list = document.getElementById('maintList');
        const empty = document.getElementById('maintEmpty');
        list.innerHTML = '';

        if (logs.length === 0) { empty.style.display = 'block'; return; }
        empty.style.display = 'none';

        logs.forEach(log => {
            const typeColor = { PREVENTIVE: 'status-completed', CORRECTIVE: 'status-in_progress', CALIBRATION: 'status-registered' };
            const typeStatus = { PREVENTIVE: 'completed', CORRECTIVE: 'in_progress', CALIBRATION: 'registered' };

            const parts = [];
            if (log.performed_by) parts.push('By: ' + log.performed_by);
            if (log.parts_replaced) parts.push('Parts: ' + log.parts_replaced);
            if (log.next_scheduled) parts.push('Next: ' + log.next_scheduled);

            const card = createCard({
                id: log.log_date,
                status: log.maintenance_type,
                statusClass: typeStatus[log.maintenance_type] || 'registered',
                title: log.description || null,
                subtitle: parts.join(' \u00b7 '),
                borderClass: typeColor[log.maintenance_type] || ''
            });

            // Apply smaller font for description (matches original styling)
            if (log.description) {
                const titleEl = card.querySelector('.card-patient');
                if (titleEl) titleEl.classList.add('u-font-sm');
            }

            list.appendChild(card);
        });
    });
}

function openAddEquipment() {
    const body = document.getElementById('eqModalBody');
    const footer = document.getElementById('eqModalFooter');
    document.getElementById('eqModalTitle').textContent = 'Add Equipment';
    body.innerHTML = '';

    // Category buttons
    const catDiv = document.createElement('div');
    catDiv.className = 'big-field';
    const catLbl = document.createElement('label');
    catLbl.textContent = 'Category';
    catDiv.appendChild(catLbl);
    const catBtns = document.createElement('div');
    catBtns.className = 'test-btns';
    CATEGORIES.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'test-btn';
        btn.textContent = c;
        btn.dataset.value = c;
        btn.addEventListener('click', () => {
            catBtns.querySelectorAll('.test-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
        catBtns.appendChild(btn);
    });
    catDiv.appendChild(catBtns);
    body.appendChild(catDiv);

    // Text fields
    const textFields = [
        { id: 'eqName', label: 'Name / Description' },
        { id: 'eqModel', label: 'Model' },
        { id: 'eqSerial', label: 'Serial Number' },
        { id: 'eqManufacturer', label: 'Manufacturer' },
        { id: 'eqLocation', label: 'Location' },
    ];
    textFields.forEach(f => {
        const div = document.createElement('div');
        div.className = 'big-field';
        const lbl = document.createElement('label');
        lbl.textContent = f.label;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.id = f.id;
        inp.className = 'big-input';
        div.appendChild(lbl);
        div.appendChild(inp);
        body.appendChild(div);
    });

    // Installation date
    const dDiv = document.createElement('div');
    dDiv.className = 'big-field';
    const dLbl = document.createElement('label');
    dLbl.textContent = 'Installation Date';
    const dInp = document.createElement('input');
    dInp.type = 'date';
    dInp.id = 'eqDate';
    dInp.className = 'big-input';
    dDiv.appendChild(dLbl);
    dDiv.appendChild(dInp);
    body.appendChild(dDiv);

    // Condition buttons
    const condDiv = document.createElement('div');
    condDiv.className = 'big-field';
    const condLbl = document.createElement('label');
    condLbl.textContent = 'Physical Condition';
    condDiv.appendChild(condLbl);
    const condBtns = document.createElement('div');
    condBtns.className = 'ward-btns';
    CONDITIONS.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ward-btn' + (c === 'Good' ? ' active' : '');
        btn.textContent = c;
        btn.dataset.value = c;
        btn.addEventListener('click', () => {
            condBtns.querySelectorAll('.ward-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        condBtns.appendChild(btn);
    });
    condDiv.appendChild(condBtns);
    body.appendChild(condDiv);

    footer.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wiz-btn wiz-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', closeModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'wiz-btn wiz-btn-confirm';
    saveBtn.textContent = 'Add Equipment';
    saveBtn.addEventListener('click', () => {
        const catActive = body.querySelector('.test-btn.selected');
        const condActive = body.querySelector('.ward-btn.active');
        const payload = {
            category: catActive ? catActive.dataset.value : null,
            name: document.getElementById('eqName').value,
            model: document.getElementById('eqModel').value,
            serial_number: document.getElementById('eqSerial').value,
            manufacturer: document.getElementById('eqManufacturer').value,
            location: document.getElementById('eqLocation').value,
            installation_date: document.getElementById('eqDate').value || null,
            physical_condition: condActive ? condActive.dataset.value : 'Good'
        };
        fetch('/api/equipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(r => { if (r.ok) { closeModal(); loadEquipment(); } });
    });
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    document.getElementById('eqModal').style.display = 'flex';
}

function openAddMaintenance() {
    const body = document.getElementById('eqModalBody');
    const footer = document.getElementById('eqModalFooter');
    document.getElementById('eqModalTitle').textContent = 'Log Maintenance';
    body.innerHTML = '';

    // Type buttons
    const tDiv = document.createElement('div');
    tDiv.className = 'big-field';
    const tLbl = document.createElement('label');
    tLbl.textContent = 'Maintenance Type';
    tDiv.appendChild(tLbl);
    const tBtns = document.createElement('div');
    tBtns.className = 'ward-btns';
    tBtns.style.gridTemplateColumns = 'repeat(3, 1fr)';
    ['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION'].forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ward-btn';
        btn.textContent = t;
        btn.dataset.value = t;
        btn.addEventListener('click', () => {
            tBtns.querySelectorAll('.ward-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        tBtns.appendChild(btn);
    });
    tDiv.appendChild(tBtns);
    body.appendChild(tDiv);

    // Description
    const dDiv = document.createElement('div');
    dDiv.className = 'big-field';
    const dLbl = document.createElement('label');
    dLbl.textContent = 'Description';
    const dInp = document.createElement('input');
    dInp.type = 'text';
    dInp.id = 'mDesc';
    dInp.className = 'big-input';
    dDiv.appendChild(dLbl);
    dDiv.appendChild(dInp);
    body.appendChild(dDiv);

    // Parts replaced
    const pDiv = document.createElement('div');
    pDiv.className = 'big-field';
    const pLbl = document.createElement('label');
    pLbl.textContent = 'Parts Replaced';
    const pInp = document.createElement('input');
    pInp.type = 'text';
    pInp.id = 'mParts';
    pInp.className = 'big-input';
    pDiv.appendChild(pLbl);
    pDiv.appendChild(pInp);
    body.appendChild(pDiv);

    // Performed by
    const byDiv = document.createElement('div');
    byDiv.className = 'big-field';
    const byLbl = document.createElement('label');
    byLbl.textContent = 'Performed By';
    const byInp = document.createElement('input');
    byInp.type = 'text';
    byInp.id = 'mBy';
    byInp.className = 'big-input';
    byDiv.appendChild(byLbl);
    byDiv.appendChild(byInp);
    body.appendChild(byDiv);

    // Next scheduled
    const nDiv = document.createElement('div');
    nDiv.className = 'big-field';
    const nLbl = document.createElement('label');
    nLbl.textContent = 'Next Scheduled';
    const nInp = document.createElement('input');
    nInp.type = 'date';
    nInp.id = 'mNext';
    nInp.className = 'big-input';
    nDiv.appendChild(nLbl);
    nDiv.appendChild(nInp);
    body.appendChild(nDiv);

    footer.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wiz-btn wiz-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', closeModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'wiz-btn wiz-btn-confirm';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
        const tActive = body.querySelector('.ward-btn.active');
        const payload = {
            maintenance_type: tActive ? tActive.dataset.value : null,
            description: document.getElementById('mDesc').value,
            parts_replaced: document.getElementById('mParts').value,
            performed_by: document.getElementById('mBy').value,
            next_scheduled: document.getElementById('mNext').value || null
        };
        fetch('/api/equipment/' + selectedEquipId + '/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(r => { if (r.ok) { closeModal(); loadEquipment(); loadMaintenance(selectedEquipId); } });
    });
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    document.getElementById('eqModal').style.display = 'flex';
}
