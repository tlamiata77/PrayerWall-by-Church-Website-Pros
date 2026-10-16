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
    registerChurch,
    sendPasswordReset,
    churches,
    currentChurchId,
    setActiveTab,
    currentUser,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'register_church' | 'forgot'>(defaultMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError(null);
      setSuccessMsg(null);
      setResetSentTo(null);
      setSelectedChurchId(currentChurchId);
    }
    // Reset only when the window opens; signing up can switch churches while it shows a message
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultMode]);

  // Login & Member Register State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedChurchId, setSelectedChurchId] = useState(currentChurchId);
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

  // Finishing the reset in another tab of this browser signs this tab in too
  useEffect(() => {
    if (isOpen && resetSentTo && currentUser) onClose();
  }, [isOpen, resetSentTo, currentUser, onClose]);

  if (!isOpen) return null;

  const finish = (message: string, delay = 700) => {
    setSuccessMsg(message);
    setTimeout(() => {
      onClose();
      setSuccessMsg(null);
    }, delay);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (res.success) {
      setPassword('');
      finish('Signed in!', 500);
    } else {
      setError(res.error || 'Could not sign in');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Enter the email address you signed up with');
      return;
    }
    setIsSubmitting(true);
    const res = await sendPasswordReset(email);
    setIsSubmitting(false);
    if (res.success) {
      setResetSentTo(email.trim());
    } else {
      setError(res.error || 'Could not send the reset email');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
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
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!selectedChurchId && churches.length > 0) {
      setError('Please choose your church');
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      email: email.trim(),
      password,
      name: name.trim(),
      phone: phone.trim(),
      churchId: selectedChurchId,
      title: title.trim() || 'Church Member',
      avatarUrl: avatarUrl || undefined,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to create account');
    } else if (res.needsEmailConfirmation) {
      setPassword('');
      setSuccessMsg(
        `Almost done! We emailed a confirmation link to ${email.trim()}. Open it, then sign in. A pastor or staff member will approve your access to the church directory.`
      );
    } else {
      setPassword('');
      finish('Account created! A pastor or staff member will approve your access to the church directory.', 2200);
    }
  };

  const handleRegisterChurch = async (e: React.FormEvent) => {
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
    if (!currentUser) {
      if (!churchEmail.trim() || !churchEmail.includes('@')) {
        setError('A valid pastoral login email is required');
        return;
      }
      if (!churchPassword || churchPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    let finalWebsite = churchWebsite.trim();
    if (finalWebsite && !finalWebsite.startsWith('http://') && !finalWebsite.startsWith('https://')) {
      finalWebsite = `https://${finalWebsite}`;
    }

    setIsSubmitting(true);
    const res = await registerChurch({
      church: {
        name: churchName.trim(),
        pastorName: churchPastor.trim(),
        denomination: churchDenomination.trim(),
        tagline: churchTagline.trim(),
        phone: churchPhone.trim(),
        address: churchAddress.trim(),
        city: churchCity.trim(),
        state: churchState.trim(),
        zipCode: churchZipCode.trim(),
        websiteUrl: finalWebsite,
        contactEmail: currentUser ? currentUser.email : churchEmail.trim(),
      },
      email: churchEmail.trim(),
      password: churchPassword,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to register church');
    } else if (res.needsEmailConfirmation) {
      setChurchPassword('');
      setSuccessMsg(
        `"${churchName.trim()}" is registered! We emailed a confirmation link to ${churchEmail.trim()}. Open it, then sign in to manage your church's prayer wall.`
      );
    } else {
      setChurchPassword('');
      setActiveTab('wall');
      finish(`Welcome! "${churchName.trim()}" is now registered and you are its pastoral admin.`, 1400);
    }
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
                PrayerKeeper Identity
              </span>
              <span className="text-stone-400 text-xs">•</span>
              <span className="text-stone-300 text-xs">Pastoral & Member Accounts</span>
            </div>
            <h2 className="text-xl font-bold font-serif-church text-white">
              {mode === 'login' ? 'Sign In to Your Church Account' : mode === 'forgot' ? 'Reset Your Password' : mode === 'register_church' ? 'Register Your Church' : 'Create Church Account'}
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-sm">
              {mode === 'login'
                ? 'Access your submitted prayers, renew requests, or enter staff administration.'
                : mode === 'forgot'
                ? "We'll email you a link to choose a new password."
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
                    placeholder="you@email.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-amber-700 font-semibold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
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
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
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
          ) : mode === 'forgot' && resetSentTo ? (
            <div className="space-y-4 text-sm text-stone-700">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  We sent a reset link to <strong>{resetSentTo}</strong>.
                </span>
              </div>
              <ol className="list-decimal pl-5 space-y-1 text-xs text-stone-600">
                <li>Open the email from PrayerKeeper (check spam if it's not there in a minute).</li>
                <li>Click the link. PrayerKeeper opens in a new tab.</li>
                <li>Choose your new password there. You'll be signed in.</li>
              </ol>
              <p className="text-xs text-stone-500">You can close this window.</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setResetSentTo(null)}
                  className="px-3 py-2.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Send again
                </button>
              </div>
            </div>
          ) : mode === 'forgot' ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-xs text-stone-600">
                Enter the email address you signed up with and we'll email you a link to choose a new password.
              </p>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Mail className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending...' : 'Email Me a Reset Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                Back to sign in
              </button>
            </form>
          ) : mode === 'register' ? (
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
                    placeholder="At least 6 characters"
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
                    <option value="" disabled={churches.length > 0}>
                      {churches.length > 0 ? 'Choose your church...' : 'No churches yet'}
                    </option>
                    {churches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-[11px] text-stone-500 leading-snug self-end pb-1">
                  Your pastor or church staff will approve your account before you can see the member directory.
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
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          ) : null}

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

              {currentUser ? (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700">
                  You'll be the pastoral admin of this church, signed in as <strong>{currentUser.email}</strong>.
                </div>
              ) : (
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
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Secures private prayers & staff moderation
                  </span>
                </div>
              </div>
              )}

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
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#4eb8b9] hover:bg-[#3ea0a1] text-white font-bold rounded-lg text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <ChurchIcon className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registering...' : 'Register Church & Launch Prayer Wall'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
