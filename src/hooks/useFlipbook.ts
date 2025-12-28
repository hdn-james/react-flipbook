import { useState, useCallback, useRef, useEffect } from "react";
import type { FlipbookInstance, FlipbookOptions, FlipbookPage } from "../types";
import {
  clamp,
  storage,
  requestFullscreen,
  exitFullscreen,
  isFullscreen as checkFullscreen,
  preloadImage,
} from "../utils";

const BOOKMARKS_STORAGE_KEY = "react-flipbook-bookmarks";

interface UseFlipbookOptions extends Partial<FlipbookOptions> {
  pages: FlipbookPage[];
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

interface UseFlipbookReturn {
  // State
  currentPage: number;
  numPages: number;
  zoom: number;
  isFullscreen: boolean;
  isLoading: boolean;
  isAnimating: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  bookmarkedPages: number[];

  // Refs
  containerRef: React.RefObject<HTMLDivElement>;

  // Navigation
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  goToPage: (page: number) => void;
  setCurrentPageDirect: (page: number) => void;

  // Zoom
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (zoom: number) => void;
  resetZoom: () => void;

  // Fullscreen
  toggleFullscreen: () => void;
  enterFullscreen: () => void;
  exitFullscreenMode: () => void;

  // Bookmarks
  toggleBookmark: (page?: number) => void;
  isPageBookmarked: (page: number) => boolean;

  // Loading
  preloadPages: (pageIndices: number[]) => Promise<void>;

