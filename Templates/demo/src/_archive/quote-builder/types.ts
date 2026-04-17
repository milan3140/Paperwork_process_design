/**
 * Quote Builder — Core Types
 *
 * Data model for the quote builder tool. A Quote contains Parts,
 * each Part contains Scenarios. The system auto-detects which dimensions
 * vary across scenarios and renders the appropriate comparison layout.
 */

/* ── Address ── */

export interface Address {
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export function createEmptyAddress(): Address {
  return { street: '', city: '', state: '', postalCode: '', country: '' };
}

/* ── Customer ── */

export interface Customer {
  companyName: string;
  contactName: string;
  email?: string;
  billingAddress: Address;
  shippingAddress: Address;
  shippingSameAsBilling: boolean;
}

/* ── Scenario ── */

export interface Scenario {
  id: string;
  qty: number;
  unitPrice: number;
  leadTimeDays: number;
  /** Manufacturing location — if different across scenarios, becomes comparison dimension */
  location?: 'TW' | 'US';
  /** Override Part-level material — if set differently across scenarios, becomes comparison dimension */
  materialOverride?: string;
  /** Override Part-level finish — if set differently across scenarios, becomes comparison dimension */
  finishOverride?: string;
  /** Free-text label — if set, overrides auto-generated condition text */
  customLabel?: string;
}

/* ── Part ── */

export interface QuotePart {
  id: string;
  name: string;
  /** Default material (shown at Part level if not a comparison dimension) */
  material: string;
  /** Default finish (shown at Part level if not a comparison dimension) */
  finish?: string;
  /** Scenarios for this part — each is a pricing option */
  scenarios: Scenario[];
}

/* ── Cover Letter ── */

export type CoverLetterStrategy = 'standard' | 'target_price' | 'dual_location' | 'custom';

/* ── Quote ── */

export interface QuoteBuilderData {
  quoteId: string;
  date: string;
  validDays: number;
  customer: Customer;
  coverLetterStrategy: CoverLetterStrategy;
  coverLetterCustom?: string;
  parts: QuotePart[];
  leadTimeDays: number; // quote-level default
  manufacturingNotes: string[];
  /** Extra notes (appended to standard Mfg Note) */
  extraNotes: string[];
}

/* ── Dimension Detection ── */

/** Which fields vary across scenarios within a Part */
export type VaryingDimension = 'qty' | 'location' | 'material' | 'finish' | 'leadTime';

export interface DimensionAnalysis {
  varying: VaryingDimension[];
  fixed: {
    qty?: number;
    location?: 'TW' | 'US';
    material?: string;
    finish?: string;
    leadTime?: number;
  };
}

/* ── Layout ── */

export type ComparisonLayout =
  | 'single'          // 0 varying dimensions: just price + lead time
  | 'horizontal'      // 1 dimension: options as columns
  | 'matrix'          // 2 dimensions: rows × columns
  | 'grouped_matrix'  // 3 dimensions: groups of matrices
  | 'flat_list';      // 4+ dimensions: fallback to flat list

/* ── Helpers ── */

let _nextId = 1;
export function genId(prefix = 's') { return `${prefix}${_nextId++}`; }

export function createEmptyScenario(): Scenario {
  return { id: genId('s'), qty: 1, unitPrice: 0, leadTimeDays: 20 };
}

export function createEmptyPart(): QuotePart {
  return {
    id: genId('p'),
    name: '',
    material: '',
    scenarios: [createEmptyScenario()],
  };
}

export function createDefaultQuote(): QuoteBuilderData {
  return {
    quoteId: `Q${new Date().toISOString().slice(2, 10).replace(/-/g, '')}01A`,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    validDays: 30,
    customer: {
      companyName: '', contactName: '',
      billingAddress: createEmptyAddress(),
      shippingAddress: createEmptyAddress(),
      shippingSameAsBilling: true,
    },
    coverLetterStrategy: 'standard',
    parts: [createEmptyPart()],
    leadTimeDays: 20,
    manufacturingNotes: ['Quoted with standard inspection'],
    extraNotes: [],
  };
}
