import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  Phone
} from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
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
    switchAccount,
    currentUser,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedChurchId, setSelectedChurchId] = useState(currentChurchId);
  const [selectedRole, setSelectedRole] = useState<UserRole>('congregation_member');
  const [title, setTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
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

  const handleQuickLogin = (demoUser: typeof users[0]) => {
    switchAccount(demoUser.id);
    setSuccessMsg(`Signed in as ${demoUser.name}`);
    setTimeout(() => {
      onClose();
      setSuccessMsg(null);
    }, 400);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              1-Click Demo Accounts:
            </span>
            <span className="text-[10px] text-stone-400">Preloaded test logins</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {users.slice(0, 5).map((u) => {
              const isSelected = currentUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className={`text-left p-2 rounded-lg border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-100/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'}
                      alt={u.name}
                      className="w-5 h-5 rounded-full object-cover border border-stone-300"
                    />
                    <span className="font-semibold text-stone-800 truncate text-[11px]">
                      {u.name.split(' ')[0]} {u.name.split(' ')[1]?.[0]}.
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                        u.role === 'church_staff'
                          ? 'bg-blue-100 text-blue-700'
                          : u.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {u.role === 'church_staff' ? 'Pastor/Staff' : u.role === 'super_admin' ? 'Super Admin' : 'Member'}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {isSelected ? '✓ active' : 'select'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-stone-200">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'border-amber-600 text-amber-700 bg-amber-50/30'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign In with Password
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'border-amber-600 text-amber-700 bg-amber-50/30'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Register New Account
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
                    placeholder="e.g. pastor@gracefellowshipdallas.org"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Password
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Demo pw: <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">grace2026</code> or <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">member123</code>
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
                  <span>Sign In</span>
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
        </div>
      </div>
    </div>
  );
};
