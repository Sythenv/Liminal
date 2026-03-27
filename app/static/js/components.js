/* Shared UI Components */

/**
 * Create a button group for single or multi-select.
 * @param {Object} options
 * @param {Array} options.items - [{value, label}] or ['A','B','C'] (shorthand)
 * @param {number} options.columns - grid columns (default: items.length or 4)
 * @param {boolean} options.multiple - allow multi-select (default: false)
 * @param {string} options.className - extra class on container
 * @param {Function} options.onSelect - callback(value) for single, callback([values]) for multi
 * @returns {{ element: HTMLElement, getValue: Function, setValue: Function, reset: Function }}
 */
function createButtonGroup(options) {
    const items = (options.items || []).map(item =>
        typeof item === 'string' ? { value: item, label: item } : item
    );
    const multiple = options.multiple || false;
    const columns = options.columns || Math.min(items.length, 4);
    const onSelect = options.onSelect || null;

    const container = document.createElement('div');
    container.className = 'btn-group' + (options.className ? ' ' + options.className : '');
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

    items.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-group-item';
        btn.textContent = item.label;
        btn.dataset.value = item.value;

        btn.addEventListener('click', () => {
            if (multiple) {
                btn.classList.toggle('selected');
            } else {
                container.querySelectorAll('.btn-group-item').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            }
            if (onSelect) {
                onSelect(multiple ? getValues() : btn.dataset.value);
            }
        });

        container.appendChild(btn);
    });

    function getValues() {
        return Array.from(container.querySelectorAll('.btn-group-item.selected'))
            .map(b => b.dataset.value);
    }

    function getValue() {
        if (multiple) return getValues();
        const sel = container.querySelector('.btn-group-item.selected');
        return sel ? sel.dataset.value : null;
    }

    function setValue(val) {
        container.querySelectorAll('.btn-group-item').forEach(b => {
            if (multiple) {
                b.classList.toggle('selected', Array.isArray(val) ? val.includes(b.dataset.value) : b.dataset.value === val);
            } else {
                b.classList.toggle('selected', b.dataset.value === val);
            }
        });
    }

    function reset() {
        container.querySelectorAll('.btn-group-item').forEach(b => b.classList.remove('selected'));
    }

    return { element: container, getValue, setValue, reset };
}

/**
 * Create a POS/NEG button pair (or any two-option toggle with color coding).
 * @param {Object} options
 * @param {string} options.code - data attribute for identification
 * @param {Array} options.options - [{value, label, color}] default: POS/NEG
 * @param {string} options.currentValue - pre-selected value
 * @param {Function} options.onSelect - callback(value)
 * @returns {{ element: HTMLElement, getValue: Function, setValue: Function }}
 */
function createPosNegGroup(options) {
    const opts = options.options || [
        { value: 'POS', label: 'POS', cls: 'pos' },
        { value: 'NEG', label: 'NEG', cls: 'neg' }
    ];
    const code = options.code || '';
    const onSelect = options.onSelect || null;

    const container = document.createElement('div');
    container.className = 'posneg-btns';

    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'posneg-btn ' + (opt.cls || '');
        if (options.currentValue === opt.value) btn.className += ' selected';
        btn.textContent = opt.label;
        btn.dataset.code = code;
        btn.dataset.value = opt.value;

        btn.addEventListener('click', () => {
            container.querySelectorAll('.posneg-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            if (onSelect) onSelect(opt.value);
        });

        container.appendChild(btn);
    });

    function getValue() {
        const sel = container.querySelector('.posneg-btn.selected');
        return sel ? sel.dataset.value : null;
    }

    function setValue(val) {
        container.querySelectorAll('.posneg-btn').forEach(b => {
            b.classList.toggle('selected', b.dataset.value === val);
        });
    }

    return { element: container, getValue, setValue };
}

/**
 * Create a labeled field wrapper.
 * @param {string} label - field label text
 * @param {HTMLElement} content - the input/button group element
 * @returns {HTMLElement}
 */
function createField(label, content) {
    const div = document.createElement('div');
    div.className = 'big-field';
    const lbl = document.createElement('label');
    lbl.textContent = label;
    div.appendChild(lbl);
    div.appendChild(content);
    return div;
}

/**
 * Generate a Code 128B barcode as an SVG element.
 * @param {string} text - text to encode
 * @param {Object} opts - { height: 40, barWidth: 1.5 }
 * @returns {SVGElement}
 */
