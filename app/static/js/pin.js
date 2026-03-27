/* PIN-based auth UI — numpad overlay, per-action verification only.
   No login screen. No nav filtering. PIN is prompted only when a protected action is triggered. */

let currentPin = null;
let currentLevel = 0;
let currentOperatorName = null;
let pinCallback = null;
let setupMode = false;
let setupStep = 0;
let setupData = {};

// ===== NUMPAD OVERLAY =====

function showNumpad(callback, message) {
    pinCallback = callback;
    const overlay = document.getElementById('pinOverlay');
    const dots = document.getElementById('pinDots');
    const msg = document.getElementById('pinMessage');
    const err = document.getElementById('pinError');

    dots.textContent = '';
    err.style.display = 'none';
    msg.textContent = message || 'Enter your PIN';
    overlay.style.display = 'flex';
    overlay.dataset.pin = '';
    shuffleNumpad();
}

function shuffleNumpad() {
    const grid = document.querySelector('.pin-grid');
    const digitKeys = Array.from(grid.querySelectorAll('.pin-key')).filter(
        k => k.dataset.key !== 'back' && k.dataset.key !== 'ok'
    );
    const values = digitKeys.map(k => k.dataset.key);
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    digitKeys.forEach((k, i) => {
        k.dataset.key = values[i];
        k.textContent = values[i];
    });
}

function hideNumpad() {
    document.getElementById('pinOverlay').style.display = 'none';
    document.getElementById('pinOverlay').dataset.pin = '';
}

function pinKeyPress(key) {
    const overlay = document.getElementById('pinOverlay');
    let pin = overlay.dataset.pin || '';
    const dots = document.getElementById('pinDots');
    const err = document.getElementById('pinError');

    err.style.display = 'none';

    if (key === 'back') {
        pin = pin.slice(0, -1);
    } else if (key === 'ok') {
        if (pin.length < 4) return;
        if (setupMode) {
            handleSetupPin(pin);
            return;
        }
        verifyPin(pin);
        return;
    } else if (pin.length < 8) {
        pin += key;
    }

    overlay.dataset.pin = pin;
    dots.textContent = '\u25cf '.repeat(pin.length).trim();
}

const DURESS_PINS = ['0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1234','4321','0123','1230','9876','6789'];

function verifyPin(pin) {
    if (DURESS_PINS.includes(pin)) {
        hideNumpad();
        showDuressScreen();
        return;
    }
    fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin })
    })
    .then(r => r.json().then(data => ({ status: r.status, data })))
    .then(({ status, data }) => {
        if (status === 200) {
            currentPin = pin;
            currentLevel = data.level;
            currentOperatorName = data.name;
            hideNumpad();
            if (pinCallback) {
                pinCallback(pin);
                pinCallback = null;
            }
        } else {
            showPinError(data.error || 'Invalid PIN');
        }
    });
}

function showPinError(message) {
    const err = document.getElementById('pinError');
    err.textContent = message;
    err.style.display = 'block';
    document.getElementById('pinOverlay').dataset.pin = '';
    document.getElementById('pinDots').textContent = '';
    const pad = document.getElementById('pinPad');
    pad.classList.add('shake');
    setTimeout(() => pad.classList.remove('shake'), 500);
}

// ===== PIN PROTECT WRAPPER =====

function pinProtect(callback) {
    showNumpad(pin => {
        currentPin = pin;
        callback(pin);
    });
}

// ===== SESSION =====

let sessionPin = null;
let sessionLevel = 0;
let sessionExpiry = 0;
const SESSION_TTL = 15 * 60 * 1000; // 15 minutes

function setSession(pin, level) {
    sessionPin = pin;
    sessionLevel = level || 0;
    sessionExpiry = Date.now() + SESSION_TTL;
}

function getSessionPin() {
    if (sessionPin && Date.now() < sessionExpiry) return sessionPin;
    sessionPin = null;
    sessionLevel = 0;
    return null;
}

// ===== AUTH FETCH WRAPPER =====

