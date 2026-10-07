import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PrayerRequest, Church, ChurchThemeColor } from '../types';
import { PRESET_THEMES, getChurchTheme } from '../utils/theme';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Settings,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Save,
  Church as ChurchIcon,
  Crown,
  LogIn,
  Plus,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  UserCheck,
  Check,
  Heart,
  Archive,
  RotateCcw,
  Printer,
  HeartHandshake,
  KeyRound,
  Palette,
  MapPin,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export const StaffModerationPortal: React.FC = () => {
  const {
    currentChurch,
    churches,
    activeRole,
    isImpersonating,
    loginAsChurch,
    filteredChurchRequests,
    flaggedRequests,
    privateRequests,
    updateRequestModeration,
    updateChurchProfile,
    addNewChurch,
    togglePrayerArchived,
    togglePrintArchived,
    restoreAllWallArchives,
    restoreAllPrintArchives,
    currentUser,
    openLoginModal,
    users,
    switchAccount,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'moderation' | 'private_vault' | 'archive_vault' | 'settings' | 'super_admin'>(
    activeRole === 'super_admin' && !isImpersonating ? 'super_admin' : 'moderation'
  );

  // Editing private request note
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [archiveVaultFilter, setArchiveVaultFilter] = useState<'all' | 'wall' | 'print'>('all');

  // Editing church settings
  const [settingsForm, setSettingsForm] = useState<Church>(currentChurch);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // New Church Modal (Super Admin)
  const [showAddChurchModal, setShowAddChurchModal] = useState(false);
  const [newChurchName, setNewChurchName] = useState('');
  const [newChurchPastor, setNewChurchPastor] = useState('');
  const [newChurchEmail, setNewChurchEmail] = useState('');
  const [newChurchCity, setNewChurchCity] = useState('');
  const [newChurchState, setNewChurchState] = useState('');
  const [newChurchDenomination, setNewChurchDenomination] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateChurchProfile(currentChurch.id, settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleCreateChurch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChurchName.trim()) return;

    const slug = newChurchName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    addNewChurch({
      slug,
      name: newChurchName.trim(),
      tagline: 'Loving God, loving our community',
      denomination: newChurchDenomination || 'Non-Denominational',
      pastorName: newChurchPastor.trim() || 'Pastor',
      contactEmail: newChurchEmail.trim() || 'info@church.org',
      phone: '(555) 012-3456',
      address: '100 Main Street',
      city: newChurchCity || 'Austin',
      state: newChurchState || 'TX',
      websiteUrl: `https://${slug}.org`,
      themeColor: 'amber',
      welcomeMessage: 'Welcome to our church prayer wall. Stand with us in prayer.',
      scriptureVerse: 'Pray without ceasing. — 1 Thessalonians 5:17',
      bulletinTitle: `${newChurchName} Intercessory Prayer Sheet`,
      settings: {
        allowAnonymous: true,
        requireStaffReviewBeforePublish: false,
        autoApproveHighScores: true,
        enablePraiseUpdates: true,
        defaultPrintColumns: 2,
        defaultWallLayout: 'grid',
      },
    });

    setShowAddChurchModal(false);
    setNewChurchName('');
    setNewChurchPastor('');
    setNewChurchEmail('');
  };

  // Special Access Gate: Pastors and staff special access
  const isAuthorizedStaff =
    activeRole === 'church_staff' ||
    activeRole === 'super_admin' ||
    isImpersonating ||
    currentUser?.role === 'church_staff' ||
    currentUser?.role === 'super_admin';

  if (!isAuthorizedStaff) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="font-serif-church text-2xl font-bold text-stone-900">
            Pastoral & Staff Care Portal
          </h2>

          <p className="text-stone-600 text-sm max-w-lg mx-auto leading-relaxed">
            This module contains confidential pastoral prayer requests, community moderation queues, bulletin publication tools, and church administrative settings. Access is restricted to pastors, ordained elders, and authorized church staff.
          </p>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-700 max-w-md mx-auto text-left space-y-2">
            <div className="font-semibold text-stone-900">Special Staff Privileges:</div>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span>Confidential Prayer Vault (Staff-only pastoral counseling needs)</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Content Safety Moderation & Flag Review</span>
            </div>
            <div className="flex items-center gap-2">
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sunday Bulletin Publishing & Archiving</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openLoginModal('staff')}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Sign In with Staff Password</span>
            </button>

            <button
              onClick={() => {
                const pastor = users.find((u) => u.role === 'church_staff' && u.churchId === currentChurch.id) || users[0];
                if (pastor) switchAccount(pastor.id);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Quick Demo: Switch to Pastor David Matthews</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner / Heading */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {activeRole === 'super_admin' && !isImpersonating ? (
              <Crown className="w-5 h-5 text-amber-500" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            )}
            <h2 className="font-serif-church text-2xl font-bold text-stone-900">
              {activeRole === 'super_admin' && !isImpersonating
                ? 'Church Website Pros • Super Admin Console'
                : `${currentChurch.name} • Pastoral Care Portal`}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {activeRole === 'super_admin' && !isImpersonating
              ? 'Multi-tenant church account management, "Login As" church troubleshooting, and global network oversight.'
              : 'Review AI safety flags, minister to confidential private requests, and manage church prayer settings.'}
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1.5 text-xs bg-stone-100 p-1 rounded-xl">
          {activeRole === 'super_admin' && (
            <button
              onClick={() => setActiveSubTab('super_admin')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeSubTab === 'super_admin'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              👑 Multi-Church Overview
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('moderation')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'moderation'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>AI Moderation Queue</span>
            {flaggedRequests.length > 0 && (
              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold text-[10px]">
                {flaggedRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('private_vault')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'private_vault'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Confidential Vault</span>
            <span className="bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded-full font-bold text-[10px]">
              {privateRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('archive_vault')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'archive_vault'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive Vault</span>
            <span className="bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded-full font-bold text-[10px]">
              {filteredChurchRequests.filter((r) => r.isArchived || r.isArchivedFromPrint).length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Church Settings</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SUPER ADMIN MULTI-CHURCH ROSTER (The "Login As" feature requested by user!) */}
      {activeSubTab === 'super_admin' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-600" />
                Super Admin Privilege: Client Impersonation ("Login As")
              </span>
              <p className="text-sm text-stone-700">
                As Super Admins, you can one-click <strong>"Login As"</strong> any client church to troubleshoot what their pastors and visitors are seeing in real-time.
              </p>
            </div>

            <button
              onClick={() => setShowAddChurchModal(true)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Church Client</span>
            </button>
          </div>

          {/* Churches Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif-church font-bold text-lg text-stone-900">
                Participating Church Clients ({churches.length})
              </h3>
              <span className="text-xs text-stone-500">
                Offered free to church website clients
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-stone-50 text-stone-800 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Church Name & Location</th>
                    <th className="px-6 py-3.5">Pastor & Contact</th>
                    <th className="px-6 py-3.5">Denomination</th>
                    <th className="px-6 py-3.5">Active Requests</th>
                    <th className="px-6 py-3.5 text-right">Troubleshoot Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {churches.map((church) => {
                    const churchReqs = filteredChurchRequests.filter((r) => r.churchId === church.id);
                    const isCurrentlyActive = currentChurch.id === church.id;

                    return (
                      <tr key={church.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-stone-900 text-sm font-serif-church">
                            {church.name}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {church.city}, {church.state} • {church.websiteUrl}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-stone-800">{church.pastorName}</div>
                          <div className="text-[11px] text-stone-500">{church.contactEmail}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md font-medium text-[11px]">
                            {church.denomination}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-stone-800">
                            {churchReqs.length}
                          </span>{' '}
                          requests
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => loginAsChurch(church.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer"
                            title="Login as this church to troubleshoot their view and settings"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Login As Church</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AI MODERATION QUEUE */}
      {activeSubTab === 'moderation' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">AI Safety Protection:</strong> Submissions flagged for potential profanity, commercial solicitation, sensitive third-party medical gossip, or acute distress are placed in this queue. They will <strong>NOT</strong> appear on your church prayer wall until you approve them.
            </div>
          </div>

          {flaggedRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-serif-church text-lg font-bold text-stone-900">
                Moderation Queue is Clear
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                All incoming prayer requests have met community guidelines and are live on the prayer wall.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {flaggedRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-6 shadow-xs border border-amber-200 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        AI Safety Flagged (Score: {req.moderation.safetyScore}/100)
                      </span>
                      <span className="text-stone-500">•</span>
                      <span className="text-stone-600 font-medium">
                        Requested Category: {req.category}
                      </span>
                    </div>

                    <span className="text-stone-400">
                      Submitted on {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* AI Pastoral Reason */}
                  <div className="bg-amber-50/80 rounded-xl p-3 text-xs text-amber-950 border border-amber-200/80">
                    <span className="font-bold text-amber-900 block mb-0.5">
                      AI Moderation Assessment:
                    </span>
                    <p>{req.moderation.reason || 'Flagged for pastoral review.'}</p>
                    {req.moderation.flags?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-amber-800 font-semibold">Flags:</span>
                        {req.moderation.flags.map((flag, idx) => (
                          <span
                            key={idx}
                            className="bg-amber-200/80 text-amber-900 text-[10px] font-mono px-1.5 py-0.2 rounded"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Request Content */}
                  <div className="space-y-1">
                    <h4 className="font-serif-church text-base font-bold text-stone-900">
                      {req.title}
                    </h4>
                    <p className="text-xs text-stone-500">
                      From: <span className="font-semibold text-stone-700">{req.requesterName}</span>
                      {req.requesterEmail && ` (${req.requesterEmail})`}
                    </p>
                    <p className="text-sm text-stone-700 whitespace-pre-line bg-stone-50 p-3 rounded-xl border border-stone-200 mt-2">
                      {req.content}
                    </p>
                  </div>

                  {/* Pastor Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => updateRequestModeration(req.id, 'reject', 'Declined by pastor due to community policy.')}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-semibold border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Decline Request</span>
                    </button>

                    <button
                      onClick={() => updateRequestModeration(req.id, 'keep_private', 'Approved for confidential pastoral care team only.')}
                      className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg font-semibold border border-purple-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Keep Confidential (Staff Only)</span>
                    </button>

                    <button
                      onClick={() => updateRequestModeration(req.id, 'approve_public', 'Approved by pastor.')}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve for Church Wall</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CONFIDENTIAL PRIVATE REQUESTS VAULT */}
      {activeSubTab === 'private_vault' && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-950 flex items-start gap-3">
            <Lock className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Confidential Pastoral Vault:</strong> These prayer requests were submitted marked "Private (Pastoral Staff Only)". They are never displayed on the public prayer wall and are restricted to authorized pastoral caregivers.
            </div>
          </div>

          {privateRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
              <Lock className="w-12 h-12 text-purple-600 mx-auto" />
              <h3 className="font-serif-church text-lg font-bold text-stone-900">
                No Private Requests at This Time
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                When members choose "Private (Staff Only)" on the prayer submission form, their requests will appear securely in this vault.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {privateRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-6 shadow-xs border border-purple-200 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-purple-700" />
                        Confidential Staff Only
                      </span>
                      <span className="text-stone-500">•</span>
                      <span className="font-semibold text-stone-700">{req.category}</span>
                    </div>

                    <span className="text-stone-400">
                      Received {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-serif-church text-base font-bold text-stone-900">
                      {req.title}
                    </h4>
                    <p className="text-xs text-stone-500">
                      Requester:{' '}
                      <span className="font-bold text-stone-800">{req.requesterName}</span>
                    </p>
                    <p className="text-sm text-stone-700 whitespace-pre-line bg-stone-50 p-3 rounded-xl border border-stone-200 mt-2">
                      {req.content}
                    </p>
                  </div>

                  {/* Requester Contact Information for Follow-up */}
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex flex-wrap items-center gap-4 text-xs text-stone-700">
                    <span className="font-bold text-stone-900">Follow-up Contact:</span>
                    {req.requesterEmail ? (
                      <span className="flex items-center gap-1 text-purple-900 font-medium">
                        <Mail className="w-3.5 h-3.5 text-purple-600" />
                        {req.requesterEmail}
                      </span>
                    ) : (
                      <span className="text-stone-400 italic">No email provided</span>
                    )}

                    {req.requesterPhone && (
                      <span className="flex items-center gap-1 text-purple-900 font-medium">
                        <Phone className="w-3.5 h-3.5 text-purple-600" />
                        {req.requesterPhone}
                      </span>
                    )}
                  </div>

                  {/* Internal Staff Notes */}
                  <div className="bg-purple-50/50 rounded-xl p-3.5 border border-purple-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-purple-950">
                      <span>Internal Pastoral Care Notes:</span>
                      <button
                        onClick={() => {
                          setEditingNoteId(req.id);
                          setNoteText(req.staffNotes || '');
                        }}
                        className="text-purple-700 hover:text-purple-950 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>{req.staffNotes ? 'Edit Notes' : 'Add Care Note'}</span>
                      </button>
                    </div>

                    {editingNoteId === req.id ? (
                      <div className="space-y-2 text-xs">
                        <textarea
                          rows={2}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="e.g. Pastor David called member on Tuesday; requested follow-up prayer next week..."
                          className="w-full bg-white p-2 rounded-lg border border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              req.staffNotes = noteText;
                              setEditingNoteId(null);
                            }}
                            className="px-3 py-1 bg-purple-700 text-white rounded font-bold cursor-pointer"
                          >
                            Save Note
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-2 py-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-purple-900 italic">
                        {req.staffNotes || 'No internal notes recorded yet.'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: ARCHIVE & TESTIMONY VAULT */}
      {activeSubTab === 'archive_vault' && (
        <div className="space-y-6">
          {/* Explanation Header */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-purple-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md">
                  Pastoral Archives & Testimony Records
                </span>
                <h3 className="font-serif-church text-xl font-bold text-stone-900 mt-2">
                  {currentChurch.name} Archival Vault
                </h3>
                <p className="text-xs text-stone-600 max-w-2xl mt-1">
                  Churches need two distinct archiving tiers: one for the <strong>live public prayer wall</strong>, and one specifically for the <strong>printed Sunday bulletin</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {filteredChurchRequests.some((r) => r.isArchived) && (
                  <button
                    onClick={() => restoreAllWallArchives()}
                    className="text-xs text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                    <span>Restore All to Active Wall</span>
                  </button>
                )}

                {filteredChurchRequests.some((r) => r.isArchivedFromPrint) && (
                  <button
                    onClick={() => restoreAllPrintArchives()}
                    className="text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-stone-500" />
                    <span>Restore All to Bulletin</span>
                  </button>
                )}
              </div>
            </div>

            {/* Two Distinct Archive Tiers Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-purple-900 text-sm">
                    <Archive className="w-4 h-4 text-purple-600" />
                    <span>Prayer Wall Archive</span>
                  </div>
                  <span className="bg-purple-200/80 text-purple-950 font-mono font-bold text-xs px-2 py-0.5 rounded-md">
                    {filteredChurchRequests.filter((r) => r.isArchived).length} Archived
                  </span>
                </div>
                <p className="text-xs text-purple-900/80 leading-relaxed">
                  These prayers have been <strong>hidden from congregation view</strong> on your church's website prayer wall to keep the wall fresh and active, but are securely retained here for pastoral history.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                    <Printer className="w-4 h-4 text-stone-600" />
                    <span>Sunday Bulletin Print Archive</span>
                  </div>
                  <span className="bg-stone-200 text-stone-800 font-mono font-bold text-xs px-2 py-0.5 rounded-md">
                    {filteredChurchRequests.filter((r) => r.isArchivedFromPrint).length} Archived
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  These prayers have been rotated off the <strong>Sunday printed insert</strong> to fit on 1-2 pages, but they <strong>remain 100% active on the live website prayer wall</strong>!
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs">
              <span className="font-semibold text-stone-500">Filter Archives:</span>
              <button
                onClick={() => setArchiveVaultFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  archiveVaultFilter === 'all'
                    ? 'bg-purple-800 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Archives ({filteredChurchRequests.filter((r) => r.isArchived || r.isArchivedFromPrint).length})
              </button>
              <button
                onClick={() => setArchiveVaultFilter('wall')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  archiveVaultFilter === 'wall'
                    ? 'bg-purple-800 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Wall Archives ({filteredChurchRequests.filter((r) => r.isArchived).length})
              </button>
              <button
                onClick={() => setArchiveVaultFilter('print')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  archiveVaultFilter === 'print'
                    ? 'bg-purple-800 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Bulletin Print Archives ({filteredChurchRequests.filter((r) => r.isArchivedFromPrint).length})
              </button>
            </div>
          </div>

          {/* List of Archived Prayers */}
          {filteredChurchRequests.filter((r) => {
            if (archiveVaultFilter === 'wall') return r.isArchived;
            if (archiveVaultFilter === 'print') return r.isArchivedFromPrint;
            return r.isArchived || r.isArchivedFromPrint;
          }).length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
              <Archive className="w-12 h-12 text-stone-400 mx-auto" />
              <h4 className="font-serif-church text-lg font-bold text-stone-900">
                No Archived Prayers in this View
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                When you archive older prayers from the public wall or rotate them off the Sunday bulletin list, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChurchRequests
                .filter((r) => {
                  if (archiveVaultFilter === 'wall') return r.isArchived;
                  if (archiveVaultFilter === 'print') return r.isArchivedFromPrint;
                  return r.isArchived || r.isArchivedFromPrint;
                })
                .map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl p-4 shadow-xs border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {req.isArchived && (
                          <span className="bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                            <Archive className="w-3 h-3 text-purple-700" />
                            Wall Archived
                          </span>
                        )}
                        {req.isArchivedFromPrint && (
                          <span className="bg-stone-100 text-stone-800 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                            <Printer className="w-3 h-3 text-stone-600" />
                            Bulletin Print Archived
                          </span>
                        )}
                        <span className="text-stone-400">•</span>
                        <span className="text-stone-600 font-medium">{req.category}</span>
                        <span className="text-stone-400">•</span>
                        <span className="text-stone-500">By <strong>{req.requesterName}</strong></span>
                      </div>

                      <h4 className="font-serif-church font-bold text-stone-900 text-sm">
                        {req.title}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2">
                        {req.content}
                      </p>
                      {req.archivedReason && (
                        <p className="text-[11px] text-purple-800 italic">
                          Note: {req.archivedReason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.isArchived && (
                        <button
                          onClick={() => togglePrayerArchived(req.id)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold border border-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Restore this prayer back onto the active public prayer wall"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore to Wall</span>
                        </button>
                      )}

                      {req.isArchivedFromPrint && (
                        <button
                          onClick={() => togglePrintArchived(req.id)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold border border-stone-300 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Restore this prayer back into this Sunday's active bulletin print list"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-600" />
                          <span>Restore to Bulletin</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: CHURCH PROFILE & SETTINGS */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 shadow-xs border border-stone-200 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-serif-church font-bold text-lg text-stone-900">
                {currentChurch.name} Configuration
              </h3>
              <p className="text-xs text-stone-500">
                Customize church branding, pastor contact, scripture, and moderation policies.
              </p>
            </div>

            {settingsSaved && (
              <span className="flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <Check className="w-4 h-4" />
                Settings Saved!
              </span>
            )}
          </div>

          {/* SECTION 1: CHURCH LOGO & COLOR THEME */}
          <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#4eb8b9]" />
                <span>Church Logo & Branding</span>
              </label>
              <span className="text-[11px] text-stone-400">
                Shown in Prayer Wall header, Sunday printed bulletins, and directory
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Logo Preview */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-stone-200 flex items-center justify-center shrink-0 shadow-xs">
                {settingsForm.logoUrl ? (
                  <img
                    src={settingsForm.logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ChurchIcon className="w-10 h-10 text-stone-400" />
                )}
              </div>

              {/* Upload & URL Controls */}
              <div className="flex-1 space-y-2 w-full text-xs">
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

                  {settingsForm.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, logoUrl: '' })}
                      className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>

                <input
                  type="url"
                  value={settingsForm.logoUrl || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                  placeholder="Or enter public logo image URL (https://...)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#4eb8b9]"
                />
              </div>
            </div>

            {/* COLOR THEME SELECTOR */}
            <div className="border-t border-stone-200/80 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#c219b0]" />
                  <span>Church Color Theme</span>
                </label>
                <span className="text-[11px] text-stone-500">
                  Default: <strong className="text-[#4eb8b9]">#4eb8b9 Teal</strong> base + <strong className="text-[#c219b0]">#c219b0 Pink</strong> accent
                </span>
              </div>

              {/* Preset Palettes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {PRESET_THEMES.map((theme) => {
                  const isSelected = settingsForm.themeColor === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() =>
                        setSettingsForm({
                          ...settingsForm,
                          themeColor: theme.id as ChurchThemeColor,
                          primaryColor: theme.primary,
                          accentColor: theme.accent,
                        })
                      }
                      className={`text-left p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-stone-900 bg-white shadow-xs ring-1 ring-stone-900/20'
                          : 'border-stone-200 hover:border-stone-300 bg-white/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                          <span>{theme.name}</span>
                          {theme.tag && (
                            <span className="bg-[#4eb8b9]/20 text-[#1e6a6b] text-[9px] font-bold px-1.5 py-0.2 rounded">
                              {theme.tag}
                            </span>
                          )}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-stone-900" />}
                      </div>

                      <div className="flex items-center gap-1 mb-1">
                        <div
                          className="h-4 flex-1 rounded-sm border border-black/10"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div
                          className="h-4 w-7 rounded-sm border border-black/10"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Base Color (Primary Buttons & Headers)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingsForm.primaryColor || '#4eb8b9'}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          themeColor: 'custom',
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-8 h-8 rounded border border-stone-300 p-0.5 cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={settingsForm.primaryColor || '#4eb8b9'}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          themeColor: 'custom',
                          primaryColor: e.target.value,
                        })
                      }
                      className="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-stone-300 uppercase"
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Accent Color (Urgent Flags & Prayer Counts)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingsForm.accentColor || '#c219b0'}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          themeColor: 'custom',
                          accentColor: e.target.value,
                        })
                      }
                      className="w-8 h-8 rounded border border-stone-300 p-0.5 cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={settingsForm.accentColor || '#c219b0'}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          themeColor: 'custom',
                          accentColor: e.target.value,
                        })
                      }
                      className="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-stone-300 uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: NAME, CONTACT & ADDRESS */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#4eb8b9]" />
              <span>Church Contact & Physical Address</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Church Official Name</label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Denomination / Tagline</label>
                <input
                  type="text"
                  value={settingsForm.denomination}
                  onChange={(e) => setSettingsForm({ ...settingsForm, denomination: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Senior Pastor / Minister</label>
                <input
                  type="text"
                  value={settingsForm.pastorName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, pastorName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Pastoral Care Contact Email</label>
                <input
                  type="email"
                  value={settingsForm.contactEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Phone</label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Website URL</label>
                <input
                  type="url"
                  value={settingsForm.websiteUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, websiteUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
                />
              </div>
            </div>

            {/* Address fields */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 text-xs">
              <span className="font-bold text-stone-800 block">Physical Location:</span>
              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Street Address</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  placeholder="e.g. 4200 Oak Lawn Ave"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">City</label>
                  <input
                    type="text"
                    value={settingsForm.city}
                    onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">State</label>
                  <input
                    type="text"
                    value={settingsForm.state}
                    onChange={(e) => setSettingsForm({ ...settingsForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Zip Code</label>
                  <input
                    type="text"
                    value={settingsForm.zipCode || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, zipCode: e.target.value })}
                    placeholder="75219"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: MESSAGING & SCRIPTURE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-stone-700">Welcome Wall Message</label>
              <textarea
                rows={2}
                value={settingsForm.welcomeMessage}
                onChange={(e) => setSettingsForm({ ...settingsForm, welcomeMessage: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-stone-700">Scripture Verse Header</label>
              <input
                type="text"
                value={settingsForm.scriptureVerse}
                onChange={(e) => setSettingsForm({ ...settingsForm, scriptureVerse: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900"
              />
            </div>
          </div>

          {/* Policy Toggles */}
          <div className="border-t border-stone-100 pt-4 space-y-2.5 text-xs">
            <span className="font-bold text-stone-900 block">Moderation & Privacy Policies:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.settings.allowAnonymous}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    settings: { ...settingsForm.settings, allowAnonymous: e.target.checked },
                  })
                }
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Allow members to post prayer requests anonymously</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.settings.requireStaffReviewBeforePublish}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    settings: {
                      ...settingsForm.settings,
                      requireStaffReviewBeforePublish: e.target.checked,
                    },
                  })
                }
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Require staff manual review for ALL public requests before publishing</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.settings.enablePraiseUpdates}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    settings: {
                      ...settingsForm.settings,
                      enablePraiseUpdates: e.target.checked,
                    },
                  })
                }
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Enable "Answered Prayer / Praise" badge and celebration updates</span>
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
              style={{
                backgroundColor: settingsForm.primaryColor || '#4eb8b9',
              }}
            >
              <Save className="w-4 h-4" />
              <span>Save Church Profile & Branding</span>
            </button>
          </div>
        </form>
      )}

      {/* Modal: Add New Client Church (Super Admin) */}
      {showAddChurchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-serif-church text-lg font-bold text-stone-900">
              Provision New Church Client
            </h3>
            <p className="text-xs text-stone-500">
              Create a free prayer wall instance for your church website client.
            </p>

            <form onSubmit={handleCreateChurch} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Church Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calvary Community Church"
                  value={newChurchName}
                  onChange={(e) => setNewChurchName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Pastor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pastor John Doe"
                  value={newChurchPastor}
                  onChange={(e) => setNewChurchPastor(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Church Contact Email</label>
                <input
                  type="email"
                  placeholder="pastor@calvary.org"
                  value={newChurchEmail}
                  onChange={(e) => setNewChurchEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Austin"
                    value={newChurchCity}
                    onChange={(e) => setNewChurchCity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">State</label>
                  <input
                    type="text"
                    placeholder="TX"
                    value={newChurchState}
                    onChange={(e) => setNewChurchState(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddChurchModal(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Provision Church Wall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
