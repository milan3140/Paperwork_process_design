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
const QuoteBuilderV4 = lazy(() => import('./quote-builder-v4/QuoteBuilder'));
const QuoteBuilderV5 = lazy(() => import('./quote-builder-v5/QuoteBuilder'));
const BomDemo      = lazy(() => import('./BomDemo'));
const FactoryBomDemo   = lazy(() => import('./FactoryBomDemo'));
const FactoryBomDemoV1 = lazy(() => import('./FactoryBomDemo_v1'));
const FactoryBomDemoV2 = lazy(() => import('./FactoryBomDemo_v2'));
const FactoryBomDemoSharp = lazy(() => import('./FactoryBomDemo_sharp'));
const FactoryBomDemoDated = lazy(() => import('./FactoryBomDemo_dated'));
const InvoiceDemo    = lazy(() => import('./InvoiceDemo'));
const InvoiceDemoV2  = lazy(() => import('./InvoiceDemo_v2'));
const InvoiceDemoV3  = lazy(() => import('./InvoiceDemo_v3'));
const ReceiptDemo    = lazy(() => import('./ReceiptDemo'));
const PODemo              = lazy(() => import('./PODemo'));
const PackingSlipDemo     = lazy(() => import('./PackingSlipDemo'));
const PackingSlipDemoV1   = lazy(() => import('./PackingSlipDemo_v1'));
const CoCDemo             = lazy(() => import('./CoCDemo'));
const CoCDemoV2           = lazy(() => import('./CoCDemo_v2'));
const CoCDemoV3           = lazy(() => import('./CoCDemo_v3'));
const CoCDemoV4           = lazy(() => import('./CoCDemo_v4'));
const PackingSlipDemoV2   = lazy(() => import('./PackingSlipDemo_v2'));
const PackingSlipDemoV3   = lazy(() => import('./PackingSlipDemo_v3'));
const PackingSlipDemoV4   = lazy(() => import('./PackingSlipDemo_v4'));
const PackingSlipDemoV5   = lazy(() => import('./PackingSlipDemo_v5'));
const PackingSlipDemoV6   = lazy(() => import('./PackingSlipDemo_v6'));
const PackingSlipDemoV7   = lazy(() => import('./PackingSlipDemo_v7'));
const PackingSlipDemoV8   = lazy(() => import('./PackingSlipDemo_v8'));
const PackingSlipDemoV9   = lazy(() => import('./PackingSlipDemo_v9'));
const PackingSlipDemoV10  = lazy(() => import('./PackingSlipDemo_v10'));
const PackingSlipDemoV11  = lazy(() => import('./PackingSlipDemo_v11'));
const PackingSlipDemoV12  = lazy(() => import('./PackingSlipDemo_v12'));
const PackingSlipDemoV13  = lazy(() => import('./PackingSlipDemo_v13'));
const SummaryDemo         = lazy(() => import('./SummaryDemo'));
const SummaryDemoSharp    = lazy(() => import('./SummaryDemo_sharp'));
const QCPackageDemo       = lazy(() => import('./QCPackageDemo'));
const QCPackageDemoSharp  = lazy(() => import('./QCPackageDemo_sharp'));
const TravelerDemo        = lazy(() => import('./TravelerDemo'));
const TravelerDemoV2      = lazy(() => import('./TravelerDemo_v2'));
const TravelerDemoV2Sharp = lazy(() => import('./TravelerDemo_v2_sharp'));
const TravelerDemoV3      = lazy(() => import('./TravelerDemo_v3'));
const TravelerDemoV4      = lazy(() => import('./TravelerDemo_v4'));
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
          case '#/factory-bom-sharp': return <FactoryBomDemoSharp />;
          case '#/factory-bom-dated': return <FactoryBomDemoDated />;
          case '#/factory-bom-v2': return <FactoryBomDemoV2 />;
          case '#/factory-bom-v1': return <FactoryBomDemoV1 />;
          case '#/invoice':       return <InvoiceDemo />;
          case '#/invoice-v2':    return <InvoiceDemoV2 />;
          case '#/invoice-v3':    return <InvoiceDemoV3 />;
          case '#/receipt':       return <ReceiptDemo />;
          case '#/po':            return <PODemo />;
          case '#/summary':       return <SummaryDemo />;
          case '#/summary-sharp': return <SummaryDemoSharp />;
          case '#/qc-package':    return <QCPackageDemo />;
          case '#/qc-package-sharp': return <QCPackageDemoSharp />;
          case '#/traveler':      return <TravelerDemo />;
          case '#/traveler-v2':   return <TravelerDemoV2 />;
          case '#/traveler-v2-sharp': return <TravelerDemoV2Sharp />;
          case '#/traveler-v3':   return <TravelerDemoV3 />;
          case '#/traveler-v4':   return <TravelerDemoV4 />;
          case '#/coc':             return <CoCDemo />;
          case '#/coc-v2':          return <CoCDemoV2 />;
          case '#/coc-v3':          return <CoCDemoV3 />;
          case '#/coc-v4':          return <CoCDemoV4 />;
          case '#/packing-slip':    return <PackingSlipDemo />;
          case '#/packing-slip-v9': return <PackingSlipDemoV9 />;
          case '#/packing-slip-v10': return <PackingSlipDemoV10 />;
          case '#/packing-slip-v11': return <PackingSlipDemoV11 />;
          case '#/packing-slip-v12': return <PackingSlipDemoV12 />;
          case '#/packing-slip-v13': return <PackingSlipDemoV13 />;
          case '#/packing-slip-v8': return <PackingSlipDemoV8 />;
          case '#/packing-slip-v7': return <PackingSlipDemoV7 />;
          case '#/packing-slip-v6': return <PackingSlipDemoV6 />;
          case '#/packing-slip-v5': return <PackingSlipDemoV5 />;
          case '#/packing-slip-v4': return <PackingSlipDemoV4 />;
          case '#/packing-slip-v3': return <PackingSlipDemoV3 />;
          case '#/packing-slip-v2': return <PackingSlipDemoV2 />;
          case '#/packing-slip-v1': return <PackingSlipDemoV1 />;
          case '#/eval-v1':       return <EvalV1 />;
          case '#/eval-v2':       return <EvalV2 />;
          case '#/eval-v3':       return <EvalV3 />;
          case '#/quote-builder-v0': return <QuoteBuilderV0 />;
          case '#/quote-builder': return <QuoteBuilder />;
          case '#/quote-builder-v3': return <QuoteBuilderV3 />;
          case '#/quote-builder-v4': return <QuoteBuilderV4 />;
          case '#/quote-builder-v5': return <QuoteBuilderV5 />;
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
