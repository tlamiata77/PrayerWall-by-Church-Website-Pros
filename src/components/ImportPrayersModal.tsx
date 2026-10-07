import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RequestCategory, ModerationStatus, VisibilityType } from '../types';
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
  ArrowRight,
  ArrowLeft,
  Sliders,
  Eye,
  Table as TableIcon,
  Tag,
  User,
  Calendar,
  MessageSquare,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import {
  ParsedPrayerRow,
  parseCSVToPrayerRequests,
  parseCSVToRows,
  detectCSVColumnMapping,
  CSVColumnMapping,
  SAMPLE_CSV_CONTENT
} from '../utils/csvParser';

interface FieldOption {
  value: string;
  label: string;
  icon: string;
  desc: string;
  badgeColor: string;
}

const SYSTEM_FIELDS: FieldOption[] = [
  {
    value: 'title',
    label: 'Prayer Title / Short Statement',
    icon: '📌',
    desc: 'Main bold headline on church wall & bulletin (e.g. "GI doctor on Monday")',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    value: 'name',
    label: 'Requester Name',
    icon: '👤',
    desc: 'Person who submitted the request (e.g. "Wanda D.")',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    value: 'content',
    label: 'Prayer Details & Description',
    icon: '📝',
    desc: 'Full prayer petition body text and details',
    badgeColor: 'bg-stone-100 text-stone-900 border-stone-300',
  },
  {
    value: 'category',
    label: 'Ministry Category',
    icon: '🏷️',
    desc: 'Health & Healing, Family, Praise, Grief, etc.',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    value: 'date',
    label: 'Submission Date',
    icon: '📅',
    desc: 'Date submitted (e.g. "2026-10-04")',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    value: 'class',
    label: 'Sunday School / Small Group',
    icon: '👥',
    desc: 'Group name (e.g. "Joy", "Thursday Ladies")',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
  },
  {
    value: 'type',
    label: 'Record Type / Praise Status',
    icon: '🙏',
    desc: 'Request vs Praise/Answered Prayer',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    value: 'visibility',
    label: 'Visibility',
    icon: '👁️',
    desc: 'Church Wall vs Staff Confidential',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
  {
    value: 'urgent',
    label: 'Urgent Need Flag',
    icon: '🔥',
    desc: 'Marks as urgent priority',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    value: 'email',
    label: 'Contact Email',
    icon: '✉️',
    desc: 'Requester email address',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  {
    value: 'phone',
    label: 'Contact Phone',
    icon: '📞',
    desc: 'Requester phone number',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  {
    value: 'ignore',
    label: '— Skip / Do Not Import —',
    icon: '🚫',
    desc: 'Ignore and exclude this column',
    badgeColor: 'bg-stone-50 text-stone-400 border-stone-200',
  },
];

export const ImportPrayersModal: React.FC = () => {
  const {
    importModalOpen,
    setImportModalOpen,
    currentChurch,
    churches,
    importPrayerRequestsBatch,
    setActiveTab,
    setCurrentChurchId,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow Step: 'upload' -> 'mapping' -> 'review'
  const [activeStep, setActiveStep] = useState<'upload' | 'mapping' | 'review'>('upload');

  // Parsing & File State
  const [csvRawText, setCsvRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMappings, setColumnMappings] = useState<{ [colIndex: number]: string }>({});
  const [parsedRows, setParsedRows] = useState<ParsedPrayerRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showRawTextarea, setShowRawTextarea] = useState(false);
  const [isAICategorizingPreview, setIsAICategorizingPreview] = useState(false);

  // Settings State - synced with currentChurch
  const [selectedChurchId, setSelectedChurchId] = useState(currentChurch.id);
  const [importStatus, setImportStatus] = useState<ModerationStatus>('approved');
  const [forceVisibility, setForceVisibility] = useState<'keep_csv' | 'church' | 'private'>('keep_csv');

  // Automatically sync target church whenever modal opens
  useEffect(() => {
    if (importModalOpen && currentChurch?.id) {
      setSelectedChurchId(currentChurch.id);
    }
  }, [importModalOpen, currentChurch?.id]);

  // Result state
  const [importResult, setImportResult] = useState<{
    success: boolean;
    count: number;
    churchName: string;
  } | null>(null);

  if (!importModalOpen) return null;

  const targetChurchObj = churches.find((c) => c.id === selectedChurchId) || currentChurch;

  const buildCustomMapping = (mappings: { [colIndex: number]: string }): Partial<CSVColumnMapping> => {
    const result: Partial<CSVColumnMapping> = {
      colDate: -1,
      colName: -1,
      colTitle: -1,
      colContent: -1,
      colRequest: -1,
      colClass: -1,
      colType: -1,
      colCategory: -1,
      colVisibility: -1,
      colUrgent: -1,
      colEmail: -1,
      colPhone: -1,
      colAnswered: -1,
    };

    Object.entries(mappings).forEach(([idxStr, field]) => {
      const idx = parseInt(idxStr, 10);
      if (field === 'title') {
        result.colTitle = idx;
        result.colRequest = idx;
      } else if (field === 'name') {
        result.colName = idx;
      } else if (field === 'content') {
        result.colContent = idx;
      } else if (field === 'category') {
        result.colCategory = idx;
      } else if (field === 'date') {
        result.colDate = idx;
      } else if (field === 'class') {
        result.colClass = idx;
      } else if (field === 'type') {
        result.colType = idx;
        result.colAnswered = idx;
      } else if (field === 'visibility') {
        result.colVisibility = idx;
      } else if (field === 'urgent') {
        result.colUrgent = idx;
      } else if (field === 'email') {
        result.colEmail = idx;
      } else if (field === 'phone') {
        result.colPhone = idx;
      }
    });

    return result;
  };

  const autoDetectMappings = (headers: string[], rows: string[][]): { [colIndex: number]: string } => {
    const { mapping } = detectCSVColumnMapping(rows);
    const mappings: { [colIndex: number]: string } = {};

    headers.forEach((h, idx) => {
      const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (idx === mapping.colDate || clean.includes('date') || clean.includes('time') || clean === 'created' || clean === 'submitted') {
        mappings[idx] = 'date';
      } else if (idx === mapping.colClass || clean.includes('class') || clean.includes('group') || clean.includes('study')) {
        mappings[idx] = 'class';
      } else if (idx === mapping.colName || clean.includes('name') || clean.includes('requester') || clean.includes('member') || clean.includes('person') || clean.includes('who')) {
        mappings[idx] = 'name';
      } else if (
        idx === mapping.colRequest ||
        clean === 'request' ||
        clean === 'requests' ||
        clean.includes('prayer') ||
        clean.includes('need') ||
        clean.includes('short') ||
        clean.includes('title') ||
        clean.includes('headline') ||
        clean.includes('topic') ||
        clean.includes('statement')
      ) {
        mappings[idx] = 'title';
      } else if (idx === mapping.colCategory || clean.includes('cat') || clean.includes('tag') || clean.includes('ministry')) {
        mappings[idx] = 'category';
      } else if (idx === mapping.colType || clean === 'type' || clean.includes('praise')) {
        mappings[idx] = 'type';
      } else if (idx === mapping.colContent || clean.includes('detail') || clean.includes('desc') || clean.includes('content') || clean.includes('body')) {
        mappings[idx] = 'content';
      } else if (idx === mapping.colVisibility || clean.includes('visib')) {
        mappings[idx] = 'visibility';
      } else if (idx === mapping.colUrgent || clean.includes('urgent')) {
        mappings[idx] = 'urgent';
      } else if (idx === mapping.colEmail || clean.includes('email')) {
        mappings[idx] = 'email';
      } else if (idx === mapping.colPhone || clean.includes('phone')) {
        mappings[idx] = 'phone';
      } else {
        mappings[idx] = 'ignore';
      }
    });

    return mappings;
  };

  const handleProcessCsvText = (text: string, sourceName?: string) => {
    setCsvRawText(text);
    if (sourceName) setFileName(sourceName);
    const rows = parseCSVToRows(text);
    setRawRows(rows);

    const { headers } = detectCSVColumnMapping(rows);
    setCsvHeaders(headers);

    const detected = autoDetectMappings(headers, rows);
    setColumnMappings(detected);

    const custom = buildCustomMapping(detected);
    const parsed = parseCSVToPrayerRequests(text, custom);
    setParsedRows(parsed);
    setImportResult(null);
    setActiveStep('mapping');
  };

  const handleUpdateColumnMapping = (colIdx: number, newField: string) => {
    const updated = { ...columnMappings, [colIdx]: newField };
    setColumnMappings(updated);
    const custom = buildCustomMapping(updated);
    const reParsed = parseCSVToPrayerRequests(csvRawText, custom);
    setParsedRows(reParsed);
  };

  const handleResetToAutoDetect = () => {
    const detected = autoDetectMappings(csvHeaders, rawRows);
    setColumnMappings(detected);
    const custom = buildCustomMapping(detected);
    const reParsed = parseCSVToPrayerRequests(csvRawText, custom);
    setParsedRows(reParsed);
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
    link.setAttribute('download', `prayer_requests_template_${targetChurchObj.slug || 'church'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleData = () => {
    const sampleWithChurch = `Title,Content,Requester Name,Category,Visibility,Is Urgent,Requester Email,Requester Phone,Is Answered
"Upcoming cardiac bypass surgery for Harold Sterling","My grandfather Harold is scheduled for a triple bypass surgery this Thursday morning at Dallas Medical. Please pray for steady hands for the surgical team, peace of mind for my grandmother Martha, and a smooth recovery.","Rebecca Sterling","Health & Healing","church","true","rebecca.s@gmail.com","(555) 345-6789","false"
"Peace and comfort for the Miller family following loss of Evelyn","Our beloved sister Evelyn Miller went home to be with Jesus on Sunday evening. Please surround her husband Greg and their children with prayers of comfort during this tender season of mourning.","Pastoral Care Team","Comfort & Grief","church","false","","","false"
"Praise for new job provision!","Praise God! After 5 months of searching and prayer, the Lord opened the door to a wonderful position. Thank you ${targetChurchObj.name} family for standing in faith with us!","Michael Chen","Praise & Thanksgiving","church","false","mchen@gmail.com","(555) 890-1234","true"
"Confidential pastoral prayer for marriage restoration","Pastoral staff of ${targetChurchObj.name}, please hold our family in confidential prayer during this challenging season. Trusting the Lord for wisdom and reconciliation.","Anonymous","Family & Relationships","private","false","","","false"
"Youth Missions Outreach Trip to Appalachia","Lifting up our 18 high school students and chaperones heading out next week for summer home repair mission outreach in Mountain City. Pray for salvation, safety, and unity.","Pastor ${targetChurchObj.pastorName || 'David Matthews'}","Missions & Outreach","church","false","missions@${targetChurchObj.slug || 'church'}.org","","false"`;

    handleProcessCsvText(sampleWithChurch, `sample_prayers_grace_standard.csv`);
  };

  const handleLoadCalvaryBaptistFile = () => {
    const calvaryChurch = churches.find((c) => c.id === 'church-calvary-baptist' || c.slug.includes('calvary'));
    if (calvaryChurch) {
      setSelectedChurchId(calvaryChurch.id);
    }
    const calvaryCsv = `date,class,name,request,category,type
2026-10-04,Joy,Wanda D.,GI doctor on Monday,Health,Request
2026-10-04,Joy,Karen,Unspoken - Mother - travel for nephew & family,Unspoken,Request
2026-10-04,Joy,Sue S.,Nancy B.,General,Request
2026-10-04,Joy,Joy,Unspoken,Unspoken,Request
2026-10-04,Joy,Glenda,Laser treatment for back & legs,Health,Request
2026-10-04,Joy,Pat R.,Unspoken,Unspoken,Request
2026-10-04,Joy,Gail,Son (Michael) still testing for toxicity - Gail tests on Friday,Health,Request
2026-10-04,Joy,Faye,"Brother-in-law Ronnie - anxiety, oxygen dependent, and sister",Health,Request
2026-10-04,Joy,Coach Bud Burtnett,Cancer,Health,Request
2026-10-04,Pairs & Spares / The Seekers,Christina,Daughter Sara,Family,Request
2026-10-04,Pairs & Spares / The Seekers,Kim Kidd,Traveling,Travel,Request
2026-10-04,Pairs & Spares / The Seekers,Shawna Garland,Brain bleed,Health,Request
2026-10-04,Pairs & Spares / The Seekers,Patty,Back trouble,Health,Request
,,Teresa M.,Son's in-laws are moving to Ohio,Family,Request
,,Peggy M.,Does not have to go back to UT for medical follow-up,Praise,Praise
,,Teresa M.,Starting work on their house,Praise,Praise
,Thursday Night Ladies Bible Study,Nancy B.,Prayers for son Jeff as he will be having heart surgery,Health,Request
,Thursday Night Ladies Bible Study,Nancy B.,For herself - issues with breathing and meds,Health,Request
,Thursday Night Ladies Bible Study,Faye,Prayers for Gretchen's mother (salvation),Salvation,Request
,Thursday Night Ladies Bible Study,Faye,Prayers for niece Stacy - conviction and salvation,Salvation,Request
,,Nancy G.,"Mother - daughters, sisters",Family,Request
,,Liz,Shona - brain bleed at UT (daughter going back home),Health,Request
,,Mary Ann,Niece (Julie) - Bell's palsy - Ladies Fall luncheon,Health,Request
,,Nancy B.,Issues with breathing and meds,Health,Request
,,Jaye,Betty Caldwell at Patricia Neal - now at UT because of heart issues,Health,Request
,,Paula,Cancer doctor on Monday,Health,Request
,,,Unspoken,Unspoken,Request
,Pairs & Spares / The Seekers,,Fish Fry,Praise,Praise
,Pairs & Spares / The Seekers,Kim,Traveling safety,Travel,Request
,Pairs & Spares / The Seekers,Judy Howard,Sickness,Health,Request
,Pairs & Spares / The Seekers,Patty,Back injury,Health,Request
2026-10-05,Monday Morning Prayers,Judy H. and Dana,Pray for healing for Judy,Health,Request
2026-10-05,Monday Morning Prayers,Nancy B.,Continued issues with SIL,Family,Request
2026-10-05,Monday Morning Prayers,Sue S.,Neighbor passed away last evening - pray for family,Grief,Request
2026-10-05,Monday Morning Prayers,Laura W.,Issues with shoulder and arm pain,Health,Request
2026-10-05,Monday Morning Prayers,Faye,"Brother-in-law Ronnie - lots of health issues related to breathing and weakness; also prayers for his wife (Faye's sister)",Health,Request
2026-10-05,Monday Morning Prayers,Faye,Prayers for niece Stacy (salvation),Salvation,Request
2026-10-05,Monday Morning Prayers,Faye,John - not feeling well,Health,Request
2026-10-05,Monday Morning Prayers,Mary Ann,Brother traveling on Wednesday,Travel,Request
2026-10-05,Monday Morning Prayers,Mary Ann,"Ladies Fall luncheon, Saturday women's prayer group",General,Request
2026-10-05,Monday Morning Prayers,Mary Ann,Friend Carla Robinson in CCU - had a heart attack,Health,Request
2026-10-05,Monday Morning Prayers,Sue S.,Great-grandbaby may be coming home this week,Praise,Praise
2026-10-05,Monday Morning Prayers,Mary Ann,Thankful to have both sisters in church on Sunday,Praise,Praise`;

    handleProcessCsvText(calvaryCsv, 'calvary_baptist_43_prayers.csv');
  };

  const handleAICategorizePreview = async () => {
    if (parsedRows.length === 0) return;
    setIsAICategorizingPreview(true);
    try {
      const itemsPayload = parsedRows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        requesterName: r.requesterName,
      }));

      const res = await fetch('/api/batch-categorize-prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          const map = new Map<string, any>();
          data.results.forEach((it: any) => map.set(it.id, it));

          setParsedRows((prev) =>
            prev.map((row) => {
              const match = map.get(row.id);
              if (match) {
                return {
                  ...row,
                  category: match.category as RequestCategory,
                  title: match.refinedTitle || row.title,
                  isAnswered: match.isAnswered !== undefined ? match.isAnswered : row.isAnswered,
                  isUrgent: match.isUrgent !== undefined ? match.isUrgent : row.isUrgent,
                };
              }
              return row;
            })
          );
        }
      }
    } catch (err) {
      console.warn('AI preview categorization error:', err);
    } finally {
      setIsAICategorizingPreview(false);
    }
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
    setCsvHeaders([]);
    setRawRows([]);
    setColumnMappings({});
    setParsedRows([]);
    setImportResult(null);
    setActiveStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.isValid);
    if (selectedRows.length === 0) return;

    const finalChurch = targetChurchObj;

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
        churchId: finalChurch.id,
        status: importStatus,
      };
    });

    const count = importPrayerRequestsBatch(batchToImport);
    setImportResult({
      success: true,
      count,
      churchName: finalChurch.name,
    });
  };

  const selectedCount = parsedRows.filter((r) => r.selected && r.isValid).length;
  const sampleDataRows = rawRows.slice(1, 4);

  // Live Card Preview Item (Row 1 or first valid row)
  const previewItem = parsedRows[0] || {
    title: 'GI doctor on Monday',
    requesterName: 'Wanda D.',
    content: '[Joy] GI doctor on Monday',
    category: 'Health & Healing' as RequestCategory,
    createdAt: new Date().toISOString(),
    isUrgent: false,
    isAnswered: false,
  };

  const previewItem2 = parsedRows[1] || {
    title: 'Unspoken - Mother - travel for nephew & family',
    requesterName: 'Karen',
    content: '[Joy] Unspoken - Mother - travel for nephew & family',
    category: 'Family & Relationships' as RequestCategory,
    createdAt: new Date().toISOString(),
    isUrgent: false,
    isAnswered: false,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif-church font-bold text-lg text-white">
                  Import Prayer Requests from Spreadsheet / CSV
                </h3>
                <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ChurchIcon className="w-3 h-3 text-amber-200" />
                  <span>Target: {targetChurchObj.name}</span>
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Match columns to fields so prayer titles, requesters, and categories appear with the same high polish as Grace Fellowship Church.
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

        {/* Multi-Step Workflow Tabs Bar */}
        {!importResult && parsedRows.length > 0 && (
          <div className="bg-stone-100 border-b border-stone-200 px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveStep('upload')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStep === 'upload'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>1. Select File</span>
              </button>

              <span className="text-stone-400">→</span>

              <button
                onClick={() => setActiveStep('mapping')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeStep === 'mapping'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-stone-800 bg-amber-100/70 hover:bg-amber-200/70 border border-amber-300'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>2. Match Import Fields ★</span>
              </button>

              <span className="text-stone-400">→</span>

              <button
                onClick={() => setActiveStep('review')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStep === 'review'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>3. Review & Import ({parsedRows.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-mono">
                {fileName || 'File Loaded'} • {parsedRows.length} Requests
              </span>
            </div>
          </div>
        )}

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
                  All requests have been added to <strong>{importResult.churchName}</strong> with clean titles, requesters, and categories matching Grace Fellowship Church.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (targetChurchObj.id !== currentChurch.id) {
                      setCurrentChurchId(targetChurchObj.id);
                    }
                    setImportModalOpen(false);
                    handleReset();
                    setActiveTab('wall');
                  }}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>View {importResult.churchName} Prayer Wall</span>
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
              {/* TARGET CHURCH ACCOUNT BANNER */}
              <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                    <ChurchIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider bg-amber-200/80 px-2 py-0.5 rounded">
                        Active Destination Account
                      </span>
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Importing into {targetChurchObj.name}
                      </span>
                    </div>
                    <h4 className="font-serif-church font-bold text-base text-stone-900 mt-1">
                      {targetChurchObj.name}
                    </h4>
                    <p className="text-xs text-stone-500">
                      {targetChurchObj.city}, {targetChurchObj.state} • Senior Pastor: {targetChurchObj.pastorName || 'Pastoral Staff'}
                      {targetChurchObj.websiteUrl ? ` • ${targetChurchObj.websiteUrl}` : ''}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-bold shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{targetChurchObj.id === currentChurch.id ? 'Current Active Church' : 'Selected Church'}</span>
                  </span>
                </div>
              </div>

              {/* TARGET CHURCH & IMPORT DEFAULTS BAR */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Church selector */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ChurchIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>Destination Church Account</span>
                  </label>
                  <select
                    value={selectedChurchId}
                    onChange={(e) => setSelectedChurchId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 font-semibold text-stone-900 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {churches.map((church) => (
                      <option key={church.id} value={church.id}>
                        {church.name} {church.id === currentChurch.id ? '★ (Your Active Account)' : `(${church.city}, ${church.state})`}
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
                    <option value="church">Force all to Church Wall (Standard Like Grace Fellowship)</option>
                    <option value="keep_csv">Use Visibility in CSV (Church / Private)</option>
                    <option value="private">Force all to Private (Pastoral Staff Only)</option>
                  </select>
                </div>
              </div>

              {/* STEP 1: UPLOAD & TEMPLATE HELPER */}
              {activeStep === 'upload' && (
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
                      Upload your spreadsheet. On the next screen, you will be able to match each column to your prayer fields!
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleLoadCalvaryBaptistFile}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Load Calvary Baptist's 43 prayer requests spreadsheet"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>⚡ Load Calvary Baptist's 43 Prayer Requests</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadSampleData}
                        className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-lg font-semibold text-xs border border-stone-300 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="Test with Grace Fellowship Standard prayers"
                      >
                        <span>Grace Fellowship Sample (5 items)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSampleTemplate}
                        className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-lg font-semibold text-xs border border-stone-300 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="Download sample CSV template"
                      >
                        <Download className="w-3.5 h-3.5 text-stone-500" />
                        <span>Download Blank Template</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRawTextarea(!showRawTextarea)}
                      className="text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer underline"
                    >
                      {showRawTextarea ? 'Hide Raw Text Box' : 'Paste CSV Text Manually'}
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
                        placeholder={`date,class,name,request,category,type\n2026-10-04,Joy,Wanda D.,GI doctor on Monday,Health,Request`}
                        className="w-full p-3 font-mono text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleProcessCsvText(csvRawText, 'Pasted Text')}
                          disabled={!csvRawText.trim()}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2"
                        >
                          <span>Proceed to Match Fields →</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: FIELD MATCHER (INTERACTIVE COLUMN MAPPING) */}
              {activeStep === 'mapping' && (
                <div className="space-y-6">
                  {/* Explainer Banner */}
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-amber-700" />
                        <h4 className="font-bold text-stone-900 text-sm">
                          Match Your Spreadsheet Columns to GraceWall Fields
                        </h4>
                      </div>
                      <p className="text-xs text-stone-600">
                        Select which column corresponds to the <strong>Prayer Title (Headline)</strong>, <strong>Requester Name</strong>, and <strong>Ministry Category</strong>. Look at the live card preview below to verify it matches Grace Fellowship Church!
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetToAutoDetect}
                        className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="Re-run auto-detection on headers"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                        <span>⚡ Auto-Detect Best Match</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAICategorizePreview}
                        disabled={isAICategorizingPreview}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Use Gemini AI to categorize into Health & Healing, Family, etc."
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isAICategorizingPreview ? 'animate-spin' : ''}`} />
                        <span>{isAICategorizingPreview ? 'AI Categorizing...' : '✨ AI Polish & Categorize'}</span>
                      </button>
                    </div>
                  </div>

                  {/* COLUMN MAPPING GRID */}
                  <div>
                    <h5 className="font-bold text-stone-800 text-xs uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>Detected Columns in Your File ({csvHeaders.length} columns)</span>
                      <span className="text-[11px] font-normal text-stone-500">
                        Choose the matching field for each column below:
                      </span>
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {csvHeaders.map((headerName, idx) => {
                        const currentMappedField = columnMappings[idx] || 'ignore';
                        const currentFieldMeta = SYSTEM_FIELDS.find((f) => f.value === currentMappedField) || SYSTEM_FIELDS[SYSTEM_FIELDS.length - 1];

                        // Gather sample values from rows for this column
                        const samples = sampleDataRows
                          .map((r) => r[idx])
                          .filter((val) => val && val.trim().length > 0)
                          .slice(0, 2);

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border-2 transition-all space-y-2.5 bg-white shadow-2xs ${
                              currentMappedField !== 'ignore'
                                ? 'border-amber-400 bg-amber-50/20'
                                : 'border-stone-200 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-bold">
                                Col {idx + 1}
                              </span>
                              <span className="font-bold text-stone-900 text-xs font-mono truncate max-w-[150px]" title={headerName}>
                                "{headerName}"
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentFieldMeta.badgeColor}`}>
                                {currentFieldMeta.icon} {currentMappedField}
                              </span>
                            </div>

                            {/* Dropdown Selector */}
                            <div>
                              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                                Maps To System Field:
                              </label>
                              <select
                                value={currentMappedField}
                                onChange={(e) => handleUpdateColumnMapping(idx, e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                  currentMappedField === 'title'
                                    ? 'bg-amber-100 text-amber-950 border-amber-400 ring-1 ring-amber-300'
                                    : currentMappedField === 'name'
                                    ? 'bg-blue-50 text-blue-950 border-blue-400'
                                    : currentMappedField === 'category'
                                    ? 'bg-emerald-50 text-emerald-950 border-emerald-400'
                                    : 'bg-white text-stone-800 border-stone-300'
                                }`}
                              >
                                {SYSTEM_FIELDS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.icon} {opt.label}
                                  </option>
                                ))}
                              </select>
                              <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                                {currentFieldMeta.desc}
                              </p>
                            </div>

                            {/* Sample Data preview */}
                            <div className="pt-2 border-t border-stone-100">
                              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-0.5">
                                Sample Data:
                              </span>
                              <div className="space-y-1">
                                {samples.length > 0 ? (
                                  samples.map((sVal, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="text-[11px] font-mono text-stone-700 bg-stone-100/80 px-2 py-0.5 rounded truncate"
                                      title={sVal}
                                    >
                                      {sVal}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-stone-400 italic">
                                    (empty in sample rows)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LIVE CARD PREVIEW (GRACE FELLOWSHIP STANDARD) */}
                  <div className="bg-stone-100/90 border-2 border-amber-300 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-amber-700" />
                        <h4 className="font-bold text-stone-900 text-sm font-serif-church">
                          Live Preview: How Your Cards Will Look on Church Wall
                        </h4>
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ★ Grace Fellowship Standard Format
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500">
                        Updates automatically as you change dropdowns above
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Preview Card 1 */}
                      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-md space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded-md font-semibold text-[11px] border border-stone-200">
                              {previewItem.category}
                            </span>
                            <span className="flex items-center gap-1 bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium text-[11px]">
                              <ChurchIcon className="w-3 h-3 text-stone-500" />
                              <span>Church Wall</span>
                            </span>
                          </div>
                          <span className="text-stone-400 text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {previewItem.createdAt
                                ? new Date(previewItem.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Oct 4'}
                            </span>
                          </span>
                        </div>

                        <div>
                          <h3 className="font-serif-church text-lg font-bold text-stone-950 leading-snug">
                            {previewItem.title}
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Requested by <span className="font-semibold text-stone-800">{previewItem.requesterName}</span>
                          </p>
                        </div>

                        <p className="text-sm text-stone-700 leading-relaxed">
                          {previewItem.content}
                        </p>

                        <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                          <span className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-bold">
                            🧡 I Prayed for This (1)
                          </span>
                          <span className="text-[11px] text-stone-400">
                            Ready for Prayer Wall
                          </span>
                        </div>
                      </div>

                      {/* Preview Card 2 */}
                      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-md space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded-md font-semibold text-[11px] border border-stone-200">
                              {previewItem2.category}
                            </span>
                            <span className="flex items-center gap-1 bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium text-[11px]">
                              <ChurchIcon className="w-3 h-3 text-stone-500" />
                              <span>Church Wall</span>
                            </span>
                          </div>
                          <span className="text-stone-400 text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {previewItem2.createdAt
                                ? new Date(previewItem2.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Oct 4'}
                            </span>
                          </span>
                        </div>

                        <div>
                          <h3 className="font-serif-church text-lg font-bold text-stone-950 leading-snug">
                            {previewItem2.title}
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Requested by <span className="font-semibold text-stone-800">{previewItem2.requesterName}</span>
                          </p>
                        </div>

                        <p className="text-sm text-stone-700 leading-relaxed">
                          {previewItem2.content}
                        </p>

                        <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                          <span className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-bold">
                            🧡 I Prayed for This (1)
                          </span>
                          <span className="text-[11px] text-stone-400">
                            Ready for Prayer Wall
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs text-stone-600 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          Notice how the <strong>Prayer Headline</strong> is the actual petition, while <strong>Requested by</strong> displays the member name!
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveStep('review')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Looks Great! Review All {parsedRows.length} Rows</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PREVIEW & REVIEW TABLE OF PARSED ROWS */}
              {activeStep === 'review' && (
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
                        • {selectedCount} selected for import into {targetChurchObj.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveStep('mapping')}
                        className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-lg border border-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Sliders className="w-3 h-3 text-amber-800" />
                        <span>Adjust Field Mapping</span>
                      </button>

                      <span className="text-stone-300">•</span>

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
                              className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </th>
                          <th className="py-2.5 px-3">Headline (Title) & Prayer Details</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Requester Name</th>
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
              <span>
                {activeStep === 'mapping'
                  ? 'Verify titles and requesters before importing to guarantee clean display.'
                  : 'CSV files can be created in Excel, Google Sheets, or exported from church management tools.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeStep === 'review' && (
                <button
                  type="button"
                  onClick={() => setActiveStep('mapping')}
                  className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Field Matcher</span>
                </button>
              )}

              {activeStep === 'mapping' && (
                <button
                  type="button"
                  onClick={() => setActiveStep('review')}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <span>Review Rows ({parsedRows.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

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
                    ? `Import ${selectedCount} Prayer Requests into ${targetChurchObj.name}`
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
