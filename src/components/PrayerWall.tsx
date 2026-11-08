import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PrayerRequest, RequestCategory, WallLayoutType } from '../types';
import { getChurchTheme } from '../utils/theme';
import { ChurchBrandingModal } from './ChurchBrandingModal';
import { EditPrayerModal } from './EditPrayerModal';
import {
  Heart,
  Sparkles,
  Search,
  Check,
  Shield,
  Archive,
  RotateCcw,
  ChevronDown,
  Palette,
  Upload,
  Pencil,
  MessageCircle,
  X,
  CheckSquare,
  Trash2,
  Plus,
  Rows3,
  LayoutGrid,
  AlignLeft,
  Settings2,
  Flame,
  CheckCircle2,
  Lock,
  Calendar,
  Send,
} from 'lucide-react';
import { PrayingHands } from './icons/PrayingHands';

const CATEGORIES: RequestCategory[] = [
  'Health & Healing',
  'Comfort & Grief',
  'Family & Relationships',
  'Spiritual Growth',
  'Missions & Outreach',
  'Praise & Thanksgiving',
  'Guidance & Provision',
  'General',
];

type CardLayout = 'list' | 'cards' | 'simple';
const LAYOUT_KEY = 'prayerkeeper.cardLayout';

// Each visitor's layout choice is remembered in their browser; until they choose, use the
// church's default layout setting
const readSavedLayout = (): CardLayout | null => {
  try {
    const v = localStorage.getItem(LAYOUT_KEY);
    return v === 'list' || v === 'cards' || v === 'simple' ? v : null;
  } catch {
    return null;
  }
};
const layoutFromChurchDefault = (d?: WallLayoutType): CardLayout =>
  d === 'grid' || d === 'masonry' ? 'cards' : d === 'compact' ? 'simple' : 'list';

interface PrayerWallProps {
  forceSingleColumn?: boolean;
  /** Show the floating "Share a Prayer" button on phones (the app, not the embed) */
  floatingShareButton?: boolean;
  overrideLayout?: WallLayoutType;
  /** Leave out the church name / scripture card (website embed "wall only") */
  hideChurchBanner?: boolean;
}

