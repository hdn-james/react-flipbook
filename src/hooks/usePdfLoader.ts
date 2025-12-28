import { useState, useCallback, useRef, useEffect } from "react";
import type { FlipbookPage } from "../types";

// PDF.js types (minimal definitions for our use case)
interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  destroy: () => Promise<void>;
}

interface PDFPageProxy {
  getViewport: (options: {
    scale: number;
    rotation?: number;
  }) => PDFPageViewport;
  render: (params: PDFRenderParams) => PDFRenderTask;
  getTextContent: (params?: {
    normalizeWhitespace?: boolean;
  }) => Promise<PDFTextContent>;
  cleanup: () => void;
}

interface PDFPageViewport {
  width: number;
  height: number;
  scale: number;
  rotation: number;
  viewBox: number[];
  transform: number[];
  clone: (options?: { scale?: number; rotation?: number }) => PDFPageViewport;
}

interface PDFRenderParams {
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFPageViewport;
  enableWebGL?: boolean;
  renderInteractiveForms?: boolean;
  transform?: number[];
}

interface PDFRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

interface PDFTextContent {
  items: PDFTextItem[];
  styles: Record<string, unknown>;
}

interface PDFTextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

interface PDFDocumentLoadingTask {
  promise: Promise<PDFDocumentProxy>;
  destroy: () => Promise<void>;
  onProgress?: (progress: { loaded: number; total: number }) => void;
}

// Global PDF.js library type
interface PDFJSLib {
  getDocument: (
    src:
      | string
      | { url: string; [key: string]: unknown }
      | ArrayBuffer
      | Uint8Array,
  ) => PDFDocumentLoadingTask;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  version: string;
}

declare global {
  interface Window {
    pdfjsLib?: PDFJSLib;
  }
}

export interface UsePdfLoaderOptions {
  /** PDF file URL or ArrayBuffer */
  source: string | ArrayBuffer | Uint8Array | null;
  /** PDF.js worker source URL (required for PDF.js to work) */
  workerSrc?: string;
  /** Scale factor for rendering pages (default: 1.5) */
  scale?: number;
  /** Whether to extract text content for search */
  extractText?: boolean;
  /** Maximum texture size for page rendering */
  maxTextureSize?: number;
  /** Callback when loading starts */
  onLoadStart?: () => void;
  /** Callback for loading progress */
  onLoadProgress?: (progress: number) => void;
  /** Callback when loading completes */
  onLoadComplete?: (numPages: number) => void;
  /** Callback when loading fails */
  onLoadError?: (error: Error) => void;
  /** Callback when a page is rendered */
  onPageRendered?: (pageNumber: number, dataUrl: string) => void;
}

export interface UsePdfLoaderReturn {
  /** Whether PDF.js is available */
  isAvailable: boolean;
  /** Whether the PDF is currently loading */
  isLoading: boolean;
  /** Loading progress (0-1) */
  progress: number;
  /** Any error that occurred during loading */
  error: Error | null;
  /** Number of pages in the PDF */
  numPages: number;
  /** Generated flipbook pages */
  pages: FlipbookPage[];
  /** Text content extracted from pages (for search) */
  textContent: Map<number, string>;
  /** Load a PDF from a source */
  loadPdf: (source: string | ArrayBuffer | Uint8Array) => Promise<void>;
  /** Render a specific page to canvas/image */
  renderPage: (
    pageNumber: number,
    options?: { scale?: number; format?: "png" | "jpeg"; quality?: number },
  ) => Promise<string>;
  /** Get text content from a specific page */
  getPageText: (pageNumber: number) => Promise<string>;
  /** Cleanup and destroy the PDF document */
  destroy: () => void;
}

