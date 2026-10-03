import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Globe,
  Heart,
  Church as ChurchIcon,
  Sparkles,
  Calendar,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';

export const GlobalPrayerWall: React.FC = () => {
  const { globalRequests, incrementPrayerCount, churches, setCurrentChurchId, setActiveTab } = useApp();
  const [selectedChurchFilter, setSelectedChurchFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = globalRequests.filter((req) => {
    if (selectedChurchFilter !== 'All' && req.churchId !== selectedChurchFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = req.title.toLowerCase().includes(q);
      const matchContent = req.content.toLowerCase().includes(q);
      const matchChurch = req.churchName?.toLowerCase().includes(q) || false;
      return matchTitle || matchContent || matchChurch;
    }
    return true;
  });

  const totalGlobalPrayers = globalRequests.reduce((sum, r) => sum + r.prayerCount, 0);

  const handlePray = (id: string, title: string, count: number) => {
    incrementPrayerCount(id);
    setToastMessage(`You joined ${count} believers worldwide in prayer for "${title.slice(0, 30)}..."`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-950 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-indigo-700 animate-bounce">
          <Globe className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Global Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-stone-900 to-amber-950 text-white rounded-3xl p-8 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>ChurchWebsitePros.com Global Prayer Network</span>
          </div>

          <h2 className="font-serif-church text-3xl sm:text-4xl font-bold tracking-tight text-stone-100">
            United in Prayer Across Churches
          </h2>

          <p className="text-sm text-stone-300 leading-relaxed">
            When believers mark their prayer request as <strong>Global</strong>, it joins this shared wall so that Christians across all partner churches can stand in the gap together.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
            <div>
              <span className="block text-2xl font-bold text-amber-400 font-serif-church">
                {globalRequests.length}
              </span>
              <span className="text-stone-400 uppercase tracking-wider text-[10px]">
                Global Requests
              </span>
            </div>
            <div className="border-l border-stone-700 pl-6">
              <span className="block text-2xl font-bold text-indigo-300 font-serif-church">
                {totalGlobalPrayers}
              </span>
              <span className="text-stone-400 uppercase tracking-wider text-[10px]">
                Prayers Lifted Together
              </span>
            </div>
            <div className="border-l border-stone-700 pl-6">
              <span className="block text-2xl font-bold text-emerald-400 font-serif-church">
                {churches.length}
              </span>
              <span className="text-stone-400 uppercase tracking-wider text-[10px]">
                Partner Churches
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter by Church & Search */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-stone-200 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search global prayers by church or need..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-lg text-sm border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 font-medium">Filter by Church:</span>
          <select
            value={selectedChurchFilter}
            onChange={(e) => setSelectedChurchFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-800 font-semibold"
          >
            <option value="All">All Churches ({globalRequests.length})</option>
            {churches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Prayer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((req) => (
          <div
            key={req.id}
            className="bg-white rounded-2xl p-6 shadow-xs border border-stone-200 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Church of Origin Badge */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => {
                    setCurrentChurchId(req.churchId);
                    setActiveTab('wall');
                  }}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                  title="Visit this church's individual prayer wall"
                >
                  <ChurchIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{req.churchName || 'Partner Church'}</span>
                  <ArrowRight className="w-3 h-3 text-indigo-400" />
                </button>

                <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[11px] font-medium">
                  {req.category}
                </span>
              </div>

              <div>
                <h3 className="font-serif-church text-lg font-bold text-stone-900">
                  {req.title}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Requested by <span className="font-semibold text-stone-700">{req.requesterName}</span>
                </p>
              </div>

              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {req.content}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => handlePray(req.id, req.title, req.prayerCount)}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 px-3.5 py-1.5 rounded-lg text-xs font-bold border border-indigo-200 transition-all cursor-pointer active:scale-95"
              >
                <Heart className="w-4 h-4 text-indigo-600 fill-indigo-500" />
                <span>Pray for this Church</span>
                <span className="bg-indigo-200/80 text-indigo-900 px-1.5 py-0.5 rounded-full text-[11px]">
                  {req.prayerCount}
                </span>
              </button>

              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(req.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
