import React, { useRef, useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import * as pdfjsLib from "pdfjs-dist";
import Flipbook from "../components/Flipbook";
import type { FlipbookProps, FlipbookPage, FlipbookInstance } from "../types";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

// Sample page data for stories using picsum.photos (real images)
const generateSamplePages = (count: number): FlipbookPage[] => {
  return Array.from({ length: count }, (_, i) => ({
    src: `https://picsum.photos/800/600?random=${i + 1}`,
    title: `Page ${i + 1}`,
    thumb: `https://picsum.photos/100/75?random=${i + 1}`,
  }));
};

// Placeholder pages using picsum.photos for reliable image loading
const placeholderPages: FlipbookPage[] = [
  {
    src: "https://picsum.photos/800/600?random=101",
    title: "Cover",
  },
  {
    src: "https://picsum.photos/800/600?random=102",
    title: "Introduction",
  },
  {
    src: "https://picsum.photos/800/600?random=103",
    title: "Chapter 1",
  },
  {
    src: "https://picsum.photos/800/600?random=104",
    title: "Chapter 2",
  },
  {
    src: "https://picsum.photos/800/600?random=105",
    title: "Chapter 3",
  },
  {
    src: "https://picsum.photos/800/600?random=106",
    title: "Conclusion",
  },
];

const meta: Meta<typeof Flipbook> = {
  title: "Components/Flipbook",
  component: Flipbook,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A React component for creating interactive 3D flipbooks with realistic page-turning effects powered by WebGL/Three.js.

## Features
- 🎨 Multiple skins/themes (dark, light, gradient)
- 📱 Touch and swipe support
- 🔍 Zoom in/out functionality
- 📑 Bookmark pages
- ⬅️➡️ RTL (Right-to-Left) support
- 📄 Single and double page modes
- 🎥 Fullscreen support
- ⌨️ Keyboard navigation
- 💡 Dynamic lighting and shadows
- 🎭 Realistic 3D page physics

## WebGL Rendering
This component uses WebGL (Three.js) for hardware-accelerated 3D rendering with realistic page-flip animations, lighting effects, and shadow casting.
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    pages: {
      description: "Array of page objects to display",
      control: "object",
    },
    width: {
      description: "Width of the flipbook container",
      control: { type: "text" },
    },
    height: {
      description: "Height of the flipbook container",
      control: { type: "text" },
    },
    skin: {
      description: "Theme/skin for the flipbook",
      control: { type: "select" },
      options: ["dark", "light", "gradient"],
    },
    startPage: {
      description: "Initial page to display",
      control: { type: "number", min: 1 },
    },
    rightToLeft: {
      description: "Enable right-to-left page order",
      control: "boolean",
    },
    singlePageMode: {
      description: "Display one page at a time instead of two-page spread",
      control: "boolean",
    },
    sideNavigationButtons: {
      description: "Show side navigation arrows",
      control: "boolean",
    },
    hideMenu: {
      description: "Hide the bottom toolbar",
      control: "boolean",
    },
    backgroundColor: {
      description: "Background color of the flipbook container",
      control: "color",
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
    touchSwipeEnabled: {
      description: "Enable touch/swipe navigation",
      control: "boolean",
    },
    pageFlipDuration: {
      description: "Duration of page flip animation in milliseconds",
      control: { type: "number", min: 200, max: 2000, step: 100 },
    },
    pageHardness: {
      description: "Page flexibility (0 = very flexible, 1 = rigid)",
      control: { type: "number", min: 0, max: 1, step: 0.1 },
    },
    coverHardness: {
      description: "Cover rigidity (0 = flexible, 1 = rigid)",
      control: { type: "number", min: 0, max: 1, step: 0.1 },
    },
    shadows: {
      description: "Enable shadow rendering",
      control: "boolean",
    },
    shadowOpacity: {
      description: "Shadow intensity (0-1)",
      control: { type: "number", min: 0, max: 1, step: 0.1 },
    },
    lights: {
      description: "Enable dynamic lighting",
      control: "boolean",
    },
    lightIntensity: {
      description: "Light brightness",
      control: { type: "number", min: 0, max: 3, step: 0.1 },
    },
    pageRoughness: {
      description: "Page material roughness (0 = glossy, 1 = matte)",
      control: { type: "number", min: 0, max: 1, step: 0.1 },
    },
    pageMetalness: {
      description: "Page material metalness",
      control: { type: "number", min: 0, max: 1, step: 0.1 },
    },
    cameraZoom: {
      description:
        "Camera zoom/margin factor - higher values move camera further back",
      control: { type: "number", min: 1, max: 2, step: 0.05 },
    },
    pageScale: {
      description: "Base page scale in world units - affects overall page size",
      control: { type: "number", min: 3, max: 10, step: 0.5 },
    },
    cameraPositionY: {
      description: "Camera vertical position offset",
      control: { type: "number", min: -3, max: 3, step: 0.1 },
    },
    cameraLookAtY: {
      description: "Camera look-at Y position",
      control: { type: "number", min: -2, max: 2, step: 0.1 },
    },
    cameraFov: {
      description: "Field of view in degrees",
      control: { type: "number", min: 20, max: 90, step: 5 },
    },
    onPageFlip: {
      description: "Callback when page changes",
    },
    onZoomChange: {
      description: "Callback when zoom level changes",
    },
    onFullscreenChange: {
      description: "Callback when fullscreen mode changes",
    },
  },
  args: {
    onReady: fn(),
    onPageFlip: fn(),
    onZoomChange: fn(),
    onFullscreenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Container decorator for consistent sizing
const withContainer = (Story: React.ComponentType) => (
  <div
    style={{
      width: "100%",
      minHeight: "600px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Story />
  </div>
);

// ============================================================================
// Basic Stories
// ============================================================================

// Wrapper component for Default story to use hooks properly
const DefaultFlipbookDemo: React.FC<FlipbookProps> = (args) => {
  const flipbookRef = useRef<FlipbookInstance>(null);
  const [page, setPage] = useState(args.startPage || 1);
  const prevPageRef = useRef(page);

  // Sync control to animation: when page changes from input, animate flip
  useEffect(() => {
    if (
      flipbookRef.current &&
      typeof page === "number" &&
      page !== prevPageRef.current
    ) {
      flipbookRef.current.flipToPage(page);
      prevPageRef.current = page;
    }
  }, [page]);

  // When Flipbook animates, update control state
  const handlePageFlip = (e: { page: number; direction: "next" | "prev" }) => {
    setPage(e.page);
    prevPageRef.current = e.page;
    args.onPageFlip?.(e);
  };

  return (
    <div
      style={{ width: args.width, height: args.height, position: "relative" }}
    >
      <Flipbook
        ref={flipbookRef}
        {...args}
        startPage={page}
        onPageFlip={handlePageFlip}
      />
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => flipbookRef.current?.flipPrev()}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: "none",
            background: "#4ECDC4",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Prev (Animated)
        </button>
        <button
          onClick={() => flipbookRef.current?.flipNext()}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: "none",
            background: "#45B7D1",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Next (Animated)
        </button>
        <label style={{ color: "#333", fontWeight: 600, marginTop: 8 }}>
          Go to Page (Animated):
          <input
            type="number"
            min={1}
            max={args.pages.length}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            style={{
              marginLeft: 8,
              width: 60,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontWeight: 600,
            }}
          />
        </label>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <DefaultFlipbookDemo {...args} />,
  args: {
    pages: placeholderPages,
    width: "834",
    height: "1112",
    skin: "dark",
    startPage: 1,
  },
  decorators: [withContainer],
};

export const DarkTheme: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    backgroundColor: "rgb(30, 30, 30)",
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: "Dark theme with a darker background color.",
      },
    },
  },
};

export const LightTheme: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "light",
    backgroundColor: "#f5f5f5",
  },

  decorators: [withContainer],

  parameters: {
    docs: {
      description: {
        story: "Light theme suitable for bright backgrounds.",
      },
    },
  },

  globals: {
    backgrounds: {
      value: "light",
    },
  },
};

