import React, {
  useCallback,
  useRef,
  useEffect,
  useState,
  useMemo,
} from "react";
import type { FlipbookPage } from "../types";
import { debounce } from "../utils";

export interface SearchResult {
  pageNumber: number;
  pageIndex: number;
  text: string;
  matchIndex: number;
  contextBefore: string;
  contextAfter: string;
}

export interface SearchPanelProps {
  pages: FlipbookPage[];
  pageTextContent?: Map<number, string>;
  currentPage: number;
  isOpen: boolean;
  position?: "left" | "right";
  minQueryLength?: number;
  maxResults?: number;
  highlightColor?: string;
  onPageSelect: (page: number) => void;
  onClose: () => void;
  onSearchStart?: () => void;
  onSearchEnd?: (results: SearchResult[]) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  pages,
  pageTextContent = new Map(),
  currentPage: _currentPage,
  isOpen,
  position = "left",
  minQueryLength = 2,
  maxResults = 100,
  highlightColor = "#ffeb3b",
  onPageSelect,
  onClose,
  onSearchStart,
  onSearchEnd,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(-1);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Extract text content from page
  const extractPageText = useCallback(
    (page: FlipbookPage, pageIndex: number): string => {
      // First check if we have pre-extracted text content
      if (pageTextContent.has(pageIndex)) {
        return pageTextContent.get(pageIndex) || "";
      }

      // Try to get text from htmlContent
      if (page.htmlContent) {
        // Create a temporary element to extract text
        const temp = document.createElement("div");
        temp.innerHTML = page.htmlContent;
        return temp.textContent || temp.innerText || "";
      }

      // Try to get text from title or other metadata
      if (page.title) {
        return page.title;
      }

      return "";
    },
    [pageTextContent],
  );

