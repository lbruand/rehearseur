import { useEffect, useRef } from 'react';
import type { Annotation } from '../types/annotations';
import type { UseNavigationResult } from './useNavigation';
import { ANNOTATION_THRESHOLD_MS } from '../types/player';

export interface UseKeyboardShortcutsProps {
  annotations: Annotation[];
  currentTime: number;
  navigation: UseNavigationResult;
  iframeElement: HTMLIFrameElement | null;
}

export function useKeyboardShortcuts({
  annotations,
  currentTime,
  navigation,
  iframeElement,
}: UseKeyboardShortcutsProps): void {
  // Use refs to avoid stale closures and unnecessary effect re-runs
  const navigationRef = useRef(navigation);
  const currentTimeRef = useRef(currentTime);
  const annotationsRef = useRef(annotations);

  // Update refs in an effect to satisfy lint rules
  useEffect(() => {
    navigationRef.current = navigation;
  });
  useEffect(() => {
    currentTimeRef.current = currentTime;
  });
  useEffect(() => {
    annotationsRef.current = annotations;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if user is typing in an input outside the iframe
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const nav = navigationRef.current;
      const time = currentTimeRef.current;
      const annots = annotationsRef.current;

      switch (e.key) {
        case 'ArrowRight': {
          // Skip to next bookmark and pause
          e.preventDefault();
          const nextAnnotation = annots.find(
            (annotation) => annotation.timestamp > time
          );
          if (nextAnnotation) {
            nav.navigateToAnnotation({
              annotation: nextAnnotation,
              source: 'keyboard',
            });
          }
          break;
        }
        case 'ArrowLeft': {
          // Go back to previous bookmark and pause
          e.preventDefault();
          // Find annotations before current time, get the last one
          const previousAnnotations = annots.filter(
            (annotation) => annotation.timestamp < time - ANNOTATION_THRESHOLD_MS
          );
          const previousAnnotation = previousAnnotations[previousAnnotations.length - 1];
          if (previousAnnotation) {
            nav.navigateToAnnotation({
              annotation: previousAnnotation,
              source: 'keyboard',
            });
          }
          break;
        }
        case ' ': {
          // Play/pause toggle
          e.preventDefault();
          nav.togglePlayPause();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Also listen for keyboard events inside the iframe to prevent them from being typed
    if (iframeElement?.contentDocument) {
      iframeElement.contentDocument.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (iframeElement?.contentDocument) {
        iframeElement.contentDocument.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [iframeElement]); // Only re-run when iframeElement changes
}
