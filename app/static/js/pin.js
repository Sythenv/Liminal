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
    msg.textContent = message || t('pin_enter');
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
            showPinError(data.error || t('pin_invalid'));
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

// ===== SESSION (persisted in sessionStorage) =====

let sessionPin = null;
let sessionLevel = 0;
let sessionExpiry = 0;
const SESSION_TTL = 15 * 60 * 1000; // 15 minutes

// Restore session from sessionStorage on page load
try {
    const saved = JSON.parse(sessionStorage.getItem('liminal_session'));
    if (saved && saved.expiry > Date.now()) {
        sessionPin = saved.pin;
        sessionLevel = saved.level;
        sessionExpiry = saved.expiry;
        currentPin = saved.pin;
        currentLevel = saved.level;
        currentOperatorName = saved.name;
    }
} catch(e) {}

function setSession(pin, level, name) {
    sessionPin = pin;
    sessionLevel = level || 0;
    sessionExpiry = Date.now() + SESSION_TTL;
    currentPin = pin;
    currentLevel = level || 0;
    if (name) currentOperatorName = name;
    sessionStorage.setItem('liminal_session', JSON.stringify({
        pin: pin, level: level || 0, expiry: sessionExpiry, name: currentOperatorName
    }));
}

function getSessionPin() {
    if (sessionPin && Date.now() < sessionExpiry) return sessionPin;
    sessionPin = null;
    sessionLevel = 0;
    sessionStorage.removeItem('liminal_session');
    return null;
}

// ===== INACTIVITY LOCK =====
// Lock screen after 5 minutes of no interaction (clicks, keys, touches)

let _idleTimer = null;
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

function _resetIdleTimer() {
    if (_idleTimer) clearTimeout(_idleTimer);
    _idleTimer = setTimeout(_lockOnIdle, IDLE_TIMEOUT);
}

function _lockOnIdle() {
    if (!sessionPin) return; // already locked
    sessionPin = null;
    sessionLevel = 0;
    sessionExpiry = 0;
    currentPin = null;
    currentLevel = 0;
    currentOperatorName = null;
    sessionStorage.removeItem('liminal_session');
    // Reload to reset UI state (landing mode, locked nav)
    location.reload();
}

// Start idle tracking
['click', 'keydown', 'touchstart', 'mousemove'].forEach(evt => {
    document.addEventListener(evt, _resetIdleTimer, { passive: true });
});
_resetIdleTimer();

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
                if (r.status === 401) {
                    // Auth missing/invalid — re-prompt
                    sessionPin = null;
                    r.json().then(data => {
                        showNumpad(doFetchAndSave, data.error || 'Authentication required');
                    });
                } else {
                    // 403 (permission denied) and all other codes go to caller
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
                    currentPin = pin;
                    currentLevel = data.level;
                    currentOperatorName = data.name;
                    setSession(pin, data.level, data.name);
                }
            });
            doFetch(pin);
        };

        // Try cached PIN first (both reads and writes)
        const cached = currentPin || getSessionPin();
        if (cached) { doFetch(cached); return; }

        // No PIN available: prompt
        showNumpad(doFetchAndSave);
    });
}

// ===== FIRST-RUN SETUP (7-screen onboarding) =====

let onboardingData = {
    siteConfig: {},
    activeTests: [],
    createdOperators: []
};

function showSetupScreen() {
    setupMode = true;
    setupStep = 1;
    setupData = {};
    onboardingData = { siteConfig: {}, activeTests: [], createdOperators: [] };
    showObScreen1();
}

// --- Helper: render step dots (screens 1-7) ---
function renderObDots(container, current) {
    const dots = document.createElement('div');
    dots.className = 'ob-step-dots';
    for (let i = 1; i <= 7; i++) {
        const d = document.createElement('div');
        d.className = 'ob-dot';
        if (i < current) d.classList.add('done');
        if (i === current) d.classList.add('active');
        dots.appendChild(d);
    }
    container.appendChild(dots);
}

// --- Helper: clear wizard and prepare fresh screen ---
function obReset() {
    const wiz = document.getElementById('onboardingWizard');
    wiz.innerHTML = '';
    wiz.style.display = 'block';
    return wiz;
}

