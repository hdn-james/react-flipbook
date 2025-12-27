import React, { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import Flipbook from "../components/Flipbook";
import type { FlipbookProps, FlipbookPage, FlipbookInstance } from "../types";

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
    onPageFlip: {
      description: "Callback when page changes",
      action: "pageFlip",
    },
    onZoomChange: {
      description: "Callback when zoom level changes",
      action: "zoomChange",
    },
    onFullscreenChange: {
      description: "Callback when fullscreen mode changes",
      action: "fullscreenChange",
    },
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

export const Default: Story = {
  args: {
    pages: placeholderPages,
    width: "834",
    height: "1112",
    skin: "dark",
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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
    onReady: fn(),
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

export const ProgrammaticControl: Story = {
  render: () => {
    const flipbookRef = useRef<FlipbookInstance>(null);

    return (
      <div>
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <button
            onClick={() => flipbookRef.current?.firstPage()}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #4ECDC4",
              background: "#4ECDC4",
              color: "white",
              cursor: "pointer",
            }}
          >
            First Page
          </button>
          <button
            onClick={() => flipbookRef.current?.prevPage()}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #45B7D1",
              background: "#45B7D1",
              color: "white",
              cursor: "pointer",
            }}
          >
            Previous
          </button>
          <button
            onClick={() => flipbookRef.current?.nextPage()}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #45B7D1",
              background: "#45B7D1",
              color: "white",
              cursor: "pointer",
            }}
          >
            Next
          </button>
          <button
            onClick={() => flipbookRef.current?.lastPage()}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #4ECDC4",
              background: "#4ECDC4",
              color: "white",
              cursor: "pointer",
            }}
          >
            Last Page
          </button>
          <button
            onClick={() => flipbookRef.current?.goToPage(3)}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #96CEB4",
              background: "#96CEB4",
              color: "white",
              cursor: "pointer",
            }}
          >
            Go to Page 3
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
  },
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
