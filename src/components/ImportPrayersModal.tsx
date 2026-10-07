import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Upload,
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Check,
  Church as ChurchIcon,
  Flame,
  Lock,
  Globe,
  HelpCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import {
  ParsedPrayerRow,
  parseCSVToPrayerRequests,
  SAMPLE_CSV_CONTENT
} from '../utils/csvParser';
import { ModerationStatus, VisibilityType } from '../types';

export const ImportPrayersModal: React.FC = () => {
  const {
    importModalOpen,
    setImportModalOpen,
    currentChurch,
    churches,
    importPrayerRequestsBatch,
    setActiveTab,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsing & File State
  const [csvRawText, setCsvRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedPrayerRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showRawTextarea, setShowRawTextarea] = useState(false);

  // Settings State
  const [selectedChurchId, setSelectedChurchId] = useState(currentChurch.id);
  const [importStatus, setImportStatus] = useState<ModerationStatus>('approved');
  const [forceVisibility, setForceVisibility] = useState<'keep_csv' | 'church' | 'private'>('keep_csv');

  // Result state
  const [importResult, setImportResult] = useState<{
    success: boolean;
    count: number;
    churchName: string;
  } | null>(null);

  if (!importModalOpen) return null;

  const handleProcessCsvText = (text: string, sourceName?: string) => {
    setCsvRawText(text);
    if (sourceName) setFileName(sourceName);
    const rows = parseCSVToPrayerRequests(text);
    setParsedRows(rows);
    setImportResult(null);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        handleProcessCsvText(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'prayer_requests_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleData = () => {
    handleProcessCsvText(SAMPLE_CSV_CONTENT, 'sample_prayer_requests.csv');
  };

  const handleToggleSelectAll = (select: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  const handleToggleRow = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleDeleteRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReset = () => {
    setCsvRawText('');
    setFileName(null);
    setParsedRows([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.isValid);
    if (selectedRows.length === 0) return;

    const targetChurchObj = churches.find((c) => c.id === selectedChurchId) || currentChurch;

    const batchToImport = selectedRows.map((r) => {
      let finalVisibility: VisibilityType = r.visibility;
      if (forceVisibility === 'church') finalVisibility = 'church';
      if (forceVisibility === 'private') finalVisibility = 'private';

      return {
        title: r.title,
        content: r.content,
        requesterName: r.requesterName,
        requesterEmail: r.requesterEmail,
        requesterPhone: r.requesterPhone,
        category: r.category,
        visibility: finalVisibility,
        isUrgent: r.isUrgent,
        isAnswered: r.isAnswered,
        isAnonymous: r.isAnonymous,
        churchId: targetChurchObj.id,
        status: importStatus,
      };
    });

    const count = importPrayerRequestsBatch(batchToImport);
    setImportResult({
      success: true,
      count,
      churchName: targetChurchObj.name,
    });
  };

  const selectedCount = parsedRows.filter((r) => r.selected && r.isValid).length;
  const targetChurchObj = churches.find((c) => c.id === selectedChurchId) || currentChurch;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-church font-bold text-lg text-white">
                  Import Prayer Requests from CSV
                </h3>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Batch Tool
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Bulk import prayer cards, spreadsheet records, or exports from other church systems.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setImportModalOpen(false);
              handleReset();
            }}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-stone-700">
          {/* SUCCESS BANNER */}
          {importResult && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-950 font-serif-church">
                  Successfully Imported {importResult.count} Prayer Requests!
                </h4>
                <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                  All requests have been added to <strong>{importResult.churchName}</strong> and are ready for prayer and inclusion in the Sunday Bulletin.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    handleReset();
                    setActiveTab('wall');
                  }}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>View on Prayer Wall</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-semibold border border-stone-300 transition-all cursor-pointer"
                >
                  Import Another File
                </button>
              </div>
            </div>
          )}

          {!importResult && (
            <>
              {/* TARGET CHURCH & IMPORT DEFAULTS BAR */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Church selector */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ChurchIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>Target Church</span>
                  </label>
                  <select
                    value={selectedChurchId}
                    onChange={(e) => setSelectedChurchId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {churches.map((church) => (
                      <option key={church.id} value={church.id}>
                        {church.name} ({church.city}, {church.state})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default Status */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Initial Moderation Status
                  </label>
                  <select
                    value={importStatus}
                    onChange={(e) => setImportStatus(e.target.value as ModerationStatus)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="approved">Auto-Approve to Prayer Wall (Live)</option>
                    <option value="flagged">Pending Staff Review (In Moderation Queue)</option>
                  </select>
                </div>

                {/* Visibility override */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Visibility Rule
                  </label>
                  <select
                    value={forceVisibility}
                    onChange={(e) => setForceVisibility(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="keep_csv">Use Visibility in CSV (Church / Private)</option>
                    <option value="church">Force all to Church Wall (Public to Members)</option>
                    <option value="private">Force all to Private (Pastoral Staff Only)</option>
                  </select>
                </div>
              </div>

              {/* UPLOAD & TEMPLATE HELPER */}
              {parsedRows.length === 0 ? (
                <div className="space-y-4">
                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-amber-500 bg-amber-50/50 scale-[0.99]'
                        : 'border-stone-300 hover:border-amber-400 bg-stone-50/50 hover:bg-stone-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                      <Upload className="w-6 h-6 text-amber-700" />
                    </div>

                    <h4 className="text-sm font-bold text-stone-900 mb-1">
                      Choose a CSV file or drag and drop it here
                    </h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                      Supports comma-separated files (.csv) containing Title, Prayer Details, Requester, Category, and Urgency.
                    </p>

                    <button
                      type="button"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 pointer-events-none"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse Files</span>
                    </button>
                  </div>

                  {/* Quick Helper Tools */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-100/70 p-3.5 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadSampleTemplate}
                        className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-lg font-semibold text-xs border border-stone-300 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="Download sample CSV template spreadsheet"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-600" />
                        <span>Download Sample CSV Template</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadSampleData}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-xs border border-amber-300 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="Quickly test with 5 pre-loaded sample prayers"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>⚡ Load 5 Sample Test Prayers</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRawTextarea(!showRawTextarea)}
                      className="text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer underline"
                    >
                      {showRawTextarea ? 'Hide Raw Text Box' : 'Or Paste CSV Text Manually'}
                    </button>
                  </div>

                  {/* Manual Paste Textarea */}
                  {showRawTextarea && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-stone-700">
                          Paste Raw CSV Content Below:
                        </label>
                        <span className="text-[10px] text-stone-400">
                          First line can be column headers
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        value={csvRawText}
                        onChange={(e) => setCsvRawText(e.target.value)}
                        placeholder={`Title,Content,Requester Name,Category,Visibility,Is Urgent\n"Healing for John","Please pray for healing after surgery","Mary","Health & Healing","church","false"`}
                        className="w-full p-3 font-mono text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleProcessCsvText(csvRawText, 'Pasted Text')}
                          disabled={!csvRawText.trim()}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                        >
                          Parse & Preview Requests
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* PREVIEW TABLE OF PARSED ROWS */
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-700" />
                      <span className="font-bold text-amber-950">
                        {fileName || 'CSV File'}:
                      </span>
                      <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full text-[11px]">
                        {parsedRows.length} requests parsed
                      </span>
                      <span className="text-stone-500 text-[11px]">
                        • {selectedCount} selected for import
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectAll(true)}
                        className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-stone-300">•</span>
                      <button
                        type="button"
                        onClick={() => handleToggleSelectAll(false)}
                        className="text-xs font-semibold text-stone-500 hover:underline cursor-pointer"
                      >
                        Deselect All
                      </button>
                      <span className="text-stone-300">•</span>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Upload Different File</span>
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Table */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-stone-700 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={selectedCount === parsedRows.length && parsedRows.length > 0}
                              onChange={(e) => handleToggleSelectAll(e.target.checked)}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                          </th>
                          <th className="py-2.5 px-3">Title & Details</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Requester</th>
                          <th className="py-2.5 px-3">Visibility</th>
                          <th className="py-2.5 px-3 text-center">Flags</th>
                          <th className="py-2.5 px-3 w-10 text-center">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-700">
                        {parsedRows.map((row) => (
                          <tr
                            key={row.id}
                            className={`transition-colors ${
                              row.selected ? 'bg-white hover:bg-amber-50/40' : 'bg-stone-50/50 opacity-60'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={() => handleToggleRow(row.id)}
                                className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                            </td>

                            <td className="py-2.5 px-3 max-w-xs">
                              <div className="font-bold text-stone-900 font-serif-church truncate">
                                {row.title}
                              </div>
                              <div className="text-[11px] text-stone-500 line-clamp-1">
                                {row.content}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="bg-stone-100 text-stone-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-stone-200">
                                {row.category}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-medium text-stone-800">
                                {row.requesterName}
                              </div>
                              {row.requesterEmail && (
                                <div className="text-[10px] text-stone-400">
                                  {row.requesterEmail}
                                </div>
                              )}
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {row.visibility === 'private' ? (
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded">
                                  <Lock className="w-2.5 h-2.5 text-purple-700" />
                                  <span>Private Staff</span>
                                </span>
                              ) : row.visibility === 'global' ? (
                                <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded">
                                  <Globe className="w-2.5 h-2.5 text-indigo-700" />
                                  <span>Global Wall</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded">
                                  <ChurchIcon className="w-2.5 h-2.5 text-blue-700" />
                                  <span>Church Wall</span>
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1">
                                {row.isUrgent && (
                                  <span
                                    className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5"
                                    title="Marked Urgent"
                                  >
                                    <Flame className="w-2.5 h-2.5 text-rose-600" />
                                    <span>Urgent</span>
                                  </span>
                                )}
                                {row.isAnswered && (
                                  <span
                                    className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded"
                                    title="Praise / Answered"
                                  >
                                    Praise
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                title="Remove row from import"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary bar */}
                  <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                    <span>
                      Ready to add to <strong>{targetChurchObj.name}</strong> • Status:{' '}
                      <strong className="capitalize">{importStatus}</strong>
                    </span>
                    <span>{selectedCount} prayers will be added to the database</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importResult && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
            <div className="text-xs text-stone-500 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
              <span>CSV files can be created in Excel, Google Sheets, or exported from church databases.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  handleReset();
                }}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={selectedCount === 0}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {selectedCount > 0
                    ? `Import ${selectedCount} Prayer Requests`
                    : 'Select Rows to Import'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
