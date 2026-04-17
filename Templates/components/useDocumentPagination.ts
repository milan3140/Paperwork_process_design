import { MutableRefObject, useLayoutEffect, useRef, useState } from 'react';

export interface PageAssignments {
  /** For each atom index (0-based), which page (0-based) it belongs to */
  atomPage: number[];
  /** Total number of pages */
  pageCount: number;
  /** Atom indices on each page: pageAtoms[p] = [i, j, ...] in order */
  pageAtoms: number[][];
}

/**
 * Two-pass document pagination hook.
 *
 * ─── How it works ──────────────────────────────────────────────
 *
 * Pass 1 (invisible): The caller renders every atom + fixed sections inside a
 *   hidden off-screen sandbox div. useLayoutEffect fires synchronously after
 *   the DOM is committed — before the browser's first paint — and measures the
 *   actual rendered heights via getBoundingClientRect().
 *
 * Pass 2 (visible): The hook stores computed page assignments in state, which
 *   triggers a re-render. The caller uses assignments.pageAtoms[pageIdx] to
 *   render each page with exactly the atoms that fit. This second render is the
 *   first thing the user ever sees.
 *
 * ─── Atom model ────────────────────────────────────────────────
 *
 * "Atoms" are indivisible content blocks. They are direct flex children of
 * doc-content on their assigned page, separated by contentGap (24px).
 *
 * Atom[0] is always the section label (SectionLabel "Quoted Parts…" etc.).
 * Atoms[1..N] are PartBlocks. Atoms[N+1..] are tail sections (NRE, Totals…).
 *
 * ─── Available height calculation ──────────────────────────────
 *
 * Page 0:  pageContentH  −  fixedH  −  contentGap
 *   (fixedH  = height of Title+Meta+Parties+KeyInfo measured as a flex col)
 *   (contentGap = gap between the fixed block and atom[0])
 *
 * Page 1+: pageContentH  −  contLabelH  −  contentGap
 *   (contLabelH = height of the "… continued" label)
 *   (contentGap = gap between the cont label and first atom on that page)
 *
 * pageContentH is measured from an empty reference doc-page rendered in the
 * sandbox so it automatically reflects header + footer + padding tokens.
 *
 * ─── Usage ─────────────────────────────────────────────────────
 *
 *   const { contentMeasureRef, fixedRef, contLabelRef, atomRefs, assignments, isReady }
 *     = useDocumentPagination(atoms.length, 24);
 *
 *   // In the sandbox (hidden, off-screen):
 *   <div className="doc-page">
 *     <DocumentHeader … />
 *     <div className="doc-content" ref={contentMeasureRef} style={{ minHeight: 0 }} />
 *     <DocumentFooter … />
 *   </div>
 *   <div ref={fixedRef} style={{ display:'flex', flexDirection:'column', gap:'var(--doc-content-gap)' }}>
 *     <TitleRow /> <PartiesRow /> <KeyInfoRow />
 *   </div>
 *   <div ref={contLabelRef}><ContLabel /></div>
 *   {atoms.map((a, i) => (
 *     <div key={a.key} ref={el => { atomRefs.current[i] = el; }}>{a.node}</div>
 *   ))}
 *
 *   // Main render: when isReady, map assignments.pageAtoms[pageIdx] → atoms
 *
 * @param atomCount   Number of atoms to distribute across pages
 * @param contentGap  Gap between doc-content flex children in px (--doc-content-gap = 24)
 * @param atomGroups  Optional group labels per atom. Same-group consecutive atoms use tightGap instead of contentGap.
 * @param tightGap    Gap between same-group consecutive atoms (default: 4px)
 */
