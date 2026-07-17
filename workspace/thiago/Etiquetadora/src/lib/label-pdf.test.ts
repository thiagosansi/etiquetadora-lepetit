import { describe, it, expect, vi } from "vitest";
import {
  SHEET_WIDTH_MM,
  SHEET_HEIGHT_MM,
  TARGET_DPI,
  mmToCssPx,
  pixelRatioForDpi,
  buildLabelsPdf,
  clampOffsetMm,
  MAX_OFFSET_MM,
  clampContentScale,
  computeImagePlacement,
  DEFAULT_CONTENT_SCALE,
} from "./label-pdf";

// html-to-image touches the DOM; unit tests run in node, so stub it out.
vi.mock("html-to-image", () => ({
  toPng: vi.fn(),
}));

/** Minimal valid 1x1 white PNG, enough for jsPDF's PNG parser. */
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const fakeSheet = () => ({} as unknown as HTMLElement);

describe("label-pdf geometry", () => {
  it("page format matches the physical sheet: 103mm x 30mm", () => {
    expect(SHEET_WIDTH_MM).toBe(103);
    expect(SHEET_HEIGHT_MM).toBe(30);
  });

  it("mmToCssPx converts using 96dpi CSS reference (1in = 25.4mm)", () => {
    expect(mmToCssPx(25.4)).toBeCloseTo(96, 10);
    expect(mmToCssPx(SHEET_WIDTH_MM)).toBeCloseTo(389.29, 1);
    expect(mmToCssPx(SHEET_HEIGHT_MM)).toBeCloseTo(113.39, 1);
  });

  it("pixelRatioForDpi(300) upscales 96dpi capture to 300dpi", () => {
    expect(pixelRatioForDpi(300)).toBeCloseTo(3.125, 10);
    expect(pixelRatioForDpi(TARGET_DPI) * mmToCssPx(SHEET_WIDTH_MM)).toBeCloseTo(
      (SHEET_WIDTH_MM / 25.4) * TARGET_DPI,
      6
    );
  });
});

describe("clampOffsetMm", () => {
  it("keeps values within [-15, 15]mm", () => {
    expect(clampOffsetMm(3.5)).toBe(3.5);
    expect(clampOffsetMm(-2)).toBe(-2);
    expect(clampOffsetMm(99)).toBe(MAX_OFFSET_MM);
    expect(clampOffsetMm(-99)).toBe(-MAX_OFFSET_MM);
  });

  it("maps invalid input to 0", () => {
    expect(clampOffsetMm(NaN)).toBe(0);
    expect(clampOffsetMm(Infinity)).toBe(0);
    expect(clampOffsetMm(-Infinity)).toBe(0);
  });
});

describe("content scale placement", () => {
  it("clampContentScale keeps values within [0.85, 1] and defaults invalid to 0.96", () => {
    expect(clampContentScale(0.9)).toBe(0.9);
    expect(clampContentScale(1.2)).toBe(1);
    expect(clampContentScale(0.5)).toBe(0.85);
    expect(clampContentScale(NaN)).toBe(DEFAULT_CONTENT_SCALE);
  });

  it("centers scaled content on the page", () => {
    const placement = computeImagePlacement(0, 0, 0.96);
    expect(placement.width).toBeCloseTo(103 * 0.96, 6);
    expect(placement.height).toBeCloseTo(30 * 0.96, 6);
    // Centered: equal free space on both sides.
    expect(placement.x).toBeCloseTo((103 - 103 * 0.96) / 2, 6);
    expect(placement.y).toBeCloseTo((30 - 30 * 0.96) / 2, 6);
    // Rightmost point pulled inward from the paper edge.
    expect(placement.x + placement.width).toBeCloseTo(103 - placement.x, 6);
  });

  it("applies offsets on top of the centered placement", () => {
    const placement = computeImagePlacement(-2, 1.5, 1);
    expect(placement).toEqual({ x: -2, y: 1.5, width: 103, height: 30 });
  });
});

describe("buildLabelsPdf pagination", () => {
  it("creates exactly one PDF page per sheet (no blank pages possible)", async () => {
    const renderStub = vi.fn().mockResolvedValue(TINY_PNG);
    const sheets = [fakeSheet(), fakeSheet(), fakeSheet()];

    const pdf = await buildLabelsPdf(sheets, { renderSheet: renderStub });

    expect(pdf.getNumberOfPages()).toBe(3);
    expect(renderStub).toHaveBeenCalledTimes(3);
  });

  it("applies calibration offsets without changing page count or size", async () => {
    const renderStub = vi.fn().mockResolvedValue(TINY_PNG);
    const pdf = await buildLabelsPdf([fakeSheet(), fakeSheet()], {
      renderSheet: renderStub,
      offsetXMm: -1.5,
      offsetYMm: 2,
    });

    expect(pdf.getNumberOfPages()).toBe(2);
    expect(pdf.internal.pageSize.width).toBeCloseTo(SHEET_WIDTH_MM, 1);
    expect(pdf.internal.pageSize.height).toBeCloseTo(SHEET_HEIGHT_MM, 1);
  });

  it("every page has the exact 103x30mm dimensions", async () => {
    const renderStub = vi.fn().mockResolvedValue(TINY_PNG);
    const pdf = await buildLabelsPdf([fakeSheet(), fakeSheet()], {
      renderSheet: renderStub,
    });

    for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
      pdf.setPage(page);
      const { width, height } = pdf.internal.pageSize;
      expect(width).toBeCloseTo(SHEET_WIDTH_MM, 1);
      expect(height).toBeCloseTo(SHEET_HEIGHT_MM, 1);
    }
  });

  it("rejects an empty sheet list", async () => {
    await expect(
      buildLabelsPdf([], { renderSheet: vi.fn() })
    ).rejects.toThrow(/at least one sheet/);
  });
});
