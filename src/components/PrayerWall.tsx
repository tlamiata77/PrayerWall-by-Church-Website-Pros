import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PrayerRequest, RequestCategory, WallLayoutType } from '../types';
import { getChurchTheme } from '../utils/theme';
import { ChurchBrandingModal } from './ChurchBrandingModal';
import { EditPrayerModal } from './EditPrayerModal';
import {
  Heart,
  Sparkles,
  Flame,
  CheckCircle2,
  Lock,
  Church as ChurchIcon,
  Search,
  Share2,
  Calendar,
  Send,
  MoreVertical,
  Check,
  Shield,
  HelpCircle,
  Archive,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Palette,
  MapPin,
  Phone,
  Mail,
  Upload,
  Pencil,
  MessageCircle,
  X,
  CheckSquare,
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

interface PrayerWallProps {
  forceSingleColumn?: boolean;
  overrideLayout?: WallLayoutType;
  /** Leave out the church name / scripture card (website embed "wall only") */
  hideChurchBanner?: boolean;
}

export const PrayerWall: React.FC<PrayerWallProps> = ({ forceSingleColumn = false, hideChurchBanner = false }) => {
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
    showToast(`You joined with ${req.prayerCount} others in praying for "${req.title.slice(0, 30)}..."`);
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

  return (
    <div className="prayer-wall-container max-w-7xl mx-auto px-2 sm:px-4 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 sm:top-auto sm:left-auto sm:bottom-24 sm:right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-stone-700 animate-bounce">
          <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Church Banner & Scripture Card */}
      {!hideChurchBanner && (
      <div
        className="rounded-2xl p-6 sm:p-8 shadow-xs border relative overflow-hidden bg-white"
        style={{
          borderColor: `${currentTheme.primary}30`,
        }}
      >
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full -mr-20 -mt-20 pointer-events-none opacity-40"
          style={{
            background: `radial-gradient(circle, ${currentTheme.primary}25 0%, transparent 70%)`,
          }}
        />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              {currentChurch.logoUrl ? (
                <img
                  src={currentChurch.logoUrl}
                  alt={`${currentChurch.name} logo`}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-stone-200/90 shadow-xs shrink-0 bg-white"
                />
              ) : (
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-white flex items-center justify-center shadow-xs shrink-0"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <ChurchIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border"
                    style={currentTheme.badgePrimaryStyle}
                  >
                    {currentChurch.denomination}
                  </span>

                  {(activeRole === 'church_staff' || activeRole === 'super_admin') && (
                    <>
                      <button
                        onClick={() => setBrandingModalOpen(true)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded border border-stone-200 cursor-pointer transition-colors"
                        title="Set Church Logo, Address, Contact Info and Theme"
                      >
                        <Palette className="w-3 h-3 text-[#4eb8b9]" />
                        <span>Edit Logo & Theme</span>
                      </button>

                      <button
                        onClick={() => setImportModalOpen(true)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-300 cursor-pointer transition-colors"
                        title="Bulk import prayer requests from a CSV file with visual field matching"
                      >
                        <Upload className="w-3 h-3 text-amber-700" />
                        <span>Import CSV (Field Matcher)</span>
                      </button>

                      <button
                        onClick={() => repairDateTitles()}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 cursor-pointer transition-colors"
                        title="Re-align prayer titles and categories so the headline is the prayer petition (Grace Fellowship style)"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>⚡ Re-align Card Titles & Categories</span>
                      </button>
                    </>
                  )}
                </div>

                <h2 className="font-serif-church text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                  {currentChurch.name} Prayer Wall
                </h2>

                {/* Address & Contact Details */}
                <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5 flex-wrap">
                  {currentChurch.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#4eb8b9]" />
                      <span>
                        {currentChurch.address}, {currentChurch.city}, {currentChurch.state} {currentChurch.zipCode || ''}
                      </span>
                    </span>
                  )}
                  {currentChurch.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{currentChurch.phone}</span>
                    </span>
                  )}
                </div>

                <p className="text-sm text-stone-600 max-w-2xl mt-1.5 leading-relaxed">
                  {currentChurch.welcomeMessage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="rounded-xl px-4 py-2.5 text-center border"
                style={{
                  backgroundColor: `${currentTheme.primary}10`,
                  borderColor: `${currentTheme.primary}30`,
                }}
              >
                <span className="block text-xl font-bold" style={{ color: currentTheme.primary }}>
                  {visibleRequests.length}
                </span>
                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: currentTheme.primary }}>
                  Active Needs
                </span>
              </div>

              <div
                className="rounded-xl px-4 py-2.5 text-center border"
                style={{
                  backgroundColor: `${currentTheme.accent}12`,
                  borderColor: `${currentTheme.accent}30`,
                }}
              >
                <span className="block text-xl font-bold" style={{ color: currentTheme.accent }}>
                  {totalPrayersCount}
                </span>
                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: currentTheme.accent }}>
                  Prayers Logged
                </span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-center hidden sm:block">
                <span className="block text-xl font-bold text-emerald-800">{answeredCount}</span>
                <span className="text-[11px] text-emerald-700 uppercase tracking-wider font-medium">Praises Answered</span>
              </div>
            </div>
          </div>

          {/* Scripture of the week */}
          <div
            className="p-3.5 rounded-r-xl border-l-4 text-stone-700 italic text-sm flex items-start gap-2.5"
            style={{
              backgroundColor: `${currentTheme.primary}08`,
              borderLeftColor: currentTheme.accent,
            }}
          >
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: currentTheme.accent }} />
            <p className="font-serif-church">"{currentChurch.scriptureVerse}"</p>
          </div>
        </div>
      </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-stone-200/80 space-y-3">
        {/* Staff Wall Active vs Archived Toggle */}
        {(activeRole === 'church_staff' || activeRole === 'super_admin') && (
          <div className="space-y-2 border-b border-stone-100 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWallViewMode('active')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    wallViewMode === 'active'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Active Congregation Wall ({totalActiveWallCount})</span>
                </button>

                <button
                  onClick={() => setWallViewMode('archived')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    wallViewMode === 'archived'
                      ? 'bg-purple-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-purple-400" />
                  <span>Archived Prayers Vault ({totalArchivedWallCount})</span>
                </button>
              </div>

              {/* Bulk Archiving & Restoring Tools */}
              <div className="flex items-center gap-2 flex-wrap">
                {wallViewMode === 'active' ? (
                  <>
                    <button
                      onClick={() => {
                        const count = bulkArchiveAnsweredPrayers();
                        showToast(count > 0 ? `Archived ${count} answered praise reports to vault!` : 'No unarchived praises to move.');
                      }}
                      className="text-xs text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                      title="Move answered prayers off the active wall into the testimony archive"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Archive Answered ({answeredCount})</span>
                    </button>

                    <button
                      onClick={() => {
                        const count = bulkArchiveOlderWallPrayers(30);
                        showToast(count > 0 ? `Archived ${count} prayers older than 30 days to vault!` : 'No prayers older than 30 days.');
                      }}
                      className="text-xs text-stone-600 hover:bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                      title="Archive older inactive prayers to keep wall relevant"
                    >
                      <Archive className="w-3 h-3 text-stone-500" />
                      <span>Archive Inactive (&gt;30d)</span>
                    </button>

                    <button
                      onClick={() => {
                        const ids = filteredChurchRequests.filter((r) => !r.isArchived && r.status === 'approved').map((r) => r.id);
                        if (ids.length === 0) {
                          showToast('There are no active prayers to archive.');
                          return;
                        }
                        if (!window.confirm(`Archive all ${ids.length} active prayers? They'll move to the Archived Prayers Vault, and you can restore them any time.`)) return;
                        const count = setPrayersArchived(ids, true, 'Archived with all active prayers');
                        exitSelectMode();
                        showToast(`Archived ${count} prayers to the vault.`);
                      }}
                      className="text-xs text-purple-800 hover:bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                      title="Move every active prayer off the wall into the archive (you can restore them later)"
                    >
                      <Archive className="w-3 h-3 text-purple-600" />
                      <span>Archive All Active ({totalActiveWallCount})</span>
                    </button>
                  </>
                ) : (
                  totalArchivedWallCount > 0 && (
                    <button
                      onClick={() => {
                        restoreAllWallArchives();
                        setWallViewMode('active');
                        showToast(`Restored all ${totalArchivedWallCount} archived prayers back to the active wall!`);
                      }}
                      className="text-xs text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md border border-purple-200 transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                      <span>Restore All to Active Wall</span>
                    </button>
                  )
                )}

                <button
                  onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer flex items-center gap-1 font-bold ${
                    selectMode
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Pick individual prayers to archive or restore together"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{selectMode ? 'Done Selecting' : 'Select'}</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-stone-500 bg-stone-50 rounded-lg p-2 flex items-center justify-between">
              <span>
                {wallViewMode === 'active'
                  ? 'Showing prayers currently visible to congregation members. Pastors can archive resolved requests to maintain a fresh wall.'
                  : 'Pastoral Vault: Historical record of answered prayers and past requests. Archived requests are hidden from congregation view but preserved forever.'}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Full-width Search Input: never squishes or disappears on mobile */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search prayers by name, need, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-stone-50 hover:bg-stone-100/60 focus:bg-white rounded-xl text-sm border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-1 text-xs cursor-pointer font-bold"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Toggles & Active Count */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  filterUrgentOnly
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Urgent Only</span>
              </button>

              <button
                onClick={() => setFilterAnsweredOnly(!filterAnsweredOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  filterAnsweredOnly
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Praises / Answered</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs text-stone-500 font-medium hidden md:inline">
                Showing <strong>{visibleRequests.length}</strong> prayers
              </div>

            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Categories ({filteredChurchRequests.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = filteredChurchRequests.filter((r) => r.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prayer Request Cards Grid */}
      {visibleRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="font-serif-church text-xl font-bold text-stone-900">
            {filteredChurchRequests.length === 0 ? `Welcome to ${currentChurch.name}!` : 'No prayer requests match your filter'}
          </h3>
          <p className="text-sm text-stone-500">
            {filteredChurchRequests.length === 0
              ? `There are no prayer requests yet for ${currentChurch.name}. You can submit a new prayer request or bulk import existing requests from a CSV file.`
              : searchQuery
              ? 'Try changing your search keywords or resetting filters.'
              : 'Be the first to share a prayer request or praise report with our church family.'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Submit Prayer Request
            </button>
            {(activeRole === 'church_staff' || activeRole === 'super_admin') && (
              <button
                onClick={() => setImportModalOpen(true)}
                className="px-4 py-2 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1.5"
                title={`Import CSV prayer requests directly into ${currentChurch.name}`}
              >
                <Upload className="w-4 h-4 text-amber-700" />
                <span>Import CSV into {currentChurch.name}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={`grid gap-2.5 sm:gap-3 prayer-cards-grid ${forceSingleColumn ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {visibleRequests.map((req) => {
              const encouragementCount = req.recentEncouragements?.length || 0;
              return (
                <div
                  key={req.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectMode ? selectedIds.has(req.id) : undefined}
                  onClick={() => (selectMode ? toggleSelected(req.id) : openCard(req.id))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (selectMode) toggleSelected(req.id);
                      else openCard(req.id);
                    }
                  }}
                  className={`min-w-0 flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border shadow-xs hover:shadow-sm transition-all cursor-pointer ${
                    selectMode && selectedIds.has(req.id)
                      ? 'border-stone-900 ring-1 ring-stone-900'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {selectMode && (
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                        selectedIds.has(req.id) ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300 bg-white'
                      }`}
                    >
                      {selectedIds.has(req.id) && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </span>
                  )}
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: req.isArchived ? '#9b6fd0' : req.isUrgent ? '#e2566b' : req.isAnswered ? '#3aa676' : '#43b1a4',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-stone-900 leading-snug line-clamp-2">{req.title}</p>
                    <p className="text-[13px] text-stone-500 mt-0.5 truncate">
                      {req.requesterName} ·{' '}
                      {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {req.isUrgent && <span className="text-[#d33a4f] font-semibold"> · Urgent</span>}
                      {req.isAnswered && <span className="text-[#1f8a5b] font-semibold"> · Praise</span>}
                      {req.visibility === 'private' && <span className="text-purple-700 font-semibold"> · Private</span>}
                      {req.isArchived && <span className="text-purple-700 font-semibold"> · Archived</span>}
                    </p>
                  </div>
                  {!selectMode && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePray(req);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border bg-stone-50 border-stone-200 hover:bg-stone-100 text-[13px] font-bold transition-all active:scale-95 cursor-pointer"
                      style={{ color: currentTheme.primary, ...(req.prayedByMe ? { borderColor: `${currentTheme.primary}80` } : {}) }}
                      title="I prayed for this"
                      aria-label={`I prayed for this (${req.prayerCount} prayers)`}
                    >
                      <PrayingHands className="w-4 h-4" />
                      <span>{req.prayerCount}</span>
                    </button>
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
                      {encouragementCount > 0 && <span>{encouragementCount}</span>}
                    </button>
                  </div>
                  )}
                </div>
              );
            })}
        </div>
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
