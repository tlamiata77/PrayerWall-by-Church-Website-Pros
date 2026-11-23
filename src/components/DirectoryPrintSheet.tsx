import React, { useState } from 'react';
import { Printer, Mail, Phone, MapPin } from 'lucide-react';
import { Church, DirectoryMember } from '../types';
import { getChurchTheme } from '../utils/theme';

type Columns = 3 | 4 | 5;

interface DirectoryPrintSheetProps {
  church: Church;
  /** Listings to print, already filtered by search/group */
  members: DirectoryMember[];
}

const initials = (name: string) =>
  name
    .replace(/^the\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

/**
 * Printable photo directory: a title banner (in the church's primary color, or plain with no
 * color behind it), then a grid of color photos with each name underneath and only the phone
 * numbers and emails people chose to publish.
 */
export const DirectoryPrintSheet: React.FC<DirectoryPrintSheetProps> = ({ church, members }) => {
  const [columns, setColumns] = useState<Columns>(4);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showAddresses, setShowAddresses] = useState(true);
  const [colorBanner, setColorBanner] = useState(true);
  const theme = getChurchTheme(church);
  const [title, setTitle] = useState('Church Photo Directory');

  // Listings staff hid from members never go on the printout
  const printable = members.filter((m) => m.isPublicInDirectory);

  const pageW = orientation === 'portrait' ? 8.5 : 11;
  const pageH = orientation === 'portrait' ? 11 : 8.5;
  const margin = 0.4;
  // Icons follow the banner: the church color with the color banner, black with the plain one
  const band = colorBanner ? theme.primary : '#000000';
  const exactColors = { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as const;

  // Text shrinks a little as more entries share a row
  const nameSize = columns === 3 ? 'text-[15px]' : columns === 4 ? 'text-[13px]' : 'text-[11.5px]';
  const detailSize = columns === 3 ? 'text-[11px]' : columns === 4 ? 'text-[9.5px]' : 'text-[8.5px]';

  const pill = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
      active ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
    }`;

  return (
    <div className="space-y-4">
      {/* Options (not printed) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 no-print">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-semibold mr-1">Across:</span>
            {([3, 4, 5] as Columns[]).map((n) => (
              <button key={n} type="button" className={pill(columns === n)} onClick={() => setColumns(n)}>
                {n}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-semibold mr-1">Page:</span>
            <button type="button" className={pill(orientation === 'portrait')} onClick={() => setOrientation('portrait')}>
              ▯ Tall
            </button>
            <button type="button" className={pill(orientation === 'landscape')} onClick={() => setOrientation('landscape')}>
              ▭ Wide
            </button>
          </div>
          <label className="flex items-center gap-1.5 font-semibold text-stone-700 cursor-pointer">
            <input type="checkbox" checked={showAddresses} onChange={(e) => setShowAddresses(e.target.checked)} />
            Show addresses
          </label>
          <label className="flex items-center gap-1.5 font-semibold text-stone-700 cursor-pointer">
            <input type="checkbox" checked={colorBanner} onChange={(e) => setColorBanner(e.target.checked)} />
            Color banner
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300"
            aria-label="Directory title"
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print or Save as PDF
          </button>
        </div>
        <p className="text-[11px] text-stone-500">
          Only the phone numbers and emails each person chose to publish are printed. Listings hidden from members are left out.
        </p>
      </div>

      <style>{`@media print { @page { size: ${pageW}in ${pageH}in; margin: ${margin}in; } }`}</style>

      {/* The sheet: real paper width on screen, scrolls sideways on phones */}
      <div className="bg-stone-200/60 rounded-2xl p-2 sm:p-6 overflow-x-auto flex justify-center-safe print:p-0 print:bg-transparent print:block print:overflow-visible">
        <div
          className="printable-area ink-color bg-white shadow-xl shrink-0 box-border"
          style={{ width: `${pageW}in`, minHeight: `${pageH}in`, padding: `${margin}in` }}
        >
          <header
            className={`mb-5 flex items-end justify-between gap-4 ${colorBanner ? 'px-5 py-3 text-white' : 'pb-2 text-black'}`}
            style={colorBanner ? { backgroundColor: theme.primary, ...exactColors } : { borderBottom: '3px solid #000' }}
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] opacity-90">{church.name}</div>
              {/* Not an <h1>: the shared print styles color every h1 in the brand color, which would vanish on the color banner */}
              <div role="heading" aria-level={1} className="font-serif-church uppercase tracking-[0.08em] text-2xl sm:text-3xl leading-tight">{title}</div>
            </div>
            <div className="text-[10px] opacity-90 text-right shrink-0">
              {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          </header>

          {printable.length === 0 ? (
            <p className="text-center text-sm text-stone-500 py-10">No listings to print.</p>
          ) : (
            <div className="grid gap-x-4 gap-y-5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {printable.map((m) => {
                // Every adult is named under the family name, with only what they published
                const contacts = m.contacts.filter((c) => c.name || c.phone || c.email);
                const labelPeople = contacts.length > 1 || Boolean(contacts[0] && contacts[0].name && contacts[0].name !== m.name);
                const src = m.photoSrc || (m.photoUrl && !m.photoUrl.startsWith('storage:') ? m.photoUrl : '');
                return (
                  <div key={m.id} className="page-break-inside-avoid break-inside-avoid text-center">
                    <div className="aspect-[4/3] w-full overflow-hidden border border-stone-200 bg-stone-50">
                      {src ? (
                        <img src={src} alt={m.name} className="w-full h-full object-contain" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-serif-church text-3xl text-white"
                          style={{ backgroundColor: theme.primary, ...exactColors }}
                        >
                          {initials(m.name)}
                        </div>
                      )}
                    </div>
                    <div className={`font-serif-church font-bold text-stone-900 mt-1.5 leading-tight ${nameSize}`}>{m.name}</div>
                    <div className={`mt-1 space-y-0.5 text-stone-700 leading-snug ${detailSize}`}>
                      {contacts.map((c, i) => (
                        <div key={i}>
                          {labelPeople && c.name && <div className="font-semibold text-stone-800">{c.name}</div>}
                          {c.phone && (
                            <div className="flex items-center justify-center gap-1">
                              <Phone className="w-2.5 h-2.5 shrink-0" style={{ color: band }} />
                              <span>{c.phone}</span>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center justify-center gap-1 min-w-0">
                              <Mail className="w-2.5 h-2.5 shrink-0" style={{ color: band }} />
                              <span className="break-all">{c.email}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {showAddresses && m.address && (
                        <div className="flex items-start justify-center gap-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: band }} />
                          <span>{m.address}</span>
                        </div>
                      )}
                      {m.familyMembers && <div className="text-stone-600">{m.familyMembers}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