function authFetch(url, options) {
    options = options || {};
    const method = (options.method || 'GET').toUpperCase();
    const isWrite = method !== 'GET';

    return new Promise((resolve) => {
        const doFetch = (pin) => {
            options.headers = options.headers || {};
            options.headers['X-Operator-Pin'] = pin;
            fetch(url, options).then(r => {
                if (r.status === 401 || r.status === 403) {
                    // Clear session on auth failure
                    sessionPin = null;
                    r.json().then(data => {
                        showNumpad(doFetchAndSave, data.error || 'Authentication required');
                    });
                } else {
                    resolve(r);
                }
            });
        };

        const doFetchAndSave = (pin) => {
            // Verify PIN and cache session
            fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pin })
            }).then(r => r.json()).then(data => {
                if (data.id) {
                    setSession(pin, data.level);
                }
            });
            doFetch(pin);
        };

        // Read: use cached session if valid
        if (!isWrite) {
            const cached = getSessionPin();
            if (cached) { doFetch(cached); return; }
        }

        // Write or no session: prompt PIN
        showNumpad(doFetchAndSave);
    });
}

// ===== FIRST-RUN SETUP =====

function showSetupScreen() {
    setupMode = true;
    setupStep = 1;
    setupData = {};
    const overlay = document.getElementById('pinOverlay');
    const msg = document.getElementById('pinMessage');
    const setupFields = document.getElementById('setupFields');

    setupFields.style.display = 'block';
    msg.textContent = 'Choose your admin PIN';
    overlay.style.display = 'flex';
    overlay.dataset.pin = '';
    document.getElementById('pinDots').textContent = '';
}

function handleSetupPin(pin) {
    if (setupStep === 1) {
        setupData.pin = pin;
        setupStep = 2;
        document.getElementById('pinMessage').textContent = 'Confirm PIN';
        document.getElementById('pinOverlay').dataset.pin = '';
        document.getElementById('pinDots').textContent = '';
    } else if (setupStep === 2) {
        if (pin !== setupData.pin) {
            showPinError('PINs do not match');
            setupStep = 1;
            document.getElementById('pinMessage').textContent = 'Choose your admin PIN';
            return;
        }
        const nameInput = document.getElementById('setupName');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
            showPinError('Enter your name first');
            setupStep = 1;
            document.getElementById('pinMessage').textContent = 'Choose your admin PIN';
            return;
        }

        fetch('/api/auth/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, pin: pin })
        })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                setupMode = false;
                document.getElementById('setupFields').style.display = 'none';
                currentPin = pin;
                currentLevel = 3;
                currentOperatorName = name;
                // Start onboarding wizard instead of hiding
                startOnboardingWizard();
            } else {
                showPinError(data.error || 'Setup failed');
            }
        });
    }
}

// ===== ONBOARDING WIZARD =====

let onboardingStep = 3;
let onboardingData = {
    siteConfig: {},
    activeTests: [],
    createdOperators: []
};

function startOnboardingWizard() {
    // Hide numpad, show wizard
    document.getElementById('pinPad').style.display = 'none';
    const wizard = document.getElementById('onboardingWizard');
    wizard.style.display = 'block';
    onboardingStep = 3;
    showOnboardingStep3();
}

function renderStepHeader(wizard, step, title, subtitle) {
    const totalSteps = 6;
    wizard.innerHTML = '';

    // Step indicator text
    const indicator = document.createElement('div');
    indicator.className = 'wiz-step-indicator';
    indicator.textContent = 'Step ' + step + ' of ' + totalSteps;
    wizard.appendChild(indicator);

    // Step dots
    const dots = document.createElement('div');
    dots.className = 'wiz-step-dots';
    for (let i = 1; i <= totalSteps; i++) {
        const dot = document.createElement('div');
        dot.className = 'wiz-dot';
        if (i < step) dot.classList.add('done');
        if (i === step) dot.classList.add('active');
        dots.appendChild(dot);
    }
    wizard.appendChild(dots);

    // Title
    const h = document.createElement('div');
    h.className = 'wiz-title';
    h.textContent = title;
    wizard.appendChild(h);

    // Subtitle
    if (subtitle) {
        const sub = document.createElement('div');
        sub.className = 'wiz-subtitle';
        sub.textContent = subtitle;
        wizard.appendChild(sub);
    }
}

// ----- Step 3: Site Configuration -----

