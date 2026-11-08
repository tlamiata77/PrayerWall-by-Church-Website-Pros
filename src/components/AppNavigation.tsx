import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AppTab } from '../types';
import { getChurchTheme } from '../utils/theme';
import { ChurchBrandingModal } from './ChurchBrandingModal';
import { PrayingHands } from './icons/PrayingHands';
import {
  Printer,
  ShieldCheck,
  Globe,
  Code,
  Plus,
  Church as ChurchIcon,
  Crown,
  User,
  ChevronDown,
  Users,
  LogOut,
  LogIn,
  Palette,
  HeartHandshake,
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
    requests,
    isSuperAdmin,
    notifications,
  } = useApp();

  const unreadNotifications = notifications.filter((n) => !n.readAt).length;

  const [menuOpen, setMenuOpen] = useState(false);
  const [brandingModalOpen, setBrandingModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close the account menu on an outside tap
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  // Number of prayers submitted by current user
  const userSubmissionsCount = currentUser ? requests.filter((r) => r.userId === currentUser.id).length : 0;

  const tabs: Array<{ id: AppTab; label: string; icon: React.ReactNode; badge?: number; show: boolean }> = [
    { id: 'wall', label: 'Prayer Wall', icon: <HeartHandshake className="w-4 h-4" />, show: true },
    { id: 'directory', label: 'Directory', icon: <Users className="w-4 h-4" />, show: true },
    { id: 'my-prayers', label: 'My Prayers', icon: <PrayingHands className="w-4 h-4" />, badge: userSubmissionsCount, show: true },
    { id: 'bulletin', label: 'Print List', icon: <Printer className="w-4 h-4" />, show: isPastorOrStaff },
    {
      id: 'staff',
      label: activeRole === 'super_admin' && !isImpersonating ? 'Super Admin' : 'Staff',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: flaggedRequests.length,
      show: isPastorOrStaff,
    },
    { id: 'global', label: 'Global Wall', icon: <Globe className="w-4 h-4" />, show: isPastorOrStaff },
    { id: 'embed', label: 'Embed Code', icon: <Code className="w-4 h-4" />, show: isPastorOrStaff || isEmbedSimulator },
  ];

  const previewRoles = [
    { role: 'super_admin' as const, label: 'Super Admin', icon: <Crown className="w-3.5 h-3.5" />, tab: 'staff' as AppTab },
    { role: 'church_staff' as const, label: 'Pastor / Staff', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { role: 'congregation_member' as const, label: 'Member', icon: <User className="w-3.5 h-3.5" /> },
    { role: 'embed_view' as const, label: 'Embed', icon: <Code className="w-3.5 h-3.5" />, tab: 'embed' as AppTab },
  ];

  const menuItem =
    'w-full text-left px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-lg flex items-center gap-2.5 cursor-pointer';

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 no-print">
      {/* Super admin only: switch church and preview the app as another role */}
      {isSuperAdmin && (
        <div className="bg-stone-900 text-stone-300 text-xs">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-1.5 flex items-center gap-2 overflow-x-auto">
            <div className="relative shrink-0">
              <select
                value={currentChurchId}
                onChange={(e) => setCurrentChurchId(e.target.value)}
                className="max-w-[170px] sm:max-w-[240px] truncate appearance-none bg-stone-800 text-stone-100 text-xs font-semibold rounded-md pl-2 pr-6 py-1 border border-stone-700 cursor-pointer focus:outline-none"
                title="Switch church"
              >
                {churches.map((church) => (
                  <option key={church.id} value={church.id}>
                    {church.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-1.5 top-1.5 pointer-events-none" />
            </div>
            <span className="text-stone-500 shrink-0 hidden sm:inline">Preview as</span>
            <div className="flex items-center gap-0.5 shrink-0">
              {previewRoles.map((p) => (
                <button
                  key={p.role}
                  onClick={() => {
                    setActiveRole(p.role);
                    if (p.tab) setActiveTab(p.tab);
                    else if (activeTab === 'global' && p.role !== 'church_staff') setActiveTab('wall');
                  }}
                  className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer shrink-0 ${
                    activeRole === p.role && !(p.role === 'super_admin' && isImpersonating)
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  {p.icon}
                  <span>{p.label}</span>
                  {p.role === 'super_admin' && unreadNotifications > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 rounded-full">{unreadNotifications}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Church name and account */}
        <div className="flex items-center gap-3 h-14 sm:h-16">
          {currentChurch.logoUrl ? (
            <img
              src={currentChurch.logoUrl}
              alt=""
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-stone-200 bg-white shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <ChurchIcon className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-serif-church text-base sm:text-xl font-bold text-stone-900 leading-tight truncate">
              {currentChurch.name}
            </h1>
            <p className="text-xs text-stone-500 truncate hidden sm:block">
              {[currentChurch.city && `${currentChurch.city}, ${currentChurch.state}`, currentChurch.pastorName]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </div>

          {/* Share a prayer (on phones this is the floating button at the bottom) */}
          <button
            onClick={() => setSubmitModalOpen(true)}
            style={currentTheme.btnPrimaryStyle}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm shadow-xs cursor-pointer hover:opacity-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Share a Prayer Request</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 p-1 sm:pr-2.5 rounded-full hover:bg-stone-100 border border-stone-200 cursor-pointer"
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                >
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: currentTheme.primary }}
                    >
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="hidden sm:inline text-sm font-semibold text-stone-800 max-w-[110px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500 hidden sm:block" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50">
                    <div className="px-3 py-2 border-b border-stone-100 mb-1">
                      <div className="font-bold text-stone-900 text-sm truncate">{currentUser.name}</div>
                      <div className="text-xs text-stone-500 truncate">{currentUser.email}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {currentUser.role === 'super_admin'
                          ? 'Super Admin'
                          : currentUser.role === 'church_staff'
                          ? 'Pastor / Staff'
                          : currentUser.approved
                          ? 'Member'
                          : 'Member • awaiting approval'}
                      </div>
                    </div>
                    <button className={menuItem} onClick={() => { setActiveTab('my-prayers'); setMenuOpen(false); }}>
                      <PrayingHands className="w-4 h-4 text-stone-500" />
                      My Prayers
                    </button>
                    <button className={menuItem} onClick={() => { setActiveTab('directory'); setMenuOpen(false); }}>
                      <Users className="w-4 h-4 text-stone-500" />
                      Church Directory
                    </button>
                    {isPastorOrStaff && (
                      <button className={menuItem} onClick={() => { setBrandingModalOpen(true); setMenuOpen(false); }}>
                        <Palette className="w-4 h-4 text-stone-500" />
                        Church Logo & Colors
                      </button>
                    )}
                    <button className={menuItem} onClick={() => { openLoginModal(undefined, 'register_church'); setMenuOpen(false); }}>
                      <ChurchIcon className="w-4 h-4 text-stone-500" />
                      Register a New Church
                    </button>
                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        className={`${menuItem} text-rose-700 hover:bg-rose-50`}
                        onClick={() => { setMenuOpen(false); logout(); }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Always-visible sign out (also in the account menu) */}
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="flex items-center gap-1.5 p-2 sm:px-3 text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-full text-sm font-semibold cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => openLoginModal()}
              className="flex items-center gap-1.5 px-3 py-2 text-stone-700 hover:bg-stone-100 rounded-xl text-sm font-semibold border border-stone-200 cursor-pointer shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1 -mb-px overflow-x-auto text-sm" aria-label="Sections">
          {tabs
            .filter((t) => t.show)
            .map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active ? 'font-semibold text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                  style={active ? { borderColor: currentTheme.primary } : undefined}
                  aria-current={active ? 'page' : undefined}
                >
                  <span style={active ? { color: currentTheme.primary } : undefined}>{t.icon}</span>
                  {t.label}
                  {!!t.badge && (
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 rounded-full">{t.badge}</span>
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      <ChurchBrandingModal isOpen={brandingModalOpen} onClose={() => setBrandingModalOpen(false)} />
    </header>
  );
};
