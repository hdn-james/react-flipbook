import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import * as THREE from "three";
import type { FlipbookPage } from "../types";

export interface WebGLPageFlipProps {
  pages: FlipbookPage[];
  currentPage: number;
  width: number;
  height: number;
  singlePageMode?: boolean;
  flipDuration?: number;
  pageHardness?: number;
  coverHardness?: number;
  pageSegmentsW?: number;
  pageSegmentsH?: number;
  shadows?: boolean;
  shadowOpacity?: number;
  lights?: boolean;
  lightIntensity?: number;
  lightColor?: number;
  pageRoughness?: number;
  pageMetalness?: number;
  antialias?: boolean;
  backgroundColor?: string;
  /** Camera zoom/margin factor - higher values move camera further back (default: 1.35) */
  cameraZoom?: number;
  /** Base page scale in world units - affects overall page size (default: 6) */
  pageScale?: number;
  /** Camera vertical position offset (default: 0) */
  cameraPositionY?: number;
  /** Camera look-at Y position (default: 0) */
  cameraLookAtY?: number;
  /** Field of view in degrees (default: 45) */
  cameraFov?: number;
  onFlipStart?: (page: number, direction: "next" | "prev") => void;
  onFlipEnd?: (page: number) => void;
  onPageChange?: (page: number) => void;
}

export interface WebGLPageFlipInstance {
  flipNext: () => void;
  flipPrev: () => void;
  flipToPage: (page: number) => void;
  flipToFirst: () => void;
  flipToLast: () => void;
  isFlipping: () => boolean;
  dispose: () => void;
}

interface PageSheet {
  group: THREE.Group;
  frontMesh: THREE.Mesh;
  backMesh: THREE.Mesh;
  frontPageIndex: number;
  backPageIndex: number;
  isFlipping: boolean;
  baseRotation: number;
}

interface FlipAnimation {
  isFlipping: boolean;
  direction: "next" | "prev" | null;
  progress: number;
  fromPage: number;
  targetPage: number;
  startTime: number;
  flippingSheetIndex: number;
  continuousFlip: boolean;
  finalTargetPage: number;
}

// Utility functions
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Smooth easing function for natural page flip feel
const easeInOutQuart = (t: number): number => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
};

// Additional easing for the curl effect - peaks at middle
const curlEasing = (t: number): number => {
  return t * t * t;
};

// Easing for fly-out/fly-in animation - smooth acceleration then deceleration
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