  // Search function
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.length < minQueryLength) {
        setResults([]);
        onSearchEnd?.([]);
        return;
      }

      setIsSearching(true);
      onSearchStart?.();

      const searchResults: SearchResult[] = [];
      const contextLength = 40; // Characters before and after match

      // Prepare search pattern
      let searchPattern: RegExp;
      try {
        let pattern = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special chars
        if (wholeWord) {
          pattern = `\\b${pattern}\\b`;
        }
        searchPattern = new RegExp(pattern, caseSensitive ? "g" : "gi");
      } catch {
        setIsSearching(false);
        return;
      }

      // Search through all pages
      pages.forEach((page, pageIndex) => {
        if (searchResults.length >= maxResults) return;

        const text = extractPageText(page, pageIndex);
        if (!text) return;

        let match: RegExpExecArray | null;
        searchPattern.lastIndex = 0; // Reset regex state

        while ((match = searchPattern.exec(text)) !== null) {
          if (searchResults.length >= maxResults) break;

          const matchStart = match.index;
          const matchEnd = matchStart + match[0].length;

          // Extract context around the match
          const contextStart = Math.max(0, matchStart - contextLength);
          const contextEnd = Math.min(text.length, matchEnd + contextLength);

          const contextBefore = text.slice(contextStart, matchStart);
          const contextAfter = text.slice(matchEnd, contextEnd);

          searchResults.push({
            pageNumber: pageIndex + 1,
            pageIndex,
            text: match[0],
            matchIndex: matchStart,
            contextBefore: (contextStart > 0 ? "..." : "") + contextBefore,
            contextAfter:
              contextAfter + (contextEnd < text.length ? "..." : ""),
          });
        }
      });

      setResults(searchResults);
      setSelectedResultIndex(searchResults.length > 0 ? 0 : -1);
      setIsSearching(false);
      onSearchEnd?.(searchResults);
    },
    [
      pages,
      minQueryLength,
      maxResults,
      caseSensitive,
      wholeWord,
      extractPageText,
      onSearchStart,
      onSearchEnd,
    ],
  );

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => performSearch(searchQuery), 300),
    [performSearch],
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      setQuery(newQuery);
      debouncedSearch(newQuery);
    },
    [debouncedSearch],
  );

  // Handle result click
  const handleResultClick = useCallback(
    (result: SearchResult, index: number) => {
      setSelectedResultIndex(index);
      onPageSelect(result.pageNumber);
    },
    [onPageSelect],
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedResultIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedResultIndex >= 0 && results[selectedResultIndex]) {
            onPageSelect(results[selectedResultIndex].pageNumber);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, selectedResultIndex, onPageSelect, onClose],
  );

  // Scroll selected result into view
  useEffect(() => {
    if (selectedResultIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedResultIndex}"]`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedResultIndex]);

  // Clear search
  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setSelectedResultIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Navigate to next/previous result
  const navigateResult = useCallback(
    (direction: "next" | "prev") => {
      if (results.length === 0) return;

      let newIndex: number;
      if (direction === "next") {
        newIndex =
          selectedResultIndex < results.length - 1
            ? selectedResultIndex + 1
            : 0;
      } else {
        newIndex =
          selectedResultIndex > 0
            ? selectedResultIndex - 1
            : results.length - 1;
      }

      setSelectedResultIndex(newIndex);
      onPageSelect(results[newIndex].pageNumber);
    },
    [results, selectedResultIndex, onPageSelect],
  );

  // Group results by page
  const groupedResults = useMemo(() => {
    const groups = new Map<number, SearchResult[]>();
    results.forEach((result) => {
      const existing = groups.get(result.pageNumber) || [];
      existing.push(result);
      groups.set(result.pageNumber, existing);
    });
    return groups;
  }, [results]);

  // Render highlighted text
  const renderHighlightedText = (result: SearchResult) => {
    return (
      <span className="react-flipbook-search-result-text">
        <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>
          {result.contextBefore}
        </span>
        <mark
          style={{
            backgroundColor: highlightColor,
            color: "#000",
            padding: "0 2px",
            borderRadius: 2,
          }}
        >
          {result.text}
        </mark>
        <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>
          {result.contextAfter}
        </span>
      </span>
    );
  };

  return (
    <div
      className={`react-flipbook-sidebar react-flipbook-sidebar-${position} ${
        isOpen ? "open" : ""
      }`}
      style={{
        [position]: isOpen ? 0 : -280,
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="react-flipbook-sidebar-header">
        <h3 className="react-flipbook-sidebar-title">Search</h3>
        <button
          type="button"
          className="react-flipbook-sidebar-close"
          onClick={onClose}
          aria-label="Close search"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Search input */}
      <div
        className="react-flipbook-search"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          className="react-flipbook-search-input-wrapper"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{
              position: "absolute",
              left: 10,
              opacity: 0.5,
              pointerEvents: "none",
            }}
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="react-flipbook-search-input"
            placeholder="Search in document..."
            value={query}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "10px 36px 10px 36px",
              border: "none",
              borderRadius: 6,
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "inherit",
              fontSize: 14,
              outline: "none",
            }}
            aria-label="Search query"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: "absolute",
                right: 10,
                padding: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                opacity: 0.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Clear search"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>

        {/* Search options */}
        <div
          className="react-flipbook-search-options"
          style={{
            display: "flex",
            gap: 12,
            marginTop: 8,
            fontSize: 12,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              opacity: 0.8,
            }}
          >
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => {
                setCaseSensitive(e.target.checked);
                if (query.length >= minQueryLength) {
                  performSearch(query);
                }
              }}
              style={{ margin: 0 }}
            />
            Match case
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              opacity: 0.8,
            }}
          >
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={(e) => {
                setWholeWord(e.target.checked);
                if (query.length >= minQueryLength) {
                  performSearch(query);
                }
              }}
              style={{ margin: 0 }}
            />
            Whole word
          </label>
        </div>

        {/* Navigation buttons */}
        {results.length > 0 && (
          <div
            className="react-flipbook-search-nav"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              {selectedResultIndex + 1} of {results.length} results
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                onClick={() => navigateResult("prev")}
                disabled={results.length === 0}
                style={{
                  padding: "4px 8px",
                  border: "none",
                  borderRadius: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Previous result"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => navigateResult("next")}
                disabled={results.length === 0}
                style={{
                  padding: "4px 8px",
                  border: "none",
                  borderRadius: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Next result"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results list */}
      <div
        ref={resultsRef}
        className="react-flipbook-sidebar-content react-flipbook-search-results"
        style={{
          flex: 1,
          overflowY: "auto",
        }}
        role="listbox"
        aria-label="Search results"
      >
        {isSearching ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span style={{ marginTop: 12, fontSize: 14 }}>Searching...</span>
          </div>
        ) : query.length > 0 && query.length < minQueryLength ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: 14,
            }}
          >
            Enter at least {minQueryLength} characters to search
          </div>
        ) : results.length === 0 && query.length >= minQueryLength ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: 14,
            }}
          >
            No results found for "{query}"
          </div>
        ) : results.length > 0 ? (
          <>
            {/* Grouped by page */}
            {Array.from(groupedResults.entries()).map(
              ([pageNumber, pageResults]) => (
                <div
                  key={pageNumber}
                  className="react-flipbook-search-result-group"
                >
                  <div
                    className="react-flipbook-search-result-page-header"
                    style={{
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "rgba(255, 255, 255, 0.7)",
                      position: "sticky",
                      top: 0,
                    }}
                  >
                    Page {pageNumber} ({pageResults.length} match
                    {pageResults.length > 1 ? "es" : ""})
                  </div>
                  {pageResults.map((result) => {
                    const globalIndex = results.findIndex(
                      (r) =>
                        r.pageNumber === result.pageNumber &&
                        r.matchIndex === result.matchIndex,
                    );
                    const isSelected = globalIndex === selectedResultIndex;

                    return (
                      <div
                        key={`${result.pageNumber}-${result.matchIndex}`}
                        data-index={globalIndex}
                        className={`react-flipbook-search-result ${
                          isSelected ? "selected" : ""
                        }`}
                        style={{
                          padding: "10px 16px",
                          cursor: "pointer",
                          backgroundColor: isSelected
                            ? "rgba(74, 158, 255, 0.2)"
                            : "transparent",
                          borderLeft: isSelected
                            ? "3px solid #4a9eff"
                            : "3px solid transparent",
                          transition: "background-color 0.15s ease",
                        }}
                        onClick={() => handleResultClick(result, globalIndex)}
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleResultClick(result, globalIndex);
                          }
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            lineHeight: 1.5,
                            wordBreak: "break-word",
                          }}
                        >
                          {renderHighlightedText(result)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ),
            )}
          </>
        ) : (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: 14,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ opacity: 0.3, marginBottom: 12 }}
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <p>Enter a search term to find text in the document</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {results.length > 0 && (
        <div
          className="react-flipbook-search-footer"
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: 12,
            color: "rgba(255, 255, 255, 0.6)",
            textAlign: "center",
          }}
        >
          Found in {groupedResults.size} page
          {groupedResults.size > 1 ? "s" : ""}
          {results.length >= maxResults && (
            <span style={{ display: "block", marginTop: 4 }}>
              (showing first {maxResults} results)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
