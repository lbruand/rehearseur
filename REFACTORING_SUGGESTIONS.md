# Refactoring Suggestions for Rehearseur

## Executive Summary

The codebase is well-structured overall with good separation of concerns through custom hooks and utilities. However, there are **35+ refactoring opportunities** identified that would improve:
- **Maintainability**: Consolidating magic numbers and reducing duplication
- **Testability**: Breaking down complex functions into smaller, testable units
- **Developer Experience**: Better type safety and documentation
- **Performance**: Event-based updates instead of polling

---

## Priority Refactoring Roadmap

### 🔴 Phase 1: Low-Risk, High-Impact (1-2 days)

These changes provide immediate benefits with minimal risk:

#### 1. Consolidate Magic Numbers into Constants
**Current Problem**: Numbers and strings scattered throughout codebase:
- Animation delays: `350`, `100ms`
- Distance thresholds: `100`, `1000`
- Colors: `#f44336`, `rgba(0, 0, 0, 0.7)`
- DOM selectors: `.rr-progress`, `.rr-controller__btns button`

**Solution**: Create organized constant files:

```typescript
// constants/config.ts
export const CONFIG = {
  RECORDING: {
    DEFAULT_URL: "/recording_jupyterlite.json",
    ANNOTATIONS_SUFFIX: ".annotations.md",
  },
  PLAYER: {
    DISPLAY_MIN_WIDTH: 200,
    DISPLAY_MIN_HEIGHT: 150,
    POLLING_INTERVAL_MS: 100,
  },
  ANNOTATIONS: {
    TRIGGER_THRESHOLD_MS: 100,
    SEEKING_BACKWARD_THRESHOLD_MS: 1000,
  },
  UI: {
    MOUSE_CONTROLS_DISTANCE_PX: 100,
    ANIMATION_DURATION_MS: 350,
    OVERLAY_OPACITY: 0.7,
  },
} as const;

// constants/selectors.ts
export const DOM_SELECTORS = {
  RR_PROGRESS: '.rr-progress',
  RR_CONTROLLER_BTN: '.rr-controller__btns button',
} as const;
```

**Files to change**: `usePlayerInstance.ts`, `AnnotationMarkers.tsx`, `useAnnotationTriggers.ts`, `App.tsx`

#### 2. Extract Utility Functions
**Current Problem**: Helper functions buried in components

**Extract these to `utils/` folder**:
- `formatTime()` from `TableOfContents.tsx` → `utils/formatting.ts`
- `findActiveAnnotation()` from `TableOfContents.tsx` → `utils/annotationUtils.ts`

```typescript
// utils/formatting.ts
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// utils/annotationUtils.ts
export function findActiveAnnotation(
  annotations: Annotation[],
  currentTime: number
): Annotation | undefined {
  return annotations
    .filter(a => a.timestamp <= currentTime)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
}
```

#### 3. Create Custom `useEventListener` Hook
**Current Problem**: Repetitive addEventListener/removeEventListener patterns

```typescript
// hooks/useEventListener.ts
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement = window,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventListener = (event: Event) =>
      savedHandler.current(event as WindowEventMap[K]);

    element.addEventListener(eventName, eventListener, options);
    return () => element.removeEventListener(eventName, eventListener, options);
  }, [eventName, element, options]);
}
```

**Usage in components**:
```typescript
// Before (in usePlayerInstance.ts)
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => { /* ... */ };
  window.addEventListener('mousemove', handleMouseMove);
  return () => window.removeEventListener('mousemove', handleMouseMove);
}, []);

// After
useEventListener('mousemove', (e) => {
  const distanceFromBottom = window.innerHeight - e.clientY;
  setShowControls(distanceFromBottom < CONFIG.UI.MOUSE_CONTROLS_DISTANCE_PX);
});
```

#### 4. Consolidate CSS Variables
**Current Problem**: Hardcoded color values and spacing throughout CSS

