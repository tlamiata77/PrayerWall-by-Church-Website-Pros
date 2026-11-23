import { createClient } from '@supabase/supabase-js';
import { Church, DirectoryContact, DirectoryMember, DirectoryGroup, PrayerRequest, PublishedContact, UserAccount } from '../types';

// The publishable key is designed to be public: every visitor's browser receives it,
// and Row Level Security in supabase/migrations decides what each person may read or change.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jkkbgazlcjsnzevvkomn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_DzZa8Bg7DuTraOICuPv3XA_8BFuhU-m';

// Read before createClient: the client removes the reset link's details from the address bar
export const openedFromPasswordReset =
  typeof window !== 'undefined' &&
  (/type=recovery/.test(window.location.hash) || new URLSearchParams(window.location.search).get('reset') === '1');

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const orUndefined = <T,>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);

// ---------- churches ----------

export const churchFromRow = (r: Row): Church => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  logoUrl: orUndefined(r.logo_url),
  tagline: r.tagline,
  denomination: r.denomination,
  pastorName: r.pastor_name,
  contactEmail: r.contact_email,
  phone: r.phone,
  address: r.address,
  city: r.city,
  state: r.state,
  zipCode: orUndefined(r.zip_code),
  websiteUrl: r.website_url,
  themeColor: r.theme_color,
  primaryColor: orUndefined(r.primary_color),
  accentColor: orUndefined(r.accent_color),
  welcomeMessage: r.welcome_message,
  scriptureVerse: r.scripture_verse,
  bulletinTitle: orUndefined(r.bulletin_title),
  settings: r.settings,
});

const CHURCH_COLUMNS: Record<string, string> = {
  id: 'id',
  slug: 'slug',
  name: 'name',
  logoUrl: 'logo_url',
  tagline: 'tagline',
  denomination: 'denomination',
  pastorName: 'pastor_name',
  contactEmail: 'contact_email',
  phone: 'phone',
  address: 'address',
  city: 'city',
  state: 'state',
  zipCode: 'zip_code',
  websiteUrl: 'website_url',
  themeColor: 'theme_color',
  primaryColor: 'primary_color',
  accentColor: 'accent_color',
  welcomeMessage: 'welcome_message',
  scriptureVerse: 'scripture_verse',
  bulletinTitle: 'bulletin_title',
  settings: 'settings',
};

export const churchToRow = (c: Partial<Church>): Row => {
  const row: Row = {};
  for (const [key, col] of Object.entries(CHURCH_COLUMNS)) {
    if (key in c) row[col] = (c as Row)[key] ?? null;
  }
  return row;
};

// ---------- prayer requests ----------

const REQUEST_COLUMNS: Record<string, string> = {
  id: 'id',
  churchId: 'church_id',
  userId: 'user_id',
  title: 'title',
  content: 'content',
  requesterName: 'requester_name',
  isAnonymous: 'is_anonymous',
  visibility: 'visibility',
  category: 'category',
  isUrgent: 'is_urgent',
  isAnswered: 'is_answered',
  answeredUpdate: 'answered_update',
  prayerCount: 'prayer_count',
  status: 'status',
  moderation: 'moderation',
  bulletinSummary: 'bulletin_summary',
  isArchived: 'is_archived',
  archivedAt: 'archived_at',
  archivedReason: 'archived_reason',
  isArchivedFromPrint: 'is_archived_from_print',
  archivedFromPrintAt: 'archived_from_print_at',
  recentEncouragements: 'recent_encouragements',
  lastResubmittedAt: 'last_resubmitted_at',
  resubmittedTimes: 'resubmitted_times',
  createdAt: 'created_at',
};

// Fields stored in prayer_request_private (staff and the requester only)
const PRIVATE_COLUMNS: Record<string, string> = {
  requesterEmail: 'requester_email',
  requesterPhone: 'requester_phone',
  staffNotes: 'staff_notes',
};

export const requestFromRow = (r: Row, priv?: Row, churchesById?: Map<string, Church>): PrayerRequest => {
  const church = churchesById?.get(r.church_id);
  const out: Row = { churchName: church?.name, churchSlug: church?.slug };
  for (const [key, col] of Object.entries(REQUEST_COLUMNS)) out[key] = orUndefined(r[col]);
  if (priv) {
    for (const [key, col] of Object.entries(PRIVATE_COLUMNS)) out[key] = orUndefined(priv[col]);
  }
  out.moderation = out.moderation || { safetyScore: 95, flags: [] };
  if (!out.moderation.flags) out.moderation.flags = [];
  out.recentEncouragements = out.recentEncouragements || [];
  return out as PrayerRequest;
};

