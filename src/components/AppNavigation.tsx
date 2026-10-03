import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  HeartHandshake,
  Printer,
  ShieldCheck,
  Globe,
  Code,
  PlusCircle,
  Church as ChurchIcon,
  Crown,
  User,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const AppNavigation: React.FC = () => {
  const {
    currentChurch,
    currentChurchId,
    setCurrentChurchId,
    churches,
    activeRole,
    setActiveRole,
    activeTab,
    setActiveTab,
    setSubmitModalOpen,
    flaggedRequests,
    isImpersonating,
  } = useApp();

  const themeColors = {
    amber: 'bg-amber-600 hover:bg-amber-700 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    rose: 'bg-rose-600 hover:bg-rose-700 text-white',
    sky: 'bg-sky-600 hover:bg-sky-700 text-white',
  };

  const currentThemeBtn = themeColors[currentChurch.themeColor] || themeColors.amber;

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs no-print">
      {/* Top Meta Bar: Church Website Pros Branding & Persona Switcher */}
      <div className="bg-stone-900 text-stone-300 text-xs px-4 py-2 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-stone-100 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Church Website Pros
            </span>
            <span className="text-stone-500">•</span>
            <span className="text-stone-400 hidden sm:inline">
              GraceWall Multi-Tenant Church Prayer Platform
            </span>
          </div>

          {/* Quick Persona Switcher for easy testing */}
          <div className="flex items-center gap-2">
            <span className="text-stone-400 text-[11px] hidden md:inline">Viewing As:</span>
            <div className="bg-stone-800 p-0.5 rounded-lg flex items-center gap-0.5 border border-stone-700">
              <button
                onClick={() => {
                  setActiveRole('super_admin');
                  setActiveTab('staff');
                }}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRole === 'super_admin' && !isImpersonating
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
                title="Church Website Pros Super Admin Dashboard with Multi-Church Oversight and Login-As"
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="font-medium">Super Admin</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('church_staff');
                  if (activeTab === 'global' && activeRole === 'super_admin') {
                    setActiveTab('wall');
                  }
                }}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRole === 'church_staff'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
                title="Church Pastor & Staff Portal: Review private requests, moderate, generate Sunday bulletin"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-medium">Pastor / Staff</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('congregation_member');
                  setActiveTab('wall');
                }}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRole === 'congregation_member'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
                title="Public Church Member & Visitor: View wall, pray for requests, submit prayer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="font-medium">Church Member</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('embed_view');
                  setActiveTab('embed');
                }}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRole === 'embed_view'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
                title="Simulate how GraceWall looks embedded on a client church website"
              >
                <Code className="w-3.5 h-3.5" />
                <span className="font-medium">Embed Simulator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Church Header & Nav Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Church Branding & Selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg shadow-xs border border-amber-200/80">
              <ChurchIcon className="w-6 h-6 text-amber-700" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-church text-xl font-bold text-stone-900 tracking-tight">
                  {currentChurch.name}
                </h1>

                {/* Church Switcher Dropdown */}
                <div className="relative inline-block">
                  <select
                    value={currentChurchId}
                    onChange={(e) => setCurrentChurchId(e.target.value)}
                    className="appearance-none bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold rounded-md pl-2 pr-6 py-1 border border-stone-300/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                    title="Switch Church"
                  >
                    {churches.map((church) => (
                      <option key={church.id} value={church.id}>
                        Switch Church: {church.name} ({church.city}, {church.state})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-1.5 top-2 pointer-events-none" />
                </div>
              </div>

              <p className="text-xs text-stone-500 hidden sm:block">
                {currentChurch.tagline} • {currentChurch.pastorName}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSubmitModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm shadow-xs transition-all cursor-pointer ${currentThemeBtn}`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Prayer Request</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto border-t border-stone-100 pt-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('wall')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'wall'
                ? 'bg-stone-100 text-stone-900 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-amber-600" />
            <span>Prayer Wall</span>
          </button>

          <button
            onClick={() => setActiveTab('bulletin')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'bulletin'
                ? 'bg-stone-100 text-stone-900 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Printable Bulletin Builder</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              Easy Print
            </span>
          </button>

          {(activeRole === 'church_staff' || activeRole === 'super_admin') && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer relative ${
                activeTab === 'staff'
                  ? 'bg-stone-100 text-stone-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>
                {activeRole === 'super_admin' && !isImpersonating
                  ? 'Super Admin Portal'
                  : 'Staff & Moderation'}
              </span>
              {flaggedRequests.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {flaggedRequests.length} to review
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('global')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'global'
                ? 'bg-stone-100 text-stone-900 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Global Network Wall</span>
            <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">
              ChurchWebsitePros
            </span>
          </button>

          <button
            onClick={() => setActiveTab('embed')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'embed'
                ? 'bg-stone-100 text-stone-900 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Code className="w-4 h-4 text-purple-600" />
            <span>Website Embed Code</span>
          </button>
        </div>
      </div>
    </header>
  );
};