export const PrayerWall: React.FC<PrayerWallProps> = ({ forceSingleColumn = false, hideChurchBanner = false, floatingShareButton = false }) => {
  const {
    currentChurch,
    filteredChurchRequests,
    incrementPrayerCount,
    setSubmitModalOpen,
    setImportModalOpen,
    activeRole,
    togglePrayerAnswered,
    updateRequestModeration,
    togglePrayerArchived,
    bulkArchiveAnsweredPrayers,
    bulkArchiveOlderWallPrayers,
    restoreAllWallArchives,
    setPrayersArchived,
    deletePrayerRequests,
    repairDateTitles,
  } = useApp();

  const currentTheme = getChurchTheme(currentChurch);
  const [brandingModalOpen, setBrandingModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PrayerRequest | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);
  const [filterAnsweredOnly, setFilterAnsweredOnly] = useState(false);
  const [wallViewMode, setWallViewMode] = useState<'active' | 'archived'>('active');
  const [encouragementInputs, setEncouragementInputs] = useState<Record<string, string>>({});
  const [showEncouragementBox, setShowEncouragementBox] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const isStaff = activeRole === 'church_staff' || activeRole === 'super_admin';
  const [selectMode, setSelectMode] = useState(false);
  const [layout, setLayout] = useState<CardLayout>(
    () => readSavedLayout() || layoutFromChurchDefault(currentChurch.settings?.defaultWallLayout)
  );
  const changeLayout = (next: CardLayout) => {
    setLayout(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      // private browsing: the choice just isn't remembered
    }
  };
  const [staffToolsOpen, setStaffToolsOpen] = useState(false);
  const staffToolsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!staffToolsOpen) return;
    const close = (e: MouseEvent) => {
      if (staffToolsRef.current && !staffToolsRef.current.contains(e.target as Node)) setStaffToolsOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [staffToolsOpen]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Selections belong to one church and one view (active or archived)
  useEffect(() => {
    exitSelectMode();
  }, [currentChurch.id, wallViewMode, isStaff]);
  const openRequest = openRequestId ? filteredChurchRequests.find((r) => r.id === openRequestId) || null : null;

  const openCard = (id: string, withEncouragement = false) => {
    setOpenRequestId(id);
    setShowEncouragementBox((prev) => ({ ...prev, [id]: withEncouragement }));
  };

  useEffect(() => {
    if (!openRequestId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenRequestId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openRequestId]);

  // Filter requests:
  // Non-staff only see active approved requests with 'church' or 'global' visibility.
  // Staff see requests based on wallViewMode ('active' vs 'archived').
  const visibleRequests = filteredChurchRequests.filter((r) => {
    // Basic status filter
    if (activeRole === 'congregation_member' || activeRole === 'embed_view') {
      if (r.status !== 'approved') return false;
      if (r.visibility === 'private') return false;
      if (r.isArchived) return false;
    } else {
      // Staff / super admin
      if (r.status === 'rejected') return false;
      if (wallViewMode === 'active' && r.isArchived) return false;
      if (wallViewMode === 'archived' && !r.isArchived) return false;
    }

    // Category filter
    if (selectedCategory !== 'All' && r.category !== selectedCategory) {
      return false;
    }

    // Urgent filter
    if (filterUrgentOnly && !r.isUrgent) {
      return false;
    }

    // Answered filter
    if (filterAnsweredOnly && !r.isAnswered) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchContent = r.content.toLowerCase().includes(q);
      const matchName = r.requesterName.toLowerCase().includes(q);
      const matchCat = r.category.toLowerCase().includes(q);
      return matchTitle || matchContent || matchName || matchCat;
    }

    return true;
  });

  const visibleCountBase = filteredChurchRequests.filter((r) =>
    activeRole === 'congregation_member' || activeRole === 'embed_view'
      ? r.status === 'approved' && r.visibility !== 'private' && !r.isArchived
      : r.status !== 'rejected' && (wallViewMode === 'archived' ? r.isArchived : !r.isArchived)
  );

  const totalActiveWallCount = filteredChurchRequests.filter((r) => !r.isArchived && r.status === 'approved').length;
  const totalArchivedWallCount = filteredChurchRequests.filter((r) => r.isArchived).length;
  const totalPrayersCount = filteredChurchRequests.reduce((sum, r) => sum + r.prayerCount, 0);
  const answeredCount = filteredChurchRequests.filter((r) => r.isAnswered).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePray = (req: PrayerRequest) => {
    incrementPrayerCount(req.id);
    const title = req.title.length > 40 ? `${req.title.slice(0, 40).trim()}...` : req.title;
    const others = req.prayerCount;
    showToast(
      others === 0
        ? `You're the first to pray for "${title}"`
        : `You joined ${others} ${others === 1 ? 'other' : 'others'} in praying for "${title}"`
    );
  };

  const handleAddEncouragement = (requestId: string) => {
    const text = encouragementInputs[requestId]?.trim();
    if (!text) return;
    incrementPrayerCount(requestId, text);
    setEncouragementInputs((prev) => ({ ...prev, [requestId]: '' }));
    setShowEncouragementBox((prev) => ({ ...prev, [requestId]: false }));
    showToast('Your prayer encouragement has been sent to the requester! 🙏');
  };

  const quickEncouragements = [
    'Praying for healing and complete peace today 🙏',
    'Standing in agreement with you in faith!',
    'The Lord is near to the brokenhearted (Psalm 34:18)',
    'Lifting your family up before the Father today.',
  ];

  const urgentCount = visibleCountBase.filter((r) => r.isUrgent).length;
  const praiseCount = visibleCountBase.filter((r) => r.isAnswered).length;
  const categoriesShown = CATEGORIES.filter((cat) => visibleCountBase.some((r) => r.category === cat));

  // Shared pieces of every card layout
  const dotColor = (req: PrayerRequest) =>
    req.isArchived ? '#9b6fd0' : req.isUrgent ? '#e2566b' : req.isAnswered ? '#3aa676' : '#43b1a4';

  const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const statusTags = (req: PrayerRequest) => (
    <>
      {req.isUrgent && <span className="text-[#d33a4f] font-semibold whitespace-nowrap"> · Urgent</span>}
      {req.isAnswered && <span className="text-[#1f8a5b] font-semibold whitespace-nowrap"> · Praise</span>}
      {req.visibility === 'private' && <span className="text-purple-700 font-semibold whitespace-nowrap"> · Private</span>}
      {req.isArchived && <span className="text-purple-700 font-semibold whitespace-nowrap"> · Archived</span>}
    </>
  );

  const cardProps = (req: PrayerRequest) => ({
    role: 'button' as const,
    tabIndex: 0,
    'aria-pressed': selectMode ? selectedIds.has(req.id) : undefined,
    onClick: () => (selectMode ? toggleSelected(req.id) : openCard(req.id)),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (selectMode) toggleSelected(req.id);
        else openCard(req.id);
      }
    },
  });

  const selectBox = (req: PrayerRequest) =>
    selectMode && (
      <span
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
          selectedIds.has(req.id) ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300 bg-white'
        }`}
      >
        {selectedIds.has(req.id) && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </span>
    );

  const selectedRing = (req: PrayerRequest) =>
    selectMode && selectedIds.has(req.id) ? 'border-stone-900 ring-1 ring-stone-900' : 'border-stone-200 hover:border-stone-300';

  const prayButton = (req: PrayerRequest, size: 'sm' | 'md' = 'md') => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handlePray(req);
      }}
      className={`flex items-center gap-1 rounded-full border bg-stone-50 border-stone-200 hover:bg-stone-100 font-bold transition-all active:scale-95 cursor-pointer ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-[13px]'
      }`}
      style={{ color: currentTheme.primary, ...(req.prayedByMe ? { borderColor: `${currentTheme.primary}80` } : {}) }}
      title="I prayed for this"
      aria-label={`I prayed for this (${req.prayerCount} prayers)`}
    >
      <PrayingHands className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{req.prayerCount}</span>
    </button>
  );

  const encourageButton = (req: PrayerRequest) => {
    const count = req.recentEncouragements?.length || 0;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openCard(req.id, true);
        }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border bg-stone-50 border-stone-200 hover:bg-stone-100 text-[13px] font-bold transition-all active:scale-95 cursor-pointer"
        style={{ color: currentTheme.primary }}
        title="Send encouragement"
        aria-label="Send encouragement"
      >
        <MessageCircle className="w-4 h-4" />
        {count > 0 && <span>{count}</span>}
      </button>
    );
  };

  const layoutOptions: Array<{ id: CardLayout; label: string; icon: React.ReactNode }> = [
    { id: 'list', label: 'List', icon: <Rows3 className="w-4 h-4" /> },
    { id: 'cards', label: 'Cards', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'simple', label: 'Simple', icon: <AlignLeft className="w-4 h-4" /> },
  ];

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors border ${
      active ? 'text-white border-transparent' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
    }`;
  const chipStyle = (active: boolean) => (active ? { backgroundColor: currentTheme.primary } : undefined);

  const staffToolButton =
    'w-full text-left px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-lg flex items-center gap-2.5 cursor-pointer';

  return (
    <div className="prayer-wall-container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 sm:top-auto sm:left-auto sm:bottom-24 sm:right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-stone-700">
          <Heart className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Short welcome: verse and a count of prayers */}
      {!hideChurchBanner && (
        <div className="space-y-1">
          {currentChurch.scriptureVerse && (
            <p className="font-serif-church italic text-stone-700 text-sm sm:text-base leading-snug">
              "{currentChurch.scriptureVerse}"
            </p>
          )}
          <p className="text-xs sm:text-sm text-stone-500">
            <strong className="text-stone-800">{totalActiveWallCount}</strong> prayer requests ·{' '}
            <strong className="text-stone-800">{totalPrayersCount}</strong> prayers offered ·{' '}
            <strong className="text-stone-800">{answeredCount}</strong> praises
          </p>
        </div>
      )}

      {/* Staff tools: which prayers to show, selecting, and the rest in one menu */}
      {isStaff && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-stone-100 p-0.5 rounded-xl text-sm">
            <button
              onClick={() => setWallViewMode('active')}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                wallViewMode === 'active' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              Active ({totalActiveWallCount})
            </button>
            <button
              onClick={() => setWallViewMode('archived')}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                wallViewMode === 'archived' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              Archived ({totalArchivedWallCount})
            </button>
          </div>

          <button
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            className={`text-sm px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold cursor-pointer ${
              selectMode ? 'bg-stone-900 text-white border-stone-900' : 'text-stone-700 border-stone-200 bg-white hover:bg-stone-50'
            }`}
            title="Pick prayers to archive, restore or delete together"
          >
            <CheckSquare className="w-4 h-4" />
            {selectMode ? 'Done' : 'Select'}
          </button>

          <div className="relative" ref={staffToolsRef}>
            <button
              onClick={() => setStaffToolsOpen((o) => !o)}
              className="text-sm px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 font-semibold cursor-pointer"
              aria-expanded={staffToolsOpen}
            >
              <Settings2 className="w-4 h-4" />
              Tools
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {staffToolsOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-30">
                {wallViewMode === 'active' ? (
                  <>
                    <button
                      className={staffToolButton}
                      onClick={() => {
                        setStaffToolsOpen(false);
                        const count = bulkArchiveAnsweredPrayers();
                        showToast(count > 0 ? `Archived ${count} praise reports.` : 'No praises to archive.');
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-stone-500" />
                      Archive praises ({answeredCount})
                    </button>
                    <button
                      className={staffToolButton}
                      onClick={() => {
                        setStaffToolsOpen(false);
                        const count = bulkArchiveOlderWallPrayers(30);
                        showToast(count > 0 ? `Archived ${count} prayers older than 30 days.` : 'No prayers older than 30 days.');
                      }}
                    >
                      <Archive className="w-4 h-4 text-stone-500" />
                      Archive prayers older than 30 days
                    </button>
                    <button
                      className={staffToolButton}
                      onClick={() => {
                        setStaffToolsOpen(false);
                        const ids = filteredChurchRequests.filter((r) => !r.isArchived && r.status === 'approved').map((r) => r.id);
                        if (ids.length === 0) {
                          showToast('There are no active prayers to archive.');
                          return;
                        }
                        if (!window.confirm(`Archive all ${ids.length} active prayers? They'll move to Archived, and you can restore them any time.`)) return;
                        const count = setPrayersArchived(ids, true, 'Archived with all active prayers');
                        exitSelectMode();
                        showToast(`Archived ${count} prayers.`);
                      }}
                    >
                      <Archive className="w-4 h-4 text-stone-500" />
                      Archive all active ({totalActiveWallCount})
                    </button>
                  </>
                ) : (
                  <button
                    className={staffToolButton}
                    disabled={totalArchivedWallCount === 0}
                    onClick={() => {
                      setStaffToolsOpen(false);
                      restoreAllWallArchives();
                      setWallViewMode('active');
                      showToast(`Restored all ${totalArchivedWallCount} archived prayers.`);
                    }}
                  >
                    <RotateCcw className="w-4 h-4 text-stone-500" />
                    Restore all to the wall
                  </button>
                )}
                <div className="border-t border-stone-100 my-1" />
                <button className={staffToolButton} onClick={() => { setStaffToolsOpen(false); setImportModalOpen(true); }}>
                  <Upload className="w-4 h-4 text-stone-500" />
                  Import from a spreadsheet (CSV)
                </button>
                <button className={staffToolButton} onClick={() => { setStaffToolsOpen(false); repairDateTitles(); }}>
                  <Sparkles className="w-4 h-4 text-stone-500" />
                  Tidy up titles & categories
                </button>
                <button className={staffToolButton} onClick={() => { setStaffToolsOpen(false); setBrandingModalOpen(true); }}>
                  <Palette className="w-4 h-4 text-stone-500" />
                  Church logo & colors
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search, layout choice and filters */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Search prayers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl text-base sm:text-sm border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 placeholder:text-stone-400"
              aria-label="Search prayers"
            />
          </div>
          <div className="inline-flex bg-stone-100 p-0.5 rounded-xl shrink-0" role="radiogroup" aria-label="Card layout">
            {layoutOptions.map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={layout === o.id}
                onClick={() => changeLayout(o.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                  layout === o.id ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title={`${o.label} layout`}
              >
                {o.icon}
                <span className="hidden sm:inline">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            className={chip(selectedCategory === 'All' && !filterUrgentOnly && !filterAnsweredOnly)}
            style={chipStyle(selectedCategory === 'All' && !filterUrgentOnly && !filterAnsweredOnly)}
            onClick={() => {
              setSelectedCategory('All');
              setFilterUrgentOnly(false);
              setFilterAnsweredOnly(false);
            }}
          >
            All ({visibleCountBase.length})
          </button>
          {urgentCount > 0 && (
            <button className={chip(filterUrgentOnly)} style={chipStyle(filterUrgentOnly)} onClick={() => setFilterUrgentOnly((v) => !v)}>
              Urgent ({urgentCount})
            </button>
          )}
          {praiseCount > 0 && (
            <button className={chip(filterAnsweredOnly)} style={chipStyle(filterAnsweredOnly)} onClick={() => setFilterAnsweredOnly((v) => !v)}>
              Praises ({praiseCount})
            </button>
          )}
          {categoriesShown.map((cat) => (
            <button
              key={cat}
              className={chip(selectedCategory === cat)}
              style={chipStyle(selectedCategory === cat)}
              onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
            >
              {cat} ({visibleCountBase.filter((r) => r.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* Prayer requests */}
      {visibleRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-stone-200 max-w-lg mx-auto space-y-3">
          <h3 className="font-serif-church text-xl font-bold text-stone-900">
            {filteredChurchRequests.length === 0 ? 'No prayer requests yet' : 'No prayer requests match'}
          </h3>
          <p className="text-sm text-stone-500">
            {filteredChurchRequests.length === 0
              ? 'Be the first to share a prayer request with our church family.'
              : 'Try a different search or filter.'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setSubmitModalOpen(true)}
              style={currentTheme.btnPrimaryStyle}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            >
              Share a Prayer Request
            </button>
            {isStaff && filteredChurchRequests.length === 0 && (
              <button
                onClick={() => setImportModalOpen(true)}
                className="px-4 py-2 bg-white text-stone-700 border border-stone-200 rounded-xl text-sm font-semibold hover:bg-stone-50 cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                Import from a spreadsheet
              </button>
            )}
          </div>
        </div>
      ) : layout === 'cards' ? (
        <div className={`grid gap-3 prayer-cards-grid ${forceSingleColumn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {visibleRequests.map((req) => {
            const body = (req.content || '').replace(/^\[[^\]]+\]\s*/, '').trim();
            const details = body.toLowerCase() !== req.title.trim().toLowerCase() ? body : '';
            return (
              <div
                key={req.id}
                {...cardProps(req)}
                className={`min-w-0 flex flex-col gap-2 p-4 bg-white rounded-2xl border shadow-xs hover:shadow-sm transition-all cursor-pointer ${selectedRing(req)}`}
              >
                <div className="flex items-center gap-2 text-[13px] text-stone-500 min-w-0">
                  {selectBox(req)}
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor(req) }} />
                  <span className="truncate">
                    <span className="font-semibold text-stone-700">{req.requesterName}</span> · {shortDate(req.createdAt)}
                    {statusTags(req)}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-stone-900 leading-snug">{req.title}</h3>
                {details && <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">{details}</p>}
                {!selectMode && (
                  <div className="flex items-center gap-1.5 mt-auto pt-1">
                    {prayButton(req)}
                    {encourageButton(req)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : layout === 'simple' ? (
        <div className={`bg-white rounded-2xl border border-stone-200 px-4 sm:px-6 py-1 prayer-cards-grid ${forceSingleColumn ? '' : 'md:columns-2 md:gap-10'}`}>
          {visibleRequests.map((req) => (
            <div
              key={req.id}
              {...cardProps(req)}
              className={`break-inside-avoid flex items-start gap-2.5 py-2.5 border-b border-stone-100 cursor-pointer ${
                selectMode && selectedIds.has(req.id) ? 'bg-stone-50' : ''
              }`}
            >
              {selectBox(req)}
              <p className="flex-1 min-w-0 text-[15px] leading-snug text-stone-700">
                <strong className="text-stone-900">{req.requesterName}</strong>
                <span className="text-stone-400"> — </span>
                {req.title}
                {(req.isUrgent || req.isAnswered || req.isArchived || req.visibility === 'private') && (
                  <span className="text-xs">{statusTags(req)}</span>
                )}
              </p>
              {!selectMode && prayButton(req, 'sm')}
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-2.5 sm:gap-3 prayer-cards-grid ${forceSingleColumn ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {visibleRequests.map((req) => (
            <div
              key={req.id}
              {...cardProps(req)}
              className={`min-w-0 flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border shadow-xs hover:shadow-sm transition-all cursor-pointer ${selectedRing(req)}`}
            >
              {selectBox(req)}
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor(req) }} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-stone-900 leading-snug line-clamp-2">{req.title}</p>
                <p className="text-[13px] text-stone-500 mt-0.5 truncate">
                  {req.requesterName} · {shortDate(req.createdAt)}
                  {statusTags(req)}
                </p>
              </div>
              {!selectMode && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {prayButton(req)}
                  {encourageButton(req)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Phones: a floating button to share a prayer, always within reach */}
      {floatingShareButton && !selectMode && (
        <button
          onClick={() => setSubmitModalOpen(true)}
          style={currentTheme.btnPrimaryStyle}
          className="md:hidden fixed bottom-4 right-4 z-30 flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full shadow-lg font-semibold text-sm cursor-pointer active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
          Share a Prayer
        </button>
      )}

      {/* Bulk selection bar (staff) */}
      {selectMode && (
        <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 bg-stone-900 text-white rounded-2xl shadow-xl px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="font-bold">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={() =>
              setSelectedIds((prev) =>
                prev.size === visibleRequests.length && visibleRequests.length > 0
                  ? new Set()
                  : new Set(visibleRequests.map((r) => r.id))
              )
            }
            className="underline underline-offset-2 text-stone-200 hover:text-white cursor-pointer"
          >
            {selectedIds.size === visibleRequests.length && visibleRequests.length > 0
              ? 'Clear all'
              : `Select all shown (${visibleRequests.length})`}
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => {
                const archive = wallViewMode === 'active';
                const count = setPrayersArchived([...selectedIds], archive);
                exitSelectMode();
                showToast(
                  archive
                    ? `Archived ${count} ${count === 1 ? 'prayer' : 'prayers'} to the vault.`
                    : `Restored ${count} ${count === 1 ? 'prayer' : 'prayers'} to the active wall.`
                );
              }}
              className="flex items-center gap-1.5 bg-white text-stone-900 font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {wallViewMode === 'active' ? <Archive className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              <span>{wallViewMode === 'active' ? 'Archive' : 'Restore'}</span>
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => {
                const n = selectedIds.size;
                if (!window.confirm(`Permanently delete ${n} ${n === 1 ? 'prayer' : 'prayers'}? This can't be undone. (To hide prayers but keep them, use Archive instead.)`)) return;
                const count = deletePrayerRequests([...selectedIds]);
                exitSelectMode();
                showToast(`Deleted ${count} ${count === 1 ? 'prayer' : 'prayers'}.`);
              }}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={exitSelectMode}
              className="px-2 py-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Full prayer card (opens when a row is tapped) */}
      {openRequest && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setOpenRequestId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={openRequest.title}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl p-5 space-y-3"
          >
            {(() => {
              const req = openRequest;
              return (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      {req.isUrgent && (
                        <span className="flex items-center gap-1 bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          <Flame className="w-3 h-3 text-rose-600" />
                          Urgent Need
                        </span>
                      )}
                      {req.isAnswered && (
                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Answered Prayer / Praise
                        </span>
                      )}
                      {req.visibility === 'private' && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-semibold text-[11px]" title="Private: Staff & Pastors Only">
                          <Lock className="w-3 h-3" />
                          Staff Confidential
                        </span>
                      )}
                      <span className="text-stone-400 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenRequestId(null)}
                      className="p-1.5 -m-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer shrink-0"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Vault Banner if archived */}
                  {req.isArchived && (
                    <div className="bg-purple-50 border border-purple-200/80 rounded-xl p-2.5 text-xs text-purple-900 flex items-center gap-1.5">
                      <Archive className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>
                        <strong>Archived:</strong> {req.archivedReason || 'Archived from active congregation wall'}
                        {req.archivedAt && ` • ${new Date(req.archivedAt).toLocaleDateString()}`}
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="font-serif-church text-xl font-bold text-stone-900 leading-snug">{req.title}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Requested by <span className="font-semibold text-stone-700">{req.requesterName}</span>
                    </p>
                  </div>

                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{req.content}</p>

                  {/* Answered / Praise update highlight if present */}
                  {req.isAnswered && req.answeredUpdate && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Praise Update:
                      </div>
                      <p className="italic">{req.answeredUpdate}</p>
                    </div>
                  )}

                  {/* Staff Confidential Notes (Staff only) */}
                  {req.staffNotes && isStaff && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-purple-800">
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        Pastoral Care Notes:
                      </div>
                      <p>{req.staffNotes}</p>
                      {req.requesterEmail && (
                        <p className="text-[11px] text-purple-700 mt-1">
                          Contact: {req.requesterEmail} {req.requesterPhone && `• ${req.requesterPhone}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Encouragements */}
                  {req.recentEncouragements && req.recentEncouragements.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-[#2f8f84]" />
                        Encouragements
                      </div>
                      <div className="space-y-1.5">
                        {req.recentEncouragements.map((enc, idx) => (
                          <div key={idx} className="text-xs bg-stone-50 rounded-lg p-2 text-stone-600 italic border border-stone-100">
                            "{enc.text}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pray & encourage */}
                  <div className="pt-3 border-t border-stone-100 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handlePray(req)}
                      className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 px-3.5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer border border-stone-200 active:scale-95"
                      style={{ color: currentTheme.primary }}
                    >
                      <PrayingHands className="w-4 h-4" />
                      <span>{req.prayedByMe ? 'I prayed again' : 'I prayed'}</span>
                      <span className="bg-white border border-stone-200 px-1.5 py-0.5 rounded-full text-[11px]">{req.prayerCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEncouragementBox((prev) => ({ ...prev, [req.id]: !prev[req.id] }))}
                      className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 px-3.5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer border border-stone-200 active:scale-95"
                      style={{ color: currentTheme.primary }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Encourage</span>
                    </button>
                  </div>

                  {/* Inline Encouragement Box */}
                  {showEncouragementBox[req.id] && (
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 space-y-2">
                      <p className="text-xs font-medium text-stone-600">Send a gentle note of scripture or prayer:</p>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          placeholder="e.g. Lifting you up in Jesus' name today..."
                          value={encouragementInputs[req.id] || ''}
                          onChange={(e) => setEncouragementInputs((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddEncouragement(req.id);
                          }}
                          className="flex-1 min-w-0 bg-white text-base sm:text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#43b1a4]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddEncouragement(req.id)}
                          className="bg-[#43b1a4] hover:bg-[#2f8f84] text-white p-2.5 rounded-lg cursor-pointer"
                          aria-label="Send encouragement"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {quickEncouragements.map((quick, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => setEncouragementInputs((prev) => ({ ...prev, [req.id]: quick }))}
                            className="text-[11px] bg-white border border-stone-200 text-stone-600 hover:border-[#43b1a4] hover:text-[#2f8f84] px-2 py-1 rounded cursor-pointer transition-colors text-left"
                          >
                            + {quick}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff Quick Actions */}
                  {isStaff && (
                    <div className="pt-3 border-t border-stone-100 flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenRequestId(null);
                          setEditingRequest(req);
                        }}
                        className="text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200"
                        title="Correct the name, wording, category, date or contact details"
                      >
                        <Pencil className="w-3.5 h-3.5 text-stone-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePrayerAnswered(req.id)}
                        className={`text-xs px-2 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                          req.isAnswered
                            ? 'text-stone-500 hover:bg-stone-100 border border-stone-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title="Mark this request as answered to celebrate God's faithfulness"
                      >
                        {req.isAnswered ? 'Unmark Answered' : 'Mark Answered 🙏'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          togglePrayerArchived(req.id, req.isArchived ? undefined : 'Archived by pastoral staff');
                          showToast(req.isArchived ? 'Prayer restored to active wall!' : 'Prayer moved to archived vault.');
                          setOpenRequestId(null);
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                          req.isArchived
                            ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200'
                        }`}
                        title={req.isArchived ? 'Restore to active congregation wall' : 'Archive this prayer off the wall (preserved in vault)'}
                      >
                        {req.isArchived ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                            <span>Restore</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5 text-stone-400" />
                            <span>Archive</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <EditPrayerModal request={editingRequest} onClose={() => setEditingRequest(null)} />

      {/* Church Branding & Theme Customizer Modal */}
      <ChurchBrandingModal
        isOpen={brandingModalOpen}
        onClose={() => setBrandingModalOpen(false)}
      />
    </div>
  );
};
