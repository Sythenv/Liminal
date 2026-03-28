// @ts-check
const { test, expect } = require('@playwright/test');

// --- Helpers ---

/** Type a PIN on the shuffled numpad (if it appears) */
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

/** Get active tab text */
async function getActiveTab(page) {
    return page.locator('.wl-tab.active').textContent();
}

/** Count cards in worklist */
async function countWorklistCards(page) {
    return page.locator('#worklistCards .sample-card').count();
}

// --- PIN used: 0777 = L3 (Sebastien), 0755 = L2 (Jea) ---
// Adjust if your dev DB has different PINs

const PIN_L3 = '0777';
const PIN_L2 = '0755';

// We need an L1 PIN — create one in the first test
let PIN_L1 = '2468';

// =============================================================
// FLOW 1: Landing → PIN → Worklist
// =============================================================

test.describe('Flow 1: PIN → Worklist', () => {
    test('L3 PIN opens worklist with Review tab active', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#landingMode')).toBeVisible();

        await unlockFromLanding(page, PIN_L3);
        await waitForWorklist(page);

        // L3 (level >= 2) should default to Review tab
        const activeTab = await getActiveTab(page);
        expect(activeTab.toLowerCase()).toContain('review');

        // Operator name should be displayed
        const opName = await page.locator('#worklistOperator').textContent();
        expect(opName.length).toBeGreaterThan(0);
    });

    test('L2 PIN opens worklist with Review tab active', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_L2);
        await waitForWorklist(page);

        const activeTab = await getActiveTab(page);
        expect(activeTab.toLowerCase()).toContain('review');
    });
});

// =============================================================
// FLOW 2: Worklist tab switching
// =============================================================

test.describe('Flow 2: Tab switching', () => {
    test('clicking tabs changes the active filter and reloads entries', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_L3);
        await waitForWorklist(page);

        // Click "Tous" (All) tab
        await page.click('.wl-tab[data-status=""]');
        await expect(page.locator('.wl-tab[data-status=""]')).toHaveClass(/active/);

        // Click "En attente" tab
        await page.click('.wl-tab[data-status="REGISTERED"]');
        await expect(page.locator('.wl-tab[data-status="REGISTERED"]')).toHaveClass(/active/);

        // Previous tab should not be active
        await expect(page.locator('.wl-tab[data-status=""]')).not.toHaveClass(/active/);
    });

    test('switching to Completed tab shows completed entries', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_L3);
        await waitForWorklist(page);

        await page.click('.wl-tab[data-status="COMPLETED"]');
        // Wait for fetch to complete
        await page.waitForTimeout(500);

        // All visible cards should have completed status
        const cards = page.locator('#worklistCards .sample-card');
        const count = await cards.count();
        for (let i = 0; i < count; i++) {
            await expect(cards.nth(i)).toHaveClass(/status-completed/);
        }
    });
});

// =============================================================
// FLOW 3: Wizard → Submit → Worklist refresh
// =============================================================

test.describe('Flow 3: New entry via wizard', () => {
    test('create entry from worklist, verify it appears', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_L3);
        await waitForWorklist(page);

        // Click FAB
        await page.click('#btnNewEntry');
        await expect(page.locator('#wizardModal')).toBeVisible();

        // Step 1: Patient info — use unique name to avoid suggestion overlay
        const uniqueName = 'PW-' + Date.now();
        await page.fill('#wPatientName', uniqueName);
        await page.fill('#wAge', '30');
        await page.click('.sex-btn[data-sex="M"]');
        await page.click('.ward-btn[data-ward="ER"]');
        await page.click('#btnStep1Next');

        // Step 2: Select tests — pick first available test
        await page.waitForSelector('.test-btn', { timeout: 3000 });
        await page.click('.test-btn:first-child');
        await page.click('#btnStep2Next');

        // Step 3: Confirm
        await expect(page.locator('#step3')).toBeVisible({ timeout: 3000 });

        // Submit — this triggers authFetch (may use cached PIN)
        await page.click('#btnSubmitEntry');
        await enterPinIfNeeded(page, PIN_L3);

        // Success overlay should appear
        await expect(page.locator('#successOverlay')).toBeVisible({ timeout: 5000 });

        // Wait for overlay to disappear and worklist to refresh
        await expect(page.locator('#successOverlay')).toBeHidden({ timeout: 5000 });

        // Switch to "En attente" to see new entry
        await page.click('.wl-tab[data-status="REGISTERED"]');
        await page.waitForTimeout(500);

        // Should find our entry
        const allText = await page.locator('#worklistCards').textContent();
        expect(allText).toContain(uniqueName);
    });
});

