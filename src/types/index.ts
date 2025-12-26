// Page types
export interface FlipbookPage {
  /** Image source URL for the page */
  src: string;
  /** Thumbnail image URL */
  thumb?: string;
  /** Page title for table of contents */
  title?: string;
  /** HTML content to overlay on the page */
  htmlContent?: string;
  /** JSON data associated with the page */
  json?: Record<string, unknown>;
  /** Which side of a double page spread */
  side?: "left" | "right";
  /** Whether this is an empty/placeholder page */
  empty?: boolean;
}

// Table of contents
export interface TocItem {
  title: string;
  page: number;
  children?: TocItem[];
}

// View modes (WebGL only - CSS3D has been removed)
export type ViewMode = "webgl";

// Skin/theme options
export type SkinType = "dark" | "light" | "gradient";

// Layout options
export type LayoutType = "1" | "2" | "3" | "4";

// Button alignment
export type HAlign = "left" | "center" | "right";
export type VAlign = "top" | "middle" | "bottom";

// Button configuration
export interface ButtonConfig {
  enabled?: boolean;
  title?: string;
  iconFA?: string;
  iconM?: string;
  iconFA_alt?: string;
  iconM_alt?: string;
  hAlign?: HAlign;
  vAlign?: VAlign;
  hideOnMobile?: boolean;
}

export interface DownloadButtonConfig extends ButtonConfig {
  url?: string;
  name?: string;
  forceDownload?: boolean;
  openInNewWindow?: boolean;
}

export interface CurrentPageConfig {
  enabled?: boolean;
  title?: string;
  vAlign?: VAlign;
  hAlign?: HAlign;
  marginH?: number;
  marginV?: number;
  color?: string;
  background?: string;
}

// Close button specific config
export interface CloseButtonConfig extends ButtonConfig {
  size?: number;
}

// Share providers
export interface ShareProviderConfig {
  enabled?: boolean;
  icon?: string;
}

export interface ShareConfig {
  whatsapp?: ShareProviderConfig;
  twitter?: ShareProviderConfig;
  facebook?: ShareProviderConfig;
  pinterest?: ShareProviderConfig;
  email?: ShareProviderConfig;
  linkedin?: ShareProviderConfig;
  digg?: ShareProviderConfig;
  reddit?: ShareProviderConfig;
}

// PDF configuration
export interface PdfConfig {
  annotationLayer?: boolean;
}

// Fill preloader config
export interface FillPreloaderConfig {
  enabled?: boolean;
  imgEmpty?: string;
  imgFull?: string;
}

// Localization strings
export interface LocalizationStrings {
  print?: string;
  printLeftPage?: string;
  printRightPage?: string;
  printCurrentPage?: string;
  printAllPages?: string;
  download?: string;
  downloadLeftPage?: string;
  downloadRightPage?: string;
  downloadCurrentPage?: string;
  downloadAllPages?: string;
  bookmarks?: string;
  bookmarkLeftPage?: string;
  bookmarkRightPage?: string;
  bookmarkCurrentPage?: string;
  search?: string;
  findInDocument?: string;
  pagesFoundContaining?: string;
  noMatches?: string;
  matchesFound?: string;
  thumbnails?: string;
  tableOfContent?: string;
  share?: string;
  pressEscToClose?: string;
  password?: string;
}

// Mobile specific settings
export interface MobileConfig {
  shadows?: boolean;
  pageSegmentsW?: number;
}

// Asset URLs
export interface AssetsConfig {
  preloader?: string;
  overlay?: string;
  flipMp3?: string;
  spinner?: string;
  backgroundMp3?: string;
}

// Lightbox configuration
export interface LightboxConfig {
  enabled?: boolean;
  opened?: boolean;
  fullscreen?: boolean;
  closeOnClick?: boolean;
  resetOnOpen?: boolean;
  background?: string;
  backgroundColor?: string;
  backgroundPattern?: string;
  backgroundImage?: string;
  startPage?: number;
  marginV?: number;
  marginH?: number;
  css?: string;
  preload?: boolean;
  showMenu?: boolean;
  closeOnBack?: boolean;
}

