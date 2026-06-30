import React, { useState } from 'react';
import { X, Download, FileImage, FileText, Loader2, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportPanelProps {
  dashboardName: string;
  onClose: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ dashboardName, onClose }) => {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png'>('pdf');
  const [exportOptions, setExportOptions] = useState({
    quality: 'high',
    includeDate: true,
    includeTitle: true,
    pageOrientation: 'landscape' as 'landscape' | 'portrait',
    scale: 2
  });

  const handleExport = async () => {
    setExporting(true);
    setExportStatus('idle');

    try {
      // Get the dashboard canvas element
      const dashboardElement = document.getElementById('dashboard-canvas');
      if (!dashboardElement) {
        throw new Error('Dashboard canvas not found');
      }

      // Create a clone to avoid modifying the original
      const clonedElement = dashboardElement.cloneNode(true) as HTMLElement;
      document.body.appendChild(clonedElement);
      
      // Apply export-specific styles
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.backgroundColor = '#0f172a';
      clonedElement.style.padding = '20px';

      // Add title if requested
      if (exportOptions.includeTitle) {
        const titleElement = document.createElement('div');
        titleElement.style.color = 'white';
        titleElement.style.fontSize = '24px';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.marginBottom = '20px';
        titleElement.textContent = dashboardName;
        clonedElement.insertBefore(titleElement, clonedElement.firstChild);
      }

      // Add date if requested
      if (exportOptions.includeDate) {
        const dateElement = document.createElement('div');
        dateElement.style.color = '#94a3b8';
        dateElement.style.fontSize = '14px';
        dateElement.style.marginTop = '10px';
        dateElement.textContent = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
        clonedElement.appendChild(dateElement);
      }

      // Generate canvas
      const canvas = await html2canvas(clonedElement, {
        scale: exportOptions.scale,
        backgroundColor: '#0f172a',
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      // Clean up clone
      document.body.removeChild(clonedElement);

      if (exportFormat === 'png') {
        // Export as PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${dashboardName.replace(/\s+/g, '-')}-${Date.now()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            setExportStatus('success');
          }
        }, 'image/png', exportOptions.quality === 'high' ? 1.0 : 0.8);
      } else {
        // Export as PDF
        const imgData = canvas.toDataURL('image/png', exportOptions.quality === 'high' ? 1.0 : 0.8);
        
        // Calculate PDF dimensions
        const pdfWidth = exportOptions.pageOrientation === 'landscape' ? 297 : 210;
        const pdfHeight = exportOptions.pageOrientation === 'landscape' ? 210 : 297;
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 10;

        const pdf = new jsPDF({
          orientation: exportOptions.pageOrientation,
          unit: 'mm',
          format: 'a4'
        });

        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${dashboardName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
        setExportStatus('success');
      }

      setTimeout(() => {
        setExportStatus('idle');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div 
        className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Export Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`p-4 rounded-lg border transition-all ${
                  exportFormat === 'pdf'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-medium">PDF</div>
                <div className="text-xs mt-1 opacity-70">Document format</div>
              </button>
              <button
                onClick={() => setExportFormat('png')}
                className={`p-4 rounded-lg border transition-all ${
                  exportFormat === 'png'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <FileImage className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-medium">PNG</div>
                <div className="text-xs mt-1 opacity-70">Image format</div>
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              Export Options
            </label>
            
            {/* Quality */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Quality</span>
              <select
                value={exportOptions.quality}
                onChange={(e) => setExportOptions({ ...exportOptions, quality: e.target.value })}
                className="px-3 py-1 bg-slate-900/50 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-blue-400"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </select>
            </div>

            {/* Page Orientation (PDF only) */}
            {exportFormat === 'pdf' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Orientation</span>
                <select
                  value={exportOptions.pageOrientation}
                  onChange={(e) => setExportOptions({ ...exportOptions, pageOrientation: e.target.value as 'landscape' | 'portrait' })}
                  className="px-3 py-1 bg-slate-900/50 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            )}

            {/* Include Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTitle}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeTitle: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-400">Include dashboard title</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.includeDate}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeDate: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-400">Include export date & time</span>
              </label>
            </div>
          </div>

          {/* Status Message */}
          {exportStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Export successful!</span>
            </div>
          )}
          {exportStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <X className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">Export failed. Please try again.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;