/** Splits a (partial) request into its public row and its private contact/notes row. */
export const requestToRows = (req: Partial<PrayerRequest>): { row: Row; priv: Row } => {
  const row: Row = {};
  const priv: Row = {};
  for (const [key, col] of Object.entries(REQUEST_COLUMNS)) {
    if (key in req) row[col] = (req as Row)[key] ?? null;
  }
  for (const [key, col] of Object.entries(PRIVATE_COLUMNS)) {
    if (key in req) priv[col] = (req as Row)[key] ?? null;
  }
  return { row, priv };
};

// ---------- profiles ----------

export const profileFromRow = (r: Row): UserAccount & { approved: boolean } => ({
  id: r.id,
  email: r.email,
  name: r.name,
  role: r.role,
  churchId: r.church_id || '',
  approved: Boolean(r.approved),
  title: orUndefined(r.title),
  phone: orUndefined(r.phone),
  avatarUrl: orUndefined(r.avatar_url),
  createdAt: r.created_at,
});

// ---------- directory ----------

export const STORAGE_PHOTO_PREFIX = 'storage:';
export const DIRECTORY_PHOTO_BUCKET = 'directory-photos';

/** The published part of each contact: what every approved member may see */
export const publishedContacts = (contacts: DirectoryContact[]): PublishedContact[] =>
  contacts
    .filter((c) => c.name.trim() || c.phone.trim() || c.email.trim())
    .map((c) => {
      const out: PublishedContact = { name: c.name.trim() };
      if (c.showPhone && c.phone.trim()) out.phone = c.phone.trim();
      if (c.showEmail && c.email.trim()) out.email = c.email.trim();
      return out;
    });

const toPublishedContacts = (value: unknown): PublishedContact[] =>
  Array.isArray(value)
    ? value
        .filter((c): c is Row => Boolean(c) && typeof c === 'object')
        .map((c) => ({
          name: String(c.name ?? ''),
          ...(c.phone ? { phone: String(c.phone) } : {}),
          ...(c.email ? { email: String(c.email) } : {}),
        }))
    : [];

const toDirectoryContacts = (value: unknown): DirectoryContact[] =>
  Array.isArray(value)
    ? value
        .filter((c): c is Row => Boolean(c) && typeof c === 'object')
        .map((c) => ({
          name: String(c.name ?? ''),
          phone: String(c.phone ?? ''),
          email: String(c.email ?? ''),
          showPhone: Boolean(c.showPhone),
          showEmail: Boolean(c.showEmail),
        }))
    : [];

export const directoryFromRow = (r: Row, priv?: Row): DirectoryMember => ({
  id: r.id,
  churchId: r.church_id,
  name: r.name,
  roleTitle: r.role_title,
  group: r.group_name as DirectoryGroup,
  contacts: toPublishedContacts(r.contacts),
  privateContacts: priv ? toDirectoryContacts(priv.contacts) : undefined,
  photoUrl: r.photo_url,
  address: orUndefined(r.address),
  bio: orUndefined(r.bio),
  familyMembers: orUndefined(r.family_members),
  joinedYear: orUndefined(r.joined_year),
  isPublicInDirectory: r.is_public_in_directory,
  createdAt: r.created_at,
});

const DIRECTORY_COLUMNS: Record<string, string> = {
  id: 'id',
  churchId: 'church_id',
  name: 'name',
  roleTitle: 'role_title',
  group: 'group_name',
  contacts: 'contacts',
  photoUrl: 'photo_url',
  address: 'address',
  bio: 'bio',
  familyMembers: 'family_members',
  joinedYear: 'joined_year',
  isPublicInDirectory: 'is_public_in_directory',
  createdAt: 'created_at',
};

export const directoryToRow = (m: Partial<DirectoryMember>): Row => {
  const row: Row = {};
  for (const [key, col] of Object.entries(DIRECTORY_COLUMNS)) {
    if (key in m) row[col] = (m as Row)[key] ?? null;
  }
  if (row.contacts === null) row.contacts = [];
  return row;
};

/** The staff-only row holding every contact with its publish choices */
export const directoryPrivateRow = (memberId: string, churchId: string, contacts: DirectoryContact[]): Row => ({
  member_id: memberId,
  church_id: churchId,
  contacts: contacts
    .filter((c) => c.name.trim() || c.phone.trim() || c.email.trim())
    .map((c) => ({
      name: c.name.trim(),
      phone: c.phone.trim(),
      email: c.email.trim(),
      showPhone: c.showPhone,
      showEmail: c.showEmail,
    })),
});

export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().replace(/-/g, '')}`;
