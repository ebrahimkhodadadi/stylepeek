/**
 * Figma Tokens Exporter — generates JSON compatible with the
 * Figma Tokens plugin (Token Studio format).
 */

import type { DesignSystem, Exporter, ExportFile } from '../types/index.js';

export class FigmaExporter implements Exporter {
  format = 'figma';
  extension = '.json';

  /**
   * Generate Figma Tokens JSON.
   */
  export(ds: DesignSystem): ExportFile {
    const global: Record<string, unknown> = {};

    // Colors
    if (ds.colors.palette.length > 0) {
      const colors: Record<string, unknown> = {};

      // Semantic colors
      const semantic = ds.colors.semantic;
      if (semantic.primary) colors['primary'] = { value: semantic.primary.value.hex, type: 'color' };
      if (semantic.secondary) colors['secondary'] = { value: semantic.secondary.value.hex, type: 'color' };
      if (semantic.accent) colors['accent'] = { value: semantic.accent.value.hex, type: 'color' };
      if (semantic.danger) colors['danger'] = { value: semantic.danger.value.hex, type: 'color' };
      if (semantic.warning) colors['warning'] = { value: semantic.warning.value.hex, type: 'color' };
      if (semantic.success) colors['success'] = { value: semantic.success.value.hex, type: 'color' };
      if (semantic.info) colors['info'] = { value: semantic.info.value.hex, type: 'color' };

      // Grouped palette
      for (const group of ds.colors.groups) {
        for (const c of group.colors) {
          colors[c.name] = { value: c.value.hex, type: 'color' };
        }
      }

      global['colors'] = colors;
    }

    // Typography composites
    if (ds.typography.textStyles.length > 0) {
      const typography: Record<string, unknown> = {};
      for (const ts of ds.typography.textStyles) {
        typography[ts.name] = {
          value: {
            fontFamily: ts.fontFamily.split(',')[0]?.trim().replace(/['"]/g, '') ?? 'inherit',
            fontWeight: String(ts.fontWeight),
            fontSize: ts.fontSize,
            lineHeight: ts.lineHeight,
            letterSpacing: ts.letterSpacing,
          },
          type: 'typography',
        };
      }
      global['typography'] = typography;
    }

    // Font families
    if (ds.typography.fontFamilies.length > 0) {
      const fontFamilies: Record<string, unknown> = {};
      for (const ff of ds.typography.fontFamilies) {
        fontFamilies[ff.name] = {
          value: ff.stack[0] ?? ff.raw,
          type: 'fontFamilies',
        };
      }
      global['fontFamilies'] = fontFamilies;
    }

    // Font sizes
    if (ds.typography.fontSizes.length > 0) {
      const fontSizes: Record<string, unknown> = {};
      for (const fs of ds.typography.fontSizes) {
        fontSizes[fs.name.replace('text-', '')] = {
          value: fs.value,
          type: 'fontSizes',
        };
      }
      global['fontSizes'] = fontSizes;
    }

    // Spacing
    if (ds.spacing.length > 0) {
      const spacing: Record<string, unknown> = {};
      for (const s of ds.spacing) {
        spacing[s.name.replace('space-', '')] = {
          value: String(s.numericPx),
          type: 'spacing',
        };
      }
      global['spacing'] = spacing;
    }

    // Border radius
    if (ds.borderRadius.length > 0) {
      const borderRadius: Record<string, unknown> = {};
      for (const r of ds.borderRadius) {
        borderRadius[r.name.replace('radius-', '')] = {
          value: r.value,
          type: 'borderRadius',
        };
      }
      global['borderRadius'] = borderRadius;
    }

    // Shadows
    if (ds.shadows.length > 0) {
      const boxShadow: Record<string, unknown> = {};
      for (const s of ds.shadows) {
        boxShadow[s.name] = {
          value: s.raw,
          type: 'boxShadow',
        };
      }
      global['boxShadow'] = boxShadow;
    }

    const output = { global };

    return {
      filename: 'tokens.figma.json',
      content: JSON.stringify(output, null, 2),
      mimeType: 'application/json',
    };
  }
}
