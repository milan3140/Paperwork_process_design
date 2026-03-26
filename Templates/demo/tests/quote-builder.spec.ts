/**
 * Quote Builder — E2E Verification Tests
 *
 * Layer 4 of the verification funnel.
 * Runs against production build (vite preview) via Playwright.
 *
 * Groups:
 *   A. Smoke tests — pages render, not blank
 *   B. Functional tests — features work correctly
 *   C. Layout tests — spacing, positioning, visual structure
 */

import { test, expect, type Page } from '@playwright/test';

const QB_URL = '/#/quote-builder';

/* ── Helpers ── */

async function goToQuoteBuilder(page: Page) {
  await page.goto(QB_URL);
  await expect(page.getByRole('heading', { name: /quote builder/i })).toBeVisible({ timeout: 15000 });
}

async function switchToPdf(page: Page) {
  await page.getByRole('button', { name: /pdf/i }).click();
  await expect(page.locator('.doc-page').first()).toBeVisible({ timeout: 10000 });
}

async function switchToEmail(page: Page) {
  await page.getByRole('button', { name: /email/i }).click();
  await expect(page.locator('pre')).toBeVisible({ timeout: 5000 });
}

async function fillPartName(page: Page, name: string) {
  const input = page.locator('input[placeholder*="Part"]').first();
  if (await input.count() === 0) {
    // Try the part name field by label
    await page.getByLabel(/part name/i).first().fill(name);
  } else {
    await input.fill(name);
  }
}

async function fillPrice(page: Page, price: string) {
  await page.locator('input[type="number"]').nth(1).fill(price);
}

/* ═══════════════════════════════════════════════════════════════
   A. SMOKE TESTS — pages render, not blank
   ═══════════════════════════════════════════════════════════════ */

test.describe('A. Smoke Tests', () => {

  test('A1: PDF Preview renders (not blank)', async ({ page }) => {
    await goToQuoteBuilder(page);
    await switchToPdf(page);
    const docPage = page.locator('.doc-page');
    await expect(docPage).toBeVisible();
    // Should have actual content, not just an empty shell
    await expect(docPage).not.toBeEmpty();
  });

  test('A2: Email Preview has content', async ({ page }) => {
    await goToQuoteBuilder(page);
    // Email is default tab
    const pre = page.locator('pre');
    await expect(pre).toBeVisible();
    await expect(pre).toContainText('Thank you');
  });

  test('A3: All fixed sections exist in PDF', async ({ page }) => {
    await goToQuoteBuilder(page);
    await switchToPdf(page);
    const doc = page.locator('.doc-page');
    const firstPage = doc.first();
    // Header + Footer
    await expect(firstPage.locator('[data-comp="DocumentHeader"]')).toBeVisible();
    await expect(firstPage.locator('[data-comp="DocumentFooter"]')).toBeVisible();
    // Key content sections — use locator with exact CSS text matching
    await expect(firstPage.locator('[data-comp="SectionLabel"]').first()).toBeVisible();
    // Verify we have multiple section labels (pricing + info sections + terms)
    const sectionLabels = firstPage.locator('[data-comp="SectionLabel"]');
    const labelCount = await sectionLabels.count();
    expect(labelCount).toBeGreaterThanOrEqual(4); // Pricing, Mfg Notes, Lead Time, Shipping, Payment, T&C
  });

  test('A4: Tab switching works without breaking', async ({ page }) => {
    await goToQuoteBuilder(page);
    // Email (default) → PDF → Email → PDF
    await expect(page.locator('pre')).toBeVisible();
    await switchToPdf(page);
    await expect(page.locator('.doc-page')).toBeVisible();
    await switchToEmail(page);
    await expect(page.locator('pre')).toBeVisible();
    await switchToPdf(page);
    await expect(page.locator('.doc-page')).toBeVisible();
  });
});

/* ═══════════════════════════════════════════════════════════════
   B. FUNCTIONAL TESTS — features work correctly
   ═══════════════════════════════════════════════════════════════ */