// ==========================================
//  SCREEN 1: Welcome — admin name entry
// ==========================================
function showObScreen1() {
    const overlay = document.getElementById('pinOverlay');
    overlay.style.display = 'flex';
    overlay.dataset.pin = '';
    // Hide numpad, show wizard
    document.getElementById('pinPad').style.display = 'none';
    const wiz = obReset();

    renderObDots(wiz, 1);

    const title = document.createElement('div');
    title.className = 'ob-title';
    title.textContent = t('ob_welcome');
    wiz.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'ob-subtitle';
    sub.textContent = t('ob_whats_your_name');
    wiz.appendChild(sub);

    const nameInput = document.createElement('input');
    nameInput.className = 'ob-input-big';
    nameInput.type = 'text';
    nameInput.placeholder = t('ob_your_name');
    nameInput.autocomplete = 'off';
    if (setupData.name) nameInput.value = setupData.name;
    wiz.appendChild(nameInput);

    const actions = document.createElement('div');
    actions.className = 'ob-actions';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'ob-btn ob-btn-primary';
    nextBtn.textContent = t('ob_continue');
    nextBtn.disabled = !nameInput.value.trim();
    nameInput.addEventListener('input', () => {
        nextBtn.disabled = !nameInput.value.trim();
    });
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && nameInput.value.trim()) showObScreen2();
    });
    nextBtn.addEventListener('click', () => {
        if (!nameInput.value.trim()) return;
        showObScreen2();
    });
    actions.appendChild(nextBtn);
    wiz.appendChild(actions);

    // Store name on transition
    function showObScreen2() {
        setupData.name = nameInput.value.trim();
        obGoScreen2();
    }

    setTimeout(() => nameInput.focus(), 100);
}

// ==========================================
//  SCREEN 2: Choose PIN
// ==========================================
function obGoScreen2() {
    setupMode = true;
    setupStep = 2;
    const overlay = document.getElementById('pinOverlay');
    overlay.dataset.pin = '';

    // Show numpad, hide wizard
    document.getElementById('pinPad').style.display = '';
    const wiz = obReset();
    wiz.style.display = 'none';

    // Update numpad message area
    document.getElementById('pinDots').textContent = '';
    document.getElementById('pinError').style.display = 'none';
    const msg = document.getElementById('pinMessage');
    msg.style.display = 'block';
    msg.innerHTML = '<span class="ob-greeting">' + t('ob_hi') + ' ' + escapeHtml(setupData.name) + '</span><br>' + t('pin_choose');
    // Hide demo hint during setup
    var hint = document.querySelector('.pin-demo-hint');
    if (hint) hint.style.display = 'none';

    // Remove start over link if present
    var so = document.getElementById('obStartOver');
    if (so) so.remove();

    shuffleNumpad();
}

// ==========================================
//  SCREEN 3: Confirm PIN
// ==========================================
function obGoScreen3() {
    setupStep = 3;
    const overlay = document.getElementById('pinOverlay');
    overlay.dataset.pin = '';
    document.getElementById('pinDots').textContent = '';
    document.getElementById('pinError').style.display = 'none';
    const msg = document.getElementById('pinMessage');
    msg.style.display = 'block';
    msg.textContent = t('pin_confirm');
    shuffleNumpad();

    // Add "start over" link below demo hints
    let startOver = document.getElementById('obStartOver');
    if (!startOver) {
        startOver = document.createElement('button');
        startOver.id = 'obStartOver';
        startOver.className = 'ob-back';
        startOver.textContent = t('pin_start_over');
        startOver.style.marginTop = '12px';
        startOver.addEventListener('click', () => {
            startOver.remove();
            setupData = {};
            showObScreen1();
        });
        document.getElementById('pinPad').appendChild(startOver);
    }
}

