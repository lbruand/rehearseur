import { useState, useEffect, useCallback, useRef } from 'react';
import type { Annotation } from '../types/annotations';
import type { PlayerInstance } from '../types/player';
import type { NavigateToAnnotationOptions } from '../types/navigation';
import { ANNOTATION_THRESHOLD_MS } from '../types/player';
import { DEFAULT_AUTOPAUSE } from '../constants/annotations';
import { updateUrlHash } from '../utils/playerUtils';
import { CONFIG } from '../constants/config';

export interface UseNavigationProps {
  playerRef: React.RefObject<PlayerInstance | null>;
  annotations: Annotation[];
  iframeElement: HTMLIFrameElement | null;
  activeAnnotation: Annotation | null;
  setActiveAnnotation: (annotation: Annotation | null) => void;
}

export interface UseNavigationResult {
  currentTime: number;
  isPlaying: boolean;
  navigateToAnnotation: (options: NavigateToAnnotationOptions) => void;
  seekTo: (time: number) => void;
  dismissOverlay: () => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  triggeredAnnotationsRef: React.MutableRefObject<Set<string>>;
}

/**
 * Central hook that manages all navigation state and behavior.
 * Provides a unified API for navigating to annotations from any source
 * (keyboard, URL hash, playback, TOC, markers, progress bar).
 */
export function useNavigation({
  playerRef,
  annotations,
  iframeElement,
  activeAnnotation,
  setActiveAnnotation,
}: UseNavigationProps): UseNavigationResult {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const triggeredAnnotationsRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);

  /**
   * Navigate to an annotation with source-specific behavior.
   *
   * | Source       | Shows Overlay | Triggered Set       | Updates Hash | Pauses        |
   * |--------------|--------------|---------------------|--------------|---------------|
   * | keyboard     | If driverJs  | Clear all           | Yes          | Yes           |
   * | hash         | If driverJs  | Mark earlier        | No           | No            |
   * | playback     | If driverJs  | Add one             | Yes          | If autopause  |
   * | toc          | If driverJs  | Clear all           | Yes          | No            |
   * | marker       | If driverJs  | Clear all           | Yes          | No            |
   * | progressBar  | Clear        | Clear after time    | No           | Yes           |
   */
  const navigateToAnnotation = useCallback(
    ({ annotation, source, shouldPause }: NavigateToAnnotationOptions) => {
      if (!playerRef.current) return;

      // Handle triggered annotations based on source
      switch (source) {
        case 'keyboard':
        case 'toc':
        case 'marker':
          // Clear all triggered annotations, then mark current one as triggered
          // so it doesn't re-trigger when playback resumes
          triggeredAnnotationsRef.current.clear();
          triggeredAnnotationsRef.current.add(annotation.id);
          break;
        case 'hash':
          // Mark all annotations at or before target timestamp as triggered
          // This prevents earlier annotations from firing and overwriting the hash
          for (const a of annotations) {
            if (a.timestamp <= annotation.timestamp) {
              triggeredAnnotationsRef.current.add(a.id);
            }
          }
          break;
        case 'playback':
          // Just add this annotation
          triggeredAnnotationsRef.current.add(annotation.id);
          break;
        case 'progressBar':
          // Clear annotations that are after the seek time (handled in handleSeek)
          break;
      }

      // Navigate player to timestamp
      playerRef.current.goto(annotation.timestamp);

      // Update lastTimeRef to prevent backward-seek detection from clearing triggered set
      lastTimeRef.current = annotation.timestamp;

      // Update URL hash based on source
      if (source === 'keyboard' || source === 'toc' || source === 'marker' || source === 'playback') {
        updateUrlHash(annotation.id);
      }

      // Show/hide overlay based on source and driverJsCode
      if (source === 'progressBar') {
        // Progress bar always clears overlay
        setActiveAnnotation(null);
      } else if (annotation.driverJsCode) {
        setActiveAnnotation(annotation);
      } else {
        setActiveAnnotation(null);
      }

      // Handle pause based on source
      if (source === 'keyboard' || shouldPause) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else if (source === 'playback' && (annotation.autopause ?? DEFAULT_AUTOPAUSE)) {
        playerRef.current.pause();
        setIsPlaying(false);
      }
    },
    [annotations, playerRef, setActiveAnnotation]
  );

  /**
   * Seek to a specific time (used by progress bar).
   */
  const seekTo = useCallback(
    (time: number) => {
      if (!playerRef.current) return;

      playerRef.current.goto(time);
      setActiveAnnotation(null);

      // Clear triggered annotations that are after the seek time
      for (const annotation of annotations) {
        if (annotation.timestamp > time) {
          triggeredAnnotationsRef.current.delete(annotation.id);
        }
      }
    },
    [annotations, playerRef, setActiveAnnotation]
  );

  /**
   * Dismiss the active overlay.
   */
  const dismissOverlay = useCallback(() => {
    setActiveAnnotation(null);
  }, [setActiveAnnotation]);

  /**
   * Start playback.
   */
  const play = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.play();
    setIsPlaying(true);
    setActiveAnnotation(null);
  }, [playerRef, setActiveAnnotation]);

  /**
   * Pause playback.
   */
  const pause = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.pause();
    setIsPlaying(false);
  }, [playerRef]);

  /**
   * Toggle play/pause.
   * Uses the player's internal state to avoid stale closure issues.
   */
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;

    // Check the player's actual playing state (not React state which may be stale)
    const playerIsPlaying = playerRef.current.getIsPlaying();

    if (playerIsPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
      setActiveAnnotation(null);
    }
  }, [playerRef, setActiveAnnotation]);

  /**
   * Check for annotation triggers during playback.
   */
  const checkAnnotationTriggers = useCallback(
    (time: number) => {
      // Only check triggers when actually playing
      if (!playerRef.current?.getIsPlaying()) {
        lastTimeRef.current = time;
        return;
      }

      // Detect seeking backward - reset triggered annotations
      if (time < lastTimeRef.current - CONFIG.ANNOTATIONS.SEEKING_BACKWARD_THRESHOLD_MS) {
        triggeredAnnotationsRef.current.clear();
      }
      lastTimeRef.current = time;

      for (const annotation of annotations) {
        // Skip if this annotation is already showing
        if (activeAnnotation?.id === annotation.id) {
          continue;
        }

        const timeDiff = Math.abs(time - annotation.timestamp);
        if (
          timeDiff < ANNOTATION_THRESHOLD_MS &&
          !triggeredAnnotationsRef.current.has(annotation.id)
        ) {
          navigateToAnnotation({
            annotation,
            source: 'playback',
          });
        }
      }
    },
    [annotations, navigateToAnnotation, playerRef, activeAnnotation]
  );

  /**
   * Poll for current time and check annotation triggers.
   */
  useEffect(() => {
    if (!playerRef.current || !iframeElement) return;

    const interval = setInterval(() => {
      const replayer = playerRef.current?.getReplayer?.();
      if (replayer?.getCurrentTime) {
        const time = replayer.getCurrentTime();
        setCurrentTime(time);
        checkAnnotationTriggers(time);
      }
    }, CONFIG.PLAYER.POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkAnnotationTriggers, iframeElement, playerRef]);

  return {
    currentTime,
    isPlaying,
    navigateToAnnotation,
    seekTo,
    dismissOverlay,
    play,
    pause,
    togglePlayPause,
    triggeredAnnotationsRef,
  };
}
