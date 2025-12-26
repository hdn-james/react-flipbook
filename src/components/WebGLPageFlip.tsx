import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
  useState,
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
  // Sine wave that peaks at 0.5
  return Math.sin(t * Math.PI);
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
    const numSheets = Math.ceil(numPages / 2);

    // Dimensions in world units - page is sized relative to aspect ratio
    const pageWorldWidth = 4;
    const pageWorldHeight = (height / (width / 2)) * pageWorldWidth;

    const parseBackgroundColor = useCallback((color: string): THREE.Color => {
      return new THREE.Color(color);
    }, []);

    // Create a canvas texture from page content
    const createPageTexture = useCallback(
      (pageIndex: number): THREE.Texture => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        // Higher resolution for sharper text/images
        const resolution = 2;
        canvas.width = Math.floor(width / 2) * resolution;
        canvas.height = height * resolution;

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const page = pages[pageIndex - 1];

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;

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
      [pages, width, height],
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

    // Create base geometry (flat page) - reused for all pages
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

        if (!baseGeometryRef.current) return;

        const easedProgress = easeInOutQuart(flipProgress);
        const rotationAngle = isFlippingNext
          ? easedProgress * Math.PI
          : (1 - easedProgress) * Math.PI;

        const curlIntensity = curlEasing(flipProgress);
        const maxCurlAngle = (1 - hardness) * Math.PI * 0.15;
        const curlAngle = curlIntensity * maxCurlAngle;

        for (let i = 0; i < count; i++) {
          const basePos = baseGeometryRef.current!.attributes.position;
          const origX = basePos.getX(i);
          const origY = basePos.getY(i);

          const distFromSpine = origX + pageWorldWidth / 2;
          const normalizedDist = distFromSpine / pageWorldWidth;

          const cosR = Math.cos(rotationAngle);
          const sinR = Math.sin(rotationAngle);

          let finalX = distFromSpine * cosR;
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
            Math.sin((origY / pageWorldHeight) * Math.PI) *
            waveStrength *
            pageWorldHeight;

          positions.setX(i, finalX - pageWorldWidth / 2);
          positions.setY(i, origY + waveY);
          positions.setZ(i, finalZ);
        }

        positions.needsUpdate = true;
        geometry.computeVertexNormals();
      },
      [pageWorldWidth, pageWorldHeight],
    );

    // Create book structure - currently empty, pages handle their own rendering
    const createBookStructure = useCallback(() => {
      // No additional book structure needed - pages render on their own
    }, []);

    // Create a page sheet (front and back mesh in a group)
    const createPageSheet = useCallback(
      (sheetIndex: number): PageSheet => {
        const frontPageIndex = sheetIndex * 2 + 1;
        const backPageIndex = sheetIndex * 2 + 2;

        const frontGeometry = createBaseGeometry().clone();
        const backGeometry = createBaseGeometry().clone();

        const frontTexture = getTexture(frontPageIndex);
        const backTexture = getTexture(backPageIndex);

        if (backTexture) {
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

        const backMaterial = new THREE.MeshStandardMaterial({
          map: backTexture,
          side: THREE.BackSide,
          roughness: pageRoughness,
          metalness: pageMetalness,
          color: 0xffffff,
        });

        const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
        const backMesh = new THREE.Mesh(backGeometry, backMaterial);

        frontMesh.position.x = pageWorldWidth / 2;
        backMesh.position.x = pageWorldWidth / 2;

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
        createBaseGeometry,
        getTexture,
        pageRoughness,
        pageMetalness,
        pageWorldWidth,
        shadows,
      ],
    );

    // Reset a sheet to flat geometry at a specific rotation
    const resetSheetGeometry = useCallback(
      (sheet: PageSheet, rotation: number) => {
        const baseGeom = createBaseGeometry();

        sheet.frontMesh.geometry.dispose();
        sheet.frontMesh.geometry = baseGeom.clone();

        sheet.backMesh.geometry.dispose();
        sheet.backMesh.geometry = baseGeom.clone();

        sheet.group.rotation.y = rotation;
        sheet.group.position.z = 0;
        sheet.baseRotation = rotation;
        sheet.isFlipping = false;
      },
      [createBaseGeometry],
    );

    // Update sheet visual state during flip animation
    const updateFlippingSheet = useCallback(
      (sheet: PageSheet, progress: number, direction: "next" | "prev") => {
        const isNext = direction === "next";

        const isCover =
          sheet.frontPageIndex === 1 || sheet.backPageIndex === numPages;
        const hardness = isCover ? coverHardness : pageHardness;

        const frontGeom = sheet.frontMesh.geometry as THREE.BufferGeometry;
        const backGeom = sheet.backMesh.geometry as THREE.BufferGeometry;

        applyPageCurl(frontGeom, progress, isNext, hardness);
        applyPageCurl(backGeom, progress, isNext, hardness);

        sheet.group.rotation.y = 0;
        // Small z-offset just to separate from stack, combined with renderOrder and depthTest=false
        sheet.group.position.z = 0.01;

        sheet.frontMesh.renderOrder = 1000;
        sheet.backMesh.renderOrder = 1000;

        // Disable depthTest so flipping page always renders on top regardless of z position
        (sheet.frontMesh.material as THREE.Material).depthTest = false;
        (sheet.backMesh.material as THREE.Material).depthTest = false;
      },
      [applyPageCurl, coverHardness, pageHardness, numPages],
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
      const fov = 45;

      const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);

      const cameraDistance = 10;
      const cameraHeight = -1;
      camera.position.set(0, cameraHeight, cameraDistance);
      camera.lookAt(0, 0.5, 0);
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
        shadowPlane.position.y = -pageWorldHeight / 2 - 0.2;
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
        groundPlane.position.y = -pageWorldHeight / 2 - 0.21;
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
      pageWorldHeight,
      createBookStructure,
    ]);

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
    }, [numSheets, createPageSheet]);

    // Update all sheet states based on current page
    const updateSheetStates = useCallback(() => {
      const currentPage = currentPageRef.current;
      const totalSheets = pageSheetsRef.current.length;

      const getSheetFlippedState = (sheetIndex: number): boolean => {
        const backPageOfSheet = (sheetIndex + 1) * 2;
        return currentPage >= backPageOfSheet;
      };

      pageSheetsRef.current.forEach((sheet, index) => {
        if (sheet.isFlipping) return;

        sheet.frontMesh.renderOrder = 0;
        sheet.backMesh.renderOrder = 0;

        const isFlipped = getSheetFlippedState(index);

        if (isFlipped) {
          resetSheetGeometry(sheet, -Math.PI);
          // Stack flipped pages with slight z offset (closer to camera = higher index)
          sheet.group.position.z = (index + 1) * 0.001;
          // Re-enable depthTest for stacked pages
          (sheet.frontMesh.material as THREE.Material).depthTest = true;
          (sheet.backMesh.material as THREE.Material).depthTest = true;
          sheet.group.position.x = 0;

          if (singlePageMode) {
            const currentSpread = Math.floor((currentPage - 1) / 2);
            sheet.group.visible = index >= currentSpread - 1;
          } else {
            sheet.group.visible = true;
          }
        } else {
          resetSheetGeometry(sheet, 0);
          // Stack unflipped pages with slight z offset (closer to camera = lower index)
          sheet.group.position.z = (totalSheets - index) * 0.001;
          // Re-enable depthTest for stacked pages
          (sheet.frontMesh.material as THREE.Material).depthTest = true;
          (sheet.backMesh.material as THREE.Material).depthTest = true;
          sheet.group.position.x = 0;

          if (singlePageMode) {
            const currentSpread = Math.floor((currentPage - 1) / 2);
            sheet.group.visible = index <= currentSpread + 1;
          } else {
            sheet.group.visible = true;
          }
        }
      });
    }, [resetSheetGeometry, singlePageMode]);

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
                nextSheetIndex = Math.floor((flipAnim.targetPage - 1) / 2);
                nextTargetPage = Math.min(flipAnim.targetPage + 1, numPages);
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
                nextSheetIndex = Math.floor((flipAnim.targetPage - 2) / 2);
                if (nextSheetIndex < 0) nextSheetIndex = 0;
                nextTargetPage = Math.max(flipAnim.targetPage - 1, 1);
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
            sheetIndex = Math.floor((current - 1) / 2);
            targetPage = Math.min(current + 1, numPages);
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
            sheetIndex = Math.floor((current - 2) / 2);
            if (sheetIndex < 0) sheetIndex = 0;
            targetPage = Math.max(current - 1, 1);
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
          startFlip("next");
        } else {
          startFlip("prev");
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

    // Handle resize
    useEffect(() => {
      if (!rendererRef.current || !cameraRef.current) return;

      rendererRef.current.setSize(width, height);

      const aspect = width / height;

      const camera = cameraRef.current;
      if (!camera) return;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }, [width, height, pageWorldHeight]);

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
        createAllSheets();
        createBookStructure();
      }
    }, [pages, isInitialized]);

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
