import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PrayerWall } from './PrayerWall';
import {
  Code,
  Copy,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  Sparkles,
  Layers,
  Palette,
  CheckCircle2,
  Globe
} from 'lucide-react';

export const WebsiteEmbedCenter: React.FC = () => {
  const { currentChurch } = useApp();
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [embedMode, setEmbedMode] = useState<'full' | 'wall_only' | 'button_only'>('full');
  const [copied, setCopied] = useState(false);

  const embedUrl = `${window.location.origin}/embed/${currentChurch.slug}?mode=${embedMode}&theme=${currentChurch.themeColor}`;
  const iframeSnippet = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="780"\n  frameborder="0"\n  style="border: none; border-radius: 16px; width: 100%; min-height: 780px;"\n  title="${currentChurch.name} Community Prayer Wall"\n></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const deviceWidths = {
    desktop: 'w-full',
    tablet: 'max-w-[768px] mx-auto',
    mobile: 'max-w-[390px] mx-auto',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-600" />
            <h2 className="font-serif-church text-2xl font-bold text-stone-900">
              Website Embed Center for {currentChurch.name}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Offer free, mobile-responsive prayer walls to your church website clients. Copy-paste one line of code into WordPress, Squarespace, or Wix.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Code Copied!' : 'Copy Iframe Embed Code'}</span>
          </button>
        </div>
      </div>

      {/* Embed Settings & Code Snippet Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Embed Customizer */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4 text-xs">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-amber-600" />
            Embed Configuration
          </h3>

          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700 block">Widget Display Mode</label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 p-2 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50">
                <input
                  type="radio"
                  name="embedMode"
                  checked={embedMode === 'full'}
                  onChange={() => setEmbedMode('full')}
                  className="text-purple-600"
                />
                <div>
                  <span className="font-bold text-stone-800 block">Full Prayer Wall + Submit CTA</span>
                  <span className="text-[11px] text-stone-500">Includes church header, prayer cards, and submission modal.</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50">
                <input
                  type="radio"
                  name="embedMode"
                  checked={embedMode === 'wall_only'}
                  onChange={() => setEmbedMode('wall_only')}
                  className="text-purple-600"
                />
                <div>
                  <span className="font-bold text-stone-800 block">Prayer Wall Only</span>
                  <span className="text-[11px] text-stone-500">Displays active requests with prayer counter.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-stone-100">
            <span className="font-semibold text-stone-700 block">Quick CMS Instructions:</span>
            <ul className="space-y-1.5 text-stone-600 text-[11px]">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>WordPress:</strong> Add a "Custom HTML" block on your Prayer page and paste the snippet.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Squarespace:</strong> Add a "Code" block and paste the embed snippet.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Wix / Webflow:</strong> Use the "Embed HTML / iframe" element.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Code Block */}
        <div className="lg:col-span-2 bg-stone-900 text-stone-200 rounded-2xl p-5 shadow-xs border border-stone-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 font-mono text-[11px] flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-purple-400" />
                HTML Iframe Snippet (Mobile-Responsive)
              </span>
              <button
                onClick={handleCopy}
                className="text-purple-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <pre className="bg-stone-950 p-3.5 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto border border-stone-800 leading-relaxed">
              {iframeSnippet}
            </pre>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3 text-xs text-stone-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Tenant Endpoint: <code className="text-amber-300 font-mono text-[11px]">{currentChurch.slug}</code>
              </span>
            </div>
            <span className="text-emerald-400 text-[11px] font-bold">100% Free for Clients</span>
          </div>
        </div>
      </div>

      {/* Responsive Preview Simulator Toolbar */}
      <div className="bg-stone-800 text-stone-200 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Monitor className="w-4 h-4 text-amber-400" />
          <span>Simulated Client Website Preview</span>
          <span className="text-stone-500">•</span>
          <span className="text-stone-400 font-normal">Test responsive behavior across screen sizes:</span>
        </div>

        <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-lg border border-stone-700 text-xs">
          <button
            onClick={() => setDeviceView('desktop')}
            className={`flex items-center gap-1 px-3 py-1 rounded transition-colors cursor-pointer ${
              deviceView === 'desktop' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          <button
            onClick={() => setDeviceView('tablet')}
            className={`flex items-center gap-1 px-3 py-1 rounded transition-colors cursor-pointer ${
              deviceView === 'tablet' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet (768px)</span>
          </button>

          <button
            onClick={() => setDeviceView('mobile')}
            className={`flex items-center gap-1 px-3 py-1 rounded transition-colors cursor-pointer ${
              deviceView === 'mobile' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (390px)</span>
          </button>
        </div>
      </div>

      {/* Simulated External Website Browser Frame */}
      <div className="bg-stone-300/40 p-4 sm:p-8 rounded-3xl">
        <div className={`transition-all duration-300 ${deviceWidths[deviceView]}`}>
          {/* Simulated Browser Bar */}
          <div className="bg-stone-800 rounded-t-2xl p-2.5 px-4 flex items-center justify-between text-xs text-stone-400 border-b border-stone-700">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            </div>

            <div className="bg-stone-900 px-4 py-1 rounded-md text-[11px] font-mono text-stone-300 truncate max-w-xs">
              {currentChurch.websiteUrl}/prayer
            </div>

            <span className="text-[10px] text-stone-500 font-mono">
              {deviceView === 'desktop' ? '1280px' : deviceView === 'tablet' ? '768px' : '390px'}
            </span>
          </div>

          {/* Simulated Church Website Body */}
          <div className="bg-white rounded-b-2xl shadow-2xl overflow-hidden border border-stone-300 border-t-0">
            {/* Simulated Church Website Header */}
            <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
              <div className="font-serif-church font-bold text-base tracking-wide">
                {currentChurch.name}
              </div>
              <div className="hidden sm:flex items-center gap-5 text-xs text-stone-300">
                <span>About</span>
                <span>Sermons</span>
                <span className="font-bold text-amber-400 underline underline-offset-4">
                  Prayer Wall
                </span>
                <span>Events</span>
                <span>Give</span>
              </div>
            </div>

            {/* Embedded GraceWall Area */}
            <div className="bg-stone-50/70 p-2 sm:p-4">
              <div className="bg-amber-100/60 text-amber-900 text-[11px] font-medium p-2 text-center border-b border-amber-200/80 mb-2 rounded-t-xl">
                🔌 GraceWall Embedded Widget Container (<code className="text-amber-950 font-bold">{currentChurch.name}</code>)
              </div>
              
              <PrayerWall forceSingleColumn={deviceView === 'mobile'} />
            </div>

            {/* Simulated Church Website Footer */}
            <div className="bg-stone-900 text-stone-400 p-6 text-center text-xs border-t border-stone-800">
              <p className="font-serif-church text-stone-200 font-bold">{currentChurch.name}</p>
              <p className="text-[11px] text-stone-500 mt-1">
                {currentChurch.address} • {currentChurch.phone} • {currentChurch.contactEmail}
              </p>
              <p className="text-[10px] text-stone-600 mt-3">
                Powered by GraceWall from ChurchWebsitePros.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
