/**
 * InstaVoxel Document Component Library — Unified Export
 *
 * Import all document components from this single entry point:
 *   import { QuoteDocument, DocumentHeader, PartBlock } from '../components';
 *
 * ⚠️ REQUIRES:
 *   1. Design_Sys_style.css (design tokens) — import separately
 *   2. documents.css (document tokens + print styles) — import separately
 *
 *   import '../components/Design_Sys_style.css';  // or from @instavoxel/ui
 *   import '../components/documents.css';
 */

// ── Icons ──
export { PRINT_ICONS } from './Icons_Print';
export type { PrintIconName } from './Icons_Print';

// ── Shared Document Components ──
export { DocumentHeader } from './DocumentHeader';
export { DocumentFooter } from './DocumentFooter';
export { DocumentMeta } from './DocumentMeta';
export type { MetaItem } from './DocumentMeta';
export { SectionLabel } from './SectionLabel';
export { PartiesRow } from './PartiesRow';
export type { PartyInfo } from './PartiesRow';
export { KeyInfoRow } from './KeyInfoRow';
export type { LeadTimeOption } from './KeyInfoRow';

// ── Content Components ──
export { PartBlock } from './PartBlock';
export type { PartData, PartParam } from './PartBlock';
export { NRETable } from './NRETable';
export type { NRECharge } from './NRETable';
export { TotalsTable } from './TotalsTable';
export type { TotalLine } from './TotalsTable';
export { NotesList } from './NotesList';
export { WarningBox } from './WarningBox';
export { PaymentInfo } from './PaymentInfo';
export type { InfoItem } from './PaymentInfo';
export { SignatureRow } from './SignatureRow';
export { TermsSection } from './TermsSection';

// ── Evaluation Table Components ──
export { QuoteEvaluationTable } from './QuoteEvaluationTable';
export { QuoteEvaluationTableV2 } from './QuoteEvaluationTableV2';
export type { PriceCell, FactoryQuote, DhlCustomsRow, QuoteEvalData } from './quoteEvalHelpers';

// ── Invoice Components ──
export { InvoiceKeyInfoRow } from './InvoiceKeyInfoRow';
export type { InvoiceVariant } from './InvoiceKeyInfoRow';
export { PaymentInstructions } from './PaymentInstructions';
export type { BankDetails } from './PaymentInstructions';

// ── Composed Documents ──
export { QuoteDocument } from './QuoteDocument';
export type { QuoteData, LeadTimeOption as QuoteLeadTimeOption } from './QuoteDocument';
export { InvoiceDocument } from './InvoiceDocument';
export type { InvoiceData, PartialPaymentInfo } from './InvoiceDocument';
