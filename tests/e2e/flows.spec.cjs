// @ts-check
const { test, expect } = require('@playwright/test');

// --- Helpers ---

/** Type a PIN on the shuffled numpad */
async function enterPin(page, pin) {
    await page.waitForSelector('#pinOverlay[style*="flex"]', { timeout: 5000 });
    for (const digit of pin.split('')) {
        await page.click(`.pin-key[data-key="${digit}"]`);
    }
    await page.click('.pin-key[data-key="ok"]');
}

/** Enter PIN only if the overlay appears (authFetch may use cached session) */
async function enterPinIfNeeded(page, pin) {
    try {
        await page.waitForSelector('#pinOverlay[style*="flex"]', { timeout: 1500 });
        for (const digit of pin.split('')) {
            await page.click(`.pin-key[data-key="${digit}"]`);
        }
        await page.click('.pin-key[data-key="ok"]');
    } catch {
        // PIN was cached in session, no numpad shown
    }
}

/** Unlock from landing via the lock icon + PIN */
async function unlockFromLanding(page, pin) {
    await page.click('#landingUnlockBtn');
    await enterPin(page, pin);
}

/** Wait for worklist to be visible */
async function waitForWorklist(page) {
    await expect(page.locator('#worklistMode')).toBeVisible({ timeout: 5000 });
}

// Demo PINs (LIMINAL_DEMO=1)
const PIN_ADMIN = '0777';    // L3
const PIN_SUP = '0755';      // L2
const PIN_TECH = '0644';     // L1

// =============================================================
// FLOW 1: Landing → PIN → Worklist
// =============================================================

test.describe('Flow 1: PIN → Worklist', () => {
    test('landing page shows logo and lock button', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#landingMode')).toBeVisible();
        await expect(page.locator('#landingUnlockBtn')).toBeVisible();
    });

    test('admin PIN opens worklist', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        // Operator name in header
        await expect(page.locator('#headerOperator')).toContainText('Admin');
    });

    test('tech PIN opens worklist', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_TECH);
        await waitForWorklist(page);

        await expect(page.locator('#headerOperator')).toContainText('Technician');
    });

    test('wrong PIN shows error', async ({ page }) => {
        await page.goto('/');
        await page.click('#landingUnlockBtn');
        await page.waitForSelector('#pinOverlay[style*="flex"]', { timeout: 5000 });
        // Enter wrong PIN
        for (const d of '9753') {
            await page.click(`.pin-key[data-key="${d}"]`);
        }
        await page.click('.pin-key[data-key="ok"]');
        await expect(page.locator('#pinError')).toBeVisible({ timeout: 3000 });
    });
});

// =============================================================
// FLOW 2: Worklist display + Show all toggle
// =============================================================

test.describe('Flow 2: Worklist', () => {
    test('worklist shows cards grouped by test type', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        // Should have group headers (test type names)
        const headers = page.locator('.wl-group-header');
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThan(0);

        // Should have sample cards
        const cards = page.locator('#worklistCards .sample-card');
        const cardCount = await cards.count();
        expect(cardCount).toBeGreaterThan(0);
    });

    test('COMPLETED today shown with "To print" separator', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        // Check for separator
        const sep = page.locator('.wl-separator');
        const sepCount = await sep.count();
        if (sepCount > 0) {
            await expect(sep.first()).toBeVisible();
        }
    });

    test('Show all toggle changes view', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        // Click Show all
        await page.click('#wlToggleHeader');
        await page.waitForTimeout(500);

        // Should show entries (including COMPLETED)
        const cards = await page.locator('#worklistCards .sample-card').count();
        expect(cards).toBeGreaterThan(0);

        // Toggle button should now say "My work"
        const toggleText = await page.locator('#wlToggleHeader').textContent();
        expect(toggleText.toLowerCase()).toContain('my work');
    });
});

// =============================================================
// FLOW 3: Click card → Result modal opens
// =============================================================

test.describe('Flow 3: Card click → Modal', () => {
    test('click REGISTERED card opens result modal', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        // Find a card and click it
        const card = page.locator('#worklistCards .sample-card').first();
        await expect(card).toBeVisible({ timeout: 3000 });
        await card.click();

        // Result modal should open
        await expect(page.locator('#resultModal')).toBeVisible({ timeout: 5000 });

        // Should show patient name in header
        const header = await page.locator('#resultPatientName').textContent();
        expect(header.length).toBeGreaterThan(0);
    });

    test('click Show all then click COMPLETED card opens modal with Print button', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        // Show all to see COMPLETED
        await page.click('#wlToggleHeader');
        await page.waitForTimeout(500);

        // Find a completed card
        const completedCard = page.locator('.sample-card.status-completed').first();
        const hasCompleted = await completedCard.count();
        if (hasCompleted === 0) {
            test.skip();
            return;
        }

        await completedCard.click();
        await expect(page.locator('#resultModal')).toBeVisible({ timeout: 5000 });

        // Should have a Print button in footer
        await expect(page.locator('#btnPrintFromModal')).toBeVisible();
    });
});

// =============================================================
// FLOW 4: Wizard → New entry
// =============================================================