export const GradientTheme: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "gradient",
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: "Gradient theme with a colorful background.",
      },
    },
  },
};

// ============================================================================
// Layout & Display Stories
// ============================================================================

export const SinglePageMode: Story = {
  args: {
    pages: placeholderPages,
    width: 500,
    height: 600,
    skin: "dark",
    singlePageMode: true,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
Single page mode displays one page at a time instead of a two-page spread.
Ideal for mobile devices or portrait-oriented content.
        `,
      },
    },
  },
};

export const RightToLeft: Story = {
  args: {
    pages: [
      {
        src: "https://picsum.photos/800/600?random=201",
        title: "עמוד 1",
      },
      {
        src: "https://picsum.photos/800/600?random=202",
        title: "עמוד 2",
      },
      {
        src: "https://picsum.photos/800/600?random=203",
        title: "עמוד 3",
      },
      {
        src: "https://picsum.photos/800/600?random=204",
        title: "עמוד 4",
      },
    ],
    width: "",
    height: 500,
    skin: "dark",
    rightToLeft: true,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
Right-to-left mode for languages like Hebrew, Arabic, or Japanese.
Navigation is reversed - pages flip from left to right.
        `,
      },
    },
  },
};

export const NoToolbar: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    hideMenu: true,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
Flipbook with the bottom toolbar hidden.
Navigation is still possible via side buttons, keyboard, or touch/swipe.
        `,
      },
    },
  },
};

export const NoSideNavigation: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    sideNavigationButtons: false,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
Flipbook with side navigation arrows hidden.
Use the toolbar, keyboard arrows, or swipe gestures to navigate.
        `,
      },
    },
  },
};

