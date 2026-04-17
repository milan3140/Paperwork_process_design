import puppeteer from 'puppeteer-core';
import { existsSync, writeFileSync } from 'fs';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
  .find(p => existsSync(p));

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage();

  async function test(label, html) {
    await p.setContent(html, { waitUntil: 'load' });
    const buf = await p.pdf({
      width: '210mm', height: '297mm', printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`${label}: ${pages} page(s)`);
    return pages;
  }

  // Baseline: exact 297mm
  await test('297mm-exact',
    '<html><body style="margin:0"><div style="width:210mm;height:297mm;background:#eee">A</div></body></html>');

  // Under: 296mm
  await test('296mm',
    '<html><body style="margin:0"><div style="width:210mm;height:296mm;background:#eee">A</div></body></html>');

  // Over: 298mm
  await test('298mm',
    '<html><body style="margin:0"><div style="width:210mm;height:298mm;background:#eee">A</div></body></html>');

  // min-height + flex (our pattern)
  await test('minH-297mm-flex',
    '<html><body style="margin:0"><div style="width:210mm;min-height:297mm;display:flex;flex-direction:column"><div style="flex:1">B</div></div></body></html>');

  // page-break-after: always (our pattern)
  await test('297mm+pageBreakAfter',
    '<html><body style="margin:0"><div style="width:210mm;height:297mm;page-break-after:always">A</div></body></html>');

  // page-break-after on LAST (single) element
  await test('297mm+pageBreakAfter-single',
    '<html><body style="margin:0"><div style="width:210mm;height:297mm;page-break-after:always;overflow:hidden">Only</div></body></html>');

  // NO page-break-after
  await test('297mm-no-pagebreak',
    '<html><body style="margin:0"><div style="width:210mm;height:297mm;overflow:hidden">Only</div></body></html>');

  // TWO pages, page-break-after on first only
  await test('2x297mm-pba-first',
    `<html><body style="margin:0">
      <div style="width:210mm;height:297mm;page-break-after:always;overflow:hidden">P1</div>
      <div style="width:210mm;height:297mm;overflow:hidden">P2</div>
    </body></html>`);

  // TWO pages, page-break-after on both
  await test('2x297mm-pba-both',
    `<html><body style="margin:0">
      <div style="width:210mm;height:297mm;page-break-after:always;overflow:hidden">P1</div>
      <div style="width:210mm;height:297mm;page-break-after:always;overflow:hidden">P2</div>
    </body></html>`);

  await b.close();
  console.log('Done');
})();