  // Instance
  getInstance: () => FlipbookInstance;
}

export function useFlipbook(options: UseFlipbookOptions): UseFlipbookReturn {
  const {
    pages,
    initialPage = 1,
    zoomMin = 1,
    zoomMax2 = 3,
    zoomStep = 0.5,
    rightToLeft = false,
    singlePageMode = false,
    onPageChange,
    onZoomChange,
    onFullscreenChange,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const numPages = pages.length;
  const pageIncrement = singlePageMode ? 1 : 2;

  // State - clamp initial page to valid range
  const [currentPage, setCurrentPage] = useState(() =>
    clamp(initialPage, 1, numPages),
  );
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>(() =>
    storage.get<number[]>(BOOKMARKS_STORAGE_KEY, []),
  );

  // Computed
  const canGoNext = rightToLeft ? currentPage > 1 : currentPage < numPages;

  const canGoPrev = rightToLeft ? currentPage < numPages : currentPage > 1;

  // Page navigation
  const goToPage = useCallback(
    (page: number) => {
      if (isAnimating) return;

      const targetPage = clamp(page, 1, numPages);
      if (targetPage === currentPage) return;

      setIsAnimating(true);
      setCurrentPage(targetPage);
      onPageChange?.(targetPage);

      // Reset animation state after flip duration
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    },
    [currentPage, numPages, isAnimating, onPageChange],
  );

  // Direct page update for WebGL mode - bypasses animation check
  const setCurrentPageDirect = useCallback(
    (page: number) => {
      const targetPage = clamp(page, 1, numPages);
      setCurrentPage(targetPage);
      setIsAnimating(false); // Ensure animation state is reset
    },
    [numPages],
  );

  const nextPage = useCallback(() => {
    if (!canGoNext || isAnimating) return;

    const nextPageNum = rightToLeft
      ? currentPage - pageIncrement
      : currentPage + pageIncrement;

    goToPage(nextPageNum);
  }, [
    canGoNext,
    isAnimating,
    rightToLeft,
    currentPage,
    pageIncrement,
    goToPage,
  ]);

  const prevPage = useCallback(() => {
    if (!canGoPrev || isAnimating) return;

    const prevPageNum = rightToLeft
      ? currentPage + pageIncrement
      : currentPage - pageIncrement;

    goToPage(prevPageNum);
  }, [
    canGoPrev,
    isAnimating,
    rightToLeft,
    currentPage,
    pageIncrement,
    goToPage,
  ]);

  const firstPage = useCallback(() => {
    goToPage(rightToLeft ? numPages : 1);
  }, [goToPage, rightToLeft, numPages]);

  const lastPage = useCallback(() => {
    goToPage(rightToLeft ? 1 : numPages);
  }, [goToPage, rightToLeft, numPages]);

  // Zoom
  const zoomTo = useCallback(
    (newZoom: number) => {
      const clampedZoom = clamp(newZoom, zoomMin, zoomMax2);
      setZoom(clampedZoom);
      onZoomChange?.(clampedZoom);
    },
    [zoomMin, zoomMax2, onZoomChange],
  );

  const zoomIn = useCallback(() => {
    zoomTo(zoom + zoomStep);
  }, [zoom, zoomStep, zoomTo]);

  const zoomOut = useCallback(() => {
    zoomTo(zoom - zoomStep);
  }, [zoom, zoomStep, zoomTo]);

  const resetZoom = useCallback(() => {
    zoomTo(1);
  }, [zoomTo]);

  // Fullscreen
  const enterFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      await requestFullscreen(containerRef.current);
      setIsFullscreen(true);
      onFullscreenChange?.(true);
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
    }
  }, [onFullscreenChange]);

  const exitFullscreenMode = useCallback(async () => {
    try {
      await exitFullscreen();
      setIsFullscreen(false);
      onFullscreenChange?.(false);
    } catch (error) {
      console.error("Failed to exit fullscreen:", error);
    }
  }, [onFullscreenChange]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreenMode();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreenMode]);

  // Bookmarks
  const toggleBookmark = useCallback(
    (page?: number) => {
      const pageToToggle = page ?? currentPage;

      setBookmarkedPages((prev) => {
        const newBookmarks = prev.includes(pageToToggle)
          ? prev.filter((p) => p !== pageToToggle)
          : [...prev, pageToToggle].sort((a, b) => a - b);

        storage.set(BOOKMARKS_STORAGE_KEY, newBookmarks);
        return newBookmarks;
      });
    },
    [currentPage],
  );

  const isPageBookmarked = useCallback(
    (page: number) => bookmarkedPages.includes(page),
    [bookmarkedPages],
  );

  // Preloading
  const preloadPages = useCallback(
    async (pageIndices: number[]) => {
      const pagesToLoad = pageIndices.filter(
        (idx) =>
          idx >= 0 && idx < pages.length && !loadedPagesRef.current.has(idx),
      );

      if (pagesToLoad.length === 0) return;

      const loadPromises = pagesToLoad.map(async (idx) => {
        const page = pages[idx];
        if (page.src) {
          try {
            await preloadImage(page.src);
            loadedPagesRef.current.add(idx);
          } catch {
            console.warn(`Failed to preload page ${idx + 1}`);
          }
        }
      });

      await Promise.all(loadPromises);
    },
    [pages],
  );

  // Get instance for imperative handle
  const getInstance = useCallback((): FlipbookInstance => {
    return {
      nextPage,
      prevPage,
      firstPage,
      lastPage,
      goToPage,
      // Animated navigation (no-ops for hook, real impl in Flipbook component)
      flipNext: () => {},
      flipPrev: () => {},
      flipToPage: (_page: number) => {},
      flipToFirst: () => {},
      flipToLast: () => {},
      zoomIn,
      zoomOut,
      zoomTo,
      getCurrentPage: () => currentPage,
      getNumPages: () => numPages,
      getZoom: () => zoom,
      isFullscreen: () => isFullscreen,
      toggleFullscreen,
      toggleAutoplay: () => {
        // TODO: Implement autoplay
      },
      toggleSound: () => {
        // TODO: Implement sound
      },
      toggleThumbnails: () => {
        // TODO: Implement thumbnails panel
      },
      toggleTableOfContents: () => {
        // TODO: Implement TOC panel
      },
      toggleSearch: () => {
        // TODO: Implement search panel
      },
      openLightbox: () => {
        // TODO: Implement lightbox
      },
      closeLightbox: () => {
        // TODO: Implement lightbox
      },
      bookmarkPage: (page: number) => toggleBookmark(page),
      removeBookmark: (page: number) => {
        if (isPageBookmarked(page)) {
          toggleBookmark(page);
        }
      },
      getBookmarkedPages: () => bookmarkedPages,
      printCurrentPage: () => {
        // TODO: Implement print
        window.print();
      },
      downloadCurrentPage: () => {
        // TODO: Implement download
      },
      destroy: () => {
        // Cleanup
        loadedPagesRef.current.clear();
      },
    };
  }, [
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    goToPage,
    zoomIn,
    zoomOut,
    zoomTo,
    currentPage,
    numPages,
    zoom,
    isFullscreen,
    toggleFullscreen,
    toggleBookmark,
    isPageBookmarked,
    bookmarkedPages,
  ]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreen = checkFullscreen();
      setIsFullscreen(fullscreen);
      onFullscreenChange?.(fullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, [onFullscreenChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is on an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          prevPage();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextPage();
          break;
        case "Home":
          e.preventDefault();
          firstPage();
          break;
        case "End":
          e.preventDefault();
          lastPage();
          break;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          e.preventDefault();
          zoomOut();
          break;
        case "0":
          e.preventDefault();
          resetZoom();
          break;
        case "f":
        case "F":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case "Escape":
          if (isFullscreen) {
            exitFullscreenMode();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    prevPage,
    nextPage,
    firstPage,
    lastPage,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFullscreen,
    isFullscreen,
    exitFullscreenMode,
  ]);

  // Initial loading
  useEffect(() => {
    let isMounted = true;

    const loadInitialPages = async () => {
      if (!isMounted) return;
      setIsLoading(true);

      // Preload current page and adjacent pages (4 pages ahead and behind)
      const pagesToLoad = [
        currentPage - 4,
        currentPage - 3,
        currentPage - 2,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        currentPage + 2,
        currentPage + 3,
        currentPage + 4,
      ].filter((p) => p >= 1 && p <= numPages);

      await preloadPages(pagesToLoad.map((p) => p - 1)); // Convert to 0-based index

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadInitialPages();

    return () => {
      isMounted = false;
    };
  }, []);

  // Preload adjacent pages when page changes (4 pages ahead and behind for smooth transitions)
  useEffect(() => {
    const adjacentPages = [
      currentPage - 4,
      currentPage - 3,
      currentPage - 2,
      currentPage - 1,
      currentPage + 1,
      currentPage + 2,
      currentPage + 3,
      currentPage + 4,
    ].filter((p) => p >= 1 && p <= numPages);

    preloadPages(adjacentPages.map((p) => p - 1));
  }, [currentPage, numPages, preloadPages]);

  return {
    // State
    currentPage,
    numPages,
    zoom,
    isFullscreen,
    isLoading,
    isAnimating,
    canGoNext,
    canGoPrev,
    bookmarkedPages,

    // Refs
    containerRef,

    // Navigation
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    goToPage,
    setCurrentPageDirect,

    // Zoom
    zoomIn,
    zoomOut,
    zoomTo,
    resetZoom,

    // Fullscreen
    toggleFullscreen,
    enterFullscreen,
    exitFullscreenMode,

    // Bookmarks
    toggleBookmark,
    isPageBookmarked,

    // Loading
    preloadPages,

    // Instance
    getInstance,
  };
}

// Hook for swipe gestures
export function useSwipeGesture(
  containerRef: React.RefObject<HTMLElement>,
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  options: { threshold?: number; enabled?: boolean } = {},
) {
  const { threshold = 50, enabled = true } = options;
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const diff = touchStartX.current - touchEndX.current;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          onSwipeLeft();
        } else {
          onSwipeRight();
        }
      }

      touchStartX.current = 0;
      touchEndX.current = 0;
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerRef, onSwipeLeft, onSwipeRight, threshold, enabled]);
}

// Hook for mouse wheel zoom
export function useWheelZoom(
  containerRef: React.RefObject<HTMLElement>,
  onZoom: (delta: number) => void,
  options: { enabled?: boolean; sensitivity?: number } = {},
) {
  const { enabled = true, sensitivity = 0.001 } = options;

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * sensitivity;
        onZoom(delta);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [containerRef, onZoom, enabled, sensitivity]);
}

// Hook for resize observer
export function useResizeObserver(
  ref: React.RefObject<HTMLElement>,
  callback: (entry: ResizeObserverEntry) => void,
) {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        callback(entries[0]);
      }
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, callback]);
}
