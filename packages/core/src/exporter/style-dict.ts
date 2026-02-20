/**
 * Style Dictionary JSON Exporter — generates a token tree
 * compatible with Amazon Style Dictionary.
 */

import type { DesignSystem, Exporter, ExportFile } from '../types/index.js';

export class StyleDictExporter implements Exporter {
  format = 'style-dict';
  extension = '.json';

  /**
   * Generate Style Dictionary JSON.
   */
  export(ds: DesignSystem): ExportFile {
    const tokens: Record<string, unknown> = {};

    // Colors
    if (ds.colors.palette.length > 0) {
      const color: Record<string, unknown> = {};

      // Semantic
      const semantic = ds.colors.semantic;
      if (semantic.primary) color['primary'] = { value: semantic.primary.value.hex, type: 'color' };
      if (semantic.secondary) color['secondary'] = { value: semantic.secondary.value.hex, type: 'color' };
      if (semantic.accent) color['accent'] = { value: semantic.accent.value.hex, type: 'color' };
      if (semantic.danger) color['danger'] = { value: semantic.danger.value.hex, type: 'color' };
      if (semantic.warning) color['warning'] = { value: semantic.warning.value.hex, type: 'color' };
      if (semantic.success) color['success'] = { value: semantic.success.value.hex, type: 'color' };
      if (semantic.info) color['info'] = { value: semantic.info.value.hex, type: 'color' };

      // All palette (grouped)
      for (const group of ds.colors.groups) {
        if (group.colors.length === 1) {
          color[group.name] = { value: group.colors[0]!.value.hex, type: 'color' };
        } else {
          const groupObj: Record<string, unknown> = {};
          for (const c of group.colors) {
            groupObj[c.name] = { value: c.value.hex, type: 'color' };
          }
          color[group.name] = groupObj;
        }
      }

      tokens['color'] = color;
    }

    // Typography
    const font: Record<string, unknown> = {};

    if (ds.typography.fontFamilies.length > 0) {
      const family: Record<string, unknown> = {};
      for (const ff of ds.typography.fontFamilies) {
        family[ff.name] = { value: ff.stack.join(', '), type: 'fontFamily' };
      }
      font['family'] = family;
    }

    if (ds.typography.fontSizes.length > 0) {
      const size: Record<string, unknown> = {};
      for (const fs of ds.typography.fontSizes) {
        size[fs.name.replace('text-', '')] = { value: fs.value, type: 'fontSize' };
      }
      font['size'] = size;
    }

    if (ds.typography.fontWeights.length > 0) {
      const weight: Record<string, unknown> = {};
      for (const fw of ds.typography.fontWeights) {
        weight[String(fw)] = { value: fw, type: 'fontWeight' };
      }
      font['weight'] = weight;
    }

    if (ds.typography.lineHeights.length > 0) {
      const lineHeight: Record<string, unknown> = {};
      for (const lh of ds.typography.lineHeights) {
        lineHeight[lh.name.replace('leading-', '')] = { value: lh.value, type: 'lineHeight' };
      }
      font['lineHeight'] = lineHeight;
    }

    if (Object.keys(font).length > 0) {
      tokens['font'] = font;
    }

    // Spacing
    if (ds.spacing.length > 0) {
      const spacing: Record<string, unknown> = {};
      for (const s of ds.spacing) {
        spacing[s.name.replace('space-', '')] = { value: s.value, type: 'spacing' };
      }
      tokens['spacing'] = spacing;
    }

    // Border Radius
    if (ds.borderRadius.length > 0) {
      const borderRadius: Record<string, unknown> = {};
      for (const r of ds.borderRadius) {
        borderRadius[r.name.replace('radius-', '')] = { value: r.value, type: 'borderRadius' };
      }
      tokens['borderRadius'] = borderRadius;
    }

    // Shadows
    if (ds.shadows.length > 0) {
      const boxShadow: Record<string, unknown> = {};
      for (const s of ds.shadows) {
        boxShadow[s.name] = { value: s.raw, type: 'boxShadow' };
      }
      tokens['boxShadow'] = boxShadow;
    }

    return {
      filename: 'tokens.style-dict.json',
      content: JSON.stringify(tokens, null, 2),
      mimeType: 'application/json',
    };
  }
}
