/**
 * PaginatedDocument — Re-exports from shared components
 *
 * This file re-exports the shared PaginatedDocument component
 * so existing imports within quote-builder-v5 continue to work.
 */

export { PaginatedDocument, type PageSection } from '../../../components/PaginatedDocument';
export type { PaginatedDocumentProps } from '../../../components/PaginatedDocument';
export default PaginatedDocument;

import { PaginatedDocument } from '../../../components/PaginatedDocument';
