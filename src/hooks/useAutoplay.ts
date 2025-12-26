import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAutoplayOptions {
  /** Total number of pages */
  numPages: number;
  /** Current page number (1-based) */
  currentPage: number;
  /** Interval between page flips in milliseconds */
  interval?: number;
  /** Whether to loop back to the first page after the last */
  loop?: boolean;
  /** Whether to start autoplay automatically */
  autoStart?: boolean;
  /** Number of pages to flip at a time (1 for single, 2 for spread) */
  pageIncrement?: number;
  /** Whether the flipbook is in right-to-left mode */
  rightToLeft?: boolean;
  /** Callback when page should change */
  onPageChange: (page: number) => void;
  /** Callback when autoplay starts */
  onStart?: () => void;
  /** Callback when autoplay stops */
  onStop?: () => void;
  /** Callback when autoplay pauses */
  onPause?: () => void;
  /** Callback when autoplay resumes */
  onResume?: () => void;
  /** Callback when autoplay completes (reaches end without loop) */
  onComplete?: () => void;
}

export interface UseAutoplayReturn {
  /** Whether autoplay is currently active */
  isPlaying: boolean;
  /** Whether autoplay is paused */
  isPaused: boolean;
  /** Current autoplay interval in milliseconds */
  interval: number;
  /** Time remaining until next page flip (ms) */
  timeRemaining: number;
  /** Progress through current interval (0-1) */
  progress: number;
  /** Start autoplay */
  start: () => void;
  /** Stop autoplay completely */
  stop: () => void;
  /** Pause autoplay (can resume) */
  pause: () => void;
  /** Resume paused autoplay */
  resume: () => void;
  /** Toggle between play and pause */
  toggle: () => void;
  /** Set the autoplay interval */
  setInterval: (ms: number) => void;
  /** Skip to next page immediately */
  skipNext: () => void;
  /** Reset autoplay to beginning */
  reset: () => void;
}

