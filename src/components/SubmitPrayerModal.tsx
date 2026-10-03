import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VisibilityType, RequestCategory } from '../types';
import {
  X,
  Lock,
  Church as ChurchIcon,
  Globe,
  Sparkles,
  Heart,
  Flame,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Phone,
  LifeBuoy
} from 'lucide-react';

const CATEGORIES: RequestCategory[] = [
  'Health & Healing',
  'Comfort & Grief',
  'Family & Relationships',
  'Spiritual Growth',
  'Missions & Outreach',
  'Praise & Thanksgiving',
  'Guidance & Provision',
  'General',
];

export const SubmitPrayerModal: React.FC = () => {
  const {
    currentChurch,
    submitModalOpen,
    setSubmitModalOpen,
    addPrayerRequest,
    isModerating,
  } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibility, setVisibility] = useState<VisibilityType>('church');
  const [category, setCategory] = useState<RequestCategory>('Health & Healing');
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Submission response status
  const [submitResult, setSubmitResult] = useState<{
    status: 'success' | 'flagged' | 'crisis' | 'error';
    message: string;
    encouragement?: string;
  } | null>(null);

  if (!submitModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const res = await addPrayerRequest({
        title: title.trim(),
        content: content.trim(),
        requesterName: isAnonymous ? 'Anonymous' : (requesterName.trim() || 'Church Member'),
        requesterEmail: requesterEmail.trim() || undefined,
        requesterPhone: requesterPhone.trim() || undefined,
        isAnonymous,
        visibility,
        category,
        isUrgent,
      });

      // Fetch a gentle Scripture encouragement for the requester
      let encouragementNote = '';
      try {
        const encRes = await fetch('/api/generate-encouragement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, category }),
        });
        if (encRes.ok) {
          const encJson = await encRes.json();
          encouragementNote = encJson.encouragement;
        }
      } catch (err) {
        // Fallback
        encouragementNote = "May the Lord bless you and keep you; may His face shine upon you and give you peace. (Numbers 6:24-26)";
      }

      if (res.status === 'flagged') {
        setSubmitResult({
          status: 'flagged',
          message:
            'Thank you for sharing your heart. Your prayer request has been received and sent to our pastoral team for review before it is published to the public prayer wall.',
          encouragement: encouragementNote,
        });
      } else if (res.status === 'rejected') {
        setSubmitResult({
          status: 'error',
          message:
            res.reason ||
            'We were unable to publish this request as written. Please contact our pastoral office directly if you need immediate care.',
        });
      } else {
        setSubmitResult({
          status: 'success',
          message:
            visibility === 'private'
              ? 'Your confidential prayer request has been received by our pastoral care team. Our pastors will lift this before the Lord in strict confidence.'
              : 'Your prayer request has been posted to our church prayer wall! Our congregation will stand with you in faith.',
          encouragement: encouragementNote,
        });
      }
    } catch (err) {
      setSubmitResult({
        status: 'error',
        message: 'An error occurred while submitting your prayer request. Please try again.',
      });
    }
  };

  const handleResetAndClose = () => {
    setTitle('');
    setContent('');
    setRequesterName('');
    setRequesterEmail('');
    setRequesterPhone('');
    setIsAnonymous(false);
    setVisibility('church');
    setCategory('Health & Healing');
    setIsUrgent(false);
    setSubmitResult(null);
    setSubmitModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif-church text-lg font-bold">
                Submit a Prayer Request
              </h2>
              <p className="text-xs text-stone-400">
                {currentChurch.name} • How can our church family pray for you?
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {submitResult ? (
          <div className="p-6 text-center space-y-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                submitResult.status === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : submitResult.status === 'flagged'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {submitResult.status === 'success' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : submitResult.status === 'flagged' ? (
                <ShieldCheck className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
            </div>

            <h3 className="font-serif-church text-xl font-bold text-stone-900">
              {submitResult.status === 'success'
                ? 'Prayer Request Received'
                : submitResult.status === 'flagged'
                ? 'Received for Pastoral Review'
                : 'Notice'}
            </h3>

            <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              {submitResult.message}
            </p>

            {/* Scripture Encouragement */}
            {submitResult.encouragement && (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 font-serif-church italic max-w-md mx-auto space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 font-sans block not-italic">
                  A Word of Encouragement for You:
                </span>
                <p>"{submitResult.encouragement}"</p>
              </div>
            )}

            {/* Crisis Support Box */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-600 max-w-md mx-auto flex items-start gap-2.5 text-left">
              <LifeBuoy className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-800 block">Immediate Pastoral Need?</span>
                <p>
                  If you are experiencing an acute personal or emotional crisis, please call our church care line at{' '}
                  <strong className="text-stone-900">{currentChurch.phone}</strong> or call the 988 Suicide & Crisis Lifeline (available 24/7).
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Close & Return to Wall
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Requester Name & Anonymous Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Your Name <span className="text-stone-400 font-normal">(or check anonymous)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Post Anonymously</span>
                </label>
              </div>

              {!isAnonymous && (
                <input
                  type="text"
                  placeholder="e.g. Mary Higgins"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              )}
            </div>

            {/* Prayer Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">
                Prayer Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Upcoming cardiac bypass surgery for Harold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif-church font-semibold"
              />
            </div>

            {/* Request Details */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">
                Prayer Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share how our church family can stand with you in prayer..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Category & Urgent Flag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RequestCategory)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="flex items-center gap-1 text-rose-700">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    Mark as Urgent Need
                  </span>
                </label>
              </div>
            </div>

            {/* PRIVACY & VISIBILITY SELECTOR (The key user request requirement) */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="text-xs font-bold text-stone-900 block">
                Prayer Visibility & Privacy
              </label>
              <div className="space-y-2">
                {/* Option 1: Private (Staff Only) */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    visibility === 'private'
                      ? 'border-purple-500 bg-purple-50/60 ring-1 ring-purple-400'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-purple-950">
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Private (Church Pastoral Staff Only)</span>
                    </div>
                    <p className="text-stone-500 mt-0.5 leading-relaxed">
                      Strictly confidential. Only pastors and staff prayer team will see this. It will <strong>NOT</strong> appear on the public wall.
                    </p>
                  </div>
                </label>

                {/* Option 2: Church Public */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    visibility === 'church'
                      ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-400'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="church"
                    checked={visibility === 'church'}
                    onChange={() => setVisibility('church')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900">
                      <ChurchIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>{currentChurch.name} Congregation Wall</span>
                    </div>
                    <p className="text-stone-500 mt-0.5 leading-relaxed">
                      Visible on our church prayer wall. Church members can view, pray, and click "I Prayed for This".
                    </p>
                  </div>
                </label>

                {/* Option 3: Global Network */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    visibility === 'global'
                      ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-400'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="global"
                    checked={visibility === 'global'}
                    onChange={() => setVisibility('global')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Global Prayer Wall (Church Website Pros Network)</span>
                    </div>
                    <p className="text-stone-500 mt-0.5 leading-relaxed">
                      Visible on our church wall <strong>AND</strong> featured on the ChurchWebsitePros.com national network prayer wall for believers worldwide.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Optional Contact Info for Pastoral Care Follow-up */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-700 block">
                Optional Pastoral Contact (Private to Staff)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <input
                  type="email"
                  placeholder="Your Email (confidential)"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white"
                />
                <input
                  type="tel"
                  placeholder="Your Phone (optional)"
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white"
                />
              </div>
            </div>

            {/* AI Moderation Safety Reassurance */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex items-start gap-2 text-stone-500 text-[11px] leading-relaxed">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Safety Protection:</strong> Requests are vetted with AI-assisted moderation to filter profanity, commercial spam, and ensure community safety. Flagged submissions are reviewed directly by pastoral staff.
              </span>
            </div>

            {/* Submit Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isModerating}
                className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isModerating ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Safety...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Share Prayer Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