// Main Flipbook options
export interface FlipbookOptions {
  // Basic settings
  name?: string;
  pages?: FlipbookPage[];
  tableOfContent?: TocItem[];
  tableOfContentCloseOnClick?: boolean;
  thumbsCloseOnClick?: boolean;

  // Deeplinking
  deeplinkingEnabled?: boolean;
  deeplinkingPrefix?: string;

  // Assets
  assets?: AssetsConfig;

  // PDF settings
  pdfUrl?: string | null;
  pdfBrowserViewerIfMobile?: boolean;
  pdfBrowserViewerIfIE?: boolean;
  pdfBrowserViewerFullscreen?: boolean;
  pdfBrowserViewerFullscreenTarget?: string;
  rangeChunkSize?: number;
  disableRange?: boolean;
  disableStream?: boolean;
  disableAutoFetch?: boolean;
  pdfAutoLinks?: boolean;
  pdf?: PdfConfig;
  pdfTextLayer?: boolean;
  annotationLayer?: boolean;

  // Display settings
  htmlLayer?: boolean;
  rightToLeft?: boolean;
  startPage?: number;
  sound?: boolean;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPattern?: string;
  backgroundTransparent?: boolean;

  // Thumbnails
  thumbSize?: number;

  // Page loading
  loadAllPages?: boolean;
  loadPagesF?: number;
  loadPagesB?: number;

  // Autoplay
  autoplayOnStart?: boolean;
  autoplayInterval?: number;
  autoplayLoop?: boolean;

  // Appearance
  skin?: SkinType;
  layout?: LayoutType;
  skinColor?: string;
  skinBackground?: string;

  // Menu settings
  menuOverBook?: boolean;
  menuFloating?: boolean;
  menuBackground?: string;
  menuShadow?: string;
  menuMargin?: number;
  menuPadding?: number;
  menuTransparent?: boolean;
  hideMenu?: boolean;

  // Menu 2 settings
  menu2OverBook?: boolean;
  menu2Floating?: boolean;
  menu2Background?: string;
  menu2Shadow?: string;
  menu2Margin?: number;
  menu2Padding?: number;
  menu2Transparent?: boolean;

  // Button styling
  btnColor?: string;
  btnBackground?: string;
  btnSize?: number;
  btnRadius?: number;
  btnMargin?: number;
  btnPaddingV?: number;
  btnPaddingH?: number;
  btnShadow?: string;
  btnTextShadow?: string;
  btnBorder?: string;
  btnColorHover?: string;
  btnBackgroundHover?: string;

  // Side button styling
  sideBtnColor?: string;
  sideBtnBackground?: string;
  sideBtnSize?: number;
  sideBtnRadius?: number;
  sideBtnMargin?: number;
  sideBtnPaddingV?: number;
  sideBtnPaddingH?: number;
  sideBtnShadow?: string;
  sideBtnTextShadow?: string;
  sideBtnBorder?: string;
  sideBtnColorHover?: string;
  sideBtnBackgroundHover?: string;

  // Floating button styling
  floatingBtnColor?: string;
  floatingBtnColorHover?: string;
  floatingBtnBackground?: string;
  floatingBtnBackgroundHover?: string;
  floatingBtnSize?: number | null;
  floatingBtnRadius?: number | null;
  floatingBtnMargin?: number | null;
  floatingBtnPadding?: number | null;
  floatingBtnShadow?: string;
  floatingBtnTextShadow?: string;
  floatingBtnBorder?: string;

  // Button configurations
  currentPage?: CurrentPageConfig;
  btnFirst?: ButtonConfig;
  btnPrev?: ButtonConfig;
  btnNext?: ButtonConfig;
  btnLast?: ButtonConfig;
  btnZoomIn?: ButtonConfig;
  btnZoomOut?: ButtonConfig;
  btnRotateLeft?: ButtonConfig;
  btnRotateRight?: ButtonConfig;
  btnAutoplay?: ButtonConfig;
  btnSearch?: ButtonConfig;
  btnSelect?: ButtonConfig;
  btnBookmark?: ButtonConfig;
  btnToc?: ButtonConfig;
  btnThumbs?: ButtonConfig;
  btnShare?: ButtonConfig;
  btnPrint?: ButtonConfig;
  btnDownloadPages?: DownloadButtonConfig;
  btnDownloadPdf?: DownloadButtonConfig;
  btnSound?: ButtonConfig;
  btnExpand?: ButtonConfig;
  btnClose?: CloseButtonConfig;
  btnOrder?: string[];

