import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getChurchTheme } from '../utils/theme';
import { PhotoCropper } from './PhotoCropper';
import { DirectoryPrintSheet } from './DirectoryPrintSheet';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Printer,
  Upload,
  Crop,
  Edit2,
  Trash2,
  X,
  Check,
  Grid,
  List,
  BookOpen,
  CheckCircle2,
  EyeOff,
  UserPlus,
} from 'lucide-react';
import { DirectoryContact, DirectoryGroup, DirectoryMember } from '../types';

const GROUPS: Array<{ id: DirectoryGroup; label: string }> = [
  { id: 'Pastoral Staff', label: 'Pastoral Staff' },
  { id: 'Ministry Leadership', label: 'Leaders' },
  { id: 'Elders & Deacons', label: 'Elders & Deacons' },
  { id: 'Worship & Tech', label: 'Worship/Tech' },
  { id: 'Congregation Members', label: 'Members' },
];

const emptyContact = (name = ''): DirectoryContact => ({ name, phone: '', email: '', showPhone: true, showEmail: true });

/** A contact line as shown to the viewer; staff also see unpublished details, marked as such */
interface ShownContact {
  name: string;
  phone?: string;
  email?: string;
  phoneHidden?: boolean;
  emailHidden?: boolean;
}

const initials = (name: string) =>
  name
    .replace(/^the\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export const ChurchDirectory: React.FC = () => {
  const {
    directory,
    addDirectoryMember,
    updateDirectoryMember,
    deleteDirectoryMember,
    uploadDirectoryPhoto,
    currentChurch,
    currentChurchId,
    activeRole,
    currentUser,
    openLoginModal,
  } = useApp();
  const theme = getChurchTheme(currentChurch);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list' | 'printable'>('grid');
  const [viewingPhoto, setViewingPhoto] = useState<DirectoryMember | null>(null);

  // Add / edit form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DirectoryMember | null>(null);
  const [formName, setFormName] = useState('');
  const [formRoleTitle, setFormRoleTitle] = useState('');
  const [formGroup, setFormGroup] = useState<DirectoryGroup>('Congregation Members');
  const [formContacts, setFormContacts] = useState<DirectoryContact[]>([emptyContact()]);
  const [formAddress, setFormAddress] = useState('');
  const [formFamilyMembers, setFormFamilyMembers] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formJoinedYear, setFormJoinedYear] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Photo: the saved value, what to display, and a newly cropped photo not uploaded yet
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formPhotoSrc, setFormPhotoSrc] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<Blob | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);

  const canManageDirectory = activeRole === 'church_staff' || activeRole === 'super_admin';

  // Free object URLs made for previews
  useEffect(() => {
    return () => {
      if (formPhotoSrc.startsWith('blob:') && !directory.some((m) => m.photoSrc === formPhotoSrc)) URL.revokeObjectURL(formPhotoSrc);
    };
  }, [formPhotoSrc, directory]);

  const shownContacts = (m: DirectoryMember): ShownContact[] => {
    if (canManageDirectory && m.privateContacts) {
      return m.privateContacts.map((c) => ({
        name: c.name,
        phone: c.phone || undefined,
        email: c.email || undefined,
        phoneHidden: Boolean(c.phone) && !c.showPhone,
        emailHidden: Boolean(c.email) && !c.showEmail,
      }));
    }
    return m.contacts;
  };

  const churchMembers = directory.filter((m) => m.churchId === currentChurchId);
  const term = searchTerm.trim().toLowerCase();
  const filteredMembers = churchMembers.filter((m) => {
    const haystack = [
      m.name,
      m.roleTitle,
      m.familyMembers || '',
      ...shownContacts(m).flatMap((c) => [c.name, c.phone || '', c.email || '']),
    ]
      .join(' ')
      .toLowerCase();
    return (!term || haystack.includes(term)) && (selectedGroup === 'all' || m.group === selectedGroup);
  });

  const openForm = (member?: DirectoryMember) => {
    setFormError(null);
    setFormSuccess(null);
    setFormSaving(false);
    setPendingPhoto(null);
    setEditingMember(member || null);
    setFormName(member?.name || '');
    setFormRoleTitle(member?.roleTitle || '');
    setFormGroup(member?.group || 'Congregation Members');
    setFormContacts(
      member
        ? member.privateContacts && member.privateContacts.length > 0
          ? member.privateContacts.map((c) => ({ ...c }))
          : member.contacts.length > 0
          ? member.contacts.map((c) => ({ name: c.name, phone: c.phone || '', email: c.email || '', showPhone: true, showEmail: true }))
          : [emptyContact(member.name)]
        : [emptyContact()]
    );
    setFormAddress(member?.address || '');
    setFormFamilyMembers(member?.familyMembers || '');
    setFormBio(member?.bio || '');
    setFormJoinedYear(member?.joinedYear || (member ? '' : new Date().getFullYear().toString()));
    setFormIsPublic(member ? member.isPublicInDirectory : true);
    setFormPhotoUrl(member?.photoUrl || '');
    setFormPhotoSrc(member?.photoSrc || member?.photoUrl || '');
    setIsFormOpen(true);
  };

  const updateContact = (index: number, changes: Partial<DirectoryContact>) =>
    setFormContacts((prev) => prev.map((c, i) => (i === index ? { ...c, ...changes } : c)));

  const handlePickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please choose a photo (JPG, PNG or WebP).');
      return;
    }
    setCropSource(URL.createObjectURL(file));
  };

  const closeCropper = () => {
    if (cropSource?.startsWith('blob:') && cropSource !== formPhotoSrc) URL.revokeObjectURL(cropSource);
    setCropSource(null);
  };

  const handleCropped = (photo: Blob) => {
    setPendingPhoto(photo);
    setFormPhotoSrc(URL.createObjectURL(photo));
    closeCropper();
  };

  const removePhoto = () => {
    setPendingPhoto(null);
    setFormPhotoUrl('');
    setFormPhotoSrc('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim()) {
      setFormError('Please enter a name for this listing (a person, or a family such as "The Smith Family").');
      return;
    }
    setFormSaving(true);

    let photoUrl = formPhotoUrl;
    let photoSrc = formPhotoSrc;
    if (pendingPhoto) {
      try {
        const saved = await uploadDirectoryPhoto(pendingPhoto);
        photoUrl = saved.photoUrl;
        photoSrc = saved.photoSrc;
      } catch (err) {
        setFormSaving(false);
        setFormError(
          `The photo couldn't be saved (${err instanceof Error ? err.message : 'unknown error'}). ` +
            'If this keeps happening, the directory photo store may not be set up yet.'
        );
        return;
      }
    }

    const contacts = formContacts.filter((c) => c.name.trim() || c.phone.trim() || c.email.trim());
    const details = {
      name: formName.trim(),
      roleTitle: formRoleTitle.trim(),
      group: formGroup,
      photoUrl,
      photoSrc,
      address: formAddress.trim(),
      familyMembers: formFamilyMembers.trim(),
      bio: formBio.trim(),
      joinedYear: formJoinedYear.trim(),
      isPublicInDirectory: formIsPublic,
      privateContacts: contacts,
    };

    if (editingMember) {
      updateDirectoryMember(editingMember.id, details);
      setFormSuccess('Saved.');
    } else {
      addDirectoryMember({ churchId: currentChurchId, ...details });
      setFormSuccess('Added to the directory.');
    }
    setPendingPhoto(null);
    setTimeout(() => {
      setIsFormOpen(false);
      setEditingMember(null);
      setFormSuccess(null);
      setFormSaving(false);
    }, 500);
  };

  const handleDelete = (member: DirectoryMember) => {
    if (confirm(`Remove ${member.name} from the church directory?`)) deleteDirectoryMember(member.id);
  };

  // The database only shares the directory with approved members of this church
  const canViewDirectory =
    canManageDirectory || Boolean(currentUser?.approved && currentUser.churchId === currentChurch.id);

  if (!canViewDirectory) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto border border-blue-200">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="font-serif-church text-2xl font-bold text-stone-900">{currentChurch.name} Directory</h2>
          {!currentUser ? (
            <>
              <p className="text-stone-600 text-sm max-w-md mx-auto">
                The church directory is private to members. Sign in, or create a member account and a pastor will
                approve your access.
              </p>
              <button
                onClick={() => openLoginModal('directory')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Sign In or Join
              </button>
            </>
          ) : currentUser.churchId !== currentChurch.id ? (
            <p className="text-stone-600 text-sm max-w-md mx-auto">
              Your account belongs to a different church, so this church's directory isn't available to you.
            </p>
          ) : (
            <p className="text-stone-600 text-sm max-w-md mx-auto">
              Thanks for joining, {currentUser.name.split(' ')[0]}! A pastor or staff member needs to approve your
              account before you can see the member directory. You can still post and track prayer requests now.
            </p>
          )}
        </div>
      </div>
    );
  }

  const photoBox = (m: DirectoryMember, className: string, iconSize = 'text-2xl') =>
    m.photoSrc || (m.photoUrl && !m.photoUrl.startsWith('storage:')) ? (
      <img src={m.photoSrc || m.photoUrl} alt={m.name} className={`${className} object-contain bg-stone-100`} loading="lazy" />
    ) : (
      <div
        className={`${className} flex items-center justify-center font-serif-church font-bold text-white ${iconSize}`}
        style={{ backgroundColor: theme.primary }}
        aria-hidden="true"
      >
        {initials(m.name)}
      </div>
    );

  const contactLines = (m: DirectoryMember, compact = false) => {
    // Every adult is named under the family name, with any details they published
    const list = shownContacts(m).filter((c) => c.name || c.phone || c.email);
    const multiple = list.length > 1 || (list[0] && list[0].name && list[0].name !== m.name);
    if (list.length === 0 || (!multiple && !list[0].phone && !list[0].email)) return null;
    return (
      <div className={compact ? 'space-y-0.5' : 'space-y-1.5'}>
        {list.map((c, i) => (
          <div key={i} className="min-w-0">
            {multiple && c.name && <div className="font-semibold text-stone-800">{c.name}</div>}
            {c.phone && (
              <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900">
                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{c.phone}</span>
                {c.phoneHidden && <span className="text-[10px] font-semibold text-purple-700 flex items-center gap-0.5"><EyeOff className="w-3 h-3" />not published</span>}
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 min-w-0">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{c.email}</span>
                {c.emailHidden && <span className="text-[10px] font-semibold text-purple-700 flex items-center gap-0.5 shrink-0"><EyeOff className="w-3 h-3" />not published</span>}
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  const input =
    'w-full px-3 py-2 text-base sm:text-sm rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300';
  const label = 'block text-xs font-semibold text-stone-700 mb-1';

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
      {/* Title and staff actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="font-serif-church text-xl sm:text-2xl font-bold text-stone-900">Church Directory</h2>
          <p className="text-xs sm:text-sm text-stone-500">
            {churchMembers.length} {churchMembers.length === 1 ? 'listing' : 'listings'} · private to {currentChurch.name} members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (layoutMode === 'printable' ? window.print() : setLayoutMode('printable'))}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-sm font-semibold border border-stone-200 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{layoutMode === 'printable' ? 'Print' : 'Printable'}</span>
          </button>
          {canManageDirectory && (
            <button
              onClick={() => openForm()}
              style={theme.btnPrimaryStyle}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add a Church Member
            </button>
          )}
        </div>
      </div>

      {/* Search, groups, layout */}
      <div className="space-y-2.5 no-print">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search names, phone, email"
              className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl text-base sm:text-sm border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300"
              aria-label="Search the directory"
            />
          </div>
          <div className="inline-flex bg-stone-100 p-0.5 rounded-xl shrink-0" role="radiogroup" aria-label="Directory layout">
            {[
              { id: 'grid' as const, icon: <Grid className="w-4 h-4" />, label: 'Photo cards' },
              { id: 'list' as const, icon: <List className="w-4 h-4" />, label: 'List' },
              { id: 'printable' as const, icon: <BookOpen className="w-4 h-4" />, label: 'Printable' },
            ].map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={layoutMode === o.id}
                onClick={() => setLayoutMode(o.id)}
                className={`p-2 rounded-lg cursor-pointer ${layoutMode === o.id ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
                title={o.label}
              >
                {o.icon}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          {[{ id: 'all', label: 'All' }, ...GROUPS].map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer border ${
                selectedGroup === g.id ? 'text-white border-transparent' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
              style={selectedGroup === g.id ? { backgroundColor: theme.primary } : undefined}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {filteredMembers.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 text-sm text-stone-500 no-print">
          {churchMembers.length === 0 ? 'No one is in the directory yet.' : 'No listings match your search.'}
        </div>
      )}

      {/* Photo cards */}
      {layoutMode === 'grid' && filteredMembers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
              <button
                type="button"
                onClick={() => setViewingPhoto(m)}
                className="block w-full aspect-[4/3] cursor-zoom-in"
                aria-label={`View ${m.name}'s photo`}
              >
                {photoBox(m, 'w-full h-full', 'text-5xl')}
              </button>
              <div className="p-4 space-y-2.5 text-sm flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-serif-church font-bold text-lg text-stone-900 leading-tight">{m.name}</h3>
                    {m.roleTitle && <p className="text-xs font-semibold" style={{ color: theme.primary }}>{m.roleTitle}</p>}
                  </div>
                  {canManageDirectory && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openForm(m)} className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer" title="Edit" aria-label={`Edit ${m.name}`}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(m)} className="p-1.5 text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer" title="Remove" aria-label={`Remove ${m.name}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs">{contactLines(m)}</div>
                {m.familyMembers && <p className="text-xs text-stone-600"><span className="font-semibold text-stone-700">Children:</span> {m.familyMembers}</p>}
                {m.address && (
                  <p className="flex items-start gap-1.5 text-xs text-stone-500">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span>{m.address}</span>
                  </p>
                )}
                {m.bio && <p className="text-xs text-stone-500 italic">{m.bio}</p>}
              </div>
              {(m.joinedYear || !m.isPublicInDirectory) && (
                <div className="px-4 py-2 border-t border-stone-100 text-[11px] text-stone-400 flex justify-between">
                  <span>{m.joinedYear ? `Member since ${m.joinedYear}` : ''}</span>
                  {!m.isPublicInDirectory && <span className="text-purple-700 font-semibold">Hidden from members</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {layoutMode === 'list' && filteredMembers.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs divide-y divide-stone-100">
          {filteredMembers.map((m) => (
            <div key={m.id} className="flex items-start gap-3 p-3 sm:p-4">
              <button type="button" onClick={() => setViewingPhoto(m)} className="shrink-0 w-20 sm:w-24 aspect-[4/3] rounded-lg overflow-hidden cursor-zoom-in" aria-label={`View ${m.name}'s photo`}>
                {photoBox(m, 'w-full h-full')}
              </button>
              <div className="flex-1 min-w-0 text-xs space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-stone-900">{m.name}</div>
                    {m.roleTitle && <div className="text-stone-500">{m.roleTitle}</div>}
                  </div>
                  {canManageDirectory && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openForm(m)} className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer" aria-label={`Edit ${m.name}`}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(m)} className="p-1.5 text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer" aria-label={`Remove ${m.name}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {contactLines(m, true)}
                {m.familyMembers && <div className="text-stone-600"><span className="font-semibold text-stone-700">Children:</span> {m.familyMembers}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable photo directory */}
      {layoutMode === 'printable' && filteredMembers.length > 0 && (
        <DirectoryPrintSheet church={currentChurch} members={filteredMembers} />
      )}

      {/* Full-size photo */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 flex items-center justify-center p-3 sm:p-8 no-print" onClick={() => setViewingPhoto(null)} role="dialog" aria-modal="true" aria-label={viewingPhoto.name}>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white mb-2">
              <span className="font-serif-church text-lg font-bold">{viewingPhoto.name}</span>
              <button onClick={() => setViewingPhoto(null)} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer" aria-label="Close">
                <X className="w-6 h-6" />
              </button>
            </div>
            {viewingPhoto.photoSrc || (viewingPhoto.photoUrl && !viewingPhoto.photoUrl.startsWith('storage:')) ? (
              <img src={viewingPhoto.photoSrc || viewingPhoto.photoUrl} alt={viewingPhoto.name} className="w-full max-h-[80vh] object-contain rounded-lg" />
            ) : (
              <div className="aspect-[4/3] rounded-lg flex items-center justify-center text-white text-7xl font-serif-church font-bold" style={{ backgroundColor: theme.primary }}>
                {initials(viewingPhoto.name)}
              </div>
            )}
            {viewingPhoto.familyMembers && <p className="text-stone-200 text-sm mt-2">{viewingPhoto.familyMembers}</p>}
          </div>
        </div>
      )}

      {/* Add / edit listing */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-0 sm:p-4 no-print">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 shrink-0">
              <h3 className="font-serif-church font-bold text-lg text-stone-900">{editingMember ? 'Edit Listing' : 'Add to the Directory'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto">
              {formError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl">{formError}</div>}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {formSuccess}
                </div>
              )}

              {/* Photo */}
              <div className="space-y-2">
                <span className={label}>Photo</span>
                <div className="flex items-start gap-3">
                  <div className="w-40 aspect-[4/3] rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0 flex items-center justify-center">
                    {formPhotoSrc ? (
                      <img src={formPhotoSrc} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs text-stone-400">No photo</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold cursor-pointer w-fit">
                      <Upload className="w-4 h-4" />
                      {formPhotoSrc ? 'Choose a different photo' : 'Choose a photo'}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={handlePickPhoto} className="hidden" />
                    </label>
                    {formPhotoSrc && (
                      <button type="button" onClick={() => setCropSource(formPhotoSrc)} className="flex items-center gap-1.5 px-3 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-sm font-semibold cursor-pointer w-fit">
                        <Crop className="w-4 h-4" />
                        Adjust crop
                      </button>
                    )}
                    {formPhotoSrc && (
                      <button type="button" onClick={removePhoto} className="text-xs text-stone-500 hover:text-rose-700 underline underline-offset-2 w-fit cursor-pointer">
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">Wide family photos work best. You can crop and zoom before saving.</p>
              </div>

              {/* Listing name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="dir-name">Family or person name *</label>
                  <input id="dir-name" className={input} value={formName} onChange={(e) => setFormName(e.target.value)} placeholder='e.g. "The Keens" or "Mary Smith"' />
                  <p className="text-[11px] text-stone-500 mt-1">Shown at the top. Each adult's name appears below it.</p>
                </div>
                <div>
                  <label className={label} htmlFor="dir-role">Role or title (optional)</label>
                  <input id="dir-role" className={input} value={formRoleTitle} onChange={(e) => setFormRoleTitle(e.target.value)} placeholder="e.g. Deacon, Youth Minister" />
                </div>
                <div>
                  <label className={label} htmlFor="dir-group">Group</label>
                  <select id="dir-group" className={input} value={formGroup} onChange={(e) => setFormGroup(e.target.value as DirectoryGroup)}>
                    {GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>{g.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* People and contact info */}
              <div className="space-y-2">
                <div>
                  <span className={label}>Adults & contact info</span>
                  <p className="text-[11px] text-stone-500">
                    Each adult can have their own phone and email. Untick "Publish" to keep a detail for staff only.
                  </p>
                </div>
                {formContacts.map((c, i) => (
                  <div key={i} className="rounded-xl border border-stone-200 p-3 space-y-2 bg-stone-50/60">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-stone-500">Adult {i + 1}</div>
                    <div className="flex items-center gap-2">
                      <input
                        className={input}
                        value={c.name}
                        onChange={(e) => updateContact(i, { name: e.target.value })}
                        placeholder={i === 0 ? 'Name (e.g. John Keen)' : 'Name (e.g. Mary Keen)'}
                        aria-label={`Person ${i + 1} name`}
                      />
                      {formContacts.length > 1 && (
                        <button type="button" onClick={() => setFormContacts((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-stone-400 hover:text-rose-700 cursor-pointer shrink-0" aria-label={`Remove person ${i + 1}`}>
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <input className={input} type="tel" value={c.phone} onChange={(e) => updateContact(i, { phone: e.target.value })} placeholder="Phone" aria-label={`Person ${i + 1} phone`} />
                      <label className="flex items-center gap-1.5 text-xs font-medium text-stone-700 cursor-pointer whitespace-nowrap">
                        <input type="checkbox" checked={c.showPhone} onChange={(e) => updateContact(i, { showPhone: e.target.checked })} />
                        Publish phone
                      </label>
                      <input className={input} type="email" value={c.email} onChange={(e) => updateContact(i, { email: e.target.value })} placeholder="Email" aria-label={`Person ${i + 1} email`} />
                      <label className="flex items-center gap-1.5 text-xs font-medium text-stone-700 cursor-pointer whitespace-nowrap">
                        <input type="checkbox" checked={c.showEmail} onChange={(e) => updateContact(i, { showEmail: e.target.checked })} />
                        Publish email
                      </label>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setFormContacts((prev) => [...prev, emptyContact()])} className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 hover:text-stone-900 cursor-pointer">
                  <UserPlus className="w-4 h-4" />
                  {formContacts.length === 1 ? 'Add a second adult' : 'Add another adult'}
                </button>
              </div>

              <div>
                <label className={label} htmlFor="dir-family">Children (optional)</label>
                <input id="dir-family" className={input} value={formFamilyMembers} onChange={(e) => setFormFamilyMembers(e.target.value)} placeholder="e.g. Emma (10), Jake (7)" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                <div>
                  <label className={label} htmlFor="dir-address">Address (optional)</label>
                  <input id="dir-address" className={input} value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="dir-year">Member since</label>
                  <input id="dir-year" className={input} value={formJoinedYear} onChange={(e) => setFormJoinedYear(e.target.value)} placeholder="e.g. 2019" />
                </div>
              </div>

              <div>
                <label className={label} htmlFor="dir-bio">Note (optional)</label>
                <textarea id="dir-bio" rows={2} className={input} value={formBio} onChange={(e) => setFormBio(e.target.value)} placeholder="e.g. Serves on the hospitality team" />
              </div>

              <label className="flex items-start gap-2 text-sm text-stone-700 cursor-pointer">
                <input type="checkbox" className="mt-1" checked={formIsPublic} onChange={(e) => setFormIsPublic(e.target.checked)} />
                <span>
                  <span className="font-semibold">Show this listing to members</span>
                  <span className="block text-xs text-stone-500">Untick to keep the whole listing visible to staff only.</span>
                </span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={formSaving} style={theme.btnPrimaryStyle} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60">
                  <Check className="w-4 h-4" />
                  {formSaving ? 'Saving...' : editingMember ? 'Save' : 'Add to Directory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cropSource && <PhotoCropper imageSrc={cropSource} onCancel={closeCropper} onSave={handleCropped} />}
    </div>
  );
};