function createBarcode(text, opts) {
    const h = (opts && opts.height) || 40;
    const w = (opts && opts.barWidth) || 1.5;

    // Code 128B encoding table (values 0-106)
    const PATTERNS = [
        '11011001100','11001101100','11001100110','10010011000','10010001100',
        '10001001100','10011001000','10011000100','10001100100','11001001000',
        '11001000100','11000100100','10110011100','10011011100','10011001110',
        '10111001100','10011101100','10011100110','11001110010','11001011100',
        '11001001110','11011100100','11001110100','11100101100','11100100110',
        '11101100100','11100110100','11100110010','11011011000','11011000110',
        '11000110110','10100011000','10001011000','10001000110','10110001000',
        '10001101000','10001100010','11010001000','11000101000','11000100010',
        '10110111000','10110001110','10001101110','10111011000','10111000110',
        '10001110110','11101110110','11010001110','11000101110','11011101000',
        '11011100010','11011101110','11101011000','11101000110','11100010110',
        '11101101000','11101100010','11100011010','11101111010','11001000010',
        '11110001010','10100110000','10100001100','10010110000','10010000110',
        '10000101100','10000100110','10110010000','10110000100','10011010000',
        '10011000010','10000110100','10000110010','11000010010','11001010000',
        '11110111010','11000010100','10001111010','10100111100','10010111100',
        '10010011110','10111100100','10011110100','10011110010','11110100100',
        '11110010100','11110010010','11011011110','11011110110','11110110110',
        '10101111000','10100011110','10001011110','10111101000','10111100010',
        '11110101000','11110100010','10111011110','10111101110','11101011110',
        '11110101110','11010000100','11010010000','11010011100','1100011101011'
    ];

    // Start code B = 104
    let codes = [104];
    let checksum = 104;
    for (let i = 0; i < text.length; i++) {
        const val = text.charCodeAt(i) - 32;
        codes.push(val);
        checksum += val * (i + 1);
    }
    codes.push(checksum % 103);
    codes.push(106); // Stop

    let bits = '';
    codes.forEach(c => bits += PATTERNS[c]);

    const totalW = bits.length * w;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', totalW);
    svg.setAttribute('height', h + 14);
    svg.setAttribute('viewBox', `0 0 ${totalW} ${h + 14}`);
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    let x = 0;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] === '1') {
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', 0);
            rect.setAttribute('width', w);
            rect.setAttribute('height', h);
            rect.setAttribute('fill', '#2d2d2d');
            svg.appendChild(rect);
        }
        x += w;
    }

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', totalW / 2);
    label.setAttribute('y', h + 11);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '10');
    label.setAttribute('font-family', 'SF Mono, Consolas, monospace');
    label.setAttribute('fill', '#666');
    label.textContent = text;
    svg.appendChild(label);

    return svg;
}

// ===== MODAL SYSTEM =====

/**
 * Show a modal dialog. Replaces native alert/confirm/prompt.
 * @param {Object} opts
 * @param {string} opts.title - Modal title
 * @param {string} opts.message - Body text (supports HTML)
 * @param {string} opts.type - 'info' | 'warning' | 'danger' | 'success' (default: 'info')
 * @param {Array} opts.actions - [{label, cls, callback}] buttons. Default: OK button.
 *   cls: 'primary' | 'danger' | 'cancel' | 'ghost'
 * @returns {HTMLElement} the overlay (auto-removed on close)
 *
 * Usage:
 *   showModal({ title: 'Done', message: 'Saved.', type: 'success' })
 *   showModal({ title: 'Delete?', message: 'Cannot undo.', type: 'danger',
 *     actions: [
 *       { label: 'Cancel', cls: 'cancel' },
 *       { label: 'Delete', cls: 'danger', callback: () => doDelete() }
 *     ]
 *   })
 */
function showModal(opts) {
    const type = opts.type || 'info';
    const icons = { info: '\u2139', warning: '\u26A0', danger: '\u26A0', success: '\u2713' };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = 'modal-card';

    // Icon
    const icon = document.createElement('div');
    icon.className = 'modal-icon modal-icon-' + type;
    icon.textContent = icons[type] || '';
    card.appendChild(icon);

    // Title
    if (opts.title) {
        const title = document.createElement('div');
        title.className = 'modal-title';
        title.textContent = opts.title;
        card.appendChild(title);
    }

    // Message
    if (opts.message) {
        const msg = document.createElement('div');
        msg.className = 'modal-message';
        msg.innerHTML = opts.message;
        card.appendChild(msg);
    }

    // Actions
    const actions = opts.actions || [{ label: 'OK', cls: 'primary' }];
    const btnRow = document.createElement('div');
    btnRow.className = 'modal-actions';
    actions.forEach(a => {
        const btn = document.createElement('button');
        btn.className = 'modal-btn modal-btn-' + (a.cls || 'primary');
        btn.textContent = a.label;
        btn.addEventListener('click', () => {
            overlay.remove();
            if (a.callback) a.callback();
        });
        btnRow.appendChild(btn);
    });
    card.appendChild(btnRow);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    return overlay;
}

/**
 * Create a text/number input field.
 * @param {Object} options
 * @param {string} options.id - element id
 * @param {string} options.type - input type (default: 'text')
 * @param {string} options.value - initial value
 * @param {string} options.placeholder
 * @returns {HTMLInputElement}
 */
function createInput(options) {
    const input = document.createElement('input');
    input.type = options.type || 'text';
    input.className = 'big-input';
    if (options.id) input.id = options.id;
    if (options.value != null) input.value = options.value;
    if (options.placeholder) input.placeholder = options.placeholder;
    if (options.min != null) input.min = options.min;
    if (options.max != null) input.max = options.max;
    return input;
}
