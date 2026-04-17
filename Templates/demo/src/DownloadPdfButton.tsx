/**
 * DownloadPdfButton — Shared download button used across all demo pages
 *
 * Calls downloadPdf() utility which uses Puppeteer PDF server
 * with automatic fallback to window.print().
 */

import { useState } from 'react';
import { downloadPdf, type DownloadPdfOptions } from './downloadPdf';

interface DownloadPdfButtonProps extends DownloadPdfOptions {
  /** Pre-download validation. Return false to cancel. */
  onBeforeDownload?: () => boolean;
}

export function DownloadPdfButton({ filename, url, onBeforeDownload }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (onBeforeDownload && !onBeforeDownload()) return;
    setLoading(true);
    try {
      await downloadPdf({ filename, url });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="group inline-flex items-center gap-[var(--sp-3)] h-[var(--sp-12)] px-[var(--sp-8)] rounded-[var(--radius-pill)] text-[length:var(--text-md)] font-bold cursor-pointer bg-[var(--color-primary)] text-[color:var(--text-inverse)] shadow-[var(--shadow-md)] hover:bg-[var(--color-primary-hover)] hover:shadow-[var(--shadow-lg)] active:shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-normal)] disabled:opacity-60 disabled:cursor-wait print:hidden"
    >
      {loading ? (
        <svg
          className="w-[var(--text-md)] h-[var(--text-md)] animate-spin"
          fill="none" viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg
          className="w-[var(--text-md)] h-[var(--text-md)] transition-transform duration-[var(--duration-normal)] group-hover:scale-110"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
        </svg>
      )}
      {loading ? 'Generating PDF...' : 'Download PDF'}
    </button>
  );
}

export default DownloadPdfButton;
