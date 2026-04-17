/**
 * smoke-test.mjs — Headless run-through of every DemoIndex route.
 *
 * Intent: catch runtime bugs (JSX crashes, missing imports, pageerror) that
 * tsc cannot detect. Does NOT verify visual output.
 *
 * Usage:
 *   npx tsx scripts/smoke-test.mjs            # default: http://localhost:5173
 *   VITE_BASE=http://localhost:5174 npx tsx scripts/smoke-test.mjs
 *
 * Requires: Vite dev server already running. Does not start one.
 */

import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const BASE = process.env.VITE_BASE || 'http://localhost:5173';

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const executablePath = CHROME_PATHS.find(p => existsSync(p));
if (!executablePath) {
  console.error('Chrome not found. Set CHROME_PATH.');
  process.exit(1);
}

const routes = [
  // Current
  '#/invoice-v3',
  '#/traveler-v3',
  '#/factory-bom-dated',
  '#/factory-bom-date-only',
  '#/summary-sharp',
  '#/qc-package-sharp',
  '#/packing-slip-v13',
  '#/coc-v4',
  // Archive · Quote Proposal Builder
  '#/quote-builder-v5', '#/quote-builder-v4', '#/quote-builder-v3',
  '#/quote-builder-v2', '#/quote-builder', '#/quote-builder-v0',
  // Archive · Static
  '#/quote', '#/bom', '#/factory-bom', '#/factory-bom-sharp',
  '#/factory-bom-v2', '#/factory-bom-v1',
  '#/invoice', '#/invoice-v2',
  '#/receipt', '#/po',
  '#/summary', '#/qc-package',
  '#/traveler', '#/traveler-v2', '#/traveler-v2-sharp', '#/traveler-v4',
  '#/coc', '#/coc-v2', '#/coc-v3',
  '#/packing-slip',
  '#/packing-slip-v12', '#/packing-slip-v11', '#/packing-slip-v10',
  '#/packing-slip-v9', '#/packing-slip-v8', '#/packing-slip-v7',
  '#/packing-slip-v6', '#/packing-slip-v5', '#/packing-slip-v4',
  '#/packing-slip-v3', '#/packing-slip-v2', '#/packing-slip-v1',
  '#/eval-v1', '#/eval-v2', '#/eval-v3',
  // DemoIndex root
  '#/',
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];
  const start = Date.now();

  for (const route of routes) {
    const url = `${BASE}/${route}`;
    const page = await browser.newPage();
    const errors = [];
    const warnings = [];
    // Known-benign console noise.
    const ignoreConsole = [
      'Failed to load resource',      // generic; actual URL checked via response monitor below
      'validateDOMNesting',           // pre-existing React dev warnings (FactoryBom / PackingSlip v1)
    ];
    // Non-critical resource 404s.
    const ignoreResource = [
      'favicon.ico',                  // browser default request; no favicon configured
    ];
    const matches = (s, list) => list.some(n => s.includes(n));
    page.on('console', msg => {
      const text = msg.text();
      if (matches(text, ignoreConsole)) return;
      if (msg.type() === 'error') errors.push(text);
      if (msg.type() === 'warning') warnings.push(text);
    });
    page.on('pageerror', err => {
      if (!matches(err.message, ignoreConsole)) errors.push(`pageerror: ${err.message}`);
    });
    page.on('response', resp => {
      if (resp.status() >= 400 && !matches(resp.url(), ignoreResource)) {
        errors.push(`HTTP ${resp.status()} ${resp.url()}`);
      }
    });

    const t0 = Date.now();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(r => setTimeout(r, 300));
      const bodyLen = await page.evaluate(() => document.body.innerText.length);
      const ok = errors.length === 0 && bodyLen > 20;
      results.push({ route, ok, bodyLen, errors, warnings, ms: Date.now() - t0 });
    } catch (e) {
      results.push({ route, ok: false, bodyLen: 0, errors: [e.message], warnings, ms: Date.now() - t0 });
    }
    await page.close();
  }

  await browser.close();

  const passed = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  const totalMs = Date.now() - start;

  console.log(`\n=== Smoke test ===`);
  console.log(`Base: ${BASE}`);
  console.log(`Chrome: ${executablePath}`);
  console.log(`Elapsed: ${(totalMs / 1000).toFixed(1)}s`);
  console.log(`\n✓ ${passed.length}/${results.length} passed`);
  if (failed.length) {
    console.log(`✗ ${failed.length} failed\n`);
    for (const f of failed) {
      console.log(`  ${f.route} (${f.ms}ms, body=${f.bodyLen}ch):`);
      for (const e of f.errors.slice(0, 3)) {
        console.log(`    ${e.split('\n')[0].slice(0, 180)}`);
      }
    }
  }
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
