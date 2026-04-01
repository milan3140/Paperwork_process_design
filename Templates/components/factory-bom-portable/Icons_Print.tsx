/**
 * Icons_Print — Single source of truth for all document SVG icons
 *
 * All icons used in printed/PDF document components are registered here.
 * Never write inline SVGs in document components — import from this file.
 *
 * Icons are Lucide-style: stroke-based, 24x24 viewBox, stroke-width 2,
 * round caps and joins. Each icon is a function that takes a size (px)
 * and returns a React SVG element.
 *
 * The InstaVoxel logo is a special case: filled path, 40x38 viewBox.
 *
 * ⚠️ REQUIRES: None (standalone)
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * Each icon function:
 * | Param | Type   | Description                        |
 * |-------|--------|------------------------------------|
 * | size  | number | Width and height in pixels          |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — icons are purely visual SVG elements.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - size: Controls the rendered width/height of the SVG
 * - color: Inherited from parent via CSS `color` property (stroke="currentColor")
 * - logo fill: Accepts an optional `fill` param (default: "white")
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   import { PRINT_ICONS } from './Icons_Print';
 *
 *   // Standard icon
 *   {PRINT_ICONS.file(10)}
 *   {PRINT_ICONS.alertTriangle(14)}
 *   {PRINT_ICONS.checkCircle(12)}
 *
 *   // Logo (white on purple header)
 *   {PRINT_ICONS.logo(24)}
 *
 *   // Logo with custom fill
 *   {PRINT_ICONS.logo(24, '#2E0D77')}
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use this registry for ALL SVG icons in document components.
 * Never write inline <svg> elements in component files.
 *
 * ─── Adding a new icon ─────────────────────────────────────────────────────
 *
 *   1. Add the icon function to PRINT_ICONS
 *   2. Add its name to the PrintIconName type
 *   3. Use Lucide icon paths (https://lucide.dev)
 */

import React from 'react';

type IconFn = (size: number, fill?: string) => React.ReactElement;

