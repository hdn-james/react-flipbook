import React, { useCallback, useRef, useEffect, useState } from 'react';
import type { FlipbookPage } from '../types';

export interface ThumbnailsPanelProps {
  pages: FlipbookPage[];
  currentPage: number;
  isOpen: boolean;
  position?: 'left' | 'right';
  thumbnailSize?: number;
  showPageNumbers?: boolean;
  onPageSelect: (page: number) => void;
  onClose: () => void;
}

const ThumbnailsPanel: React.FC<ThumbnailsPanelProps> = ({
  pages,
  currentPage,
  isOpen,
  position = 'left',
  thumbnailSize = 120,
  showPageNumbers = true,
  onPageSelect,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<number>>(new Set());
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 20,
  });

  // Scroll to current page thumbnail when panel opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const thumbnailElement = containerRef.current.querySelector(
        `[data-page="${currentPage}"]`
      );
      if (thumbnailElement) {
        thumbnailElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [isOpen, currentPage]);

  // Virtual scrolling - only render visible thumbnails
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const itemHeight = thumbnailSize + 24; // thumbnail + padding + margin

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
    const end = Math.min(
      pages.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
    );

    setVisibleRange({ start, end });
  }, [thumbnailSize, pages.length]);

  // Initialize scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Handle thumbnail image load
  const handleThumbnailLoad = useCallback((pageIndex: number) => {
    setLoadedThumbnails((prev) => new Set(prev).add(pageIndex));
  }, []);

  // Handle thumbnail click
  const handleThumbnailClick = useCallback(
    (pageNumber: number) => {
      onPageSelect(pageNumber);
    },
    [onPageSelect]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, pageNumber: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPageSelect(pageNumber);
      }
    },
    [onPageSelect]
  );

  // Calculate aspect ratio from first loaded image
  const aspectRatio = 1.4; // Default book aspect ratio (height/width)
  const thumbnailWidth = thumbnailSize;
  const thumbnailHeight = thumbnailSize * aspectRatio;

  // Calculate spacer heights for virtual scrolling
  const itemHeight = thumbnailHeight + 24;
  const topSpacerHeight = visibleRange.start * itemHeight;
  const bottomSpacerHeight = Math.max(0, (pages.length - visibleRange.end) * itemHeight);

  return (
    <div
      className={`react-flipbook-sidebar react-flipbook-sidebar-${position} ${
        isOpen ? 'open' : ''
      }`}
      style={{
        [position]: isOpen ? 0 : -280,
      }}
    >
      {/* Header */}
      <div className="react-flipbook-sidebar-header">
        <h3 className="react-flipbook-sidebar-title">Thumbnails</h3>
        <button
          type="button"
          className="react-flipbook-sidebar-close"
          onClick={onClose}
          aria-label="Close thumbnails"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Thumbnails grid */}
      <div
        ref={containerRef}
        className="react-flipbook-sidebar-content react-flipbook-thumbnails"
        role="listbox"
        aria-label="Page thumbnails"
      >
        {/* Top spacer for virtual scrolling */}
        {topSpacerHeight > 0 && (
          <div style={{ height: topSpacerHeight, flexShrink: 0 }} />
        )}

        {/* Visible thumbnails */}
        {pages.slice(visibleRange.start, visibleRange.end).map((page, idx) => {
          const pageIndex = visibleRange.start + idx;
          const pageNumber = pageIndex + 1;
          const isActive = pageNumber === currentPage;
          const isLoaded = loadedThumbnails.has(pageIndex);
          const thumbnailSrc = page.thumb || page.src;

          return (
            <div
              key={pageIndex}
              data-page={pageNumber}
              className={`react-flipbook-thumbnail ${isActive ? 'active' : ''}`}
              style={{
                width: thumbnailWidth,
                height: thumbnailHeight,
              }}
              onClick={() => handleThumbnailClick(pageNumber)}
              onKeyDown={(e) => handleKeyDown(e, pageNumber)}
              role="option"
              aria-selected={isActive}
              tabIndex={0}
            >
              {/* Thumbnail image */}
              {thumbnailSrc ? (
                <img
                  src={thumbnailSrc}
                  alt={page.title || `Page ${pageNumber}`}
                  onLoad={() => handleThumbnailLoad(pageIndex)}
                  style={{
                    opacity: isLoaded ? 1 : 0.5,
                    transition: 'opacity 0.3s ease',
                  }}
                  loading="lazy"
                  draggable={false}
                />
              ) : (
                <div
                  className="react-flipbook-thumbnail-placeholder"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '24px',
                  }}
                >
                  {pageNumber}
                </div>
              )}

              {/* Page number label */}
              {showPageNumbers && (
                <span className="react-flipbook-thumbnail-number">
                  {pageNumber}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <div
                  className="react-flipbook-thumbnail-active-indicator"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '3px solid #4a9eff',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Loading spinner */}
              {thumbnailSrc && !isLoaded && (
                <div
                  className="react-flipbook-thumbnail-loader"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div
                    className="react-flipbook-thumbnail-spinner"
                    style={{
                      width: 24,
                      height: 24,
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom spacer for virtual scrolling */}
        {bottomSpacerHeight > 0 && (
          <div style={{ height: bottomSpacerHeight, flexShrink: 0 }} />
        )}
      </div>

      {/* Page count */}
      <div
        className="react-flipbook-thumbnails-footer"
        style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
        }}
      >
        {pages.length} pages
      </div>
    </div>
  );
};

export default ThumbnailsPanel;
