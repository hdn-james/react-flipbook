# React 3D Flipbook

A modern, feature-rich React library for creating beautiful, interactive 3D flipbooks with realistic page-turning effects powered by WebGL and Three.js.

## Features

- 🎮 **WebGL 3D Rendering**: Realistic page-flip animations with Three.js
- 💡 **Dynamic Lighting**: Configurable lights and shadows for depth
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🎮 **Touch Gestures**: Natural swipe-to-turn-pages on touch devices
- ⌨️ **Keyboard Navigation**: Full keyboard accessibility support
- 🔍 **Zoom Controls**: Pinch-to-zoom, mouse wheel, and button controls
- 🔖 **Bookmarks**: Save, manage, and persist bookmarked pages
- 📑 **Table of Contents**: Hierarchical, searchable TOC navigation
- 🖼️ **Thumbnails Panel**: Visual page thumbnail navigation with virtual scrolling
- 🔎 **Full-Text Search**: Search across all pages with highlighted results
- ▶️ **Autoplay**: Automatic page flipping with customizable intervals
- 📄 **PDF Support**: Direct PDF rendering via PDF.js integration
- 🌙 **Themes**: Light, dark, and gradient themes with full customization
- ♿ **Accessible**: ARIA labels, screen reader support, and keyboard navigation
- 📦 **TypeScript**: Complete TypeScript definitions for type safety

## Installation

```bash
npm install react-3d-flipbook
# or
yarn add react-3d-flipbook
# or
pnpm add react-3d-flipbook
```

### Required Dependencies

For WebGL 3D rendering:
```bash
npm install three @types/three
```

### Optional Dependencies

For PDF support:
```bash
npm install pdfjs-dist
```

## Quick Start

```tsx
import { Flipbook } from 'react-3d-flipbook';
import 'react-3d-flipbook/dist/styles.css';

const pages = [
  { src: '/images/page1.jpg', title: 'Cover' },
  { src: '/images/page2.jpg', title: 'Introduction' },
  { src: '/images/page3.jpg', title: 'Chapter 1' },
  // ... more pages
];

function App() {
  return (
    <Flipbook
      pages={pages}
      width="100%"
      height="600px"
      onPageFlip={(e) => console.log('Flipped to page', e.page)}
    />
  );
}
```

## Components

### Main Flipbook Component

```tsx
import { Flipbook, FlipbookInstance } from 'react-3d-flipbook';

function App() {
  const flipbookRef = useRef<FlipbookInstance>(null);

  return (
    <Flipbook
      ref={flipbookRef}
      pages={pages}
      width="100%"
      height="600px"
      startPage={1}
      skin="dark"
      singlePageMode={false}
      rightToLeft={false}
      shadows={true}
      lights={true}
      pageFlipDuration={600}
      onPageFlip={(e) => console.log('Page:', e.page)}
      onReady={() => console.log('Ready!')}
    />
  );
}
```

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
  onPageSelect={(page) => goToPage(page)}
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
  onPageSelect={(page) => goToPage(page)}
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
  onPageSelect={(page) => goToPage(page)}
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
  onPageSelect={(page) => goToPage(page)}
  onRemoveBookmark={(page) => removeBookmark(page)}
  onClose={() => setShowBookmarks(false)}
/>
```

### WebGL Page Flip (3D Rendering)

```tsx
import { WebGLPageFlip, WebGLPageFlipInstance } from 'react-3d-flipbook';

<WebGLPageFlip
  ref={webglRef}
  pages={pages}
  currentPage={currentPage}
  width={800}
  height={600}
  flipDuration={800}
  pageHardness={0.5}
  coverHardness={0.9}
  shadows={true}
  shadowOpacity={0.3}
  lights={true}
  lightIntensity={1}
  pageRoughness={0.8}
  pageMetalness={0.1}
  antialias={true}
  onPageChange={(page) => setCurrentPage(page)}
