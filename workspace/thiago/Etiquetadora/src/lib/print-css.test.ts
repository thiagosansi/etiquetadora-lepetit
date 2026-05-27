import { describe, it, expect } from "vitest";
import { PRINT_CSS } from "./print-css";

/**
 * Regression tests for the blank-pages print bug (two iterations of fixes).
 *
 * Original root causes:
 *  A. `body { display:flex }` — flex in paged media mis-paginates in Safari/WebKit.
 *  B. `.sheet:last-child` matched ALL .sheet elements (each is sole child of its
 *     .preview-sheet-scale parent), so break-after:auto fired on every sheet.
 *
 * Second iteration root causes (from the display:contents fix):
 *  C. `display:contents` on wrappers caused WebKit to lose content during pagination,
 *     printing only 1 real page then blank pages.
 *  D. `.preview-sheet-wrap:last-child` never matched because the <script> tag is always
 *     the last child of body — so break-after:page remained on every wrapper including
 *     the last, producing a trailing blank page.
 *
 * Correct approach:
 *  - break-after:page on .preview-sheet-wrap (outermost wrapper), not on .sheet
 *  - :last-of-type to cancel the break on the last wrapper (ignores the <script> sibling)
 *  - plain display:block on wrappers (no display:contents, no display:flex on body)
 */
describe("PRINT_CSS — blank-pages regression", () => {
  // ── Invariant 1: no flex on body ──────────────────────────────────────────
  it("body must not use display:flex", () => {
    const bodyBlock = extractBlock(PRINT_CSS, "html, body");
    expect(bodyBlock).toBeTruthy();
    expect(bodyBlock).not.toMatch(/display\s*:\s*flex/);
  });

  it("body must not declare flex-direction", () => {
    const bodyBlock = extractBlock(PRINT_CSS, "html, body");
    expect(bodyBlock).not.toMatch(/flex-direction/);
  });

  // ── Invariant 2: wrappers must be plain blocks, not display:contents ──────
  it("wrappers must use display:block (not display:contents)", () => {
    const wrappersBlock = extractBlock(PRINT_CSS, ".preview-sheet-wrap,\n  .preview-sheet-scale");
    expect(wrappersBlock).toBeTruthy();
    expect(wrappersBlock).toMatch(/display\s*:\s*block/);
    expect(wrappersBlock).not.toMatch(/display\s*:\s*contents/);
  });

  it("PRINT_CSS must not use display:contents anywhere", () => {
    expect(PRINT_CSS).not.toMatch(/display\s*:\s*contents/);
  });

  // ── Invariant 3: page break must be on .preview-sheet-wrap ────────────────
  it(".preview-sheet-wrap must declare break-after:page", () => {
    // There are two .preview-sheet-wrap blocks; we want the standalone one that
    // carries the page-break rules (not the shared block with .preview-sheet-scale).
    const wrapBlock = extractExactBlock(PRINT_CSS, ".preview-sheet-wrap");
    expect(wrapBlock).toBeTruthy();
    expect(wrapBlock).toMatch(/break-after\s*:\s*page/);
    expect(wrapBlock).toMatch(/page-break-after\s*:\s*always/);
  });

  // ── Invariant 4: :last-of-type cancels the break, :last-child must not ────
  it("break-after:auto must use :last-of-type, not :last-child", () => {
    // :last-of-type correctly ignores the trailing <script> element in body.
    expect(PRINT_CSS).toMatch(/\.preview-sheet-wrap:last-of-type/);

    // :last-child would never match because <script> is always the true last
    // child of body — this selector must be absent from the CSS.
    expect(PRINT_CSS).not.toMatch(/\.preview-sheet-wrap:last-child/);
    expect(PRINT_CSS).not.toMatch(/\.sheet:last-child/);
  });

  it(".preview-sheet-wrap:last-of-type must cancel page break", () => {
    const lastBlock = extractBlock(PRINT_CSS, ".preview-sheet-wrap:last-of-type");
    expect(lastBlock).toBeTruthy();
    expect(lastBlock).toMatch(/break-after\s*:\s*auto/);
    expect(lastBlock).toMatch(/page-break-after\s*:\s*auto/);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the body of the first CSS block whose selector contains `selector`.
 */
function extractBlock(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}[^{]*\\{([^}]*)\\}`, "s");
  const match = css.match(re);
  return match ? match[1] : null;
}

/**
 * Extracts the body of a block whose selector is EXACTLY `selector` (trimmed),
 * i.e. the selector is not part of a comma-separated group.
 */
function extractExactBlock(css: string, selector: string): string | null {
  const re = /([^{}]+)\{([^}]*)\}/gs;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    const rawSelector = match[1].trim();
    // Accept only single-selector blocks that match exactly.
    if (rawSelector === selector) return match[2];
  }
  return null;
}
