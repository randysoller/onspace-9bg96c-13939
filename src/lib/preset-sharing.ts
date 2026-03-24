/**
 * Preset export/import utilities for sharing chord presets
 * Supports JSON format with validation
 */

import { toast } from 'sonner';
import { logger } from './logger';

export interface PresetExportData {
  version: string;
  exportedAt: number;
  presets: any[];
}

/**
 * Export presets to JSON file
 * @param presets - Array of preset objects to export
 * @param filename - Optional filename (default: presets-{timestamp}.json)
 */
export function exportPresetsToJSON(presets: any[], filename?: string): void {
  try {
    const exportData: PresetExportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      presets,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `fretmaster-presets-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${presets.length} preset(s)`);
    logger.info('Presets exported', { count: presets.length, filename });
  } catch (error) {
    logger.error('Export failed', error);
    toast.error('Failed to export presets');
  }
}

/**
 * Import presets from JSON file
 * @param file - File object from input[type="file"]
 * @returns Promise resolving to array of imported presets
 */
export async function importPresetsFromJSON(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as PresetExportData;

        // Validate format
        if (!data.version || !Array.isArray(data.presets)) {
          throw new Error('Invalid preset file format');
        }

        toast.success(`Imported ${data.presets.length} preset(s)`);
        logger.info('Presets imported', { count: data.presets.length });
        resolve(data.presets);
      } catch (error) {
        logger.error('Import failed', error);
        toast.error('Invalid preset file');
        reject(error);
      }
    };

    reader.onerror = () => {
      logger.error('File read error');
      toast.error('Failed to read file');
      reject(new Error('File read failed'));
    };

    reader.readAsText(file);
  });
}

/**
 * Trigger file input dialog for preset import
 * @param onImport - Callback function with imported presets
 */
export function triggerPresetImport(onImport: (presets: any[]) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        const presets = await importPresetsFromJSON(file);
        onImport(presets);
      } catch (error) {
        // Error already handled in importPresetsFromJSON
      }
    }
  };

  input.click();
}
