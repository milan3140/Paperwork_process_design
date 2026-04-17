import qcPackageHtml from './QCPackage.html?raw';
import { DownloadPdfButton } from './DownloadPdfButton';

/**
 * QC Package — Sharp variant.
 *
 * Design intent: high contrast + sharper edges than the brand version.
 *  - Strip the #2E0D77 primary hue → monochrome ink scale (90% black).
 *  - Swap Geist → Inter (tighter apertures, crisper at small sizes).
 *
 * Implementation: re-use the canonical QCPackage.html and inject a final
 * `<style>` block after the document's own `<style>` so its later-cascade
 * position wins. Variables are neutralised; structure stays identical.
 */
const sharpOverrideHead = `
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root {
  --color-primary: #1a1a1a !important;
  --color-primary-light: #404040 !important;
  --color-primary-gray: #555555 !important;
  --font-stack: "Inter", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
}
html, body {
  font-family: var(--font-stack) !important;
  font-feature-settings: "cv11", "ss01", "ss03" !important;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}
.doc-header { background: #0a0a0a !important; }
.title-row .doc-title { letter-spacing: -0.3pt !important; }
.title-row .doc-subtitle { letter-spacing: 0 !important; }
</style>
`;

const sharpHtml = qcPackageHtml.replace('</head>', sharpOverrideHead + '</head>');

export default function QCPackageDemo_sharp() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="QC-Package-Sharp" rawHtml={sharpHtml} />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          QC Package · Sharp
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          Monochrome · Inter · High-contrast variant
        </div>
      </div>

      <iframe
        srcDoc={sharpHtml}
        title="QC Package (Sharp)"
        style={{
          width: '210mm',
          height: 'calc(297mm * 3 + 24mm)',
          border: 'none',
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      />
    </div>
  );
}
