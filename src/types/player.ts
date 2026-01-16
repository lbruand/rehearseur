import type rrwebPlayer from 'rrweb-player';
import { CONFIG } from '../constants/config';

export interface RecordingDimensions {
  width: number;
  height: number;
}

export type PlayerInstance = rrwebPlayer & {
  $destroy?: () => void;
  goto?: (timeOffset: number, play?: boolean) => void;
  getReplayer?: () => {
    iframe?: HTMLIFrameElement;
    getMetaData?: () => { startTime: number; endTime: number };
    getCurrentTime?: () => number;
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
    off?: (event: string, handler: (...args: unknown[]) => void) => void;
  };
};

// Re-export constants from CONFIG for backward compatibility
export const MIN_DISPLAY_WIDTH = CONFIG.PLAYER.DISPLAY_MIN_WIDTH;
export const MIN_DISPLAY_HEIGHT = CONFIG.PLAYER.DISPLAY_MIN_HEIGHT;
export const ANNOTATION_THRESHOLD_MS = CONFIG.ANNOTATIONS.TRIGGER_THRESHOLD_MS;