test.describe('Flow 4: New entry via wizard', () => {
    test('FAB opens wizard, create entry appears in worklist', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        // Click FAB
        await page.click('#btnNewEntry');
        await expect(page.locator('#wizardModal')).toBeVisible();

        // Step 1: Patient info
        const uniqueName = 'E2E-' + Date.now();
        await page.fill('#wPatientName', uniqueName);
        await page.fill('#wAge', '25');
        await page.click('.sex-btn[data-sex="F"]');
        await page.click('.ward-btn[data-ward="OPD"]');
        await page.click('#btnStep1Next');

        // Step 2: Select tests
        await page.waitForSelector('.test-btn', { timeout: 3000 });
        await page.click('.test-btn:first-child');
        await page.click('#btnStep2Next');

        // Step 3: Confirm
        await expect(page.locator('#step3')).toBeVisible({ timeout: 3000 });
        await page.click('#btnSubmitEntry');
        await enterPinIfNeeded(page, PIN_ADMIN);

        // Success overlay
        await expect(page.locator('#successOverlay')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('#successOverlay')).toBeHidden({ timeout: 5000 });

        // Entry should appear in worklist
        const allText = await page.locator('#worklistCards').textContent();
        expect(allText).toContain(uniqueName);
    });
});

// =============================================================
// FLOW 5: Result entry → Status change
// =============================================================

test.describe('Flow 5: Result entry', () => {
    test('enter results on REGISTERED entry', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_TECH);
        await waitForWorklist(page);

        // Click first card
        const card = page.locator('#worklistCards .sample-card').first();
        const hasCards = await card.count();
        if (hasCards === 0) { test.skip(); return; }

        await card.click();
        await expect(page.locator('#resultModal')).toBeVisible({ timeout: 5000 });

        // Fill POS/NEG buttons if present
        const negBtn = page.locator('.posneg-btn.neg').first();
        if (await negBtn.count() > 0) await negBtn.click();

        // Fill numeric inputs if present
        const numInputs = page.locator('.result-numeric input[type="number"]');
        const numCount = await numInputs.count();
        for (let i = 0; i < numCount; i++) {
            await numInputs.nth(i).fill('10');
        }

        // Save
        await page.click('#btnSaveResults');
        await enterPinIfNeeded(page, PIN_TECH);

        // Success
        await expect(page.locator('#successOverlay')).toBeVisible({ timeout: 5000 });
    });
});

// =============================================================
// FLOW 6: Navigation consistency
// =============================================================

test.describe('Flow 6: Navigation', () => {
    test('nav links work and layout stays consistent', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        // Nav should be visible (bottom bar)
        await expect(page.locator('.app-nav')).toBeVisible();

        // Navigate to Equipment
        await page.click('a[href="/equipment"]');
        await expect(page.locator('h2').first()).toBeVisible();
        await expect(page.locator('.app-nav')).toBeVisible();

        // Navigate to Reports
        await page.click('a[href="/reports"]');
        await expect(page.locator('h2').first()).toBeVisible();
        await expect(page.locator('.app-nav')).toBeVisible();

        // Navigate to Patients
        await page.click('a[href="/patients"]');
        await expect(page.locator('h2').first()).toBeVisible();
        await expect(page.locator('.app-nav')).toBeVisible();

        // Navigate back to Worklist — should auto-enter (session active)
        await page.click('a[href="/register"]');
        await waitForWorklist(page);
    });

    test('logout button clears session', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        // Click logout
        await page.click('#btnLogout');
        await page.waitForTimeout(500);

        // Should be back to landing
        await expect(page.locator('#landingMode')).toBeVisible();
    });
});

// =============================================================
// FLOW 7: Patients page
// =============================================================

test.describe('Flow 7: Patients', () => {
    test('patients page lists demo patients', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        await page.click('a[href="/patients"]');
        await enterPinIfNeeded(page, PIN_ADMIN);
        await page.waitForTimeout(1000);

        // Should have patient cards
        const cards = page.locator('#patientList .sample-card');
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('click patient opens detail with lab history', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        await page.click('a[href="/patients"]');
        await enterPinIfNeeded(page, PIN_ADMIN);
        await page.waitForTimeout(1000);

        // Click first patient
        const card = page.locator('#patientList .sample-card').first();
        if (await card.count() === 0) { test.skip(); return; }
        await card.click();

        // Modal should open with patient info
        await expect(page.locator('#patientModal')).toBeVisible({ timeout: 3000 });
        const name = await page.locator('#patientModalName').textContent();
        expect(name.length).toBeGreaterThan(0);
    });
});

// =============================================================
// FLOW 8: Print icon on COMPLETED cards
// =============================================================

test.describe('Flow 8: Print', () => {
    test('COMPLETED cards have print icon', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_ADMIN);
        await waitForWorklist(page);

        // Show all to see COMPLETED
        await page.click('#wlToggleHeader');
        await page.waitForTimeout(500);

        const completedCard = page.locator('.sample-card.status-completed').first();
        if (await completedCard.count() === 0) { test.skip(); return; }

        // Should have print icon
        const printIcon = completedCard.locator('.card-print-icon');
        await expect(printIcon).toBeVisible();
    });
});