export function usePdfLoader(
  options: UsePdfLoaderOptions = { source: null },
): UsePdfLoaderReturn {
  const {
    source,
    workerSrc,
    scale = 1.5,
    extractText = true,
    maxTextureSize = 4096,
    onLoadStart,
    onLoadProgress,
    onLoadComplete,
    onLoadError,
    onPageRendered,
  } = options;

  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState<FlipbookPage[]>([]);
  const [textContent, setTextContent] = useState<Map<number, string>>(
    new Map(),
  );

  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const renderingRef = useRef<Set<number>>(new Set());
  const canvasCacheRef = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Check if PDF.js is available
  useEffect(() => {
    const checkPdfJs = () => {
      if (typeof window !== "undefined" && window.pdfjsLib) {
        setIsAvailable(true);

        // Set worker source if provided
        if (workerSrc) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        }
      } else {
        setIsAvailable(false);
      }
    };

    checkPdfJs();

    // Check again after a short delay in case PDF.js is loaded asynchronously
    const timer = setTimeout(checkPdfJs, 100);
    return () => clearTimeout(timer);
  }, [workerSrc]);

  // Calculate optimal scale based on max texture size
  const calculateOptimalScale = useCallback(
    (width: number, height: number, baseScale: number): number => {
      const scaledWidth = width * baseScale;
      const scaledHeight = height * baseScale;
      const maxDimension = Math.max(scaledWidth, scaledHeight);

      if (maxDimension > maxTextureSize) {
        return (baseScale * maxTextureSize) / maxDimension;
      }

      return baseScale;
    },
    [maxTextureSize],
  );

  // Render a single page to canvas and return data URL
  const renderPage = useCallback(
    async (
      pageNumber: number,
      renderOptions?: {
        scale?: number;
        format?: "png" | "jpeg";
        quality?: number;
      },
    ): Promise<string> => {
      if (!pdfDocRef.current) {
        throw new Error("PDF document not loaded");
      }

      const renderScale = renderOptions?.scale ?? scale;
      const format = renderOptions?.format ?? "png";
      const quality = renderOptions?.quality ?? 0.92;

      // Check if already rendering this page
      if (renderingRef.current.has(pageNumber)) {
        // Wait for existing render to complete
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!renderingRef.current.has(pageNumber)) {
              clearInterval(checkInterval);
              const cached = canvasCacheRef.current.get(pageNumber);
              if (cached) {
                resolve(cached.toDataURL(`image/${format}`, quality));
              }
            }
          }, 100);
        });
      }

      // Check cache first
      const cachedCanvas = canvasCacheRef.current.get(pageNumber);
      if (cachedCanvas) {
        return cachedCanvas.toDataURL(`image/${format}`, quality);
      }

      renderingRef.current.add(pageNumber);

      try {
        const page = await pdfDocRef.current.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });

        // Calculate optimal scale
        const optimalScale = calculateOptimalScale(
          baseViewport.width,
          baseViewport.height,
          renderScale,
        );

        const viewport = page.getViewport({ scale: optimalScale });

        // Create canvas
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Failed to get canvas context");
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Render page
        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        // Cache the canvas
        canvasCacheRef.current.set(pageNumber, canvas);

        // Convert to data URL
        const dataUrl = canvas.toDataURL(`image/${format}`, quality);

        // Cleanup
        page.cleanup();
        renderingRef.current.delete(pageNumber);

        onPageRendered?.(pageNumber, dataUrl);

        return dataUrl;
      } catch (err) {
        renderingRef.current.delete(pageNumber);
        throw err;
      }
    },
    [scale, calculateOptimalScale, onPageRendered],
  );

  // Get text content from a page
  const getPageText = useCallback(
    async (pageNumber: number): Promise<string> => {
      if (!pdfDocRef.current) {
        throw new Error("PDF document not loaded");
      }

      // Check cache first
      if (textContent.has(pageNumber - 1)) {
        return textContent.get(pageNumber - 1) || "";
      }

      const page = await pdfDocRef.current.getPage(pageNumber);
      const content = await page.getTextContent({ normalizeWhitespace: true });

      const text = content.items
        .map((item) => (item as PDFTextItem).str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      // Update cache
      setTextContent((prev) => new Map(prev).set(pageNumber - 1, text));

      page.cleanup();

      return text;
    },
    [textContent],
  );

  // Load PDF document
  const loadPdf = useCallback(
    async (pdfSource: string | ArrayBuffer | Uint8Array): Promise<void> => {
      if (!isAvailable || !window.pdfjsLib) {
        throw new Error("PDF.js is not available");
      }

      // Cleanup previous document
      if (pdfDocRef.current) {
        await pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }

      if (loadingTaskRef.current) {
        await loadingTaskRef.current.destroy();
        loadingTaskRef.current = null;
      }

      // Clear caches
      canvasCacheRef.current.clear();
      setTextContent(new Map());
      setError(null);
      setIsLoading(true);
      setProgress(0);
      onLoadStart?.();

      try {
        // Create loading task
        const loadingTask = window.pdfjsLib.getDocument(
          typeof pdfSource === "string" ? { url: pdfSource } : pdfSource,
        );
        loadingTaskRef.current = loadingTask;

        // Track progress
        if (loadingTask.onProgress) {
          loadingTask.onProgress = (progressData) => {
            const progressValue =
              progressData.total > 0
                ? progressData.loaded / progressData.total
                : 0;
            setProgress(progressValue * 0.3); // Loading is 30% of total progress
            onLoadProgress?.(progressValue * 0.3);
          };
        }

        // Load document
        const pdfDoc = await loadingTask.promise;
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);

        // Render all pages
        const newPages: FlipbookPage[] = [];
        const newTextContent = new Map<number, string>();

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          try {
            // Render page
            const dataUrl = await renderPage(i);

            newPages.push({
              src: dataUrl,
              thumb: dataUrl, // Could generate smaller thumbnail separately
              title: `Page ${i}`,
            });

            // Extract text if enabled
            if (extractText) {
              const text = await getPageText(i);
              newTextContent.set(i - 1, text);
            }

            // Update progress
            const pageProgress = 0.3 + (i / pdfDoc.numPages) * 0.7;
            setProgress(pageProgress);
            onLoadProgress?.(pageProgress);
          } catch (pageError) {
            console.warn(`Failed to render page ${i}:`, pageError);
            // Add placeholder for failed page
            newPages.push({
              src: "",
              title: `Page ${i} (failed to load)`,
            });
          }
        }

        setPages(newPages);
        setTextContent(newTextContent);
        setProgress(1);
        setIsLoading(false);
        onLoadComplete?.(pdfDoc.numPages);
      } catch (err) {
        const loadError = err instanceof Error ? err : new Error(String(err));
        setError(loadError);
        setIsLoading(false);
        setProgress(0);
        onLoadError?.(loadError);
        throw loadError;
      }
    },
    [
      isAvailable,
      extractText,
      renderPage,
      getPageText,
      onLoadStart,
      onLoadProgress,
      onLoadComplete,
      onLoadError,
    ],
  );

  // Cleanup and destroy
  // Track mounted state for cleanup
  const isMountedRef = useRef(true);

  // Cleanup function
  const destroy = useCallback((skipStateReset = false) => {
    // Clear canvas cache
    canvasCacheRef.current.clear();

    // Destroy loading task
    if (loadingTaskRef.current) {
      loadingTaskRef.current.destroy().catch(() => {});
      loadingTaskRef.current = null;
    }

    // Destroy PDF document
    if (pdfDocRef.current) {
      pdfDocRef.current.destroy().catch(() => {});
      pdfDocRef.current = null;
    }

    // Reset state only if component is still mounted and not skipping
    if (!skipStateReset && isMountedRef.current) {
      setPages([]);
      setTextContent(new Map());
      setNumPages(0);
      setProgress(0);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  // Auto-load PDF when source changes
  useEffect(() => {
    isMountedRef.current = true;

    if (source && isAvailable) {
      loadPdf(source).catch(() => {
        // Error is already handled in loadPdf
      });
    }

    return () => {
      isMountedRef.current = false;
      destroy(true); // Skip state reset on unmount
    };
  }, [source, isAvailable]);

  return {
    isAvailable,
    isLoading,
    progress,
    error,
    numPages,
    pages,
    textContent,
    loadPdf,
    renderPage,
    getPageText,
    destroy,
  };
}

export default usePdfLoader;
