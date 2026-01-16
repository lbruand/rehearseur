/**
 * Custom hook for safely adding event listeners with automatic cleanup.
 * Handles both window and element event listeners.
 */

import { useEffect, useRef } from 'react';

/**
 * Adds an event listener to the window or a specific element with automatic cleanup.
 * The handler is kept up to date without re-subscribing on every change.
 *
 * @param eventName - Name of the event to listen for
 * @param handler - Event handler function
 * @param element - Target element (defaults to window)
 * @param options - addEventListener options
 *
 * @example
 * // Listen for window resize
 * useEventListener('resize', () => console.log('Resized!'));
 *
 * @example
 * // Listen for click on a specific element
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * useEventListener('click', handleClick, buttonRef.current);
 *
 * @example
 * // Use capture phase
 * useEventListener('keydown', handleKeyDown, window, { capture: true });
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement | null = window,
  options?: AddEventListenerOptions
): void {
  // Store handler in a ref so we can update it without re-subscribing
  const savedHandler = useRef(handler);

  // Update ref when handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Bail if no element to attach to
    if (!element) return;

    // Create event listener that calls current handler
    const eventListener = (event: Event) =>
      savedHandler.current(event as WindowEventMap[K]);

    element.addEventListener(eventName, eventListener, options);

    // Cleanup
    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}