```css
/* App.css - Add at top */
:root {
  /* Colors */
  --color-dark-bg: #242424;
  --color-overlay: rgba(0, 0, 0, 0.7);
  --color-text-primary: rgba(255, 255, 255, 0.87);
  --color-text-secondary: rgba(255, 255, 255, 0.5);
  --color-border-light: rgba(255, 255, 255, 0.1);
  --color-button-hover: rgba(255, 255, 255, 0.1);

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;

  /* Animation */
  --animation-duration: 0.3s;
  --animation-easing: ease-in-out;

  /* Z-index layers */
  --z-player-controls: 1000;
  --z-annotation-markers: 1001;
  --z-toc-panel: 1002;
  --z-overlay: 1003;
}

/* Then replace hardcoded values */
.annotation-markers {
  z-index: var(--z-annotation-markers);
  transition: opacity var(--animation-duration) var(--animation-easing);
}
```

---

### 🟡 Phase 2: Medium-Risk, Medium-Impact (2-3 days)

#### 5. Split `usePlayerInstance` Hook
**Current Problem**: Hook has too many responsibilities (187 lines, 8 state variables, 5+ effects)

**Split into**:
```typescript
// hooks/usePlayerSize.ts
export function usePlayerSize(
  recordingDimensions: RecordingDimensions | null,
  wrapperRef: React.RefObject<HTMLDivElement>
) {
  const [playerSize, setPlayerSize] = useState<Size | null>(null);
  const [tooSmall, setTooSmall] = useState(false);
  // Size calculation logic...
  return { playerSize, tooSmall };
}

// hooks/useControlsVisibility.ts
export function useControlsVisibility() {
  const [showControls, setShowControls] = useState(false);
  useEventListener('mousemove', (e) => {
    const distanceFromBottom = window.innerHeight - e.clientY;
    setShowControls(distanceFromBottom < CONFIG.UI.MOUSE_CONTROLS_DISTANCE_PX);
  });
  return { showControls, setShowControls };
}

// hooks/usePlayerIframe.ts
export function usePlayerIframe(playerRef: React.RefObject<PlayerInstance | null>) {
  const [iframeElement, setIframeElement] = useState<HTMLIFrameElement | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  // Iframe management logic...
  return { iframeElement, totalDuration };
}

// hooks/usePlayerInstance.ts (simplified - orchestrates the above)
export function usePlayerInstance(recordingUrl: string) {
  // Coordinate the above hooks
  const { playerSize, tooSmall } = usePlayerSize(recordingDimensions, wrapperRef);
  const { showControls, setShowControls } = useControlsVisibility();
  const { iframeElement, totalDuration } = usePlayerIframe(playerRef);
  // ...
}
```

#### 6. Extract AnnotationMarkers Progress Bar Logic
**Current Problem**: Progress bar coupling and global state (`cachedBounds`)

```typescript
// hooks/useProgressBarTracking.ts
export function useProgressBarTracking(showControls: boolean) {
  const [progressBarBounds, setProgressBarBounds] = useState<ProgressBarBounds | null>(null);

  const updateBounds = useCallback(() => {
    const progressBar = document.querySelector(DOM_SELECTORS.RR_PROGRESS);
    if (progressBar) {
      const rect = progressBar.getBoundingClientRect();
      if (rect.width > 0) {
        setProgressBarBounds({
          left: rect.left,
          width: rect.width,
          top: rect.top + rect.height / 2,
        });
      }
    }
  }, []);

  // Effect logic...
  return { progressBarBounds };
}
```

#### 7. Create Context for Annotation State
**Current Problem**: Prop drilling (`activeAnnotation`, callbacks passed through multiple levels)

```typescript
// contexts/RrwebPlayerContext.tsx
interface RrwebPlayerContextType {
  activeAnnotation: Annotation | null;
  setActiveAnnotation: (annotation: Annotation | null) => void;
  currentTime: number;
  goToAnnotation: (annotation: Annotation) => void;
  playerRef: React.RefObject<PlayerInstance | null>;
  triggeredAnnotationsRef: React.MutableRefObject<Set<string>>;
}

export const RrwebPlayerContext = createContext<RrwebPlayerContextType | null>(null);

export function useRrwebPlayer() {
  const context = useContext(RrwebPlayerContext);
  if (!context) {
    throw new Error('useRrwebPlayer must be used within RrwebPlayerProvider');
  }
  return context;
}

// Usage in RrwebPlayer.tsx
export function RrwebPlayer({ recordingUrl, annotationsUrl }: RrwebPlayerProps) {
  // ... state and hooks ...

  return (
    <RrwebPlayerContext.Provider value={{
      activeAnnotation,
      setActiveAnnotation,
      currentTime,
      goToAnnotation: goToAnnotationWithClear,
      playerRef,
      triggeredAnnotationsRef,
    }}>
      <div className="rrweb-player-wrapper" ref={wrapperRef}>
        {/* Children no longer need these as props */}
      </div>
    </RrwebPlayerContext.Provider>
  );
}

// In child components
function AnnotationMarkers() {
  const { currentTime, goToAnnotation } = useRrwebPlayer();
  // No prop drilling needed!
}
```

