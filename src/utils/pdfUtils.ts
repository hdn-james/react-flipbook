import * as pdfjsLib from "pdfjs-dist";
import type { FlipbookPage } from "../types";

export interface FlipbookSizeOptions {
  /** Maximum width constraint for the container (default: 1200) */
  maxWidth?: number;
  /** Maximum height constraint for the container (default: 900) */
  maxHeight?: number;
  /** Whether the flipbook is in single-page mode (default: false) */
  singlePageMode?: boolean;
}

export interface FlipbookSize {
  /** Calculated container width in pixels */
  width: number;
  /** Calculated container height in pixels */
  height: number;
  /** The aspect ratio of the container (width / height) */
  aspectRatio: number;
  /** Whether the page is landscape orientation */
  isLandscape: boolean;
}

/**
 * Calculate optimal flipbook container size based on page dimensions
 *
 * This function calculates the best container size that:
 * - Maintains the PDF page aspect ratio
 * - Fits within the specified max width/height constraints
 * - Accounts for single-page vs two-page spread modes
 *
 * @param pageWidth - The PDF page width (in points or pixels)
 * @param pageHeight - The PDF page height (in points or pixels)
 * @param options - Sizing options
 * @returns Calculated container dimensions
 *
 * @example
 * ```typescript
 * // Get first page info from PDF
 * const pdfInfo = await getPdfInfo('document.pdf');
 * const firstPage = pdfInfo.pageInfos[0];
 *
 * // Calculate optimal size for single-page mode
 * const size = calculateFlipbookSize(firstPage.width, firstPage.height, {
 *   singlePageMode: true,
 *   maxWidth: 800,
 *   maxHeight: 600,
 * });
 *
 * // Use with Flipbook component
 * <Flipbook pages={pages} width={size.width} height={size.height} singlePageMode />
 * ```
 */
export function calculateFlipbookSize(
  pageWidth: number,
  pageHeight: number,
  options: FlipbookSizeOptions = {},
): FlipbookSize {
  const { maxWidth = 1200, maxHeight = 900, singlePageMode = false } = options;

  const isLandscape = pageWidth > pageHeight;

  // In two-page mode with portrait pages, container shows 2 pages side by side
  // In single-page mode or with landscape pages, container shows 1 page
  const effectiveWidth =
    singlePageMode || isLandscape ? pageWidth : pageWidth * 2;
  const effectiveHeight = pageHeight;

  const aspectRatio = effectiveWidth / effectiveHeight;

  // Calculate size to fit within max constraints while preserving aspect ratio
  let containerWidth = maxWidth;
  let containerHeight = containerWidth / aspectRatio;

  // If height exceeds max, scale down based on height instead
  if (containerHeight > maxHeight) {
    containerHeight = maxHeight;
    containerWidth = containerHeight * aspectRatio;
  }

  return {
    width: Math.round(containerWidth),
    height: Math.round(containerHeight),
    aspectRatio,
    isLandscape,
  };
}

/**
 * Calculate optimal flipbook size from a FlipbookPage array
 * Uses the first page's dimensions for calculation
 *
 * @param pages - Array of FlipbookPage objects (must have at least one page with width/height)
 * @param options - Sizing options
 * @returns Calculated container dimensions, or null if pages don't have size info
 *
 * @example
 * ```typescript
 * const pages = await pdfToFlipbookPages('document.pdf');
 * const size = calculateFlipbookSizeFromPages(pages, { singlePageMode: true });
 *
 * if (size) {
 *   <Flipbook pages={pages} width={size.width} height={size.height} />
 * }
 * ```
 */
export function calculateFlipbookSizeFromPages(
  pages: FlipbookPage[],
  options: FlipbookSizeOptions = {},
): FlipbookSize | null {
  if (pages.length === 0) {
    return null;
  }

  const firstPage = pages[0];

  if (firstPage.width === undefined || firstPage.height === undefined) {
    return null;
  }

  return calculateFlipbookSize(firstPage.width, firstPage.height, options);
}

// Set up the worker - users need to configure this based on their setup
// For Vite/Webpack: import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
// Then call: setPdfWorkerSrc(workerSrc);

/**
 * Set the PDF.js worker source URL
 * Must be called before using any PDF functions
 *
 * @example
 * // For Vite
 * import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
 * setPdfWorkerSrc(workerSrc);
 *
 * // For CDN
 * setPdfWorkerSrc('https://unpkg.com/pdfjs-dist/build/pdf.worker.mjs');
 */
