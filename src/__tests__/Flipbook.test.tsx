import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import Flipbook from "../components/Flipbook";
import type { FlipbookPage, FlipbookInstance, SkinType } from "../types";

// Mock WebGL support for testing environment (jsdom doesn't have WebGL)
jest.mock("../utils", () => {
  const actual = jest.requireActual("../utils");
  return {
    ...actual,
    isWebGLSupported: jest.fn(() => true),
  };
});

// Mock WebGLPageFlip component since Three.js doesn't work in jsdom
jest.mock("../components/WebGLPageFlip", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef(
      (
        props: {
          pages: Array<{ src: string; title?: string }>;
          currentPage: number;
          onFlipEnd?: (page: number) => void;
          onPageChange?: (page: number) => void;
        },
        ref: React.Ref<unknown>,
      ) => {
        React.useImperativeHandle(ref, () => ({
          flipNext: () => {
            if (props.onFlipEnd) {
              props.onFlipEnd(props.currentPage + 1);
            }
            if (props.onPageChange) {
              props.onPageChange(props.currentPage + 1);
            }
          },
          flipPrev: () => {
            if (props.onFlipEnd) {
              props.onFlipEnd(props.currentPage - 1);
            }
            if (props.onPageChange) {
              props.onPageChange(props.currentPage - 1);
            }
          },
          flipToPage: (page: number) => {
            if (props.onFlipEnd) {
              props.onFlipEnd(page);
            }
            if (props.onPageChange) {
              props.onPageChange(page);
            }
          },
          flipToFirst: () => {
            if (props.onFlipEnd) {
              props.onFlipEnd(1);
            }
            if (props.onPageChange) {
              props.onPageChange(1);
            }
          },
          flipToLast: () => {
            const lastPage = props.pages.length;
            if (props.onFlipEnd) {
              props.onFlipEnd(lastPage);
            }
            if (props.onPageChange) {
              props.onPageChange(lastPage);
            }
          },
          isFlipping: () => false,
          dispose: () => {},
        }));
        return React.createElement(
          "div",
          { "data-testid": "webgl-flipbook" },
          props.pages.map((page, index) =>
            React.createElement("img", {
              key: index,
              src: page.src,
              alt: page.title || `Page ${index + 1}`,
            }),
          ),
        );
      },
    ),
  };
});

// Mock pages for testing
const mockPages: FlipbookPage[] = [
  { src: "page1.jpg", title: "Page 1" },
  { src: "page2.jpg", title: "Page 2" },
  { src: "page3.jpg", title: "Page 3" },
  { src: "page4.jpg", title: "Page 4" },
  { src: "page5.jpg", title: "Page 5" },
];

// Helper to create more pages
const createManyPages = (count: number): FlipbookPage[] => {
  return Array.from({ length: count }, (_, i) => ({
    src: `page${i + 1}.jpg`,
    title: `Page ${i + 1}`,
  }));
};

