# React 3D Flipbook

A modern, feature-rich React library for creating beautiful, interactive 3D flipbooks with realistic page-turning effects powered by WebGL and Three.js.

---

## Features

- 🎮 **WebGL 3D Rendering**: Realistic page-flip animations with Three.js
- 📄 **PDF Support**: Direct PDF rendering with automatic page sizing via PDF.js
- 📐 **Dynamic Page Sizing**: Automatically adapts to PDF page dimensions
- 💡 **Dynamic Lighting**: Configurable lights and shadows for depth
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🔍 **Zoom Controls**: Pinch-to-zoom, mouse wheel, and button controls
- 🔖 **Bookmarks**: Save, manage, and persist bookmarked pages
- 📑 **Table of Contents**: Hierarchical, searchable TOC navigation
- 🖼️ **Thumbnails Panel**: Visual page thumbnail navigation
- 🔎 **Full-Text Search**: Search across all pages with highlighted results
- ▶️ **Autoplay**: Automatic page flipping with customizable intervals
- 🌙 **Themes**: Light, dark, and gradient themes with full customization
- ♿ **Accessible**: ARIA labels, screen reader support, and keyboard navigation
- 📦 **TypeScript**: Complete TypeScript definitions for type safety

---

## Installation

```sh
npm install react-3d-flipbook
# or
yarn add react-3d-flipbook
```

### Required Peer Dependencies

```sh
npm install three @types/three
```

### Optional (for PDF support)

```sh
npm install pdfjs-dist
```

---

## Quick Start

### Basic Usage with Images

```tsx
import { Flipbook } from 'react-3d-flipbook';
import 'react-3d-flipbook/dist/styles.css';

const pages = [
  { src: '/images/page1.jpg', title: 'Cover' },
  { src: '/images/page2.jpg', title: 'Introduction' },
  // ...more pages
];

function App() {
  return (
    <Flipbook
      pages={pages}
      width={800}
      height={600}
      onPageFlip={e => console.log('Flipped to page', e.page)}
    />
  );
}
```

### PDF Support

```tsx
import { useState, useEffect } from 'react';
import { Flipbook, pdfToFlipbookPages, setPdfWorkerSrc } from 'react-3d-flipbook';
import 'react-3d-flipbook/dist/styles.css';

// Set up PDF.js worker (required once)
setPdfWorkerSrc('https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.mjs');

function PdfFlipbook() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPdf() {
      const loadedPages = await pdfToFlipbookPages('/path/to/document.pdf', {
        scale: 1.5,
        format: 'jpeg',
        quality: 0.8,
        onProgress: (current, total) => console.log(`Loading ${current}/${total}`)
      });
      setPages(loadedPages);
      setLoading(false);
    }
    loadPdf();
  }, []);

  if (loading) return <div>Loading PDF...</div>;

  return (
    <Flipbook
      pages={pages}
      width={800}
      height={600}
      singlePageMode={false}
    />
  );
}
```

### PDF with Auto-Sizing

The flipbook automatically sizes pages based on the PDF's actual dimensions:

```tsx
import { 
  Flipbook, 
  pdfToFlipbookPages, 
  calculateFlipbookSizeFromPages,
  setPdfWorkerSrc 
} from 'react-3d-flipbook';

setPdfWorkerSrc('https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.mjs');

function AutoSizedPdfFlipbook() {
  const [pages, setPages] = useState([]);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    async function loadPdf() {
      const loadedPages = await pdfToFlipbookPages('/document.pdf');
      setPages(loadedPages);

      // Calculate optimal container size based on PDF page dimensions
      const calculatedSize = calculateFlipbookSizeFromPages(loadedPages, {
        singlePageMode: false,
        maxWidth: 1200,
        maxHeight: 800,
      });

      if (calculatedSize) {
        setSize(calculatedSize);
      }
    }
    loadPdf();
  }, []);

  return (
    <Flipbook
      pages={pages}
      width={size.width}
      height={size.height}
    />
  );
}
```

---

## PDF Utilities

### `setPdfWorkerSrc(workerSrc: string)`

Set the PDF.js worker source URL. Must be called before using any PDF functions.

```tsx
import { setPdfWorkerSrc } from 'react-3d-flipbook';

// Using CDN
setPdfWorkerSrc('https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.mjs');

// Using local file (Vite)
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
setPdfWorkerSrc(workerSrc);
```

### `pdfToFlipbookPages(source, options)`