function showOnboardingStep3() {
    const wizard = document.getElementById('onboardingWizard');
    renderStepHeader(wizard, 3, 'Site Configuration', 'Configure your laboratory site');

    const form = document.createElement('div');
    form.className = 'wiz-form';

    // Fetch current config
    fetch('/api/config')
        .then(r => r.json())
        .then(config => {
            // Site name
            const nameInput = createInput({ id: 'wizSiteName', placeholder: 'Laboratory name', value: config.site_name || '' });
            form.appendChild(createField('Site Name', nameInput));

            // Site code
            const codeInput = createInput({ id: 'wizSiteCode', placeholder: '3-5 characters', value: config.site_code || '' });
            codeInput.maxLength = 5;
            form.appendChild(createField('Site Code', codeInput));

            // Country
            const countryInput = createInput({ id: 'wizCountry', placeholder: 'Country', value: config.country || '' });
            form.appendChild(createField('Country', countryInput));

            // Language
            const langGroup = createButtonGroup({
                items: [
                    { value: 'en', label: 'EN' },
                    { value: 'fr', label: 'FR' },
                    { value: 'ar', label: 'AR' }
                ],
                columns: 3
            });
            langGroup.setValue(config.default_language || 'en');
            form.appendChild(createField('Default Language', langGroup.element));

            wizard.appendChild(form);

            // Actions
            const actions = document.createElement('div');
            actions.className = 'wiz-actions';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'wiz-btn wiz-btn-next';
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', () => {
                const siteName = nameInput.value.trim();
                const siteCode = codeInput.value.trim().toUpperCase();
                const country = countryInput.value.trim();
                const lang = langGroup.getValue();

                if (!siteName) { nameInput.focus(); return; }
                if (siteCode.length < 3 || siteCode.length > 5) { codeInput.focus(); return; }
                if (!country) { countryInput.focus(); return; }

                // Save config
                fetch('/api/config', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Operator-Pin': currentPin
                    },
                    body: JSON.stringify({
                        site_name: siteName,
                        site_code: siteCode,
                        country: country,
                        default_language: lang || 'en'
                    })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.ok) {
                        onboardingData.siteConfig = {
                            site_name: siteName,
                            site_code: siteCode,
                            country: country,
                            default_language: lang || 'en'
                        };
                        showOnboardingStep4();
                    }
                });
            });
            actions.appendChild(nextBtn);
            wizard.appendChild(actions);
        });
}

// ----- Step 4: Active Tests -----

function showOnboardingStep4() {
    const wizard = document.getElementById('onboardingWizard');
    renderStepHeader(wizard, 4, 'Active Tests', 'Select the tests available at this site');

    // Fetch all tests
    fetch('/api/config/tests/all')
        .then(r => r.json())
        .then(tests => {
            const grid = document.createElement('div');
            grid.className = 'test-toggle-grid';

            const toggles = [];
            tests.forEach(t => {
                const btn = document.createElement('div');
                btn.className = 'test-toggle' + (t.is_active ? ' selected' : '');
                btn.innerHTML = '<span class="test-code">' + t.code + '</span>';
                btn.dataset.code = t.code;
                btn.addEventListener('click', () => {
                    btn.classList.toggle('selected');
                });
                grid.appendChild(btn);
                toggles.push(btn);
            });

            wizard.appendChild(grid);

            // Actions
            const actions = document.createElement('div');
            actions.className = 'wiz-actions';

            const backBtn = document.createElement('button');
            backBtn.className = 'wiz-btn wiz-btn-back';
            backBtn.textContent = 'Back';
            backBtn.addEventListener('click', showOnboardingStep3);
            actions.appendChild(backBtn);

            const nextBtn = document.createElement('button');
            nextBtn.className = 'wiz-btn wiz-btn-next';
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', () => {
                const activeCodes = toggles
                    .filter(b => b.classList.contains('selected'))
                    .map(b => b.dataset.code);

                fetch('/api/config/tests', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Operator-Pin': currentPin
                    },
                    body: JSON.stringify({ active_tests: activeCodes })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.ok) {
                        onboardingData.activeTests = activeCodes;
                        showOnboardingStep5();
                    }
                });
            });
            actions.appendChild(nextBtn);
            wizard.appendChild(actions);
        });
}

// ----- Step 5: Create Operators -----