export const StartOnPage3: Story = {
  args: {
    pages: generateSamplePages(8),
    width: 800,
    height: 500,
    skin: "dark",
    startPage: 3,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: "Flipbook initialized to open on page 3.",
      },
    },
  },
};

// ============================================================================
// Page Count & Format Stories
// ============================================================================

export const ManyPages: Story = {
  args: {
    pages: generateSamplePages(30),
    width: 800,
    height: 500,
    skin: "dark",
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
Flipbook with 30 pages demonstrating performance with larger documents.
WebGL rendering ensures smooth animations even with many pages.
        `,
      },
    },
  },
};

export const SquareFormat: Story = {
  args: {
    pages: [
      {
        src: "https://picsum.photos/600/600?random=301",
        title: "Square 1",
      },
      {
        src: "https://picsum.photos/600/600?random=302",
        title: "Square 2",
      },
      {
        src: "https://picsum.photos/600/600?random=303",
        title: "Square 3",
      },
      {
        src: "https://picsum.photos/600/600?random=304",
        title: "Square 4",
      },
    ],
    width: 600,
    height: 600,
    skin: "dark",
    singlePageMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Square format flipbook - perfect for Instagram-style content.",
      },
    },
  },
};

export const WideFormat: Story = {
  args: {
    pages: [
      {
        src: "https://picsum.photos/1200/400?random=401",
        title: "Panorama 1",
      },
      {
        src: "https://picsum.photos/1200/400?random=402",
        title: "Panorama 2",
      },
      {
        src: "https://picsum.photos/1200/400?random=403",
        title: "Panorama 3",
      },
    ],
    width: 1200,
    height: 400,
    skin: "dark",
  },
  parameters: {
    docs: {
      description: {
        story: `
Wide/panoramic format flipbook.
Great for landscape photography or cinematic content.
        `,
      },
    },
  },
};

export const ResponsiveWidth: Story = {
  args: {
    pages: placeholderPages,
    width: "100%",
    height: 500,
    skin: "dark",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "1000px" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
Flipbook with responsive width (100%) that adapts to its container.
Useful for fluid layouts.
        `,
      },
    },
  },
};

export const Minimal: Story = {
  args: {
    pages: [
      { src: "https://picsum.photos/800/600?random=501", title: "Page 1" },
      { src: "https://picsum.photos/800/600?random=502", title: "Page 2" },
      { src: "https://picsum.photos/800/600?random=503", title: "Page 3" },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: `
Minimal configuration - only pages are required.
All other props use sensible defaults.
        `,
      },
    },
  },
};

export const WithEmptyPages: Story = {
  args: {
    pages: [
      {
        src: "https://picsum.photos/800/600?random=601",
        title: "Cover",
      },
      { src: "", title: "Empty Page", empty: true },
      {
        src: "https://picsum.photos/800/600?random=602",
        title: "Content Page",
      },
      { src: "", title: "Empty Page", empty: true },
      {
        src: "https://picsum.photos/800/600?random=603",
        title: "Back Cover",
      },
    ],
    width: 800,
    height: 500,
    skin: "dark",
  },
  parameters: {
    docs: {
      description: {
        story: "Flipbook with empty placeholder pages interspersed.",
      },
    },
  },
};

// ============================================================================
// WebGL Settings Stories
// ============================================================================

export const WebGL3DMode: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    shadows: true,
    lights: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
WebGL-powered 3D flipbook with realistic page-turning animations.

**Features:**
- Realistic 3D page flip animations
- Dynamic lighting and shadows
- Smooth page bending physics
- Hardware-accelerated rendering

**Note:** Requires WebGL support. A fallback message is shown if WebGL is not available.
        `,
      },
    },
  },
};

export const WebGLCustomSettings: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    pageFlipDuration: 1200,
    pageHardness: 0.3,
    coverHardness: 0.95,
    shadows: true,
    shadowOpacity: 0.5,
    lights: true,
    lightIntensity: 1.2,
    pageRoughness: 0.2,
    pageMetalness: 0.8,
  },
  parameters: {
    docs: {
      description: {
        story: `
WebGL mode with customized settings for a different visual feel.

**Customizations:**
- Slower flip animation (1200ms)
- Softer pages (hardness 0.3)
- Stronger shadows (opacity 0.5)
- Brighter lighting (intensity 1.2)
- Glossier page material (lower roughness)
        `,
      },
    },
  },
};

export const WebGLNoShadows: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    shadows: false,
    lights: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "WebGL mode with shadows disabled for better performance on lower-end devices.",
      },
    },
  },
};

export const WebGLNoLights: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    shadows: false,
    lights: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "WebGL mode with both shadows and dynamic lighting disabled for maximum performance.",
      },
    },
  },
};

export const WebGLSinglePage: Story = {
  args: {
    pages: placeholderPages,
    width: 500,
    height: 600,
    skin: "dark",
    singlePageMode: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "WebGL mode in single page view - ideal for portrait content or mobile devices.",
      },
    },
  },
};

export const WebGLSlowFlip: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    pageFlipDuration: 1500,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
Slower page flip animation (1500ms).
Good for presentations or when you want users to appreciate the 3D effect.
        `,
      },
    },
  },
};

