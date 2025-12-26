import { renderHook, act } from "@testing-library/react";
import { useAutoplay } from "../hooks/useAutoplay";

// Mock timers
jest.useFakeTimers();

describe("useAutoplay", () => {
  const defaultOptions = {
    numPages: 10,
    currentPage: 1,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useAutoplay(defaultOptions));

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.interval).toBe(3000);
      expect(result.current.progress).toBe(0);
    });

    it("should initialize with custom interval", () => {
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, interval: 5000 }),
      );

      expect(result.current.interval).toBe(5000);
      expect(result.current.timeRemaining).toBe(5000);
    });

    it("should auto-start when autoStart is true", () => {
      const onStart = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, autoStart: true, onStart }),
      );

      expect(result.current.isPlaying).toBe(true);
      expect(onStart).toHaveBeenCalled();
    });

    it("should not auto-start when autoStart is false", () => {
      const onStart = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, autoStart: false, onStart }),
      );

      expect(result.current.isPlaying).toBe(false);
      expect(onStart).not.toHaveBeenCalled();
    });
  });

  describe("start", () => {
    it("should start autoplay", () => {
      const onStart = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onStart }),
      );

      act(() => {
        result.current.start();
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it("should not restart if already playing", () => {
      const onStart = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onStart }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.start();
      });

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it("should flip to next page after interval", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPageChange, interval: 3000 }),
      );

      act(() => {
        result.current.start();
      });

      expect(onPageChange).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onPageChange).toHaveBeenCalledWith(3); // pageIncrement default is 2
    });

    it("should flip multiple times over multiple intervals", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPageChange }),
      );

      act(() => {
        result.current.start();
      });

      // First flip
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenLastCalledWith(3);

      // Second flip - the hook will keep using initial currentPage (1)
      // since it's not controlled externally in this test
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(onPageChange).toHaveBeenCalledTimes(2);
      // Note: Without updating currentPage prop, it still calculates from 1
      expect(onPageChange).toHaveBeenLastCalledWith(3);
    });
  });

  describe("stop", () => {
    it("should stop autoplay", () => {
      const onStop = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onStop }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it("should prevent further page flips after stop", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPageChange }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.stop();
      });

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe("pause and resume", () => {
    it("should pause autoplay", () => {
      const onPause = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPause }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isPaused).toBe(true);
      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it("should not pause if not playing", () => {
      const onPause = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPause }),
      );

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(false);
      expect(onPause).not.toHaveBeenCalled();
    });

    it("should not pause if already paused", () => {
      const onPause = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPause }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.pause();
      });

      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it("should resume autoplay after pause", () => {
      const onResume = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onResume }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.resume();
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(onResume).toHaveBeenCalledTimes(1);
    });

    it("should not resume if not paused", () => {
      const onResume = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onResume }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.resume();
      });

      expect(onResume).not.toHaveBeenCalled();
    });

    it("should not flip pages while paused", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPageChange }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(1500); // Half the interval
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        jest.advanceTimersByTime(5000); // More than interval
      });

      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe("toggle", () => {
    it("should start if not playing", () => {
      const { result } = renderHook(() => useAutoplay(defaultOptions));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });

    it("should pause if playing", () => {
      const { result } = renderHook(() => useAutoplay(defaultOptions));

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isPaused).toBe(true);
    });

    it("should resume if paused", () => {
      const { result } = renderHook(() => useAutoplay(defaultOptions));

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe("setInterval", () => {
    it("should update the interval", () => {
      const { result } = renderHook(() => useAutoplay(defaultOptions));

      act(() => {
        result.current.setInterval(5000);
      });

      expect(result.current.interval).toBe(5000);
      expect(result.current.timeRemaining).toBe(5000);
    });

    it("should enforce minimum interval of 500ms", () => {
      const { result } = renderHook(() => useAutoplay(defaultOptions));

      act(() => {
        result.current.setInterval(100);
      });

      expect(result.current.interval).toBe(500);
    });

    it("should restart with new interval if playing", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPageChange }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.setInterval(1000);
      });

      expect(result.current.interval).toBe(1000);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onPageChange).toHaveBeenCalled();
    });
  });

  describe("skipNext", () => {
    it("should skip to next page immediately", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPageChange }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.skipNext();
      });

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("should not skip if not playing", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPageChange }),
      );

      act(() => {
        result.current.skipNext();
      });

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should continue autoplay after skip", () => {
      const onPageChange = jest.fn();
      const { result, rerender } = renderHook(
        ({ currentPage }) =>
          useAutoplay({ ...defaultOptions, onPageChange, currentPage }),
        { initialProps: { currentPage: 1 } },
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.skipNext();
      });

      expect(onPageChange).toHaveBeenCalledTimes(1);

      rerender({ currentPage: 3 });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onPageChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("reset", () => {
    it("should stop autoplay and go to first page", () => {
      const onPageChange = jest.fn();
      const onStop = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({
          ...defaultOptions,
          onPageChange,
          onStop,
          currentPage: 5,
        }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(onStop).toHaveBeenCalled();
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it("should go to last page in RTL mode", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({
          ...defaultOptions,
          onPageChange,
          currentPage: 5,
          rightToLeft: true,
        }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.reset();
      });

      expect(onPageChange).toHaveBeenCalledWith(10); // numPages
    });
  });

  describe("loop behavior", () => {
    it("should loop back to first page when reaching end", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({
          ...defaultOptions,
          onPageChange,
          currentPage: 9,
          loop: true,
          pageIncrement: 2,
        }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it("should stop and call onComplete when reaching end without loop", () => {
      const onPageChange = jest.fn();
      const onComplete = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({
          ...defaultOptions,
          onPageChange,
          onComplete,
          currentPage: 9,
          loop: false,
          pageIncrement: 2,
        }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onComplete).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("right-to-left mode", () => {
    it("should decrement pages in RTL mode", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({
          ...defaultOptions,
          onPageChange,
          currentPage: 10,
          rightToLeft: true,
          pageIncrement: 2,
        }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onPageChange).toHaveBeenCalledWith(8);
    });

    it("should loop to last page when reaching start in RTL mode", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({
          ...defaultOptions,
          onPageChange,
          currentPage: 2,
          rightToLeft: true,
          loop: true,
          pageIncrement: 2,
        }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onPageChange).toHaveBeenCalledWith(10); // Goes to numPages
    });

    it("should stop when reaching start in RTL mode without loop", () => {
      const onPageChange = jest.fn();
      const onComplete = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({
          ...defaultOptions,
          onPageChange,
          onComplete,
          currentPage: 2,
          rightToLeft: true,
          loop: false,
          pageIncrement: 2,
        }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onComplete).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("pageIncrement", () => {
    it("should flip by pageIncrement amount", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({
          ...defaultOptions,
          onPageChange,
          currentPage: 1,
          pageIncrement: 1,
        }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("should handle large pageIncrement near end", () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useAutoplay({
          ...defaultOptions,
          onPageChange,
          currentPage: 8,
          pageIncrement: 4,
          loop: true,
        }),
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // 8 + 4 = 12 > 10, so loops to 1
      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe("cleanup", () => {
    it("should clear timers on unmount", () => {
      const onPageChange = jest.fn();
      const { result, unmount } = renderHook(() =>
        useAutoplay({ ...defaultOptions, onPageChange }),
      );

      act(() => {
        result.current.start();
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should have been called 0 times since unmounted
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe("callbacks", () => {
    it("should call all lifecycle callbacks in order", () => {
      const calls: string[] = [];
      const { result } = renderHook(() =>
        useAutoplay({
          ...defaultOptions,
          onStart: () => calls.push("start"),
          onPause: () => calls.push("pause"),
          onResume: () => calls.push("resume"),
          onStop: () => calls.push("stop"),
        }),
      );

      act(() => {
        result.current.start();
      });
      act(() => {
        result.current.pause();
      });
      act(() => {
        result.current.resume();
      });
      act(() => {
        result.current.stop();
      });

      expect(calls).toEqual(["start", "pause", "resume", "stop"]);
    });
  });
});
