import { describe, it, expect } from "vitest";
import { PRINT_CSS } from "./print-css";

/**
 * Regression tests for the blank-pages print bug (three iterations of fixes).
 *
 * History of root causes:
 *  v1 – `body { display:flex }` mis-paginated in WebKit.
 *       `.sheet:last-child` matched ALL sheets (each is sole :last-child of its
 *       own .preview-sheet-scale), so break-after:auto fired everywhere.
 *
 *  v2 – Switched to `display:contents` on wrappers → WebKit dropped content,
 *       printing only 1 real page.
 *       `.preview-sheet-wrap:last-child` never matched because <script> was the
 *       true last child of body.
 *
 *  v3 – Moved break-after to .preview-sheet-wrap, used :last-of-type.
 *       Wrappers still produced phantom height causing 6 trailing blank pages.
 *
 *  v4 (current) – handlePrint now queries .sheet elements directly and injects
 *       only their outerHTML into body (no wrappers). <script> moved to <head>.
 *       Body contains ONLY .sheet divs → :last-child is unambiguous →
 *       break-after:page between sheets, break-after:auto after the last one.
 */
describe("PRINT_CSS — blank-pages regression", () => {
  // ── body must never use flex ───────────────────────────────────────────────
  it("body must not use display:flex", () => {
    const bodyBlock = extractBlock(PRINT_CSS, "html, body");
    expect(bodyBlock).toBeTruthy();
    expect(bodyBlock).not.toMatch(/display\s*:\s*flex/);
  });

  it("body must not declare flex-direction", () => {
    const bodyBlock = extractBlock(PRINT_CSS, "html, body");
    expect(bodyBlock).not.toMatch(/flex-direction/);
  });

  // ── no display:contents anywhere ──────────────────────────────────────────
  it("must not use display:contents anywhere", () => {
    expect(PRINT_CSS).not.toMatch(/display\s*:\s*contents/);
  });

  // ── .sheet carries the page-break ─────────────────────────────────────────
  it(".sheet must declare break-after:page", () => {
    const sheetBlock = extractBlock(PRINT_CSS, ".sheet");
    expect(sheetBlock).toBeTruthy();
    expect(sheetBlock).toMatch(/break-after\s*:\s*page/);
    expect(sheetBlock).toMatch(/page-break-after\s*:\s*always/);
  });

  // ── .sheet:last-child cancels the break (no trailing blank page) ──────────
  it(".sheet:last-child must cancel break-after", () => {
    const lastBlock = extractExactBlock(PRINT_CSS, ".sheet:last-child");
    expect(lastBlock).toBeTruthy();
    expect(lastBlock).toMatch(/break-after\s*:\s*auto/);
    expect(lastBlock).toMatch(/page-break-after\s*:\s*auto/);
  });

  // ── dangerous selectors that caused previous regressions must be absent ───
  it("must not use wrapper-based break selectors from previous failed attempts", () => {
    // v1 regression: matched all sheets because each .sheet is sole child of
    // its own .preview-sheet-scale parent.
    expect(PRINT_CSS).not.toMatch(/\.preview-sheet-wrap:last-child/);

    // v3 regression: :last-of-type on wrapper still left phantom height.
    expect(PRINT_CSS).not.toMatch(/\.preview-sheet-wrap:last-of-type/);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractBlock(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}[^{]*\\{([^}]*)\\}`, "s");
  const match = css.match(re);
  return match ? match[1] : null;
}

function extractExactBlock(css: string, selector: string): string | null {
  const re = /([^{}]+)\{([^}]*)\}/gs;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    if (match[1].trim() === selector) return match[2];
  }
  return null;
}
