import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { resizeImageFile } from '../utils/imageResize';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Church as ChurchIcon,
  Crown,
  KeyRound,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Upload,
  Sparkles,
  Phone,
  MapPin,
  Heart,
  Globe
} from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'register_church';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const {
    login,
    register,
    users,
    churches,
    currentChurchId,
    setCurrentChurchId,
    setActiveRole,
    setActiveTab,
    addNewChurch,
    switchAccount,
    currentUser,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'register_church'>(defaultMode);

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, defaultMode]);

  // Login & Member Register State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedChurchId, setSelectedChurchId] = useState(currentChurchId);
  const [selectedRole, setSelectedRole] = useState<UserRole>('congregation_member');
  const [title, setTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Register New Church State
  const [churchName, setChurchName] = useState('');
  const [churchDenomination, setChurchDenomination] = useState('');
  const [churchPastor, setChurchPastor] = useState('');
  const [churchWebsite, setChurchWebsite] = useState('');
  const [churchAddress, setChurchAddress] = useState('');
  const [churchCity, setChurchCity] = useState('');
  const [churchState, setChurchState] = useState('');
  const [churchZipCode, setChurchZipCode] = useState('');
  const [churchEmail, setChurchEmail] = useState('');
  const [churchPassword, setChurchPassword] = useState('');
  const [churchPhone, setChurchPhone] = useState('');
  const [churchTagline, setChurchTagline] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(email, password);
    if (res.success) {
      setSuccessMsg('Successfully signed in!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 500);
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    const res = register({
      email: email.trim(),
      password,
      name: name.trim(),
      phone: phone.trim(),
      churchId: selectedChurchId,
      role: selectedRole,
      title: title.trim() || (selectedRole === 'church_staff' ? 'Pastoral Staff' : 'Church Member'),
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&h=240&q=80',
    });

    if (res.success) {
      setSuccessMsg('Account created and signed in!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 600);
    } else {
      setError(res.error || 'Failed to create account');
    }
  };

  const handleRegisterChurch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!churchName.trim()) {
      setError('Church name is required');
      return;
    }
    if (!churchPastor.trim()) {
      setError('Senior Pastor / Ministry Leader name is required');
      return;
    }
    if (!churchEmail.trim() || !churchEmail.includes('@')) {
      setError('A valid pastoral contact email is required');
      return;
    }
    if (!churchPassword || churchPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    const slug = churchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let finalWebsite = churchWebsite.trim();
    if (finalWebsite && !finalWebsite.startsWith('http://') && !finalWebsite.startsWith('https://')) {
      finalWebsite = `https://${finalWebsite}`;
    }
    if (!finalWebsite) {
      finalWebsite = `https://${slug || 'church'}.org`;
    }

    const newChurchId = addNewChurch({
      slug: slug || `church-${Date.now()}`,
      name: churchName.trim(),
      tagline: churchTagline.trim() || 'Growing in faith, grounded in grace',
      denomination: churchDenomination.trim() || 'Non-Denominational',
      pastorName: churchPastor.trim(),
      contactEmail: churchEmail.trim(),
      phone: churchPhone.trim() || '(555) 012-3456',
      address: churchAddress.trim() || '100 Main Street',
      city: churchCity.trim() || 'Dallas',
      state: churchState.trim() || 'TX',
      zipCode: churchZipCode.trim() || undefined,
      websiteUrl: finalWebsite,
      themeColor: 'teal_pink',
      primaryColor: '#4eb8b9',
      accentColor: '#c219b0',
      welcomeMessage: `Welcome to the ${churchName.trim()} prayer wall. How may our congregation stand with you in faith today?`,
      scriptureVerse: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. — Philippians 4:6',
      bulletinTitle: `${churchName.trim()} Weekly Intercessory Prayer List`,
      settings: {
        allowAnonymous: true,
        requireStaffReviewBeforePublish: false,
        autoApproveHighScores: true,
        enablePraiseUpdates: true,
        defaultPrintColumns: 2,
        defaultWallLayout: 'grid',
      },
    });

    // Create the Senior Pastor account with staff privileges
    const res = register({
      email: churchEmail.trim(),
      password: churchPassword,
      name: churchPastor.trim(),
      phone: churchPhone.trim(),
      churchId: newChurchId,
      role: 'church_staff',
      title: 'Senior Pastor',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&h=240&q=80',
    });

    if (res.success) {
      setCurrentChurchId(newChurchId);
      setActiveRole('church_staff');
      setActiveTab('wall');
      setSuccessMsg(`Welcome! "${churchName.trim()}" is now registered. You are logged in with pastoral administration rights.`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } else {
      setError(res.error || 'Failed to create pastor admin account');
    }
  };

  const handleQuickLogin = (demoUser: typeof users[0]) => {
    switchAccount(demoUser.id);
    if (demoUser.churchId) {
      setCurrentChurchId(demoUser.churchId);
    }
    setActiveRole(demoUser.role);
    setSuccessMsg(`Signed in as ${demoUser.name}`);
    setTimeout(() => {
      onClose();
      setSuccessMsg(null);
    }, 400);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resizeImageFile(file)
        .then((url) => setAvatarUrl(url))
        .catch((err) => console.warn('Image upload failed:', err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-6 flex items-start justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-4 -translate-y-4">
            <ChurchIcon className="w-36 h-36" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-500/20 text-amber-400 text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border border-amber-500/30">
                GraceWall Identity
              </span>
              <span className="text-stone-400 text-xs">•</span>
              <span className="text-stone-300 text-xs">Pastoral & Member Accounts</span>
            </div>
            <h2 className="text-xl font-bold font-serif-church text-white">
              {mode === 'login' ? 'Sign In to Your Church Account' : 'Create Church Account'}
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-sm">
              {mode === 'login'
                ? 'Access your submitted prayers, renew requests, or enter staff administration.'
                : 'Join your church prayer community with member or pastoral privileges.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Logins Bar */}
        <div className="bg-stone-50 border-b border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              1-Click Church & Pastor Sign-In:
            </span>
            <span className="text-[10px] text-stone-400 font-medium">Instant sign-in</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Guarantee Calvary Baptist Church & Pastor Greg Williamson is shown first and prominently */}
            {(() => {
              const calvaryPastor = users.find(
                (u) =>
                  u.id === 'user-pastor-calvary' ||
                  u.churchId === 'church-calvary-baptist' ||
                  u.name.toLowerCase().includes('williamson')
              ) || {
                id: 'user-pastor-calvary',
                email: 'pastor@calvarybaptistalcoa.org',
                password: 'calvary2026',
                name: 'Pastor Greg Williamson',
                role: 'church_staff' as const,
                churchId: 'church-calvary-baptist',
                title: 'Senior Pastor',
                avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&h=240&q=80',
                createdAt: '2025-05-01T08:00:00Z',
              };

              const otherUsers = users.filter(
                (u) =>
                  u.id !== calvaryPastor.id &&
                  u.id !== 'user-pastor-calvary' &&
                  !u.name.toLowerCase().includes('williamson') &&
                  (u.role === 'church_staff' || u.role === 'super_admin' || u.id === 'user-member-rebecca')
              );

              const displayUsers = [calvaryPastor, ...otherUsers].slice(0, 6);

              return displayUsers.map((u) => {
                const church =
                  churches.find((c) => c.id === u.churchId) ||
                  (u.churchId === 'church-calvary-baptist'
                    ? churches.find((c) => c.name.toLowerCase().includes('calvary'))
                    : undefined);
                const isSelected = currentUser?.id === u.id;
                const churchNameDisplay =
                  church?.name ||
                  (u.id === 'user-pastor-calvary' || u.name.includes('Williamson')
                    ? 'Calvary Baptist Church'
                    : 'Global Network Oversight');

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400/40 shadow-xs'
                        : 'bg-white border-stone-200 hover:border-amber-400 hover:bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover border border-stone-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-stone-900 text-xs truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate font-medium">
                          {churchNameDisplay}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          u.role === 'church_staff'
                            ? 'bg-blue-100 text-blue-800'
                            : u.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role === 'church_staff' ? 'Pastor' : u.role === 'super_admin' ? 'Admin' : 'Member'}
                      </span>
                      <span className="text-[9px] text-stone-400 font-semibold block mt-0.5">
                        {isSelected ? '✓ active' : 'sign in'}
                      </span>
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </div>

        {/* Mode Switch Tabs: 3 clear options */}
        <div className="flex border-b border-stone-200 bg-stone-50/50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold text-center border-b-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'border-amber-600 text-amber-700 bg-white font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold text-center border-b-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'border-amber-600 text-amber-700 bg-white font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Join as Member
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register_church');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register_church'
                ? 'border-[#4eb8b9] text-[#1e6a6b] bg-white font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <ChurchIcon className="w-3.5 h-3.5 text-[#4eb8b9]" />
            <span>Register Church</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Church Quick Selector */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ChurchIcon className="w-3.5 h-3.5 text-amber-700" />
                    <span>Select Church Account to Sign In:</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">Click to select & prefill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('pastor@calvarybaptistalcoa.org');
                      setPassword('calvary2026');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      email === 'pastor@calvarybaptistalcoa.org'
                        ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-400/50 shadow-xs'
                        : 'bg-white border-amber-200/70 hover:bg-amber-50/60'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      CBC
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate flex items-center gap-1">
                        <span>Calvary Baptist Church</span>
                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-semibold">Active</span>
                      </div>
                      <div className="text-[10px] text-stone-600 truncate">
                        Pastor Greg Williamson • Alcoa, TN
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('pastor@gracefellowshipdallas.org');
                      setPassword('grace2026');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      email === 'pastor@gracefellowshipdallas.org'
                        ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-400/50 shadow-xs'
                        : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#4eb8b9] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      GF
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">
                        Grace Fellowship Church
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">
                        Pastor David Matthews • Dallas, TX
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('care@redeemeratl.org');
                      setPassword('redeemer2026');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      email === 'care@redeemeratl.org'
                        ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-400/50 shadow-xs'
                        : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      RCC
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">
                        Redeemer Community Church
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">
                        Pastor Sarah Jenkins • Atlanta, GA
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@churchwebsitepros.com');
                      setPassword('superadmin123');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      email === 'admin@churchwebsitepros.com'
                        ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-400/50 shadow-xs'
                        : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">
                        Super Admin Platform
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">
                        Multi-Church Network Oversight
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. pastor@calvarybaptistalcoa.org"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Password
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Demo pw: <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700 font-bold">calvary2026</code>, <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">grace2026</code>, or <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">member123</code>
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {email === 'pastor@calvarybaptistalcoa.org'
                      ? 'Sign In to Calvary Baptist Church'
                      : 'Sign In'}
                  </span>
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-stone-500">
                  Are you a member wanting to track your requests?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-amber-700 font-semibold hover:underline cursor-pointer"
                  >
                    Create an account here
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Johnathan Evans"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Church Affiliation
                  </label>
                  <select
                    value={selectedChurchId}
                    onChange={(e) => setSelectedChurchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {churches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Account Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                  >
                    <option value="congregation_member">Church Member (Submit & Track Prayers)</option>
                    <option value="church_staff">Pastor / Staff (Full Moderation & Bulletin)</option>
                    <option value="super_admin">Super Admin (Multi-Church Oversight)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Title or Church Role (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deacon, Choir Member, Sunday School Teacher"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Profile Photo (File Upload or URL)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100 border border-stone-300 shrink-0">
                    <img
                      src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg border border-stone-300 cursor-pointer w-fit font-medium">
                      <Upload className="w-3.5 h-3.5 text-stone-600" />
                      <span>Upload Photo from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Or paste photo image URL"
                      className="w-full px-2.5 py-1 text-xs rounded border border-stone-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Create Account & Log In</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REGISTER NEW CHURCH */}
          {mode === 'register_church' && (
            <form onSubmit={handleRegisterChurch} className="space-y-3.5">
              <div className="p-3 bg-[#4eb8b9]/10 border border-[#4eb8b9]/30 rounded-xl flex items-start gap-2.5 text-xs text-stone-800 mb-1">
                <ChurchIcon className="w-5 h-5 text-[#4eb8b9] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#1e6a6b] block">
                    Launch Your Church's Prayer Wall & Suite
                  </span>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    Instantly provisions your congregation's dedicated prayer wall, printable Sunday bulletin builder, photo directory, and pastoral moderation portal.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Church Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="e.g. Living Hope Church"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Denomination / Affiliation
                  </label>
                  <input
                    type="text"
                    value={churchDenomination}
                    onChange={(e) => setChurchDenomination(e.target.value)}
                    placeholder="e.g. Non-Denominational, Baptist, Reformed"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Senior Pastor / Leader Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={churchPastor}
                    onChange={(e) => setChurchPastor(e.target.value)}
                    placeholder="e.g. Pastor David Walker"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Pastoral Care Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={churchPhone}
                    onChange={(e) => setChurchPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#4eb8b9]" />
                    <span>Church Website Address (URL)</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">e.g. https://calvarybaptistalcoa.org</span>
                </label>
                <input
                  type="text"
                  value={churchWebsite}
                  onChange={(e) => setChurchWebsite(e.target.value)}
                  placeholder="e.g. https://calvarybaptistalcoa.org or calvaryalcoa.org"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9] font-medium"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  Shown in the church directory & connects your congregation to your main church website
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Pastoral Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={churchEmail}
                    onChange={(e) => setChurchEmail(e.target.value)}
                    placeholder="pastor@churchname.org"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Used to log in as Senior Pastor
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={churchPassword}
                    onChange={(e) => setChurchPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Secures private prayers & staff moderation
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Street Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={churchAddress}
                    onChange={(e) => setChurchAddress(e.target.value)}
                    placeholder="e.g. 100 Main Street"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={churchCity}
                    onChange={(e) => setChurchCity(e.target.value)}
                    placeholder="Alcoa"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={churchState}
                    onChange={(e) => setChurchState(e.target.value)}
                    placeholder="TN"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Zip
                  </label>
                  <input
                    type="text"
                    value={churchZipCode}
                    onChange={(e) => setChurchZipCode(e.target.value)}
                    placeholder="37701"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tagline / Welcome Vision (Optional)
                </label>
                <input
                  type="text"
                  value={churchTagline}
                  onChange={(e) => setChurchTagline(e.target.value)}
                  placeholder="e.g. Growing in faith, grounded in grace"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#4eb8b9] hover:bg-[#3ea0a1] text-white font-bold rounded-lg text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ChurchIcon className="w-4 h-4" />
                  <span>Register Church & Launch Prayer Wall</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
