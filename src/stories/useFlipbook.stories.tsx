import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useFlipbook } from "../hooks";
import type { FlipbookPage } from "../types";

// Sample pages for the hook demos
const samplePages: FlipbookPage[] = [
  {
    src: "https://picsum.photos/400/300?random=1",
    title: "Page 1",
  },
  {
    src: "https://picsum.photos/400/300?random=2",
    title: "Page 2",
  },
  {
    src: "https://picsum.photos/400/300?random=3",
    title: "Page 3",
  },
  {
    src: "https://picsum.photos/400/300?random=4",
    title: "Page 4",
  },
  {
    src: "https://picsum.photos/400/300?random=5",
    title: "Page 5",
  },
  {
    src: "https://picsum.photos/400/300?random=6",
    title: "Page 6",
  },
];

// Demo component that uses the hook
interface UseFlipbookDemoProps {
  pages: FlipbookPage[];
  initialPage?: number;
  rightToLeft?: boolean;
  singlePageMode?: boolean;
  zoomMin?: number;
  zoomMax2?: number;
  zoomStep?: number;
}

const UseFlipbookDemo: React.FC<UseFlipbookDemoProps> = ({
  pages,
  initialPage = 1,
  rightToLeft = false,
  singlePageMode = false,
  zoomMin = 1,
  zoomMax2 = 3,
  zoomStep = 0.5,
}) => {
  const {
    currentPage,
    numPages,
    zoom,
    canGoNext,
    canGoPrev,
    bookmarkedPages,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    goToPage,
    zoomIn,
    zoomOut,
    zoomTo,
    resetZoom,
    toggleBookmark,
    isPageBookmarked,
  } = useFlipbook({
    pages,
    initialPage,
    rightToLeft,
    singlePageMode,
    zoomMin,
    zoomMax2,
    zoomStep,
  });

  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  };

  const primaryButton: React.CSSProperties = {
    ...buttonStyle,
    background: "#4ECDC4",
    color: "white",
  };

  const secondaryButton: React.CSSProperties = {
    ...buttonStyle,
    background: "#45B7D1",
    color: "white",
  };

  const disabledButton: React.CSSProperties = {
    ...buttonStyle,
    background: "#ccc",
    color: "#666",
    cursor: "not-allowed",
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: "600px" }}>
      {/* Current State Display */}
      <div
        style={{
          background: "#1a1a2e",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0" }}>Hook State</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <strong>Current Page:</strong> {currentPage}
          </div>
          <div>
            <strong>Total Pages:</strong> {numPages}
          </div>
          <div>
            <strong>Zoom Level:</strong> {(zoom * 100).toFixed(0)}%
          </div>
          <div>
            <strong>Can Go Next:</strong> {canGoNext ? "Yes" : "No"}
          </div>
          <div>
            <strong>Can Go Prev:</strong> {canGoPrev ? "Yes" : "No"}
          </div>
          <div>
            <strong>Page Bookmarked:</strong>{" "}
            {isPageBookmarked(currentPage) ? "Yes" : "No"}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <strong>Bookmarked Pages:</strong>{" "}
            {bookmarkedPages.length > 0 ? bookmarkedPages.join(", ") : "None"}
          </div>
        </div>
      </div>

      {/* Current Page Preview */}
      <div
        style={{
          marginBottom: "20px",
          textAlign: "center",
          background: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <img
          src={pages[currentPage - 1]?.src}
          alt={`Page ${currentPage}`}
          style={{
            maxWidth: "100%",
            height: "auto",
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.2s",
          }}
        />
        <div style={{ marginTop: "10px", color: "#666" }}>
          {pages[currentPage - 1]?.title}
        </div>
      </div>

      {/* Navigation Controls */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0" }}>Navigation</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={firstPage}
            disabled={!canGoPrev}
            style={canGoPrev ? primaryButton : disabledButton}
          >
            First
          </button>
          <button
            onClick={prevPage}
            disabled={!canGoPrev}
            style={canGoPrev ? secondaryButton : disabledButton}
          >
            Previous
          </button>
          <button
            onClick={nextPage}
            disabled={!canGoNext}
            style={canGoNext ? secondaryButton : disabledButton}
          >
            Next
          </button>
          <button
            onClick={lastPage}
            disabled={!canGoNext}
            style={canGoNext ? primaryButton : disabledButton}
          >
            Last
          </button>
        </div>
      </div>

      {/* Go to Page */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0" }}>Go to Page</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToPage(index + 1)}
              style={{
                ...buttonStyle,
                background: currentPage === index + 1 ? "#FF6B6B" : "#96CEB4",
                color: "white",
                minWidth: "40px",
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Zoom Controls */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0" }}>Zoom</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={zoomOut}
            disabled={zoom <= zoomMin}
            style={zoom > zoomMin ? secondaryButton : disabledButton}
          >
            Zoom Out
          </button>
          <button onClick={resetZoom} style={primaryButton}>
            Reset (100%)
          </button>
          <button
            onClick={zoomIn}
            disabled={zoom >= zoomMax2}
            style={zoom < zoomMax2 ? secondaryButton : disabledButton}
          >
            Zoom In
          </button>
          <button onClick={() => zoomTo(1.5)} style={buttonStyle}>
            150%
          </button>
          <button onClick={() => zoomTo(2)} style={buttonStyle}>
            200%
          </button>
        </div>
      </div>

      {/* Bookmark Controls */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0" }}>Bookmarks</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => toggleBookmark()}
            style={{
              ...buttonStyle,
              background: isPageBookmarked(currentPage) ? "#FF6B6B" : "#DDA0DD",
              color: "white",
            }}
          >
            {isPageBookmarked(currentPage) ? "Remove Bookmark" : "Add Bookmark"}
          </button>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof UseFlipbookDemo> = {
  title: "Hooks/useFlipbook",
  component: UseFlipbookDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
The \`useFlipbook\` hook provides all the core state and functionality for a flipbook component.

## Features
- Page navigation (next, prev, first, last, goToPage)
- Zoom controls (zoomIn, zoomOut, zoomTo, resetZoom)
- Bookmark management
- RTL (right-to-left) support
- Single page mode

## Usage

\`\`\`tsx
import { useFlipbook } from 'react-3d-flipbook';

function MyFlipbook({ pages }) {
  const {
    currentPage,
    numPages,
    zoom,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
  } = useFlipbook({ pages });

  return (
    <div>
      <p>Page {currentPage} of {numPages}</p>
      <button onClick={prevPage}>Previous</button>
      <button onClick={nextPage}>Next</button>
    </div>
  );
}
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    pages: {
      description: "Array of page objects",
      control: "object",
    },
    initialPage: {
      description: "Starting page number",
      control: { type: "number", min: 1 },
    },
    rightToLeft: {
      description: "Enable RTL page order",
      control: "boolean",
    },
    singlePageMode: {
      description: "Display one page at a time",
      control: "boolean",
    },
    zoomMin: {
      description: "Minimum zoom level",
      control: { type: "number", min: 0.1, max: 1, step: 0.1 },
    },
    zoomMax2: {
      description: "Maximum zoom level",
      control: { type: "number", min: 1, max: 5, step: 0.5 },
    },
    zoomStep: {
      description: "Zoom increment step",
      control: { type: "number", min: 0.1, max: 1, step: 0.1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pages: samplePages,
    initialPage: 1,
    rightToLeft: false,
    singlePageMode: false,
    zoomMin: 1,
    zoomMax2: 3,
    zoomStep: 0.5,
  },
};

export const StartOnPage3: Story = {
  args: {
    pages: samplePages,
    initialPage: 3,
  },
  parameters: {
    docs: {
      description: {
        story: "Hook initialized to start on page 3.",
      },
    },
  },
};

export const RightToLeftMode: Story = {
  args: {
    pages: samplePages,
    rightToLeft: true,
  },
  parameters: {
    docs: {
      description: {
        story: "RTL mode - navigation direction is reversed.",
      },
    },
  },
};

export const CustomZoomSettings: Story = {
  args: {
    pages: samplePages,
    zoomMin: 0.5,
    zoomMax2: 4,
    zoomStep: 0.25,
  },
  parameters: {
    docs: {
      description: {
        story: "Custom zoom settings with wider range and smaller steps.",
      },
    },
  },
};

export const TwoPages: Story = {
  args: {
    pages: [
      {
        src: "https://picsum.photos/400/300?random=11",
        title: "Page 1",
      },
      {
        src: "https://picsum.photos/400/300?random=12",
        title: "Page 2",
      },
    ],
    initialPage: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Minimal example with only two pages - demonstrates boundary handling.",
      },
    },
  },
};

export const ManyPages: Story = {
  args: {
    pages: Array.from({ length: 20 }, (_, i) => ({
      src: `https://picsum.photos/400/300?random=${i + 100}`,
      title: `Page ${i + 1}`,
    })),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Example with 20 pages - demonstrates navigation with many pages.",
      },
    },
  },
};