// ==========================================
//  handleSetupPin — routes PIN entry for screens 2 & 3
// ==========================================
function handleSetupPin(pin) {
    if (setupStep === 2) {
        // Screen 2: store chosen PIN, advance to screen 3
        setupData.pin = pin;
        obGoScreen3();
    } else if (setupStep === 3) {
        // Screen 3: confirm PIN
        if (pin !== setupData.pin) {
            showPinError(t('pin_no_match'));
            // Back to screen 2 to re-enter PIN
            setupData.pin = null;
            obGoScreen2();
            return;
        }
        // PINs match — call setup API
        fetch('/api/auth/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: setupData.name, pin: pin })
        })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                setupMode = false;
                currentPin = pin;
                currentLevel = 3;
                currentOperatorName = setupData.name;
                setSession(pin, 3, setupData.name);
                obGoScreen4();
            } else {
                showPinError(data.error || t('failed'));
            }
        });
    }
}

// --- Helper: escape HTML ---
function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// ==========================================
//  SCREEN 4: Your Lab (site config)
// ==========================================
function obGoScreen4() {
    // Hide numpad, show wizard
    document.getElementById('pinPad').style.display = 'none';
    var hint = document.querySelector('.pin-demo-hint');
    if (hint) hint.style.display = '';
    const msg = document.getElementById('pinMessage');
    msg.style.display = 'none';

    const wiz = obReset();
    renderObDots(wiz, 4);

    const title = document.createElement('div');
    title.className = 'ob-title';
    title.textContent = t('ob_configure');
    wiz.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'ob-subtitle';
    sub.textContent = t('ob_basic_info');
    wiz.appendChild(sub);

    const form = document.createElement('div');
    form.className = 'ob-form';

    // Fetch current config
    fetch('/api/config')
        .then(r => r.json())
        .then(config => {
            const nameInput = createInput({ id: 'obSiteName', placeholder: t('ob_site_name'), value: config.site_name || '' });
            form.appendChild(createField(t('ob_site_name'), nameInput));

            const codeInput = createInput({ id: 'obSiteCode', placeholder: '3-5', value: config.site_code || '' });
            codeInput.maxLength = 5;
            form.appendChild(createField(t('ob_site_code'), codeInput));

            const countryInput = createInput({ id: 'obCountry', placeholder: t('ob_country'), value: config.country || '' });
            form.appendChild(createField(t('ob_country'), countryInput));

            const langGroup = createButtonGroup({
                items: [
                    { value: 'en', label: 'EN' },
                    { value: 'fr', label: 'FR' },
                    { value: 'ar', label: 'AR' }
                ],
                columns: 3
            });
            langGroup.setValue(config.default_language || 'en');
            form.appendChild(createField(t('ob_default_lang'), langGroup.element));

            wiz.appendChild(form);

            const actions = document.createElement('div');
            actions.className = 'ob-actions';

            const nextBtn = document.createElement('button');
            nextBtn.className = 'ob-btn ob-btn-primary';
            nextBtn.textContent = t('next');
            nextBtn.addEventListener('click', () => {
                const siteName = nameInput.value.trim();
                const siteCode = codeInput.value.trim().toUpperCase();
                const country = countryInput.value.trim();
                const lang = langGroup.getValue();

                if (!siteName) { nameInput.focus(); return; }
                if (siteCode.length < 3 || siteCode.length > 5) { codeInput.focus(); return; }
                if (!country) { countryInput.focus(); return; }

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
                        obGoScreen5();
                    }
                });
            });
            actions.appendChild(nextBtn);
            wiz.appendChild(actions);
        });
}