/>
```

## Hooks

### useFlipbook

Core flipbook state and navigation logic:

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

Automatic page flipping:

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

PDF.js integration for loading PDF documents:

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

Add swipe gestures to any element:

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

Mouse wheel zoom functionality:

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

## Props Reference

### FlipbookProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pages` | `FlipbookPage[]` | Required | Array of page objects |
| `width` | `string \| number` | `'100%'` | Container width |
| `height` | `string \| number` | `'600px'` | Container height |
| `className` | `string` | `''` | Additional CSS class |
| `style` | `CSSProperties` | `undefined` | Inline styles |
| `startPage` | `number` | `1` | Initial page to display |
| `rightToLeft` | `boolean` | `false` | RTL reading direction |
| `singlePageMode` | `boolean` | `false` | Show one page at a time |
| `sideNavigationButtons` | `boolean` | `true` | Show side nav buttons |
| `skin` | `'dark' \| 'light' \| 'gradient'` | `'dark'` | Theme |
| `backgroundColor` | `string` | `'rgb(81, 85, 88)'` | Background color |
| `hideMenu` | `boolean` | `false` | Hide the toolbar |
| `zoomMin` | `number` | `1` | Minimum zoom level |
| `zoomMax2` | `number` | `3` | Maximum zoom level |
| `zoomStep` | `number` | `0.5` | Zoom increment |
| `touchSwipeEnabled` | `boolean` | `true` | Enable touch swipe |
| `tableOfContent` | `TocItem[]` | `undefined` | Table of contents data |

### WebGL 3D Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pageFlipDuration` | `number` | `600` | Flip animation duration (ms) |
| `pageHardness` | `number` | `0.5` | Page flexibility (0-1) |
| `coverHardness` | `number` | `0.9` | Cover rigidity (0-1) |
| `pageSegmentsW` | `number` | `30` | Page mesh segments |
| `pageSegmentsH` | `number` | `1` | Page mesh segments |
| `shadows` | `boolean` | `true` | Enable shadows |
| `shadowOpacity` | `number` | `0.3` | Shadow intensity (0-1) |
| `lights` | `boolean` | `true` | Enable dynamic lighting |
| `lightIntensity` | `number` | `1` | Light brightness |
| `lightColor` | `number` | `0xffffff` | Light color |
| `pageRoughness` | `number` | `0.8` | Material roughness (0-1) |
| `pageMetalness` | `number` | `0.1` | Material metalness (0-1) |
| `antialias` | `boolean` | `true` | Enable antialiasing |

### FlipbookPage

```ts
interface FlipbookPage {
  src: string;           // Image source URL
  thumb?: string;        // Thumbnail image URL
  title?: string;        // Page title for TOC
  htmlContent?: string;  // HTML content overlay
  empty?: boolean;       // Whether this is a blank page
}
```

### Event Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onPageFlip` | `(e: { page, direction }) => void` | Called when page changes |
| `onPageFlipStart` | `(e: { page, direction }) => void` | Called when flip starts |
| `onPageFlipEnd` | `(e: { page }) => void` | Called when flip ends |
| `onZoomChange` | `(e: { zoom }) => void` | Called when zoom changes |
| `onReady` | `() => void` | Called when flipbook is ready |
| `onFullscreenChange` | `(e: { isFullscreen }) => void` | Called on fullscreen toggle |
| `onLoadProgress` | `(e: { progress }) => void` | Called during loading |

## Instance Methods

Access via ref:

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

## Keyboard Shortcuts

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

## Styling & Customization

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

- `.react-flipbook` - Main container
- `.react-flipbook-container` - Book container
- `.react-flipbook-book` - Book element
- `.react-flipbook-pages` - Pages wrapper
- `.react-flipbook-page` - Individual page
- `.react-flipbook-menu` - Bottom toolbar
- `.react-flipbook-btn` - Toolbar buttons
- `.react-flipbook-nav-btn` - Side navigation buttons
- `.react-flipbook-sidebar` - Side panels
- `.react-flipbook-thumbnails` - Thumbnails grid
- `.react-flipbook-toc` - Table of contents
- `.react-flipbook-search` - Search panel
- `.react-flipbook-bookmarks` - Bookmarks panel

### Theme Classes

