const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 15000,
    use: {
        baseURL: 'http://localhost:5000',
        headless: true,
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
});
