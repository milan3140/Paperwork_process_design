import React, { useState, useEffect, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';

// Design tokens (shared with web UI)
import '../../components/Design_Sys_style.css';
// Document-specific tokens + print styles
import '../../components/documents.css';
// Tailwind
import './index.css';

// Lazy-load demos so the index page stays lightweight
const QuoteDemo    = lazy(() => import('./App'));
const EvalV1       = lazy(() => import('./EvalDemo'));
const EvalV2       = lazy(() => import('./EvalDemoV2'));
const EvalV3       = lazy(() => import('./EvalDemoV3'));
const QuoteBuilderV0 = lazy(() => import('./quote-builder-v0/QuoteBuilder'));
const QuoteBuilder   = lazy(() => import('./quote-builder/QuoteBuilder'));
const QuoteBuilderV2 = lazy(() => import('./quote-builder-v2/QuoteBuilder'));
const QuoteBuilderV3 = lazy(() => import('./quote-builder-v3/QuoteBuilder'));
const BomDemo      = lazy(() => import('./BomDemo'));
const FactoryBomDemo   = lazy(() => import('./FactoryBomDemo'));
const FactoryBomDemoV1 = lazy(() => import('./FactoryBomDemo_v1'));
const InvoiceDemo    = lazy(() => import('./InvoiceDemo'));
const InvoiceDemoV2  = lazy(() => import('./InvoiceDemo_v2'));
const ReceiptDemo    = lazy(() => import('./ReceiptDemo'));
import DemoIndex from './DemoIndex';

function Router() {
  const [hash, setHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const route = hash.replace(/\?.*$/, ''); // strip query params

  return (
    <Suspense fallback={null}>
      {(() => {
        switch (route) {
          case '#/quote':         return <QuoteDemo />;
          case '#/bom':           return <BomDemo />;
          case '#/factory-bom':   return <FactoryBomDemo />;
          case '#/factory-bom-v1': return <FactoryBomDemoV1 />;
          case '#/invoice':       return <InvoiceDemo />;
          case '#/invoice-v2':    return <InvoiceDemoV2 />;
          case '#/receipt':       return <ReceiptDemo />;
          case '#/eval-v1':       return <EvalV1 />;
          case '#/eval-v2':       return <EvalV2 />;
          case '#/eval-v3':       return <EvalV3 />;
          case '#/quote-builder-v0': return <QuoteBuilderV0 />;
          case '#/quote-builder': return <QuoteBuilder />;
          case '#/quote-builder-v3': return <QuoteBuilderV3 />;
          case '#/quote-builder-v2': return <QuoteBuilderV2 />;
          default:          return <DemoIndex />;
        }
      })()}
    </Suspense>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