- `.react-flipbook-theme-dark` - Dark theme (default)
- `.react-flipbook-theme-light` - Light theme
- `.react-flipbook-theme-gradient` - Gradient theme

## Button Configuration

```tsx
<Flipbook
  pages={pages}
  btnFirst={{ enabled: true, title: 'First page' }}
  btnPrev={{ enabled: true, title: 'Previous page' }}
  btnNext={{ enabled: true, title: 'Next page' }}
  btnLast={{ enabled: true, title: 'Last page' }}
  btnBookmark={{ enabled: true, title: 'Bookmark page' }}
  btnExpand={{ enabled: true, title: 'Fullscreen' }}
  currentPage={{ enabled: true }}
/>
```

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

// Debounce a function
const debouncedFn = debounce(fn, 300);

// Check device capabilities
if (isMobile()) { /* ... */ }
if (isWebGLSupported()) { /* ... */ }

// Preload images
await preloadImages(urls, (loaded, total) => {
  console.log(`Loaded ${loaded}/${total}`);
});

// Local storage helpers
storage.set('key', value);
const value = storage.get('key', defaultValue);

// Easing functions
const easedValue = easing.easeInOutCubic(t);
```

## Browser Support

| Browser | Version | WebGL Support |
|---------|---------|---------------|
| Chrome | 80+ | ✅ |
| Firefox | 75+ | ✅ |
| Safari | 13+ | ✅ |
| Edge | 80+ | ✅ |
| iOS Safari | 13+ | ✅ |
| Android Chrome | 80+ | ✅ |

**Note:** WebGL is required for the 3D page-flip animations. The component displays a fallback message if WebGL is not available in the browser.

## TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  FlipbookPage,
  FlipbookProps,
  FlipbookInstance,
  FlipbookOptions,
  TocItem,
  SkinType,
  ButtonConfig,
  FlipbookEventMap,
  UseAutoplayOptions,
  UseAutoplayReturn,
  UsePdfLoaderOptions,
  UsePdfLoaderReturn,
  SearchResult,
  Bookmark,
  WebGLPageFlipProps,
  WebGLPageFlipInstance,
} from 'react-3d-flipbook';
```

## Examples

See the `examples/` directory for complete examples:

- **BasicExample** - Simple flipbook setup
- **FullFeaturedExample** - All panels and features
- **AutoplayExample** - Automatic page flipping
- **PdfViewerExample** - PDF document viewing
- **CustomizationExample** - Theme and layout options
- **ProgrammaticControlExample** - Ref-based control
- **WebGLSettingsExample** - Custom 3D rendering settings

## Troubleshooting

### WebGL not working
- Ensure `three` is installed: `npm install three @types/three`
- Check if WebGL is supported: `isWebGLSupported()`
- Try reducing `pageSegmentsW` for better performance on lower-end devices
- Disable shadows with `shadows={false}` for performance

### PDF not loading
- Ensure `pdfjs-dist` is installed
- Set the correct `workerSrc` path
- Check browser console for CORS errors

### Touch gestures not working
- Ensure `touchSwipeEnabled={true}`
- Check if the container has proper dimensions
- Verify touch events aren't being prevented

### Performance issues
- Use thumbnail images (`thumb` property)
- Reduce `pageSegmentsW` (e.g., from 30 to 15)
- Disable shadows: `shadows={false}`
- Disable antialiasing: `antialias={false}`
- Enable virtual scrolling in thumbnails panel
- Limit search results with `maxResults`

### Page flip animation issues
- Adjust `pageHardness` (lower = more flexible)
- Adjust `pageFlipDuration` for animation speed
- Ensure pages have consistent aspect ratios

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v2.0.0
- **Breaking Change**: Removed CSS3D rendering mode - now WebGL-only
- Improved z-ordering for page flip animations
- Fixed "flying page" issue during animations
- Cleaner, more maintainable codebase
- Performance improvements

### v1.0.0
- Initial release
- Core flipbook component
- WebGL 3D rendering with Three.js
- Thumbnails, TOC, Search, and Bookmarks panels
- Autoplay functionality
- PDF.js integration
- Full TypeScript support