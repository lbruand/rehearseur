import type { Annotation } from './annotations';

export type NavigationSource =
  | 'keyboard'
  | 'hash'
  | 'playback'
  | 'toc'
  | 'marker'
  | 'progressBar';

export interface NavigateToAnnotationOptions {
  annotation: Annotation;
  source: NavigationSource;
  shouldPause?: boolean;
}