export function setPdfWorkerSrc(workerSrc: string): void {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

export interface PdfToImagesOptions {
  /** Scale factor for rendering (default: 2 for high DPI) */
  scale?: number;
  /** Image format: 'png' or 'jpeg' (default: 'png') */
  format?: "png" | "jpeg";
  /** JPEG quality 0-1 (default: 0.92) */
  quality?: number;
  /** Callback for progress updates */
  onProgress?: (current: number, total: number) => void;
  /** Specific page numbers to render (1-indexed). If not provided, renders all pages */
  pageNumbers?: number[];
}

export interface PdfPageInfo {
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Original PDF page width in points */
  width: number;
  /** Original PDF page height in points */
  height: number;
  /** Detected orientation */
  orientation: "portrait" | "landscape";
  /** Data URL of the rendered image */
  dataUrl: string;
}

/**
 * Load a PDF and convert pages to images
 *
 * @param source - PDF source: URL string, ArrayBuffer, or Uint8Array
 * @param options - Conversion options
 * @returns Promise resolving to array of FlipbookPage objects
 *
 * @example
 * ```typescript
 * import { pdfToFlipbookPages, setPdfWorkerSrc } from 'react-3d-flipbook/utils';
 *
 * // Set up worker first
 * setPdfWorkerSrc('https://unpkg.com/pdfjs-dist/build/pdf.worker.mjs');
 *
 * // Convert PDF to flipbook pages
 * const pages = await pdfToFlipbookPages('https://example.com/document.pdf', {
 *   scale: 2,
 *   onProgress: (current, total) => console.log(`Rendering page ${current}/${total}`)
 * });
 *
 * // Use with Flipbook component
 * <Flipbook pages={pages} width={800} height={600} />
 * ```
 */
export async function pdfToFlipbookPages(
  source: string | ArrayBuffer | Uint8Array,
  options: PdfToImagesOptions = {},
): Promise<FlipbookPage[]> {
  const {
    scale = 2,
    format = "png",
    quality = 0.92,
    onProgress,
    pageNumbers,
  } = options;

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument(source);
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  // Determine which pages to render
  const pagesToRender = pageNumbers
    ? pageNumbers.filter((p) => p >= 1 && p <= totalPages)
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages: FlipbookPage[] = [];

  for (let i = 0; i < pagesToRender.length; i++) {
    const pageNumber = pagesToRender[i];

    if (onProgress) {
      onProgress(i + 1, pagesToRender.length);
    }

    const pageInfo = await renderPdfPage(
      pdf,
      pageNumber,
      scale,
      format,
      quality,
    );

    pages.push({
      src: pageInfo.dataUrl,
      title: `Page ${pageNumber}`,
      width: pageInfo.width,
      height: pageInfo.height,
      orientation: pageInfo.orientation,
    });
  }

  return pages;
}

/**
 * Get PDF document info without rendering pages
 */
export async function getPdfInfo(
  source: string | ArrayBuffer | Uint8Array,
): Promise<{
  numPages: number;
  pageInfos: Array<{
    pageNumber: number;
    width: number;
    height: number;
    orientation: "portrait" | "landscape";
  }>;
}> {
  const loadingTask = pdfjsLib.getDocument(source);
  const pdf = await loadingTask.promise;

  const pageInfos = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const width = viewport.width;
    const height = viewport.height;

    pageInfos.push({
      pageNumber: i,
      width,
      height,
      orientation:
        width > height ? ("landscape" as const) : ("portrait" as const),
    });
  }

  return {
    numPages: pdf.numPages,
    pageInfos,
  };
}

/**
 * Render a single PDF page to an image
 */
async function renderPdfPage(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number,
  format: "png" | "jpeg",
  quality: number,
): Promise<PdfPageInfo> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  // Get original dimensions (at scale 1)
  const originalViewport = page.getViewport({ scale: 1 });
  const originalWidth = originalViewport.width;
  const originalHeight = originalViewport.height;

  // Create canvas
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render page to canvas
  await page.render({
    canvas,
    canvasContext: context,
    viewport: viewport,
  }).promise;

  // Convert to data URL
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  const dataUrl = canvas.toDataURL(mimeType, quality);

  // Clean up
  canvas.width = 0;
  canvas.height = 0;

  return {
    pageNumber,
    width: originalWidth,
    height: originalHeight,
    orientation: originalWidth > originalHeight ? "landscape" : "portrait",
    dataUrl,
  };
}

/**
 * Load PDF pages lazily (one at a time) for memory efficiency
 * Returns an async generator that yields pages one by one
 *
 * @example
 * ```typescript
 * const pages: FlipbookPage[] = [];
 * for await (const page of pdfToFlipbookPagesLazy(pdfUrl)) {
 *   pages.push(page);
 *   // Update UI progressively
 *   setPages([...pages]);
 * }
 * ```
 */
export async function* pdfToFlipbookPagesLazy(
  source: string | ArrayBuffer | Uint8Array,
  options: PdfToImagesOptions = {},
): AsyncGenerator<FlipbookPage, void, unknown> {
  const { scale = 2, format = "png", quality = 0.92, pageNumbers } = options;

  const loadingTask = pdfjsLib.getDocument(source);
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  const pagesToRender = pageNumbers
    ? pageNumbers.filter((p) => p >= 1 && p <= totalPages)
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  for (const pageNumber of pagesToRender) {
    const pageInfo = await renderPdfPage(
      pdf,
      pageNumber,
      scale,
      format,
      quality,
    );

    yield {
      src: pageInfo.dataUrl,
      title: `Page ${pageNumber}`,
      width: pageInfo.width,
      height: pageInfo.height,
      orientation: pageInfo.orientation,
    };
  }
}
