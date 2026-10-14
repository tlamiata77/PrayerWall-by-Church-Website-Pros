import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, UserX, ShieldCheck, User, Clock, CheckCircle } from 'lucide-react';

/** Staff view of the church's member accounts: approve sign-ups, grant or remove staff access. */
export const MembersPanel: React.FC = () => {
  const { users, currentChurch, currentUser, approveMember, setMemberRole, revokeMember } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);

  const churchMembers = users
    .filter((u) => u.churchId === currentChurch.id && u.role !== 'super_admin')
    .sort((a, b) => a.name.localeCompare(b.name));
  const pending = churchMembers.filter((u) => !u.approved);
  const approved = churchMembers.filter((u) => u.approved);

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    await action();
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
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
          <span className="text-xs text-stone-500">Staff can moderate, print bulletins, and manage members</span>
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