export const WebGLFastFlip: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    pageFlipDuration: 300,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
Fast page flip animation (300ms).
Better for quick browsing through many pages.
        `,
      },
    },
  },
};

export const WebGLRigidPages: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    pageHardness: 0.9,
    coverHardness: 1.0,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
Rigid pages with minimal bending - simulates thick cardstock or board pages.
        `,
      },
    },
  },
};

export const WebGLFlexiblePages: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    pageHardness: 0.1,
    coverHardness: 0.3,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
Very flexible pages with maximum bending - simulates thin paper.
        `,
      },
    },
  },
};

export const WebGLGlossyPages: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    pageRoughness: 0.1,
    pageMetalness: 0.3,
    lights: true,
    lightIntensity: 1.5,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
Glossy magazine-style pages with high reflectivity.
        `,
      },
    },
  },
};

// ============================================================================
// Toolbar Customization Stories
// ============================================================================

export const CustomButtonTitles: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    btnFirst: { enabled: true, title: "Go to Start" },
    btnPrev: { enabled: true, title: "Back" },
    btnNext: { enabled: true, title: "Forward" },
    btnLast: { enabled: true, title: "Go to End" },
    btnExpand: { enabled: true, title: "Toggle Fullscreen" },
    btnBookmark: { enabled: true, title: "Save Page" },
  },
  parameters: {
    docs: {
      description: {
        story: "Toolbar buttons with custom tooltip titles.",
      },
    },
  },
};

export const DisabledButtons: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    btnFirst: { enabled: false },
    btnLast: { enabled: false },
    btnBookmark: { enabled: false },
    btnExpand: { enabled: false },
  },
  parameters: {
    docs: {
      description: {
        story: "Flipbook with some toolbar buttons disabled.",
      },
    },
  },
};

// ============================================================================
// Content Stories
// ============================================================================

export const HTMLContentPages: Story = {
  args: {
    pages: [
      {
        src: "https://picsum.photos/800/600?random=701",
        title: "Interactive Page",
        htmlContent: `
          <div style="position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.7); color: white; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0;">Welcome!</h3>
            <p style="margin: 0;">This page has HTML overlay content.</p>
          </div>
        `,
      },
      {
        src: "https://picsum.photos/800/600?random=702",
        title: "Page with Link",
        htmlContent: `
          <a href="#" style="position: absolute; top: 20px; right: 20px; background: #4ECDC4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Click Me
          </a>
        `,
      },
      {
        src: "https://picsum.photos/800/600?random=703",
        title: "Simple Page",
      },
    ],
    width: 800,
    height: 500,
    skin: "dark",
  },
  parameters: {
    docs: {
      description: {
        story: `
Pages can include HTML content overlays for interactive elements,
captions, links, or custom UI components.
        `,
      },
    },
  },
};

// ============================================================================
// Interactive Stories
// ============================================================================

// Wrapper component for ProgrammaticControl story to use hooks properly
const ProgrammaticControlDemo: React.FC = () => {
  const flipbookRef = useRef<FlipbookInstance>(null);

  return (
    <div>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => flipbookRef.current?.flipToFirst()}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "1px solid #4ECDC4",
            background: "#4ECDC4",
            color: "white",
            cursor: "pointer",
          }}
        >
          First Page (Animated)
        </button>
        <button
          onClick={() => flipbookRef.current?.flipPrev()}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "1px solid #45B7D1",
            background: "#45B7D1",
            color: "white",
            cursor: "pointer",
          }}
        >
          Previous (Animated)
        </button>
        <button
          onClick={() => flipbookRef.current?.flipNext()}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "1px solid #45B7D1",
            background: "#45B7D1",
            color: "white",
            cursor: "pointer",
          }}
        >
          Next (Animated)
        </button>
        <button
          onClick={() => flipbookRef.current?.flipToLast()}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "1px solid #4ECDC4",
            background: "#4ECDC4",
            color: "white",
            cursor: "pointer",
          }}
        >
          Last Page (Animated)
        </button>
        <button
          onClick={() => flipbookRef.current?.flipToPage(3)}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "1px solid #96CEB4",
            background: "#96CEB4",
            color: "white",
            cursor: "pointer",
          }}
        >
          Go to Page 3 (Animated)
        </button>
        <button
          onClick={() => flipbookRef.current?.toggleFullscreen()}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "1px solid #DDA0DD",
            background: "#DDA0DD",
            color: "white",
            cursor: "pointer",
          }}
        >
          Toggle Fullscreen
        </button>
      </div>
      <Flipbook
        ref={flipbookRef}
        pages={generateSamplePages(8)}
        width={800}
        height={500}
        skin="dark"
      />
    </div>
  );
};