  // Mobile button visibility
  btnShareIfMobile?: boolean;
  btnSoundIfMobile?: boolean;
  btnPrintIfMobile?: boolean;

  // Navigation
  sideNavigationButtons?: boolean;

  // Sharing
  shareUrl?: string;
  shareTitle?: string;
  shareImage?: string;
  share?: ShareConfig;

  // Page texture settings
  pageTextureSize?: number;
  pageTextureSizeSmall?: number;
  thumbTextureSize?: number;
  pageTextureSizeMobile?: number;
  pageTextureSizeMobileSmall?: number;

  // View mode
  viewMode?: ViewMode;
  singlePageMode?: boolean;
  singlePageModeIfMobile?: boolean;

  // Zoom settings
  zoomMin?: number;
  zoomMax2?: number;
  zoomSize?: number;
  zoomStep?: number;
  zoomTime?: number;
  zoomReset?: boolean;
  zoomResetTime?: number;

  // Interaction settings
  wheelDisabledNotFullscreen?: boolean;
  arrowsDisabledNotFullscreen?: boolean;
  arrowsAlwaysEnabledForNavigation?: boolean;
  touchSwipeEnabled?: boolean;
  doubleClickZoomDisabled?: boolean;
  pageDragDisabled?: boolean;
  rightClickEnabled?: boolean;

  // Responsive
  responsiveView?: boolean;
  responsiveViewRatio?: number;
  responsiveViewTreshold?: number;
  minPixelRatio?: number;

  // Animation
  pageFlipDuration?: number;

  // Initial state
  contentOnStart?: boolean;
  thumbnailsOnStart?: boolean;
  searchOnStart?: boolean;

  // Side menu
  sideMenuOverBook?: boolean;
  sideMenuOverMenu?: boolean;
  sideMenuOverMenu2?: boolean;
  sideMenuPosition?: "left" | "right";

  // Lightbox
  lightBox?: boolean;
  lightBoxOpened?: boolean;
  lightBoxFullscreen?: boolean;
  lightboxCloseOnClick?: boolean;
  lightboxResetOnOpen?: boolean;
  lightboxBackground?: string;
  lightboxBackgroundColor?: string;
  lightboxBackgroundPattern?: string;
  lightboxBackgroundImage?: string;
  lightboxStartPage?: number;
  lightboxMarginV?: number;
  lightboxMarginH?: number;
  lightboxCSS?: string;
  lightboxPreload?: boolean;
  lightboxShowMenu?: boolean;
  lightboxCloseOnBack?: boolean;

  // Image settings
  disableImageResize?: boolean;

  // Pan settings
  pan?: number;
  panMax?: number;
  panMax2?: number;
  panMin?: number;
  panMin2?: number;

  // Tilt settings
  tilt?: number;
  tiltMax?: number;
  tiltMax2?: number;
  tiltMin?: number;
  tiltMin2?: number;

  // Camera rotation
  rotateCameraOnMouseMove?: boolean;
  rotateCameraOnMouseDrag?: boolean;

  // Lighting (WebGL)
  lights?: boolean;
  lightColor?: number;
  lightPositionX?: number;
  lightPositionZ?: number;
  lightPositionY?: number;
  lightIntensity?: number;

  // Shadows (WebGL)
  shadows?: boolean;
  shadowMapSize?: number;
  shadowOpacity?: number;
  shadowDistance?: number;

  // Page material (WebGL)
  pageRoughness?: number;
  pageMetalness?: number;
  pageHardness?: number;
  coverHardness?: number;

  // Page geometry (WebGL)
  pageSegmentsW?: number;
  pageSegmentsH?: number;

  // Page middle shadow
  pageMiddleShadowSize?: number;
  pageMiddleShadowColorL?: string;
  pageMiddleShadowColorR?: string;

  // Rendering
  antialias?: boolean;

  // Preloader
  preloaderText?: string;
  fillPreloader?: FillPreloaderConfig;

