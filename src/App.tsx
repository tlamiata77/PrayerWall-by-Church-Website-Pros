/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp, DEMO_CHURCH_SLUG } from './context/AppContext';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import { AppNavigation } from './components/AppNavigation';
import { PrayerWall } from './components/PrayerWall';
import { PrintableBulletinBuilder } from './components/PrintableBulletinBuilder';
import { StaffModerationPortal } from './components/StaffModerationPortal';
import { GlobalPrayerWall } from './components/GlobalPrayerWall';
import { WebsiteEmbedCenter } from './components/WebsiteEmbedCenter';
import { SubmitPrayerModal } from './components/SubmitPrayerModal';
import { ChurchDirectory } from './components/ChurchDirectory';
import { MemberPrayerHistory } from './components/MemberPrayerHistory';
import { WeeklyPrayerList } from './components/WeeklyPrayerList';
import { AuthModal } from './components/AuthModal';
import { ImportPrayersModal } from './components/ImportPrayersModal';
import { SetNewPasswordModal } from './components/SetNewPasswordModal';
import { EmbedView } from './components/EmbedView';

const MainContent: React.FC = () => {
  const {
    activeTab,
    activeRole,
    loginModalOpen,
    closeLoginModal,
    loginModalInitialMode,
    isLoading,
    dataError,
    clearDataError,
    currentChurch,
    currentUser,
    setActiveTab,
  } = useApp();

  const isPastorOrStaff = activeRole === 'church_staff' || activeRole === 'super_admin';
  const isEmbedSimulator = activeRole === 'embed_view';

  const { openLoginModal } = useApp();
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('register') === 'church') {
      openLoginModal(undefined, 'register_church');
      params.delete('register');
      const rest = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen pb-16">
      {dataError && (
        <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4 no-print">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <span>{dataError}</span>
            <button onClick={clearDataError} className="font-bold cursor-pointer" aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      )}

      {!isLoading && !currentUser && currentChurch.slug === DEMO_CHURCH_SLUG && (
        <div className="bg-[#43b1a4]/10 border-b border-[#43b1a4]/30 no-print">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 text-xs sm:text-sm text-stone-700 flex items-center justify-between gap-3">
            <span>
              <strong>Demo prayer wall</strong>
              <span className="hidden sm:inline"> with made-up names, so you can see how PrayerKeeper works</span>
            </span>
            <button
              onClick={() => openLoginModal(undefined, 'register_church')}
              className="shrink-0 text-[#b80f9c] hover:text-[#d312b4] font-semibold underline underline-offset-2 cursor-pointer"
            >
              Register your church free
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-stone-500 no-print">
          Loading prayer wall...
        </div>
      )}

      {!isLoading && activeTab === 'wall' && <PrayerWall floatingShareButton />}
      {!isLoading && activeTab === 'bulletin' && (isPastorOrStaff ? <PrintableBulletinBuilder /> : <PrayerWall />)}
      {!isLoading && activeTab === 'staff' && (isPastorOrStaff ? <StaffModerationPortal /> : <PrayerWall />)}
      {!isLoading && activeTab === 'directory' && <ChurchDirectory />}
      {!isLoading && activeTab === 'my-prayers' && <MemberPrayerHistory />}
      {!isLoading && activeTab === 'prayer-list' && <WeeklyPrayerList onBack={() => setActiveTab('wall')} />}
      {!isLoading && activeTab === 'global' && (isPastorOrStaff ? <GlobalPrayerWall /> : <PrayerWall />)}
      {!isLoading && activeTab === 'embed' && (isPastorOrStaff || isEmbedSimulator ? <WebsiteEmbedCenter /> : <PrayerWall />)}

      {/* Global Submit Prayer Modal */}
      <SubmitPrayerModal />

      {/* User Login, Member Join & Church Registration Auth Modal */}
      <AuthModal
        isOpen={loginModalOpen}
        onClose={closeLoginModal}
        defaultMode={loginModalInitialMode}
      />

      {/* Shown after opening a password-reset email link */}
      <SetNewPasswordModal />

      {/* CSV Batch Import Prayers Modal */}
      <ImportPrayersModal />
    </main>
  );
};

export default function App({ embed = false }: { embed?: boolean }) {
  if (embed) {
    return (
      <AppProvider>
        <EmbedView />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-[#f8f9fb] text-stone-900 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
        <div>
          {/* Super Admin Impersonation Alert Banner */}
          <ImpersonationBanner />

          {/* Main Top Header & Navigation */}
          <AppNavigation />

          {/* Active View Container */}
          <MainContent />
        </div>

        {/* Clean Footer (Hidden in Print) */}
        <footer className="border-t border-stone-200 pt-6 pb-24 md:pb-6 px-4 text-xs text-stone-500 no-print">
          <div className="max-w-6xl mx-auto text-center">
            <a href="/" className="hover:text-stone-800">
              <span className="font-serif-church font-bold text-stone-700">PrayerKeeper</span> by Church Website Pros
            </a>
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}
