import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, CheckCircle, AlertCircle } from 'lucide-react';

/** Shown after someone opens a password-reset email link. */
export const SetNewPasswordModal: React.FC = () => {
  const { isPasswordRecovery, updatePassword, finishPasswordRecovery, openLoginModal } = useApp();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (!isPasswordRecovery) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Please choose a password of at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setSaving(true);
    const res = await updatePassword(password);
    setSaving(false);
    if (res.success) {
      setDone(true);
      setTimeout(finishPasswordRecovery, 1800);
    } else {
      setError(res.error || 'Could not save your new password.');
    }
  };

  const input =
    'w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 no-print">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
        <div className="bg-stone-900 text-white px-6 py-4">
          <h2 className="font-serif-church text-lg font-bold flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            Choose a New Password
          </h2>
        </div>
        <div className="p-6 space-y-3.5">
          {done ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Your password is updated and you're signed in. Use the new password next time you sign in.
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  className={input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Type it again</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={input}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm cursor-pointer disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save New Password'}
              </button>
              {error?.includes('expired') && (
                <button
                  type="button"
                  onClick={() => {
                    finishPasswordRecovery();
                    openLoginModal(undefined, 'login');
                  }}
                  className="w-full text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Back to sign in
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};