test.describe('B. Functional Tests', () => {

  test('B1: Part name reflects in Email preview', async ({ page }) => {
    await goToQuoteBuilder(page);
    await page.getByPlaceholder('e.g. LPK Mirror').first().fill('TestPartAlpha');
    await expect(page.locator('pre')).toContainText('TestPartAlpha');
  });

  test('B2: Part name reflects in PDF preview', async ({ page }) => {
    await goToQuoteBuilder(page);
    await page.getByPlaceholder('e.g. LPK Mirror').first().fill('TestPartBeta');
    await switchToPdf(page);
    await expect(page.locator('.doc-page').first()).toContainText('TestPartBeta');
  });

  test('B3: Add Part increases part count', async ({ page }) => {
    await goToQuoteBuilder(page);
    // Count initial parts
    const addBtn = page.getByRole('button', { name: /add part/i });
    await addBtn.click();
    // Should now have "Parts (2)" or two Part cards
    await expect(page.getByText(/parts \(2\)/i)).toBeVisible();
  });

  test('B4: Add Option increases option count', async ({ page }) => {
    await goToQuoteBuilder(page);
    const addOptionBtn = page.getByRole('button', { name: /add option/i }).first();
    await addOptionBtn.click();
    // Should see Option 2
    await expect(page.getByText('Option 2')).toBeVisible();
  });

  test('B5: Same-as-billing checkbox toggles shipping fields', async ({ page }) => {
    await goToQuoteBuilder(page);
    const checkbox = page.locator('#ship-same');
    // Default: checked → no shipping address fields
    await expect(checkbox).toBeChecked();

    // Uncheck → shipping address appears
    await checkbox.uncheck();
    await expect(page.getByText(/shipping address/i)).toBeVisible();

    // Re-check → shipping address disappears
    await checkbox.check();
    await expect(page.getByText(/shipping address/i)).not.toBeVisible();
  });

  test('B6: Same-as-billing reflects in PDF layout', async ({ page }) => {
    await goToQuoteBuilder(page);

    // Checked: "BILL TO / SHIP TO" combined
    await switchToPdf(page);
    await expect(page.locator('.doc-page').getByText('BILL TO / SHIP TO')).toBeVisible();

    // Uncheck
    await switchToEmail(page);
    await page.locator('#ship-same').uncheck();
    await switchToPdf(page);
    // Should now have separate BILL TO and SHIP TO
    await expect(page.locator('.doc-page').getByText('BILL TO')).toBeVisible();
    await expect(page.locator('.doc-page').getByText('SHIP TO')).toBeVisible();
  });

  test('B7: Cover letter dropdown switches mode', async ({ page }) => {
    await goToQuoteBuilder(page);
    const select = page.locator('select').first();
    // Switch to Custom
    await select.selectOption('custom');
    await expect(page.locator('textarea')).toBeVisible();
    // Switch back to Standard
    await select.selectOption('standard');
    await expect(page.locator('textarea')).not.toBeVisible();
  });

  test('B8: CTA buttons exist and switch with tabs', async ({ page }) => {
    await goToQuoteBuilder(page);
    // Email tab → Copy Email button visible
    await expect(page.getByRole('button', { name: /copy email/i })).toBeVisible();
    // PDF tab → Download PDF button visible
    await switchToPdf(page);
    await expect(page.getByRole('button', { name: /download pdf/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /copy cover letter/i })).toBeVisible();
  });

  test('B9: Validation errors show for invalid data', async ({ page }) => {
    await goToQuoteBuilder(page);
    // Part name is empty by default → should show error indicator
    // Price is 0 by default → should show error
    const errors = page.getByText(/error/i);
    await expect(errors.first()).toBeVisible();
  });
});

/* ═══════════════════════════════════════════════════════════════
   C. LAYOUT TESTS — spacing, positioning, visual structure
   ═══════════════════════════════════════════════════════════════ */