export const ProgrammaticControl: Story = {
  render: () => <ProgrammaticControlDemo />,
  args: {
    pages: generateSamplePages(8),
    width: 800,
    height: 500,
    skin: "dark",
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates programmatic control using the flipbook ref.
External buttons control navigation and fullscreen toggle.
        `,
      },
    },
  },
};

export const WithEventLogging: Story = {
  args: {
    pages: placeholderPages,
    width: 800,
    height: 500,
    skin: "dark",
    onPageFlip: fn(),
    onZoomChange: fn(),
    onFullscreenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: `
Open the browser console to see event callbacks firing.
Events logged: pageFlip, zoomChange, fullscreenChange.
        `,
      },
    },
  },
};

// ============================================================================
// Background Variations
// ============================================================================

export const CustomBackgrounds: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      <Flipbook
        pages={placeholderPages.slice(0, 4)}
        width={600}
        height={350}
        skin="dark"
        backgroundColor="rgb(20, 20, 40)"
      />
      <Flipbook
        pages={placeholderPages.slice(0, 4)}
        width={600}
        height={350}
        skin="light"
        backgroundColor="#e8e8e8"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different background colors for various use cases.",
      },
    },
  },
};

// ============================================================================
// PDF Support - Landscape and Portrait Pages (A4 Size)
// ============================================================================

// A4 Portrait PDF pages (595 x 842 points = 210mm x 297mm)
const portraitPdfPages: FlipbookPage[] = [
  {
    src: "https://picsum.photos/595/842?random=201",
    title: "Portrait Page 1",
    width: 595,
    height: 842,
    orientation: "portrait",
  },
  {
    src: "https://picsum.photos/595/842?random=202",
    title: "Portrait Page 2",
    width: 595,
    height: 842,
    orientation: "portrait",
  },
  {
    src: "https://picsum.photos/595/842?random=203",
    title: "Portrait Page 3",
    width: 595,
    height: 842,
    orientation: "portrait",
  },
  {
    src: "https://picsum.photos/595/842?random=204",
    title: "Portrait Page 4",
    width: 595,
    height: 842,
    orientation: "portrait",
  },
];

// A4 Landscape PDF pages (842 x 595 points = 297mm x 210mm)
const landscapePdfPages: FlipbookPage[] = [
  {
    src: "https://picsum.photos/842/595?random=301",
    title: "Landscape Page 1",
    width: 842,
    height: 595,
    orientation: "landscape",
  },
  {
    src: "https://picsum.photos/842/595?random=302",
    title: "Landscape Page 2",
    width: 842,
    height: 595,
    orientation: "landscape",
  },
  {
    src: "https://picsum.photos/842/595?random=303",
    title: "Landscape Page 3",
    width: 842,
    height: 595,
    orientation: "landscape",
  },
  {
    src: "https://picsum.photos/842/595?random=304",
    title: "Landscape Page 4",
    width: 842,
    height: 595,
    orientation: "landscape",
  },
];

export const PdfPortrait: Story = {
  args: {
    pages: portraitPdfPages,
    width: 595,
    height: 842,
    skin: "dark",
    singlePageMode: true,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
**Portrait PDF Pages (A4)**

Demonstrates rendering portrait-oriented A4 PDF pages (210mm x 297mm).

Each page specifies its own dimensions:
\`\`\`typescript
{
  src: "page.png",
  width: 595,   // A4 width in PDF points
  height: 842,  // A4 height in PDF points
  orientation: "portrait"
}
\`\`\`
        `,
      },
    },
  },
};

export const PdfLandscape: Story = {
  args: {
    pages: landscapePdfPages,
    width: 842,
    height: 595,
    skin: "dark",
    singlePageMode: true,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
**Landscape PDF Pages (A4)**

Demonstrates rendering landscape-oriented A4 PDF pages (297mm x 210mm).

Each page specifies its own dimensions:
\`\`\`typescript
{
  src: "page.png",
  width: 842,   // A4 landscape width in PDF points
  height: 595,  // A4 landscape height in PDF points
  orientation: "landscape"
}
\`\`\`
        `,
      },
    },
  },
};