// ==========================================
//  SCREEN 5: Active Tests
// ==========================================
function obGoScreen5() {
    const wiz = obReset();
    renderObDots(wiz, 5);

    const title = document.createElement('div');
    title.className = 'ob-title';
    title.textContent = t('ob_active_tests');
    wiz.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'ob-subtitle';
    sub.textContent = t('ob_select_tests');
    wiz.appendChild(sub);

    fetch('/api/config/tests/all')
        .then(r => r.json())
        .then(tests => {
            const grid = document.createElement('div');
            grid.className = 'ob-test-grid';

            const toggles = [];
            tests.forEach(t => {
                const btn = document.createElement('div');
                btn.className = 'ob-test-toggle' + (t.is_active ? ' selected' : '');
                btn.textContent = t.code;
                btn.dataset.code = t.code;
                btn.addEventListener('click', () => btn.classList.toggle('selected'));
                grid.appendChild(btn);
                toggles.push(btn);
            });
            wiz.appendChild(grid);

            const actions = document.createElement('div');
            actions.className = 'ob-actions';

            const backBtn = document.createElement('button');
            backBtn.className = 'ob-back';
            backBtn.textContent = t('back');
            backBtn.addEventListener('click', obGoScreen4);
            actions.appendChild(backBtn);

            const nextBtn = document.createElement('button');
            nextBtn.className = 'ob-btn ob-btn-primary';
            nextBtn.textContent = t('next');
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
                        obGoScreen6();
                    }
                });
            });
            actions.appendChild(nextBtn);
            wiz.appendChild(actions);
        });
}

