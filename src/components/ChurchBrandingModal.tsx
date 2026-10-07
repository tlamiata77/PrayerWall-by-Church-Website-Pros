import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Church, ChurchThemeColor } from '../types';
import { PRESET_THEMES, getChurchTheme } from '../utils/theme';
import {
  X,
  Upload,
  Image as ImageIcon,
  Palette,
  MapPin,
  Mail,
  Phone,
  Globe,
  Church as ChurchIcon,
  Check,
  Sparkles,
  Heart,
  Save,
  RotateCcw
} from 'lucide-react';

interface ChurchBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChurchBrandingModal: React.FC<ChurchBrandingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentChurch, updateChurchProfile } = useApp();

  const [formData, setFormData] = useState<Church>(() => ({
    ...currentChurch,
    themeColor: currentChurch.themeColor || 'teal_pink',
    primaryColor: currentChurch.primaryColor || '#4eb8b9',
    accentColor: currentChurch.accentColor || '#c219b0',
    zipCode: currentChurch.zipCode || '75219',
  }));

  const [activeTab, setActiveTab] = useState<'branding' | 'contact_address' | 'messaging'>('branding');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTheme = getChurchTheme(formData);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemePresetSelect = (presetId: string) => {
    const preset = PRESET_THEMES.find((p) => p.id === presetId);
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        themeColor: preset.id as ChurchThemeColor,
        primaryColor: preset.primary,
        accentColor: preset.accent,
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateChurchProfile(currentChurch.id, formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const PRESET_LOGOS = [
    { label: 'Golden Cross & Light', url: 'https://images.unsplash.com/photo-1548625361-16eb10f8450f?auto=format&fit=crop&w=240&h=240&q=80' },
    { label: 'Cathedral Archway', url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=240&h=240&q=80' },
    { label: 'Rustic Mountain Chapel', url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=240&h=240&q=80' },
    { label: 'Stained Glass Sanctuary', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=240&h=240&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div
          className="p-6 text-white flex items-start justify-between relative overflow-hidden transition-colors"
          style={{
            background: `linear-gradient(135deg, ${formData.primaryColor || '#4eb8b9'} 0%, ${formData.accentColor || '#c219b0'} 100%)`,
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-white/30">
                Church Settings
              </span>
              <span className="text-white/70 text-xs">•</span>
              <span className="text-white/90 text-xs font-medium">{formData.name}</span>
            </div>
            <h2 className="text-2xl font-bold font-serif-church text-white">
              Church Branding & Contact Settings
            </h2>
            <p className="text-xs text-white/90 mt-1 max-w-md">
              Configure your church logo, address, pastoral contact info, and custom color theme.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-black/20 transition-colors cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Palette className="w-4 h-4 text-[#4eb8b9]" />
            <span>Logo & Color Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact_address')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'contact_address'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-stone-600" />
            <span>Address & Contact Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('messaging')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'messaging'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ChurchIcon className="w-4 h-4 text-stone-600" />
            <span>Header Verse & Welcome Text</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Church profile, branding, and color theme saved successfully!</span>
            </div>
          )}

          {/* TAB 1: LOGO & COLOR THEME */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              {/* Church Logo Section */}
              <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#4eb8b9]" />
                    <span>Church Logo</span>
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Appears in Prayer Wall header, Sunday bulletins, and directory
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Logo Preview */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-stone-200 flex items-center justify-center shrink-0 shadow-xs">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Church Logo Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ChurchIcon className="w-10 h-10 text-stone-400" />
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-2 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo from Computer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoUrl: '' })}
                          className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={formData.logoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        placeholder="Or enter public logo image URL (https://...)"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                      />
                    </div>

                    {/* Preset Church Logos */}
                    <div>
                      <span className="text-[10px] font-semibold text-stone-500 block mb-1">
                        Or select sample church logo emblem:
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {PRESET_LOGOS.map((pl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormData({ ...formData, logoUrl: pl.url })}
                            className={`w-9 h-9 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                              formData.logoUrl === pl.url
                                ? 'border-[#4eb8b9] ring-2 ring-[#4eb8b9]/40'
                                : 'border-stone-300 hover:border-stone-400'
                            }`}
                            title={pl.label}
                          >
                            <img src={pl.url} alt={pl.label} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#c219b0]" />
                      <span>Church Color Theme</span>
                    </label>
                    <span className="text-[11px] text-stone-500">
                      Default: <strong className="text-[#4eb8b9]">#4eb8b9 Teal</strong> base + <strong className="text-[#c219b0]">#c219b0 Pink</strong> accent
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Pick a curated church palette or use the custom hex pickers below.
                  </p>
                </div>

                {/* Preset Palettes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PRESET_THEMES.map((theme) => {
                    const isSelected = formData.themeColor === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleThemePresetSelect(theme.id)}
                        className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-stone-900 bg-stone-50/80 shadow-xs ring-1 ring-stone-900/20'
                            : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/40 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{theme.name}</span>
                            {theme.tag && (
                              <span className="bg-[#4eb8b9]/20 text-[#1e6a6b] text-[9px] font-bold px-1.5 py-0.2 rounded">
                                {theme.tag}
                              </span>
                            )}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-stone-900" />}
                        </div>

                        {/* Dual Swatch Display */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div
                            className="h-5 flex-1 rounded-md shadow-2xs border border-black/10"
                            style={{ backgroundColor: theme.primary }}
                            title={`Base Color: ${theme.primary}`}
                          />
                          <div
                            className="h-5 w-8 rounded-md shadow-2xs border border-black/10"
                            style={{ backgroundColor: theme.accent }}
                            title={`Accent Color: ${theme.accent}`}
                          />
                        </div>

                        <span className="text-[10px] text-stone-500 line-clamp-1">
                          {theme.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Hex Color Pickers */}
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">
                      Fine-Tune Exact Colors (Hex Pickers)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          themeColor: 'teal_pink',
                          primaryColor: '#4eb8b9',
                          accentColor: '#c219b0',
                        }));
                      }}
                      className="text-[11px] text-[#4eb8b9] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Default Teal (#4eb8b9) & Pink (#c219b0)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Primary / Base Color */}
                    <div className="space-y-1.5 bg-white p-3 rounded-lg border border-stone-200">
                      <label className="block text-xs font-semibold text-stone-700">
                        Base / Primary Color (Buttons, headers, highlights)
                      </label>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          value={formData.primaryColor || '#4eb8b9'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              themeColor: 'custom',
                              primaryColor: e.target.value,
                            })
                          }
                          className="w-9 h-9 rounded-lg border border-stone-300 p-0.5 cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          value={formData.primaryColor || '#4eb8b9'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              themeColor: 'custom',
                              primaryColor: e.target.value,
                            })
                          }
                          placeholder="#4eb8b9"
                          className="flex-1 px-3 py-1.5 text-xs font-mono rounded-md border border-stone-300 uppercase focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                        />
                      </div>
                      <span className="text-[10px] text-stone-400">Default: #4eb8b9</span>
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-1.5 bg-white p-3 rounded-lg border border-stone-200">
                      <label className="block text-xs font-semibold text-stone-700">
                        Accent Color (Urgent flags, prayer heart, badges)
                      </label>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          value={formData.accentColor || '#c219b0'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              themeColor: 'custom',
                              accentColor: e.target.value,
                            })
                          }
                          className="w-9 h-9 rounded-lg border border-stone-300 p-0.5 cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          value={formData.accentColor || '#c219b0'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              themeColor: 'custom',
                              accentColor: e.target.value,
                            })
                          }
                          placeholder="#c219b0"
                          className="flex-1 px-3 py-1.5 text-xs font-mono rounded-md border border-stone-300 uppercase focus:outline-none focus:ring-2 focus:ring-[#c219b0]"
                        />
                      </div>
                      <span className="text-[10px] text-stone-400">Default: #c219b0</span>
                    </div>
                  </div>
                </div>

                {/* Real-Time Live UI Preview Box */}
                <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600">
                    <span>Live Theme Preview:</span>
                    <span className="font-mono text-[10px] text-stone-400">
                      Base: {formData.primaryColor || '#4eb8b9'} • Accent: {formData.accentColor || '#c219b0'}
                    </span>
                  </div>

                  <div
                    className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3"
                    style={{
                      background: `linear-gradient(135deg, ${(formData.primaryColor || '#4eb8b9')}15 0%, ${(formData.accentColor || '#c219b0')}10 100%)`,
                      borderColor: `${(formData.primaryColor || '#4eb8b9')}40`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo Preview"
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: formData.primaryColor || '#4eb8b9' }}
                        >
                          <ChurchIcon className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <div className="font-serif-church font-bold text-sm text-stone-900">
                          {formData.name}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {formData.city}, {formData.state} • {formData.pastorName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border"
                        style={{
                          backgroundColor: `${(formData.accentColor || '#c219b0')}20`,
                          color: formData.accentColor || '#c219b0',
                          borderColor: `${(formData.accentColor || '#c219b0')}40`,
                        }}
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>42 Prayers</span>
                      </span>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs cursor-default"
                        style={{ backgroundColor: formData.primaryColor || '#4eb8b9' }}
                      >
                        Submit Prayer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESS & CONTACT INFO */}
          {activeTab === 'contact_address' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Church Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Church Official Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>

                {/* Denomination / Tagline */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Denomination / Tagline</label>
                  <input
                    type="text"
                    value={formData.denomination}
                    onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>

                {/* Senior Pastor Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Senior Pastor / Minister</label>
                  <input
                    type="text"
                    value={formData.pastorName}
                    onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>

                {/* Contact Email */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Pastoral Care & Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>

                {/* Website */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Church Website URL</label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>
              </div>

              {/* Physical Address Section */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 text-xs">
                <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#4eb8b9]" />
                  <span>Physical Church Address (for Directory & Sunday Bulletin Header)</span>
                </span>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Street Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 4200 Oak Lawn Ave"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Dallas"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="TX"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700">Zip Code</label>
                    <input
                      type="text"
                      value={formData.zipCode || ''}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="75219"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HEADER VERSE & WELCOME TEXT */}
          {activeTab === 'messaging' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Welcome Wall Message</label>
                <textarea
                  rows={3}
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  placeholder="Welcome message displayed on the congregation prayer wall..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Scripture Verse Header</label>
                <input
                  type="text"
                  value={formData.scriptureVerse}
                  onChange={(e) => setFormData({ ...formData, scriptureVerse: e.target.value })}
                  placeholder="e.g. Do not be anxious about anything... — Philippians 4:6"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Sunday Bulletin Printed Sheet Title</label>
                <input
                  type="text"
                  value={formData.bulletinTitle || ''}
                  onChange={(e) => setFormData({ ...formData, bulletinTitle: e.target.value })}
                  placeholder="e.g. Sunday Intercessory Prayer List"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                />
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              style={{
                backgroundColor: formData.primaryColor || '#4eb8b9',
              }}
            >
              <Save className="w-4 h-4" />
              <span>Save Church Profile & Theme</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
