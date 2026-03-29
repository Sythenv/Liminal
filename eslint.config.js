export default [
    {
        files: ["app/static/js/**/*.js"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "script",
            globals: {
                // Browser globals
                document: "readonly",
                window: "readonly",
                fetch: "readonly",
                localStorage: "readonly",
                sessionStorage: "readonly",
                location: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                console: "readonly",
                HTMLElement: "readonly",
                XMLSerializer: "readonly",
                Intl: "readonly",
                FormData: "readonly",
                Promise: "readonly",
                CustomEvent: "readonly",
                Date: "readonly",
                Array: "readonly",
                JSON: "readonly",
                Math: "readonly",
                // Our globals (loaded via script tags)
                t: "readonly",
                getCurrentLang: "readonly",
                applyTranslations: "readonly",
                authFetch: "readonly",
                showModal: "readonly",
                createCard: "readonly",
                createBarcode: "readonly",
                createButtonGroup: "readonly",
                createPosNegGroup: "readonly",
                createField: "readonly",
                createInput: "readonly",
                showNumpad: "readonly",
                hideNumpad: "readonly",
                pinProtect: "readonly",
                unlockNav: "readonly",
                applyNavUnlock: "readonly",
                currentPin: "writable",
                currentLevel: "writable",
                currentOperatorName: "writable",
                getSessionPin: "readonly",
                setSession: "readonly",
                escapeHtml: "readonly",
                printConfig: "writable",
                STRUCTURED_TESTS: "readonly",
                formatStructuredBadge: "readonly",
            }
        },
        rules: {
            // The 3 rules that catch 80% of our bugs
            "no-shadow": "error",           // Would have caught t/t() conflict
            "no-undef": "error",            // Catches typos in variable names
            "no-unused-vars": ["warn", { "args": "none" }],  // Dead code detection
        }
    }
];