#### 8. Extract Driver.js Utilities
**Current Problem**: Driver.js setup embedded in `AnnotationOverlay.tsx`

```typescript
// utils/driverJsUtils.ts
export function createPhantomElement(
  iframeDocument: Document,
  annotationId: string
): HTMLElement {
  const existingPhantom = iframeDocument.querySelector(`[data-annotation-phantom="${annotationId}"]`);
  if (existingPhantom) {
    existingPhantom.remove();
  }

  const phantom = iframeDocument.createElement('div');
  phantom.setAttribute('data-annotation-phantom', annotationId);
  phantom.style.cssText = 'position: absolute; pointer-events: none;';
  iframeDocument.body.appendChild(phantom);
  return phantom;
}

export function transformCoordinates(
  iframeElement: HTMLIFrameElement,
  x: number,
  y: number
): { x: number; y: number } {
  const iframeRect = iframeElement.getBoundingClientRect();
  const iframeContentWindow = iframeElement.contentWindow;

  if (!iframeContentWindow) {
    return { x, y };
  }

  const scaleX = iframeContentWindow.innerWidth / iframeRect.width;
  const scaleY = iframeContentWindow.innerHeight / iframeRect.height;

  return {
    x: x / scaleX,
    y: y / scaleY,
  };
}

export function configureDriver(iframeDocument: Document): Driver {
  return driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    stagePadding: 4,
    stageRadius: 8,
    // ... other config
  });
}
```

#### 9. Reorganize TableOfContents Component
**Current Problem**: Sub-component and helpers mixed in one file

```
src/components/TableOfContents/
├── index.tsx              # Main component
├── SectionItem.tsx        # Extracted sub-component
├── TableOfContents.css    # Styles (if extracted)
└── utils.ts              # formatTime, findActiveAnnotation
```

---

### 🟢 Phase 3: Higher-Risk, Long-Term Improvements (3-5 days)

#### 10. Convert Complex State to `useReducer`
**Current Problem**: 8 related state variables in `usePlayerInstance` are hard to reason about

```typescript
// hooks/usePlayerInstance.ts
type PlayerState = {
  loading: boolean;
  error: string | null;
  ready: boolean;
  tooSmall: boolean;
  recordingDimensions: RecordingDimensions | null;
  playerSize: { width: number; height: number } | null;
  iframeElement: HTMLIFrameElement | null;
  totalDuration: number;
};

type PlayerAction =
  | { type: 'LOADING_START' }
  | { type: 'LOADING_COMPLETE'; dimensions: RecordingDimensions }
  | { type: 'ERROR'; error: string }
  | { type: 'SIZE_CALCULATED'; playerSize: Size; tooSmall: boolean }
  | { type: 'PLAYER_READY'; iframe: HTMLIFrameElement; duration: number };

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'LOADING_START':
      return { ...state, loading: true, error: null };
    case 'LOADING_COMPLETE':
      return { ...state, loading: false, recordingDimensions: action.dimensions };
    // ... other cases
  }
}
```

#### 11. Create Error Handling Abstraction
**Current Problem**: Inconsistent error handling across components

```typescript
// utils/errorHandling.ts
export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface AppError {
  severity: ErrorSeverity;
  message: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

export function handleError(
  error: unknown,
  context?: AppError['context']
): AppError {
  const appError: AppError = {
    severity: 'error',
    message: error instanceof Error ? error.message : 'Unknown error',
    originalError: error,
    context,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[App Error]', appError);
  }

  // Could send to error tracking service in production

  return appError;
}

// hooks/useErrorHandler.ts
export function useErrorHandler() {
  const [errors, setErrors] = useState<AppError[]>([]);

  const reportError = useCallback((error: unknown, context?: Record<string, unknown>) => {
    const appError = handleError(error, context);
    setErrors(prev => [...prev, appError]);
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  return { errors, reportError, clearErrors };
}
```

