export interface Annotation {
  id: string;
  title: string;
  timestamp: number;
  color?: string;
  autopause?: boolean;
  description?: string;
  driverJsCode?: string;
  sectionId?: string;
}

export interface TocSection {
  id: string;
  title: string;
  annotations: Annotation[];
}

export interface AnnotationFile {
  version: number;
  title: string;
  sections: TocSection[];
  annotations: Annotation[];
}