Convert a PDF to flipbook pages.

```tsx
import { pdfToFlipbookPages } from 'react-3d-flipbook';

const pages = await pdfToFlipbookPages('/document.pdf', {
  scale: 2,              // Render scale (default: 2)
  format: 'jpeg',        // 'png' or 'jpeg' (default: 'png')
  quality: 0.92,         // JPEG quality 0-1 (default: 0.92)
  pageNumbers: [1, 2, 5], // Specific pages to render (optional)
  onProgress: (current, total) => console.log(`${current}/${total}`)
});
```

**Returns:** `Promise<FlipbookPage[]>` - Array of pages with `src`, `width`, `height`, and `orientation`.

### `pdfToFlipbookPagesLazy(source, options)`

Lazy/streaming PDF page loading for memory efficiency.

```tsx
import { pdfToFlipbookPagesLazy } from 'react-3d-flipbook';

const pages = [];
for await (const page of pdfToFlipbookPagesLazy('/large-document.pdf')) {
  pages.push(page);
  // Update UI progressively
  setPages([...pages]);
}
```

### `getPdfInfo(source)`

Get PDF document info without rendering pages.

```tsx
import { getPdfInfo } from 'react-3d-flipbook';

const info = await getPdfInfo('/document.pdf');
console.log(info.numPages); // Total pages
console.log(info.pageInfos); // Array of { pageNumber, width, height, orientation }
```

### `calculateFlipbookSize(pageWidth, pageHeight, options)`

Calculate optimal flipbook container size based on page dimensions.

```tsx
import { calculateFlipbookSize } from 'react-3d-flipbook';

const size = calculateFlipbookSize(595, 842, {  // A4 dimensions
  singlePageMode: false,
  maxWidth: 1200,
  maxHeight: 800,
});

console.log(size.width);      // Calculated container width
console.log(size.height);     // Calculated container height
console.log(size.aspectRatio); // Container aspect ratio
console.log(size.isLandscape); // Whether page is landscape
```

### `calculateFlipbookSizeFromPages(pages, options)`

Calculate optimal size from a FlipbookPage array using the first page's dimensions.

```tsx
import { calculateFlipbookSizeFromPages } from 'react-3d-flipbook';

const pages = await pdfToFlipbookPages('/document.pdf');
const size = calculateFlipbookSizeFromPages(pages, {
  singlePageMode: true,
  maxWidth: 1000,
  maxHeight: 700,
});

if (size) {
  console.log(`Container: ${size.width}x${size.height}`);
}
```

---

## API Reference

### `<Flipbook />` Props

| Prop                   | Type                                 | Default                | Description                                  |
|------------------------|--------------------------------------|------------------------|----------------------------------------------|
| `pages`                | `FlipbookPage[]`                     | **Required**           | Array of page objects                        |
| `width`                | `string \| number`                   | `'100%'`               | Container width                              |
| `height`               | `string \| number`                   | `'600px'`              | Container height                             |
| `skin`                 | `'dark' \| 'light' \| 'gradient'`    | `'dark'`               | Theme/skin                                   |
| `backgroundColor`      | `string`                             | `'rgb(81,85,88)'`      | Background color                             |
| `startPage`            | `number`                             | `1`                    | Initial page                                 |
| `rightToLeft`          | `boolean`                            | `false`                | RTL reading direction                        |
| `singlePageMode`       | `boolean`                            | `false`                | Show one page at a time                      |
| `sideNavigationButtons`| `boolean`                            | `true`                 | Show side nav buttons                        |
| `hideMenu`             | `boolean`                            | `false`                | Hide the toolbar                             |
| `zoomMin`              | `number`                             | `1`                    | Minimum zoom level                           |
| `zoomMax2`             | `number`                             | `3`                    | Maximum zoom level                           |
| `zoomStep`             | `number`                             | `0.5`                  | Zoom increment                               |
| `touchSwipeEnabled`    | `boolean`                            | `true`                 | Enable touch swipe                           |
| `tableOfContent`       | `TocItem[]`                          | `undefined`            | Table of contents data                       |

#### WebGL 3D Props

