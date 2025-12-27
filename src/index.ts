// Main Flipbook component
export { default as Flipbook } from "./components/Flipbook";

// WebGL page flip component
export { default as WebGLPageFlip } from "./components/WebGLPageFlip";
export type {
  WebGLPageFlipProps,
  WebGLPageFlipInstance,
} from "./components/WebGLPageFlip";

// Panel components
export { default as ThumbnailsPanel } from "./components/ThumbnailsPanel";
export type { ThumbnailsPanelProps } from "./components/ThumbnailsPanel";

export { default as TableOfContents } from "./components/TableOfContents";
export type { TableOfContentsProps } from "./components/TableOfContents";

export { default as SearchPanel } from "./components/SearchPanel";
export type { SearchPanelProps, SearchResult } from "./components/SearchPanel";

export { default as BookmarksPanel } from "./components/BookmarksPanel";
export type {
  BookmarksPanelProps,
  Bookmark,
} from "./components/BookmarksPanel";

// Hooks
export {
  useFlipbook,
  useSwipeGesture,
  useWheelZoom,
  useResizeObserver,
} from "./hooks/useFlipbook";

export { useAutoplay } from "./hooks/useAutoplay";
export type {
  UseAutoplayOptions,
  UseAutoplayReturn,
} from "./hooks/useAutoplay";

export { usePdfLoader } from "./hooks/usePdfLoader";
export type {
  UsePdfLoaderOptions,
  UsePdfLoaderReturn,
} from "./hooks/usePdfLoader";

// PDF utilities
export {
  pdfToFlipbookPages,
  pdfToFlipbookPagesLazy,
  getPdfInfo,
  setPdfWorkerSrc,
  calculateFlipbookSize,
  calculateFlipbookSizeFromPages,
} from "./utils/pdfUtils";
export type {
  PdfToImagesOptions,
  PdfPageInfo,
  FlipbookSizeOptions,
  FlipbookSize,
} from "./utils/pdfUtils";

// Types
export type {
  // Page types
  FlipbookPage,
  TocItem,

  // View and theme types
  ViewMode,
  SkinType,
  LayoutType,
  HAlign,
  VAlign,

  // Button configuration types
  ButtonConfig,
  DownloadButtonConfig,
  CurrentPageConfig,
  CloseButtonConfig,

  // Feature configuration types
  ShareConfig,
  ShareProviderConfig,
  PdfConfig,
  FillPreloaderConfig,
  LocalizationStrings,
  MobileConfig,
  AssetsConfig,
  LightboxConfig,

  // Main configuration types
  FlipbookOptions,
  FlipbookProps,

  // Event types
  FlipbookEventMap,

  // Instance types
  FlipbookInstance,

  // Hook return types
  UseFlipbookReturn,
  FlipbookContextValue,
} from "./types";

// Utilities
export {
  clamp,
  lerp,
  degToRad,
  radToDeg,
  debounce,
  throttle,
  isNumber,
  isMobile,
  isTouchDevice,
  isWebGLSupported,
  getImageAspectRatio,
  calculatePageDimensions,
  preloadImage,
  preloadImages,
  generateId,
  getElementOffset,
  requestFullscreen,
  exitFullscreen,
  isFullscreen,
  getFullscreenElement,
  formatPageNumber,
  getPageFromHash,
  setPageHash,
  clearHash,
  storage,
  easing,
} from "./utils";

// CSS styles (users need to import this)
import "./styles/flipbook.css";
