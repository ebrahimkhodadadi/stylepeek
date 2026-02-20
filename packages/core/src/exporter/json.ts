/**
 * JSON Exporter — raw design system dump as JSON.
 */

import type { DesignSystem, Exporter, ExportFile } from '../types/index.js';

export class JsonExporter implements Exporter {
  format = 'json';
  extension = '.json';

  /**
   * Export the complete design system as JSON.
   */
  export(ds: DesignSystem): ExportFile {
    return {
      filename: 'design-system.json',
      content: JSON.stringify(ds, null, 2),
      mimeType: 'application/json',
    };
  }
}
