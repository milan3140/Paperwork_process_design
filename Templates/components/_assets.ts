/**
 * _assets — Centralised re-export of shared design-source images.
 *
 * All demo / document files import binary assets (3D model thumbnails,
 * marketing covers, etc.) from THIS file rather than reaching directly into
 * the `PaperWork_Design_Src/` tree with their own relative paths. When a
 * design source file gets moved or renamed, only this module needs editing —
 * the dozen-plus call sites are insulated from the change.
 *
 * Convention: export a SCREAMING_SNAKE constant per asset. Import sites can
 * alias on the fly:
 *
 *   import { MODEL_SHOT_1 as shot1, MODEL_SHOT_2 as shot2 } from '...';
 *
 * Vite resolves the import at build time, fingerprints the file, and rewrites
 * the URL — same behaviour as a direct import, just routed through this hub.
 */

// 3D-model placeholder shots — used by Factory BOM, Summary, Invoice v3,
// Packing Slip v5+, Traveler v2+ to fill the part-image slot in BOM rows.
export { default as MODEL_SHOT_1 } from '../../PaperWork_Design_Src/Design_Src_Pics_Specs/3D_model_pic_placeholder/3D_model_shot1.jpg';
export { default as MODEL_SHOT_2 } from '../../PaperWork_Design_Src/Design_Src_Pics_Specs/3D_model_pic_placeholder/3D_model_shot2.jpg';
