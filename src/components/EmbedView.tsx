import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getChurchTheme } from '../utils/theme';
import { PrayerWall } from './PrayerWall';
import { SubmitPrayerModal } from './SubmitPrayerModal';
import { PlusCircle } from 'lucide-react';

/**
 * What a church's website shows in its iframe (/embed/<slug>?mode=full|wall_only):
 * just that church's prayer wall, without the app's navigation, church switcher or banners.
 */
export const EmbedView: React.FC = () => {
  const { setActiveRole, isLoading, currentChurch, setSubmitModalOpen } = useApp();
  const mode = new URLSearchParams(window.location.search).get('mode') === 'wall_only' ? 'wall_only' : 'full';
  const theme = getChurchTheme(currentChurch);

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

  return (
    <div className="min-h-screen bg-stone-50">
      {mode === 'full' && (
        <div className="px-2 sm:px-4 pt-4 max-w-7xl mx-auto">
          <button
            onClick={() => setSubmitModalOpen(true)}
            style={theme.btnPrimaryStyle}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm shadow-xs cursor-pointer hover:opacity-95"
          >
            <PlusCircle className="w-4 h-4" />
            Share a Prayer Request
          </button>
        </div>
      )}

      <PrayerWall hideChurchBanner={mode === 'wall_only'} />

      <div className="pb-6 text-center text-[11px] text-stone-400">
        <a href={window.location.origin} target="_blank" rel="noopener noreferrer" className="hover:text-stone-600">
          Powered by PrayerKeeper · Church Website Pros
        </a>
      </div>

      <SubmitPrayerModal />
    </div>
  );
};
