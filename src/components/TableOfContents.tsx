import { useState } from 'react';
import type { Annotation, TocSection } from '../types/annotations';

interface TableOfContentsProps {
  sections: TocSection[];
  annotations: Annotation[];
  title: string;
  currentTime: number;
  onAnnotationClick: (annotation: Annotation) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function findActiveAnnotation(annotations: Annotation[], currentTime: number): string | null {
  let active: Annotation | null = null;
  for (const annotation of annotations) {
    if (annotation.timestamp <= currentTime) {
      active = annotation;
    } else {
      break;
    }
  }
  return active?.id ?? null;
}

interface SectionItemProps {
  section: TocSection;
  activeId: string | null;
  onAnnotationClick: (annotation: Annotation) => void;
}

function SectionItem({ section, activeId, onAnnotationClick }: SectionItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasActiveAnnotation = section.annotations.some((a) => a.id === activeId);

  return (
    <div className="toc-section">
      <div
        className={`toc-section-header ${hasActiveAnnotation ? 'has-active' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="toc-section-toggle">{isExpanded ? '\u25BC' : '\u25B6'}</span>
        <span className="toc-section-title">{section.title}</span>
      </div>
      {isExpanded && (
        <div className="toc-section-items">
          {section.annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`toc-item ${annotation.id === activeId ? 'active' : ''}`}
              onClick={() => onAnnotationClick(annotation)}
            >
              <div
                className="toc-item-marker"
                style={{ backgroundColor: annotation.color || '#f44336' }}
              />
              <div className="toc-item-content">
                <div className="toc-item-title">{annotation.title}</div>
                <div className="toc-item-time">{formatTime(annotation.timestamp)}</div>
              </div>
              <div className="toc-item-badges">
                {annotation.autopause && <span className="toc-badge">Pause</span>}
                {annotation.driverJsCode && <span className="toc-badge">Highlight</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TableOfContents({
  sections,
  annotations,
  title,
  currentTime,
  onAnnotationClick,
  isOpen,
  onToggle,
}: TableOfContentsProps) {
  const activeId = findActiveAnnotation(annotations, currentTime);

  return (
    <>
      <button className="toc-toggle" onClick={onToggle} title="Table of Contents">
        {isOpen ? '\u203A' : '\u2039'}
      </button>
      <div className={`toc-panel ${isOpen ? 'open' : ''}`}>
        <div className="toc-header">{title}</div>
        <div className="toc-list">
          {sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              activeId={activeId}
              onAnnotationClick={onAnnotationClick}
            />
          ))}
        </div>
      </div>
    </>
  );
}
