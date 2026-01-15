import { describe, it, expect } from 'vitest';
import { parseAnnotations } from './parseAnnotations';

describe('parseAnnotations', () => {
  describe('frontmatter parsing', () => {
    it('should parse basic frontmatter', () => {
      const markdown = `---
version: 2
title: Test Recording
---

## Section: Test Section

### Annotation: Test Annotation
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);
      expect(result.version).toBe(2);
      expect(result.title).toBe('Test Recording');
    });

    it('should use defaults when frontmatter is missing', () => {
      const markdown = `## Section: Test Section

### Annotation: Test Annotation
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);
      expect(result.version).toBe(1);
      expect(result.title).toBe('Annotations');
    });

    it('should parse frontmatter with quotes', () => {
      const markdown = `---
version: 1
title: "Recording with quotes"
---

### Annotation: Test
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);
      expect(result.title).toBe('Recording with quotes');
    });
  });

  describe('section parsing', () => {
    it('should parse sections correctly', () => {
      const markdown = `## Section: First Section

### Annotation: Annotation 1
---
timestamp: 1000
---

## Section: Second Section

### Annotation: Annotation 2
---
timestamp: 2000
---`;

      const result = parseAnnotations(markdown);
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].title).toBe('First Section');
      expect(result.sections[1].title).toBe('Second Section');
    });

    it('should parse section with custom ID', () => {
      const markdown = `## Section: My Section {#custom-id}

### Annotation: Test
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);
      expect(result.sections[0].id).toBe('custom-id');
      expect(result.sections[0].title).toBe('My Section');
    });

    it('should auto-generate section IDs', () => {
      const markdown = `## Section: Getting Started Guide

### Annotation: Test
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);
      expect(result.sections[0].id).toBe('getting-started-guide');
    });

    it('should create default section for annotations without section', () => {
      const markdown = `### Annotation: Test Annotation
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].id).toBe('_default');
      expect(result.sections[0].title).toBe('Annotations');
    });
  });

  describe('annotation parsing', () => {
    it('should parse basic annotation', () => {
      const markdown = `### Annotation: Test Annotation
---
timestamp: 1500
---`;

      const result = parseAnnotations(markdown);
      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0].title).toBe('Test Annotation');
      expect(result.annotations[0].timestamp).toBe(1500);
    });

    it('should parse annotation with custom ID', () => {
      const markdown = `### Annotation: My Annotation {#my-id}
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);
      expect(result.annotations[0].id).toBe('my-id');
      expect(result.annotations[0].title).toBe('My Annotation');
    });

    it('should auto-generate annotation IDs', () => {
      const markdown = `### Annotation: Button Click Event
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);
      expect(result.annotations[0].id).toBe('button-click-event');
    });

    it('should parse annotation with color', () => {
      const markdown = `### Annotation: Test
---
timestamp: 1000
color: \`#FF5733\`
---`;

      const result = parseAnnotations(markdown);
      expect(result.annotations[0].color).toBe('#FF5733');
    });

    it('should parse annotation with autopause', () => {
      const markdown = `### Annotation: Test
---
timestamp: 1000
autopause: true
---`;

      const result = parseAnnotations(markdown);
      expect(result.annotations[0].autopause).toBe(true);
    });

    it('should parse annotation with autopause false', () => {
      const markdown = `### Annotation: Test
---
timestamp: 1000
autopause: false
---`;

      const result = parseAnnotations(markdown);
      expect(result.annotations[0].autopause).toBe(false);
    });

    it('should parse annotation with description', () => {
      const markdown = `### Annotation: Test
---
timestamp: 1000
---

This is a description of the annotation.
It can span multiple lines.`;

      const result = parseAnnotations(markdown);
      expect(result.annotations[0].description).toContain('This is a description');
      expect(result.annotations[0].description).toContain('multiple lines');
    });

    it('should parse annotation with driverjs code', () => {
      const markdown = `### Annotation: Test
---
timestamp: 1000
---

\`\`\`driverjs
driver.highlight({
  element: '.btn',
  popover: { title: 'Button' }
});
\`\`\``;

      const result = parseAnnotations(markdown);
      expect(result.annotations[0].driverJsCode).toContain('driver.highlight');
      expect(result.annotations[0].driverJsCode).toContain('.btn');
    });

    it('should parse annotation with both description and driverjs', () => {
      const markdown = `### Annotation: Test
---
timestamp: 1000
---

This is a description.

\`\`\`driverjs
driver.highlight({ element: '.test' });
\`\`\``;

      const result = parseAnnotations(markdown);
      expect(result.annotations[0].description).toBe('This is a description.');
      expect(result.annotations[0].driverJsCode).toContain('driver.highlight');
    });

    it('should link annotation to its section', () => {
      const markdown = `## Section: Test Section {#test-section}

### Annotation: Test
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);
      expect(result.annotations[0].sectionId).toBe('test-section');
      expect(result.sections[0].annotations).toHaveLength(1);
      expect(result.sections[0].annotations[0].id).toBe(result.annotations[0].id);
    });
  });

  describe('annotation sorting', () => {
    it('should sort annotations by timestamp', () => {
      const markdown = `### Annotation: Third
---
timestamp: 3000
---

### Annotation: First
---
timestamp: 1000
---

### Annotation: Second
---
timestamp: 2000
---`;

      const result = parseAnnotations(markdown);
      expect(result.annotations).toHaveLength(3);
      expect(result.annotations[0].timestamp).toBe(1000);
      expect(result.annotations[1].timestamp).toBe(2000);
      expect(result.annotations[2].timestamp).toBe(3000);
    });
  });

  describe('complex scenarios', () => {
    it('should parse multiple sections with multiple annotations', () => {
      const markdown = `---
version: 1
title: Complex Recording
---

## Section: Introduction

### Annotation: Welcome {#welcome}
---
timestamp: 0
color: \`#2196F3\`
autopause: true
---

Welcome to the recording!

\`\`\`driverjs
driver.highlight({ element: '.welcome' });
\`\`\`

### Annotation: Overview
---
timestamp: 5000
---

## Section: Main Content {#main}

### Annotation: First Step
---
timestamp: 10000
autopause: false
---

This is the first step.

### Annotation: Second Step
---
timestamp: 15000
---`;

      const result = parseAnnotations(markdown);

      // Check frontmatter
      expect(result.version).toBe(1);
      expect(result.title).toBe('Complex Recording');

      // Check sections
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].title).toBe('Introduction');
      expect(result.sections[1].id).toBe('main');

      // Check annotations
      expect(result.annotations).toHaveLength(4);
      expect(result.annotations[0].id).toBe('welcome');
      expect(result.annotations[0].color).toBe('#2196F3');
      expect(result.annotations[0].autopause).toBe(true);
      expect(result.annotations[0].driverJsCode).toContain('driver.highlight');

      // Check annotations are sorted
      expect(result.annotations[0].timestamp).toBeLessThan(result.annotations[1].timestamp);
      expect(result.annotations[1].timestamp).toBeLessThan(result.annotations[2].timestamp);

      // Check section associations
      expect(result.sections[0].annotations).toHaveLength(2);
      expect(result.sections[1].annotations).toHaveLength(2);
    });

    it('should handle empty markdown', () => {
      const result = parseAnnotations('');
      expect(result.version).toBe(1);
      expect(result.title).toBe('Annotations');
      expect(result.sections).toHaveLength(0);
      expect(result.annotations).toHaveLength(0);
    });

    it('should handle markdown with only frontmatter', () => {
      const markdown = `---
version: 2
title: Only Frontmatter
---`;

      const result = parseAnnotations(markdown);
      expect(result.version).toBe(2);
      expect(result.title).toBe('Only Frontmatter');
      expect(result.sections).toHaveLength(0);
      expect(result.annotations).toHaveLength(0);
    });

    it('should handle annotations with special characters in titles', () => {
      const markdown = `### Annotation: Click "Submit" Button!
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);
      expect(result.annotations[0].title).toBe('Click "Submit" Button!');
      expect(result.annotations[0].id).toBe('click-submit-button');
    });

    it('should preserve section order while sorting annotations', () => {
      const markdown = `## Section: First Section

### Annotation: Late annotation
---
timestamp: 5000
---

## Section: Second Section

### Annotation: Early annotation
---
timestamp: 1000
---`;

      const result = parseAnnotations(markdown);

      // Sections should maintain order
      expect(result.sections[0].title).toBe('First Section');
      expect(result.sections[1].title).toBe('Second Section');

      // But annotations in result.annotations should be sorted by timestamp
      expect(result.annotations[0].timestamp).toBe(1000);
      expect(result.annotations[1].timestamp).toBe(5000);

      // Section annotations should stay in their sections
      expect(result.sections[0].annotations[0].timestamp).toBe(5000);
      expect(result.sections[1].annotations[0].timestamp).toBe(1000);
    });
  });
});