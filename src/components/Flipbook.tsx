import React, {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import type { FlipbookProps, FlipbookInstance } from "../types";
import { useFlipbook } from "../hooks";
import { generateId, isWebGLSupported } from "../utils";
import WebGLPageFlip, { WebGLPageFlipInstance } from "./WebGLPageFlip";
import "../styles/flipbook.css";

// Toolbar button component
interface ToolbarButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  title,
  onClick,
  disabled = false,
  active = false,
}) => (
  <button
    type="button"
    className={`react-flipbook-btn ${active ? "active" : ""}`}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
  >
    {icon}
  </button>
);

// Icons
const Icons = {
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  ),
  ChevronsLeft: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M18.41 7.41L17 6l-6 6 6 6 1.41-1.41L13.83 12zM12.41 7.41L11 6l-6 6 6 6 1.41-1.41L7.83 12z" />
    </svg>
  ),
  ChevronsRight: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M5.59 7.41L7 6l6 6-6 6-1.41-1.41L10.17 12zM11.59 7.41L13 6l6 6-6 6-1.41-1.41L16.17 12z" />
    </svg>
  ),
  Fullscreen: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  ),
  ExitFullscreen: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  ),
  Bookmark: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
  ),
  BookmarkBorder: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
    </svg>
  ),
};