export const PRINT_ICONS: Record<string, IconFn> = {

  /** InstaVoxel brand logo — filled path, not stroke-based */
  logo: (size, fill = 'white') => (
    <svg width={size} height={size} viewBox="0 0 40 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.76 0.318C15.244 0.317 10.878 1.942 7.451 4.898C4.024 7.855 1.764 11.947 1.079 16.435C0.393 20.922 1.329 25.508 3.716 29.362C6.103 33.216 9.783 36.083 14.091 37.444V16.677L25.429 13.618V37.444C29.737 36.083 33.417 33.216 35.804 29.362C38.191 25.508 39.126 20.922 38.441 16.435C37.756 11.947 35.495 7.855 32.068 4.898C28.642 1.942 24.275 0.317 19.76 0.318Z" fill={fill}/>
    </svg>
  ),

  /** InstaVoxel brand logo + text — SVG from Instavoxel_Logo_Text.html
   *  viewBox 0 0 1215.08 283.46, rendered at given height with auto width */
  logoText: (height: number, fill = 'white') => (
    <svg height={height} viewBox="0 0 1215.08 283.46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M141.73,0A141.75,141.75,0,0,0,99.21,277V122l85-22.79V277A141.75,141.75,0,0,0,141.73,0Z" fill={fill}/>
      <polygon fill={fill} points="424.64 85.03 424.64 198.4 396.86 198.4 396.86 92.48 424.64 85.03"/>
      <path fill={fill} d="M533.06,152.25v46.14H506.24V158.16c0-13.58-6.41-18.69-17.27-18.69a24.9,24.9,0,0,0-18.36,7.79v51.13H444V124.21l25.4-7v11.26h.29c4-4.15,12.61-11.19,28.92-11.19C518.35,117.26,533.06,128.28,533.06,152.25Z"/>
      <path fill={fill} d="M611.47,143.94a50.59,50.59,0,0,0-26.83-7.51c-8.62,0-11.82,1.76-11.82,4.79,0,3.36,3.19,4.63,19.8,7.51,16.77,2.87,28.42,8.62,28.42,24.43,0,17.56-16,27.14-38.16,27.14-21.72,0-32.73-7.35-36.89-10.06l7.35-19.32a47.34,47.34,0,0,0,28.42,9.26c9.74,0,12.77-2.23,12.77-5.11,0-3.52-3.19-5.11-19.48-8.14-16.44-3.19-27.46-8.3-27.46-24.75,0-16.29,16.12-24.91,37.36-24.91,18.84,0,28.26,5.11,33.85,8.46Z"/>
      <path fill={fill} d="M664.32,139.77v20.79c0,13.24,4.78,17.06,15.63,17.06A26.92,26.92,0,0,0,690,175.9v21.54c-1.72.8-8,2.73-16.43,2.73-22,0-35.92-7.38-35.92-37V139.78h-11V119.2h11V108.72l26.65-7.24v17.73H690v20.58H664.32Z"/>
      <path fill={fill} d="M737.94,151.44c8.3,0,14.37.64,16.13.8v-.8c0-8.3-5-13.25-18.2-13.25-14.21,0-23.47,5.75-27.79,9.26l-8.14-17.57c6.07-4.63,18.68-12.61,41-12.61,28.42,0,39.28,14.53,39.28,35.29v45.83H755.35v-9.1H755c-2.71,3.35-9.74,11-28.1,11-18,0-27.78-9.26-27.78-24.43C699.14,159.9,714.63,151.44,737.94,151.44Zm-1.44,29.22c11,0,16-5.11,17.57-7v-6.55c-3-.16-7.35-.16-13.25-.16-11.18,0-15.49,2.55-15.49,6.87S728.68,180.66,736.5,180.66Z"/>
      <path fill={fill} d="M856.42,198.39h-29.7L778.66,88.21h30.66l32.41,81.12h.32l32.57-81.12h29.86Z"/>
      <path fill={fill} d="M943.77,200.3c-25.71,0-46.79-13.57-46.79-41.52,0-27.79,21.08-41.52,46.79-41.52,25.87,0,47,13.73,47,41.52C990.72,186.73,969.64,200.3,943.77,200.3Zm0-61.48c-11.34,0-19.32,6.87-19.32,19.8,0,12.77,8,19.64,19.32,19.64,11.5,0,19.48-6.87,19.48-19.64C963.25,145.69,955.27,138.82,943.77,138.82Z"/>
      <path fill={fill} d="M1055.7,158.47l33.38,39.92H1056L1038.62,176h-.32l-16.45,22.35H990.39l33.37-40.72-32.09-38.48h33.05l16.13,20.92h.32l15.17-20.92h31.46Z"/>
      <path fill={fill} d="M1133.16,117.27c28.26,0,40.56,16.29,40.56,40.72v6.55H1115c1.44,8.46,8,14.21,22.83,14.21,15.65,0,23.47-5.43,27-7.83l8.46,17.88c-6.07,4.63-17.73,11.5-39.92,11.5-27.94,0-44.55-15-44.55-41.68C1088.76,132.12,1108.56,117.27,1133.16,117.27ZM1115,150h33.69c-.16-6.86-5.59-12.61-15.65-12.61S1116.23,142,1115,150Z"/>
      <polygon fill={fill} points="1215.08 85.03 1215.08 198.4 1188.39 198.4 1188.39 92.28 1215.08 85.03"/>
    </svg>
  ),

  /** File/document icon — used in file tags */
  file: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),

  /** Warning triangle — used in WarningBox */
  alertTriangle: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),

  /** Bank/building icon — bank transfer payment */
  bankTransfer: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 10h20"/>
    </svg>
  ),

  /** Credit card icon */
  creditCard: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),

  /** Shield icon — NET 30 / secured payment */
  shield: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),

  /** Check circle — certifications, compliance */
  checkCircle: (size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

/** All available print icon names */
export type PrintIconName = keyof typeof PRINT_ICONS;

export default PRINT_ICONS;
