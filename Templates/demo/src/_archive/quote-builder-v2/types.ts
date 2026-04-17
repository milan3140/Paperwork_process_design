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

/* ── Comparison Dimension Toggle ── */

/** Dimensions that can be toggled on/off per Part for comparison */
export type CompareDimension = 'qty' | 'leadTime' | 'location' | 'material' | 'finish' | 'label';

/* ── Part ── */

export interface QuotePart {
  id: string;
  name: string;
  /** Default quantity for this Part (used when qty is NOT a comparison dimension) */
  qty: number;
  /** Default material (shown at Part level if not a comparison dimension) */
  material: string;
  /** Default lead time in workdays (used when leadTime is NOT a comparison dimension) */
  leadTimeDays: number;
  /** Default finish (shown at Part level if not a comparison dimension) */
  finish?: string;
  /** Which dimensions are enabled for per-Option comparison */
  enabledDimensions: CompareDimension[];
  /** Optional part thumbnail (Data URL from file input) */
  thumbnailUrl?: string;
  /** Optional part dimensions in mm (L × W × H) */
  dimensions?: { length: number; width: number; height: number };
  /** Scenarios for this part — each is a pricing option */
  scenarios: Scenario[];
}

/* ── Cover Letter ── */

export type CoverLetterStrategy = 'standard' | 'target_price' | 'dual_location' | 'custom';

/* ── Quote ── */

/** Editable PDF section — label + content can be customized */
export interface EditableSection {
  label: string;
  content: string;
}

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
  /** v2: Editable PDF sections — each has a customizable label and content */
  sections: {
    leadTime: EditableSection;
    shipping: EditableSection;
    paymentTerms: EditableSection;
    terms: EditableSection;
  };
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
    qty: 1,
    material: '',
    leadTimeDays: 20,
    enabledDimensions: [],
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
    sections: {
      leadTime: {
        label: 'Lead Time',
        content: 'Standard: ship in {leadTime} after order confirmation & payment.',
      },
      shipping: {
        label: 'Shipping',
        content: 'Shipping is not included. We can charge separately or ship via your carrier account.',
      },
      paymentTerms: {
        label: 'Payment Terms',
        content: 'All quoted prices are in U.S. dollars\nFull upfront payment required before production\nWire, Credit Card (3% fee), ACH (U.S. domestic only)',
      },
      terms: {
        label: 'Terms & Conditions',
        content: '1. This quotation is valid for {validDays} days from the date of issue. Pricing is subject to change after expiration.\n2. Customer is responsible for all applicable import duties, taxes, and customs fees.\n3. Lead time begins upon receipt of a signed Purchase Order and payment (or credit approval). Lead time is stated in business days.\n4. InstaVoxel retains no design responsibility. Parts are manufactured per customer-supplied drawings and specifications.\n5. Standard inspection is included. Formal dimensional inspection reports (FAI/CMM) available upon request at additional cost.\n6. Cancellation after production commencement may result in charges for materials consumed and work completed.\n7. For complete terms, visit: https://www.instavoxel.com/terms',
      },
    },
  };
}
