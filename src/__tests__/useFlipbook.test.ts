import { renderHook, act } from "@testing-library/react";
import { useFlipbook } from "../hooks/useFlipbook";
import type { FlipbookPage } from "../types";

// Mock pages for testing
const createMockPages = (count: number): FlipbookPage[] => {
  return Array.from({ length: count }, (_, i) => ({
    src: `https://example.com/page-${i + 1}.jpg`,
    title: `Page ${i + 1}`,
  }));
};

describe("useFlipbook", () => {
  const mockPages = createMockPages(10);

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.numPages).toBe(10);
      expect(result.current.zoom).toBe(1);
      expect(result.current.isFullscreen).toBe(false);
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrev).toBe(false);
    });

    it("should initialize with custom initial page", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, initialPage: 5 }),
      );

      expect(result.current.currentPage).toBe(5);
    });

    it("should clamp initial page to valid range", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, initialPage: 100 }),
      );

      expect(result.current.currentPage).toBe(10);
    });
  });

  describe("navigation", () => {
    it("should navigate to next page", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      act(() => {
        result.current.nextPage();
      });

      // Default page increment is 2 (spread mode)
      expect(result.current.currentPage).toBe(3);
    });

    it("should navigate to previous page", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, initialPage: 5 }),
      );

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(3);
    });

    it("should navigate to first page", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, initialPage: 5 }),
      );

      act(() => {
        result.current.firstPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it("should navigate to last page", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      act(() => {
        result.current.lastPage();
      });

      expect(result.current.currentPage).toBe(10);
    });

    it("should navigate to specific page", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      act(() => {
        result.current.goToPage(7);
      });

      expect(result.current.currentPage).toBe(7);
    });

    it("should clamp page number to valid range", async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      act(() => {
        result.current.goToPage(100);
      });

      expect(result.current.currentPage).toBe(10);

      // Wait for animation to complete
      act(() => {
        jest.advanceTimersByTime(700);
      });

      act(() => {
        result.current.goToPage(-5);
      });

      expect(result.current.currentPage).toBe(1);

      jest.useRealTimers();
    });

    it("should not navigate past first page", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it("should not navigate past last page", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, initialPage: 10 }),
      );

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(10);
    });

    it("should handle single page mode navigation", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, singlePageMode: true }),
      );

      act(() => {
        result.current.nextPage();
      });

      // Single page mode increments by 1
      expect(result.current.currentPage).toBe(2);
    });
  });

  describe("right-to-left mode", () => {
    it("should handle RTL canGoNext/canGoPrev correctly", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, rightToLeft: true, initialPage: 10 }),
      );

      // In RTL mode at page 10 (last), canGoNext (going to lower pages) should be true
      expect(result.current.canGoNext).toBe(true);
      // canGoPrev (going to higher pages) should be false since we're at max
      expect(result.current.canGoPrev).toBe(false);
    });

    it("should navigate correctly in RTL mode", async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, rightToLeft: true, initialPage: 5 }),
      );

      // In RTL, nextPage decrements (5 - 2 = 3)
      act(() => {
        result.current.nextPage();
      });
      expect(result.current.currentPage).toBe(3);

      // Wait for animation to complete
      act(() => {
        jest.advanceTimersByTime(700);
      });

      // In RTL, prevPage increments (3 + 2 = 5)
      act(() => {
        result.current.prevPage();
      });
      // Now back at page 5
      expect(result.current.currentPage).toBe(5);

      jest.useRealTimers();
    });

    it("should handle firstPage and lastPage in RTL mode", async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, rightToLeft: true, initialPage: 5 }),
      );

      // In RTL, firstPage goes to numPages (10)
      act(() => {
        result.current.firstPage();
      });
      expect(result.current.currentPage).toBe(10);

      // Wait for animation to complete
      act(() => {
        jest.advanceTimersByTime(700);
      });

      // In RTL, lastPage goes to 1
      act(() => {
        result.current.lastPage();
      });
      expect(result.current.currentPage).toBe(1);

      jest.useRealTimers();
    });
  });

  describe("zoom", () => {
    it("should zoom in", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, zoomStep: 0.5 }),
      );

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.zoom).toBe(1.5);
    });

    it("should zoom out", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, zoomStep: 0.5 }),
      );

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.zoom).toBe(1.5);

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.zoom).toBe(2);

      act(() => {
        result.current.zoomOut();
      });

      expect(result.current.zoom).toBe(1.5);
    });

    it("should zoom to specific level", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      act(() => {
        result.current.zoomTo(2);
      });

      expect(result.current.zoom).toBe(2);
    });

    it("should clamp zoom to min/max", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, zoomMin: 1, zoomMax2: 3 }),
      );

      act(() => {
        result.current.zoomTo(0.5);
      });

      expect(result.current.zoom).toBe(1);

      act(() => {
        result.current.zoomTo(5);
      });

      expect(result.current.zoom).toBe(3);
    });

    it("should reset zoom", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      act(() => {
        result.current.zoomTo(2);
      });

      expect(result.current.zoom).toBe(2);

      act(() => {
        result.current.resetZoom();
      });

      expect(result.current.zoom).toBe(1);
    });
  });

  describe("bookmarks", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("should toggle bookmark for current page", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      expect(result.current.isPageBookmarked(1)).toBe(false);

      act(() => {
        result.current.toggleBookmark();
      });

      expect(result.current.isPageBookmarked(1)).toBe(true);
      expect(result.current.bookmarkedPages).toContain(1);
    });

    it("should toggle bookmark for specific page", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      act(() => {
        result.current.toggleBookmark(5);
      });

      expect(result.current.isPageBookmarked(5)).toBe(true);
      expect(result.current.bookmarkedPages).toContain(5);
    });

    it("should remove bookmark when toggled twice", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      act(() => {
        result.current.toggleBookmark(3);
      });

      expect(result.current.isPageBookmarked(3)).toBe(true);

      act(() => {
        result.current.toggleBookmark(3);
      });

      expect(result.current.isPageBookmarked(3)).toBe(false);
    });

    it("should maintain sorted bookmarks", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      act(() => {
        result.current.toggleBookmark(5);
        result.current.toggleBookmark(2);
        result.current.toggleBookmark(8);
      });

      expect(result.current.bookmarkedPages).toEqual([2, 5, 8]);
    });
  });

  describe("callbacks", () => {
    it("should call onPageChange when page changes", async () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, onPageChange }),
      );

      act(() => {
        result.current.nextPage();
      });

      // Wait for animation timeout
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 700));
      });

      expect(onPageChange).toHaveBeenCalled();
    });

    it("should call onZoomChange when zoom changes", () => {
      const onZoomChange = jest.fn();
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, onZoomChange }),
      );

      act(() => {
        result.current.zoomIn();
      });

      expect(onZoomChange).toHaveBeenCalled();
    });
  });

  describe("getInstance", () => {
    it("should return flipbook instance with all methods", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      const instance = result.current.getInstance();

      expect(typeof instance.nextPage).toBe("function");
      expect(typeof instance.prevPage).toBe("function");
      expect(typeof instance.firstPage).toBe("function");
      expect(typeof instance.lastPage).toBe("function");
      expect(typeof instance.goToPage).toBe("function");
      expect(typeof instance.zoomIn).toBe("function");
      expect(typeof instance.zoomOut).toBe("function");
      expect(typeof instance.zoomTo).toBe("function");
      expect(typeof instance.getCurrentPage).toBe("function");
      expect(typeof instance.getNumPages).toBe("function");
      expect(typeof instance.getZoom).toBe("function");
      expect(typeof instance.isFullscreen).toBe("function");
      expect(typeof instance.toggleFullscreen).toBe("function");
      expect(typeof instance.bookmarkPage).toBe("function");
      expect(typeof instance.removeBookmark).toBe("function");
      expect(typeof instance.getBookmarkedPages).toBe("function");
    });

    it("should get current page through instance", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, initialPage: 5 }),
      );

      const instance = result.current.getInstance();
      expect(instance.getCurrentPage()).toBe(5);
    });

    it("should get number of pages through instance", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      const instance = result.current.getInstance();
      expect(instance.getNumPages()).toBe(10);
    });
  });

  describe("containerRef", () => {
    it("should provide a container ref", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
    });
  });

  describe("canGoNext/canGoPrev", () => {
    it("should update canGoPrev correctly", () => {
      const { result } = renderHook(() => useFlipbook({ pages: mockPages }));

      expect(result.current.canGoPrev).toBe(false);

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.canGoPrev).toBe(true);
    });

    it("should update canGoNext correctly", () => {
      const { result } = renderHook(() =>
        useFlipbook({ pages: mockPages, initialPage: 10 }),
      );

      expect(result.current.canGoNext).toBe(false);

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.canGoNext).toBe(true);
    });
  });
});
