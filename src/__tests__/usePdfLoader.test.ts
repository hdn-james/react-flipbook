import { renderHook, act } from "@testing-library/react";
import { usePdfLoader } from "../hooks/usePdfLoader";

// Note: usePdfLoader relies heavily on browser APIs (PDF.js, canvas, etc.)
// that are difficult to mock properly in Jest. These tests focus on the
// basic functionality that can be tested without complex mocking.

describe("usePdfLoader", () => {
  describe("initialization", () => {
    it("should initialize with default values when source is null", () => {
      const { result } = renderHook(() => usePdfLoader({ source: null }));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.numPages).toBe(0);
      expect(result.current.pages).toEqual([]);
      expect(result.current.textContent).toBeInstanceOf(Map);
      expect(result.current.textContent.size).toBe(0);
    });

    it("should return all expected functions and properties", () => {
      const { result } = renderHook(() => usePdfLoader({ source: null }));

      // Check that all expected properties exist
      expect(typeof result.current.isAvailable).toBe("boolean");
      expect(typeof result.current.isLoading).toBe("boolean");
      expect(typeof result.current.progress).toBe("number");
      expect(typeof result.current.numPages).toBe("number");

      // Check that all expected functions exist
      expect(typeof result.current.loadPdf).toBe("function");
      expect(typeof result.current.renderPage).toBe("function");
      expect(typeof result.current.getPageText).toBe("function");
      expect(typeof result.current.destroy).toBe("function");
    });

    it("should detect PDF.js as unavailable when not loaded", () => {
      // In the test environment, PDF.js is not loaded
      const { result } = renderHook(() => usePdfLoader({ source: null }));

      // PDF.js should not be available in test environment
      expect(result.current.isAvailable).toBe(false);
    });
  });

  describe("error handling without PDF.js", () => {
    it("should throw error when trying to load without PDF.js", async () => {
      const { result } = renderHook(() => usePdfLoader({ source: null }));

      // Without PDF.js available, loadPdf should throw
      await expect(
        result.current.loadPdf("https://example.com/test.pdf"),
      ).rejects.toThrow("PDF.js is not available");
    });

    it("should throw error when trying to render page without document", async () => {
      const { result } = renderHook(() => usePdfLoader({ source: null }));

      await expect(result.current.renderPage(1)).rejects.toThrow(
        "PDF document not loaded",
      );
    });

    it("should throw error when trying to get page text without document", async () => {
      const { result } = renderHook(() => usePdfLoader({ source: null }));

      await expect(result.current.getPageText(1)).rejects.toThrow(
        "PDF document not loaded",
      );
    });
  });

  describe("destroy", () => {
    it("should reset state when destroy is called", () => {
      const { result } = renderHook(() => usePdfLoader({ source: null }));

      // Call destroy
      act(() => {
        result.current.destroy();
      });

      // State should be reset
      expect(result.current.pages).toEqual([]);
      expect(result.current.numPages).toBe(0);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it("should be safe to call destroy multiple times", () => {
      const { result } = renderHook(() => usePdfLoader({ source: null }));

      // Should not throw when called multiple times
      expect(() => {
        act(() => {
          result.current.destroy();
        });
        act(() => {
          result.current.destroy();
        });
        act(() => {
          result.current.destroy();
        });
      }).not.toThrow();
    });
  });

  describe("options", () => {
    it("should accept scale option", () => {
      const { result } = renderHook(() =>
        usePdfLoader({ source: null, scale: 2.0 }),
      );

      expect(result.current.isLoading).toBe(false);
    });

    it("should accept extractText option", () => {
      const { result } = renderHook(() =>
        usePdfLoader({ source: null, extractText: true }),
      );

      expect(result.current.isLoading).toBe(false);
    });

    it("should accept maxTextureSize option", () => {
      const { result } = renderHook(() =>
        usePdfLoader({ source: null, maxTextureSize: 2048 }),
      );

      expect(result.current.isLoading).toBe(false);
    });

    it("should accept callback options", () => {
      const onLoadStart = jest.fn();
      const onLoadProgress = jest.fn();
      const onLoadComplete = jest.fn();
      const onLoadError = jest.fn();
      const onPageRendered = jest.fn();

      const { result } = renderHook(() =>
        usePdfLoader({
          source: null,
          onLoadStart,
          onLoadProgress,
          onLoadComplete,
          onLoadError,
          onPageRendered,
        }),
      );

      // Callbacks should not be called on initialization
      expect(onLoadStart).not.toHaveBeenCalled();
      expect(onLoadProgress).not.toHaveBeenCalled();
      expect(onLoadComplete).not.toHaveBeenCalled();
      expect(onLoadError).not.toHaveBeenCalled();
      expect(onPageRendered).not.toHaveBeenCalled();

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("cleanup on unmount", () => {
    it("should clean up on unmount without errors", () => {
      const { unmount } = renderHook(() => usePdfLoader({ source: null }));

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });
});
