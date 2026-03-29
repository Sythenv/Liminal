/* Equipment & Maintenance Module */

let selectedEquipId = null;

const CATEGORIES = [
    {value: 'Freezer', key: 'eq_cat_freezer'},
    {value: 'Refrigerator', key: 'eq_cat_refrigerator'},
    {value: 'Microscope', key: 'eq_cat_microscope'},
    {value: 'Centrifuge', key: 'eq_cat_centrifuge'},
    {value: 'Analyzer', key: 'eq_cat_analyzer'},
    {value: 'Incubator', key: 'eq_cat_incubator'},
    {value: 'Autoclave', key: 'eq_cat_autoclave'},
    {value: 'Balance', key: 'eq_cat_balance'},
    {value: 'Timer', key: 'eq_cat_timer'},
    {value: 'Thermometer', key: 'eq_cat_thermometer'},
    {value: 'Pipette', key: 'eq_cat_pipette'},
    {value: 'Water Bath', key: 'eq_cat_water_bath'},
    {value: 'Vortex', key: 'eq_cat_vortex'},
    {value: 'Safety Cabinet', key: 'eq_cat_safety_cabinet'},
    {value: 'Generator', key: 'eq_cat_generator'},
    {value: 'UPS', key: 'eq_cat_ups'},
    {value: 'Other', key: 'eq_cat_other'}
];

const CONDITIONS = [
    {value: 'Good', key: 'eq_cond_good'},
    {value: 'Fair', key: 'eq_cond_fair'},
    {value: 'Poor', key: 'eq_cond_poor'},
    {value: 'Out of service', key: 'eq_cond_out'}
];
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
                badges.push({ text: t('eq_last') + ': ' + eq.last_maintenance.log_date + ' (' + eq.last_maintenance.maintenance_type + ')', cls: 'has-result' });
                if (eq.last_maintenance.next_scheduled) {
                    const overdue = eq.last_maintenance.next_scheduled < today;
                    badges.push({ text: (overdue ? t('eq_overdue') + ': ' : t('eq_next') + ': ') + eq.last_maintenance.next_scheduled, cls: overdue ? 'result-positive' : '' });
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
    document.getElementById('maintTitle').textContent = eq.name + ' - ' + t('eq_maintenance_log');
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
            if (log.performed_by) parts.push(t('eq_by') + ': ' + log.performed_by);
            if (log.parts_replaced) parts.push(t('eq_parts') + ': ' + log.parts_replaced);
            if (log.next_scheduled) parts.push(t('eq_next') + ': ' + log.next_scheduled);

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
    document.getElementById('eqModalTitle').textContent = t('add_equipment');
    body.innerHTML = '';

    // Category buttons
    const catDiv = document.createElement('div');
    catDiv.className = 'big-field';
    const catLbl = document.createElement('label');
    catLbl.textContent = t('category');
    catDiv.appendChild(catLbl);
    const catBtns = document.createElement('div');
    catBtns.className = 'test-btns';
    CATEGORIES.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'test-btn';
        btn.textContent = t(c.key);
        btn.dataset.value = c.value;
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
        { id: 'eqName', label: t('name_desc') },
        { id: 'eqModel', label: t('model') },
        { id: 'eqSerial', label: t('serial_number') },
        { id: 'eqManufacturer', label: t('manufacturer') },
        { id: 'eqLocation', label: t('location') },
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
    dLbl.textContent = t('installation_date');
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
    condLbl.textContent = t('condition');
    condDiv.appendChild(condLbl);
    const condBtns = document.createElement('div');
    condBtns.className = 'ward-btns';
    CONDITIONS.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ward-btn' + (c.value === 'Good' ? ' active' : '');
        btn.textContent = t(c.key);
        btn.dataset.value = c.value;
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
    cancelBtn.textContent = t('cancel');
    cancelBtn.addEventListener('click', closeModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'wiz-btn wiz-btn-confirm';
    saveBtn.textContent = t('add_equipment');
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
        authFetch('/api/equipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(r => {
            if (r.ok) { closeModal(); loadEquipment(); }
            else { r.json().then(d => showModal({ title: t('error'), message: d.error || t('failed'), type: 'danger' })); }
        });
    });
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    document.getElementById('eqModal').style.display = 'flex';
}

function openAddMaintenance() {
    const body = document.getElementById('eqModalBody');
    const footer = document.getElementById('eqModalFooter');
    document.getElementById('eqModalTitle').textContent = t('log_maintenance');
    body.innerHTML = '';

    // Type buttons
    const tDiv = document.createElement('div');
    tDiv.className = 'big-field';
    const tLbl = document.createElement('label');
    tLbl.textContent = t('maintenance_type');
    tDiv.appendChild(tLbl);
    const tBtns = document.createElement('div');
    tBtns.className = 'ward-btns';
    tBtns.style.gridTemplateColumns = 'repeat(3, 1fr)';
    const MAINT_TYPES = [
        {value: 'PREVENTIVE', key: 'eq_maint_preventive'},
        {value: 'CORRECTIVE', key: 'eq_maint_corrective'},
        {value: 'CALIBRATION', key: 'eq_maint_calibration'}
    ];
    MAINT_TYPES.forEach(mt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ward-btn';
        btn.textContent = t(mt.key);
        btn.dataset.value = mt.value;
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
    dLbl.textContent = t('description');
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
    pLbl.textContent = t('parts_replaced');
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
    byLbl.textContent = t('performed_by');
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
    nLbl.textContent = t('next_scheduled');
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
    cancelBtn.textContent = t('cancel');
    cancelBtn.addEventListener('click', closeModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'wiz-btn wiz-btn-confirm';
    saveBtn.textContent = t('save');
    saveBtn.addEventListener('click', () => {
        const tActive = body.querySelector('.ward-btn.active');
        const payload = {
            maintenance_type: tActive ? tActive.dataset.value : null,
            description: document.getElementById('mDesc').value,
            parts_replaced: document.getElementById('mParts').value,
            performed_by: document.getElementById('mBy').value,
            next_scheduled: document.getElementById('mNext').value || null
        };
        authFetch('/api/equipment/' + selectedEquipId + '/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(r => {
            if (r.ok) { closeModal(); loadEquipment(); loadMaintenance(selectedEquipId); }
            else { r.json().then(d => showModal({ title: t('error'), message: d.error || t('failed'), type: 'danger' })); }
        });
    });
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    document.getElementById('eqModal').style.display = 'flex';
}
