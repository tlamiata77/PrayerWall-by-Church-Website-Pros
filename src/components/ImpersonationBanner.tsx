import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ArrowLeft, Church, AlertCircle } from 'lucide-react';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, currentChurch, exitImpersonation, churches, setCurrentChurchId } = useApp();

  if (!isImpersonating) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2.5 shadow-md sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm font-medium">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <ShieldAlert className="w-5 h-5 text-amber-100 shrink-0" />
          <span>
            <strong className="font-semibold">Super Admin Troubleshooting Mode:</strong> Logged in as{' '}
            <span className="underline decoration-amber-200 underline-offset-2 font-bold">{currentChurch.name}</span>{' '}
            (Church Staff View)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-amber-100">
            <Church className="w-4 h-4" />
            <select
              value={currentChurch.id}
              onChange={(e) => setCurrentChurchId(e.target.value)}
              className="bg-amber-700/80 text-white text-xs rounded px-2.5 py-1 border border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-white"
            >
              {churches.map((c) => (
                <option key={c.id} value={c.id}>
                  Switch to: {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={exitImpersonation}
            className="flex items-center gap-1.5 bg-white text-amber-900 hover:bg-amber-50 px-3 py-1 rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Super Admin
          </button>
        </div>
      </div>
    </div>
  );
};