// Main Flipbook component
const Flipbook = forwardRef<FlipbookInstance, FlipbookProps>(
  (
    {
      pages,
      className = "",
      style,
      width = "100%",
      height = "600px",
      backgroundColor = "rgb(81, 85, 88)",
      skin = "dark",
      startPage = 1,
      singlePageMode = false,
      sideNavigationButtons = true,
      hideMenu = false,
      pageFlipDuration = 600,
      pageHardness = 0.5,
      coverHardness = 0.9,
      pageSegmentsW = 30,
      pageSegmentsH = 1,
      shadows = true,
      shadowOpacity = 0.3,
      lights = true,
      lightIntensity = 1,
      lightColor = 0xffffff,
      pageRoughness = 0.8,
      pageMetalness = 0.1,
      antialias = true,
      btnFirst,
      btnPrev,
      btnNext,
      btnLast,
      btnExpand,
      btnBookmark,
      currentPage: currentPageConfig,
      onPageFlip,
      onPageFlipStart,
      onPageFlipEnd,
      onZoomChange,
      onReady,
      onFullscreenChange,
    },
    ref,
  ) => {
    const id = useMemo(() => generateId(), []);
    const [isFlipping, setIsFlipping] = useState(false);
    const webglRef = useRef<WebGLPageFlipInstance>(null);

    const parsedWidth = useMemo(() => {
      if (typeof width === "number") return width;
      if (typeof width === "string" && width.endsWith("px")) {
        return parseInt(width, 10);
      }
      return 800;
    }, [width]);

    const parsedHeight = useMemo(() => {
      if (typeof height === "number") return height;
      if (typeof height === "string" && height.endsWith("px")) {
        return parseInt(height, 10);
      }
      return 600;
    }, [height]);

    const {
      currentPage,
      numPages,
      isFullscreen,
      isLoading,
      canGoNext,
      canGoPrev,
      containerRef,
      setCurrentPageDirect,
      toggleFullscreen,
      toggleBookmark,
      isPageBookmarked,
      getInstance,
    } = useFlipbook({
      pages,
      initialPage: startPage,
      singlePageMode,
      onPageChange: (page) => {
        onPageFlip?.({
          page,
          direction: page > currentPage ? "next" : "prev",
        });
      },
      onZoomChange: (zoom) => {
        onZoomChange?.({
          zoom,
        });
      },
      onFullscreenChange: (isFullscreen) => {
        onFullscreenChange?.({
          isFullscreen,
        });
      },
    });

    // Navigation functions
    const nextPage = useCallback(() => {
      if (isFlipping || !canGoNext) return;

      if (webglRef.current) {
        webglRef.current.flipNext();
      }
    }, [isFlipping, canGoNext]);

    const prevPage = useCallback(() => {
      if (isFlipping || !canGoPrev) return;

      if (webglRef.current) {
        webglRef.current.flipPrev();
      }
    }, [isFlipping, canGoPrev]);

    const goToPage = useCallback((page: number) => {
      if (webglRef.current) {
        webglRef.current.flipToPage(page);
      }
    }, []);

    const goToFirstPage = useCallback(() => {
      if (webglRef.current) {
        webglRef.current.flipToFirst();
      }
    }, []);

    const goToLastPage = useCallback(() => {
      if (webglRef.current) {
        webglRef.current.flipToLast();
      }
    }, []);

    // WebGL event handlers
    const handleWebGLFlipStart = useCallback(
      (page: number, direction: "next" | "prev") => {
        setIsFlipping(true);
        onPageFlipStart?.({ page, direction });
      },
      [onPageFlipStart],
    );

    const handleWebGLFlipEnd = useCallback(
      (page: number) => {
        setIsFlipping(false);
        setCurrentPageDirect(page);
        onPageFlipEnd?.({ page });
      },
      [setCurrentPageDirect, onPageFlipEnd],
    );

    const handleWebGLPageChange = useCallback(
      (page: number) => {
        onPageFlip?.({
          page,
          direction: page > currentPage ? "next" : "prev",
        });
      },
      [currentPage, onPageFlip],
    );

    useImperativeHandle(ref, getInstance, [getInstance]);

    const handlePageInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 1 && value <= numPages) {
          goToPage(value);
        }
      },
      [goToPage, numPages],
    );

    // Styles
    const containerStyle: React.CSSProperties = {
      width,
      height,
      backgroundColor,
      ...style,
    };

    const themeClass = `react-flipbook-theme-${skin}`;
    const fullscreenClass = isFullscreen ? "fullscreen" : "";
    const singlePageClass = singlePageMode ? "react-flipbook-single-page" : "";

    useEffect(() => {
      onReady?.();
    }, [onReady]);

    // Check WebGL support
    const webglSupported = useMemo(() => isWebGLSupported(), []);

    if (!webglSupported) {
      return (
        <div
          ref={containerRef}
          id={id}
          className={`react-flipbook ${themeClass} ${className}`}
          style={containerStyle}
        >
          <div className="react-flipbook-wrapper">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#fff",
                textAlign: "center",
                padding: "20px",
              }}
            >
              <div>
                <p style={{ fontSize: "18px", marginBottom: "10px" }}>
                  WebGL is not supported in your browser.
                </p>
                <p style={{ fontSize: "14px", opacity: 0.7 }}>
                  Please use a modern browser with WebGL support to view this
                  flipbook.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        id={id}
        className={`react-flipbook ${themeClass} ${fullscreenClass} react-flipbook-view-webgl ${singlePageClass} ${className}`}
        style={containerStyle}
      >
        <div className="react-flipbook-wrapper">
          <div className="react-flipbook-container">
            {/* WebGL Flipbook */}
            <WebGLPageFlip
              ref={webglRef}
              pages={pages}
              currentPage={currentPage}
              width={parsedWidth}
              height={parsedHeight}
              singlePageMode={singlePageMode}
              flipDuration={pageFlipDuration}
              pageHardness={pageHardness}
              coverHardness={coverHardness}
              pageSegmentsW={pageSegmentsW}
              pageSegmentsH={pageSegmentsH}
              shadows={shadows}
              shadowOpacity={shadowOpacity}
              lights={lights}
              lightIntensity={lightIntensity}
              lightColor={lightColor}
              pageRoughness={pageRoughness}
              pageMetalness={pageMetalness}
              antialias={antialias}
              backgroundColor={backgroundColor}
              onFlipStart={handleWebGLFlipStart}
              onFlipEnd={handleWebGLFlipEnd}
              onPageChange={handleWebGLPageChange}
            />

            {/* Side navigation buttons */}
            {sideNavigationButtons && (
              <>
                <button
                  type="button"
                  className="react-flipbook-nav-btn react-flipbook-nav-prev"
                  onClick={prevPage}
                  disabled={!canGoPrev || isFlipping}
                  aria-label="Previous page"
                >
                  <Icons.ChevronLeft />
                </button>
                <button
                  type="button"
                  className="react-flipbook-nav-btn react-flipbook-nav-next"
                  onClick={nextPage}
                  disabled={!canGoNext || isFlipping}
                  aria-label="Next page"
                >
                  <Icons.ChevronRight />
                </button>
              </>
            )}
          </div>

          {/* Toolbar */}
          {!hideMenu && (
            <div className="react-flipbook-menu react-flipbook-menu-bottom">
              {btnFirst?.enabled !== false && (
                <ToolbarButton
                  icon={<Icons.ChevronsLeft />}
                  title={btnFirst?.title || "First page"}
                  onClick={goToFirstPage}
                  disabled={!canGoPrev || isFlipping}
                />
              )}

              {btnPrev?.enabled !== false && (
                <ToolbarButton
                  icon={<Icons.ChevronLeft />}
                  title={btnPrev?.title || "Previous page"}
                  onClick={prevPage}
                  disabled={!canGoPrev || isFlipping}
                />
              )}

              {currentPageConfig?.enabled !== false && (
                <div className="react-flipbook-page-indicator">
                  <input
                    type="number"
                    className="react-flipbook-page-input"
                    value={currentPage}
                    onChange={handlePageInputChange}
                    min={1}
                    max={numPages}
                    aria-label="Current page"
                  />
                  <span>/ {numPages}</span>
                </div>
              )}

              {btnNext?.enabled !== false && (
                <ToolbarButton
                  icon={<Icons.ChevronRight />}
                  title={btnNext?.title || "Next page"}
                  onClick={nextPage}
                  disabled={!canGoNext || isFlipping}
                />
              )}

              {btnLast?.enabled !== false && (
                <ToolbarButton
                  icon={<Icons.ChevronsRight />}
                  title={btnLast?.title || "Last page"}
                  onClick={goToLastPage}
                  disabled={!canGoNext || isFlipping}
                />
              )}

              <div style={{ width: 16 }} />

              {btnBookmark?.enabled !== false && (
                <ToolbarButton
                  icon={
                    isPageBookmarked(currentPage) ? (
                      <Icons.Bookmark />
                    ) : (
                      <Icons.BookmarkBorder />
                    )
                  }
                  title={btnBookmark?.title || "Bookmark"}
                  onClick={() => toggleBookmark()}
                  active={isPageBookmarked(currentPage)}
                />
              )}

              {btnExpand?.enabled !== false && (
                <ToolbarButton
                  icon={
                    isFullscreen ? (
                      <Icons.ExitFullscreen />
                    ) : (
                      <Icons.Fullscreen />
                    )
                  }
                  title={
                    btnExpand?.title ||
                    (isFullscreen ? "Exit fullscreen" : "Fullscreen")
                  }
                  onClick={toggleFullscreen}
                />
              )}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="react-flipbook-loader">
            <div className="react-flipbook-spinner" />
            <div className="react-flipbook-loader-text">Loading...</div>
          </div>
        )}
      </div>
    );
  },
);

Flipbook.displayName = "Flipbook";

export default Flipbook;
