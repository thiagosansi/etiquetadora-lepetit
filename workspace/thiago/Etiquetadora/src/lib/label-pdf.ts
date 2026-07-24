import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * PDF-based label printing.
 *
 * Why PDF instead of browser HTML pagination:
 * the previous approach (dedicated window + @page 103mm x 30mm + break-after)
 * went through four fix iterations and still produced blank pages, cut logos
 * and content shifted between labels. Root cause: when the page height equals
 * the content height exactly (30mm), any sub-pixel mm-to-px rounding by the
 * browser or the printer driver overflows the page and inserts blank pages,
 * with cumulative drift across sheets.
 *
 * A PDF removes browser pagination entirely: the document has exactly one
 * 103mm x 30mm page per sheet, and each sheet is rasterized once and placed
 * at (0,0) with fixed dimensions. Blank pages become structurally impossible.
 */

export const SHEET_WIDTH_MM = 103;
export const SHEET_HEIGHT_MM = 30;

/** Raster resolution for the label images embedded in the PDF. */
export const TARGET_DPI = 300;

const CSS_PX_PER_INCH = 96;
const MM_PER_INCH = 25.4;

export function mmToCssPx(mm: number): number {
  return (mm / MM_PER_INCH) * CSS_PX_PER_INCH;
}

/** html-to-image pixelRatio needed so the capture comes out at `targetDpi`. */
export function pixelRatioForDpi(targetDpi: number): number {
  return targetDpi / CSS_PX_PER_INCH;
}

/**
 * Styles that exist only for the on-screen preview (rounded card look) and
 * must not appear on the printed label. Applied to the cloned node during
 * capture — the visible preview is untouched.
 */
const PREVIEW_ONLY_STYLE_OVERRIDES: Partial<CSSStyleDeclaration> = {
  borderRadius: "0",
  boxShadow: "none",
  border: "none",
  margin: "0",
  transform: "none",
};

export type SheetRenderer = (sheet: HTMLElement) => Promise<string>;

/** Max calibration offset. Larger values would push content off the label. */
export const MAX_OFFSET_MM = 15;

/**
 * Default content scale. Physical printers clip content near the paper edge
 * (their printable area is smaller than the paper), so the sheet image is
 * shrunk slightly and centered on the page — this mirrors the "fit to page"
 * behavior of the old print flow, which produced usable labels.
 */
export const DEFAULT_CONTENT_SCALE = 0.96;
export const MIN_CONTENT_SCALE = 0.85;
export const MAX_CONTENT_SCALE = 1;

/** Clamps a calibration offset to [-15, 15]mm; invalid input becomes 0. */
export function clampOffsetMm(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_OFFSET_MM, Math.max(-MAX_OFFSET_MM, value));
}

/** Clamps content scale to [0.85, 1]; invalid input falls back to default. */
export function clampContentScale(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CONTENT_SCALE;
  return Math.min(MAX_CONTENT_SCALE, Math.max(MIN_CONTENT_SCALE, value));
}

/** Computes the centered, offset placement of the sheet image on the page. */
export function computeImagePlacement(
  offsetXMm: number,
  offsetYMm: number,
  contentScale: number
): { x: number; y: number; width: number; height: number } {
  const scale = clampContentScale(contentScale);
  const width = SHEET_WIDTH_MM * scale;
  const height = SHEET_HEIGHT_MM * scale;
  return {
    x: clampOffsetMm(offsetXMm) + (SHEET_WIDTH_MM - width) / 2,
    y: clampOffsetMm(offsetYMm) + (SHEET_HEIGHT_MM - height) / 2,
    width,
    height,
  };
}

export interface BuildLabelsPdfOptions {
  renderSheet?: SheetRenderer;
  /** Shifts content right (positive) or left (negative) on every page, in mm. */
  offsetXMm?: number;
  /** Shifts content down (positive) or up (negative) on every page, in mm. */
  offsetYMm?: number;
  /** Shrinks content toward the page center (0.85–1). Default 0.96. */
  contentScale?: number;
}

const renderSheetToPng: SheetRenderer = (sheet) =>
  toPng(sheet, {
    cacheBust: true,
    pixelRatio: pixelRatioForDpi(TARGET_DPI),
    backgroundColor: "#ffffff",
    canvasWidth: Math.round(mmToCssPx(SHEET_WIDTH_MM) * pixelRatioForDpi(TARGET_DPI)),
    canvasHeight: Math.round(mmToCssPx(SHEET_HEIGHT_MM) * pixelRatioForDpi(TARGET_DPI)),
    style: PREVIEW_ONLY_STYLE_OVERRIDES as Record<string, string>,
  });

/**
 * Captures a single sheet element as a PNG data URL at 300 DPI.
 * Used by the direct-print flow (HTML print window) to pre-render all sheets
 * before the print dialog opens, avoiding Chrome PDF viewer lazy-rendering
 * which would otherwise produce blank pages for off-screen PDF pages.
 */
export const captureSheetAsPng: SheetRenderer = renderSheetToPng;

/**
 * Builds a PDF with one 103x30mm page per sheet element.
 * Optional X/Y offsets (mm) shift the content on every page to compensate
 * printer origin misalignment; the page size itself never changes.
 */
export async function buildLabelsPdf(
  sheets: HTMLElement[],
  options: BuildLabelsPdfOptions = {}
): Promise<jsPDF> {
  if (!sheets.length) {
    throw new Error("buildLabelsPdf requires at least one sheet element");
  }

  const renderSheet = options.renderSheet ?? renderSheetToPng;
  const placement = computeImagePlacement(
    options.offsetXMm ?? 0,
    options.offsetYMm ?? 0,
    options.contentScale ?? DEFAULT_CONTENT_SCALE
  );

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [SHEET_WIDTH_MM, SHEET_HEIGHT_MM],
    compress: true,
  });

  for (let index = 0; index < sheets.length; index++) {
    const pngDataUrl = await renderSheet(sheets[index]);
    if (index > 0) {
      pdf.addPage([SHEET_WIDTH_MM, SHEET_HEIGHT_MM], "landscape");
    }
    pdf.addImage(
      pngDataUrl,
      "PNG",
      placement.x,
      placement.y,
      placement.width,
      placement.height
    );
  }

  return pdf;
}