function showOnboardingStep5() {
    const wizard = document.getElementById('onboardingWizard');
    renderStepHeader(wizard, 5, 'Create Operators', 'Add at least one supervisor and one technician');

    const content = document.createElement('div');
    content.className = 'wiz-form';

    // Created operators list
    const createdList = document.createElement('div');
    createdList.className = 'created-operators';
    createdList.id = 'createdOperatorsList';
    content.appendChild(createdList);

    // Render already-created operators
    function renderCreatedList() {
        createdList.innerHTML = '';
        onboardingData.createdOperators.forEach(op => {
            const row = document.createElement('div');
            row.className = 'created-op';
            row.innerHTML = '<span class="op-name">' + op.name + '</span>' +
                '<span class="op-badge ' + (op.level === 2 ? 'sup' : 'tech') + '">' +
                (op.level === 2 ? 'Supervisor' : 'Technician') + '</span>';
            createdList.appendChild(row);
        });
    }
    renderCreatedList();

    // Operator form card
    function createOperatorForm(level) {
        const card = document.createElement('div');
        card.className = 'operator-card';

        const header = document.createElement('div');
        header.className = 'op-header';
        const title = document.createElement('div');
        title.style.fontWeight = '700';
        title.textContent = level === 2 ? 'Add Supervisor' : 'Add Technician';
        header.appendChild(title);
        const badge = document.createElement('span');
        badge.className = 'op-level-badge level-' + level;
        badge.textContent = 'Level ' + level;
        header.appendChild(badge);
        card.appendChild(header);

        const nameInput = createInput({ placeholder: 'Operator name' });
        card.appendChild(createField('Name', nameInput));

        const pinInput = createInput({ placeholder: '4-8 digits', type: 'password' });
        pinInput.inputMode = 'numeric';
        pinInput.pattern = '[0-9]*';
        pinInput.maxLength = 8;
        card.appendChild(createField('PIN', pinInput));

        const addBtn = document.createElement('button');
        addBtn.className = 'wiz-btn wiz-btn-confirm';
        addBtn.textContent = 'Add';
        addBtn.style.width = '100%';
        addBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            const pin = pinInput.value.trim();
            if (!name) { nameInput.focus(); return; }
            if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
                pinInput.focus();
                return;
            }

            fetch('/api/auth/operators', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Operator-Pin': currentPin
                },
                body: JSON.stringify({ name: name, pin: pin, level: level })
            })
            .then(r => r.json())
            .then(data => {
                if (data.id) {
                    onboardingData.createdOperators.push({ name: data.name, level: data.level });
                    nameInput.value = '';
                    pinInput.value = '';
                    renderCreatedList();
                    updateNextBtn();
                }
            });
        });
        card.appendChild(addBtn);

        return card;
    }

    content.appendChild(createOperatorForm(2));
    content.appendChild(createOperatorForm(1));

    wizard.appendChild(content);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'wiz-actions';

    const backBtn = document.createElement('button');
    backBtn.className = 'wiz-btn wiz-btn-back';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', showOnboardingStep4);
    actions.appendChild(backBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'wiz-btn wiz-btn-next';
    nextBtn.textContent = 'Next';
    nextBtn.id = 'wizStep5Next';

    function updateNextBtn() {
        const hasSup = onboardingData.createdOperators.some(o => o.level === 2);
        const hasTech = onboardingData.createdOperators.some(o => o.level === 1);
        nextBtn.disabled = !(hasSup && hasTech);
        nextBtn.style.opacity = (hasSup && hasTech) ? '1' : '0.4';
    }
    updateNextBtn();

    nextBtn.addEventListener('click', () => {
        if (nextBtn.disabled) return;
        showOnboardingStep6();
    });
    actions.appendChild(nextBtn);

    // Skip option
    const skipBtn = document.createElement('button');
    skipBtn.className = 'wiz-btn wiz-btn-cancel';
    skipBtn.textContent = 'Skip';
    skipBtn.style.fontSize = '13px';
    skipBtn.style.minWidth = '60px';
    skipBtn.style.maxWidth = '80px';
    skipBtn.addEventListener('click', showOnboardingStep6);
    actions.appendChild(skipBtn);

    wizard.appendChild(actions);
}

// ----- Step 6: Complete -----