export const PdfPortraitTwoPage: Story = {
  args: {
    pages: portraitPdfPages,
    width: 1190,
    height: 842,
    skin: "light",
    singlePageMode: false,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
**Portrait A4 PDF in Two-Page Spread Mode**

Portrait A4 PDF pages displayed as a two-page spread (like an open book).
This mode is ideal for documents designed for print viewing.
Container width is 2x A4 width (595 x 2 = 1190) to show both pages.
        `,
      },
    },
  },
};

export const PdfLandscapeTwoPage: Story = {
  args: {
    pages: landscapePdfPages,
    width: 1684,
    height: 595,
    skin: "light",
    singlePageMode: false,
  },
  decorators: [withContainer],
  parameters: {
    docs: {
      description: {
        story: `
**Landscape A4 PDF in Two-Page Spread Mode**

Landscape A4 PDF pages displayed as a two-page spread.
Useful for wide-format documents like presentations or blueprints.
Container width is 2x A4 landscape width (842 x 2 = 1684).
        `,
      },
    },
  },
};

// ============================================================================
// Actual PDF File Loading
// ============================================================================

// Helper function to convert PDF to FlipbookPages
async function loadPdfAsPages(
  pdfUrl: string,
  scale: number = 2,
): Promise<FlipbookPage[]> {
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  const pdf = await loadingTask.promise;
  const pages: FlipbookPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    // Get original dimensions
    const originalViewport = page.getViewport({ scale: 1 });

    // Create canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    await page.render({
      canvas: canvas,
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert to data URL
    const dataUrl = canvas.toDataURL("image/png");

    pages.push({
      src: dataUrl,
      title: `Page ${i}`,
      width: originalViewport.width,
      height: originalViewport.height,
      orientation:
        originalViewport.width > originalViewport.height
          ? "landscape"
          : "portrait",
    });

    // Clean up
    canvas.width = 0;
    canvas.height = 0;
  }

  return pages;
}

// Component that loads PDF and displays in Flipbook
// Optimized for memory usage: uses JPEG compression, lower scale, and progressive loading
/**
 * Calculate container dimensions based on PDF page size
 * Maintains aspect ratio while fitting within max constraints
 */
function calculateAutoSize(
  pageWidth: number,
  pageHeight: number,
  singlePageMode: boolean,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  // In two-page mode, the container shows 2 pages side by side (unless landscape)
  const isLandscape = pageWidth > pageHeight;
  const effectiveWidth =
    singlePageMode || isLandscape ? pageWidth : pageWidth * 2;
  const effectiveHeight = pageHeight;

  const aspectRatio = effectiveWidth / effectiveHeight;

  // Calculate size to fit within max constraints while preserving aspect ratio
  let containerWidth = maxWidth;
  let containerHeight = containerWidth / aspectRatio;

  // If height exceeds max, scale down based on height instead
  if (containerHeight > maxHeight) {
    containerHeight = maxHeight;
    containerWidth = containerHeight * aspectRatio;
  }

  return {
    width: Math.round(containerWidth),
    height: Math.round(containerHeight),
  };
}

const PdfFlipbookLoader: React.FC<{
  pdfUrl: string;
  singlePageMode?: boolean;
  skin?: "dark" | "light" | "gradient";
  width?: number;
  height?: number;
  autoSize?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  renderScale?: number;
  imageQuality?: number;
}> = ({
  pdfUrl,
  singlePageMode = true,
  skin = "dark",
  width,
  height,
  autoSize = true, // Enable auto-sizing by default
  maxWidth = 1200, // Maximum container width
  maxHeight = 900, // Maximum container height
  renderScale = 1.5, // Lower scale = less memory (was 2)
  imageQuality = 0.8, // JPEG quality (0-1)
}) => {
  const [pages, setPages] = useState<FlipbookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);
        setPages([]);

        // Clean up previous PDF document
        if (pdfRef.current) {
          pdfRef.current.destroy();
          pdfRef.current = null;
        }

        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          // Disable font loading for faster parsing
          disableFontFace: true,
          // Use less memory for image decoding
          isEvalSupported: false,
        });

        const pdf = await loadingTask.promise;
        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);

        const loadedPages: FlipbookPage[] = [];

        // Load pages in batches to reduce memory pressure
        const batchSize = 5;
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) {
            pdf.destroy();
            return;
          }

          const page = await pdf.getPage(i);
          const originalViewport = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: renderScale });

          // Create canvas
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", {
            alpha: false, // No transparency = less memory
            willReadFrequently: false,
          })!;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Fill white background (required for JPEG)
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);

          // Render page
          await page.render({
            canvas: canvas,
            canvasContext: context,
            viewport: viewport,
          }).promise;

          // Use JPEG instead of PNG (much smaller file size)
          const dataUrl = canvas.toDataURL("image/jpeg", imageQuality);

          loadedPages.push({
            src: dataUrl,
            title: `Page ${i}`,
            width: originalViewport.width,
            height: originalViewport.height,
            orientation:
              originalViewport.width > originalViewport.height
                ? "landscape"
                : "portrait",
          });

          // Clean up canvas immediately
          canvas.width = 0;
          canvas.height = 0;

          // Clean up page to free memory
          page.cleanup();

          setProgress(Math.round((i / pdf.numPages) * 100));

          // Update pages progressively every batch
          if (i % batchSize === 0 || i === pdf.numPages) {
            if (!cancelled) {
              setPages([...loadedPages]);
            }
          }

          // Small delay to allow garbage collection
          if (i % batchSize === 0 && i < pdf.numPages) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      // Clean up PDF document on unmount
      if (pdfRef.current) {
        pdfRef.current.destroy();
        pdfRef.current = null;
      }
    };
  }, [pdfUrl, renderScale, imageQuality]);

  // Show flipbook even while loading remaining pages (progressive)
  if (loading && pages.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 800,
          height: 600,
          backgroundColor: "#1a1a1a",
          color: "#fff",
          borderRadius: 8,
        }}
      >
        <div style={{ marginBottom: 16, fontSize: 18 }}>Loading PDF...</div>
        <div
          style={{
            width: 200,
            height: 8,
            backgroundColor: "#333",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#4CAF50",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#888" }}>
          {progress}%
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 800,
          height: 600,
          backgroundColor: "#1a1a1a",
          color: "#ff6b6b",
          borderRadius: 8,
        }}
      >
        <div style={{ marginBottom: 8, fontSize: 18 }}>Error loading PDF</div>
        <div style={{ fontSize: 14, color: "#888" }}>{error}</div>
      </div>
    );
  }

  if (pages.length === 0 && !loading) {
    return <div>No pages found</div>;
  }

  // Show loading indicator if still loading
  const isStillLoading = loading && pages.length > 0;

  // Determine container size based on PDF page dimensions
  const firstPage = pages[0];

  // Calculate container dimensions
  let containerWidth: number;
  let containerHeight: number;

  if (width !== undefined && height !== undefined) {
    // If both width and height are explicitly provided, use them
    containerWidth = width;
    containerHeight = height;
  } else if (autoSize && firstPage.width && firstPage.height) {
    // Auto-size based on actual PDF page dimensions
    const autoSized = calculateAutoSize(
      firstPage.width,
      firstPage.height,
      singlePageMode,
      maxWidth,
      maxHeight,
    );
    containerWidth = width ?? autoSized.width;
    containerHeight = height ?? autoSized.height;
  } else {
    // Fallback to orientation-based defaults
    const isLandscape = firstPage.orientation === "landscape";
    containerWidth = width ?? (isLandscape ? 900 : 600);
    containerHeight = height ?? (isLandscape ? 600 : 800);
  }

  return (
    <div style={{ position: "relative" }}>
      <Flipbook
        pages={pages}
        width={containerWidth}
        height={containerHeight}
        skin={skin}
        singlePageMode={singlePageMode}
      />
      {isStillLoading && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          Loading pages... {progress}% ({pages.length}/{totalPages})
        </div>
      )}
    </div>
  );
};

// Wrapper component for Storybook args
const PdfFlipbookStory: React.FC<{
  pdfUrl: string;
  singlePageMode: boolean;
  skin: "dark" | "light" | "gradient";
  autoSize?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  containerWidth?: number;
  containerHeight?: number;
  renderScale: number;
  imageQuality: number;
}> = ({
  pdfUrl,
  singlePageMode,
  skin,
  autoSize = true,
  maxWidth = 1200,
  maxHeight = 900,
  containerWidth,
  containerHeight,
  renderScale,
  imageQuality,
}) => {
  return (
    <PdfFlipbookLoader
      pdfUrl={pdfUrl}
      singlePageMode={singlePageMode}
      skin={skin}
      autoSize={autoSize}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      width={containerWidth}
      height={containerHeight}
      renderScale={renderScale}
      imageQuality={imageQuality}
    />
  );
};

// Define args type for PDF stories
type PdfStoryArgs = {
  pdfUrl: string;
  singlePageMode: boolean;
  skin: "dark" | "light" | "gradient";
  autoSize?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  containerWidth?: number;
  containerHeight?: number;
  renderScale: number;
  imageQuality: number;
};

export const PdfLandscapeFile = {
  args: {
    pdfUrl: "http://127.0.0.1:8081/lanscape.pdf",
    singlePageMode: true,
    skin: "dark",
    autoSize: true,
    maxWidth: 1200,
    maxHeight: 900,
    renderScale: 1.5,
    imageQuality: 0.8,
  } as PdfStoryArgs,
  argTypes: {
    pdfUrl: {
      description: "URL of the PDF file to load",
      control: { type: "text" },
    },
    singlePageMode: {
      description: "Display one page at a time",
      control: { type: "boolean" },
    },
    skin: {
      description: "Visual theme",
      control: { type: "select" },
      options: ["dark", "light", "gradient"],
    },
    autoSize: {
      description: "Automatically size container based on PDF page dimensions",
      control: { type: "boolean" },
    },
    maxWidth: {
      description: "Maximum container width when auto-sizing (pixels)",
      control: { type: "range", min: 400, max: 1600, step: 50 },
    },
    maxHeight: {
      description: "Maximum container height when auto-sizing (pixels)",
      control: { type: "range", min: 300, max: 1200, step: 50 },
    },
    renderScale: {
      description: "PDF rendering scale (higher = sharper but more memory)",
      control: { type: "range", min: 0.5, max: 3, step: 0.25 },
    },
    imageQuality: {
      description: "JPEG quality for page images (0-1)",
      control: { type: "range", min: 0.3, max: 1, step: 0.1 },
    },
  },
  render: (args: PdfStoryArgs) => <PdfFlipbookStory {...args} />,
  parameters: {
    docs: {
      description: {
        story: `
**Loading Landscape PDF Files**

This example loads a landscape-oriented PDF file. You can change the PDF URL in the controls panel.

**Default URLs for testing:**
- Landscape: \`http://127.0.0.1:8081/lanscape.pdf\`
- Portrait: \`http://127.0.0.1:8081/portrait.pdf\`

Try changing the URL to test different PDF files!
        `,
      },
    },
  },
};

