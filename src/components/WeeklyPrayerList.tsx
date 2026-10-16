import React from 'react';
import { useApp } from '../context/AppContext';
import { PrayerRequest } from '../types';
import { isDateString } from '../utils/csvParser';
import { ArrowLeft, Printer } from 'lucide-react';

const CATEGORY_ORDER = [
  'Health & Healing',
  'Comfort & Grief',
  'Family & Relationships',
  'Spiritual Growth',
  'Missions & Outreach',
  'Guidance & Provision',
  'General',
];

const lineFor = (r: PrayerRequest) => {
  let text = r.bulletinSummary || r.title;
  if (!text || isDateString(text)) text = r.title || r.content;
  return text.replace(/^\[[^\]]+\]\s*/, '').trim();
};

/**
 * Read-only "This Week's Prayer List" for visitors: the same requests the church's
 * Sunday bulletin prints (approved, shared with the church, not archived from the wall
 * or rotated off the bulletin). Private requests and contact details are never shown.
 */
export const WeeklyPrayerList: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { filteredChurchRequests, currentChurch } = useApp();

  const thisWeek = filteredChurchRequests.filter(
    (r) =>
      r.status === 'approved' &&
      r.visibility !== 'private' &&
      !r.isArchived &&
      !r.isArchivedFromPrint
  );
  const needs = thisWeek.filter((r) => !r.isAnswered);
  const praises = thisWeek.filter((r) => r.isAnswered);
  const categories = [
    ...CATEGORY_ORDER,
    ...Array.from(new Set(needs.map((r) => r.category))).filter((c) => !CATEGORY_ORDER.includes(c)),
  ].filter((c) => needs.some((r) => r.category === c));

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
      <div className="flex items-center justify-between gap-2 mb-4 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 hover:text-stone-900 px-3 py-2 rounded-lg hover:bg-stone-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to prayer wall
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-stone-800 hover:bg-stone-900 px-4 py-2 rounded-lg cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      <div className="printable-area ink-black bg-white rounded-2xl border border-stone-200 p-5 sm:p-8 text-stone-900">
        <div className="border-b-2 border-stone-900 pb-2 mb-4">
          <h1 className="font-serif-church text-xl sm:text-2xl font-bold">This Week's Prayer List</h1>
          <p className="text-xs text-stone-600 mt-0.5">
            {currentChurch.name} ·{' '}
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {thisWeek.length === 0 ? (
          <p className="text-sm text-stone-600 py-6 text-center">There are no prayer requests on this week's list yet.</p>
        ) : (
          <div className="sm:columns-2 gap-8 text-sm leading-snug">
            {categories.map((cat) => (
              <section key={cat} className="mb-4">
                <h2 className="font-bold uppercase tracking-wide text-[11px] border-b border-stone-400 pb-0.5 mb-1.5 break-after-avoid">
                  {cat}
                </h2>
                <ul className="space-y-1">
                  {needs
                    .filter((r) => r.category === cat)
                    .map((r) => (
                      <li key={r.id} className="break-inside-avoid">
                        <strong>{r.requesterName}</strong> — {lineFor(r)}
                      </li>
                    ))}
                </ul>
              </section>
            ))}
            {praises.length > 0 && (
              <section className="mb-4">
                <h2 className="font-bold uppercase tracking-wide text-[11px] border-b border-stone-400 pb-0.5 mb-1.5 break-after-avoid">
                  Praises & Answered Prayers
                </h2>
                <ul className="space-y-1">
                  {praises.map((r) => (
                    <li key={r.id} className="break-inside-avoid">
                      <strong>{r.requesterName}</strong> — {r.answeredUpdate || lineFor(r)}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {currentChurch.scriptureVerse && (
          <p className="mt-4 pt-2 border-t border-stone-300 text-center text-xs italic font-serif-church">
            "{currentChurch.scriptureVerse}"
          </p>
        )}
      </div>
    </div>
  );
};