export function useAutoplay(options: UseAutoplayOptions): UseAutoplayReturn {
  const {
    numPages,
    currentPage,
    interval: initialInterval = 3000,
    loop = true,
    autoStart = false,
    pageIncrement = 2,
    rightToLeft = false,
    onPageChange,
    onStart,
    onStop,
    onPause,
    onResume,
    onComplete,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [interval, setIntervalState] = useState(initialInterval);
  const [timeRemaining, setTimeRemaining] = useState(initialInterval);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Update progress animation
  const updateProgress = useCallback(() => {
    if (!isPlaying || isPaused) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, interval - elapsed);
    const currentProgress = Math.min(1, elapsed / interval);

    setTimeRemaining(remaining);
    setProgress(currentProgress);

    if (remaining > 0) {
      rafRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying, isPaused, interval]);

  // Calculate next page
  const getNextPage = useCallback((): number | null => {
    if (rightToLeft) {
      // RTL: decrement pages
      const nextPage = currentPage - pageIncrement;
      if (nextPage < 1) {
        return loop ? numPages : null;
      }
      return nextPage;
    } else {
      // LTR: increment pages
      const nextPage = currentPage + pageIncrement;
      if (nextPage > numPages) {
        return loop ? 1 : null;
      }
      return nextPage;
    }
  }, [currentPage, pageIncrement, numPages, loop, rightToLeft]);

  // Flip to next page
  const flipNext = useCallback(() => {
    const nextPage = getNextPage();

    if (nextPage === null) {
      // Reached the end without loop
      setIsPlaying(false);
      setIsPaused(false);
      clearTimers();
      onComplete?.();
      return;
    }

    onPageChange(nextPage);
    startTimeRef.current = Date.now();
    setTimeRemaining(interval);
    setProgress(0);

    // Restart progress animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [getNextPage, onPageChange, interval, clearTimers, onComplete, updateProgress]);

  // Start autoplay
  const start = useCallback(() => {
    if (isPlaying && !isPaused) return;

    clearTimers();
    setIsPlaying(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    setTimeRemaining(interval);
    setProgress(0);

    timerRef.current = setInterval(flipNext, interval);
    rafRef.current = requestAnimationFrame(updateProgress);

    onStart?.();
  }, [isPlaying, isPaused, interval, flipNext, clearTimers, onStart, updateProgress]);

  // Stop autoplay
  const stop = useCallback(() => {
    clearTimers();
    setIsPlaying(false);
    setIsPaused(false);
    setTimeRemaining(interval);
    setProgress(0);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;

    onStop?.();
  }, [clearTimers, interval, onStop]);

  // Pause autoplay
  const pause = useCallback(() => {
    if (!isPlaying || isPaused) return;

    clearTimers();
    setIsPaused(true);
    pausedTimeRef.current = Date.now() - startTimeRef.current;

    onPause?.();
  }, [isPlaying, isPaused, clearTimers, onPause]);

  // Resume autoplay
  const resume = useCallback(() => {
    if (!isPlaying || !isPaused) return;

    setIsPaused(false);

    // Calculate remaining time
    const remainingTime = Math.max(0, interval - pausedTimeRef.current);
    startTimeRef.current = Date.now() - pausedTimeRef.current;

    // Set up new interval
    if (remainingTime > 0) {
      // First, complete the current interval
      timerRef.current = setTimeout(() => {
        flipNext();
        // Then start regular intervals
        timerRef.current = setInterval(flipNext, interval);
      }, remainingTime) as unknown as ReturnType<typeof setInterval>;
    } else {
      flipNext();
      timerRef.current = setInterval(flipNext, interval);
    }

    rafRef.current = requestAnimationFrame(updateProgress);

    onResume?.();
  }, [isPlaying, isPaused, interval, flipNext, updateProgress, onResume]);

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (!isPlaying) {
      start();
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPlaying, isPaused, start, resume, pause]);

  // Set interval
  const setAutoplayInterval = useCallback(
    (ms: number) => {
      const newInterval = Math.max(500, ms); // Minimum 500ms
      setIntervalState(newInterval);

      // If playing, restart with new interval
      if (isPlaying && !isPaused) {
        clearTimers();
        startTimeRef.current = Date.now();
        setTimeRemaining(newInterval);
        setProgress(0);

        timerRef.current = setInterval(flipNext, newInterval);
        rafRef.current = requestAnimationFrame(updateProgress);
      } else {
        setTimeRemaining(newInterval);
      }
    },
    [isPlaying, isPaused, clearTimers, flipNext, updateProgress]
  );

  // Skip to next page immediately
  const skipNext = useCallback(() => {
    if (!isPlaying) return;

    clearTimers();
    flipNext();

    if (!isPaused) {
      timerRef.current = setInterval(flipNext, interval);
    }
  }, [isPlaying, isPaused, interval, flipNext, clearTimers]);

  // Reset to beginning
  const reset = useCallback(() => {
    stop();
    const firstPage = rightToLeft ? numPages : 1;
    onPageChange(firstPage);
  }, [stop, rightToLeft, numPages, onPageChange]);

  // Auto-start on mount if enabled
  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      clearTimers();
    };
  }, []); // Only run on mount

  // Update interval when prop changes
  useEffect(() => {
    if (initialInterval !== interval && !isPlaying) {
      setIntervalState(initialInterval);
      setTimeRemaining(initialInterval);
    }
  }, [initialInterval]);

  // Stop autoplay when reaching end in non-loop mode
  useEffect(() => {
    if (!loop && isPlaying) {
      const isAtEnd = rightToLeft
        ? currentPage <= pageIncrement
        : currentPage >= numPages - pageIncrement + 1;

      if (isAtEnd) {
        // Will stop on next flip attempt
      }
    }
  }, [currentPage, numPages, loop, isPlaying, rightToLeft, pageIncrement]);

  return {
    isPlaying,
    isPaused,
    interval,
    timeRemaining,
    progress,
    start,
    stop,
    pause,
    resume,
    toggle,
    setInterval: setAutoplayInterval,
    skipNext,
    reset,
  };
}

export default useAutoplay;