const WebGLPageFlip = forwardRef<WebGLPageFlipInstance, WebGLPageFlipProps>(
  (
    {
      pages,
      currentPage,
      width,
      height,
      singlePageMode = false,
      flipDuration = 700,
      pageHardness = 0.3,
      coverHardness = 0.8,
      pageSegmentsW = 32,
      pageSegmentsH = 20,
      shadows = true,
      shadowOpacity = 0.35,
      lights = true,
      lightIntensity = 1.0,
      lightColor = 0xffffff,
      pageRoughness = 0.8,
      pageMetalness = 0.0,
      antialias = true,
      backgroundColor = "#515558",
      cameraZoom = 1.35,
      pageScale = 6,
      cameraPositionY = 0,
      cameraLookAtY = 0,
      cameraFov = 45,
      onFlipStart,
      onFlipEnd,
      onPageChange,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const bookGroupRef = useRef<THREE.Group | null>(null);
    const pageSheetsRef = useRef<PageSheet[]>([]);
    const texturesRef = useRef<Map<number, THREE.Texture>>(new Map());
    const animationFrameRef = useRef<number | null>(null);
    const currentPageRef = useRef<number>(currentPage);
    const baseGeometryRef = useRef<THREE.PlaneGeometry | null>(null);

    const flipAnimationRef = useRef<FlipAnimation>({
      isFlipping: false,
      direction: null,
      progress: 0,
      fromPage: currentPage,
      targetPage: currentPage,
      startTime: 0,
      flippingSheetIndex: -1,
      continuousFlip: false,
      finalTargetPage: currentPage,
    });

    const [isInitialized, setIsInitialized] = useState(false);

    const numPages = pages.length;
    // In single-page mode, create one sheet per page
    // In two-page mode, create one sheet per two pages
    const numSheets = singlePageMode ? numPages : Math.ceil(numPages / 2);

    // Base dimension in world units - used as reference scale (configurable via pageScale prop)
    const baseWorldSize = pageScale;

    // Get reference page dimensions from the first page
    // All pages will be scaled to match this reference for consistent display
    const referencePageDimensions = useMemo(() => {
      const firstPage = pages[0];
      if (firstPage?.width && firstPage?.height) {
        const pageAspect = firstPage.width / firstPage.height;
        // Scale to fit within baseWorldSize while maintaining aspect ratio
        if (pageAspect >= 1) {
          // Landscape or square
          return {
            width: baseWorldSize,
            height: baseWorldSize / pageAspect,
          };
        } else {
          // Portrait
          return {
            width: baseWorldSize * pageAspect,
            height: baseWorldSize,
          };
        }
      }
      // Fallback to container-based dimensions
      const containerAspect = singlePageMode
        ? width / height
        : width / 2 / height;
      if (containerAspect >= 1) {
        return {
          width: baseWorldSize,
          height: baseWorldSize / containerAspect,
        };
      } else {
        return {
          width: baseWorldSize * containerAspect,
          height: baseWorldSize,
        };
      }
    }, [pages, width, height, singlePageMode]);

    // Calculate world dimensions for a specific page
    // Uses reference dimensions for consistency - all pages same size
    const getPageWorldDimensions = useCallback(
      (_pageIndex: number): { width: number; height: number } => {
        // Return consistent dimensions for all pages based on first page
        return referencePageDimensions;
      },
      [referencePageDimensions],
    );

    // Default page dimensions (used for base geometry)
    const pageWorldWidth = referencePageDimensions.width;
    const pageWorldHeight = referencePageDimensions.height;

    const parseBackgroundColor = useCallback((color: string): THREE.Color => {
      return new THREE.Color(color);
    }, []);

    // Create a canvas texture from page content
    const createPageTexture = useCallback(
      (pageIndex: number): THREE.Texture => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        const page = pages[pageIndex - 1];

        // Higher resolution for sharper text/images
        const resolution = 2;

        // Use per-page dimensions if available, otherwise use container dimensions
        // This supports mixed landscape/portrait pages (e.g., from PDFs)
        let pageWidth: number;
        let pageHeight: number;

        if (page?.width && page?.height) {
          // Page has its own dimensions (e.g., from PDF)
          pageWidth = page.width;
          pageHeight = page.height;
        } else {
          // Use container dimensions
          pageWidth = singlePageMode ? width : width / 2;
          pageHeight = height;
        }

        // Detect orientation
        const isLandscape =
          page?.orientation === "landscape" ||
          (!page?.orientation && pageWidth > pageHeight);

        // For landscape pages in single-page mode, use full width
        // For landscape pages in two-page mode, we still show them as single pages
        const canvasWidth = Math.floor(pageWidth) * resolution;
        const canvasHeight = Math.floor(pageHeight) * resolution;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;

        // Store page info on texture for later use
        (
          texture as THREE.CanvasTexture & {
            pageInfo?: { isLandscape: boolean; width: number; height: number };
          }
        ).pageInfo = {
          isLandscape,
          width: pageWidth,
          height: pageHeight,
        };

        if (!page) {
          return texture;
        }

        // Load image if present
        if (page.src) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            // Draw image to fit canvas maintaining aspect ratio
            const imgAspect = img.width / img.height;
            const canvasAspect = canvas.width / canvas.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgAspect > canvasAspect) {
              // Image is wider - fit to height
              drawHeight = canvas.height;
              drawWidth = drawHeight * imgAspect;
              offsetX = (canvas.width - drawWidth) / 2;
              offsetY = 0;
            } else {
              // Image is taller - fit to width
              drawWidth = canvas.width;
              drawHeight = drawWidth / imgAspect;
              offsetX = 0;
              offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            texture.needsUpdate = true;
          };
          img.src = page.src;
        } else if (page.htmlContent) {
          // Render HTML content as text
          ctx.fillStyle = "#000000";
          ctx.font = `${16 * resolution}px Arial`;

          // Simple HTML text rendering
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = page.htmlContent;
          const textContent = tempDiv.textContent || tempDiv.innerText;
          const lines = textContent.split("\n");
          lines.forEach((line: string, i: number) => {
            ctx.fillText(line, 20 * resolution, (40 + i * 24) * resolution);
          });
          texture.needsUpdate = true;
        }

        return texture;
      },
      [pages, width, height, singlePageMode],
    );

    // Get or create texture for a page
    const getTexture = useCallback(
      (pageIndex: number): THREE.Texture => {
        if (pageIndex < 1 || pageIndex > numPages) {
          // Return blank texture for invalid pages
          const canvas = document.createElement("canvas");
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 512, 512);
          return new THREE.CanvasTexture(canvas);
        }

        let texture = texturesRef.current.get(pageIndex);
        if (!texture) {
          texture = createPageTexture(pageIndex);
          texturesRef.current.set(pageIndex, texture);
        }
        return texture;
      },
      [numPages, createPageTexture],
    );

    // Preload textures for smooth flipping
    const preloadTextures = useCallback(() => {
      for (let i = 1; i <= numPages; i++) {
        getTexture(i);
      }
    }, [numPages, getTexture]);

    // Create base geometry (flat page) - reused for pages with same aspect ratio
    const createBaseGeometry = useCallback((): THREE.PlaneGeometry => {
      if (baseGeometryRef.current) {
        return baseGeometryRef.current;
      }

      const geometry = new THREE.PlaneGeometry(
        pageWorldWidth,
        pageWorldHeight,
        pageSegmentsW,
        pageSegmentsH,
      );

      baseGeometryRef.current = geometry;
      return geometry;
    }, [pageWorldWidth, pageWorldHeight, pageSegmentsW, pageSegmentsH]);

    // Create geometry for a specific page
    // Now uses actual page dimensions for both single-page and two-page modes
    const createPageGeometry = useCallback(
      (pageIndex: number): THREE.PlaneGeometry => {
        // Use actual page dimensions for each page
        const dims = getPageWorldDimensions(pageIndex);

        return new THREE.PlaneGeometry(
          dims.width,
          dims.height,
          pageSegmentsW,
          pageSegmentsH,
        );
      },
      [getPageWorldDimensions, pageSegmentsW, pageSegmentsH],
    );

    // Apply realistic page curl deformation to geometry
    const applyPageCurl = useCallback(
      (
        geometry: THREE.BufferGeometry,
        flipProgress: number,
        isFlippingNext: boolean,
        hardness: number,
      ) => {
        const positions = geometry.attributes.position;
        const count = positions.count;

        // Store original positions and bounds if not already stored
        if (!geometry.userData.originalPositions) {
          geometry.userData.originalPositions = new Float32Array(
            positions.array,
          );
          // Compute and store original bounds BEFORE any transformations
          geometry.computeBoundingBox();
          const bounds = geometry.boundingBox;
          if (bounds) {
            geometry.userData.originalBounds = {
              minX: bounds.min.x,
              maxX: bounds.max.x,
              minY: bounds.min.y,
              maxY: bounds.max.y,
              width: bounds.max.x - bounds.min.x,
              height: bounds.max.y - bounds.min.y,
            };
          }
        }

        const origPositions = geometry.userData.originalPositions;
        const origBounds = geometry.userData.originalBounds;
        if (!origBounds) return;

        const geoWidth = origBounds.width;
        const geoHeight = origBounds.height;
        const minX = origBounds.minX;

        const easedProgress = easeInOutQuart(flipProgress);
        const rotationAngle = isFlippingNext
          ? easedProgress * Math.PI
          : (1 - easedProgress) * Math.PI;

        const curlIntensity = curlEasing(flipProgress);
        const maxCurlAngle = (1 - hardness) * Math.PI * 0.15;
        const curlAngle = curlIntensity * maxCurlAngle;

        for (let i = 0; i < count; i++) {
          const origX = origPositions[i * 3];
          const origY = origPositions[i * 3 + 1];

          // Distance from left edge (spine) normalized to geometry width
          const distFromSpine = origX - minX;
          const normalizedDist = distFromSpine / geoWidth;

          const cosR = Math.cos(rotationAngle);
          const sinR = Math.sin(rotationAngle);

          const finalX = distFromSpine * cosR;
          let finalZ = distFromSpine * sinR;

          // Edge curl
          const edgeStart = 0.8;
          if (normalizedDist > edgeStart) {
            const edgeProgress = (normalizedDist - edgeStart) / (1 - edgeStart);
            const edgeCurl = Math.pow(edgeProgress, 2) * curlAngle;
            const curlLift = distFromSpine * Math.sin(edgeCurl) * 0.3;
            finalZ += curlLift;
          }

          // Paper ripple
          const waveStrength = curlIntensity * (1 - hardness) * 0.02;
          const waveY =
            Math.sin(normalizedDist * Math.PI * 1.5) *
            Math.sin((origY / geoHeight) * Math.PI) *
            waveStrength *
            geoHeight;

          positions.setX(i, finalX + minX);
          positions.setY(i, origY + waveY);
          positions.setZ(i, finalZ);
        }

        positions.needsUpdate = true;
        geometry.computeBoundingBox();
        geometry.computeVertexNormals();
      },
      [],
    );

    // Create book structure - currently empty, pages handle their own rendering
    const createBookStructure = useCallback(() => {
      // No additional book structure needed - pages render on their own
    }, []);

    // Create a page sheet (front and back mesh in a group)
    const createPageSheet = useCallback(
      (sheetIndex: number): PageSheet => {
        // In single-page mode: one sheet per page (sheetIndex = pageIndex - 1)
        // In two-page mode: one sheet per two pages
        const frontPageIndex = singlePageMode
          ? sheetIndex + 1
          : sheetIndex * 2 + 1;
        const backPageIndex = singlePageMode
          ? sheetIndex + 1 // Same as front in single-page mode (unused)
          : sheetIndex * 2 + 2;

        // Use per-page geometry for landscape/portrait support
        const frontGeometry = createPageGeometry(frontPageIndex);
        const backGeometry = singlePageMode
          ? createPageGeometry(frontPageIndex)
          : createPageGeometry(backPageIndex);

        const frontTexture = getTexture(frontPageIndex);
        const backTexture = singlePageMode ? null : getTexture(backPageIndex);

        // In two-page mode, mirror the back texture
        if (!singlePageMode && backTexture) {
          backTexture.wrapS = THREE.RepeatWrapping;
          backTexture.repeat.x = -1;
          backTexture.offset.x = 1;
        }

        const frontMaterial = new THREE.MeshStandardMaterial({
          map: frontTexture,
          side: THREE.FrontSide,
          roughness: pageRoughness,
          metalness: pageMetalness,
          color: 0xffffff,
        });

        // In single-page mode, back side is blank white (no content)
        const backMaterial = new THREE.MeshStandardMaterial({
          map: backTexture,
          side: THREE.BackSide,
          roughness: pageRoughness,
          metalness: pageMetalness,
          color: 0xffffff,
        });

        const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
        const backMesh = new THREE.Mesh(backGeometry, backMaterial);

        // In single-page mode, center the page; otherwise offset to right of spine
        if (singlePageMode) {
          frontMesh.position.x = 0;
          backMesh.position.x = 0;
        } else {
          // Two-page mode: position pages so they pivot at the spine (x=0)
          // Front mesh (right page when not flipped): offset to right of spine
          const frontGeoWidth = frontGeometry.parameters.width;
          frontMesh.position.x = frontGeoWidth / 2;
          // Back mesh (left page when flipped): also offset to right (will be rotated 180° to show on left)
          const backGeoWidth = backGeometry.parameters.width;
          backMesh.position.x = backGeoWidth / 2;
        }

        const group = new THREE.Group();
        group.add(frontMesh);
        group.add(backMesh);

        // Enable shadows
        if (shadows) {
          frontMesh.castShadow = true;
          frontMesh.receiveShadow = true;
          backMesh.castShadow = true;
          backMesh.receiveShadow = true;
        }

        return {
          group,
          frontMesh,
          backMesh,
          frontPageIndex,
          backPageIndex,
          isFlipping: false,
          baseRotation: 0,
        };
      },
      [
        createPageGeometry,
        getTexture,
        pageRoughness,
        pageMetalness,
        pageWorldWidth,
        shadows,
        singlePageMode,
      ],
    );

    // Reset a sheet to flat geometry at a specific rotation
    const resetSheetGeometry = useCallback(
      (sheet: PageSheet, rotation: number) => {
        // Create fresh geometry with correct per-page dimensions
        const frontGeom = createPageGeometry(sheet.frontPageIndex);
        const backGeom = singlePageMode
          ? createPageGeometry(sheet.frontPageIndex)
          : createPageGeometry(sheet.backPageIndex);

        sheet.frontMesh.geometry.dispose();
        sheet.frontMesh.geometry = frontGeom;

        sheet.backMesh.geometry.dispose();
        sheet.backMesh.geometry = backGeom;

        // Reset mesh positions
        if (singlePageMode) {
          sheet.frontMesh.position.x = 0;
          sheet.backMesh.position.x = 0;
        } else {
          // Two-page mode: position at half the geometry width (pivot at left edge/spine)
          const geoWidth = frontGeom.parameters.width;
          sheet.frontMesh.position.x = geoWidth / 2;
          sheet.backMesh.position.x = geoWidth / 2;
        }

        sheet.group.rotation.y = rotation;
        sheet.group.position.z = 0;
        sheet.group.position.x = 0;
        sheet.baseRotation = rotation;
        sheet.isFlipping = false;
      },
      [createPageGeometry, singlePageMode],
    );

    // Apply curl deformation to geometry for fly animations
    const applyFlyCurl = useCallback(
      (geometry: THREE.BufferGeometry, curlAmount: number) => {
        const positions = geometry.attributes.position;
        const count = positions.count;

        // Store original positions and bounds if not already stored
        if (!geometry.userData.originalPositions) {
          geometry.userData.originalPositions = new Float32Array(
            positions.array,
          );
          // Compute and store original bounds BEFORE any transformations
          geometry.computeBoundingBox();
          const bounds = geometry.boundingBox;
          if (bounds) {
            geometry.userData.originalBounds = {
              minX: bounds.min.x,
              maxX: bounds.max.x,
              minY: bounds.min.y,
              maxY: bounds.max.y,
              width: bounds.max.x - bounds.min.x,
              height: bounds.max.y - bounds.min.y,
            };
          }
        }

        const origPositions = geometry.userData.originalPositions;
        const origBounds = geometry.userData.originalBounds;
        if (!origBounds) return;

        const geoWidth = origBounds.width;
        const geoHeight = origBounds.height;
        const minX = origBounds.minX;
        const minY = origBounds.minY;

        for (let i = 0; i < count; i++) {
          const origX = origPositions[i * 3];
          const origY = origPositions[i * 3 + 1];
          const origZ = origPositions[i * 3 + 2];

          // Normalize x position (0 to 1 from left to right edge)
          const normalizedX = (origX - minX) / geoWidth;
          // Normalize y position (-1 to 1 from bottom to top)
          const normalizedY = ((origY - minY) / geoHeight) * 2 - 1;

          // Curl increases towards the right edge (like lifting paper)
          const edgeCurl =
            Math.pow(normalizedX, 2) * curlAmount * geoWidth * 0.4;

          // Corner lift - more pronounced at corners
          const cornerFactor = Math.abs(normalizedY) * normalizedX;
          const cornerLift = cornerFactor * curlAmount * geoHeight * 0.3;

          // Wave along the page for paper ripple effect
          const wave =
            Math.sin(normalizedX * Math.PI * 2) *
            Math.sin(Math.abs(normalizedY) * Math.PI) *
            curlAmount *
            geoWidth *
            0.08;

          // Apply deformation
          const zOffset = edgeCurl + cornerLift + wave;

          positions.setX(i, origX);
          positions.setY(i, origY);
          positions.setZ(i, origZ + zOffset);
        }

        positions.needsUpdate = true;
        geometry.computeVertexNormals();
      },
      [],
    );

    // Apply fly-out animation for single-page mode
    const applyFlyOut = useCallback(
      (sheet: PageSheet, progress: number) => {
        // Get the actual page dimensions from the geometry
        const frontGeom = sheet.frontMesh.geometry as THREE.PlaneGeometry;
        const sheetWidth = frontGeom.parameters.width;
        const sheetHeight = frontGeom.parameters.height;

        // Fly out to the right with slight rotation and lift
        const easedProgress = easeOutCubic(progress);

        // Move right and up - use actual sheet dimensions
        sheet.group.position.x = easedProgress * sheetWidth * 2;
        sheet.group.position.y = easedProgress * sheetHeight * 0.3;
        sheet.group.position.z = easedProgress * 2; // Lift towards camera

        // Slight rotation as it flies out
        sheet.group.rotation.z = -easedProgress * Math.PI * 0.1;
        sheet.group.rotation.y = easedProgress * Math.PI * 0.15;

        // Apply curl to geometry - peaks in the middle of animation
        const curlIntensity = Math.sin(progress * Math.PI) * 1.5;
        const backGeom = sheet.backMesh.geometry as THREE.BufferGeometry;
        applyFlyCurl(frontGeom, curlIntensity);
        applyFlyCurl(backGeom, curlIntensity);

        // Fade out via opacity
        const opacity = 1 - easedProgress * 0.5;
        (sheet.frontMesh.material as THREE.MeshStandardMaterial).opacity =
          opacity;
        (sheet.backMesh.material as THREE.MeshStandardMaterial).opacity =
          opacity;
        (sheet.frontMesh.material as THREE.MeshStandardMaterial).transparent =
          true;
        (sheet.backMesh.material as THREE.MeshStandardMaterial).transparent =
          true;
      },
      [applyFlyCurl],
    );

    // Apply fly-in animation for single-page mode
    const applyFlyIn = useCallback(
      (sheet: PageSheet, progress: number) => {
        // Get the actual page dimensions from the geometry
        const frontGeom = sheet.frontMesh.geometry as THREE.PlaneGeometry;
        const sheetWidth = frontGeom.parameters.width;
        const sheetHeight = frontGeom.parameters.height;

        // Fly in from the right
        const easedProgress = easeOutCubic(progress);
        const inverseProgress = 1 - easedProgress;

        // Start from off-screen right and come in - use actual sheet dimensions
        sheet.group.position.x = inverseProgress * sheetWidth * 2;
        sheet.group.position.y = inverseProgress * sheetHeight * 0.3;
        sheet.group.position.z = inverseProgress * 2 + 0.01; // Start lifted, end at stack level

        // Rotation decreases as it lands
        sheet.group.rotation.z = -inverseProgress * Math.PI * 0.1;
        sheet.group.rotation.y = inverseProgress * Math.PI * 0.15;

        // Apply curl to geometry - starts curled and flattens as it lands
        const curlIntensity = Math.sin(inverseProgress * Math.PI) * 1.5;
        const backGeom = sheet.backMesh.geometry as THREE.BufferGeometry;
        applyFlyCurl(frontGeom, curlIntensity);
        applyFlyCurl(backGeom, curlIntensity);

        // Fade in
        const opacity = 0.5 + easedProgress * 0.5;
        (sheet.frontMesh.material as THREE.MeshStandardMaterial).opacity =
          opacity;
        (sheet.backMesh.material as THREE.MeshStandardMaterial).opacity =
          opacity;
        (sheet.frontMesh.material as THREE.MeshStandardMaterial).transparent =
          true;
        (sheet.backMesh.material as THREE.MeshStandardMaterial).transparent =
          true;
      },
      [applyFlyCurl],
    );

    // Update sheet visual state during flip animation
    const updateFlippingSheet = useCallback(
      (sheet: PageSheet, progress: number, direction: "next" | "prev") => {
        const isNext = direction === "next";

        if (singlePageMode) {
          // In single-page mode, use fly-out/fly-in animation
          if (isNext) {
            applyFlyOut(sheet, progress);
          } else {
            applyFlyIn(sheet, progress);
          }

          sheet.frontMesh.renderOrder = 1000;
          sheet.backMesh.renderOrder = 1000;
          (sheet.frontMesh.material as THREE.Material).depthTest = false;
          (sheet.backMesh.material as THREE.Material).depthTest = false;
        } else {
          // Two-page mode: use page curl animation
          const isCover =
            sheet.frontPageIndex === 1 || sheet.backPageIndex === numPages;
          const hardness = isCover ? coverHardness : pageHardness;

          const frontGeom = sheet.frontMesh.geometry as THREE.BufferGeometry;
          const backGeom = sheet.backMesh.geometry as THREE.BufferGeometry;

          applyPageCurl(frontGeom, progress, isNext, hardness);
          applyPageCurl(backGeom, progress, isNext, hardness);

          sheet.group.rotation.y = 0;
          sheet.group.position.z = 0.01;

          sheet.frontMesh.renderOrder = 1000;
          sheet.backMesh.renderOrder = 1000;
          (sheet.frontMesh.material as THREE.Material).depthTest = false;
          (sheet.backMesh.material as THREE.Material).depthTest = false;
        }
      },
      [
        applyPageCurl,
        applyFlyOut,
        applyFlyIn,
        coverHardness,
        pageHardness,
        numPages,
        singlePageMode,
      ],
    );

    // Initialize Three.js scene
    const initScene = useCallback(() => {
      if (!containerRef.current || isInitialized) return;

      preloadTextures();
      createBaseGeometry();

      const renderer = new THREE.WebGLRenderer({
        antialias,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = shadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      scene.background = parseBackgroundColor(backgroundColor);
      sceneRef.current = scene;

      const aspect = width / height;

      const camera = new THREE.PerspectiveCamera(cameraFov, aspect, 0.1, 100);

      // Initial camera position - will be adjusted in resize effect
      const cameraDistance = 8;
      camera.position.set(0, 0, cameraDistance);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Lighting
      if (lights) {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        // Main directional light (from above-front)
        const mainLight = new THREE.DirectionalLight(
          lightColor,
          lightIntensity,
        );
        mainLight.position.set(2, 8, 10);
        mainLight.castShadow = shadows;

        if (shadows) {
          mainLight.shadow.mapSize.width = 2048;
          mainLight.shadow.mapSize.height = 2048;
          mainLight.shadow.camera.near = 0.5;
          mainLight.shadow.camera.far = 50;
          mainLight.shadow.camera.left = -15;
          mainLight.shadow.camera.right = 15;
          mainLight.shadow.camera.top = 15;
          mainLight.shadow.camera.bottom = -15;
          mainLight.shadow.bias = -0.0001;
          mainLight.shadow.normalBias = 0.02;
        }

        scene.add(mainLight);

        // Secondary light for page shadows
        const secondaryLight = new THREE.DirectionalLight(
          0xffffff,
          lightIntensity * 0.5,
        );
        secondaryLight.position.set(-3, 5, 8);
        secondaryLight.castShadow = shadows;

        if (shadows) {
          secondaryLight.shadow.mapSize.width = 1024;
          secondaryLight.shadow.mapSize.height = 1024;
          secondaryLight.shadow.camera.near = 0.5;
          secondaryLight.shadow.camera.far = 30;
          secondaryLight.shadow.camera.left = -10;
          secondaryLight.shadow.camera.right = 10;
          secondaryLight.shadow.camera.top = 10;
          secondaryLight.shadow.camera.bottom = -10;
          secondaryLight.shadow.bias = -0.0001;
        }

        scene.add(secondaryLight);

        // Soft fill light from below
        const fillLight = new THREE.DirectionalLight(
          0xffffff,
          lightIntensity * 0.2,
        );
        fillLight.position.set(0, -3, 8);
        scene.add(fillLight);

        // Side rim light for depth
        const rimLight = new THREE.DirectionalLight(
          0xffffff,
          lightIntensity * 0.15,
        );
        rimLight.position.set(5, 2, 5);
        scene.add(rimLight);
      }

      // Create book group
      const bookGroup = new THREE.Group();
      scene.add(bookGroup);
      bookGroupRef.current = bookGroup;

      // Create shadow receiving plane (table surface)
      if (shadows) {
        const shadowPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 40),
          new THREE.ShadowMaterial({
            opacity: shadowOpacity,
            color: 0x000000,
          }),
        );
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -referencePageDimensions.height / 2 - 0.5;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);

        // Add a subtle ground plane for ambient occlusion effect
        const groundPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 40),
          new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.95,
            metalness: 0.0,
          }),
        );
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.y = -referencePageDimensions.height / 2 - 0.51;
        groundPlane.receiveShadow = true;
        scene.add(groundPlane);
      }

      // Create book structure (spine, covers, edges)
      createBookStructure();

      // Create all page sheets
      createAllSheets();

      setIsInitialized(true);
    }, [
      width,
      height,
      antialias,
      shadows,
      shadowOpacity,
      lights,
      lightIntensity,
      lightColor,
      backgroundColor,
      isInitialized,
      parseBackgroundColor,
      preloadTextures,
      createBaseGeometry,
      referencePageDimensions,
      createBookStructure,
    ]);

    // Reset sheet position and rotation after fly animation
    const resetSheetTransform = useCallback((sheet: PageSheet) => {
      sheet.group.position.x = 0;
      sheet.group.position.y = 0;
      sheet.group.position.z = 0;
      sheet.group.rotation.x = 0;
      sheet.group.rotation.y = 0;
      sheet.group.rotation.z = 0;
      (sheet.frontMesh.material as THREE.MeshStandardMaterial).opacity = 1;
      (sheet.backMesh.material as THREE.MeshStandardMaterial).opacity = 1;
      (sheet.frontMesh.material as THREE.MeshStandardMaterial).transparent =
        false;
      (sheet.backMesh.material as THREE.MeshStandardMaterial).transparent =
        false;
    }, []);

    // Update all sheet states based on current page
    const updateSheetStates = useCallback(() => {
      const currentPage = currentPageRef.current;
      const totalSheets = pageSheetsRef.current.length;

      if (singlePageMode) {
        // In single-page mode: each sheet is one page
        // Sheet index = page number - 1
        // Show current page on top, and pre-render next page below it

        const nextPage = currentPage + 1;

        pageSheetsRef.current.forEach((sheet, index) => {
          const isFlippingSheet = sheet.isFlipping;
          const sheetPageNumber = index + 1; // 1-indexed

          // Reset render order and depth for non-flipping sheets
          if (!isFlippingSheet) {
            sheet.frontMesh.renderOrder = 0;
            sheet.backMesh.renderOrder = 0;
            (sheet.frontMesh.material as THREE.Material).depthTest = true;
            (sheet.backMesh.material as THREE.Material).depthTest = true;
            // Reset transform
            resetSheetTransform(sheet);
          }

          if (isFlippingSheet) {
            // Animating sheet: keep visible for fly animation
            sheet.group.visible = true;
            sheet.frontMesh.visible = true;
            sheet.backMesh.visible = true;
            return;
          }

          // Show current page on top
          if (sheetPageNumber === currentPage) {
            sheet.group.visible = true;
            sheet.frontMesh.visible = true;
            sheet.backMesh.visible = false; // Back is blank
            sheet.group.position.z = 0.02; // On top
          } else if (sheetPageNumber === nextPage && nextPage <= numPages) {
            // Pre-render next page below current page
            sheet.group.visible = true;
            sheet.frontMesh.visible = true;
            sheet.backMesh.visible = false;
            sheet.group.position.z = 0.01; // Below current page
          } else {
            // Hide all other pages
            sheet.group.visible = false;
          }
        });
      } else {
        // Two-page spread mode
        // In a spread: left page = back of flipped sheet, right page = front of unflipped sheet
        const getSheetFlippedState = (sheetIndex: number): boolean => {
          const backPageOfSheet = (sheetIndex + 1) * 2;
          return currentPage >= backPageOfSheet;
        };

        pageSheetsRef.current.forEach((sheet, index) => {
          const isFlippingSheet = sheet.isFlipping;

          if (!isFlippingSheet) {
            sheet.frontMesh.renderOrder = 0;
            sheet.backMesh.renderOrder = 0;
          }

          sheet.frontMesh.visible = true;
          sheet.backMesh.visible = true;

          const isFlipped = getSheetFlippedState(index);

          if (isFlippingSheet) {
            sheet.group.visible = true;
            sheet.frontMesh.visible = true;
            sheet.backMesh.visible = true;
            return;
          }

          if (isFlipped) {
            resetSheetGeometry(sheet, -Math.PI);
            sheet.group.position.z = (index + 1) * 0.001;
            (sheet.frontMesh.material as THREE.Material).depthTest = true;
            (sheet.backMesh.material as THREE.Material).depthTest = true;
            sheet.group.position.x = 0;
            sheet.group.visible = true;
          } else {
            resetSheetGeometry(sheet, 0);
            sheet.group.position.z = (totalSheets - index) * 0.001;
            (sheet.frontMesh.material as THREE.Material).depthTest = true;
            (sheet.backMesh.material as THREE.Material).depthTest = true;
            sheet.group.position.x = 0;
            sheet.group.visible = true;
          }
        });
      }
    }, [resetSheetGeometry, resetSheetTransform, singlePageMode, numPages]);

    // Create all page sheets
    const createAllSheets = useCallback(() => {
      if (!bookGroupRef.current) return;

      // Clear existing sheets
      pageSheetsRef.current.forEach((sheet) => {
        bookGroupRef.current?.remove(sheet.group);
        sheet.frontMesh.geometry.dispose();
        sheet.backMesh.geometry.dispose();
        (sheet.frontMesh.material as THREE.Material).dispose();
        (sheet.backMesh.material as THREE.Material).dispose();
      });
      pageSheetsRef.current = [];

      // Create sheets
      for (let i = 0; i < numSheets; i++) {
        const sheet = createPageSheet(i);
        pageSheetsRef.current.push(sheet);
        bookGroupRef.current.add(sheet.group);
      }

      // Set initial states
      updateSheetStates();
    }, [numSheets, createPageSheet, updateSheetStates]);

    // Animation loop
    const animate = useCallback(() => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const flipAnim = flipAnimationRef.current;

      if (flipAnim.isFlipping && flipAnim.flippingSheetIndex >= 0) {
        const elapsed = performance.now() - flipAnim.startTime;
        // Faster duration for continuous flipping
        const effectiveDuration = flipAnim.continuousFlip
          ? flipDuration * 0.6
          : flipDuration;
        const rawProgress = clamp(elapsed / effectiveDuration, 0, 1);

        flipAnim.progress = rawProgress;

        const sheet = pageSheetsRef.current[flipAnim.flippingSheetIndex];
        if (sheet && flipAnim.direction) {
          sheet.group.visible = true;
          updateFlippingSheet(sheet, rawProgress, flipAnim.direction);
        }

        // Check if animation is complete
        if (rawProgress >= 1) {
          console.log(
            `[WebGL] Flip complete: targetPage=${flipAnim.targetPage}`,
          );
          if (sheet) {
            sheet.frontMesh.renderOrder = 0;
            sheet.backMesh.renderOrder = 0;
            sheet.group.position.z = 0;
            sheet.isFlipping = false;
            // Re-enable depthTest for proper stacking
            (sheet.frontMesh.material as THREE.Material).depthTest = true;
            (sheet.backMesh.material as THREE.Material).depthTest = true;
          }

          currentPageRef.current = flipAnim.targetPage;
          console.log(
            `[WebGL] currentPageRef updated to ${currentPageRef.current}`,
          );

          // Check if we need to continue flipping
          if (
            flipAnim.continuousFlip &&
            flipAnim.targetPage !== flipAnim.finalTargetPage
          ) {
            // Update states before next flip
            updateSheetStates();

            // Determine direction for next flip
            const nextDirection: "next" | "prev" =
              flipAnim.finalTargetPage > flipAnim.targetPage ? "next" : "prev";

            // Calculate next target
            let nextTargetPage: number;
            let nextSheetIndex: number;

            const totalSheets = pageSheetsRef.current.length;

            if (nextDirection === "next") {
              if (singlePageMode) {
                // In single-page mode: each sheet is one page
                nextSheetIndex = flipAnim.targetPage - 1;
                nextTargetPage = flipAnim.targetPage + 1;
              } else {
                // Find the first unflipped sheet to flip
                let firstUnflippedSheet = -1;
                for (let i = 0; i < totalSheets; i++) {
                  const backPage = (i + 1) * 2;
                  if (flipAnim.targetPage < backPage) {
                    firstUnflippedSheet = i;
                    break;
                  }
                }

                if (firstUnflippedSheet < 0) {
                  nextSheetIndex = -1; // Signal to stop
                  nextTargetPage = numPages;
                } else {
                  nextSheetIndex = firstUnflippedSheet;
                  nextTargetPage = Math.min(
                    (nextSheetIndex + 1) * 2 + 1,
                    numPages,
                  );
                }
              }
            } else {
              if (singlePageMode) {
                // In single-page mode: each sheet is one page
                nextSheetIndex = flipAnim.targetPage - 2;
                nextTargetPage = flipAnim.targetPage - 1;
              } else {
                // Find the most recently flipped sheet to flip back
                let lastFlippedSheet = -1;
                for (let i = 0; i < totalSheets; i++) {
                  const backPage = (i + 1) * 2;
                  if (flipAnim.targetPage >= backPage) {
                    lastFlippedSheet = i;
                  }
                }

                if (lastFlippedSheet < 0) {
                  nextSheetIndex = -1; // Signal to stop
                  nextTargetPage = 1;
                } else {
                  nextSheetIndex = lastFlippedSheet;
                  nextTargetPage = nextSheetIndex * 2 + 1;
                }
              }
            }

            // Start next flip in sequence
            if (
              nextSheetIndex >= 0 &&
              nextSheetIndex < pageSheetsRef.current.length
            ) {
              const nextSheet = pageSheetsRef.current[nextSheetIndex];
              nextSheet.isFlipping = true;
              // Immediately set rendering properties for flipping page
              nextSheet.group.position.z = 0.01;
              nextSheet.frontMesh.renderOrder = 1000;
              nextSheet.backMesh.renderOrder = 1000;
              (nextSheet.frontMesh.material as THREE.Material).depthTest =
                false;
              (nextSheet.backMesh.material as THREE.Material).depthTest = false;
              flipAnim.direction = nextDirection;
              flipAnim.progress = 0;
              flipAnim.fromPage = flipAnim.targetPage;
              flipAnim.targetPage = nextTargetPage;
              flipAnim.startTime = performance.now();
              flipAnim.flippingSheetIndex = nextSheetIndex;

              onPageChange?.(nextTargetPage);
            } else {
              // End continuous flip
              flipAnim.isFlipping = false;
              flipAnim.progress = 0;
              flipAnim.flippingSheetIndex = -1;
              flipAnim.continuousFlip = false;
              updateSheetStates();
              onFlipEnd?.(flipAnim.targetPage);
            }
          } else {
            // Single flip complete or continuous flip finished
            flipAnim.isFlipping = false;
            flipAnim.progress = 0;
            flipAnim.flippingSheetIndex = -1;
            flipAnim.continuousFlip = false;

            updateSheetStates();

            onPageChange?.(flipAnim.targetPage);
            onFlipEnd?.(flipAnim.targetPage);
          }
        }
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }, [
      flipDuration,
      updateFlippingSheet,
      updateSheetStates,
      onPageChange,
      onFlipEnd,
      singlePageMode,
      numPages,
      numSheets,
    ]);

    // Start animation loop
    const startAnimationLoop = useCallback(() => {
      if (animationFrameRef.current) return;
      animate();
    }, [animate]);

    // Start a flip animation
    const startFlip = useCallback(
      (
        direction: "next" | "prev",
        continuous = false,
        finalTarget?: number,
      ) => {
        const flipAnim = flipAnimationRef.current;
        if (flipAnim.isFlipping) {
          console.log("[WebGL] startFlip blocked - already flipping");
          return;
        }

        const current = currentPageRef.current;
        const totalSheets = pageSheetsRef.current.length;

        console.log(
          `[WebGL] startFlip: direction=${direction}, current=${current}, totalSheets=${totalSheets}, numPages=${numPages}, singlePageMode=${singlePageMode}`,
        );

        // Guard: need at least one sheet
        if (totalSheets === 0) {
          console.log("[WebGL] startFlip blocked - no sheets");
          return;
        }

        let targetPage: number;
        let sheetIndex: number;

        if (direction === "next") {
          if (current >= numPages) {
            console.log("[WebGL] startFlip blocked - already at last page");
            return;
          }

          if (singlePageMode) {
            // In single-page mode: each sheet is one page
            // Current page flies out, next page appears
            sheetIndex = current - 1; // Sheet index = page - 1
            targetPage = current + 1;
          } else {
            // Find the first unflipped sheet to flip
            // A sheet is unflipped when currentPage < its back page
            let firstUnflippedSheet = -1;
            for (let i = 0; i < totalSheets; i++) {
              const backPage = (i + 1) * 2;
              if (current < backPage) {
                firstUnflippedSheet = i;
                break;
              }
            }

            if (firstUnflippedSheet < 0) {
              console.log(
                "[WebGL] startFlip blocked - no unflipped sheets found",
              );
              return;
            }

            sheetIndex = firstUnflippedSheet;
            console.log(
              `[WebGL] next: firstUnflippedSheet=${firstUnflippedSheet}`,
            );
            // Target page is the first page after this sheet is flipped
            targetPage = Math.min((sheetIndex + 1) * 2 + 1, numPages);
          }
        } else {
          if (current <= 1) {
            console.log("[WebGL] startFlip blocked - already at first page");
            return;
          }

          if (singlePageMode) {
            // In single-page mode: each sheet is one page
            // Previous page flies in on top
            sheetIndex = current - 2; // The sheet for the previous page
            targetPage = current - 1;
          } else {
            // In spread mode, find the most recently flipped sheet to flip back
            // A sheet is flipped when currentPage >= its back page
            let lastFlippedSheet = -1;
            for (let i = 0; i < totalSheets; i++) {
              const backPage = (i + 1) * 2;
              if (current >= backPage) {
                lastFlippedSheet = i;
              }
            }

            if (lastFlippedSheet < 0) {
              console.log(
                "[WebGL] startFlip blocked - no flipped sheets found",
              );
              return;
            }

            sheetIndex = lastFlippedSheet;
            console.log(`[WebGL] prev: lastFlippedSheet=${lastFlippedSheet}`);
            // Target page is the first page of the sheet we're flipping back
            targetPage = sheetIndex * 2 + 1;
          }
        }

        if (sheetIndex < 0 || sheetIndex >= totalSheets) {
          console.log(
            `[WebGL] startFlip blocked - invalid sheetIndex=${sheetIndex}`,
          );
          return;
        }

        console.log(
          `[WebGL] Starting flip: sheetIndex=${sheetIndex}, targetPage=${targetPage}`,
        );
        onFlipStart?.(targetPage, direction);

        const flippingSheet = pageSheetsRef.current[sheetIndex];
        flippingSheet.isFlipping = true;
        // Immediately set rendering properties for flipping page
        flippingSheet.group.position.z = 0.01;
        flippingSheet.frontMesh.renderOrder = 1000;
        flippingSheet.backMesh.renderOrder = 1000;
        (flippingSheet.frontMesh.material as THREE.Material).depthTest = false;
        (flippingSheet.backMesh.material as THREE.Material).depthTest = false;

        flipAnim.isFlipping = true;
        flipAnim.direction = direction;
        flipAnim.progress = 0;
        flipAnim.fromPage = current;
        flipAnim.targetPage = targetPage;
        flipAnim.startTime = performance.now();
        flipAnim.flippingSheetIndex = sheetIndex;
        flipAnim.continuousFlip = continuous;
        flipAnim.finalTargetPage = finalTarget ?? targetPage;
      },
      [numPages, singlePageMode, onFlipStart],
    );

    // Public methods
    const flipNext = useCallback(() => {
      startFlip("next");
    }, [startFlip]);

    const flipPrev = useCallback(() => {
      startFlip("prev");
    }, [startFlip]);

    const flipToPage = useCallback(
      (page: number) => {
        const target = clamp(page, 1, numPages);
        const current = currentPageRef.current;

        if (target === current) return;

        if (target > current) {
          startFlip("next", true, target);
        } else {
          startFlip("prev", true, target);
        }
      },
      [numPages, startFlip],
    );

    // Flip to first page with continuous animation
    const flipToFirst = useCallback(() => {
      const current = currentPageRef.current;
      if (current <= 1) return;

      startFlip("prev", true, 1);
    }, [startFlip]);

    // Flip to last page with continuous animation
    const flipToLast = useCallback(() => {
      const current = currentPageRef.current;
      if (current >= numPages) return;

      startFlip("next", true, numPages);
    }, [numPages, startFlip]);

    const dispose = useCallback(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Dispose textures
      texturesRef.current.forEach((texture) => texture.dispose());
      texturesRef.current.clear();

      // Dispose base geometry
      if (baseGeometryRef.current) {
        baseGeometryRef.current.dispose();
        baseGeometryRef.current = null;
      }

      // Dispose sheets
      pageSheetsRef.current.forEach((sheet) => {
        sheet.frontMesh.geometry.dispose();
        sheet.backMesh.geometry.dispose();
        (sheet.frontMesh.material as THREE.Material).dispose();
        (sheet.backMesh.material as THREE.Material).dispose();
      });
      pageSheetsRef.current = [];

      // Dispose renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(
            rendererRef.current.domElement,
          );
        }
        rendererRef.current = null;
      }

      sceneRef.current = null;
      cameraRef.current = null;
      bookGroupRef.current = null;

      setIsInitialized(false);
    }, []);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        flipNext,
        flipPrev,
        flipToPage,
        flipToFirst,
        flipToLast,
        isFlipping: () => flipAnimationRef.current.isFlipping,
        dispose,
      }),
      [flipNext, flipPrev, flipToPage, flipToFirst, flipToLast, dispose],
    );

    // Initialize on mount
    useEffect(() => {
      initScene();
      startAnimationLoop();

      return () => {
        dispose();
      };
    }, []);

    // Handle resize and dynamic camera positioning based on current page size
    useEffect(() => {
      if (!rendererRef.current || !cameraRef.current) return;

      rendererRef.current.setSize(width, height);

      const aspect = width / height;

      const camera = cameraRef.current;
      if (!camera) return;
      camera.aspect = aspect;

      // Adjust camera distance based on page dimensions
      const fovRad = (cameraFov * Math.PI) / 180;

      // Use reference dimensions for consistent framing
      const pageWidth = referencePageDimensions.width;
      const pageHeight = referencePageDimensions.height;

      // Calculate the visible area needed
      const effectiveWidth = singlePageMode ? pageWidth : pageWidth * 2;
      const effectiveHeight = pageHeight;

      // Calculate camera distance to fit content
      // For vertical FOV camera, we need to check both dimensions
      const halfFovTan = Math.tan(fovRad / 2);

      // Distance needed to fit height in view
      const distanceForHeight = effectiveHeight / 2 / halfFovTan;

      // Distance needed to fit width in view (accounting for aspect ratio)
      // Horizontal FOV = 2 * atan(tan(vFov/2) * aspect)
      const halfHorizontalFovTan = halfFovTan * aspect;
      const distanceForWidth = effectiveWidth / 2 / halfHorizontalFovTan;

      // Use the larger distance to ensure everything fits, plus margin for aesthetics
      const cameraDistance =
        Math.max(distanceForHeight, distanceForWidth) * cameraZoom;

      camera.position.z = cameraDistance;
      camera.position.y = cameraPositionY;
      camera.lookAt(0, cameraLookAtY, 0);

      camera.updateProjectionMatrix();
    }, [
      width,
      height,
      singlePageMode,
      referencePageDimensions,
      cameraZoom,
      cameraFov,
      cameraPositionY,
      cameraLookAtY,
    ]);

    // Update when currentPage prop changes externally
    useEffect(() => {
      if (isInitialized && !flipAnimationRef.current.isFlipping) {
        if (currentPageRef.current !== currentPage) {
          currentPageRef.current = currentPage;
          updateSheetStates();
        }
      }
    }, [currentPage, isInitialized, updateSheetStates]);

    // Recreate sheets when pages change
    useEffect(() => {
      if (isInitialized && bookGroupRef.current) {
        // Clear texture cache when pages change
        texturesRef.current.forEach((texture) => texture.dispose());
        texturesRef.current.clear();

        createAllSheets();
        createBookStructure();
      }
    }, [pages, isInitialized, createAllSheets, createBookStructure]);

    // Handle singlePageMode changes - need to regenerate textures and geometry
    useEffect(() => {
      if (isInitialized && bookGroupRef.current) {
        // Clear texture cache so textures are regenerated with correct dimensions
        texturesRef.current.forEach((texture) => texture.dispose());
        texturesRef.current.clear();

        // Clear base geometry cache so geometry is recreated with correct aspect ratio
        if (baseGeometryRef.current) {
          baseGeometryRef.current.dispose();
          baseGeometryRef.current = null;
        }

        // Recreate all sheets with new textures and geometry
        createAllSheets();
        createBookStructure();
      }
    }, [singlePageMode, isInitialized, createAllSheets, createBookStructure]);

    return (
      <div
        ref={containerRef}
        className="webgl-page-flip-container"
        style={{
          width,
          height,
          position: "relative",
          overflow: "hidden",
        }}
      />
    );
  },
);

WebGLPageFlip.displayName = "WebGLPageFlip";

export default WebGLPageFlip;