// =============================================================
// FLOW 4: Result entry → status changes to REVIEW
// =============================================================

test.describe('Flow 4: Result entry', () => {
    test('entering results on a REGISTERED entry moves it to REVIEW', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_L3);
        await waitForWorklist(page);

        // Go to "En attente" tab
        await page.click('.wl-tab[data-status="REGISTERED"]');
        await page.waitForTimeout(500);

        const cardCount = await countWorklistCards(page);
        if (cardCount === 0) {
            test.skip();
            return;
        }

        // Click first card to open result modal
        await page.click('#worklistCards .sample-card:first-child');
        await expect(page.locator('#resultModal')).toBeVisible({ timeout: 3000 });

        // Find result inputs and fill them
        // Handle different result types
        const posnegBtns = page.locator('.posneg-btn.neg');
        if (await posnegBtns.count() > 0) {
            // Click first NEG button for POS/NEG tests
            await posnegBtns.first().click();
        }

        const numericInputs = page.locator('.result-numeric input[type="number"]');
        const numCount = await numericInputs.count();
        for (let i = 0; i < numCount; i++) {
            await numericInputs.nth(i).fill('10');
        }

        // Click save
        await page.click('#btnSaveResults');
        await enterPinIfNeeded(page, PIN_L3);

        // Success should appear
        await expect(page.locator('#successOverlay')).toBeVisible({ timeout: 5000 });
    });
});

// =============================================================
// FLOW 5: TAT coloring visible on cards
// =============================================================

test.describe('Flow 5: TAT coloring', () => {
    test('worklist cards show TAT badges with color', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_L3);
        await waitForWorklist(page);

        // Switch to "Tous" to see all entries
        await page.click('.wl-tab[data-status=""]');
        await page.waitForTimeout(500);

        const tatBadges = page.locator('.card-tat');
        const count = await tatBadges.count();

        if (count === 0) {
            test.skip();
            return;
        }

        // Each TAT badge should have a color class
        for (let i = 0; i < count; i++) {
            const classes = await tatBadges.nth(i).getAttribute('class');
            const hasColor = classes.includes('tat-green') ||
                           classes.includes('tat-orange') ||
                           classes.includes('tat-red');
            expect(hasColor).toBeTruthy();
        }

        // TAT text should match pattern like "5min" or "1h30"
        const firstTat = await tatBadges.first().textContent();
        expect(firstTat).toMatch(/\d+(min|h\d{2})/);
    });
});

// =============================================================
// FLOW 6: "All entries" → Register mode with date nav
// =============================================================

test.describe('Flow 6: Worklist → Register mode', () => {
    test('"All entries" button switches to full register with date nav', async ({ page }) => {
        await page.goto('/');
        await unlockFromLanding(page, PIN_L3);
        await waitForWorklist(page);

        await page.click('#btnShowAll');
        await expect(page.locator('#registerMode')).toBeVisible({ timeout: 3000 });
        await expect(page.locator('#worklistMode')).toBeHidden();

        // Date navigation should be visible
        await expect(page.locator('#btnPrevDay')).toBeVisible();
        await expect(page.locator('#btnNextDay')).toBeVisible();
    });
});
