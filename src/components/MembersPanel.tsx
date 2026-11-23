import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, UserX, ShieldCheck, User, Clock, CheckCircle, Link2, Copy, Check } from 'lucide-react';

/** Staff view of the church's member accounts: approve sign-ups, grant or remove staff access. */
export const MembersPanel: React.FC = () => {
  const { users, currentChurch, currentUser, approveMember, setMemberRole, revokeMember } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);

  const churchMembers = users
    .filter((u) => u.churchId === currentChurch.id && u.role !== 'super_admin')
    .sort((a, b) => a.name.localeCompare(b.name));
  const pending = churchMembers.filter((u) => !u.approved);
  const approved = churchMembers.filter((u) => u.approved);

  // Invite link: opens the sign-up form with this church already chosen
  const inviteLink = `${window.location.origin}/app?church=${encodeURIComponent(currentChurch.slug)}&join=1`;
  const inviteMessage =
    `You're invited to join ${currentChurch.name} on PrayerKeeper, where our church shares prayer requests ` +
    `and our member directory.\n\nCreate your account here: ${inviteLink}\n\n` +
    `Once a pastor approves your account, you'll be able to see the church directory.`;
  const [copied, setCopied] = useState<'link' | 'message' | null>(null);
  const copy = async (what: 'link' | 'message') => {
    try {
      await navigator.clipboard.writeText(what === 'link' ? inviteLink : inviteMessage);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('Copy this:', what === 'link' ? inviteLink : inviteMessage);
    }
  };

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    await action();
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-3">
        <h3 className="font-serif-church font-bold text-lg text-stone-900 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-stone-600" />
          Invite members
        </h3>
        <p className="text-xs text-stone-600">
          Share this link by email, text, your website or the bulletin. It opens the sign-up form with {currentChurch.name}{' '}
          already chosen. New sign-ups appear below for you to approve.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            readOnly
            value={inviteLink}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-stone-200 bg-stone-50 font-mono"
            aria-label="Invite link"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copy('link')}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'link' ? 'Copied' : 'Copy link'}
            </button>
            <button
              type="button"
              onClick={() => copy('message')}
              className="flex items-center gap-1.5 px-3 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              {copied === 'message' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'message' ? 'Copied' : 'Copy invite message'}
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/60 flex items-center justify-between">
          <h3 className="font-serif-church font-bold text-lg text-stone-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Waiting for Approval ({pending.length})
          </h3>
          <span className="text-xs text-stone-500">Approved members can see the church directory</span>
        </div>
        {pending.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
            No one is waiting. New member sign-ups for {currentChurch.name} will appear here.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {pending.map((u) => (
              <li key={u.id} className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-stone-900 text-sm">{u.name}</div>
                  <div className="text-stone-500">
                    {u.email}
                    {u.phone ? ` • ${u.phone}` : ''}
                    {u.title ? ` • ${u.title}` : ''} • signed up {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={busyId === u.id}
                    onClick={() => run(u.id, () => approveMember(u.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-serif-church font-bold text-lg text-stone-900">
            Church Accounts ({approved.length})
          </h3>
          <span className="text-xs text-stone-500">Staff can moderate, print prayer lists, and manage members</span>
        </div>
        <ul className="divide-y divide-stone-100">
          {approved.map((u) => {
            const isMe = u.id === currentUser?.id;
            const isStaff = u.role === 'church_staff';
            return (
              <li key={u.id} className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  {isStaff ? (
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-stone-900 text-sm">
                      {u.name} {isMe && <span className="text-stone-400 font-normal">(you)</span>}
                    </div>
                    <div className="text-stone-500">
                      {isStaff ? 'Pastor / Staff' : 'Member'} • {u.email}
                    </div>
                  </div>
                </div>
                {!isMe && (
                  <div className="flex items-center gap-2">
                    <button
                      disabled={busyId === u.id}
                      onClick={() => run(u.id, () => setMemberRole(u.id, isStaff ? 'congregation_member' : 'church_staff'))}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isStaff ? 'Remove staff access' : 'Make staff'}
                    </button>
                    <button
                      disabled={busyId === u.id}
                      onClick={() => {
                        if (window.confirm(`Remove ${u.name}'s member access? They will no longer see the directory.`)) {
                          run(u.id, () => revokeMember(u.id));
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-rose-700 hover:bg-rose-50 rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
