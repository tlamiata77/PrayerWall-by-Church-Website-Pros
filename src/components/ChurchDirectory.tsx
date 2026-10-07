import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Heart,
  Printer,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Edit2,
  Trash2,
  X,
  Check,
  ShieldCheck,
  Crown,
  User,
  Filter,
  Grid,
  List,
  BookOpen,
  Share2,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { DirectoryGroup, DirectoryMember } from '../types';

export const ChurchDirectory: React.FC = () => {
  const {
    directory,
    addDirectoryMember,
    updateDirectoryMember,
    deleteDirectoryMember,
    currentChurch,
    currentChurchId,
    activeRole,
    currentUser,
    setSubmitModalOpen,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list' | 'printable'>('grid');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DirectoryMember | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRoleTitle, setFormRoleTitle] = useState('Congregation Member');
  const [formGroup, setFormGroup] = useState<DirectoryGroup>('Congregation Members');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formFamilyMembers, setFormFamilyMembers] = useState('');
  const [formJoinedYear, setFormJoinedYear] = useState('2024');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Quick Preset Sample Photos for fast loading
  const PRESET_PHOTOS = [
    { label: 'Pastor / Male Adult 1', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80' },
    { label: 'Female Leader 1', url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&h=400&q=80' },
    { label: 'Senior Adult / Elder', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80' },
    { label: 'Young Adult / Worship', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80' },
    { label: 'Female Member', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80' },
    { label: 'Senior Couple', url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=400&h=400&q=80' },
    { label: 'Ministry Leader 2', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80' },
    { label: 'Children/Youth Director', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80' },
  ];

  // Filter members for current church
  const churchMembers = directory.filter((m) => m.churchId === currentChurchId);

  const filteredMembers = churchMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      (m.familyMembers && m.familyMembers.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGroup = selectedGroup === 'all' || m.group === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  const handleOpenAddModal = (memberToEdit?: DirectoryMember) => {
    setFormError(null);
    setFormSuccess(null);
    if (memberToEdit) {
      setEditingMember(memberToEdit);
      setFormName(memberToEdit.name);
      setFormRoleTitle(memberToEdit.roleTitle);
      setFormGroup(memberToEdit.group);
      setFormEmail(memberToEdit.email);
      setFormPhone(memberToEdit.phone);
      setFormPhotoUrl(memberToEdit.photoUrl);
      setFormAddress(memberToEdit.address || '');
      setFormBio(memberToEdit.bio || '');
      setFormFamilyMembers(memberToEdit.familyMembers || '');
      setFormJoinedYear(memberToEdit.joinedYear || '2024');
      setFormIsPublic(memberToEdit.isPublicInDirectory);
    } else {
      setEditingMember(null);
      setFormName('');
      setFormRoleTitle('Congregation Member');
      setFormGroup('Congregation Members');
      setFormEmail('');
      setFormPhone('');
      setFormPhotoUrl(PRESET_PHOTOS[4].url);
      setFormAddress(currentChurch.city ? `${currentChurch.city}, ${currentChurch.state}` : '');
      setFormBio('');
      setFormFamilyMembers('');
      setFormJoinedYear(new Date().getFullYear().toString());
      setFormIsPublic(true);
    }
    setIsAddModalOpen(true);
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Member name is required.');
      return;
    }

    const photoToUse =
      formPhotoUrl.trim() ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80';

    if (editingMember) {
      updateDirectoryMember(editingMember.id, {
        name: formName.trim(),
        roleTitle: formRoleTitle.trim(),
        group: formGroup,
        email: formEmail.trim(),
        phone: formPhone.trim(),
        photoUrl: photoToUse,
        address: formAddress.trim(),
        bio: formBio.trim(),
        familyMembers: formFamilyMembers.trim(),
        joinedYear: formJoinedYear.trim(),
        isPublicInDirectory: formIsPublic,
      });
      setFormSuccess('Member updated successfully!');
    } else {
      addDirectoryMember({
        churchId: currentChurchId,
        name: formName.trim(),
        roleTitle: formRoleTitle.trim(),
        group: formGroup,
        email: formEmail.trim(),
        phone: formPhone.trim(),
        photoUrl: photoToUse,
        address: formAddress.trim(),
        bio: formBio.trim(),
        familyMembers: formFamilyMembers.trim(),
        joinedYear: formJoinedYear.trim(),
        isPublicInDirectory: formIsPublic,
      });
      setFormSuccess('New member added to church directory!');
    }

    setTimeout(() => {
      setIsAddModalOpen(false);
      setEditingMember(null);
      setFormSuccess(null);
    }, 600);
  };

  const handleDelete = (member: DirectoryMember) => {
    if (confirm(`Are you sure you want to remove ${member.name} from the church directory?`)) {
      deleteDirectoryMember(member.id);
    }
  };

  const canManageDirectory =
    activeRole === 'church_staff' ||
    activeRole === 'super_admin' ||
    currentUser?.role === 'church_staff' ||
    currentUser?.role === 'super_admin';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              Church Directory Module
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-xs text-stone-500 font-medium">{currentChurch.name}</span>
          </div>

          <h2 className="text-2xl font-bold font-serif-church text-stone-900 tracking-tight">
            Congregation & Pastoral Directory
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            View photos, names, ministry roles, and contact information for pastors, staff, ministry leaders, and congregation families.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Printable Layout Trigger */}
          <button
            onClick={() => {
              if (layoutMode === 'printable') {
                window.print();
              } else {
                setLayoutMode('printable');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold border border-stone-300 transition-all cursor-pointer"
            title="Print a clean Sunday directory booklet"
          >
            <Printer className="w-4 h-4 text-stone-600" />
            <span>{layoutMode === 'printable' ? 'Print Directory Now' : 'Printable Booklet'}</span>
          </button>

          {/* Add Member Button */}
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member / Load Photo</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Group Filters & Layout Toggle */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, role, email, phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
          />
        </div>

        {/* Group Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'Pastoral Staff', label: 'Pastoral Staff' },
            { id: 'Ministry Leadership', label: 'Leaders' },
            { id: 'Elders & Deacons', label: 'Elders & Deacons' },
            { id: 'Worship & Tech', label: 'Worship/Tech' },
            { id: 'Congregation Members', label: 'Members' },
          ].map((grp) => (
            <button
              key={grp.id}
              onClick={() => setSelectedGroup(grp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedGroup === grp.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {grp.label}
            </button>
          ))}
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 shrink-0">
          <button
            onClick={() => setLayoutMode('grid')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              layoutMode === 'grid'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Card Grid with Large Portraits"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayoutMode('list')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              layoutMode === 'list'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Compact Roster List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayoutMode('printable')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              layoutMode === 'printable'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Printable Church Directory Booklet"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Directory Count Info */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-1 no-print">
        <span>
          Showing <strong>{filteredMembers.length}</strong> of <strong>{churchMembers.length}</strong> church members
        </span>
        <span className="text-[11px] text-stone-400">
          Tip: Click any photo to inspect, or click "Load Photo" to upload personal portraits from your computer.
        </span>
      </div>

      {/* Printable Booklet Header (Only visible in printable mode or print preview) */}
      {layoutMode === 'printable' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-300 shadow-xs mb-4 printable-area">
          <div className="border-b-2 border-stone-900 pb-4 mb-4 text-center">
            <h1 className="font-serif-church text-3xl font-bold text-stone-900">
              {currentChurch.name} • Church Directory
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              {currentChurch.address} • {currentChurch.city}, {currentChurch.state} • {currentChurch.phone}
            </p>
            <p className="text-xs italic text-stone-500 mt-1">
              "We are members one of another." — Ephesians 4:25
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((m) => (
              <div
                key={m.id}
                className="p-3 border border-stone-200 rounded-xl flex items-start gap-3 page-break-inside-avoid"
              >
                <img
                  src={m.photoUrl}
                  alt={m.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-300"
                />
                <div className="min-w-0 text-xs space-y-0.5">
                  <h4 className="font-bold text-stone-900 text-sm truncate">{m.name}</h4>
                  <p className="text-amber-800 font-semibold text-[11px]">{m.roleTitle}</p>
                  <p className="text-stone-600">{m.phone}</p>
                  <p className="text-stone-500 truncate">{m.email}</p>
                  {m.familyMembers && (
                    <p className="text-[10px] text-stone-400 italic mt-0.5">
                      {m.familyMembers}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-stone-200 text-center text-xs text-stone-400 no-print flex items-center justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Directory on Paper</span>
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
            >
              Back to Interactive View
            </button>
          </div>
        </div>
      )}

      {/* Grid Mode */}
      {layoutMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-stone-200 hover:border-amber-300/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Photo & Role Header */}
                <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
                  <img
                    src={m.photoUrl}
                    alt={m.name}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-black/20 pointer-events-none" />

                  {/* Group Tag */}
                  <span className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/20">
                    {m.group}
                  </span>

                  {/* Edit/Delete Actions for staff */}
                  {canManageDirectory && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenAddModal(m)}
                        className="p-1.5 bg-white/90 hover:bg-white text-stone-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                        title="Edit Member"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                        title="Delete Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Name overlay at bottom of photo */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h3 className="font-serif-church font-bold text-lg leading-tight drop-shadow-sm">
                      {m.name}
                    </h3>
                    <p className="text-amber-300 text-xs font-semibold drop-shadow-xs">
                      {m.roleTitle}
                    </p>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-2.5 text-xs">
                  {/* Bio or Scripture */}
                  {m.bio && (
                    <p className="text-stone-600 line-clamp-2 italic leading-relaxed text-[11px]">
                      "{m.bio}"
                    </p>
                  )}

                  {/* Family Members */}
                  {m.familyMembers && (
                    <div className="p-2 bg-stone-50 rounded-lg border border-stone-100 text-[11px] text-stone-600">
                      <span className="font-semibold text-stone-700">Family:</span> {m.familyMembers}
                    </div>
                  )}

                  {/* Contact Details */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    <a
                      href={`mailto:${m.email}`}
                      className="flex items-center gap-2 text-stone-600 hover:text-amber-700 transition-colors truncate"
                      title={m.email}
                    >
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{m.email}</span>
                    </a>

                    <a
                      href={`tel:${m.phone}`}
                      className="flex items-center gap-2 text-stone-600 hover:text-amber-700 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{m.phone}</span>
                    </a>

                    {m.address && (
                      <div className="flex items-center gap-2 text-stone-500 truncate">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{m.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Joined date & Prayer Lift CTA */}
              <div className="p-3 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between text-[11px]">
                <span className="text-stone-400">
                  {m.joinedYear ? `Member since ${m.joinedYear}` : 'Church Family'}
                </span>

                <button
                  onClick={() => setSubmitModalOpen(true)}
                  className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title={`Submit a prayer request for ${m.name}`}
                >
                  <Heart className="w-3 h-3 text-amber-600" />
                  <span>Pray for Member</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List Mode */}
      {layoutMode === 'list' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 border-collapse">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Member / Photo</th>
                  <th className="py-3 px-4">Ministry Role</th>
                  <th className="py-3 px-4">Group</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Family Note</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.photoUrl}
                          alt={m.name}
                          className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-stone-900">{m.name}</div>
                          {m.joinedYear && (
                            <span className="text-[10px] text-stone-400">Since {m.joinedYear}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">{m.roleTitle}</td>
                    <td className="py-3 px-4">
                      <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-stone-200">
                        {m.group}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      <a href={`mailto:${m.email}`} className="hover:underline">
                        {m.email}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{m.phone}</td>
                    <td className="py-3 px-4 text-stone-500 text-[11px] max-w-xs truncate">
                      {m.familyMembers || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canManageDirectory && (
                          <>
                            <button
                              onClick={() => handleOpenAddModal(m)}
                              className="p-1 text-stone-500 hover:text-amber-700 hover:bg-stone-100 rounded"
                              title="Edit Member"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              className="p-1 text-stone-500 hover:text-rose-700 hover:bg-stone-100 rounded"
                              title="Delete Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Member with Photo Loader */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-serif-church font-bold text-lg text-white">
                    {editingMember ? 'Edit Directory Member' : 'Add Member to Church Directory'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Load photos, roles, contact info, and family details for {currentChurch.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMember} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Photo Upload Section */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <label className="block text-xs font-bold text-stone-800">
                  Member Portrait Photo (Load Photo or Select Preset)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview */}
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-200 border-2 border-amber-400 shrink-0 shadow-xs">
                    <img
                      src={
                        formPhotoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80'
                      }
                      alt="Portrait Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    {/* Device File Upload Button */}
                    <div>
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer w-fit transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo from Computer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-stone-400 block mt-1">
                        PNG, JPG, WebP supported directly from your files.
                      </span>
                    </div>

                    {/* Or URL input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={formPhotoUrl}
                        onChange={(e) => setFormPhotoUrl(e.target.value)}
                        placeholder="Or paste public photo URL"
                        className="w-full px-2.5 py-1 text-xs rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Fast Picker */}
                <div>
                  <span className="text-[10px] font-semibold text-stone-500 block mb-1">
                    Or Pick 1-Click Portrait Preset:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {PRESET_PHOTOS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormPhotoUrl(p.url)}
                        className={`w-9 h-9 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          formPhotoUrl === p.url
                            ? 'border-amber-600 ring-2 ring-amber-400'
                            : 'border-stone-300 hover:border-stone-400'
                        }`}
                        title={p.label}
                      >
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name & Ministry Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Deacon Robert Hayes"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Role / Ministry Title
                  </label>
                  <input
                    type="text"
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    placeholder="e.g. Youth Minister, Deacon, Member"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Ministry Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Directory Group
                  </label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as DirectoryGroup)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="Pastoral Staff">Pastoral Staff</option>
                    <option value="Ministry Leadership">Ministry Leadership</option>
                    <option value="Elders & Deacons">Elders & Deacons</option>
                    <option value="Worship & Tech">Worship & Tech</option>
                    <option value="Congregation Members">Congregation Members</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Member Since (Year)
                  </label>
                  <input
                    type="text"
                    value={formJoinedYear}
                    onChange={(e) => setFormJoinedYear(e.target.value)}
                    placeholder="e.g. 2021"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="member@church.org"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Street Address or City
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. 1204 Elm St, Dallas, TX"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Family Members Note */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Family Members Note
                </label>
                <input
                  type="text"
                  value={formFamilyMembers}
                  onChange={(e) => setFormFamilyMembers(e.target.value)}
                  placeholder="e.g. Spouse: Rachel • Children: Caleb (10), Lily (6)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Short Bio or Ministry Involvement
                </label>
                <textarea
                  rows={2}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="e.g. Serving on the hospitality committee and small group leader."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingMember ? 'Update Member' : 'Save to Directory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
