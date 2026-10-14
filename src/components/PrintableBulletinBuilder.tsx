import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RequestCategory, PrayerRequest } from '../types';
import { isDateString } from '../utils/csvParser';
import {
  Printer,
  Download,
  Copy,
  Check,
  Sparkles,
  Columns2,
  Columns3,
  Columns4,
  Table as TableIcon,
  AlignLeft,
  FileText,
  Sliders,
  Calendar,
  Lock,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Church as ChurchIcon,
  ShieldAlert,
  Edit3,
  Zap,
  Gauge,
  Archive,
  ArchiveRestore,
  RotateCcw,
  Upload,
  LayoutGrid
} from 'lucide-react';

export const PrintableBulletinBuilder: React.FC = () => {
  const {
    currentChurch,
    filteredChurchRequests,
    updateBulletinSummary,
    bulkUpdateBulletinSummaries,
    load75WeeklyRequests,
    archiveLastWeeksPrayersForPrint,
    restoreAllPrintArchives,
    togglePrintArchived,
    setImportModalOpen,
    categorizePrayersWithAI,
    isAICategorizing,
    repairDateTitles,
    isSuperAdmin,
  } = useApp();

  // Template / Layout selection
  // Presets specifically engineered for 50 to 100+ weekly requests
  const [layoutMode, setLayoutMode] = useState<'columns_3' | 'columns_2' | 'columns_4' | 'table_ledger' | 'inline_flow' | 'columns_1'>('columns_2');
  
  // Customization Options
  const [customTitle, setCustomTitle] = useState(currentChurch.bulletinTitle || `${currentChurch.name} Weekly Prayer List`);
  const [customSubtitle, setCustomSubtitle] = useState('For Personal & Congregational Intercession');
  const [pastorNote, setPastorNote] = useState(
    'Please lift these needs daily. "The Lord is near to all who call on Him in truth." (Psalm 145:18)'
  );
  const [includePastorNote, setIncludePastorNote] = useState(true);
  const [includeScripture, setIncludeScripture] = useState(true);
  const [includePrivateRequests, setIncludePrivateRequests] = useState(false);
  const [includeAnsweredPraises, setIncludeAnsweredPraises] = useState(true);
  const [includeContactInfo, setIncludeContactInfo] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [dateFilter, setDateFilter] = useState<'all' | '14days' | '30days'>('all');
  
  // Print Archive View Mode: 'active' (what will print this Sunday) vs 'archived' (past printed items)
  const [printViewMode, setPrintViewMode] = useState<'active' | 'archived'>('active');
  const [archiveFeedback, setArchiveFeedback] = useState<string | null>(null);
  const [showArchivePrintModal, setShowArchivePrintModal] = useState(false);
  const [archiveDaysSelection, setArchiveDaysSelection] = useState<number>(7);

  // Typography & Density controls for high volume
  const [fontSize, setFontSize] = useState<'micro' | 'dense' | 'compact' | 'regular'>('compact');
  const [spacing, setSpacing] = useState<'tight' | 'compact' | 'normal'>('compact');
  const [useCondensedSummaries, setUseCondensedSummaries] = useState(true);
  
  // Category selection (all selected by default)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Health & Healing',
    'Comfort & Grief',
    'Family & Relationships',
    'Spiritual Growth',
    'Missions & Outreach',
    'Praise & Thanksgiving',
    'Guidance & Provision',
    'General',
  ]);

  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isPolishingAI, setIsPolishingAI] = useState(false);
  const [aiCompressedCount, setAiCompressedCount] = useState<number | null>(null);
  const [pdfProgressMessage, setPdfProgressMessage] = useState<string | null>(null);

  // High-Volume Presets
  const applyPreset = (preset: 'dense_3col' | 'ledger_table' | 'inline_flow' | 'pocket_4col' | 'standard_2col' | 'pastoral_care') => {
    if (preset === 'dense_3col') {
      setLayoutMode('columns_3');
      setFontSize('dense');
      setSpacing('tight');
      setUseCondensedSummaries(true);
      setIncludePrivateRequests(false);
      setIncludeContactInfo(false);
      setCustomTitle(`${currentChurch.name} Intercessory Prayer Directory`);
    } else if (preset === 'ledger_table') {
      setLayoutMode('table_ledger');
      setFontSize('dense');
      setSpacing('tight');
      setUseCondensedSummaries(true);
      setIncludePrivateRequests(false);
      setIncludeContactInfo(false);
      setCustomTitle(`${currentChurch.name} Prayer Ledger & Roster`);
    } else if (preset === 'inline_flow') {
      setLayoutMode('inline_flow');
      setFontSize('micro');
      setSpacing('tight');
      setUseCondensedSummaries(true);
      setIncludePrivateRequests(false);
      setIncludeContactInfo(false);
      setCustomTitle(`${currentChurch.name} Weekly Congregational Prayer Points`);
    } else if (preset === 'pocket_4col') {
      setLayoutMode('columns_4');
      setFontSize('micro');
      setSpacing('tight');
      setUseCondensedSummaries(true);
      setIncludePrivateRequests(false);
      setIncludeContactInfo(false);
      setCustomTitle(`${currentChurch.name} Pocket Prayer List`);
    } else if (preset === 'standard_2col') {
      setLayoutMode('columns_2');
      setFontSize('compact');
      setSpacing('compact');
      setUseCondensedSummaries(true);
      setIncludePrivateRequests(false);
      setIncludeContactInfo(false);
      setCustomTitle(`${currentChurch.name} Sunday Prayer Bulletin`);
    } else if (preset === 'pastoral_care') {
      setLayoutMode('table_ledger');
      setFontSize('compact');
      setSpacing('compact');
      setUseCondensedSummaries(false);
      setIncludePrivateRequests(true);
      setIncludeContactInfo(true);
      setCustomTitle(`CONFIDENTIAL: Pastoral Care Team Prayer Roster`);
      setCustomSubtitle(`For Pastoral Staff & Prayer Elders Only — ${currentChurch.name}`);
    }
  };

  // Filter requests based on controls and print archive status
  const printableRequests = filteredChurchRequests.filter((r) => {
    // Only approved items
    if (r.status !== 'approved') return false;

    // Globally archived prayers from church wall don't print
    if (r.isArchived) return false;

    // Print-specific Archive check:
    // In active mode: exclude items archived from print
    // In archived mode: show only items archived from print
    if (printViewMode === 'active' && r.isArchivedFromPrint) return false;
    if (printViewMode === 'archived' && !r.isArchivedFromPrint) return false;

    // Private request check
    if (r.visibility === 'private' && !includePrivateRequests) return false;

    // Answered check
    if (r.isAnswered && !includeAnsweredPraises) return false;

    // Category check
    if (!selectedCategories.includes(r.category)) return false;

    // Date filter check
    if (dateFilter !== 'all') {
      const days = dateFilter === '14days' ? 14 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const reqDate = new Date(r.createdAt);
      if (reqDate < cutoff) return false;
    }

    return true;
  });

  const totalActivePrintCount = filteredChurchRequests.filter(
    (r) => r.status === 'approved' && !r.isArchived && !r.isArchivedFromPrint
  ).length;

  const totalArchivedPrintCount = filteredChurchRequests.filter(
    (r) => r.status === 'approved' && r.isArchivedFromPrint
  ).length;

  const activeNeeds = printableRequests.filter((r) => !r.isAnswered);
  const praises = printableRequests.filter((r) => r.isAnswered);

  const categoriesWithRequests = selectedCategories.filter((cat) =>
    activeNeeds.some((r) => r.category === cat)
  );

  // Live Page Fit Estimator
  const calculateEstimatedPages = () => {
    const totalCount = printableRequests.length;
    if (totalCount === 0) return { pages: 0, text: 'No requests', badge: 'Empty' };

    let itemsPerPage = 35; // baseline
    if (layoutMode === 'inline_flow') {
      itemsPerPage = 95; // fits 95 items per page in inline flow
    } else if (layoutMode === 'columns_3') {
      itemsPerPage = fontSize === 'micro' ? 85 : fontSize === 'dense' ? 65 : 45;
    } else if (layoutMode === 'columns_4') {
      itemsPerPage = fontSize === 'micro' ? 100 : 75;
    } else if (layoutMode === 'table_ledger') {
      itemsPerPage = fontSize === 'micro' ? 55 : fontSize === 'dense' ? 45 : 35;
    } else if (layoutMode === 'columns_2') {
      itemsPerPage = fontSize === 'dense' ? 45 : 30;
    } else {
      itemsPerPage = 18;
    }

    const est = Math.ceil((totalCount / itemsPerPage) * 10) / 10;
    if (est <= 1.0) {
      return {
        pages: est,
        text: `Fits on 1 single sheet (${totalCount} requests)`,
        badge: '1-Page Fit',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    } else if (est <= 2.0) {
      return {
        pages: est,
        text: `Fits on 1 double-sided page (${totalCount} requests)`,
        badge: 'Front & Back Fit (1 Sheet)',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    } else {
      return {
        pages: est,
        text: `Estimated ~${Math.ceil(est)} printed pages (${totalCount} requests)`,
        badge: `${Math.ceil(est)} Pages`,
        color: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    }
  };

  const pageFit = calculateEstimatedPages();

  // Helper to extract clean dignified summary text without date strings
  const getItemSummaryText = (item: PrayerRequest) => {
    let summary = useCondensedSummaries && item.bulletinSummary ? item.bulletinSummary : item.title;
    if (!summary || isDateString(summary)) {
      summary = item.content && !isDateString(item.content) ? item.content : 'Prayer Request';
    }
    // Clean out bracketed class prefixes like [Joy] from display line
    return summary.replace(/^\[[^\]]+\]\s*/, '').trim();
  };

  // Save as PDF uses the browser's own print engine, which lays out real text and
  // breaks pages between prayer requests (the old html2canvas screenshot approach
  // crashed on Tailwind's oklch colors and sliced lines in half at page edges).
  const handleDownloadPDF = () => {
    setPdfProgressMessage(
      'In the print window, set Destination (or the PDF menu on Mac) to "Save as PDF", then click Save.'
    );
    setTimeout(() => setPdfProgressMessage(null), 12000);
    // Let the hint render before the print dialog blocks the page
    setTimeout(() => window.print(), 50);
  };

  // AI Auto-Categorize Bulletin
  const handleAICategorizeBulletin = async () => {
    setIsPolishingAI(true);
    try {
      await categorizePrayersWithAI(printableRequests);
      repairDateTitles();
      setAiCompressedCount(printableRequests.length);
      setTimeout(() => setAiCompressedCount(null), 4000);
    } catch (e) {
      console.warn('AI categorize error:', e);
    } finally {
      setIsPolishingAI(false);
    }
  };

  // Trigger Native Browser Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // AI Bulk Compression for 75+ items
  const handleAIBulkCompress = async () => {
    setIsPolishingAI(true);
    setAiCompressedCount(null);
    try {
      const itemsToCompress = activeNeeds.map((r) => ({
        id: r.id,
        requesterName: r.requesterName,
        title: r.title,
        content: r.content,
      }));

      const response = await fetch('/api/bulk-compress-bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToCompress }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.results && Array.isArray(json.results)) {
          bulkUpdateBulletinSummaries(json.results);
          setAiCompressedCount(json.results.length);
          setTimeout(() => setAiCompressedCount(null), 4000);
        }
      }
    } catch (err) {
      console.warn('Bulk compress error:', err);
    } finally {
      setIsPolishingAI(false);
    }
  };

  // Copy Formatted Text for Word / Email Bulletin
  const handleCopyText = () => {
    let text = `========================================================\n`;
    text += `${customTitle.toUpperCase()}\n`;
    text += `${currentChurch.name} • ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}\n`;
    text += `========================================================\n\n`;

    if (includePastorNote && pastorNote) {
      text += `PASTOR'S NOTE:\n"${pastorNote}"\n\n`;
    }

    if (layoutMode === 'inline_flow') {
      categoriesWithRequests.forEach((cat) => {
        const items = activeNeeds.filter((r) => r.category === cat);
        if (items.length === 0) return;
        text += `\n${cat.toUpperCase()} (${items.length}): `;
        const lineParts = items.map((item) => {
          const body = useCondensedSummaries && item.bulletinSummary ? item.bulletinSummary : item.title;
          return `${item.requesterName} (${body})`;
        });
        text += `${lineParts.join('; ')}.\n`;
      });
    } else {
      categoriesWithRequests.forEach((cat) => {
        const items = activeNeeds.filter((r) => r.category === cat);
        if (items.length === 0) return;

        text += `\n--- ${cat.toUpperCase()} (${items.length}) ---\n`;
        items.forEach((item) => {
          const body = useCondensedSummaries && item.bulletinSummary ? item.bulletinSummary : item.title;
          text += `• ${item.requesterName} — ${body}\n`;
          if (includeContactInfo && item.requesterEmail) {
            text += `  Contact: ${item.requesterEmail} ${item.requesterPhone ? `| ${item.requesterPhone}` : ''}\n`;
          }
        });
      });
    }

    if (includeAnsweredPraises && praises.length > 0) {
      text += `\n--- PRAISES & ANSWERED PRAYERS (${praises.length}) ---\n`;
      praises.forEach((item) => {
        text += `• [PRAISE] ${item.requesterName}: ${item.answeredUpdate || item.bulletinSummary || item.title}\n`;
      });
    }

    if (includeScripture) {
      text += `\n"${currentChurch.scriptureVerse}"\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveEdit = (requestId: string) => {
    if (editText.trim()) {
      updateBulletinSummary(requestId, editText.trim());
    }
    setEditingId(null);
  };

  // Typography styling maps for ultra-compact layouts
  const fontSizeClasses = {
    micro: 'text-[9.5px] leading-[1.25]', // For 75-100 on 1 page
    dense: 'text-[11px] leading-[1.3]',  // Ideal for 75 items across 1-2 pages
    compact: 'text-xs leading-normal',
    regular: 'text-sm leading-relaxed',
  };

  const spacingClasses = {
    tight: 'py-0.5 my-0.5 space-y-0.5',
    compact: 'py-1 my-1 space-y-1',
    normal: 'py-1.5 my-1.5 space-y-1.5',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 print:p-0 print:max-w-none">
      {/* Top Banner: High-Volume 75 Requests Optimizer Bar */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-md border border-stone-800 no-print space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif-church text-xl font-bold text-white">
                High-Volume Bulletin Optimizer (75+ Weekly Requests)
              </h2>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${pageFit.color}`}>
                {pageFit.badge}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {pageFit.text}. Specially formatted so that 75+ church prayer requests easily fit onto a 1-page or 2-page double-sided Sunday bulletin insert.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Archive Last Week's Prayers (Print Only) Modal Trigger */}
            <button
              onClick={() => setShowArchivePrintModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-purple-900/60 text-purple-200 rounded-lg text-xs font-semibold border border-purple-500/50 transition-colors cursor-pointer"
              title="Rotates off older prayers specifically from the print doc without deleting them from the church prayer wall"
            >
              <Archive className="w-3.5 h-3.5 text-purple-400" />
              <span>Archive Last Week's (Print Only)...</span>
            </button>

            {/* Quick Checkbox Toggle Button */}
            <button
              onClick={() => setShowCheckboxes(!showCheckboxes)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                showCheckboxes
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
              }`}
              title="Toggle prayer checkboxes. Off by default for a clean, condensed printout. Turn ON to include check boxes (☐)."
            >
              <span className="font-mono">{showCheckboxes ? '☑' : '☐'}</span>
              <span>Checkboxes: <strong>{showCheckboxes ? 'ON' : 'OFF'}</strong></span>
            </button>

            {/* Import CSV Button */}
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/70 hover:bg-amber-900 text-amber-200 rounded-lg text-xs font-semibold border border-amber-600/60 transition-colors cursor-pointer"
              title={`Import prayer requests from CSV file into ${currentChurch.name}`}
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Import CSV</span>
            </button>

            {/* Load 75 Sample Requests Button (super admin testing tool) */}
            {isSuperAdmin && (
            <button
              onClick={load75WeeklyRequests}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
              title="Loads a complete roster of 75 realistic weekly requests for testing"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-400" />
              <span>Load 75 Requests Demo</span>
            </button>
            )}

            {/* AI Bulk Compress to 1-Liners */}
            <button
              onClick={handleAIBulkCompress}
              disabled={isPolishingAI}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="AI condenses all requests into concise 3-7 word prayer lines for maximum page compression"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isPolishingAI ? 'animate-spin' : ''}`} />
              <span>{isPolishingAI ? 'AI Compressing...' : '⚡ AI 1-Liners'}</span>
            </button>

            {/* AI Auto-Categorize Bulletin */}
            <button
              onClick={handleAICategorizeBulletin}
              disabled={isPolishingAI || isAICategorizing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="AI organizes and categorizes all requests on this bulletin into their ministry categories"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isPolishingAI || isAICategorizing ? 'animate-spin' : ''}`} />
              <span>{isPolishingAI || isAICategorizing ? 'Categorizing...' : '✨ AI Organize Categories'}</span>
            </button>

            {/* Copy for Bulletin */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
              title="Copy formatted text to paste into Microsoft Word, Canva, or InDesign"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            {/* Direct Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Save this Sunday Bulletin as a PDF file (choose &quot;Save as PDF&quot; in the print window)"
            >
              <Download className="w-4 h-4" />
              <span>Save as PDF</span>
            </button>

            {/* Print Bulletin */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Open browser print dialog / save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bulletin</span>
            </button>
          </div>
        </div>

        {/* Progress or Notification Banner */}
        {pdfProgressMessage && (
          <div className="bg-blue-950/90 border border-blue-400/60 text-blue-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-300 shrink-0" />
              <span className="font-semibold">{pdfProgressMessage}</span>
            </div>
            <button
              onClick={() => setPdfProgressMessage(null)}
              className="text-blue-300 hover:text-white font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Archive Last Week's Modal Dialog */}
        {showArchivePrintModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-stone-900 border border-purple-500/50 rounded-2xl p-6 max-w-lg w-full text-white shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-950 border border-purple-500/60 rounded-xl">
                  <Archive className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-serif-church text-xl font-bold text-white">
                    Archive Last Week's Prayers (Print Only)
                  </h3>
                  <p className="text-xs text-stone-400">
                    Keep your printed Sunday bulletin concise and fresh
                  </p>
                </div>
              </div>

              <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3.5 text-xs text-purple-200 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-purple-300">
                  <HeartHandshake className="w-4 h-4" />
                  <span>Important Note on Church Wall Safety:</span>
                </div>
                <p>
                  Archiving here <strong>only rotates requests off the Sunday printed bulletin</strong>.
                  These prayers will <strong>never</strong> be deleted from your church website's prayer wall — congregation members and online visitors can continue praying for them anytime!
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                  Select which requests to rotate off the print doc:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setArchiveDaysSelection(7)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      archiveDaysSelection === 7
                        ? 'bg-purple-900/80 border-purple-400 ring-1 ring-purple-400 text-white font-bold'
                        : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div className="text-xs font-bold">Older than 7 days</div>
                    <div className="text-[11px] text-stone-400 mt-0.5">Standard weekly Sunday rotation</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setArchiveDaysSelection(14)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      archiveDaysSelection === 14
                        ? 'bg-purple-900/80 border-purple-400 ring-1 ring-purple-400 text-white font-bold'
                        : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div className="text-xs font-bold">Older than 14 days</div>
                    <div className="text-[11px] text-stone-400 mt-0.5">Bi-weekly bulletin rotation</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setArchiveDaysSelection(0)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      archiveDaysSelection === 0
                        ? 'bg-purple-900/80 border-purple-400 ring-1 ring-purple-400 text-white font-bold'
                        : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div className="text-xs font-bold">All current items</div>
                    <div className="text-[11px] text-stone-400 mt-0.5">Clear entire bulletin set</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowArchivePrintModal(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const count = archiveLastWeeksPrayersForPrint(archiveDaysSelection);
                    setShowArchivePrintModal(false);
                    setArchiveFeedback(`Archived ${count} requests from the Sunday bulletin! (They remain active on your church website prayer wall).`);
                    setTimeout(() => setArchiveFeedback(null), 5000);
                  }}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                >
                  <Archive className="w-4 h-4" />
                  <span>Archive from Bulletin Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback / Notification Banner */}
        {archiveFeedback && (
          <div className="bg-purple-950/80 border border-purple-500/60 text-purple-200 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{archiveFeedback}</span>
            </div>
            <button
              onClick={() => setArchiveFeedback(null)}
              className="text-purple-300 hover:text-white font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* AI Success Toast Message */}
        {aiCompressedCount !== null && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Successfully compressed {aiCompressedCount} prayer requests into clean, high-density 1-line bulletin entries!
            </span>
          </div>
        )}
      </div>

      {/* Configuration Controls Bar (Hidden during window.print) */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 no-print space-y-4">
        {/* Print Set Active vs Archived Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintViewMode('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                printViewMode === 'active'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>This Week's Active Print Set ({totalActivePrintCount})</span>
            </button>

            <button
              onClick={() => setPrintViewMode('archived')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                printViewMode === 'archived'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-purple-400" />
              <span>Archived from Print ({totalArchivedPrintCount})</span>
            </button>
          </div>

          {printViewMode === 'archived' && totalArchivedPrintCount > 0 && (
            <button
              onClick={() => {
                restoreAllPrintArchives();
                setPrintViewMode('active');
                setArchiveFeedback(`Restored ${totalArchivedPrintCount} archived prayers back to the active Sunday bulletin!`);
                setTimeout(() => setArchiveFeedback(null), 4000);
              }}
              className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore All to Active Bulletin</span>
            </button>
          )}

          {printViewMode === 'active' && (
            <span className="text-[11px] text-stone-500">
              Showing <strong>{printableRequests.length}</strong> prayers queued for this Sunday's bulletin
            </span>
          )}
        </div>

        {/* Preset Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xs text-stone-800 uppercase tracking-wider">
              Choose Print Format Preset (Optimized for 75+ Items):
            </span>
            <span className="text-xs text-stone-500">
              Format: <strong>{layoutMode.replace('_', ' ').toUpperCase()}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <button
              onClick={() => applyPreset('dense_3col')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                layoutMode === 'columns_3'
                  ? 'bg-amber-50 text-amber-950 border-amber-400 ring-1 ring-amber-300 font-bold'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Columns3 className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="leading-tight">3-Col Directory</span>
              </div>
              <span className="text-[10px] text-stone-500 font-normal mt-1 block">
                ★ Best for 75 (1-2 pages)
              </span>
            </button>

            <button
              onClick={() => applyPreset('ledger_table')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                layoutMode === 'table_ledger'
                  ? 'bg-amber-50 text-amber-950 border-amber-400 ring-1 ring-amber-300 font-bold'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="leading-tight">Ledger Table</span>
              </div>
              <span className="text-[10px] text-stone-500 font-normal mt-1 block">
                Grid scan roster
              </span>
            </button>

            <button
              onClick={() => applyPreset('inline_flow')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                layoutMode === 'inline_flow'
                  ? 'bg-amber-50 text-amber-950 border-amber-400 ring-1 ring-amber-300 font-bold'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="leading-tight">Inline Flow</span>
              </div>
              <span className="text-[10px] text-stone-500 font-normal mt-1 block">
                Maximum fit (1 page)
              </span>
            </button>

            <button
              onClick={() => applyPreset('pocket_4col')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                layoutMode === 'columns_4'
                  ? 'bg-amber-50 text-amber-950 border-amber-400 ring-1 ring-amber-300 font-bold'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Columns4 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="leading-tight">4-Col Pocket</span>
              </div>
              <span className="text-[10px] text-stone-500 font-normal mt-1 block">
                Ultra-dense foldout
              </span>
            </button>

            <button
              onClick={() => applyPreset('standard_2col')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                layoutMode === 'columns_2'
                  ? 'bg-amber-50 text-amber-950 border-amber-400 ring-1 ring-amber-300 font-bold'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Columns2 className="w-4 h-4 text-stone-600 shrink-0" />
                <span className="leading-tight">2-Col Bulletin</span>
              </div>
              <span className="text-[10px] text-stone-500 font-normal mt-1 block">
                Standard format
              </span>
            </button>

            <button
              onClick={() => applyPreset('pastoral_care')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                includePrivateRequests
                  ? 'bg-purple-50 text-purple-950 border-purple-400 ring-1 ring-purple-300 font-bold'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="leading-tight">Pastoral Vault</span>
              </div>
              <span className="text-[10px] text-stone-500 font-normal mt-1 block">
                Staff only (Confidential)
              </span>
            </button>
          </div>
        </div>

        {/* Detailed Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-stone-100 text-xs">
          {/* Column 1: Layout & Columns */}
          <div className="space-y-2">
            <span className="font-semibold text-stone-700 block">Layout & Columns</span>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => setLayoutMode('columns_1')}
                className={`py-1 text-center rounded border cursor-pointer ${
                  layoutMode === 'columns_1' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
              >
                1 Col
              </button>
              <button
                onClick={() => setLayoutMode('columns_2')}
                className={`py-1 text-center rounded border cursor-pointer ${
                  layoutMode === 'columns_2' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
              >
                2 Col
              </button>
              <button
                onClick={() => setLayoutMode('columns_3')}
                className={`py-1 text-center rounded border cursor-pointer ${
                  layoutMode === 'columns_3' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
              >
                3 Col
              </button>
              <button
                onClick={() => setLayoutMode('columns_4')}
                className={`py-1 text-center rounded border cursor-pointer ${
                  layoutMode === 'columns_4' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
              >
                4 Col
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => setLayoutMode('table_ledger')}
                className={`flex-1 py-1 text-center rounded border cursor-pointer ${
                  layoutMode === 'table_ledger' ? 'bg-emerald-800 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
              >
                Table Grid
              </button>
              <button
                onClick={() => setLayoutMode('inline_flow')}
                className={`flex-1 py-1 text-center rounded border cursor-pointer ${
                  layoutMode === 'inline_flow' ? 'bg-purple-800 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
              >
                Inline Flow
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-stone-500">Page:</span>
              <button
                onClick={() => setOrientation('portrait')}
                className={`flex-1 py-1 text-center rounded border cursor-pointer ${
                  orientation === 'portrait' ? 'bg-blue-700 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
                title="Portrait: 8.5 x 11 in, taller than wide"
              >
                ▯ Tall
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`flex-1 py-1 text-center rounded border cursor-pointer ${
                  orientation === 'landscape' ? 'bg-blue-700 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
                title="Landscape: 11 x 8.5 in, wider than tall"
              >
                ▭ Wide
              </button>
            </div>
          </div>

          {/* Column 2: Font Size & Spacing */}
          <div className="space-y-2">
            <span className="font-semibold text-stone-700 block">Print Density & Size</span>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => setFontSize('micro')}
                className={`py-1 rounded border text-center cursor-pointer ${
                  fontSize === 'micro' ? 'bg-stone-800 text-white font-bold' : 'bg-stone-50'
                }`}
                title="8.5pt font - Maximum compression"
              >
                Micro (8pt)
              </button>
              <button
                onClick={() => setFontSize('dense')}
                className={`py-1 rounded border text-center cursor-pointer ${
                  fontSize === 'dense' ? 'bg-stone-800 text-white font-bold' : 'bg-stone-50'
                }`}
                title="9.5pt font - Recommended for 75 requests"
              >
                Dense (9pt)
              </button>
              <button
                onClick={() => setFontSize('compact')}
                className={`py-1 rounded border text-center cursor-pointer ${
                  fontSize === 'compact' ? 'bg-stone-800 text-white font-bold' : 'bg-stone-50'
                }`}
                title="10.5pt font"
              >
                Compact
              </button>
              <button
                onClick={() => setFontSize('regular')}
                className={`py-1 rounded border text-center cursor-pointer ${
                  fontSize === 'regular' ? 'bg-stone-800 text-white font-bold' : 'bg-stone-50'
                }`}
                title="11.5pt font"
              >
                Regular
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-stone-500">Spacing:</span>
              <button
                onClick={() => setSpacing('tight')}
                className={`px-2 py-0.5 rounded border cursor-pointer ${
                  spacing === 'tight' ? 'bg-amber-600 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
              >
                Ultra-Tight
              </button>
              <button
                onClick={() => setSpacing('compact')}
                className={`px-2 py-0.5 rounded border cursor-pointer ${
                  spacing === 'compact' ? 'bg-amber-600 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
              >
                Compact
              </button>
              <button
                onClick={() => setSpacing('normal')}
                className={`px-2 py-0.5 rounded border cursor-pointer ${
                  spacing === 'normal' ? 'bg-amber-600 text-white font-bold' : 'bg-stone-50 text-stone-600'
                }`}
              >
                Normal
              </button>
            </div>
          </div>

          {/* Column 3: Content Toggles */}
          <div className="space-y-1.5">
            <span className="font-semibold text-stone-700 block">Space Savers</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCondensedSummaries}
                onChange={(e) => setUseCondensedSummaries(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-stone-800">Use 1-line bullet points</span>
            </label>
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">Prayer Checkboxes:</span>
                <button
                  type="button"
                  onClick={() => setShowCheckboxes(!showCheckboxes)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    showCheckboxes
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  {showCheckboxes ? 'ON (☐)' : 'OFF (Clean)'}
                </button>
              </div>
              <p className="text-[10px] text-stone-500">
                {showCheckboxes
                  ? 'Boxes (☐) will print next to each prayer for members to check off.'
                  : 'No checkmarks or boxes will print. Clean text layout.'}
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnsweredPraises}
                onChange={(e) => setIncludeAnsweredPraises(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Include Answered Praises ({praises.length})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePastorNote}
                onChange={(e) => setIncludePastorNote(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Include Pastor's note header</span>
            </label>
          </div>

          {/* Column 4: Confidential & Title */}
          <div className="space-y-2">
            <span className="font-semibold text-stone-700 block">Confidential & Title</span>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Bulletin Header Title"
              className="w-full bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs"
            />

            <label className="flex items-center gap-2 cursor-pointer text-stone-700 pt-1">
              <input
                type="checkbox"
                checked={includePrivateRequests}
                onChange={(e) => setIncludePrivateRequests(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span className={includePrivateRequests ? 'font-bold text-purple-900' : ''}>
                Include Staff Private Requests
              </span>
            </label>
            {includePrivateRequests && (
              <span className="text-[10px] text-amber-800 bg-amber-100 p-1 rounded block">
                ⚠️ Staff Only list: confidential requests included.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Page orientation for Print / Save as PDF (overrides the default @page size) */}
      <style>{`@media print { @page { size: letter ${orientation}; } }`}</style>

      {/* Live Printable Sheet Preview Container (Rendered exactly for print and screen) */}
      <div className="bg-stone-300/40 p-2 sm:p-6 rounded-2xl flex justify-center no-print-bg print:p-0 print:bg-transparent print:block">
        <div
          className={`printable-area bg-white text-stone-900 shadow-xl w-full p-4 sm:p-[0.5in] transition-all border border-stone-200 ${
            fontSizeClasses[fontSize]
          }`}
          style={
            orientation === 'landscape'
              ? { maxWidth: '11in', minHeight: '8.5in' }
              : { maxWidth: '8.5in', minHeight: '11in' }
          }
        >
          {/* Sheet Header: Compact, Ink-friendly Header */}
          <div className="border-b-2 border-stone-900 pb-2.5 mb-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {currentChurch.logoUrl && (
                  <img
                    src={currentChurch.logoUrl}
                    alt={currentChurch.name}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="w-10 h-10 rounded object-cover shrink-0 border border-stone-300 print:filter print:grayscale"
                  />
                )}
                <div>
                  <span className="text-[9px] tracking-widest uppercase font-bold text-stone-600 block">
                    {currentChurch.denomination}
                  </span>
                  <h1 className="font-serif-church text-xl sm:text-2xl font-bold tracking-tight text-stone-950">
                    {customTitle}
                  </h1>
                  <p className="text-[10px] text-stone-600 font-serif-church italic">
                    {currentChurch.name} • {currentChurch.address ? `${currentChurch.address}, ` : ''}{currentChurch.city}, {currentChurch.state} {currentChurch.zipCode || ''} {currentChurch.phone ? `• ${currentChurch.phone}` : ''}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-bold text-stone-900">
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-[10px] text-stone-500 font-mono">
                  {printableRequests.length} Needs in Prayer
                </div>
                {includePrivateRequests && (
                  <span className="inline-block bg-stone-900 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded mt-0.5">
                    Staff Confidential
                  </span>
                )}
              </div>
            </div>

            {/* Pastor's Note */}
            {includePastorNote && pastorNote && (
              <div className="mt-1.5 pt-1.5 border-t border-stone-200 text-[10px] text-stone-700 italic font-serif-church">
                <p>"{pastorNote}"</p>
              </div>
            )}
          </div>

          {/* LAYOUT 1: INLINE FLOW / PARAGRAPH FORMAT (Ultra-Compressed: Fits 75-100 on 1 page!) */}
          {layoutMode === 'inline_flow' && (
            <div className="space-y-3 font-sans">
              {categoriesWithRequests.map((cat) => {
                const items = activeNeeds.filter((r) => r.category === cat);
                if (items.length === 0) return null;

                return (
                  <div key={cat} className="break-inside-avoid page-break-inside-avoid">
                    <span className="font-bold uppercase tracking-wider text-stone-900 font-serif-church text-[10px] mr-1.5 bg-stone-100 px-1.5 py-0.5 rounded">
                      {cat} ({items.length}):
                    </span>
                    <span className="text-stone-700">
                      {items.map((item, idx) => {
                        const body = getItemSummaryText(item);
                        return (
                          <span key={item.id}>
                            <strong className="font-semibold text-stone-900">{item.requesterName}</strong>
                            {' '}({body})
                            {idx < items.length - 1 ? '; ' : '.'}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                );
              })}

              {includeAnsweredPraises && praises.length > 0 && (
                <div className="mt-4 pt-2.5 border-t border-stone-400 break-inside-avoid page-break-inside-avoid">
                  <span className="font-bold uppercase tracking-wider text-emerald-900 font-serif-church text-[10px] mr-1.5 bg-emerald-50 px-1.5 py-0.5 rounded">
                    PRAISES & ANSWERS ({praises.length}):
                  </span>
                  <span className="text-stone-700">
                    {praises.map((praise, idx) => (
                      <span key={praise.id}>
                        <strong className="font-semibold text-emerald-950">{praise.requesterName}</strong>
                        {' '}({praise.answeredUpdate || getItemSummaryText(praise)})
                        {idx < praises.length - 1 ? '; ' : '.'}
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* LAYOUT 2: TABULAR LEDGER (Clean scan table format: 75 rows on front/back) */}
          {layoutMode === 'table_ledger' && (
            <div className="space-y-4">
              <table className="w-full text-left border-collapse border border-stone-300 font-sans">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-400 text-[10px] uppercase tracking-wider">
                    {showCheckboxes && <th className="p-1 px-1.5 w-6 text-center">☐</th>}
                    <th className="p-1 px-2 w-1/4">Name / Family</th>
                    <th className="p-1 px-2">Need / Intercession Point</th>
                    <th className="p-1 px-2 w-28">Category</th>
                    {includeContactInfo && <th className="p-1 px-2 w-32">Confidential Contact</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {activeNeeds.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`break-inside-avoid page-break-inside-avoid group ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/60'
                      }`}
                    >
                      {showCheckboxes && (
                        <td className="p-1 text-center align-top">
                          <div className="w-3 h-3 border border-stone-400 rounded-xs mx-auto mt-0.5" />
                        </td>
                      )}
                      <td className="p-1 px-2 font-bold text-stone-900 font-serif-church align-top whitespace-nowrap">
                        {item.requesterName}
                      </td>
                      <td className="p-1 px-2 text-stone-800 align-top">
                        {getItemSummaryText(item)}
                      </td>
                      <td className="p-1 px-2 text-stone-500 text-[10px] align-top whitespace-nowrap">
                        {item.category}
                      </td>
                      {includeContactInfo && (
                        <td className="p-1 px-2 text-purple-900 text-[9px] font-mono align-top whitespace-nowrap">
                          {item.requesterEmail || item.requesterPhone || '—'}
                        </td>
                      )}
                      <td className="p-1 px-1 text-right no-print align-top">
                        <button
                          onClick={() => togglePrintArchived(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-purple-700 transition-opacity cursor-pointer"
                          title={item.isArchivedFromPrint ? "Restore to active bulletin" : "Archive from print (keeps on wall)"}
                        >
                          {item.isArchivedFromPrint ? <RotateCcw className="w-3 h-3 text-purple-600" /> : <Archive className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Praises Table */}
              {includeAnsweredPraises && praises.length > 0 && (
                <div className="break-inside-avoid page-break-inside-avoid pt-2">
                  <div className="font-serif-church font-bold text-[11px] text-emerald-950 uppercase tracking-wider mb-1 border-b border-emerald-800 pb-0.5">
                    Praises & Answered Prayers ({praises.length})
                  </div>
                  <table className="w-full text-left border-collapse border border-emerald-300 font-sans text-[10px]">
                    <tbody>
                      {praises.map((praise, idx) => (
                        <tr
                          key={praise.id}
                          className={idx % 2 === 0 ? 'bg-emerald-50/40' : 'bg-white'}
                        >
                          <td className="p-1 px-2 font-bold text-emerald-950 font-serif-church w-1/4">
                            {praise.requesterName}
                          </td>
                          <td className="p-1 px-2 text-stone-800">
                            {praise.answeredUpdate || getItemSummaryText(praise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* LAYOUT 3: MULTI-COLUMN DIRECTORY (2, 3, or 4 Columns with Balanced Flow) */}
          {(layoutMode === 'columns_3' || layoutMode === 'columns_2' || layoutMode === 'columns_4' || layoutMode === 'columns_1') && (
            <div
              className={`font-sans ${
                layoutMode === 'columns_4'
                  ? 'columns-4 print:columns-4'
                  : layoutMode === 'columns_3'
                  ? 'columns-3 print:columns-3'
                  : layoutMode === 'columns_2'
                  ? 'columns-2 print:columns-2'
                  : 'columns-1'
              }`}
              style={{
                columnCount:
                  layoutMode === 'columns_4'
                    ? 4
                    : layoutMode === 'columns_3'
                    ? 3
                    : layoutMode === 'columns_2'
                    ? 2
                    : 1,
                columnFill: 'balance',
                columnGap: '1.5rem',
              }}
            >
              {categoriesWithRequests.map((cat) => {
                const items = activeNeeds.filter((r) => r.category === cat);
                if (items.length === 0) return null;

                // When category has <= 4 items, keep the block together.
                // When category has > 4 items, allow it to break across columns so it never stacks into one single tall column!
                const avoidCategoryBreak = items.length <= 4;

                return (
                  <div
                    key={cat}
                    className={`${avoidCategoryBreak ? 'break-inside-avoid page-break-inside-avoid' : 'break-inside-auto'} mb-3 border-b border-stone-200 pb-2`}
                  >
                    {/* Category Ribbon Header */}
                    <div className="break-after-avoid page-break-after-avoid flex items-center justify-between border-b border-stone-900 pb-0.5 mb-1.5 bg-stone-100/80 px-1.5 py-0.5">
                      <span className="font-serif-church font-bold uppercase tracking-wider text-[10px] text-stone-900">
                        {cat}
                      </span>
                      <span className="text-[9px] text-stone-500 font-mono">
                        ({items.length})
                      </span>
                    </div>

                    {/* Column Items */}
                    <ul className="space-y-0.5">
                      {items.map((item) => (
                        <li key={item.id} className={`break-inside-avoid page-break-inside-avoid group ${spacingClasses[spacing]} flex items-start justify-between gap-1`}>
                          <div className="flex-1">
                            {showCheckboxes && (
                              <span className="inline-block w-2.5 h-2.5 border border-stone-400 rounded-2xs shrink-0 mr-1.5 align-middle -mt-0.5" />
                            )}
                            <span className="font-bold text-stone-950 font-serif-church">
                              {item.requesterName}
                            </span>
                            <span className="text-stone-500 mx-1">—</span>
                            <span className="text-stone-800">
                              {getItemSummaryText(item)}
                            </span>

                            {includeContactInfo && (item.requesterEmail || item.requesterPhone) && (
                              <span className="block text-[8.5px] text-purple-900 italic font-mono">
                                {item.requesterEmail} {item.requesterPhone ? `• ${item.requesterPhone}` : ''}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => togglePrintArchived(item.id)}
                            className="no-print opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-stone-400 hover:text-purple-700 cursor-pointer shrink-0"
                            title={item.isArchivedFromPrint ? "Restore to active bulletin" : "Archive from this print set (keeps on prayer wall)"}
                          >
                            {item.isArchivedFromPrint ? (
                              <RotateCcw className="w-3 h-3 text-purple-600" />
                            ) : (
                              <Archive className="w-3 h-3" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {/* Praises Section in Multi-Column */}
              {includeAnsweredPraises && praises.length > 0 && (
                <div className={`${praises.length <= 4 ? 'break-inside-avoid page-break-inside-avoid' : 'break-inside-auto'} mb-3 border-b border-emerald-300 pb-2`}>
                  <div className="break-after-avoid page-break-after-avoid flex items-center justify-between border-b border-emerald-800 pb-0.5 mb-1.5 bg-emerald-50 px-1.5 py-0.5">
                    <span className="font-serif-church font-bold uppercase tracking-wider text-[10px] text-emerald-950">
                      Praises & Answers
                    </span>
                    <span className="text-[9px] text-emerald-700 font-mono">
                      ({praises.length})
                    </span>
                  </div>

                  <ul className="space-y-1">
                    {praises.map((praise) => (
                      <li key={praise.id} className="break-inside-avoid page-break-inside-avoid text-stone-800">
                        <strong className="font-serif-church text-emerald-950 font-bold">
                          {praise.requesterName}
                        </strong>
                        <span className="text-stone-500 mx-1">—</span>
                        <span>{praise.answeredUpdate || getItemSummaryText(praise)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Printable Sheet Footer */}
          {includeScripture && (
            <div className="mt-4 pt-2 border-t border-stone-300 text-center font-serif-church text-[10px] text-stone-600 italic">
              <p>"{currentChurch.scriptureVerse}"</p>
              <p className="text-[9px] font-sans not-italic text-stone-400 mt-0.5">
                {currentChurch.name} • Pastor: {currentChurch.pastorName} • {currentChurch.phone}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
