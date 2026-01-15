import { useEffect, useState, useCallback } from 'react';
import type { Annotation } from '../types/annotations';

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

export function AnnotationMarkers({
  annotations,
  totalDuration,
  onMarkerClick,
  showControls,
}: AnnotationMarkersProps) {
  const [progressBarBounds, setProgressBarBounds] = useState<ProgressBarBounds | null>(null);

  const updateProgressBarBounds = useCallback(() => {
    // Find the progress bar element in rrweb player
    const progressBar = document.querySelector('.rr-progress');
    if (progressBar) {
      const rect = progressBar.getBoundingClientRect();
      // Only update if we get valid bounds (element is visible)
      if (rect.width > 0) {
        // Position at the vertical center of the progress bar
        setProgressBarBounds({
          left: rect.left,
          width: rect.width,
          top: rect.top + rect.height / 2,
        });
      }
    }
  }, []);

  useEffect(() => {
    // Update bounds when controls visibility changes
    if (showControls) {
      // Small delay to let the animation complete (300ms animation + buffer)
      const timer = setTimeout(updateProgressBarBounds, 350);
      return () => clearTimeout(timer);
    }
  }, [showControls, updateProgressBarBounds]);

  // Also try to update immediately if we don't have bounds yet
  useEffect(() => {
    if (showControls && !progressBarBounds) {
      const interval = setInterval(() => {
        const progressBar = document.querySelector('.rr-progress');
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect();
          if (rect.width > 0) {
            setProgressBarBounds({
              left: rect.left,
              width: rect.width,
              top: rect.top + rect.height / 2,
            });
            clearInterval(interval);
          }
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [showControls, progressBarBounds]);

  useEffect(() => {
    // Update on resize
    window.addEventListener('resize', updateProgressBarBounds);
    return () => window.removeEventListener('resize', updateProgressBarBounds);
  }, [updateProgressBarBounds]);

  // Only show markers when controls are visible and we have valid bounds
  if (totalDuration <= 0 || annotations.length === 0 || !showControls || !progressBarBounds) {
    return null;
  }

  return (
    <div
      className="annotation-markers"
      style={{
        left: progressBarBounds.left,
        width: progressBarBounds.width,
        top: progressBarBounds.top,
      }}
    >
      {annotations.map((annotation) => {
        const percentage = (annotation.timestamp / totalDuration) * 100;
        return (
          <div
            key={annotation.id}
            className="annotation-marker"
            style={{
              left: `${percentage}%`,
              backgroundColor: annotation.color || '#2196F3',
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
