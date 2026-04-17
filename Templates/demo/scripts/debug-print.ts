import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function test(p: Awaited<ReturnType<typeof puppeteer.launch>>['prototype'] extends never ? never : any, label: string, html: string) {
  await p.setContent(html, { waitUntil: 'load' });
  const buf: Buffer = await p.pdf({
    width: '210mm', height: '297mm', printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(`${label}: ${pages} page(s)`);
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await test(page, '297mm-exact',
    '<html><body style="margin:0"><div style="width:210mm;height:297mm;background:#eee">A</div></body></html>');

  await test(page, '297mm+page-break-after',
    '<html><body style="margin:0"><div style="width:210mm;height:297mm;page-break-after:always">A</div></body></html>');

  await test(page, '296mm+page-break-after',
    '<html><body style="margin:0"><div style="width:210mm;height:296mm;page-break-after:always">A</div></body></html>');

  await test(page, 'minH297mm+flex',
    '<html><body style="margin:0"><div style="width:210mm;min-height:297mm;display:flex;flex-direction:column"><div style="flex:1">B</div></div></body></html>');

  await test(page, 'minH297mm+flex+pba',
    '<html><body style="margin:0"><div style="width:210mm;min-height:297mm;display:flex;flex-direction:column;page-break-after:always"><div style="flex:1">B</div></div></body></html>');

  await test(page, '2pages-pba-first-only',
    `<html><body style="margin:0">
      <div style="width:210mm;height:297mm;page-break-after:always">P1</div>
      <div style="width:210mm;height:297mm">P2</div>
    </body></html>`);

  await test(page, '2pages-pba-both',
    `<html><body style="margin:0">
      <div style="width:210mm;height:297mm;page-break-after:always">P1</div>
      <div style="width:210mm;height:297mm;page-break-after:always">P2</div>
    </body></html>`);

  await browser.close();
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
