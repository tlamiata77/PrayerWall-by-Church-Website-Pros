import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PrayingHands } from './icons/PrayingHands';
import {
  Heart,
  RotateCcw,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  Eye,
  PlusCircle,
  MessageSquare,
  Lock,
  Globe,
  Share2,
  Check,
  AlertCircle,
  HelpCircle,
  Flame,
  ArrowRight
} from 'lucide-react';
import { PrayerRequest, RequestCategory } from '../types';

export const MemberPrayerHistory: React.FC = () => {
  const {
    currentUser,
    openLoginModal,
    requests,
    resubmitPrayerRequest,
    togglePrayerAnswered,
    setSubmitModalOpen,
    currentChurch,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'active' | 'answered' | 'flagged' | 'private'>('all');
  const [resubmittingRequestId, setResubmittingRequestId] = useState<string | null>(null);
  const [resubmitUpdateNote, setResubmitUpdateNote] = useState('');
  const [resubmitIsUrgent, setResubmitIsUrgent] = useState(false);
  const [resubmitSuccessMsg, setResubmitSuccessMsg] = useState<string | null>(null);

  // If user is not signed in
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <PrayingHands className="w-8 h-8 text-amber-700" />
          </div>
          <h2 className="text-2xl font-bold font-serif-church text-stone-900 mb-2">
            My Prayers & Praises
          </h2>
          <p className="text-stone-600 text-sm max-w-md mx-auto mb-6">
            Sign in to your church member account to view all prayer requests and praises you’ve submitted, celebrate answered prayers, see who has prayed for you, and resubmit or update requests on the prayer wall.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <button
              onClick={() => openLoginModal('my-prayers')}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In</span>
            </button>

          </div>

          <div className="border-t border-stone-100 pt-6">
            <p className="text-xs text-stone-400">
              GraceWall protects church member privacy. Only you and authorized pastoral staff can see your personal submission record.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Requests submitted while signed in to this account
  const userRequests = requests.filter((r) => r.userId === currentUser.id);

  const displayedRequests = userRequests.filter((r) => {
    if (filter === 'active') return r.status === 'approved' && !r.isAnswered;
    if (filter === 'answered') return r.isAnswered;
    if (filter === 'flagged') return r.status === 'flagged';
    if (filter === 'private') return r.visibility === 'private';
    return true;
  });

  const handleOpenResubmit = (req: PrayerRequest) => {
    setResubmittingRequestId(req.id);
    setResubmitUpdateNote('');
    setResubmitIsUrgent(req.isUrgent);
    setResubmitSuccessMsg(null);
  };

  const handleConfirmResubmit = (req: PrayerRequest) => {
    resubmitPrayerRequest(req.id, resubmitUpdateNote, resubmitIsUrgent);
    setResubmitSuccessMsg(`Request "${req.title}" has been resubmitted to the Prayer Wall!`);
    setTimeout(() => {
      setResubmittingRequestId(null);
      setResubmitSuccessMsg(null);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={
              currentUser.avatarUrl ||
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80'
            }
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif-church text-stone-900 flex items-center gap-2">
                <PrayingHands className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{currentUser.name}’s Prayers & Praises</span>
              </h2>
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                {currentUser.title || 'Church Member'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {currentUser.email} • {currentChurch.name} • {userRequests.length} Total Submissions
            </p>
          </div>
        </div>

        <button
          onClick={() => setSubmitModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit New Prayer</span>
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto bg-stone-200/70 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Submissions ({userRequests.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'active'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Active on Wall ({userRequests.filter((r) => r.status === 'approved' && !r.isAnswered).length})
          </button>
          <button
            onClick={() => setFilter('answered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'answered'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Answered Praises ({userRequests.filter((r) => r.isAnswered).length})
          </button>
          <button
            onClick={() => setFilter('private')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'private'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Staff Only / Private ({userRequests.filter((r) => r.visibility === 'private').length})
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'flagged'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pending Review ({userRequests.filter((r) => r.status === 'flagged').length})
          </button>
        </div>

        <div className="text-xs text-stone-500 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
          <span>Click <strong>"Resubmit to Prayer Wall"</strong> to bump and renew an ongoing need.</span>
        </div>
      </div>

      {/* Global Success Notification */}
      {resubmitSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resubmitSuccessMsg}</span>
        </div>
      )}

      {/* Empty State */}
      {displayedRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-serif-church text-lg font-bold text-stone-800 mb-1">
            No Prayer Requests Found in this View
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
            {filter === 'all'
              ? 'You have not submitted any prayer requests yet. Share your first request with your church family!'
              : `You have no requests matching the "${filter}" filter.`}
          </p>
          <button
            onClick={() => setSubmitModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Submit a Prayer Request</span>
          </button>
        </div>
      ) : (
        /* Requests List */
        <div className="space-y-4">
          {displayedRequests.map((req) => {
            const isEditingThis = resubmittingRequestId === req.id;

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                  req.isAnswered
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : req.status === 'flagged'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                        {req.category}
                      </span>

                      {req.visibility === 'private' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-stone-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Pastoral Confidential
                        </span>
                      )}

                      {req.visibility === 'global' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          Global Network
                        </span>
                      )}

                      {req.isUrgent && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          Urgent
                        </span>
                      )}

                      {req.isAnswered ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Answered Prayer / Praise
                        </span>
                      ) : req.status === 'approved' ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Active on Church Wall
                        </span>
                      ) : req.status === 'flagged' ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Under Pastoral Review
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Declined
                        </span>
                      )}

                      {req.resubmittedTimes && req.resubmittedTimes > 0 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 flex items-center gap-1">
                          <RotateCcw className="w-2.5 h-2.5" />
                          Resubmitted {req.resubmittedTimes}x
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif-church text-base font-bold text-stone-900">
                      {req.title}
                    </h3>
                  </div>

                  {/* Prayer Counter Pill */}
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl">
                    <Heart className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span className="text-xs font-bold text-amber-900">
                      {req.prayerCount} {req.prayerCount === 1 ? 'Prayer' : 'Prayers'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs text-stone-700 leading-relaxed mb-3 whitespace-pre-line">
                  {req.content}
                </p>

                {/* Praise Report / Answered Update */}
                {req.answeredUpdate && (
                  <div className="mb-3 p-3 bg-emerald-100/60 border border-emerald-300/80 rounded-xl text-xs text-emerald-900">
                    <div className="flex items-center gap-1.5 font-bold mb-0.5 text-emerald-950">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Praise & Answered Prayer Report:</span>
                    </div>
                    <p className="italic">"{req.answeredUpdate}"</p>
                  </div>
                )}

                {/* Metadata & Timestamp */}
                <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-100 pt-2.5 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      Submitted: {new Date(req.createdAt).toLocaleDateString()}
                    </span>

                    {req.lastResubmittedAt && (
                      <span className="flex items-center gap-1 text-amber-700 font-medium">
                        <RotateCcw className="w-3 h-3" />
                        Last Renewed: {new Date(req.lastResubmittedAt).toLocaleDateString()}
                      </span>
                    )}

                    <span className="text-stone-300">•</span>
                    <span>Church: {req.churchName || currentChurch.name}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenResubmit(req)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Bump request to the top of the wall with an optional progress update"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>Resubmit / Renew on Wall</span>
                    </button>

                    <button
                      onClick={() => {
                        const note = prompt(
                          'Praise Report Update:\nHow has the Lord moved or answered this request? (Leave blank to just toggle)',
                          req.answeredUpdate || ''
                        );
                        if (note !== null) {
                          togglePrayerAnswered(req.id, note);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                        req.isAnswered
                          ? 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{req.isAnswered ? 'Edit Praise Report' : 'Mark as Answered'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Resubmit Form Dialog */}
                {isEditingThis && (
                  <div className="mt-4 p-4 bg-amber-50/70 border border-amber-300 rounded-xl space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-amber-700" />
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                          Resubmit Request to Current Church Wall & Bulletin
                        </h4>
                      </div>
                      <button
                        onClick={() => setResubmittingRequestId(null)}
                        className="text-stone-400 hover:text-stone-700 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <p className="text-xs text-stone-600">
                      Resubmitting bumps this prayer back to the top of the {currentChurch.name} Prayer Wall and marks it as active for this coming Sunday's bulletin insert.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Add an Update or Continued Need Note (Optional):
                      </label>
                      <textarea
                        rows={2}
                        value={resubmitUpdateNote}
                        onChange={(e) => setResubmitUpdateNote(e.target.value)}
                        placeholder="e.g. Update: Doctors saw improvement this week! Please continue praying for the next test results on Monday."
                        className="w-full p-2.5 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={resubmitIsUrgent}
                          onChange={(e) => setResubmitIsUrgent(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>Flag as Urgent Need</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setResubmittingRequestId(null)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmResubmit(req)}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm & Resubmit Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Encouragements Log */}
                {req.recentEncouragements && req.recentEncouragements.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-start gap-2 text-[11px] text-stone-600">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold text-stone-700">Encouragement notes from brethren:</span>
                      {req.recentEncouragements.slice(0, 3).map((enc, idx) => (
                        <p key={idx} className="italic text-stone-500">
                          "{enc.text}" {enc.from ? `— ${enc.from}` : ''} ({enc.date})
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