#### 12. Replace Polling with Event-Based Updates
**Current Problem**: `useAnnotationTriggers` polls every 100ms instead of listening to events

```typescript
// Check if rrweb-player supports events first
useEffect(() => {
  const replayer = playerRef.current?.getReplayer?.();

  // Try event-based first
  if (replayer?.on) {
    const handleTimeUpdate = (time: number) => {
      setCurrentTime(time);
      checkAnnotationTriggers(time);
    };

    replayer.on('timeupdate', handleTimeUpdate);

    return () => {
      replayer.off?.('timeupdate', handleTimeUpdate);
    };
  } else {
    // Fall back to polling if events not supported
    const interval = setInterval(() => {
      const time = replayer?.getCurrentTime?.();
      if (time !== undefined) {
        setCurrentTime(time);
        checkAnnotationTriggers(time);
      }
    }, CONFIG.PLAYER.POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }
}, [playerRef, checkAnnotationTriggers]);
```

#### 13. Add Comprehensive JSDoc Documentation

```typescript
/**
 * Hook that manages the rrweb player instance lifecycle.
 *
 * Handles:
 * - Loading recording data from URL
 * - Calculating and managing player size based on available space
 * - Creating and destroying the player instance
 * - Exposing player controls and state
 *
 * @param recordingUrl - URL to the rrweb recording JSON file
 * @returns Player instance, refs, loading state, and controls
 *
 * @example
 * ```tsx
 * const { playerRef, loading, error } = usePlayerInstance('/recording.json');
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * ```
 */
export function usePlayerInstance(recordingUrl: string): UsePlayerInstanceResult {
  // ...
}
```

#### 14. Add AbortController for Fetch Requests

```typescript
// In useAnnotations.ts
useEffect(() => {
  if (!annotationsUrl) return;

  const controller = new AbortController();

  async function loadAnnotations() {
    try {
      const response = await fetch(annotationsUrl, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch annotations: ${response.statusText}`);
      }

      const markdown = await response.text();
      const parsed = parseAnnotations(markdown);

      setAnnotations(parsed.annotations);
      setSections(parsed.sections);
      setTitle(parsed.title);
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Error loading annotations:', error);
    }
  }

  loadAnnotations();

  return () => controller.abort();
}, [annotationsUrl]);
```

---

## Additional Recommendations

### Type Safety Improvements

```typescript
// types/handlers.ts - Explicit handler types
export type AnnotationClickHandler = (annotation: Annotation) => void;
export type MarkerClickHandler = (annotation: Annotation, event: React.MouseEvent) => void;
export type KeyboardHandler = (event: KeyboardEvent) => void;

// types/ui.ts - UI-specific types
export interface ProgressBarBounds {
  left: number;
  width: number;
  top: number;
}

export interface ControlsState {
  showControls: boolean;
  isVisible: boolean;
}
```

### Testing Improvements

1. **Add tests for new utilities**:
   - `utils/formatting.test.ts`
   - `utils/annotationUtils.test.ts`
   - `utils/driverJsUtils.test.ts`

2. **Add component tests**:
   - Snapshot tests for `TableOfContents`
   - Interaction tests for `AnnotationMarkers`
   - Driver.js integration tests for `AnnotationOverlay`

3. **Add hook tests**:
   - `useEventListener.test.ts`
   - `useProgressBarTracking.test.ts`
   - `useControlsVisibility.test.ts`

---

## Summary

### Quick Wins (Phase 1)
- ✅ Extract magic numbers → **Immediate improvement to maintainability**
- ✅ Create useEventListener hook → **Reduce code duplication**
- ✅ Consolidate CSS variables → **Easier theming**
- ✅ Extract utility functions → **Better reusability**

### Medium Effort (Phase 2)
- 📊 Split complex hooks → **Improved testability**
- 📊 Create context for state → **Reduce prop drilling**
- 📊 Extract Driver.js utils → **Better separation of concerns**
- 📊 Reorganize TableOfContents → **Better file structure**

### Long Term (Phase 3)
- 🔮 useReducer for complex state → **Predictable state updates**
- 🔮 Error handling abstraction → **Better error reporting**
- 🔮 Event-based updates → **Performance improvement**
- 🔮 Comprehensive documentation → **Better developer experience**

**Total Impact**: Approximately **35+ improvements** identified across maintainability, testability, performance, and developer experience.