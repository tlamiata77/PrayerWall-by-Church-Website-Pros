import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PrayerRequest, RequestCategory, VisibilityType } from '../types';
import { X, Save, Trash2, Pencil } from 'lucide-react';

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

// yyyy-mm-dd for <input type="date"> in the viewer's own time zone
const toDateInput = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

interface EditPrayerModalProps {
  request: PrayerRequest | null;
  onClose: () => void;
}

/** Staff form to correct any part of a prayer request, e.g. one that imported wrong. */
export const EditPrayerModal: React.FC<EditPrayerModalProps> = ({ request, onClose }) => {
  const { updatePrayerRequest, deletePrayerRequest } = useApp();
  const [form, setForm] = useState<PrayerRequest | null>(request);
  const [dateValue, setDateValue] = useState('');

  useEffect(() => {
    setForm(request);
    setDateValue(request ? toDateInput(request.createdAt) : '');
  }, [request]);

  if (!request || !form) return null;

  const set = <K extends keyof PrayerRequest>(key: K, value: PrayerRequest[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    // Keep the original time of day when only the date changes
    let createdAt = request.createdAt;
    if (dateValue && dateValue !== toDateInput(request.createdAt)) {
      const original = new Date(request.createdAt);
      const [y, m, d] = dateValue.split('-').map(Number);
      const next = Number.isNaN(original.getTime()) ? new Date(y, m - 1, d, 12) : new Date(original);
      next.setFullYear(y, m - 1, d);
      createdAt = next.toISOString();
    }

    updatePrayerRequest(request.id, {
      requesterName: form.isAnonymous ? 'Anonymous' : form.requesterName.trim() || 'Church Member',
      isAnonymous: form.isAnonymous,
      title: form.title.trim(),
      content: form.content.trim(),
      bulletinSummary: form.bulletinSummary?.trim() || form.title.trim(),
      category: form.category,
      visibility: form.visibility,
      isUrgent: form.isUrgent,
      isAnswered: form.isAnswered,
      answeredUpdate: form.answeredUpdate?.trim() || undefined,
      requesterEmail: form.requesterEmail?.trim() || undefined,
      requesterPhone: form.requesterPhone?.trim() || undefined,
      createdAt,
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Permanently delete "${request.title}"? This can't be undone. (To just hide it, use Archive instead.)`)) {
      deletePrayerRequest(request.id);
      onClose();
    }
  };

  const input =
    'w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white';
  const label = 'block text-xs font-semibold text-stone-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <form
        onSubmit={handleSave}
        className="relative bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl my-8 overflow-hidden"
      >
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif-church text-lg font-bold flex items-center gap-2">
            <Pencil className="w-4 h-4 text-amber-400" />
            Edit Prayer Request
          </h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-white cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Name</label>
              <input
                className={input}
                value={form.isAnonymous ? 'Anonymous' : form.requesterName}
                disabled={form.isAnonymous}
                onChange={(e) => set('requesterName', e.target.value)}
              />
              <label className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-600 cursor-pointer">
                <input type="checkbox" checked={Boolean(form.isAnonymous)} onChange={(e) => set('isAnonymous', e.target.checked)} />
                Show as anonymous
              </label>
            </div>
            <div>
              <label className={label}>Date</label>
              <input type="date" className={input} value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={label}>Prayer title *</label>
            <input className={input} required value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          <div>
            <label className={label}>Details</label>
            <textarea rows={4} className={input} value={form.content} onChange={(e) => set('content', e.target.value)} />
          </div>

          <div>
            <label className={label}>Bulletin line (what prints on the Sunday flyer)</label>
            <input
              className={input}
              value={form.bulletinSummary || ''}
              placeholder={form.title}
              onChange={(e) => set('bulletinSummary', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Category</label>
              <select className={input} value={form.category} onChange={(e) => set('category', e.target.value as RequestCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Who can see it</label>
              <select className={input} value={form.visibility} onChange={(e) => set('visibility', e.target.value as VisibilityType)}>
                <option value="church">Church prayer wall</option>
                <option value="global">Church wall + global network</option>
                <option value="private">Private (pastoral staff only)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-stone-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.isUrgent} onChange={(e) => set('isUrgent', e.target.checked)} />
              Urgent
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.isAnswered} onChange={(e) => set('isAnswered', e.target.checked)} />
              Answered / praise
            </label>
          </div>

          {form.isAnswered && (
            <div>
              <label className={label}>Praise update</label>
              <input
                className={input}
                value={form.answeredUpdate || ''}
                placeholder="e.g. Surgery went well, home recovering"
                onChange={(e) => set('answeredUpdate', e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-stone-100">
            <div>
              <label className={label}>Email (staff only)</label>
              <input type="email" className={input} value={form.requesterEmail || ''} onChange={(e) => set('requesterEmail', e.target.value)} />
            </div>
            <div>
              <label className={label}>Phone (staff only)</label>
              <input className={input} value={form.requesterPhone || ''} onChange={(e) => set('requesterPhone', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