| Prop              | Type      | Default | Description                       |
|-------------------|-----------|---------|-----------------------------------|
| `pageFlipDuration`| `number`  | `600`   | Flip animation duration (ms)      |
| `pageHardness`    | `number`  | `0.5`   | Page flexibility (0-1)            |
| `coverHardness`   | `number`  | `0.9`   | Cover rigidity (0-1)              |
| `shadows`         | `boolean` | `true`  | Enable shadows                    |
| `shadowOpacity`   | `number`  | `0.3`   | Shadow intensity (0-1)            |
| `lights`          | `boolean` | `true`  | Enable dynamic lighting           |
| `lightIntensity`  | `number`  | `1`     | Light brightness                  |
| `pageRoughness`   | `number`  | `0.8`   | Material roughness (0-1)          |
| `pageMetalness`   | `number`  | `0.1`   | Material metalness (0-1)          |
| `antialias`       | `boolean` | `true`  | Enable antialiasing               |

#### Camera & Display Props

| Prop              | Type      | Default | Description                                              |
|-------------------|-----------|---------|----------------------------------------------------------|
| `cameraZoom`      | `number`  | `1.35`  | Camera zoom/margin factor - higher moves camera back     |
| `pageScale`       | `number`  | `6`     | Base page scale in world units - affects page size       |
| `cameraPositionY` | `number`  | `0`     | Camera vertical position offset                          |
| `cameraLookAtY`   | `number`  | `0`     | Camera look-at Y position                                |
| `cameraFov`       | `number`  | `45`    | Field of view in degrees                                 |

**Usage Example:**

```tsx
// Zoom out to show more padding around the book
<Flipbook
  pages={pages}
  width={800}
  height={600}
  cameraZoom={1.5}      // Further back (default: 1.35)
/>

// Zoom in to fill more of the container
<Flipbook
  pages={pages}
  width={800}
  height={600}
  cameraZoom={1.1}      // Closer (less padding)
/>

// Adjust camera angle for a different perspective
<Flipbook
  pages={pages}
  width={800}
  height={600}
  cameraPositionY={-1}  // Camera slightly below center
  cameraLookAtY={0.5}   // Looking slightly upward
/>

// Make pages larger in the scene
<Flipbook
  pages={pages}
  width={800}
  height={600}
  pageScale={8}         // Larger pages (default: 6)
/>
```

#### Event Callbacks

| Prop                   | Type                                    | Description                                 |
|------------------------|-----------------------------------------|---------------------------------------------|
| `onPageFlip`           | `(e: { page, direction }) => void`      | Called when page changes                    |
| `onPageFlipStart`      | `(e: { page, direction }) => void`      | Called when flip starts                     |
| `onPageFlipEnd`        | `(e: { page }) => void`                 | Called when flip ends                       |
| `onZoomChange`         | `(e: { zoom }) => void`                 | Called when zoom changes                    |
| `onReady`              | `() => void`                            | Called when flipbook is ready               |
| `onFullscreenChange`   | `(e: { isFullscreen }) => void`         | Called on fullscreen toggle                 |
| `onLoadProgress`       | `(e: { progress }) => void`             | Called during loading                       |

### `FlipbookPage` Type

```ts
interface FlipbookPage {
  src: string;                          // Image source URL (required)
  thumb?: string;                       // Thumbnail image URL
  title?: string;                       // Page title for TOC
  htmlContent?: string;                 // HTML content overlay
  empty?: boolean;                      // Whether this is a blank page
  width?: number;                       // Page width in pixels (for PDF pages)
  height?: number;                      // Page height in pixels (for PDF pages)
  orientation?: 'portrait' | 'landscape'; // Page orientation
}
```

---

## Display Modes

### Two-Page Spread Mode (Default)

Displays two pages side by side like an open book. Pages flip from right to left with a realistic 3D curl animation.

```tsx
<Flipbook
  pages={pages}
  width={1200}
  height={800}
  singlePageMode={false}
/>
```

### Single-Page Mode

Displays one page at a time with a fly-out animation when navigating.

```tsx
<Flipbook
  pages={pages}
  width={600}
  height={800}
  singlePageMode={true}
/>
```

---

## Dynamic Page Sizing

The flipbook automatically handles PDFs with varying page sizes:

- **Consistent sizing**: All pages are scaled to match the first page's aspect ratio for a uniform appearance
- **Automatic camera adjustment**: The camera distance adjusts to frame the content properly
- **Portrait & Landscape support**: Works with both portrait and landscape PDFs

### How It Works

1. When loading a PDF, each page's `width` and `height` are stored in the `FlipbookPage` object
2. The flipbook uses the first page's dimensions as the reference for all pages
3. The camera automatically calculates the optimal distance to display the content with appropriate margins
4. In two-page mode, the spread width is doubled for proper framing

