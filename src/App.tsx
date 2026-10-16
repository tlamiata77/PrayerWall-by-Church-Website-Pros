/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
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
import { AuthModal } from './components/AuthModal';
import { ImportPrayersModal } from './components/ImportPrayersModal';
import { SetNewPasswordModal } from './components/SetNewPasswordModal';
import { Heart, Sparkles, Shield, Printer, Globe, Code } from 'lucide-react';

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
        <div className="max-w-7xl mx-auto px-4 pt-4 no-print">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <span>{dataError}</span>
            <button onClick={clearDataError} className="font-bold cursor-pointer" aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-stone-500 no-print">
          Loading prayer wall...
        </div>
      )}

      {!isLoading && activeTab === 'wall' && <PrayerWall />}
      {!isLoading && activeTab === 'bulletin' && (isPastorOrStaff ? <PrintableBulletinBuilder /> : <PrayerWall />)}
      {!isLoading && activeTab === 'staff' && (isPastorOrStaff ? <StaffModerationPortal /> : <PrayerWall />)}
      {!isLoading && activeTab === 'directory' && <ChurchDirectory />}
      {!isLoading && activeTab === 'my-prayers' && <MemberPrayerHistory />}
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

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
        <div>
          {/* Super Admin Impersonation Alert Banner */}
          <ImpersonationBanner />

          {/* Main Top Header & Navigation */}
          <AppNavigation />

          {/* Active View Container */}
          <MainContent />
        </div>

        {/* Clean Footer (Hidden in Print) */}
        <footer className="bg-white border-t border-stone-200 py-8 px-4 text-xs text-stone-500 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif-church font-bold text-stone-800 text-sm">
                PrayerKeeper
              </span>
              <span>by Church Website Pros</span>
              <span className="text-stone-300">•</span>
              <span>Multi-Tenant Church Prayer Management & Bulletin Suite</span>
            </div>

            <div className="flex items-center gap-4 text-stone-600">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                AI Safety Moderation
              </span>
              <span className="flex items-center gap-1">
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                1-Click Sunday Bulletin
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                Global Network Wall
              </span>
            </div>
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}
