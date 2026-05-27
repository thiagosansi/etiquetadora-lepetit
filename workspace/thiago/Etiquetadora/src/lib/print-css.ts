/**
 * CSS injected into the dedicated print window opened by handlePrint.
 * Exported as a constant so it can be unit-tested independently.
 *
 * Pagination rules — why each choice matters:
 *
 *  1. body must NOT use `display:flex` — flex in paged media causes browsers (especially
 *     Safari/WebKit) to mis-paginate, producing blank pages.
 *
 *  2. The print body contains ONLY bare .sheet elements — no wrapper divs, no <script>.
 *     handlePrint queries `.print-area .sheet` and copies their outerHTML directly.
 *     Wrappers were tried in several combinations (display:contents, display:block with
 *     break-after on the wrapper, :last-of-type) but WebKit consistently produced blank
 *     pages from phantom wrapper height or incorrect break propagation.
 *
 *  3. `break-after:page` on .sheet, cancelled on `.sheet:last-child`.
 *     Because the body contains ONLY .sheet elements (no trailing <script>), :last-child
 *     unambiguously identifies the final sheet.  This gives one forced break between each
 *     pair of sheets and no forced break after the last one.
 */
export const PRINT_CSS = `
  * { box-sizing: border-box; }

  :root {
    --sheet-width: 103mm;
    --sheet-height: 30mm;
    --label-width: 50mm;
    --label-height: 30mm;
    --gap-x: 3mm;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: white;
  }

  @page {
    size: 103mm 30mm;
    margin: 0;
  }

  .sheet {
    width: var(--sheet-width);
    height: var(--sheet-height);
    min-width: var(--sheet-width);
    min-height: var(--sheet-height);
    display: grid;
    grid-template-columns: var(--label-width) var(--label-width);
    column-gap: var(--gap-x);
    background: white;
    margin: 0;
    overflow: hidden;
    break-after: page;
    page-break-after: always;
  }

  .sheet:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .label-box {
    width: var(--label-width);
    height: var(--label-height);
    padding: 1.5mm 1.8mm 1.2mm 2mm;
    overflow: hidden;
    font-family: Arial, Helvetica, sans-serif;
    color: #111;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
  }

  .label-inner {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1.2mm;
  }

  .left-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: left;
  }

  .brand-name {
    font-size: 2.95mm;
    font-weight: 700;
    line-height: 1;
    display: inline-block;
    text-decoration: underline;
    text-decoration-color: #d00000;
    text-decoration-thickness: 0.22mm;
    text-underline-offset: 0.28mm;
    margin-bottom: 0.5mm;
    white-space: nowrap;
  }

  .massa-topo {
    font-size: 2.45mm;
    line-height: 1;
    margin-bottom: 0.75mm;
    white-space: nowrap;
  }

  .line {
    font-size: 2.45mm;
    line-height: 1.08;
    margin-bottom: 0.25mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .footer-left {
    font-size: 1.9mm;
    line-height: 1.08;
    font-weight: 700;
    white-space: nowrap;
  }

  .footer-left:first-of-type {
    margin-top: 0.9mm;
  }

  .right-logo {
    width: 15.5mm;
    min-width: 15.5mm;
    height: 15.5mm;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.28;
    flex-shrink: 0;
  }

  .right-logo img {
    width: 100%;
    height: auto;
    object-fit: contain;
    filter: grayscale(100%) contrast(140%);
  }
`;