function showOnboardingStep6() {
    const wizard = document.getElementById('onboardingWizard');
    renderStepHeader(wizard, 6, 'Setup Complete', 'Your laboratory is ready');

    const recap = document.createElement('div');
    recap.className = 'recap-section';

    const siteName = onboardingData.siteConfig.site_name || 'Laboratory';
    const testCount = onboardingData.activeTests.length || '—';
    const opCount = onboardingData.createdOperators.length;

    const rows = [
        ['Site', siteName],
        ['Site Code', onboardingData.siteConfig.site_code || '—'],
        ['Country', onboardingData.siteConfig.country || '—'],
        ['Active Tests', testCount],
        ['Operators Created', opCount]
    ];

    rows.forEach(([label, value]) => {
        const row = document.createElement('div');
        row.className = 'recap-row';
        row.innerHTML = '<span class="recap-label">' + label + '</span><span class="recap-value">' + value + '</span>';
        recap.appendChild(row);
    });
    wizard.appendChild(recap);

    // Operator list in recap
    if (onboardingData.createdOperators.length > 0) {
        const opList = document.createElement('div');
        opList.className = 'created-operators';
        onboardingData.createdOperators.forEach(op => {
            const row = document.createElement('div');
            row.className = 'created-op';
            row.innerHTML = '<span class="op-name">' + op.name + '</span>' +
                '<span class="op-badge ' + (op.level === 2 ? 'sup' : 'tech') + '">' +
                (op.level === 2 ? 'Supervisor' : 'Technician') + '</span>';
            opList.appendChild(row);
        });
        wizard.appendChild(opList);
    }

    // Start button
    const actions = document.createElement('div');
    actions.className = 'wiz-actions';
    const startBtn = document.createElement('button');
    startBtn.className = 'wiz-btn wiz-btn-start';
    startBtn.textContent = 'Start using Liminal';
    startBtn.addEventListener('click', () => {
        wizard.style.display = 'none';
        document.getElementById('pinPad').style.display = '';
        hideNumpad();
        window.location.href = '/register';
    });
    actions.appendChild(startBtn);
    wizard.appendChild(actions);
}

// ===== DURESS MODE =====

function showDuressScreen() {
    const fakeNames = [
        'Jean Mukiza','Amina Diallo','Pierre Habimana','Fatou Keita','Joseph Ndayisaba',
        'Marie Uwimana','Ibrahim Sow','Grace Akello','Paul Nzeyimana','Aisha Bah',
        'Emmanuel Kabera','Claudine Mukamana','Hassan Traore','Rose Ingabire','David Ochieng',
        'Adama Camara','Felix Mugisha','Jeanne Iradukunda','Moussa Diop','Alice Nyirahabimana',
    ];
    const fakeTests = ['MAL_RDT','CBC','HIV','URINE','BG_RH','WIDAL','HBV','HCV'];
    const fakeResultMap = {
        'MAL_RDT': ['NEG','NEG','NEG','NEG','POS'],
        'HIV': ['NEG','NEG','NEG','NEG','NEG','NEG','POS'],
        'HBV': ['NEG','NEG','NEG','NEG','POS'],
        'HCV': ['NEG','NEG','NEG','NEG','NEG','POS'],
        'WIDAL': ['NEG','NEG','POS 1/80','POS 1/160'],
        'BG_RH': ['O+','O+','A+','B+','AB+','O-','A-'],
        'CBC': ['WBC:6.2 PLT:220 HCT:38','WBC:4.8 PLT:180 HCT:42','WBC:11.3 PLT:95 HCT:28'],
        'URINE': ['LEU:NEG NIT:NEG','LEU:+ NIT:NEG','LEU:NEG NIT:+'],
    };
    const fakeStatuses = ['completed','completed','review','completed','in_progress','completed','registered','completed'];
    const fakeWards = ['OPD','IPD','PED','ER','MATER','ICU'];

    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const rndAge = () => Math.floor(Math.random() * 65) + 1;
    const rndSex = () => Math.random() > 0.5 ? 'M' : 'F';
    const rndDate = () => { const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 30)); return d.toISOString().split('T')[0]; };
    const rndTime = () => `${String(7 + Math.floor(Math.random() * 10)).padStart(2,'0')}:${String(Math.floor(Math.random() * 60)).padStart(2,'0')}`;
    const rndLabNum = () => `LAB-2026-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4,'0')}`;

    // Build fake page in same theme
    const overlay = document.getElementById('pinOverlay');
    if (overlay) overlay.style.display = 'none';

    const main = document.querySelector('.content') || document.querySelector('main');
    const landing = document.getElementById('landingMode');
    if (landing) landing.style.display = 'none';

    const header = document.getElementById('appHeader');
    const nav = document.getElementById('appNav');
    if (header) header.style.display = '';
    if (nav) { nav.style.display = ''; nav.querySelectorAll('.nav-locked').forEach(l => l.classList.add('unlocked')); }

    // Build fake register view
    const fake = document.createElement('div');
    fake.style.cssText = 'max-width:700px;margin:0 auto;padding:0 16px 80px';

    // Day header
    const dayH = document.createElement('div');
    dayH.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:20px;padding:16px 0';
    const today = new Date().toISOString().split('T')[0];
    dayH.innerHTML = `<span style="font-size:22px;font-weight:700">${today}</span><span style="font-size:13px;color:#999">18 sample(s)</span>`;
    fake.appendChild(dayH);

    // Fake cards
    for (let i = 0; i < 18; i++) {
        const card = document.createElement('div');
        const st = rnd(fakeStatuses);
        card.className = 'sample-card status-' + st;

        const name = rnd(fakeNames);
        const labN = rndLabNum();
        const age = rndAge();
        const sex = rndSex();
        const ward = rnd(fakeWards);
        const tests = [];
        const nTests = 1 + Math.floor(Math.random() * 3);
        for (let j = 0; j < nTests; j++) {
            const t = rnd(fakeTests);
            if (!tests.includes(t)) tests.push(t);
        }

        let html = `<div class="card-top"><span class="card-lab-number">${labN}</span><span class="card-status ${st}">${st.replace('_',' ')}</span></div>`;
        html += `<div class="card-patient">${name}</div>`;
        html += `<div class="card-details">${age}Y · ${sex} · ${ward}</div>`;
        html += `<div class="card-tests">`;
        tests.forEach(t => {
            const v = (st === 'completed' || st === 'review') ? rnd(fakeResultMap[t] || ['NEG']) : '';
            const cls = (v && (v.startsWith('POS') || v === '+')) ? 'card-test-badge result-positive' : (v ? 'card-test-badge has-result' : 'card-test-badge');
            html += `<span class="${cls}">${t}${v ? ': ' + v : ''}</span>`;
        });
        html += `</div>`;

        card.innerHTML = html;
        fake.appendChild(card);
    }

    main.innerHTML = '';
    main.appendChild(fake);

    // Dark mode — subtle signal for legitimate operator
    document.body.style.background = '#1a1a1a';
    document.body.style.color = '#ccc';
    if (header) header.style.cssText += ';background:#222;border-color:#333';
    if (nav) nav.style.cssText += ';background:#222;border-color:#333';
    nav.querySelectorAll('.nav-link').forEach(l => l.style.color = '#aaa');
    fake.querySelectorAll('.sample-card').forEach(c => { c.style.background = '#2a2a2a'; c.style.borderColor = '#333'; });
    fake.querySelectorAll('.card-patient').forEach(c => c.style.color = '#ddd');
    fake.querySelectorAll('.card-details').forEach(c => c.style.color = '#888');
    fake.querySelectorAll('.card-lab-number').forEach(c => c.style.color = '#999');
}

