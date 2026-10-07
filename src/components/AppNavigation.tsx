import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { getChurchTheme } from '../utils/theme';
import { ChurchBrandingModal } from './ChurchBrandingModal';
import { PrayingHands } from './icons/PrayingHands';
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
  ChevronDown,
  Users,
  LogOut,
  KeyRound,
  Lock,
  UserCheck,
  ChevronUp,
  Palette
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
    currentUser,
    logout,
    openLoginModal,
    users,
    switchAccount,
    requests,
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [brandingModalOpen, setBrandingModalOpen] = useState(false);

  const currentTheme = getChurchTheme(currentChurch);

  // Check if current active account/persona is Pastor or Staff (or Super Admin)
  const isPastorOrStaff = activeRole === 'church_staff' || activeRole === 'super_admin';
  const isEmbedSimulator = activeRole === 'embed_view';

  // Automatically ensure church members do not stay on staff/pastor-only tabs
  useEffect(() => {
    if (!isPastorOrStaff && !isEmbedSimulator && (activeTab === 'bulletin' || activeTab === 'staff' || activeTab === 'global' || activeTab === 'embed')) {
      setActiveTab('wall');
    }
  }, [isPastorOrStaff, isEmbedSimulator, activeTab, setActiveTab]);

  // Number of prayers submitted by current user
  const userSubmissionsCount = currentUser
    ? requests.filter(
        (r) =>
          r.userId === currentUser.id ||
          (r.requesterEmail && r.requesterEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
          (r.requesterName && r.requesterName.toLowerCase() === currentUser.name.toLowerCase())
      ).length
    : 0;

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
              GraceWall Multi-Tenant Church Prayer & Directory Suite
            </span>
          </div>

          {/* Quick Persona Switcher for easy testing */}
          <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-0.5 sm:pb-0">
            <span className="text-stone-400 text-[11px] hidden md:inline shrink-0">Quick Role Mode:</span>
            <div className="bg-stone-800 p-0.5 rounded-lg flex items-center gap-0.5 border border-stone-700 shrink-0">
              <button
                onClick={() => {
                  const admin = users.find((u) => u.role === 'super_admin');
                  if (admin) switchAccount(admin.id);
                  setActiveRole('super_admin');
                  setActiveTab('staff');
                }}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeRole === 'super_admin' && !isImpersonating
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
                title="Super Admin Dashboard with Multi-Church Oversight and Login-As"
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="font-medium">Super Admin</span>
              </button>

              <button
                onClick={() => {
                  const pastor = users.find((u) => u.role === 'church_staff' && u.churchId === currentChurchId) || users[0];
                  if (pastor) switchAccount(pastor.id);
                  setActiveRole('church_staff');
                  if (activeTab === 'global' && activeRole === 'super_admin') {
                    setActiveTab('wall');
                  }
                }}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
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
                  const member = users.find((u) => u.role === 'congregation_member' && u.churchId === currentChurchId) || users[2];
                  if (member) switchAccount(member.id);
                  setActiveRole('congregation_member');
                }}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeRole === 'congregation_member'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
                title="Public Church Member & Visitor: View wall, pray for requests, track and resubmit submitted prayers"
              >
                <User className="w-3.5 h-3.5" />
                <span className="font-medium">Church Member</span>
              </button>

              <button
                onClick={() => {
                  setActiveRole('embed_view');
                  setActiveTab('embed');
                }}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
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
            {currentChurch.logoUrl ? (
              <img
                src={currentChurch.logoUrl}
                alt={`${currentChurch.name} logo`}
                className="w-10 h-10 rounded-xl object-cover border border-stone-200 shadow-xs bg-white shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs border shrink-0 text-white"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <ChurchIcon className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif-church text-xl font-bold text-stone-900 tracking-tight">
                  {currentChurch.name}
                </h1>

                {/* Church Switcher Dropdown */}
                <div className="relative inline-block">
                  <select
                    value={currentChurchId}
                    onChange={(e) => {
                      if (e.target.value === 'REGISTER_NEW_CHURCH') {
                        openLoginModal(undefined, 'register_church');
                      } else {
                        const targetId = e.target.value;
                        setCurrentChurchId(targetId);
                        // Automatically switch to that church's pastor account for instant access
                        const matchingPastor = users.find(
                          (u) =>
                            (u.churchId === targetId ||
                              (targetId === 'church-calvary-baptist' &&
                                (u.id === 'user-pastor-calvary' || u.name.includes('Williamson')))) &&
                            u.role === 'church_staff'
                        );
                        if (matchingPastor) {
                          switchAccount(matchingPastor.id);
                        }
                      }
                    }}
                    className="appearance-none bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold rounded-md pl-2 pr-6 py-1 border border-stone-300/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                    title="Switch Church or Register a New Church"
                  >
                    <optgroup label="Churches on Network">
                      {churches.map((church) => (
                        <option key={church.id} value={church.id}>
                          Switch: {church.name} ({church.city}, {church.state}){church.pastorName ? ` • ${church.pastorName}` : ''}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Church Onboarding">
                      <option value="REGISTER_NEW_CHURCH">
                        ➕ + Register a New Church...
                      </option>
                    </optgroup>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-1.5 top-2 pointer-events-none" />
                </div>

                {/* Quick Register New Church Button */}
                <button
                  onClick={() => openLoginModal(undefined, 'register_church')}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border border-amber-300/90 bg-amber-50 hover:bg-amber-100/80 text-amber-900 transition-colors cursor-pointer"
                  title="Sign up and register a new church"
                >
                  <ChurchIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">+ Register Church</span>
                </button>

                {/* Quick Branding & Theme Edit Shortcut for Staff */}
                {(activeRole === 'church_staff' || activeRole === 'super_admin' || currentUser?.role === 'church_staff') && (
                  <button
                    onClick={() => setBrandingModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                    title="Edit Church Logo, Address, Contact Info and Color Theme"
                  >
                    <Palette className="w-3.5 h-3.5" style={{ color: currentTheme.primary }} />
                    <span className="hidden sm:inline">Branding & Colors</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-stone-500 hidden sm:block">
                {currentChurch.tagline} • {currentChurch.pastorName} • {currentChurch.city}, {currentChurch.state}
              </p>
            </div>
          </div>

          {/* Action CTAs & Auth Profile Menu */}
          <div className="flex items-center gap-3">
            {/* Submit Prayer CTA with church primary color */}
            <button
              onClick={() => setSubmitModalOpen(true)}
              style={currentTheme.btnPrimaryStyle}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm shadow-xs transition-all cursor-pointer hover:opacity-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Submit Prayer<span className="hidden sm:inline"> Request</span></span>
            </button>

            {/* User Account / Login Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 text-xs transition-all cursor-pointer"
                >
                  <img
                    src={
                      currentUser.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'
                    }
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-amber-400"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="font-bold text-stone-800 leading-tight flex items-center gap-1">
                      <span>{currentUser.name.split(' ')[0]}</span>
                      {currentUser.role === 'church_staff' ? (
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                      ) : currentUser.role === 'super_admin' ? (
                        <Crown className="w-3 h-3 text-amber-500" />
                      ) : (
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 font-medium">
                      {currentUser.role === 'church_staff'
                        ? 'Pastor/Staff'
                        : currentUser.role === 'super_admin'
                        ? 'Super Admin'
                        : 'Member'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 animate-in fade-in duration-100">
                    <div className="p-3 border-b border-stone-100 bg-stone-50/50 rounded-xl mb-1">
                      <div className="font-bold text-stone-900 text-xs">{currentUser.name}</div>
                      <div className="text-[11px] text-stone-500 truncate">{currentUser.email}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            currentUser.role === 'church_staff'
                              ? 'bg-blue-100 text-blue-800'
                              : currentUser.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {currentUser.title || currentUser.role}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {userSubmissionsCount} submitted prayers
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('my-prayers');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:text-amber-900 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <PrayingHands className="w-3.5 h-3.5 text-amber-600" />
                        <span>My Prayers & Praises</span>
                      </span>
                      {userSubmissionsCount > 0 && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {userSubmissionsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('directory');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-stone-500" />
                      <span>Church Directory</span>
                    </button>

                    {(activeRole === 'church_staff' || activeRole === 'super_admin' || currentUser?.role === 'church_staff') && (
                      <button
                        onClick={() => {
                          setBrandingModalOpen(true);
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Palette className="w-3.5 h-3.5 text-[#4eb8b9]" />
                        <span>Church Logo & Color Theme</span>
                      </button>
                    )}

                    {/* 1-Click Church Accounts Switching */}
                    <div className="border-t border-stone-100 my-1 pt-1.5 px-1">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                        <span>Church Portals</span>
                        <span className="text-[9px] text-amber-600 font-semibold">1-Click</span>
                      </div>

                      <button
                        onClick={() => {
                          const pastor = users.find(
                            (u) =>
                              u.id === 'user-pastor-calvary' ||
                              u.churchId === 'church-calvary-baptist' ||
                              u.name.toLowerCase().includes('williamson')
                          );
                          if (pastor) {
                            switchAccount(pastor.id);
                          }
                          setCurrentChurchId('church-calvary-baptist');
                          setActiveRole('church_staff');
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          currentChurchId === 'church-calvary-baptist'
                            ? 'bg-amber-50 text-amber-900 font-bold border border-amber-300'
                            : 'hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ChurchIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <div className="truncate">
                            <span className="block font-semibold">Calvary Baptist</span>
                            <span className="text-[10px] text-stone-500 block">Pastor Greg Williamson</span>
                          </div>
                        </div>
                        {currentChurchId === 'church-calvary-baptist' ? (
                          <span className="text-[9px] bg-amber-200 text-amber-800 px-1 py-0.2 rounded font-bold">Active</span>
                        ) : (
                          <span className="text-[9px] text-stone-400">Login</span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          const pastor = users.find((u) => u.id === 'user-pastor-grace');
                          if (pastor) {
                            switchAccount(pastor.id);
                          }
                          setCurrentChurchId('church-grace');
                          setActiveRole('church_staff');
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          currentChurchId === 'church-grace'
                            ? 'bg-amber-50 text-amber-900 font-bold border border-amber-300'
                            : 'hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ChurchIcon className="w-3.5 h-3.5 text-[#4eb8b9] shrink-0" />
                          <div className="truncate">
                            <span className="block font-semibold">Grace Fellowship</span>
                            <span className="text-[10px] text-stone-500 block">Pastor David Matthews</span>
                          </div>
                        </div>
                        {currentChurchId === 'church-grace' ? (
                          <span className="text-[9px] bg-amber-200 text-amber-800 px-1 py-0.2 rounded font-bold">Active</span>
                        ) : (
                          <span className="text-[9px] text-stone-400">Login</span>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        openLoginModal();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                      <span>Switch / Demo Logins</span>
                    </button>

                    <button
                      onClick={() => {
                        openLoginModal(undefined, 'register_church');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-[#1e6a6b] hover:bg-[#4eb8b9]/10 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <ChurchIcon className="w-3.5 h-3.5 text-[#4eb8b9]" />
                      <span>+ Register a New Church</span>
                    </button>

                    <div className="border-t border-stone-100 my-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openLoginModal()}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold border border-stone-300 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-stone-600" />
                <span>Member / Staff Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto border-t border-stone-100 pt-2 text-sm font-medium">
          {/* Prayer Wall - Visible to Church Members, Pastors & Staff */}
          <button
            onClick={() => setActiveTab('wall')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer shrink-0 ${
              activeTab === 'wall'
                ? 'bg-stone-100 text-stone-900 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-amber-600" />
            <span>Prayer Wall</span>
          </button>

          {/* Sunday Bulletin Builder - Pastor & Staff Accounts Only */}
          {isPastorOrStaff && (
            <button
              onClick={() => setActiveTab('bulletin')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer shrink-0 ${
                activeTab === 'bulletin'
                  ? 'bg-stone-100 text-stone-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>Sunday Bulletin Builder</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                Print
              </span>
            </button>
          )}

          {/* Church Directory Tab - Visible to Church Members, Pastors & Staff */}
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer shrink-0 ${
              activeTab === 'directory'
                ? 'bg-stone-100 text-stone-900 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Church Directory</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              Photos & Roster
            </span>
          </button>

          {/* My Prayers & Praises - Visible to Church Members, Pastors & Staff */}
          <button
            onClick={() => setActiveTab('my-prayers')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer shrink-0 relative ${
              activeTab === 'my-prayers'
                ? 'bg-stone-100 text-stone-900 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <PrayingHands className="w-4 h-4 text-amber-600" />
            <span>My Prayers & Praises</span>
            {userSubmissionsCount > 0 && (
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {userSubmissionsCount}
              </span>
            )}
          </button>

          {/* Pastoral & Staff Special Access Portal - Pastor & Staff Accounts Only */}
          {isPastorOrStaff && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer relative shrink-0 ${
                activeTab === 'staff'
                  ? 'bg-stone-100 text-stone-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>
                {activeRole === 'super_admin' && !isImpersonating
                  ? 'Super Admin Portal'
                  : 'Pastoral / Staff Care'}
              </span>
              {flaggedRequests.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {flaggedRequests.length} to review
                </span>
              )}
            </button>
          )}

          {/* Global Network Wall - Pastor & Staff Accounts Only */}
          {isPastorOrStaff && (
            <button
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer shrink-0 ${
                activeTab === 'global'
                  ? 'bg-stone-100 text-stone-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Global Network Wall</span>
            </button>
          )}

          {/* Website Embed Code - Pastor & Staff Accounts Only (or simulator) */}
          {(isPastorOrStaff || isEmbedSimulator) && (
            <button
              onClick={() => setActiveTab('embed')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer shrink-0 ${
                activeTab === 'embed'
                  ? 'bg-stone-100 text-stone-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Code className="w-4 h-4 text-purple-600" />
              <span>Website Embed Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Church Branding & Theme Customizer Modal */}
      <ChurchBrandingModal
        isOpen={brandingModalOpen}
        onClose={() => setBrandingModalOpen(false)}
      />
    </header>
  );
};