export const PdfPortraitFile = {
  args: {
    pdfUrl: "http://127.0.0.1:8081/portrait.pdf",
    singlePageMode: true,
    skin: "dark",
    autoSize: true,
    maxWidth: 1200,
    maxHeight: 900,
    renderScale: 1.5,
    imageQuality: 0.8,
  } as PdfStoryArgs,
  argTypes: {
    pdfUrl: {
      description: "URL of the PDF file to load",
      control: { type: "text" },
    },
    singlePageMode: {
      description: "Display one page at a time",
      control: { type: "boolean" },
    },
    skin: {
      description: "Visual theme",
      control: { type: "select" },
      options: ["dark", "light", "gradient"],
    },
    autoSize: {
      description: "Automatically size container based on PDF page dimensions",
      control: { type: "boolean" },
    },
    maxWidth: {
      description: "Maximum container width when auto-sizing (pixels)",
      control: { type: "range", min: 400, max: 1600, step: 50 },
    },
    maxHeight: {
      description: "Maximum container height when auto-sizing (pixels)",
      control: { type: "range", min: 300, max: 1200, step: 50 },
    },
    renderScale: {
      description: "PDF rendering scale (higher = sharper but more memory)",
      control: { type: "range", min: 0.5, max: 3, step: 0.25 },
    },
    imageQuality: {
      description: "JPEG quality for page images (0-1)",
      control: { type: "range", min: 0.3, max: 1, step: 0.1 },
    },
  },
  render: (args: PdfStoryArgs) => <PdfFlipbookStory {...args} />,
  parameters: {
    docs: {
      description: {
        story: `
**Loading Portrait PDF Files**

This example loads a portrait-oriented PDF file. You can change the PDF URL in the controls panel.
        `,
      },
    },
  },
};