export function useDocumentPagination(
  atomCount: number,
  contentGap: number,
  atomGroups?: (string | undefined)[],
  tightGap: number = 4,
): {
  contentMeasureRef: MutableRefObject<HTMLDivElement | null>;
  fixedRef: MutableRefObject<HTMLDivElement | null>;
  contLabelRef: MutableRefObject<HTMLDivElement | null>;
  atomRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  assignments: PageAssignments | null;
  isReady: boolean;
} {
  const contentMeasureRef = useRef<HTMLDivElement | null>(null);
  const fixedRef          = useRef<HTMLDivElement | null>(null);
  const contLabelRef      = useRef<HTMLDivElement | null>(null);
  const atomRefs: MutableRefObject<(HTMLDivElement | null)[]> = useRef([]);

  const [assignments, setAssignments] = useState<PageAssignments | null>(null);

  // Keep atomRefs sized correctly. Mutating a ref during render is safe.
  if (atomRefs.current.length !== atomCount) {
    atomRefs.current = new Array(atomCount).fill(null);
  }

  useLayoutEffect(() => {
    const contentEl = contentMeasureRef.current;
    const fixedEl   = fixedRef.current;
    if (!contentEl || !fixedEl) return;

    // Ensure all atom ref slots are populated
    const refs = atomRefs.current.slice(0, atomCount);
    if (atomCount > 0 && refs.some(el => !el)) return;

    const pageContentH = contentEl.getBoundingClientRect().height;
    if (pageContentH <= 0) return; // sandbox not yet laid out (e.g., display:none parent)

    const fixedH      = fixedEl.getBoundingClientRect().height;
    const contLabelH  = contLabelRef.current
      ? contLabelRef.current.getBoundingClientRect().height
      : 0;
    const atomHeights = refs.map(el => el!.getBoundingClientRect().height);

    // Reserve space for continuation hints (dots pattern)
    // Each hint occupies: contentGap (flex gap before it) + margins + text
    // Bottom: contentGap + 42px marginTop + 14px marginBottom + ~14px text
    // Top:    contentGap + 14px marginTop + 42px marginBottom + ~14px text
    const CONT_HINT_H = 70 + contentGap;

    // Available height for atoms on each page type
    // First page: may need bottom hint if multi-page (use optimistic first, adjust later)
    const firstAvail = pageContentH - fixedH     - contentGap;
    const contAvail  = pageContentH - contLabelH - contentGap - CONT_HINT_H * 2; // top + bottom hints

    // Two-pass greedy bin-packing (same approach as pagination.ts):
    // Pass 1: try without hint reserves — if single page, no hints needed
    // Pass 2: if multi-page, re-run with hint space deducted
    function binPack(firstH: number, contH: number) {
      const result: number[] = [];
      let pg = 0, av = Math.max(0, firstH), us = 0;
      for (let i = 0; i < atomCount; i++) {
        const h = atomHeights[i];
        // Use tight gap between same-group consecutive atoms
        const prevGroup = i > 0 && result[i - 1] === pg ? atomGroups?.[i - 1] : undefined;
        const currGroup = atomGroups?.[i];
        const sameGroup = currGroup && prevGroup && currGroup === prevGroup;
        const gap = us > 0 ? (sameGroup ? tightGap : contentGap) : 0;
        if (h > 0 && us + gap + h > av) {
          pg++;
          av = Math.max(0, contH);
          us = h;
        } else {
          us += gap + h;
        }
        result.push(pg);
      }
      return result;
    }

    // Pass 1: optimistic (no hint reserves)
    let atomPage = binPack(firstAvail, pageContentH - contLabelH - contentGap);
    let pageCount = atomCount === 0 ? 1 : (atomPage[atomPage.length - 1] ?? 0) + 1;

    // Pass 2: if multi-page, re-run with hint space
    if (pageCount > 1) {
      const firstWithHint = firstAvail - CONT_HINT_H; // bottom hint on first page
      atomPage = binPack(firstWithHint, contAvail);
      pageCount = atomCount === 0 ? 1 : (atomPage[atomPage.length - 1] ?? 0) + 1;
    }
    const pageAtoms: number[][] = Array.from({ length: pageCount }, () => []);
    atomPage.forEach((p, i) => pageAtoms[p].push(i));

    // Bail out if assignments haven't changed to prevent re-render loops
    setAssignments(prev => {
      if (
        prev !== null &&
        prev.pageCount === pageCount &&
        prev.atomPage.length === atomPage.length &&
        prev.atomPage.every((p, i) => p === atomPage[i])
      ) {
        return prev;
      }
      return { atomPage, pageCount, pageAtoms };
    });
  }); // No dependency array: runs every render, bail-out prevents infinite loops

  return {
    contentMeasureRef,
    fixedRef,
    contLabelRef,
    atomRefs,
    assignments,
    isReady: assignments !== null,
  };
}