test.describe('C. Layout Tests', () => {

  test('C1: Pricing label exists with colored border', async ({ page }) => {
    await goToQuoteBuilder(page);
    await switchToPdf(page);
    // Pricing label should be visible
    const pricingLabel = page.getByText('Pricing').first();
    await expect(pricingLabel).toBeVisible();
    // Its parent SectionLabel should have a non-default border color
    const hasBorder = await pricingLabel.evaluate(el => {
      let node: Element | null = el;
      while (node) {
        const style = getComputedStyle(node);
        if (style.borderBottomWidth !== '0px' && style.borderBottomStyle !== 'none') return true;
        node = node.parentElement;
      }
      return false;
    });
    expect(hasBorder).toBe(true);
  });

  test('C2: Spacer heights shrink as parts increase', async ({ page }) => {
    await goToQuoteBuilder(page);

    // Measure initial spacer with 1 part
    await switchToPdf(page);
    const initialSpacers = await page.locator('.doc-content > div[style*="height"]').all();
    const initialHeights: number[] = [];
    for (const s of initialSpacers) {
      const style = await s.getAttribute('style');
      const match = style?.match(/height:\s*(\d+)px/);
      if (match) initialHeights.push(Number(match[1]));
    }

    // Add 3 more parts
    await switchToEmail(page);
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /add part/i }).click();
    }

    // Measure again
    await switchToPdf(page);
    await page.waitForTimeout(500); // Allow pagination recalculation
    const laterSpacers = await page.locator('.doc-content > div[style*="height"]').all();
    const laterHeights: number[] = [];
    for (const s of laterSpacers) {
      const style = await s.getAttribute('style');
      const match = style?.match(/height:\s*(\d+)px/);
      if (match) laterHeights.push(Number(match[1]));
    }

    // At least some spacers should be smaller (or same if pages split)
    if (initialHeights.length > 0 && laterHeights.length > 0) {
      const maxInitial = Math.max(...initialHeights);
      const maxLater = Math.max(...laterHeights);
      expect(maxLater).toBeLessThanOrEqual(maxInitial);
    }
  });

  test('C3: Multi-page pagination shows correct page numbers', async ({ page }) => {
    await goToQuoteBuilder(page);

    // Add enough parts to force pagination
    for (let i = 0; i < 7; i++) {
      await page.getByRole('button', { name: /add part/i }).click();
    }

    // Switch to PDF — use first() since multiple pages
    await page.getByRole('button', { name: /pdf/i }).click();
    await expect(page.locator('.doc-page').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    const docPages = page.locator('.doc-page');
    const pageCount = await docPages.count();

    if (pageCount > 1) {
      // Each page should have a header and footer
      for (let i = 0; i < pageCount; i++) {
        const pg = docPages.nth(i);
        await expect(pg.locator('[data-comp="DocumentHeader"]')).toBeVisible();
        await expect(pg.locator('[data-comp="DocumentFooter"]')).toBeVisible();
      }
      // Last page footer should show correct total
      const lastFooter = docPages.last().locator('[data-comp="DocumentFooter"]');
      await expect(lastFooter).toContainText(`Page ${pageCount} of ${pageCount}`);
    }
  });

  test('C4: Part cards have non-white background', async ({ page }) => {
    await goToQuoteBuilder(page);
    await switchToPdf(page);

    // Pricing part cards use Tailwind bg-[color:var(--gray-50)]
    // Check that at least one element inside .doc-content has a non-white background
    const hasNonWhiteBg = await page.locator('.doc-page').first().evaluate(docPage => {
      const els = docPage.querySelectorAll('.doc-content *');
      for (const el of els) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)' && bg !== 'transparent') {
          return true;
        }
      }
      return false;
    });
    expect(hasNonWhiteBg).toBe(true);
  });

  test('C5: Full page layout — no overlapping sections', async ({ page }) => {
    await goToQuoteBuilder(page);
    await switchToPdf(page);

    // Get positions of key sections
    const header = page.locator('[data-comp="DocumentHeader"]').first();
    const footer = page.locator('[data-comp="DocumentFooter"]').first();

    const headerBox = await header.boundingBox();
    const footerBox = await footer.boundingBox();

    expect(headerBox).toBeTruthy();
    expect(footerBox).toBeTruthy();

    if (headerBox && footerBox) {
      // Footer should be below header
      expect(footerBox.y).toBeGreaterThan(headerBox.y + headerBox.height);
      // Both should have non-zero dimensions
      expect(headerBox.height).toBeGreaterThan(0);
      expect(footerBox.height).toBeGreaterThan(0);
    }
  });
});
