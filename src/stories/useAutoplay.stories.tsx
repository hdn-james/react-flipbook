import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useAutoplay } from "../hooks";
import type { FlipbookPage } from "../types";

// Sample pages for the hook demos (not currently rendered, but kept for reference)
const samplePages: FlipbookPage[] = [
  { src: "https://picsum.photos/400/300?random=21", title: "Page 1" },
  { src: "https://picsum.photos/400/300?random=22", title: "Page 2" },
  { src: "https://picsum.photos/400/300?random=23", title: "Page 3" },
  { src: "https://picsum.photos/400/300?random=24", title: "Page 4" },
  { src: "https://picsum.photos/400/300?random=25", title: "Page 5" },
  { src: "https://picsum.photos/400/300?random=26", title: "Page 6" },
];

// Demo component that uses the hook
interface UseAutoplayDemoProps {
  numPages: number;
  interval?: number;
  loop?: boolean;
  autoStart?: boolean;
  rightToLeft?: boolean;
  pagesPerFlip?: number;
}

const UseAutoplayDemo: React.FC<UseAutoplayDemoProps> = ({
  numPages,
  interval = 3000,
  loop = true,
  autoStart = false,
  rightToLeft = false,
  pagesPerFlip = 1,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setEventLog((prev) => [
      ...prev.slice(-9),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const {
    isPlaying,
    isPaused,
    start,
    stop,
    pause,
    resume,
    toggle,
    skipNext,
    reset,
    setInterval: updateInterval,
    interval: currentInterval,
  } = useAutoplay({
    numPages,
    currentPage,
    interval,
    loop,
    autoStart,
    rightToLeft,
    pageIncrement: pagesPerFlip,
    onPageChange: (page) => {
      setCurrentPage(page);
      addLog(`Page changed to ${page}`);
    },
    onStart: () => addLog("Autoplay started"),
    onStop: () => addLog("Autoplay stopped"),
    onPause: () => addLog("Autoplay paused"),
    onResume: () => addLog("Autoplay resumed"),
    onComplete: () => addLog("Autoplay completed (reached end)"),
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

  const dangerButton: React.CSSProperties = {
    ...buttonStyle,
    background: "#FF6B6B",
    color: "white",
  };

  const warningButton: React.CSSProperties = {
    ...buttonStyle,
    background: "#FFEAA7",
    color: "#333",
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: "700px" }}>
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
        <h3 style={{ margin: "0 0 16px 0" }}>Autoplay State</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color: isPlaying ? "#4ECDC4" : isPaused ? "#FFEAA7" : "#FF6B6B",
              }}
            >
              {isPlaying ? "Playing" : isPaused ? "Paused" : "Stopped"}
            </span>
          </div>
          <div>
            <strong>Current Page:</strong> {currentPage}
          </div>
          <div>
            <strong>Total Pages:</strong> {numPages}
          </div>
          <div>
            <strong>Interval:</strong> {currentInterval}ms
          </div>
          <div>
            <strong>Loop:</strong> {loop ? "Yes" : "No"}
          </div>
          <div>
            <strong>Direction:</strong> {rightToLeft ? "RTL" : "LTR"}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div
        style={{
          marginBottom: "20px",
          background: "#f5f5f5",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h4 style={{ margin: "0 0 12px 0" }}>Progress</h4>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: currentPage === i + 1 ? "#4ECDC4" : "#ddd",
                color: currentPage === i + 1 ? "white" : "#666",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                transition: "all 0.3s",
                transform: currentPage === i + 1 ? "scale(1.2)" : "scale(1)",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: "12px",
            background: "#ddd",
            borderRadius: "4px",
            height: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${((currentPage - 1) / (numPages - 1)) * 100}%`,
              height: "100%",
              background: isPlaying
                ? "#4ECDC4"
                : isPaused
                  ? "#FFEAA7"
                  : "#96CEB4",
              transition: "width 0.3s, background 0.3s",
            }}
          />
        </div>
      </div>

      {/* Playback Controls */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0" }}>Playback Controls</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={start} disabled={isPlaying} style={primaryButton}>
            ▶ Start
          </button>
          <button
            onClick={stop}
            disabled={!isPlaying && !isPaused}
            style={dangerButton}
          >
            ■ Stop
          </button>
          <button
            onClick={pause}
            disabled={!isPlaying || isPaused}
            style={warningButton}
          >
            ⏸ Pause
          </button>
          <button onClick={resume} disabled={!isPaused} style={primaryButton}>
            ▶ Resume
          </button>
          <button onClick={toggle} style={secondaryButton}>
            ⏯ Toggle
          </button>
        </div>
      </div>

      {/* Additional Controls */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0" }}>Additional Controls</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={skipNext} style={secondaryButton}>
            ⏭ Skip to Next
          </button>
          <button onClick={reset} style={warningButton}>
            ↺ Reset to Start
          </button>
        </div>
      </div>

      {/* Interval Control */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0" }}>Interval Control</h4>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button onClick={() => updateInterval(1000)} style={buttonStyle}>
            1s
          </button>
          <button onClick={() => updateInterval(2000)} style={buttonStyle}>
            2s
          </button>
          <button onClick={() => updateInterval(3000)} style={buttonStyle}>
            3s
          </button>
          <button onClick={() => updateInterval(5000)} style={buttonStyle}>
            5s
          </button>
          <span style={{ color: "#666" }}>Current: {currentInterval}ms</span>
        </div>
      </div>

      {/* Event Log */}
      <div
        style={{
          background: "#2d2d44",
          color: "#aaa",
          padding: "16px",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "12px",
          maxHeight: "200px",
          overflow: "auto",
        }}
      >
        <h4 style={{ margin: "0 0 12px 0", color: "white" }}>Event Log</h4>
        {eventLog.length === 0 ? (
          <div>No events yet. Start autoplay to see events.</div>
        ) : (
          eventLog.map((log, index) => (
            <div key={index} style={{ marginBottom: "4px" }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const meta: Meta<typeof UseAutoplayDemo> = {
  title: "Hooks/useAutoplay",
  component: UseAutoplayDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
The \`useAutoplay\` hook provides automatic page-flipping functionality for a flipbook.

## Features
- Start, stop, pause, and resume autoplay
- Configurable interval between page flips
- Loop or stop at end
- RTL (right-to-left) support
- Skip to next page manually
- Reset to beginning
- Dynamic interval changes
- Comprehensive event callbacks

## Usage

\`\`\`tsx
import { useAutoplay } from 'react-3d-flipbook';

function MyAutoplayFlipbook({ pages }) {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    isPlaying,
    isPaused,
    start,
    stop,
    pause,
    resume,
    toggle,
  } = useAutoplay({
    numPages: pages.length,
    interval: 3000,
    loop: true,
    onPageChange: setCurrentPage,
  });

  return (
    <div>
      <button onClick={toggle}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <div>Page {currentPage}</div>
    </div>
  );
}
\`\`\`

## Callbacks

| Callback | Description |
|----------|-------------|
| \`onPageChange\` | Called when page changes |
| \`onStart\` | Called when autoplay starts |
| \`onStop\` | Called when autoplay stops |
| \`onPause\` | Called when autoplay pauses |
| \`onResume\` | Called when autoplay resumes |
| \`onComplete\` | Called when reaching end (non-loop mode) |
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    numPages: {
      description: "Total number of pages",
      control: { type: "number", min: 2, max: 20 },
    },
    interval: {
      description: "Interval between page flips (ms)",
      control: { type: "number", min: 500, max: 10000, step: 500 },
    },
    loop: {
      description: "Loop back to start when reaching end",
      control: "boolean",
    },
    autoStart: {
      description: "Start autoplay automatically",
      control: "boolean",
    },
    rightToLeft: {
      description: "Enable RTL page order",
      control: "boolean",
    },
    pagesPerFlip: {
      description: "Number of pages to flip at a time",
      control: { type: "number", min: 1, max: 5 },
      name: "pageIncrement",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    numPages: 6,
    interval: 3000,
    loop: true,
    autoStart: false,
    rightToLeft: false,
    pagesPerFlip: 1,
  },
};

export const AutoStart: Story = {
  args: {
    numPages: 6,
    interval: 2000,
    loop: true,
    autoStart: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Autoplay starts automatically when the component mounts.",
      },
    },
  },
};

export const NoLoop: Story = {
  args: {
    numPages: 6,
    interval: 2000,
    loop: false,
    autoStart: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Autoplay stops when reaching the last page instead of looping.",
      },
    },
  },
};

export const FastInterval: Story = {
  args: {
    numPages: 6,
    interval: 1000,
    loop: true,
    autoStart: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Faster autoplay with 1 second interval between pages.",
      },
    },
  },
};

export const SlowInterval: Story = {
  args: {
    numPages: 6,
    interval: 5000,
    loop: true,
    autoStart: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Slower autoplay with 5 second interval between pages.",
      },
    },
  },
};

export const RightToLeft: Story = {
  args: {
    numPages: 6,
    interval: 2000,
    loop: true,
    autoStart: false,
    rightToLeft: true,
  },
  parameters: {
    docs: {
      description: {
        story: "RTL mode - autoplay goes from last page to first.",
      },
    },
  },
};

export const TwoPagesPerFlip: Story = {
  args: {
    numPages: 10,
    interval: 2000,
    loop: true,
    autoStart: false,
    pagesPerFlip: 2,
  },
  parameters: {
    docs: {
      description: {
        story: "Flip two pages at a time during autoplay.",
      },
    },
  },
};

export const ManyPages: Story = {
  args: {
    numPages: 20,
    interval: 1500,
    loop: true,
    autoStart: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Autoplay with 20 pages - demonstrates progress with many pages.",
      },
    },
  },
};
