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
