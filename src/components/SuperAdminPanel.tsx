import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { scanBrowserData, importBrowserData, DEMO_CHURCH_IDS, BrowserDataScan } from '../utils/browserDataImport';
import { Bell, CheckCheck, HardDriveUpload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

/** Super admin extras: new-church notifications and the one-time browser data move. */
export const SuperAdminPanel: React.FC = () => {
  const { notifications, markNotificationsRead, churches, refreshData } = useApp();
  const unread = notifications.filter((n) => !n.readAt);

  const [scan, setScan] = useState<BrowserDataScan | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScan = () => {
    const found = scanBrowserData(new Set(churches.map((c) => c.id)));
    setScan(found);
    setResult(null);
    setError(null);
    setSelected(
      new Set(
        found.churches
          .filter((c) => !DEMO_CHURCH_IDS.has(c.church.id) && !c.existsInDatabase)
          .map((c) => c.church.id)
      )
    );
  };

  const runImport = async () => {
    if (!scan || selected.size === 0) return;
    setImporting(true);
    setError(null);
    try {
      const counts = await importBrowserData(scan, [...selected]);
      setResult(
        `Moved ${counts.churches} church(es), ${counts.requests} prayer requests and ${counts.directory} directory entries. Anything already in the database was left as is.`
      );
      await refreshData();
      setScan(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : (e as { message?: string })?.message || String(e));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-serif-church font-bold text-base text-stone-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            New Church Sign-ups
            {unread.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unread.length} new
              </span>
            )}
          </h3>
          {unread.length > 0 && (
            <button
              onClick={markNotificationsRead}
              className="text-xs text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="p-6 text-xs text-stone-500 text-center">
            When a pastor registers a new church, it will show up here.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id} className={`px-5 py-2.5 text-xs ${n.readAt ? 'text-stone-500' : 'text-stone-900 bg-amber-50/50'}`}>
                <div className={n.readAt ? '' : 'font-semibold'}>{n.message}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-3">
        <h3 className="font-serif-church font-bold text-base text-stone-900 flex items-center gap-2">
          <HardDriveUpload className="w-4 h-4 text-blue-600" />
          Move Data Saved in This Browser
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          The earlier version of PrayerKeeper saved churches and prayers only inside the browser you used. Open this page
          on that same computer and browser, then move the data into the database so it saves for everyone.
        </p>

        {!scan && (
          <button
            onClick={startScan}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Look for data in this browser
          </button>
        )}

        {scan && (
          <div className="space-y-2">
            <p className="text-[11px] text-stone-500">
              {scan.source === 'browser'
                ? 'Found data saved by the earlier version in this browser.'
                : 'No saved data in this browser. Showing the starter data that came with the earlier version.'}{' '}
              Choose what to move:
            </p>
            <ul className="border border-stone-200 rounded-lg divide-y divide-stone-100 max-h-64 overflow-y-auto">
              {scan.churches.map(({ church, requestCount, directoryCount, existsInDatabase }) => (
                <li key={church.id}>
                  <label className="flex items-start gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={selected.has(church.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(church.id);
                        else next.delete(church.id);
                        setSelected(next);
                      }}
                    />
                    <span>
                      <span className="font-bold text-stone-900">{church.name}</span>
                      {DEMO_CHURCH_IDS.has(church.id) && <span className="text-stone-400"> (demo)</span>}
                      <span className="block text-stone-500">
                        {requestCount} prayers • {directoryCount} directory entries
                        {existsInDatabase && ' • already in database (only missing items are added)'}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              <button
                onClick={runImport}
                disabled={importing || selected.size === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {importing ? 'Moving...' : `Move ${selected.size} church(es) into the database`}
              </button>
              <button onClick={() => setScan(null)} className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {result}
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
