import React, { useCallback, useRef, useEffect, useState } from 'react';
import type { TocItem } from '../types';

export interface TableOfContentsProps {
  items: TocItem[];
  currentPage: number;
  isOpen: boolean;
  position?: 'left' | 'right';
  closeOnClick?: boolean;
  onPageSelect: (page: number) => void;
  onClose: () => void;
}

interface TocItemComponentProps {
  item: TocItem;
  depth: number;
  currentPage: number;
  expandedItems: Set<string>;
  onToggle: (title: string) => void;
  onSelect: (page: number) => void;
}

// Individual TOC item component
const TocItemComponent: React.FC<TocItemComponentProps> = ({
  item,
  depth,
  currentPage,
  expandedItems,
  onToggle,
  onSelect,
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item.title);
  const isActive = item.page === currentPage;

  // Check if any child contains the current page
  const containsCurrentPage = useCallback(
    (tocItem: TocItem): boolean => {
      if (tocItem.page === currentPage) return true;
      if (tocItem.children) {
        return tocItem.children.some((child) => containsCurrentPage(child));
      }
      return false;
    },
    [currentPage]
  );

  const hasActiveChild = hasChildren && containsCurrentPage(item);

  const handleClick = useCallback(() => {
    onSelect(item.page);
  }, [item.page, onSelect]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(item.title);
    },
    [item.title, onToggle]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(item.page);
      } else if (e.key === 'ArrowRight' && hasChildren && !isExpanded) {
        e.preventDefault();
        onToggle(item.title);
      } else if (e.key === 'ArrowLeft' && hasChildren && isExpanded) {
        e.preventDefault();
        onToggle(item.title);
      }
    },
    [item.page, item.title, hasChildren, isExpanded, onSelect, onToggle]
  );

  return (
    <div className="react-flipbook-toc-item-wrapper">
      <div
        className={`react-flipbook-toc-item ${isActive ? 'active' : ''} ${
          hasActiveChild ? 'has-active-child' : ''
        }`}
        style={{
          paddingLeft: `${16 + depth * 16}px`,
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="treeitem"
        aria-selected={isActive}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
      >
        {/* Expand/collapse button for items with children */}
        {hasChildren && (
          <button
            type="button"
            className="react-flipbook-toc-toggle"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              padding: 0,
              marginRight: 4,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        )}

        {/* Spacer for items without children to maintain alignment */}
        {!hasChildren && <span style={{ width: 24, flexShrink: 0 }} />}

        {/* Title */}
        <span className="react-flipbook-toc-item-title">{item.title}</span>

        {/* Page number */}
        <span className="react-flipbook-toc-item-page">{item.page}</span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div
          className="react-flipbook-toc-children"
          role="group"
          style={{
            overflow: 'hidden',
          }}
        >
          {item.children!.map((child, index) => (
            <TocItemComponent
              key={`${child.title}-${index}`}
              item={child}
              depth={depth + 1}
              currentPage={currentPage}
              expandedItems={expandedItems}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Table of Contents component
const TableOfContents: React.FC<TableOfContentsProps> = ({
  items,
  currentPage,
  isOpen,
  position = 'left',
  closeOnClick = true,
  onPageSelect,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-expand items containing the current page
  useEffect(() => {
    const findPathToPage = (
      tocItems: TocItem[],
      targetPage: number,
      path: string[] = []
    ): string[] | null => {
      for (const item of tocItems) {
        if (item.page === targetPage) {
          return path;
        }
        if (item.children) {
          const result = findPathToPage(item.children, targetPage, [
            ...path,
            item.title,
          ]);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };

    const path = findPathToPage(items, currentPage);
    if (path) {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        path.forEach((title) => newSet.add(title));
        return newSet;
      });
    }
  }, [currentPage, items]);

  // Scroll to active item when panel opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const activeItem = containerRef.current.querySelector(
        '.react-flipbook-toc-item.active'
      );
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [isOpen]);

  // Toggle item expansion
  const handleToggle = useCallback((title: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  }, []);

  // Handle page selection
  const handleSelect = useCallback(
    (page: number) => {
      onPageSelect(page);
      if (closeOnClick) {
        onClose();
      }
    },
    [onPageSelect, closeOnClick, onClose]
  );

  // Handle search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  // Filter items based on search query
  const filterItems = useCallback(
    (tocItems: TocItem[], query: string): TocItem[] => {
      if (!query.trim()) {
        return tocItems;
      }

      const lowerQuery = query.toLowerCase();

      const filterRecursive = (items: TocItem[]): TocItem[] => {
        return items.reduce<TocItem[]>((acc, item) => {
          const titleMatches = item.title.toLowerCase().includes(lowerQuery);
          const filteredChildren = item.children
            ? filterRecursive(item.children)
            : [];

          if (titleMatches || filteredChildren.length > 0) {
            acc.push({
              ...item,
              children:
                filteredChildren.length > 0 ? filteredChildren : item.children,
            });
          }

          return acc;
        }, []);
      };

      return filterRecursive(tocItems);
    },
    []
  );

  // Expand all items when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const getAllTitles = (tocItems: TocItem[]): string[] => {
        return tocItems.reduce<string[]>((acc, item) => {
          acc.push(item.title);
          if (item.children) {
            acc.push(...getAllTitles(item.children));
          }
          return acc;
        }, []);
      };
      setExpandedItems(new Set(getAllTitles(items)));
    }
  }, [searchQuery, items]);

  const filteredItems = filterItems(items, searchQuery);

  // Expand all handler
  const handleExpandAll = useCallback(() => {
    const getAllTitles = (tocItems: TocItem[]): string[] => {
      return tocItems.reduce<string[]>((acc, item) => {
        if (item.children && item.children.length > 0) {
          acc.push(item.title);
          acc.push(...getAllTitles(item.children));
        }
        return acc;
      }, []);
    };
    setExpandedItems(new Set(getAllTitles(items)));
  }, [items]);

  // Collapse all handler
  const handleCollapseAll = useCallback(() => {
    setExpandedItems(new Set());
  }, []);

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
        <h3 className="react-flipbook-sidebar-title">Table of Contents</h3>
        <button
          type="button"
          className="react-flipbook-sidebar-close"
          onClick={onClose}
          aria-label="Close table of contents"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Search input */}
      <div
        className="react-flipbook-toc-search"
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{
              position: 'absolute',
              left: 8,
              opacity: 0.5,
            }}
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            className="react-flipbook-toc-search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '8px 8px 8px 32px',
              border: 'none',
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'inherit',
              fontSize: 14,
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 8,
                padding: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                opacity: 0.5,
              }}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expand/Collapse buttons */}
      <div
        className="react-flipbook-toc-actions"
        style={{
          display: 'flex',
          gap: 8,
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          type="button"
          onClick={handleExpandAll}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: 12,
            border: 'none',
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          Expand All
        </button>
        <button
          type="button"
          onClick={handleCollapseAll}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: 12,
            border: 'none',
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          Collapse All
        </button>
      </div>

      {/* TOC list */}
      <div
        ref={containerRef}
        className="react-flipbook-sidebar-content react-flipbook-toc"
        role="tree"
        aria-label="Table of contents"
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <TocItemComponent
              key={`${item.title}-${index}`}
              item={item}
              depth={0}
              currentPage={currentPage}
              expandedItems={expandedItems}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          ))
        ) : (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            {searchQuery ? 'No results found' : 'No table of contents'}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div
        className="react-flipbook-toc-footer"
        style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
        }}
      >
        {items.length} sections
      </div>
    </div>
  );
};

export default TableOfContents;
