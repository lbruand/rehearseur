import { useState, useCallback } from 'react';
import { useAnnotations } from '../hooks/useAnnotations';
import { usePlayerInstance } from '../hooks/usePlayerInstance';
import { useNavigation } from '../hooks/useNavigation';
import { useUrlHashNavigation } from '../hooks/useUrlHashNavigation';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AnnotationMarkers } from './AnnotationMarkers';
import { TableOfContents } from './TableOfContents';
import { AnnotationOverlay } from './AnnotationOverlay';
import type { Annotation } from '../types/annotations';

interface RrwebPlayerProps {
  recordingUrl: string;
  annotationsUrl?: string;
}

export function RrwebPlayer({ recordingUrl, annotationsUrl }: RrwebPlayerProps) {
  // Load annotations
  const { annotations, sections, title } = useAnnotations(annotationsUrl);

  // UI state - kept here to avoid circular dependency with player callbacks
  const [tocOpen, setTocOpen] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);

  // Callback for when play state changes - dismisses overlay when playing
  const handlePlayStateChange = useCallback((isPlaying: boolean) => {
    if (isPlaying) {
      setActiveAnnotation(null);
    }
  }, []);

  // Callback for when user seeks via progress bar - dismisses overlay
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSeek = useCallback((_time: number) => {
    setActiveAnnotation(null);
  }, []);

  // Initialize player instance
  const {
    playerRef,
    containerCallbackRef,
    wrapperRef,
    loading,
    error,
    tooSmall,
    iframeElement,
    totalDuration,
    showControls,
  } = usePlayerInstance({
    recordingUrl,
    onPlayStateChange: handlePlayStateChange,
    onSeek: handleSeek,
  });

  // Central navigation state and handlers
  const navigation = useNavigation({
    playerRef,
    annotations,
    iframeElement,
    activeAnnotation,
    setActiveAnnotation,
  });

  const {
    currentTime,
    navigateToAnnotation,
    dismissOverlay,
  } = navigation;

  // Wrapper functions for child components
  const handleMarkerClick = useCallback(
    (annotation: Annotation) => {
      navigateToAnnotation({ annotation, source: 'marker' });
    },
    [navigateToAnnotation]
  );

  const handleTocClick = useCallback(
    (annotation: Annotation) => {
      navigateToAnnotation({ annotation, source: 'toc' });
    },
    [navigateToAnnotation]
  );

  // Handle URL hash navigation
  useUrlHashNavigation({
    annotations,
    navigation,
    iframeElement,
  });

  // Handle keyboard shortcuts
  useKeyboardShortcuts({
    annotations,
    currentTime,
    navigation,
    iframeElement,
  });

  // Update document title
  useDocumentTitle(title);

  const showPlayer = !loading && !error && !tooSmall;
  const hasAnnotations = annotations.length > 0;

  return (
    <div className="rrweb-player-wrapper" ref={wrapperRef}>
      {loading && <div className="loading">Loading recording...</div>}
      {error && <div className="error">Error: {error}</div>}
      {tooSmall && !loading && !error && (
        <div className="too-small">
          Browser window is too small to display the recording.
          Please resize your window.
        </div>
      )}
      {showPlayer && (
        <>
          <div
            ref={containerCallbackRef}
            className={`player-container ${showControls ? 'show-controls' : ''}`}
          />
          {hasAnnotations && (
            <>
              <AnnotationMarkers
                annotations={annotations}
                totalDuration={totalDuration}
                onMarkerClick={handleMarkerClick}
                showControls={showControls}
              />
              <TableOfContents
                sections={sections}
                annotations={annotations}
                title={title}
                currentTime={currentTime}
                onAnnotationClick={handleTocClick}
                isOpen={tocOpen}
                onToggle={() => setTocOpen((v) => !v)}
              />
              <AnnotationOverlay
                activeAnnotation={activeAnnotation}
                iframeElement={iframeElement}
                onDismiss={dismissOverlay}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