export const PdfTwoPageSpread = {
  args: {
    pdfUrl: "http://127.0.0.1:8081/portrait.pdf",
    singlePageMode: false,
    skin: "dark",
    autoSize: true,
    maxWidth: 1200,
    maxHeight: 900,
    renderScale: 1.5,
    imageQuality: 0.8,
  } as PdfStoryArgs,
  argTypes: {
    pdfUrl: {
      description: "URL of the PDF file to load",
      control: { type: "text" },
    },
    singlePageMode: {
      description: "Display one page at a time",
      control: { type: "boolean" },
    },
    skin: {
      description: "Visual theme",
      control: { type: "select" },
      options: ["dark", "light", "gradient"],
    },
    autoSize: {
      description: "Automatically size container based on PDF page dimensions",
      control: { type: "boolean" },
    },
    maxWidth: {
      description: "Maximum container width when auto-sizing (pixels)",
      control: { type: "range", min: 400, max: 1600, step: 50 },
    },
    maxHeight: {
      description: "Maximum container height when auto-sizing (pixels)",
      control: { type: "range", min: 300, max: 1200, step: 50 },
    },
    renderScale: {
      description: "PDF rendering scale (higher = sharper but more memory)",
      control: { type: "range", min: 0.5, max: 3, step: 0.25 },
    },
    imageQuality: {
      description: "JPEG quality for page images (0-1)",
      control: { type: "range", min: 0.3, max: 1, step: 0.1 },
    },
  },
  render: (args: PdfStoryArgs) => <PdfFlipbookStory {...args} />,
  parameters: {
    docs: {
      description: {
        story: `
**PDF in Two-Page Spread Mode**

PDF displayed as a two-page book spread.
This is ideal for documents designed to be viewed as an open book.

You can change the PDF URL to test with different files:
- Portrait: \`http://127.0.0.1:8081/portrait.pdf\`
- Landscape: \`http://127.0.0.1:8081/lanscape.pdf\`
        `,
      },
    },
  },
};
