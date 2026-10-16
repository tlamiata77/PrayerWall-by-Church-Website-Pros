import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getChurchTheme } from '../utils/theme';
import { PrayerWall } from './PrayerWall';
import { SubmitPrayerModal } from './SubmitPrayerModal';
import { WeeklyPrayerList } from './WeeklyPrayerList';
import { PlusCircle, ListChecks } from 'lucide-react';

/**
 * What a church's website shows in its iframe (/embed/<slug>?mode=full|wall_only):
 * just that church's prayers (plus a share button in "full" mode). The church's own
 * website already shows its name, so the app header and church card are left out.
 */
export const EmbedView: React.FC = () => {
  const { setActiveRole, isLoading, currentChurch, setSubmitModalOpen } = useApp();
  const mode = new URLSearchParams(window.location.search).get('mode') === 'wall_only' ? 'wall_only' : 'full';
  const theme = getChurchTheme(currentChurch);
  const [view, setView] = useState<'wall' | 'list'>('wall');

  // Visitors' view: no staff tools inside a church's website
  useEffect(() => {
    setActiveRole('embed_view');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-stone-500">Loading prayer wall...</div>;
  }

  if (!currentChurch.id) {
    return <div className="p-8 text-center text-sm text-stone-500">This prayer wall could not be found.</div>;
  }

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-stone-50">
        <WeeklyPrayerList onBack={() => setView('wall')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="px-2 sm:px-4 pt-4 max-w-7xl mx-auto flex flex-col sm:flex-row gap-2">
        {mode === 'full' && (
          <button
            onClick={() => setSubmitModalOpen(true)}
            style={theme.btnPrimaryStyle}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm shadow-xs cursor-pointer hover:opacity-95"
          >
            <PlusCircle className="w-4 h-4" />
            Share a Prayer Request
          </button>
        )}
        <button
          onClick={() => {
            setView('list');
            window.scrollTo(0, 0);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border-2 bg-white text-stone-800 hover:bg-stone-100 cursor-pointer"
          style={{ borderColor: theme.primary }}
        >
          <ListChecks className="w-4 h-4" style={{ color: theme.primary }} />
          This Week's Prayer List
        </button>
      </div>

      <PrayerWall hideChurchBanner />

      <div className="pb-6 text-center text-[11px] text-stone-400 no-print">
        <a href={window.location.origin} target="_blank" rel="noopener noreferrer" className="hover:text-stone-600">
          Powered by PrayerKeeper · Church Website Pros
        </a>
      </div>

      <SubmitPrayerModal />
    </div>
  );
};