  // Logo
  logoImg?: string;
  logoUrl?: string;
  logoCSS?: string;
  logoHideOnMobile?: boolean;

  // Menu options
  printMenu?: boolean;
  downloadMenu?: boolean;

  // Cover settings
  cover?: boolean;
  backCover?: boolean;

  // Google Analytics
  googleAnalyticsTrackingCode?: string;

  // Compatibility
  minimumAndroidVersion?: number;

  // Link styling
  linkColor?: string;
  linkColorHover?: string;
  linkOpacity?: number;
  linkTarget?: string;

  // Page number
  pageNumberOffset?: number;

  // Sounds
  flipSound?: boolean;
  backgroundMusic?: string;

  // Localization
  strings?: LocalizationStrings;

  // Mobile overrides
  mobile?: MobileConfig;
}

// Event types
export interface FlipbookEventMap {
  pageFlip: { page: number; direction: "next" | "prev" };
  pageFlipStart: { page: number; direction: "next" | "prev" };
  pageFlipEnd: { page: number };
  zoomChange: { zoom: number };
  ready: void;
  loadProgress: { progress: number };
  pageLoaded: { page: number };
  fullscreenChange: { isFullscreen: boolean };
  lightboxOpen: void;
  lightboxClose: void;
  soundToggle: { enabled: boolean };
  autoplayToggle: { enabled: boolean };
}

// Flipbook instance methods (imperative handle)
export interface FlipbookInstance {
  // Navigation
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  goToPage: (page: number) => void;

  // Zoom
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (zoom: number) => void;

  // State
  getCurrentPage: () => number;
  getNumPages: () => number;
  getZoom: () => number;
  isFullscreen: () => boolean;

  // Controls
  toggleFullscreen: () => void;
  toggleAutoplay: () => void;
  toggleSound: () => void;
  toggleThumbnails: () => void;
  toggleTableOfContents: () => void;
  toggleSearch: () => void;

  // Lightbox
  openLightbox: () => void;
  closeLightbox: () => void;

  // Bookmarks
  bookmarkPage: (page: number) => void;
  removeBookmark: (page: number) => void;
  getBookmarkedPages: () => number[];

  // Print/Download
  printCurrentPage: () => void;
  downloadCurrentPage: () => void;

  // Destroy
  destroy: () => void;
}

// Component props
export interface FlipbookProps extends Partial<FlipbookOptions> {
  /** Pages to display in the flipbook */
  pages: FlipbookPage[];
  /** Class name for the container element */
  className?: string;
  /** Inline styles for the container */
  style?: React.CSSProperties;
  /** Width of the flipbook container */
  width?: number | string;
  /** Height of the flipbook container */
  height?: number | string;

  // Event callbacks
  onPageFlip?: (event: FlipbookEventMap["pageFlip"]) => void;
  onPageFlipStart?: (event: FlipbookEventMap["pageFlipStart"]) => void;
  onPageFlipEnd?: (event: FlipbookEventMap["pageFlipEnd"]) => void;
  onZoomChange?: (event: FlipbookEventMap["zoomChange"]) => void;
  onReady?: () => void;
  onLoadProgress?: (event: FlipbookEventMap["loadProgress"]) => void;
  onPageLoaded?: (event: FlipbookEventMap["pageLoaded"]) => void;
  onFullscreenChange?: (event: FlipbookEventMap["fullscreenChange"]) => void;
  onLightboxOpen?: () => void;
  onLightboxClose?: () => void;
  onSoundToggle?: (event: FlipbookEventMap["soundToggle"]) => void;
  onAutoplayToggle?: (event: FlipbookEventMap["autoplayToggle"]) => void;
}

// Hook return types
export interface UseFlipbookReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  flipbookRef: React.RefObject<FlipbookInstance>;
  currentPage: number;
  numPages: number;
  zoom: number;
  isFullscreen: boolean;
  isLoading: boolean;
  isReady: boolean;
}

// Context types
export interface FlipbookContextValue {
  options: FlipbookOptions;
  currentPage: number;
  numPages: number;
  zoom: number;
  isFullscreen: boolean;
  isLoading: boolean;
  instance: FlipbookInstance | null;
}
