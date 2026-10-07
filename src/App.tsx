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
import { Heart, Sparkles, Shield, Printer, Globe, Code } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, activeRole, currentChurch, loginModalOpen, closeLoginModal, loginModalInitialMode } = useApp();

  const isPastorOrStaff = activeRole === 'church_staff' || activeRole === 'super_admin';
  const isEmbedSimulator = activeRole === 'embed_view';

  return (
    <main className="min-h-screen pb-16">
      {activeTab === 'wall' && <PrayerWall />}
      {activeTab === 'bulletin' && (isPastorOrStaff ? <PrintableBulletinBuilder /> : <PrayerWall />)}
      {activeTab === 'staff' && (isPastorOrStaff ? <StaffModerationPortal /> : <PrayerWall />)}
      {activeTab === 'directory' && <ChurchDirectory />}
      {activeTab === 'my-prayers' && <MemberPrayerHistory />}
      {activeTab === 'global' && (isPastorOrStaff ? <GlobalPrayerWall /> : <PrayerWall />)}
      {activeTab === 'embed' && (isPastorOrStaff || isEmbedSimulator ? <WebsiteEmbedCenter /> : <PrayerWall />)}

      {/* Global Submit Prayer Modal */}
      <SubmitPrayerModal />

      {/* User Login, Member Join & Church Registration Auth Modal */}
      <AuthModal
        isOpen={loginModalOpen}
        onClose={closeLoginModal}
        defaultMode={loginModalInitialMode}
      />

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
                GraceWall
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
