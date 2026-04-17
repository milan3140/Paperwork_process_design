import qcPackageHtml from '../../../Document_Analysis/QCPackage.html?raw';
import { DownloadPdfButton } from './DownloadPdfButton';

export default function QCPackageDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="QC-Package" rawHtml={qcPackageHtml} />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          QC Package
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          U26033148F_P01 · 3 pages (QC &amp; Packing / Supplier Acceptance / Dimensional Inspection)
        </div>
      </div>

      <iframe
        srcDoc={qcPackageHtml}
        title="QC Package"
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
