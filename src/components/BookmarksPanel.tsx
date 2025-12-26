import React, { useCallback, useRef, useEffect } from 'react';
import type { FlipbookPage } from '../types';

export interface Bookmark {
  page: number;
  title?: string;
  createdAt: Date;
  note?: string;
}

export interface BookmarksPanelProps {
  pages: FlipbookPage[];
  bookmarks: number[];
  currentPage: number;
  isOpen: boolean;
  position?: 'left' | 'right';
  showThumbnails?: boolean;
  onPageSelect: (page: number) => void;
  onRemoveBookmark: (page: number) => void;
  onClose: () => void;
}

const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  pages,
  bookmarks,
  currentPage,
  isOpen,
  position = 'left',
  showThumbnails = true,
  onPageSelect,
  onRemoveBookmark,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to current page bookmark when panel opens
  useEffect(() => {
    if (isOpen && containerRef.current && bookmarks.includes(currentPage)) {
      const bookmarkElement = containerRef.current.querySelector(
        `[data-bookmark="${currentPage}"]`
      );
      if (bookmarkElement) {
        bookmarkElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [isOpen, currentPage, bookmarks]);

  // Handle bookmark click
  const handleBookmarkClick = useCallback(
    (pageNumber: number) => {
      onPageSelect(pageNumber);
    },
    [onPageSelect]
  );

  // Handle remove bookmark
  const handleRemoveClick = useCallback(
    (e: React.MouseEvent, pageNumber: number) => {
      e.stopPropagation();
      onRemoveBookmark(pageNumber);
    },
    [onRemoveBookmark]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, pageNumber: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPageSelect(pageNumber);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onRemoveBookmark(pageNumber);
      }
    },
    [onPageSelect, onRemoveBookmark]
  );

  // Sort bookmarks by page number
  const sortedBookmarks = [...bookmarks].sort((a, b) => a - b);

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
        <h3 className="react-flipbook-sidebar-title">Bookmarks</h3>
        <button
          type="button"
          className="react-flipbook-sidebar-close"
          onClick={onClose}
          aria-label="Close bookmarks"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Bookmarks list */}
      <div
        ref={containerRef}
        className="react-flipbook-sidebar-content react-flipbook-bookmarks"
        role="list"
        aria-label="Bookmarked pages"
      >
        {sortedBookmarks.length > 0 ? (
          sortedBookmarks.map((pageNumber) => {
            const pageIndex = pageNumber - 1;
            const page = pages[pageIndex];
            const isActive = pageNumber === currentPage;
            const thumbnailSrc = page?.thumb || page?.src;

            return (
              <div
                key={pageNumber}
                data-bookmark={pageNumber}
                className={`react-flipbook-bookmark ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: isActive
                    ? 'rgba(74, 158, 255, 0.15)'
                    : 'transparent',
                  borderLeft: isActive
                    ? '3px solid #4a9eff'
                    : '3px solid transparent',
                  transition: 'background-color 0.15s ease',
                }}
                onClick={() => handleBookmarkClick(pageNumber)}
                onKeyDown={(e) => handleKeyDown(e, pageNumber)}
                role="listitem"
                tabIndex={0}
              >
                {/* Thumbnail */}
                {showThumbnails && (
                  <div
                    className="react-flipbook-bookmark-thumbnail"
                    style={{
                      width: 48,
                      height: 64,
                      flexShrink: 0,
                      borderRadius: 4,
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {thumbnailSrc ? (
                      <img
                        src={thumbnailSrc}
                        alt={`Page ${pageNumber}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: 14,
                        }}
                      >
                        {pageNumber}
                      </div>
                    )}
                  </div>
                )}

                {/* Bookmark info */}
                <div
                  className="react-flipbook-bookmark-info"
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    className="react-flipbook-bookmark-title"
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {page?.title || `Page ${pageNumber}`}
                  </div>
                  <div
                    className="react-flipbook-bookmark-page"
                    style={{
                      fontSize: 12,
                      color: 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    Page {pageNumber}
                  </div>
                </div>

                {/* Bookmark icon */}
                <div
                  className="react-flipbook-bookmark-icon"
                  style={{
                    color: '#f59e0b',
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  className="react-flipbook-bookmark-remove"
                  onClick={(e) => handleRemoveClick(e, pageNumber)}
                  style={{
                    padding: 4,
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    color: 'rgba(255, 255, 255, 0.5)',
                    transition: 'color 0.15s ease, background-color 0.15s ease',
                    flexShrink: 0,
                  }}
                  aria-label={`Remove bookmark for page ${pageNumber}`}
                  title="Remove bookmark"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              </div>
            );
          })
        ) : (
          <div
            className="react-flipbook-bookmarks-empty"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ opacity: 0.3, marginBottom: 16 }}
            >
              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
            </svg>
            <p style={{ margin: 0, fontSize: 14 }}>No bookmarks yet</p>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                opacity: 0.7,
              }}
            >
              Click the bookmark button to save pages
            </p>
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div
        className="react-flipbook-bookmarks-footer"
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>
          {sortedBookmarks.length} bookmark{sortedBookmarks.length !== 1 ? 's' : ''}
        </span>
        {sortedBookmarks.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Remove all bookmarks?')) {
                sortedBookmarks.forEach((page) => onRemoveBookmark(page));
              }
            }}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              border: 'none',
              borderRadius: 4,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default BookmarksPanel;