// ===== NAV UNLOCK =====

function unlockNav() {
    // Use session if valid
    const cached = getSessionPin();
    if (cached && currentLevel > 0) {
        applyNavUnlock();
        return;
    }
    showNumpad(pin => {
        currentPin = pin;
        // Verify and cache session
        fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pin })
        }).then(r => r.json()).then(data => {
            if (data.id) setSession(pin, data.level);
        });
        applyNavUnlock();
    }, 'Enter PIN to unlock');
}

function applyNavUnlock() {
    const btn = document.getElementById('navUnlockBtn');
    document.querySelectorAll('.nav-locked').forEach(link => {
        const required = parseInt(link.dataset.unlock);
        if (currentLevel >= required) {
            link.classList.add('unlocked');
        }
    });
    if (btn && currentOperatorName) {
        btn.textContent = '\u{1F513} ' + currentOperatorName;
        btn.classList.add('active');
    }
    document.dispatchEvent(new CustomEvent('navUnlocked', { detail: { level: currentLevel } }));
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', () => {
    // Wire numpad buttons
    document.querySelectorAll('.pin-key').forEach(btn => {
        btn.addEventListener('click', () => pinKeyPress(btn.dataset.key));
    });

    // Wire nav unlock button
    const unlockBtn = document.getElementById('navUnlockBtn');
    if (unlockBtn) {
        unlockBtn.addEventListener('click', unlockNav);
    }

    // Check if first-run setup is needed (no operators exist)
    fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).then(r => {
        if (r.status === 400) {
            r.json().then(data => {
                if (data.error === 'name is required') {
                    showSetupScreen();
                }
            });
        }
    }).catch(() => {});
});