---

## Panels

### Thumbnails Panel

```tsx
import { ThumbnailsPanel } from 'react-3d-flipbook';

<ThumbnailsPanel
  pages={pages}
  currentPage={currentPage}
  isOpen={showThumbnails}
  position="left"
  thumbnailSize={120}
  showPageNumbers={true}
  onPageSelect={goToPage}
  onClose={() => setShowThumbnails(false)}
/>
```

### Table of Contents

```tsx
import { TableOfContents, TocItem } from 'react-3d-flipbook';

const tocItems: TocItem[] = [
  {
    title: 'Chapter 1',
    page: 1,
    children: [
      { title: 'Section 1.1', page: 2 },
      { title: 'Section 1.2', page: 5 },
    ],
  },
  { title: 'Chapter 2', page: 10 },
];

<TableOfContents
  items={tocItems}
  currentPage={currentPage}
  isOpen={showToc}
  position="left"
  closeOnClick={true}
  onPageSelect={goToPage}
  onClose={() => setShowToc(false)}
/>
```

### Search Panel

```tsx
import { SearchPanel } from 'react-3d-flipbook';

<SearchPanel
  pages={pages}
  pageTextContent={textContentMap}
  currentPage={currentPage}
  isOpen={showSearch}
  position="left"
  minQueryLength={2}
  maxResults={100}
  highlightColor="#ffeb3b"
  onPageSelect={goToPage}
  onClose={() => setShowSearch(false)}
/>
```

### Bookmarks Panel

```tsx
import { BookmarksPanel } from 'react-3d-flipbook';

<BookmarksPanel
  pages={pages}
  bookmarks={bookmarkedPages}
  currentPage={currentPage}
  isOpen={showBookmarks}
  position="left"
  showThumbnails={true}
  onPageSelect={goToPage}
  onRemoveBookmark={removeBookmark}
  onClose={() => setShowBookmarks(false)}
/>
```

---

## Hooks

### useFlipbook

```tsx
import { useFlipbook } from 'react-3d-flipbook';

function CustomFlipbook({ pages }) {
  const {
    currentPage,
    numPages,
    zoom,
    isFullscreen,
    isLoading,
    canGoNext,
    canGoPrev,
    bookmarkedPages,
    containerRef,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    goToPage,
    zoomIn,
    zoomOut,
    zoomTo,
    toggleFullscreen,
    toggleBookmark,
    isPageBookmarked,
  } = useFlipbook({
    pages,
    initialPage: 1,
    zoomMin: 1,
    zoomMax2: 3,
    onPageChange: (page) => console.log('Page:', page),
  });

  return (
    <div ref={containerRef}>
      {/* Your custom UI */}
    </div>
  );
}
```

### useAutoplay

```tsx
import { useAutoplay } from 'react-3d-flipbook';

function AutoplayFlipbook({ pages }) {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    isPlaying,
    isPaused,
    interval,
    progress,
    start,
    stop,
    pause,
    resume,
    toggle,
    setInterval,
    skipNext,
    reset,
  } = useAutoplay({
    numPages: pages.length,
    currentPage,
    interval: 3000,
    loop: true,
    autoStart: false,
    pageIncrement: 2,
    onPageChange: (page) => setCurrentPage(page),
    onComplete: () => console.log('Autoplay completed'),
  });

  return (
    <div>
      <button onClick={toggle}>
        {isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play'}
      </button>
      <progress value={progress} max={1} />
    </div>
  );
}
```

### usePdfLoader

```tsx
import { usePdfLoader } from 'react-3d-flipbook';

function PdfViewer() {
  const {
    isAvailable,
    isLoading,
    progress,
    error,
    numPages,
    pages,
    textContent,
    loadPdf,
    renderPage,
    getPageText,
    destroy,
  } = usePdfLoader({
    source: '/path/to/document.pdf',
    workerSrc: '/pdf.worker.min.js',
    scale: 1.5,
    extractText: true,
    onLoadProgress: (p) => console.log(`Loading: ${p * 100}%`),
    onLoadComplete: (n) => console.log(`Loaded ${n} pages`),
  });

  if (isLoading) {
    return <div>Loading... {Math.round(progress * 100)}%</div>;
  }

  return <Flipbook pages={pages} />;
}
```

### useSwipeGesture

