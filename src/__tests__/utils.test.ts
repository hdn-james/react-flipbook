import {
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
  generateId,
  formatPageNumber,
  getPageFromHash,
  setPageHash,
  clearHash,
  storage,
  easing,
} from "../utils";

describe("Utils", () => {
  describe("clamp", () => {
    it("should return value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("should return min when value is below range", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("should return max when value is above range", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("should handle equal min and max", () => {
      expect(clamp(5, 5, 5)).toBe(5);
    });
  });

  describe("lerp", () => {
    it("should return start when t is 0", () => {
      expect(lerp(0, 100, 0)).toBe(0);
    });

    it("should return end when t is 1", () => {
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it("should return midpoint when t is 0.5", () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it("should handle negative values", () => {
      expect(lerp(-100, 100, 0.5)).toBe(0);
    });
  });

  describe("degToRad", () => {
    it("should convert 0 degrees to 0 radians", () => {
      expect(degToRad(0)).toBe(0);
    });

    it("should convert 180 degrees to PI radians", () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI);
    });

    it("should convert 360 degrees to 2*PI radians", () => {
      expect(degToRad(360)).toBeCloseTo(Math.PI * 2);
    });

    it("should convert 90 degrees to PI/2 radians", () => {
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    });
  });

  describe("radToDeg", () => {
    it("should convert 0 radians to 0 degrees", () => {
      expect(radToDeg(0)).toBe(0);
    });

    it("should convert PI radians to 180 degrees", () => {
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
    });

    it("should convert 2*PI radians to 360 degrees", () => {
      expect(radToDeg(Math.PI * 2)).toBeCloseTo(360);
    });

    it("should convert PI/2 radians to 90 degrees", () => {
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should debounce function calls", () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should reset timer on subsequent calls", () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      jest.advanceTimersByTime(50);
      debouncedFn();
      jest.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttle", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should throttle function calls", () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should allow calls after throttle period", () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("isNumber", () => {
    it("should return true for numbers", () => {
      expect(isNumber(5)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-5)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it("should return false for NaN", () => {
      expect(isNumber(NaN)).toBe(false);
    });

    it("should return false for non-numbers", () => {
      expect(isNumber("5")).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber({})).toBe(false);
    });
  });

  describe("isMobile", () => {
    it("should return a boolean", () => {
      expect(typeof isMobile()).toBe("boolean");
    });
  });

  describe("isTouchDevice", () => {
    it("should return a boolean", () => {
      expect(typeof isTouchDevice()).toBe("boolean");
    });
  });

  describe("isWebGLSupported", () => {
    it("should return a boolean", () => {
      expect(typeof isWebGLSupported()).toBe("boolean");
    });
  });

  describe("getImageAspectRatio", () => {
    it("should calculate aspect ratio correctly", () => {
      expect(getImageAspectRatio(1920, 1080)).toBeCloseTo(16 / 9);
      expect(getImageAspectRatio(800, 600)).toBeCloseTo(4 / 3);
      expect(getImageAspectRatio(100, 100)).toBe(1);
    });
  });

  describe("calculatePageDimensions", () => {
    it("should fit within container width", () => {
      const result = calculatePageDimensions(800, 600, 0.75, false);
      expect(result.width).toBeLessThanOrEqual(800);
      expect(result.height).toBeLessThanOrEqual(600);
    });

    it("should maintain aspect ratio", () => {
      const aspectRatio = 0.75;
      const result = calculatePageDimensions(800, 600, aspectRatio, false);
      expect(result.width / result.height).toBeCloseTo(aspectRatio);
    });

    it("should handle double page mode", () => {
      const result = calculatePageDimensions(800, 600, 0.75, true);
      expect(result.width).toBeLessThanOrEqual(800);
    });
  });

  describe("generateId", () => {
    it("should generate a string id", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
    });

    it("should use default prefix", () => {
      const id = generateId();
      expect(id.startsWith("flipbook-")).toBe(true);
    });

    it("should use custom prefix", () => {
      const id = generateId("custom");
      expect(id.startsWith("custom-")).toBe(true);
    });

    it("should generate unique ids", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("formatPageNumber", () => {
    it("should format page number correctly", () => {
      expect(formatPageNumber(1, 10)).toBe("1 / 10");
      expect(formatPageNumber(5, 20)).toBe("5 / 20");
    });

    it("should apply offset", () => {
      expect(formatPageNumber(1, 10, 1)).toBe("2 / 11");
      expect(formatPageNumber(5, 20, -1)).toBe("4 / 19");
    });
  });

  describe("URL hash utilities", () => {
    beforeEach(() => {
      window.location.hash = "";
    });

    describe("setPageHash", () => {
      it("should set hash with default prefix", () => {
        setPageHash(5);
        expect(window.location.hash).toBe("#page5");
      });

      it("should set hash with custom prefix", () => {
        setPageHash(5, "p");
        expect(window.location.hash).toBe("#p5");
      });
    });

    describe("getPageFromHash", () => {
      it("should return page number from hash", () => {
        window.location.hash = "#page5";
        expect(getPageFromHash()).toBe(5);
      });

      it("should return null for no hash", () => {
        window.location.hash = "";
        expect(getPageFromHash()).toBe(null);
      });

      it("should return null for invalid hash", () => {
        window.location.hash = "#invalid";
        expect(getPageFromHash()).toBe(null);
      });
    });

    describe("clearHash", () => {
      it("should clear the hash", () => {
        window.location.hash = "#page5";
        clearHash();
        expect(window.location.hash).toBe("");
      });
    });
  });

  describe("storage", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    describe("get", () => {
      it("should return default value when key does not exist", () => {
        expect(storage.get("nonexistent", "default")).toBe("default");
      });

      it("should return stored value when key exists", () => {
        localStorage.setItem("test", JSON.stringify("value"));
        expect(storage.get("test", "default")).toBe("value");
      });

      it("should handle objects", () => {
        const obj = { foo: "bar" };
        localStorage.setItem("test", JSON.stringify(obj));
        expect(storage.get("test", {})).toEqual(obj);
      });
    });

    describe("set", () => {
      it("should store value as JSON", () => {
        storage.set("test", "value");
        expect(localStorage.setItem).toHaveBeenCalledWith(
          "test",
          JSON.stringify("value")
        );
      });

      it("should store objects", () => {
        const obj = { foo: "bar" };
        storage.set("test", obj);
        expect(localStorage.setItem).toHaveBeenCalledWith(
          "test",
          JSON.stringify(obj)
        );
      });
    });

    describe("remove", () => {
      it("should remove key from storage", () => {
        storage.remove("test");
        expect(localStorage.removeItem).toHaveBeenCalledWith("test");
      });
    });
  });

  describe("easing", () => {
    describe("linear", () => {
      it("should return input unchanged", () => {
        expect(easing.linear(0)).toBe(0);
        expect(easing.linear(0.5)).toBe(0.5);
        expect(easing.linear(1)).toBe(1);
      });
    });

    describe("easeInQuad", () => {
      it("should return 0 at t=0", () => {
        expect(easing.easeInQuad(0)).toBe(0);
      });

      it("should return 1 at t=1", () => {
        expect(easing.easeInQuad(1)).toBe(1);
      });

      it("should accelerate", () => {
        expect(easing.easeInQuad(0.5)).toBeLessThan(0.5);
      });
    });

    describe("easeOutQuad", () => {
      it("should return 0 at t=0", () => {
        expect(easing.easeOutQuad(0)).toBe(0);
      });

      it("should return 1 at t=1", () => {
        expect(easing.easeOutQuad(1)).toBe(1);
      });

      it("should decelerate", () => {
        expect(easing.easeOutQuad(0.5)).toBeGreaterThan(0.5);
      });
    });

    describe("easeInOutQuad", () => {
      it("should return 0 at t=0", () => {
        expect(easing.easeInOutQuad(0)).toBe(0);
      });

      it("should return 1 at t=1", () => {
        expect(easing.easeInOutQuad(1)).toBe(1);
      });

      it("should return 0.5 at t=0.5", () => {
        expect(easing.easeInOutQuad(0.5)).toBe(0.5);
      });
    });

    describe("easeInSine", () => {
      it("should return 0 at t=0", () => {
        expect(easing.easeInSine(0)).toBeCloseTo(0);
      });

      it("should return 1 at t=1", () => {
        expect(easing.easeInSine(1)).toBeCloseTo(1);
      });
    });

    describe("easeOutSine", () => {
      it("should return 0 at t=0", () => {
        expect(easing.easeOutSine(0)).toBeCloseTo(0);
      });

      it("should return 1 at t=1", () => {
        expect(easing.easeOutSine(1)).toBeCloseTo(1);
      });
    });

    describe("easeInExpo", () => {
      it("should return 0 at t=0", () => {
        expect(easing.easeInExpo(0)).toBe(0);
      });

      it("should return 1 at t=1", () => {
        expect(easing.easeInExpo(1)).toBe(1);
      });
    });

    describe("easeOutExpo", () => {
      it("should return 0 at t=0", () => {
        expect(easing.easeOutExpo(0)).toBeCloseTo(0);
      });

      it("should return 1 at t=1", () => {
        expect(easing.easeOutExpo(1)).toBe(1);
      });
    });
  });
});
