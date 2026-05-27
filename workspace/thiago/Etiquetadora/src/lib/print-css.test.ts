import { describe, it, expect } from "vitest";
import { PRINT_CSS } from "./print-css";

/**
 * Regression tests for the blank-pages print bug.
 *
 * Root cause (fixed in commit b484687+):
 *   1. `body { display: flex }` in paged media causes the browser to mis-paginate,
 *      producing blank pages after the real content.
 *   2. `.sheet:last-child` matched EVERY .sheet because each one is the sole child
 *      of its own .preview-sheet-scale parent.  This caused `break-after: auto` to
 *      override `break-after: page` on all sheets, removing explicit page breaks.
 *      Combined with flex layout, Safari/macOS generated 7 extra blank pages.
 */
describe("PRINT_CSS — blank-pages regression", () => {
  it("body must not use display:flex", () => {
    // Normalise whitespace so the check is formatting-agnostic.
    const bodyBlock = extractBlock(PRINT_CSS, "html, body");
    expect(bodyBlock).toBeTruthy();
    expect(bodyBlock).not.toMatch(/display\s*:\s*flex/);
  });

  it("wrapper divs must use display:contents to avoid ghost layout boxes", () => {
    // All three wrappers must appear together in a single selector block that
    // sets display:contents.  They must NOT be present in any block that sets
    // display:flex or display:block.
    const contentsBlock = extractBlockByProperty(PRINT_CSS, "display", "contents");
    expect(contentsBlock).toBeTruthy();
    expect(contentsBlock).toMatch(/\.print-area/);
    expect(contentsBlock).toMatch(/\.preview-sheet-wrap/);
    expect(contentsBlock).toMatch(/\.preview-sheet-scale/);
  });

  it(".sheet must declare break-after:page to force one page per sheet", () => {
    const sheetBlock = extractBlock(PRINT_CSS, ".sheet");
    expect(sheetBlock).toBeTruthy();
    expect(sheetBlock).toMatch(/break-after\s*:\s*page/);
    expect(sheetBlock).toMatch(/page-break-after\s*:\s*always/);
  });

  it("break-after:auto must target .preview-sheet-wrap:last-child .sheet, not .sheet:last-child", () => {
    // .sheet:last-child matches ALL sheets (each is :last-child of its own
    // .preview-sheet-scale).  The override must use the parent wrapper selector.
    expect(PRINT_CSS).toMatch(/\.preview-sheet-wrap:last-child\s+\.sheet/);

    // The bare `.sheet:last-child` selector must not appear anywhere in the CSS
    // (it was the source of the bug).
    expect(PRINT_CSS).not.toMatch(/\.sheet:last-child/);
  });

  it("body must not declare flex-direction", () => {
    const bodyBlock = extractBlock(PRINT_CSS, "html, body");
    expect(bodyBlock).not.toMatch(/flex-direction/);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the content of the first CSS block whose selector contains `selector`.
 * Returns the text between the opening and closing braces.
 */
function extractBlock(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}[^{]*\\{([^}]*)\\}`, "s");
  const match = css.match(re);
  return match ? match[1] : null;
}

/**
 * Finds the first block that contains `property: value` and returns the full
 * block content (selector + body joined).
 */
function extractBlockByProperty(css: string, property: string, value: string): string | null {
  const re = /([^{}]+)\{([^}]*)\}/gs;
  let match: RegExpExecArray | null;
  const propRe = new RegExp(`${property}\\s*:\\s*${value}`);
  while ((match = re.exec(css)) !== null) {
    const body = match[2];
    if (propRe.test(body)) {
      return match[1] + "{" + body + "}";
    }
  }
  return null;
}
