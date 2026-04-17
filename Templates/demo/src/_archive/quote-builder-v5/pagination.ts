/**
 * Pagination — Re-exports from shared components
 *
 * This file re-exports the shared pagination logic
 * so existing imports within quote-builder-v5 continue to work.
 */

export {
  computePageLayouts,
  assignToPages,
  computeSpacerHeights,
  PAGE_HEIGHT_PX,
  HEADER_H,
  FOOTER_H,
  PAD_TOP,
  PAD_BOTTOM,
  AVAILABLE_H,
  TIGHT_GAP,
  MIN_GAP,
  CONT_HINT_TOP_H,
  CONT_HINT_BOTTOM_H,
  type SectionMeta,
  type PageLayout,
} from '../../../../components/pagination';