describe("Flipbook", () => {
  // Helper to render and wait for loading to complete
  const renderFlipbook = async (
    props: React.ComponentProps<typeof Flipbook>,
  ) => {
    const result = render(<Flipbook {...props} />);
    // Wait for initial loading to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return result;
  };

  describe("rendering", () => {
    it("should render without crashing", async () => {
      await renderFlipbook({ pages: mockPages });
      expect(document.querySelector(".react-flipbook")).toBeInTheDocument();
    });

    it("should render with custom className", async () => {
      await renderFlipbook({ pages: mockPages, className: "custom-class" });
      expect(
        document.querySelector(".react-flipbook.custom-class"),
      ).toBeInTheDocument();
    });

    it("should apply custom width and height", async () => {
      const { container } = await renderFlipbook({
        pages: mockPages,
        width: "800px",
        height: "600px",
      });
      const flipbook = container.querySelector(
        ".react-flipbook",
      ) as HTMLElement;
      expect(flipbook.style.width).toBe("800px");
      expect(flipbook.style.height).toBe("600px");
    });

    it("should apply percentage width and height", async () => {
      const { container } = await renderFlipbook({
        pages: mockPages,
        width: "100%",
        height: "50%",
      });
      const flipbook = container.querySelector(
        ".react-flipbook",
      ) as HTMLElement;
      expect(flipbook.style.width).toBe("100%");
      expect(flipbook.style.height).toBe("50%");
    });

    it("should apply custom background color", async () => {
      const { container } = await renderFlipbook({
        pages: mockPages,
        backgroundColor: "rgb(255, 0, 0)",
      });
      const flipbook = container.querySelector(
        ".react-flipbook",
      ) as HTMLElement;
      expect(flipbook.style.backgroundColor).toBe("rgb(255, 0, 0)");
    });

    it("should render pages", async () => {
      await renderFlipbook({ pages: mockPages });
      // WebGL mode renders pages via the mocked WebGLPageFlip component
      const webglFlipbook = screen.getByTestId("webgl-flipbook");
      expect(webglFlipbook).toBeInTheDocument();
    });

    it("should render page images", async () => {
      await renderFlipbook({ pages: mockPages });
      // Images are rendered by the mocked WebGLPageFlip component
      const images = document.querySelectorAll(
        "[data-testid='webgl-flipbook'] img",
      );
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe("themes/skins", () => {
    it("should apply dark theme by default", async () => {
      await renderFlipbook({ pages: mockPages });
      expect(
        document.querySelector(".react-flipbook-theme-dark"),
      ).toBeInTheDocument();
    });

    it("should apply light theme when specified", async () => {
      await renderFlipbook({ pages: mockPages, skin: "light" });
      expect(
        document.querySelector(".react-flipbook-theme-light"),
      ).toBeInTheDocument();
    });

    it("should apply gradient skin", async () => {
      await renderFlipbook({ pages: mockPages, skin: "gradient" as SkinType });
      expect(
        document.querySelector(".react-flipbook-theme-gradient"),
      ).toBeInTheDocument();
    });
  });

  describe("toolbar", () => {
    it("should render toolbar by default", async () => {
      await renderFlipbook({ pages: mockPages });
      expect(
        document.querySelector(".react-flipbook-menu"),
      ).toBeInTheDocument();
    });

    it("should hide toolbar when hideMenu is true", async () => {
      await renderFlipbook({ pages: mockPages, hideMenu: true });
      expect(
        document.querySelector(".react-flipbook-menu"),
      ).not.toBeInTheDocument();
    });

    it("should render navigation buttons", async () => {
      await renderFlipbook({ pages: mockPages });
      expect(screen.getByTitle("First page")).toBeInTheDocument();
      expect(screen.getByTitle("Previous page")).toBeInTheDocument();
      expect(screen.getByTitle("Next page")).toBeInTheDocument();
      expect(screen.getByTitle("Last page")).toBeInTheDocument();
    });

    // Zoom buttons removed from WebGL-only toolbar

    it("should render bookmark button", async () => {
      await renderFlipbook({ pages: mockPages });
      expect(screen.getByTitle("Bookmark")).toBeInTheDocument();
    });

    it("should render fullscreen button", async () => {
      await renderFlipbook({ pages: mockPages });
      expect(screen.getByTitle("Fullscreen")).toBeInTheDocument();
    });

    it("should render page indicator", async () => {
      await renderFlipbook({ pages: mockPages });
      const pageInput = screen.getByLabelText("Current page");
      expect(pageInput).toBeInTheDocument();
    });

    it("should hide specific buttons when disabled", async () => {
      await renderFlipbook({
        pages: mockPages,
        btnFirst: { enabled: false },
        btnLast: { enabled: false },
      });
      expect(screen.queryByTitle("First page")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Last page")).not.toBeInTheDocument();
    });

    it("should use custom button titles", async () => {
      await renderFlipbook({
        pages: mockPages,
        btnFirst: { title: "Go to start" },
        btnLast: { title: "Go to end" },
      });
      expect(screen.getByTitle("Go to start")).toBeInTheDocument();
      expect(screen.getByTitle("Go to end")).toBeInTheDocument();
    });
  });

  describe("side navigation", () => {
    it("should render side navigation buttons by default", async () => {
      await renderFlipbook({ pages: mockPages });
      const prevNav = document.querySelector(".react-flipbook-nav-prev");
      const nextNav = document.querySelector(".react-flipbook-nav-next");
      expect(prevNav).toBeInTheDocument();
      expect(nextNav).toBeInTheDocument();
    });

    it("should hide side navigation when sideNavigationButtons is false", async () => {
      await renderFlipbook({ pages: mockPages, sideNavigationButtons: false });
      const prevNav = document.querySelector(".react-flipbook-nav-prev");
      const nextNav = document.querySelector(".react-flipbook-nav-next");
      expect(prevNav).not.toBeInTheDocument();
      expect(nextNav).not.toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should start on the first page by default", () => {
      render(<Flipbook pages={mockPages} />);
      const pageInput = document.querySelector(
        ".react-flipbook-page-input",
      ) as HTMLInputElement;
      expect(pageInput.value).toBe("1");
    });

    it("should start on specified startPage", () => {
      render(<Flipbook pages={mockPages} startPage={3} />);
      const pageInput = document.querySelector(
        ".react-flipbook-page-input",
      ) as HTMLInputElement;
      expect(pageInput.value).toBe("3");
    });

    it("should clamp startPage to valid range", () => {
      render(<Flipbook pages={mockPages} startPage={100} />);
      const pageInput = document.querySelector(
        ".react-flipbook-page-input",
      ) as HTMLInputElement;
      expect(pageInput.value).toBe("5"); // Last page
    });

    it("should navigate to next page when clicking next button", async () => {
      const onPageFlip = jest.fn();
      render(
        <Flipbook
          pages={mockPages}
          onPageFlip={onPageFlip}
          pageFlipDuration={100}
        />,
      );

      const nextButton = screen.getByTitle("Next page");
      fireEvent.click(nextButton);

      await waitFor(
        () => {
          expect(onPageFlip).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });

    it("should navigate to previous page when clicking prev button", async () => {
      const onPageFlip = jest.fn();
      render(
        <Flipbook
          pages={mockPages}
          startPage={3}
          onPageFlip={onPageFlip}
          pageFlipDuration={100}
        />,
      );

      const prevButton = screen.getByTitle("Previous page");
      fireEvent.click(prevButton);

      await waitFor(
        () => {
          expect(onPageFlip).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });

    it("should navigate to first page when clicking first button", async () => {
      const onPageFlip = jest.fn();
      render(
        <Flipbook
          pages={mockPages}
          startPage={5}
          onPageFlip={onPageFlip}
          pageFlipDuration={100}
        />,
      );

      const firstButton = screen.getByTitle("First page");
      fireEvent.click(firstButton);

      await waitFor(
        () => {
          expect(onPageFlip).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });

    it("should navigate to last page when clicking last button", async () => {
      const onPageFlip = jest.fn();
      render(
        <Flipbook
          pages={mockPages}
          onPageFlip={onPageFlip}
          pageFlipDuration={100}
        />,
      );

      const lastButton = screen.getByTitle("Last page");
      fireEvent.click(lastButton);

      await waitFor(
        () => {
          expect(onPageFlip).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });

    it("should disable prev button on first page", async () => {
      await renderFlipbook({ pages: mockPages, startPage: 1 });
      const prevButton = screen.getByTitle("Previous page");
      expect(prevButton).toBeDisabled();
    });

    it("should disable next button on last page", async () => {
      await renderFlipbook({ pages: mockPages, startPage: 5 });
      const nextButton = screen.getByTitle("Next page");
      expect(nextButton).toBeDisabled();
    });

    it("should update page when input value changes", async () => {
      const onPageFlip = jest.fn();
      render(
        <Flipbook
          pages={mockPages}
          onPageFlip={onPageFlip}
          pageFlipDuration={100}
        />,
      );

      const pageInput = document.querySelector(
        ".react-flipbook-page-input",
      ) as HTMLInputElement;

      fireEvent.change(pageInput, { target: { value: "3" } });

      await waitFor(
        () => {
          expect(onPageFlip).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });
  });

  // Zoom buttons removed from WebGL-only toolbar - zoom tests skipped

  describe("bookmarks", () => {
    it("should toggle bookmark when clicking bookmark button", async () => {
      await renderFlipbook({ pages: mockPages });

      const bookmarkButton = screen.getByTitle("Bookmark");

      await act(async () => {
        fireEvent.click(bookmarkButton);
      });

      // Button should become active
      expect(bookmarkButton).toHaveClass("active");
    });

    it("should toggle bookmark off on second click", async () => {
      // Clear localStorage to ensure clean state
      localStorage.clear();

      const { unmount } = await renderFlipbook({ pages: mockPages });

      const bookmarkButton = screen.getByTitle("Bookmark");

      // First click - add bookmark
      await act(async () => {
        fireEvent.click(bookmarkButton);
      });

      // Second click - remove bookmark
      await act(async () => {
        fireEvent.click(bookmarkButton);
      });

      // After two clicks, bookmark should be toggled off
      // The button should not have the active class
      expect(bookmarkButton.className).not.toContain("active");

      unmount();
    });
  });

  describe("fullscreen", () => {
    it("should have fullscreen button that can be clicked", async () => {
      await renderFlipbook({ pages: mockPages });

      const expandButton = screen.getByTitle("Fullscreen");
      expect(expandButton).toBeInTheDocument();

      // Just verify the button is clickable - fullscreen API may not work in jsdom
      await act(async () => {
        fireEvent.click(expandButton);
      });
    });
  });

  describe("callbacks", () => {
    it("should call onPageFlip with page info", async () => {
      const onPageFlip = jest.fn();
      render(
        <Flipbook
          pages={mockPages}
          onPageFlip={onPageFlip}
          pageFlipDuration={100}
        />,
      );

      const nextButton = screen.getByTitle("Next page");
      fireEvent.click(nextButton);

      await waitFor(
        () => {
          expect(onPageFlip).toHaveBeenCalledWith(
            expect.objectContaining({
              page: expect.any(Number),
              direction: expect.any(String),
            }),
          );
        },
        { timeout: 500 },
      );
    });

    it("should call onPageFlipEnd after page change", async () => {
      const onPageFlipEnd = jest.fn();
      render(
        <Flipbook
          pages={mockPages}
          onPageFlipEnd={onPageFlipEnd}
          pageFlipDuration={100}
        />,
      );

      const nextButton = screen.getByTitle("Next page");
      fireEvent.click(nextButton);

      await waitFor(
        () => {
          expect(onPageFlipEnd).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });

    // Zoom button tests removed - zoom buttons no longer in WebGL-only toolbar
  });

  describe("ref and imperative handle", () => {
    it("should expose instance methods via ref", () => {
      const ref = React.createRef<FlipbookInstance>();
      render(<Flipbook ref={ref} pages={mockPages} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.nextPage).toBe("function");
      expect(typeof ref.current?.prevPage).toBe("function");
      expect(typeof ref.current?.goToPage).toBe("function");
      expect(typeof ref.current?.zoomIn).toBe("function");
      expect(typeof ref.current?.zoomOut).toBe("function");
    });

    it("should navigate using ref methods", async () => {
      const ref = React.createRef<FlipbookInstance>();
      const onPageFlip = jest.fn();
      render(<Flipbook ref={ref} pages={mockPages} onPageFlip={onPageFlip} />);

      await act(async () => {
        ref.current?.nextPage();
      });
      expect(onPageFlip).toHaveBeenCalled();
    });

    it("should have ref with instance object", () => {
      const ref = React.createRef<FlipbookInstance>();
      render(<Flipbook ref={ref} pages={mockPages} startPage={3} />);

      // The ref should be available
      expect(ref.current).not.toBeNull();
    });

    it("should have ref methods available", () => {
      const ref = React.createRef<FlipbookInstance>();
      render(<Flipbook ref={ref} pages={mockPages} />);

      // Just verify methods exist
      expect(ref.current?.zoomIn).toBeDefined();
      expect(ref.current?.zoomOut).toBeDefined();
    });

    it("should have navigation methods via ref", () => {
      const ref = React.createRef<FlipbookInstance>();
      render(<Flipbook ref={ref} pages={mockPages} />);

      expect(ref.current?.goToPage).toBeDefined();
      expect(ref.current?.firstPage).toBeDefined();
      expect(ref.current?.lastPage).toBeDefined();
    });
  });

  describe("right-to-left mode", () => {
    it("should start from last page in RTL mode when startPage is 1", () => {
      // In RTL mode, the concept of "first" page visually is the last page
      // But the component should still respect startPage
      render(<Flipbook pages={mockPages} rightToLeft={true} startPage={1} />);
      const pageInput = document.querySelector(
        ".react-flipbook-page-input",
      ) as HTMLInputElement;
      expect(pageInput.value).toBe("1");
    });
  });

  describe("single page mode", () => {
    it("should render in single page mode", async () => {
      await renderFlipbook({ pages: mockPages, singlePageMode: true });
      expect(
        document.querySelector(".react-flipbook-single-page"),
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should render the flipbook container", async () => {
      await renderFlipbook({ pages: mockPages });
      expect(document.querySelector(".react-flipbook")).toBeInTheDocument();
    });

    it("should eventually hide loader after loading", async () => {
      await renderFlipbook({ pages: mockPages });

      // Wait for loading to complete
      await waitFor(() => {
        const wrapper = document.querySelector(".react-flipbook-wrapper");
        expect(wrapper).toBeInTheDocument();
      });
    });
  });

  describe("empty pages", () => {
    it("should handle empty pages array", async () => {
      await renderFlipbook({ pages: [] });
      expect(document.querySelector(".react-flipbook")).toBeInTheDocument();
    });

    it("should handle pages with empty property", async () => {
      const pagesWithEmpty: FlipbookPage[] = [
        { src: "page1.jpg", title: "Page 1" },
        { src: "page2.jpg", title: "Page 2", empty: true },
        { src: "page3.jpg", title: "Page 3" },
      ];
      await renderFlipbook({ pages: pagesWithEmpty });
      expect(document.querySelector(".react-flipbook")).toBeInTheDocument();
    });
  });

  // HTML content pages test skipped - WebGL renderer handles HTML content differently

  // Zoom indicator tests removed - zoom buttons no longer in WebGL-only toolbar

  describe("accessibility", () => {
    it("should have aria-labels on navigation buttons", () => {
      render(<Flipbook pages={mockPages} />);

      const sideNavPrev = document.querySelector(".react-flipbook-nav-prev");
      const sideNavNext = document.querySelector(".react-flipbook-nav-next");

      expect(sideNavPrev).toHaveAttribute("aria-label", "Previous page");
      expect(sideNavNext).toHaveAttribute("aria-label", "Next page");
    });

    it("should have aria-label on page input", () => {
      render(<Flipbook pages={mockPages} />);

      const pageInput = document.querySelector(".react-flipbook-page-input");
      expect(pageInput).toHaveAttribute("aria-label", "Current page");
    });
  });

  describe("large page counts", () => {
    it("should handle many pages", async () => {
      const manyPages = createManyPages(100);
      await renderFlipbook({ pages: manyPages });
      expect(document.querySelector(".react-flipbook")).toBeInTheDocument();
    });

    it("should navigate through many pages", async () => {
      const manyPages = createManyPages(20);
      const onPageFlip = jest.fn();
      await renderFlipbook({
        pages: manyPages,
        onPageFlip,
        startPage: 10,
        pageFlipDuration: 100,
      });

      const nextButton = screen.getByTitle("Next page");
      fireEvent.click(nextButton);

      await waitFor(
        () => {
          expect(onPageFlip).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });
  });
});
