/**
 * Data Export Page - GDPR Compliance
 * Allows users to export all their practice data
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Download, FileJson, FileSpreadsheet, Info, CheckCircle } from 'lucide-react';
import { exportUserData, downloadExport, type ExportData } from '@/lib/data-export';
import { storageManager } from '@/lib/storage-manager';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';

export default function DataExport() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [storageStats, setStorageStats] = useState<any>(null);

  const handleExport = async (format: 'json' | 'csv') => {
    if (!user) {
      toast.error('You must be logged in to export data');
      return;
    }

    setExporting(true);
    try {
      const data = await exportUserData(user.id);
      setExportData(data);
      downloadExport(data, format);
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleCheckStorage = async () => {
    const stats = await storageManager.getStorageStats();
    setStorageStats(stats);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-black px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-xl font-bold">Data Export</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1">GDPR Data Export</h3>
              <p className="text-xs text-zinc-400">
                Export all your practice data, custom chords, settings, and achievements. 
                This complies with GDPR data portability requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Export Formats</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 text-zinc-950 font-semibold py-4 rounded-lg flex items-center justify-center gap-3 transition-colors min-h-[44px]"
            >
              {exporting ? <LoadingSpinner size="sm" /> : <FileJson className="w-5 h-5" />}
              Export as JSON
            </button>

            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-3 transition-colors min-h-[44px]"
            >
              {exporting ? <LoadingSpinner size="sm" /> : <FileSpreadsheet className="w-5 h-5" />}
              Export as CSV
            </button>
          </div>

          <div className="mt-4 space-y-2 text-xs text-zinc-400">
            <p><strong className="text-white">JSON:</strong> Complete data export with full structure and metadata</p>
            <p><strong className="text-white">CSV:</strong> Spreadsheet-compatible format for analysis</p>
          </div>
        </div>

        {/* Export Summary */}
        {exportData && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-2">Export Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-400">Practice Sessions:</span>
                    <span className="text-white ml-2">{exportData.practiceSessions.length}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Custom Chords:</span>
                    <span className="text-white ml-2">{exportData.customChords.length}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Achievements:</span>
                    <span className="text-white ml-2">{exportData.achievements.length}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Goals:</span>
                    <span className="text-white ml-2">{exportData.goals.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Storage Statistics */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Storage Statistics</h2>
          
          {!storageStats ? (
            <button
              onClick={handleCheckStorage}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition-colors min-h-[44px]"
            >
              Check Storage Usage
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Items Stored:</span>
                <span className="text-white font-semibold">{storageStats.itemCount}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Estimated Size:</span>
                <span className="text-white font-semibold">
                  {(storageStats.estimatedSize / 1024).toFixed(2)} KB
                </span>
              </div>

              {storageStats.quota && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Storage Used:</span>
                    <span className="text-white font-semibold">
                      {(storageStats.quota.usage / 1024 / 1024).toFixed(2)} MB / {(storageStats.quota.quota / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        storageStats.quota.percentage > 90 ? 'bg-red-500' :
                        storageStats.quota.percentage > 70 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(storageStats.quota.percentage, 100)}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-zinc-400">
                    {storageStats.quota.percentage.toFixed(1)}% of quota used
                  </p>
                </>
              )}

              {storageStats.usingMemoryFallback && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-500">
                    ⚠️ Using memory fallback - localStorage quota exceeded
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckStorage}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors mt-2 min-h-[44px]"
              >
                Refresh Statistics
              </button>
            </div>
          )}
        </div>

        {/* Data Privacy Notice */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Data Privacy</h2>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>
              • All data is exported directly from your browser to your device
            </p>
            <p>
              • No data is sent to external servers during export
            </p>
            <p>
              • You have the right to delete your account and all associated data
            </p>
            <p>
              • Exported data can be used to migrate to another service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
