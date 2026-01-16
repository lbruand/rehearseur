import { useEffect, useState, useCallback } from 'react';
import type { Annotation } from '../types/annotations';
import { DEFAULT_BOOKMARK_COLOR } from '../constants/annotations';
import { DOM_SELECTORS } from '../constants/selectors';
import { CONFIG } from '../constants/config';
import { useEventListener } from '../hooks/useEventListener';

interface ProgressBarBounds {
  left: number;
  width: number;
  top: number;
}

interface AnnotationMarkersProps {
  annotations: Annotation[];
  totalDuration: number;
  onMarkerClick: (annotation: Annotation) => void;
  showControls: boolean;
}

// Cache bounds between renders so we can show markers immediately
let cachedBounds: ProgressBarBounds | null = null;

export function AnnotationMarkers({
  annotations,
  totalDuration,
  onMarkerClick,
  showControls,
}: AnnotationMarkersProps) {
  const [progressBarBounds, setProgressBarBounds] = useState<ProgressBarBounds | null>(cachedBounds);
  const [isVisible, setIsVisible] = useState(false);

  const updateProgressBarBounds = useCallback(() => {
    // Find the progress bar element in rrweb player
    const progressBar = document.querySelector(DOM_SELECTORS.RR_PROGRESS);
    if (progressBar) {
      const rect = progressBar.getBoundingClientRect();
      // Only update if we get valid bounds (element is visible)
      if (rect.width > 0) {
        const bounds = {
          left: rect.left,
          width: rect.width,
          top: rect.top + rect.height / 2,
        };
        cachedBounds = bounds;
        setProgressBarBounds(bounds);
      }
    }
  }, []);

  useEffect(() => {
    if (showControls) {
      // Defer bounds update to avoid synchronous setState in effect
      const initialBoundsTimer = requestAnimationFrame(() => {
        updateProgressBarBounds();
      });
      // Delay visibility to allow initial render in hidden state, then animate in
      const visibilityTimer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      // Also update bounds after animation completes
      const boundsTimer = setTimeout(updateProgressBarBounds, CONFIG.UI.ANIMATION_DURATION_MS);
      return () => {
        cancelAnimationFrame(initialBoundsTimer);
        cancelAnimationFrame(visibilityTimer);
        clearTimeout(boundsTimer);
      };
    } else {
      // Defer setState to avoid synchronous update in effect
      requestAnimationFrame(() => {
        setIsVisible(false);
      });
    }
  }, [showControls, updateProgressBarBounds]);

  // Update bounds on window resize
  useEventListener('resize', updateProgressBarBounds);

  // Don't render if no annotations or duration
  if (totalDuration <= 0 || annotations.length === 0) {
    return null;
  }

  // Use cached bounds for positioning
  const bounds = progressBarBounds || cachedBounds;

  return (
    <div
      className={`annotation-markers ${isVisible ? 'visible' : ''}`}
      style={
        bounds
          ? {
              left: bounds.left,
              width: bounds.width,
              top: bounds.top,
            }
          : {
              left: '10%',
              right: '10%',
              bottom: 40,
            }
      }
    >
      {annotations.map((annotation) => {
        const percentage = (annotation.timestamp / totalDuration) * 100;
        return (
          <div
            key={annotation.id}
            className="annotation-marker"
            style={{
              left: `${percentage}%`,
              backgroundColor: annotation.color || DEFAULT_BOOKMARK_COLOR,
            }}
            data-title={annotation.title}
            onClick={(e) => {
              e.stopPropagation();
              onMarkerClick(annotation);
            }}
          />
        );
      })}
    </div>
  );
}