```tsx
import { useSwipeGesture } from 'react-3d-flipbook';

function SwipeableComponent() {
  const ref = useRef<HTMLDivElement>(null);

  useSwipeGesture(
    ref,
    () => console.log('Swiped left'),
    () => console.log('Swiped right'),
    { threshold: 50, enabled: true }
  );

  return <div ref={ref}>Swipe me!</div>;
}
```

### useWheelZoom

```tsx
import { useWheelZoom } from 'react-3d-flipbook';

function ZoomableComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useWheelZoom(
    ref,
    (delta) => setZoom((z) => Math.max(0.5, Math.min(3, z + delta))),
    { enabled: true, sensitivity: 0.001 }
  );

  return <div ref={ref} style={{ transform: `scale(${zoom})` }}>Zoom me!</div>;
}
```

---

## Instance Methods

Access via `ref`:

```tsx
const flipbookRef = useRef<FlipbookInstance>(null);

// Navigation
flipbookRef.current?.nextPage();
flipbookRef.current?.prevPage();
flipbookRef.current?.firstPage();
flipbookRef.current?.lastPage();
flipbookRef.current?.goToPage(5);

// Zoom
flipbookRef.current?.zoomIn();
flipbookRef.current?.zoomOut();
flipbookRef.current?.zoomTo(1.5);

// State
flipbookRef.current?.getCurrentPage();
flipbookRef.current?.getNumPages();
flipbookRef.current?.getZoom();
flipbookRef.current?.isFullscreen();

// Fullscreen
flipbookRef.current?.toggleFullscreen();

// Bookmarks
flipbookRef.current?.bookmarkPage(5);
flipbookRef.current?.removeBookmark(5);
flipbookRef.current?.getBookmarkedPages();

// Cleanup
flipbookRef.current?.destroy();
```

---

## Styling & Theming

### Built-in Themes

```tsx
<Flipbook pages={pages} skin="dark" />    // Default dark theme
<Flipbook pages={pages} skin="light" />   // Light theme
<Flipbook pages={pages} skin="gradient" /> // Gradient theme
```

### CSS Custom Properties

```css
.react-flipbook {
  --flipbook-primary: #4a9eff;
  --flipbook-background: #515558;
  --flipbook-text: #ffffff;
  --flipbook-btn-bg: rgba(255, 255, 255, 0.1);
  --flipbook-btn-hover: rgba(255, 255, 255, 0.2);
  --flipbook-sidebar-bg: #2a2a2a;
  --flipbook-sidebar-width: 280px;
}
```

### CSS Classes

| Class | Description |
|-------|-------------|
| `.react-flipbook` | Main container |
| `.react-flipbook-container` | Book container |
| `.react-flipbook-book` | Book element |
| `.react-flipbook-pages` | Pages wrapper |
| `.react-flipbook-page` | Individual page |
| `.react-flipbook-menu` | Bottom toolbar |
| `.react-flipbook-btn` | Toolbar buttons |
| `.react-flipbook-nav-btn` | Side navigation buttons |
| `.react-flipbook-sidebar` | Side panels |
| `.react-flipbook-thumbnails` | Thumbnails grid |
| `.react-flipbook-toc` | Table of contents |
| `.react-flipbook-search` | Search panel |
| `.react-flipbook-bookmarks` | Bookmarks panel |
| `.react-flipbook-theme-dark` | Dark theme |
| `.react-flipbook-theme-light` | Light theme |
| `.react-flipbook-theme-gradient` | Gradient theme |

---

## Accessibility

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `ArrowLeft` | Previous page |
| `→` / `ArrowRight` | Next page |
| `Home` | First page |
| `End` | Last page |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom |
| `F` | Toggle fullscreen |
| `Escape` | Exit fullscreen |

### ARIA Support

- Full keyboard navigation
- ARIA labels and roles on all interactive elements
- Screen reader announcements for page changes

---

## Utility Functions

```tsx
import {
  clamp,
  lerp,
  debounce,
  throttle,
  isMobile,
  isTouchDevice,
  isWebGLSupported,
  preloadImage,
  preloadImages,
  generateId,
  requestFullscreen,
  exitFullscreen,
  isFullscreen,
  storage,
  easing,
} from 'react-3d-flipbook';

// Clamp value between min and max
const clamped = clamp(value, 0, 100);

// Linear interpolation
const interpolated = lerp(start, end, 0.5);

// Debounce a function
const debouncedFn = debounce(fn, 300);

// Check device capabilities
if (isMobile()) { /* mobile device */ }
if (isTouchDevice()) { /* touch device */ }
if (isWebGLSupported()) { /* WebGL available */ }

// Preload images
await preloadImages(urls, (loaded, total) => {
  console.log(`Loaded ${loaded}/${total}`);
});

// Local storage helpers
storage.set('key', value);
const value = storage.get('key', defaultValue);
storage.remove('key');

// Easing functions for animations
const easedValue = easing.easeInOutCubic(t);
const bounced = easing.easeOutQuart(t);
```