// ==========================================
//  SCREEN 6: Your Team
// ==========================================
function obGoScreen6() {
    const wiz = obReset();
    renderObDots(wiz, 6);

    const title = document.createElement('div');
    title.className = 'ob-title';
    title.textContent = t('ob_your_team');
    wiz.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'ob-subtitle';
    sub.textContent = t('ob_add_team_hint');
    wiz.appendChild(sub);

    const layout = document.createElement('div');
    layout.className = 'ob-team-layout';

    // Pills area for created operators
    const pills = document.createElement('div');
    pills.className = 'ob-pills';
    pills.id = 'obPills';
    layout.appendChild(pills);

    function renderPills() {
        pills.innerHTML = '';
        onboardingData.createdOperators.forEach(op => {
            const pill = document.createElement('span');
            pill.className = 'ob-pill ' + (op.level === 2 ? 'sup' : 'tech');
            pill.textContent = op.name + ' \u00b7 ' + (op.level === 2 ? 'Sup' : 'Tech');
            pills.appendChild(pill);
        });
    }
    renderPills();

    // Operator form builder
    function buildOpForm(level) {
        const card = document.createElement('div');
        card.className = 'ob-op-card';

        const header = document.createElement('div');
        header.className = 'ob-op-card-header';
        const cardTitle = document.createElement('div');
        cardTitle.className = 'ob-op-card-title';
        cardTitle.textContent = level === 2 ? t('ob_add_supervisor') : t('ob_add_technician');
        header.appendChild(cardTitle);
        const badge = document.createElement('span');
        badge.className = 'ob-level-badge level-' + level;
        badge.textContent = 'L' + level;
        header.appendChild(badge);
        card.appendChild(header);

        const nameInput = document.createElement('input');
        nameInput.placeholder = t('name');
        nameInput.type = 'text';
        card.appendChild(nameInput);

        const pinInput = document.createElement('input');
        pinInput.placeholder = t('ob_pin_hint');
        pinInput.type = 'password';
        pinInput.inputMode = 'numeric';
        pinInput.pattern = '[0-9]*';
        pinInput.maxLength = 8;
        card.appendChild(pinInput);

        const errMsg = document.createElement('div');
        errMsg.style.cssText = 'font-size:12px;color:var(--danger);margin-bottom:8px;display:none';
        card.appendChild(errMsg);

        const addBtn = document.createElement('button');
        addBtn.className = 'ob-op-add';
        addBtn.textContent = t('add');
        addBtn.addEventListener('click', () => {
            errMsg.style.display = 'none';
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
            .then(r => r.json().then(d => ({ status: r.status, data: d })))
            .then(({ status, data }) => {
                if (data.id) {
                    onboardingData.createdOperators.push({ name: data.name, level: data.level });
                    nameInput.value = '';
                    pinInput.value = '';
                    renderPills();
                    updateNextBtn();
                } else {
                    errMsg.textContent = data.error || t('failed');
                    errMsg.style.display = 'block';
                }
            });
        });
        card.appendChild(addBtn);
        return card;
    }

    const grid = document.createElement('div');
    grid.className = 'ob-team-grid';
    grid.appendChild(buildOpForm(2));
    grid.appendChild(buildOpForm(1));
    layout.appendChild(grid);

    // Navigation
    const actions = document.createElement('div');
    actions.className = 'ob-actions';

    const backBtn = document.createElement('button');
    backBtn.className = 'ob-back';
    backBtn.textContent = t('back');
    backBtn.addEventListener('click', obGoScreen5);
    actions.appendChild(backBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'ob-btn ob-btn-primary';
    nextBtn.textContent = 'Next \u2192';
    nextBtn.id = 'obTeamNext';

    function updateNextBtn() {
        const hasSup = onboardingData.createdOperators.some(o => o.level === 2);
        const hasTech = onboardingData.createdOperators.some(o => o.level === 1);
        nextBtn.disabled = !(hasSup && hasTech);
    }
    updateNextBtn();

    nextBtn.addEventListener('click', () => {
        if (nextBtn.disabled) return;
        obGoScreen7();
    });
    actions.appendChild(nextBtn);
    actions.appendChild(nextBtn);
    layout.appendChild(actions);

    const skipBtn = document.createElement('button');
    skipBtn.className = 'ob-skip';
    skipBtn.textContent = t('ob_skip');
    skipBtn.addEventListener('click', obGoScreen7);
    layout.appendChild(skipBtn);

    wiz.appendChild(layout);
}

// ==========================================
//  SCREEN 7: Ready!
// ==========================================
function obGoScreen7() {
    const wiz = obReset();
    // No dots on final screen

    // Animated checkmark SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 52 52');
    svg.className.baseVal = 'ob-check-circle';
    svg.innerHTML = '<circle cx="26" cy="26" r="25"/><polyline points="16 27 22 33 36 19"/>';
    wiz.appendChild(svg);

    const siteName = onboardingData.siteConfig.site_name || 'Your laboratory';
    const title = document.createElement('div');
    title.className = 'ob-title';
    title.textContent = siteName + ' ' + t('ob_is_ready');
    wiz.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'ob-subtitle';
    sub.style.marginBottom = '20px';
    const siteCode = onboardingData.siteConfig.site_code || '\u2014';
    const testCount = onboardingData.activeTests.length;
    const opCount = onboardingData.createdOperators.length;
    sub.innerHTML = t('ob_code') + ': <strong>' + escapeHtml(siteCode) + '</strong><br>' +
        testCount + ' ' + t('ob_tests_count') + (testCount !== 1 ? 's' : '') + '<br>' +
        opCount + ' ' + t('ob_ops_count') + (opCount !== 1 ? 's' : '') + ' ' + t('ob_created');
    wiz.appendChild(sub);

    // Recap
    const recap = document.createElement('div');
    recap.className = 'ob-recap';
    const rows = [
        [t('ob_site'), siteName],
        [t('ob_code'), siteCode],
        [t('ob_country'), onboardingData.siteConfig.country || '\u2014'],
        [t('tests'), testCount],
        [t('ob_ops_count') + 's', opCount + 1] // +1 for admin
    ];
    rows.forEach(([label, value]) => {
        const row = document.createElement('div');
        row.className = 'ob-recap-row';
        row.innerHTML = '<span class="ob-recap-label">' + escapeHtml(String(label)) + '</span><span class="ob-recap-value">' + escapeHtml(String(value)) + '</span>';
        recap.appendChild(row);
    });
    wiz.appendChild(recap);

    const startBtn = document.createElement('button');
    startBtn.className = 'ob-btn ob-btn-green';
    startBtn.textContent = t('ob_start_using');
    startBtn.addEventListener('click', () => {
        wiz.style.display = 'none';
        document.getElementById('pinPad').style.display = '';
        // Restore demo hint
        var hint = document.querySelector('.pin-demo-hint');
        if (hint) hint.style.display = '';
        hideNumpad();
        window.location.href = '/register';
    });
    wiz.appendChild(startBtn);
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
            if (data.id) setSession(pin, data.level, data.name);
        });
        applyNavUnlock();
    }, t('pin_unlock'));
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

    // Auto-unlock nav if session is still valid (works on all pages)
    const cached = getSessionPin();
    if (cached && currentLevel >= 1) {
        applyNavUnlock();
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