---

## Browser Support

| Browser | Version | WebGL Support |
|---------|---------|---------------|
| Chrome | 80+ | ✅ |
| Firefox | 75+ | ✅ |
| Safari | 13+ | ✅ |
| Edge | 80+ | ✅ |
| iOS Safari | 13+ | ✅ |
| Android Chrome | 80+ | ✅ |

**Note:** WebGL is required for the 3D page-flip animations. The component displays a fallback message if WebGL is not available.

---

## Performance Tips

### For Large PDFs

```tsx
// Use lazy loading for large documents
const pages = [];
for await (const page of pdfToFlipbookPagesLazy(pdfUrl, {
  scale: 1.5,        // Lower scale = less memory
  format: 'jpeg',    // JPEG is smaller than PNG
  quality: 0.8,      // Lower quality = smaller files
})) {
  pages.push(page);
  setPages([...pages]); // Progressive loading
}
```

### Reduce Memory Usage

- Use `format: 'jpeg'` instead of `'png'`
- Lower `scale` value (1-1.5 instead of 2)
- Lower `quality` value (0.7-0.8)
- Use lazy loading with `pdfToFlipbookPagesLazy`

### Improve Rendering Performance

- Disable shadows: `shadows={false}`
- Disable antialiasing: `antialias={false}`
- Reduce page segments: `pageSegmentsW={20}`

---

## TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  // Page types
  FlipbookPage,
  TocItem,
  
  // Component props
  FlipbookProps,
  FlipbookOptions,
  WebGLPageFlipProps,
  
  // Instance types
  FlipbookInstance,
  WebGLPageFlipInstance,
  
  // Event types
  FlipbookEventMap,
  
  // Configuration types
  SkinType,
  ButtonConfig,
  DownloadButtonConfig,
  CurrentPageConfig,
  
  // Hook types
  UseAutoplayOptions,
  UseAutoplayReturn,
  UsePdfLoaderOptions,
  UsePdfLoaderReturn,
  
  // PDF utilities
  PdfToImagesOptions,
  PdfPageInfo,
  FlipbookSizeOptions,
  FlipbookSize,
  
  // Panel types
  SearchResult,
  Bookmark,
} from 'react-3d-flipbook';
```

---

## Troubleshooting

### WebGL Issues

**Problem:** WebGL not working or blank screen  
**Solution:** Ensure `three` is installed and browser supports WebGL. Check browser console for errors.

### PDF Issues

**Problem:** PDF not loading  
**Solution:** 
1. Ensure `pdfjs-dist` is installed
2. Call `setPdfWorkerSrc()` before loading PDFs
3. Check CORS settings if loading from external URLs

**Problem:** PDF pages are blurry  
**Solution:** Increase `scale` option (e.g., `scale: 2` or `scale: 3`)

### Performance Issues

**Problem:** Slow loading or high memory usage  
**Solution:**
1. Use `pdfToFlipbookPagesLazy` for progressive loading
2. Lower `scale` and `quality` options
3. Use JPEG format instead of PNG
4. Disable shadows and reduce page segments

### Animation Issues

**Problem:** Page flip animation is jerky  
**Solution:**
1. Reduce `pageSegmentsW` value
2. Disable antialiasing if not needed
3. Ensure consistent page aspect ratios

**Problem:** Pages don't align in two-page mode  
**Solution:** Ensure all pages have consistent dimensions or let the library auto-size based on first page.

---

## Contributing

Contributions are welcome! Please fork, branch, and submit a PR.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

---

## License

MIT License

---

## Changelog

### v1.1.0
- Added automatic page sizing based on PDF dimensions
- Added `calculateFlipbookSize` and `calculateFlipbookSizeFromPages` utilities
- Improved camera positioning for better framing of content
- Fixed two-page spread alignment issues
- Improved support for landscape PDFs

### v1.0.0
- Initial release
- WebGL 3D page flip animations
- PDF support via PDF.js
- Single-page and two-page spread modes
- Thumbnails, TOC, Search, and Bookmarks panels
- Multiple themes and full customization