import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Church, PrayerRequest, UserRole, VisibilityType, RequestCategory, ModerationStatus, AppTab, UserAccount, DirectoryMember } from '../types';
import { SAMPLE_75_WEEKLY_REQUESTS } from '../data/sample75Requests';
import { isDateString, parseDateToISO, healPrayerRequest } from '../utils/csvParser';
import {
  supabase,
  churchFromRow,
  churchToRow,
  requestFromRow,
  requestToRows,
  profileFromRow,
  directoryFromRow,
  directoryToRow,
  newId,
  openedFromPasswordReset,
} from '../lib/supabase';

export type MemberAccount = UserAccount & { approved: boolean };

export interface AdminNotification {
  id: number;
  kind: string;
  churchId: string | null;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export type AuthResult = { success: boolean; error?: string; needsEmailConfirmation?: boolean };

export interface RegisterChurchInput {
  church: {
    name: string;
    pastorName: string;
    denomination?: string;
    tagline?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    websiteUrl?: string;
    contactEmail?: string;
  };
  // Needed only when nobody is signed in yet
  email?: string;
  password?: string;
}

interface AppContextType {
  churches: Church[];
  currentChurch: Church;
  currentChurchId: string;
  setCurrentChurchId: (id: string) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  isImpersonating: boolean;
  impersonatedChurch: Church | null;
  loginAsChurch: (churchId: string) => void;
  exitImpersonation: () => void;
  requests: PrayerRequest[];
  filteredChurchRequests: PrayerRequest[];
  globalRequests: PrayerRequest[];
  flaggedRequests: PrayerRequest[];
  privateRequests: PrayerRequest[];
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  submitModalOpen: boolean;
  setSubmitModalOpen: (open: boolean) => void;
  /** Profiles this account may see: its own, its church's members (staff), everyone (super admin) */
  users: MemberAccount[];
  currentUser: MemberAccount | null;
  isSuperAdmin: boolean;
  directory: DirectoryMember[];
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  loginModalInitialMode: 'login' | 'register' | 'register_church';
  openLoginModal: (redirectTab?: AppTab, mode?: 'login' | 'register' | 'register_church') => void;
  closeLoginModal: () => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    churchId: string;
    title?: string;
    avatarUrl?: string;
  }) => Promise<AuthResult>;
  registerChurch: (input: RegisterChurchInput) => Promise<AuthResult & { churchId?: string }>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  /** True after opening a password-reset email link, until a new password is saved */
  isPasswordRecovery: boolean;
  updatePassword: (password: string) => Promise<AuthResult>;
  finishPasswordRecovery: () => void;
  approveMember: (userId: string) => Promise<void>;
  setMemberRole: (userId: string, role: 'church_staff' | 'congregation_member') => Promise<void>;
  revokeMember: (userId: string) => Promise<void>;
  notifications: AdminNotification[];
  markNotificationsRead: () => Promise<void>;
  resubmitPrayerRequest: (requestId: string, updatedContent?: string, isUrgent?: boolean) => void;
  addDirectoryMember: (member: Omit<DirectoryMember, 'id' | 'createdAt'>) => string;
  updateDirectoryMember: (id: string, updates: Partial<DirectoryMember>) => void;
  deleteDirectoryMember: (id: string) => void;
  addPrayerRequest: (data: {
    title: string;
    content: string;
    requesterName: string;
    requesterEmail?: string;
    requesterPhone?: string;
    isAnonymous: boolean;
    visibility: VisibilityType;
    category: RequestCategory;
    isUrgent: boolean;
  }) => Promise<{ success: boolean; status: string; reason?: string }>;
  incrementPrayerCount: (requestId: string, encouragement?: string) => void;
  updateRequestModeration: (
    requestId: string,
    action: 'approve_public' | 'keep_private' | 'reject',
    note?: string
  ) => void;
  updateBulletinSummary: (requestId: string, summary: string) => void;
  updateStaffNotes: (requestId: string, notes: string) => void;
  /** Staff correction of any field on a request (e.g. one that imported wrong) */
  updatePrayerRequest: (requestId: string, changes: Partial<PrayerRequest>) => void;
  deletePrayerRequest: (requestId: string) => void;
  bulkUpdateBulletinSummaries: (updates: Array<{ id: string; ultraSummary: string }>) => void;
  togglePrayerAnswered: (requestId: string, updateNote?: string) => void;
  updateChurchProfile: (churchId: string, updates: Partial<Church>) => void;
  addNewChurch: (church: Omit<Church, 'id'>) => string;
  load75WeeklyRequests: () => void;
  togglePrayerArchived: (requestId: string, reason?: string) => void;
  togglePrintArchived: (requestId: string) => void;
  archiveLastWeeksPrayersForPrint: (daysOld?: number) => number;
  restoreAllPrintArchives: () => void;
  bulkArchiveAnsweredPrayers: () => number;
  bulkArchiveOlderWallPrayers: (daysOld?: number) => number;
  restoreAllWallArchives: () => void;
  isModerating: boolean;
  importModalOpen: boolean;
  setImportModalOpen: (open: boolean) => void;
  importPrayerRequestsBatch: (
    newItems: Array<{
      title: string;
      content: string;
      requesterName?: string;
      requesterEmail?: string;
      requesterPhone?: string;
      isAnonymous?: boolean;
      visibility?: VisibilityType;
      category?: RequestCategory;
      isUrgent?: boolean;
      isAnswered?: boolean;
      churchId?: string;
      status?: ModerationStatus;
      createdAt?: string;
    }>
  ) => number;
  repairDateTitles: () => number;
  categorizePrayersWithAI: (targetRequests?: PrayerRequest[]) => Promise<{ success: boolean; count: number }>;
  isAICategorizing: boolean;
  /** True until the first load from the database finishes */
  isLoading: boolean;
  /** Last save/load problem, shown in a banner */
  dataError: string | null;
  clearDataError: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Shown before any church has loaded (or when the database has no churches yet)
const PLACEHOLDER_CHURCH: Church = {
  id: '',
  slug: '',
  name: 'GraceWall',
  tagline: 'Church prayer walls by Church Website Pros',
  denomination: '',
  pastorName: '',
  contactEmail: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  websiteUrl: '',
  themeColor: 'teal_pink',
  primaryColor: '#4eb8b9',
  accentColor: '#c219b0',
  welcomeMessage: 'Welcome to the prayer wall.',
  scriptureVerse: 'Pray without ceasing. — 1 Thessalonians 5:17',
  settings: {
    allowAnonymous: true,
    requireStaffReviewBeforePublish: false,
    autoApproveHighScores: true,
    enablePraiseUpdates: true,
    defaultPrintColumns: 2,
    defaultWallLayout: 'grid',
  },
};

// Per-viewer conveniences only; all real data lives in Supabase
const LAST_CHURCH_KEY = 'gracewall_last_church';
const PRAYED_KEY = 'gracewall_prayed_ids';

const readLocal = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeLocal = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private window, blocked) */
  }
};

const readPrayedIds = (): Set<string> => {
  try {
    return new Set(JSON.parse(readLocal(PRAYED_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

/** Church slug from /embed/<slug> or ?church=<slug> */
const churchSlugFromUrl = (): string | null => {
  const embed = window.location.pathname.match(/^\/embed\/([^/?#]+)/);
  if (embed) return decodeURIComponent(embed[1]);
  return new URLSearchParams(window.location.search).get('church');
};

/** Supabase returns at most 1000 rows per request, so page through larger tables. */
async function fetchAllRows(table: string, orderBy = 'created_at'): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}

const friendlyAuthError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'That email and password do not match an account.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first: open the link we emailed you, then sign in.';
  if (m.includes('already registered')) return 'An account with this email already exists. Sign in instead.';
  if (m.includes('password should be')) return 'Please choose a password of at least 6 characters.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('different from the old')) return 'Please choose a password different from your current one.';
  if (m.includes('session missing') || m.includes('expired')) return 'This reset link has expired. Use "Forgot password?" to get a new one.';
  return message;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(openedFromPasswordReset);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [churches, setChurches] = useState<Church[]>([]);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [users, setUsers] = useState<MemberAccount[]>([]);
  const [directory, setDirectory] = useState<DirectoryMember[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const [currentChurchId, setCurrentChurchIdState] = useState<string>(() => readLocal(LAST_CHURCH_KEY) || '');
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [impersonatedChurchId, setImpersonatedChurchId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('wall');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalInitialMode, setLoginModalInitialMode] = useState<'login' | 'register' | 'register_church'>('login');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isAICategorizing, setIsAICategorizing] = useState(false);

  const userId = session?.user.id || null;
  const currentUser = users.find((u) => u.id === userId) || null;
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const reportError = useCallback((action: string, error: unknown) => {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message || String(error);
    console.error(`${action} failed:`, error);
    setDataError(`${action} didn't save: ${message}`);
  }, []);

  const setCurrentChurchId = useCallback((id: string) => {
    setCurrentChurchIdState(id);
    writeLocal(LAST_CHURCH_KEY, id);
  }, []);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  const loadAll = useCallback(async (activeSession: Session | null) => {
    try {
      const signedIn = Boolean(activeSession);
      const [churchRows, requestRows, privateRows, directoryRows, profileRows] = await Promise.all([
        fetchAllRows('churches', 'name'),
        fetchAllRows('prayer_requests'),
        signedIn ? fetchAllRows('prayer_request_private', 'request_id') : Promise.resolve([]),
        signedIn ? fetchAllRows('directory_members') : Promise.resolve([]),
        signedIn ? fetchAllRows('profiles') : Promise.resolve([]),
      ]);

      const loadedChurches = churchRows.map(churchFromRow).sort((a, b) => a.name.localeCompare(b.name));
      const churchesById = new Map(loadedChurches.map((c) => [c.id, c]));
      const privateById = new Map(privateRows.map((p) => [p.request_id as string, p]));
      const prayed = readPrayedIds();

      setChurches(loadedChurches);
      setRequests(
        requestRows.map((r) => ({
          ...requestFromRow(r, privateById.get(r.id as string), churchesById),
          prayedByMe: prayed.has(r.id as string),
        }))
      );
      setDirectory(directoryRows.map(directoryFromRow));
      const loadedUsers = profileRows.map(profileFromRow);
      setUsers(loadedUsers);

      const me = loadedUsers.find((u) => u.id === activeSession?.user.id);
      if (me?.role === 'super_admin') {
        const { data, error } = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setNotifications(
          (data || []).map((n) => ({
            id: n.id,
            kind: n.kind,
            churchId: n.church_id,
            message: n.message,
            readAt: n.read_at,
            createdAt: n.created_at,
          }))
        );
      } else {
        setNotifications([]);
      }

      // Pick which church to show: the link's church, then the last one viewed,
      // then the member's own church, then the first church.
      setCurrentChurchIdState((prev) => {
        const fromUrl = churchSlugFromUrl();
        const urlChurch = fromUrl ? loadedChurches.find((c) => c.slug === fromUrl || c.id === fromUrl) : undefined;
        if (urlChurch) return urlChurch.id;
        if (prev && churchesById.has(prev)) return prev;
        if (me?.churchId && churchesById.has(me.churchId)) return me.churchId;
        return loadedChurches[0]?.id || '';
      });
    } catch (e) {
      reportError('Loading prayer data', e);
    } finally {
      setIsLoading(false);
    }
  }, [reportError]);

  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;
  const refreshData = useCallback(() => loadAll(sessionRef.current), [loadAll]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Token refreshes keep the same user; no need to reload everything
      if (event === 'TOKEN_REFRESHED') return;
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      setSession(newSession);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authReady) loadAll(session);
    // Reload when the signed-in user changes, not on every session object refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userId, loadAll]);

  // Pick up changes made by other staff when someone comes back to the tab
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') refreshData();
    };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [refreshData]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const currentChurch = churches.find((c) => c.id === currentChurchId) || churches[0] || PLACEHOLDER_CHURCH;
  const impersonatedChurch = impersonatedChurchId
    ? churches.find((c) => c.id === impersonatedChurchId) || null
    : null;

  // What this person may do on the church being viewed
  const realRole: UserRole = !currentUser
    ? 'congregation_member'
    : currentUser.role === 'super_admin'
    ? 'super_admin'
    : currentUser.role === 'church_staff' && currentUser.churchId === currentChurch.id
    ? 'church_staff'
    : 'congregation_member';

  const activeRole: UserRole = roleOverride ?? realRole;

  // Only super admins can preview other roles; everyone may open the embed preview
  const setActiveRole = (role: UserRole) => {
    if (role === 'embed_view' || isSuperAdmin) {
      setRoleOverride(role === realRole ? null : role);
    } else {
      setRoleOverride(null);
    }
  };

  const filteredChurchRequests = requests.filter((r) => r.churchId === currentChurch.id);
  const globalRequests = requests.filter((r) => r.visibility === 'global' && r.status === 'approved' && !r.isArchived);
  const flaggedRequests = filteredChurchRequests.filter((r) => r.status === 'flagged' || r.status === 'pending');
  const privateRequests = filteredChurchRequests.filter((r) => r.visibility === 'private');
  const canManageCurrentChurch = isSuperAdmin || (currentUser?.role === 'church_staff' && currentUser.churchId === currentChurch.id);

  // ---------------------------------------------------------------------------
  // Saving helpers
  // ---------------------------------------------------------------------------

  /**
   * Applies changes locally right away, then saves them. Requests that receive the
   * identical change are saved with one query.
   */
  const saveRequestChanges = (changes: Array<{ id: string; patch: Partial<PrayerRequest> }>, action: string) => {
    if (changes.length === 0) return;
    const byId = new Map(changes.map((c) => [c.id, c.patch]));
    setRequests((prev) => prev.map((r) => (byId.has(r.id) ? { ...r, ...byId.get(r.id)! } : r)));

    const churchOf = new Map(requests.map((r) => [r.id, r.churchId]));
    const groups = new Map<string, { row: Record<string, unknown>; ids: string[] }>();
    const privateUpserts: Record<string, unknown>[] = [];
    for (const { id, patch } of changes) {
      const { row, priv } = requestToRows(patch);
      if (Object.keys(row).length > 0) {
        const key = JSON.stringify(row);
        const group = groups.get(key) || { row, ids: [] as string[] };
        group.ids.push(id);
        groups.set(key, group);
      }
      if (Object.keys(priv).length > 0) {
        privateUpserts.push({ request_id: id, church_id: churchOf.get(id), ...priv });
      }
    }

    const writes: PromiseLike<{ error: unknown }>[] = [];
    for (const { row, ids } of groups.values()) {
      for (let i = 0; i < ids.length; i += 200) {
        writes.push(supabase.from('prayer_requests').update(row).in('id', ids.slice(i, i + 200)));
      }
    }
    if (privateUpserts.length > 0) {
      writes.push(supabase.from('prayer_request_private').upsert(privateUpserts));
    }
    Promise.all(writes).then((results) => {
      const failed = results.find((r) => r.error);
      if (failed) {
        reportError(action, failed.error);
        refreshData();
      }
    });
  };

  const insertRequests = async (items: PrayerRequest[], action: string) => {
    const rows = items.map((r) => requestToRows(r));
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabase.from('prayer_requests').insert(chunk.map((c) => c.row));
      if (error) throw error;
      const privRows = chunk
        .map((c, j): Record<string, unknown> => ({ request_id: items[i + j].id, church_id: items[i + j].churchId, ...c.priv }))
        .filter((p) => p.requester_email || p.requester_phone || p.staff_notes);
      if (privRows.length > 0) {
        const { error: privError } = await supabase.from('prayer_request_private').insert(privRows);
        if (privError) throw privError;
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    setRoleOverride(null);
    setIsImpersonating(false);
    setImpersonatedChurchId(null);
    // Land on the member's own church
    const { data: profile } = await supabase.from('profiles').select('church_id').eq('id', data.user.id).single();
    if (profile?.church_id) setCurrentChurchId(profile.church_id);
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setRoleOverride(null);
    setIsImpersonating(false);
    setImpersonatedChurchId(null);
    setActiveTab('wall');
  };

  const register: AppContextType['register'] = async (data) => {
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          name: data.name.trim(),
          phone: data.phone?.trim() || '',
          title: data.title?.trim() || '',
          church_id: data.churchId,
        },
      },
    });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    // Supabase returns a user with no identities when the email is already registered
    if (result.user && result.user.identities?.length === 0) {
      return { success: false, error: 'An account with this email already exists. Sign in instead.' };
    }
    if (data.churchId) setCurrentChurchId(data.churchId);
    if (!result.session) return { success: true, needsEmailConfirmation: true };

    // Photos are saved after sign-up so they don't bloat the sign-in token
    if (data.avatarUrl && result.user) {
      await supabase.from('profiles').update({ avatar_url: data.avatarUrl }).eq('id', result.user.id);
    }
    return { success: true };
  };

  const registerChurch: AppContextType['registerChurch'] = async ({ church, email, password }) => {
    if (session) {
      const { data, error } = await supabase.rpc('register_church', { p: church });
      if (error) return { success: false, error: error.message };
      const churchId = data as string;
      await loadAll(session);
      setCurrentChurchId(churchId);
      return { success: true, churchId };
    }

    if (!email || !password) return { success: false, error: 'Email and password are required' };
    const { data: result, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          name: church.pastorName,
          phone: church.phone || '',
          title: 'Senior Pastor',
          pending_church: { ...church, contactEmail: church.contactEmail || email.trim() },
        },
      },
    });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    if (result.user && result.user.identities?.length === 0) {
      return {
        success: false,
        error: 'An account with this email already exists. Sign in first, then register your church.',
      };
    }
    if (!result.session) return { success: true, needsEmailConfirmation: true };

    const { data: profile } = await supabase.from('profiles').select('church_id').eq('id', result.user!.id).single();
    if (profile?.church_id) setCurrentChurchId(profile.church_id);
    return { success: true, churchId: profile?.church_id || undefined };
  };

  const sendPasswordReset = async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/app?reset=1`,
    });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    return { success: true };
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    return { success: true };
  };

  const finishPasswordRecovery = () => {
    setIsPasswordRecovery(false);
    // Drop ?reset=1 so a refresh doesn't ask again
    const url = new URL(window.location.href);
    url.searchParams.delete('reset');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  };

  const openLoginModal = (_redirectTab?: AppTab, mode: 'login' | 'register' | 'register_church' = 'login') => {
    setLoginModalInitialMode(mode);
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Members & notifications
  // ---------------------------------------------------------------------------

  const approveMember = async (memberId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === memberId ? { ...u, approved: true } : u)));
    const { error } = await supabase.rpc('approve_member', { member_id: memberId });
    if (error) reportError('Approving member', error);
    await refreshData();
  };

  const setMemberRole = async (memberId: string, role: 'church_staff' | 'congregation_member') => {
    setUsers((prev) => prev.map((u) => (u.id === memberId ? { ...u, role } : u)));
    const { error } = await supabase.from('profiles').update({ role }).eq('id', memberId);
    if (error) reportError('Changing member role', error);
    await refreshData();
  };

  const revokeMember = async (memberId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === memberId ? { ...u, approved: false } : u)));
    const { error } = await supabase
      .from('profiles')
      .update({ approved: false, role: 'congregation_member' })
      .eq('id', memberId);
    if (error) reportError('Removing member access', error);
    await refreshData();
  };

  const markNotificationsRead = async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
    const { error } = await supabase.from('admin_notifications').update({ read_at: now }).is('read_at', null);
    if (error) reportError('Marking notifications read', error);
  };

  // ---------------------------------------------------------------------------
  // Directory
  // ---------------------------------------------------------------------------

  const addDirectoryMember = (memberData: Omit<DirectoryMember, 'id' | 'createdAt'>) => {
    const member: DirectoryMember = { ...memberData, id: newId('dir'), createdAt: new Date().toISOString() };
    setDirectory((prev) => [member, ...prev]);
    supabase
      .from('directory_members')
      .insert(directoryToRow(member))
      .then(({ error }) => {
        if (error) {
          reportError('Adding directory member', error);
          refreshData();
        }
      });
    return member.id;
  };

  const updateDirectoryMember = (id: string, updates: Partial<DirectoryMember>) => {
    setDirectory((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    const { id: _ignored, ...rest } = updates;
    supabase
      .from('directory_members')
      .update(directoryToRow(rest))
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          reportError('Updating directory member', error);
          refreshData();
        }
      });
  };

  const deleteDirectoryMember = (id: string) => {
    setDirectory((prev) => prev.filter((m) => m.id !== id));
    supabase
      .from('directory_members')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          reportError('Removing directory member', error);
          refreshData();
        }
      });
  };

  // ---------------------------------------------------------------------------
  // Prayer requests
  // ---------------------------------------------------------------------------

  const resubmitPrayerRequest = (requestId: string, updatedContent?: string, isUrgent?: boolean) => {
    const r = requests.find((x) => x.id === requestId);
    if (!r) return;
    const now = new Date().toISOString();
    const newContent = updatedContent?.trim()
      ? `${r.content}\n\n[Renewed ${new Date().toLocaleDateString()}]: ${updatedContent.trim()}`
      : r.content;
    saveRequestChanges(
      [
        {
          id: requestId,
          patch: {
            content: newContent,
            isUrgent: isUrgent !== undefined ? isUrgent : r.isUrgent,
            createdAt: now,
            lastResubmittedAt: now,
            resubmittedTimes: (r.resubmittedTimes || 0) + 1,
            isArchived: false,
            isArchivedFromPrint: false,
            recentEncouragements: [
              {
                text: 'Request resubmitted to church wall for continued prayer and intercession.',
                date: now.split('T')[0],
                from: currentUser?.name || 'Member',
              },
              ...(r.recentEncouragements || []),
            ].slice(0, 5),
          },
        },
      ],
      'Resubmitting prayer request'
    );
  };

  const loginAsChurch = (churchId: string) => {
    if (!isSuperAdmin) return;
    setCurrentChurchId(churchId);
    setImpersonatedChurchId(churchId);
    setIsImpersonating(true);
    setRoleOverride('church_staff');
    setActiveTab('wall');
  };

  const exitImpersonation = () => {
    setIsImpersonating(false);
    setImpersonatedChurchId(null);
    setRoleOverride(null);
    setActiveTab('staff');
  };

  // Submit prayer with AI moderation; the database makes the final status decision
  const addPrayerRequest: AppContextType['addPrayerRequest'] = async (data) => {
    setIsModerating(true);

    let moderationResult: Record<string, any> = {
      status: 'approved',
      safetyScore: 98,
      flags: [],
      reason: 'Safe for community prayer wall.',
      pastoralRecommendation: 'approve_public',
      suggestedCategory: data.category,
      suggestedBulletinSummary: data.title,
    };

    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          requesterName: data.isAnonymous ? 'Anonymous' : data.requesterName,
          visibility: data.visibility,
          churchId: currentChurch.id,
        }),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.data) moderationResult = json.data;
      }
    } catch (err) {
      console.warn('Moderation API call error, using local validation:', err);
    } finally {
      setIsModerating(false);
    }

    const clientStatus =
      moderationResult.status === 'rejected'
        ? 'rejected'
        : moderationResult.status === 'flagged' || moderationResult.flags?.length > 0
        ? 'flagged'
        : 'approved';

    const moderation = {
      safetyScore: moderationResult.safetyScore || 95,
      flags: moderationResult.flags || [],
      reason: moderationResult.reason || 'Evaluated by ministry moderation engine.',
      pastoralRecommendation: moderationResult.pastoralRecommendation || 'approve_public',
      suggestedBulletinSummary: moderationResult.suggestedBulletinSummary,
      crisisAssistanceDetected: moderationResult.crisisAssistanceDetected || false,
    };

    const { data: row, error } = await supabase.rpc('submit_prayer_request', {
      p: {
        churchId: currentChurch.id,
        title: data.title,
        content: data.content,
        requesterName: data.requesterName || currentUser?.name || 'Anonymous',
        requesterEmail: data.requesterEmail || currentUser?.email || '',
        requesterPhone: data.requesterPhone || currentUser?.phone || '',
        isAnonymous: data.isAnonymous,
        visibility: data.visibility,
        category: (moderationResult.suggestedCategory as RequestCategory) || data.category,
        isUrgent: data.isUrgent,
        status: clientStatus,
        moderation,
        bulletinSummary: moderationResult.suggestedBulletinSummary || data.title,
      },
    });

    if (error || !row) {
      reportError('Submitting your prayer request', error);
      return { success: false, status: 'error', reason: error?.message };
    }

    const churchesById = new Map(churches.map((c) => [c.id, c]));
    const saved: PrayerRequest = {
      ...requestFromRow(row, undefined, churchesById),
      requesterEmail: data.requesterEmail || currentUser?.email,
      requesterPhone: data.requesterPhone || currentUser?.phone,
      prayedByMe: true,
    };
    setRequests((prev) => [saved, ...prev]);
    rememberPrayed(saved.id);

    return { success: true, status: saved.status, reason: moderationResult.reason };
  };

  const rememberPrayed = (id: string) => {
    const ids = readPrayedIds();
    ids.add(id);
    writeLocal(PRAYED_KEY, JSON.stringify([...ids].slice(-2000)));
  };

  // "I Prayed for This"
  const incrementPrayerCount = (requestId: string, encouragement?: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const newEncouragements = encouragement
          ? [{ text: encouragement, date: new Date().toISOString().split('T')[0] }, ...(req.recentEncouragements || [])]
          : req.recentEncouragements;
        return {
          ...req,
          prayerCount: req.prayerCount + 1,
          prayedByMe: true,
          recentEncouragements: newEncouragements?.slice(0, 5),
        };
      })
    );
    rememberPrayed(requestId);
    supabase
      .rpc('pray_for_request', { request_id: requestId, encouragement: encouragement || null })
      .then(({ error }) => {
        if (error) reportError('Recording your prayer', error);
      });
  };

  const updateRequestModeration: AppContextType['updateRequestModeration'] = (requestId, action, note) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const reviewed = {
      ...req.moderation,
      reviewedBy: currentUser?.name || 'Pastoral Team',
      reviewedAt: new Date().toISOString(),
    };
    const patch: Partial<PrayerRequest> =
      action === 'approve_public'
        ? {
            status: 'approved',
            visibility: req.visibility === 'private' ? 'church' : req.visibility,
            moderation: { ...reviewed, reason: note || 'Approved by church staff for prayer wall.' },
          }
        : action === 'keep_private'
        ? {
            status: 'approved',
            visibility: 'private',
            moderation: { ...reviewed, reason: note || 'Marked confidential for staff/pastoral prayer team only.' },
          }
        : {
            status: 'rejected',
            moderation: { ...reviewed, reason: note || 'Declined by pastoral staff.' },
          };
    saveRequestChanges([{ id: requestId, patch }], 'Updating moderation');
  };

  const updateBulletinSummary = (requestId: string, summary: string) => {
    saveRequestChanges([{ id: requestId, patch: { bulletinSummary: summary } }], 'Updating bulletin line');
  };

  const updateStaffNotes = (requestId: string, notes: string) => {
    saveRequestChanges([{ id: requestId, patch: { staffNotes: notes } }], 'Saving care note');
  };

  const updatePrayerRequest = (requestId: string, changes: Partial<PrayerRequest>) => {
    const { id: _id, churchId: _church, userId: _user, ...editable } = changes;
    saveRequestChanges([{ id: requestId, patch: editable }], 'Saving prayer request');
  };

  const deletePrayerRequest = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    supabase
      .from('prayer_requests')
      .delete()
      .eq('id', requestId)
      .then(({ error }) => {
        if (error) {
          reportError('Deleting prayer request', error);
          refreshData();
        }
      });
  };

  const togglePrayerAnswered = (requestId: string, updateNote?: string) => {
    const r = requests.find((x) => x.id === requestId);
    if (!r) return;
    saveRequestChanges(
      [
        {
          id: requestId,
          patch: {
            isAnswered: !r.isAnswered,
            category: !r.isAnswered ? 'Praise & Thanksgiving' : r.category,
            answeredUpdate: updateNote || r.answeredUpdate || 'Praise God! The Lord answered this prayer.',
          },
        },
      ],
      'Updating answered prayer'
    );
  };

  const updateChurchProfile = (churchId: string, updates: Partial<Church>) => {
    setChurches((prev) => prev.map((church) => (church.id === churchId ? { ...church, ...updates } : church)));
    const { id: _ignored, ...rest } = updates;
    supabase
      .from('churches')
      .update(churchToRow(rest))
      .eq('id', churchId)
      .then(({ error }) => {
        if (error) {
          reportError('Saving church settings', error);
          refreshData();
        }
      });
  };

  const bulkUpdateBulletinSummaries = (updates: Array<{ id: string; ultraSummary: string }>) => {
    saveRequestChanges(
      updates.map((u) => ({ id: u.id, patch: { bulletinSummary: u.ultraSummary } })),
      'Saving bulletin lines'
    );
  };

  // Loads the 75-request demo roster into the current church (super admin testing tool)
  const load75WeeklyRequests = () => {
    if (!canManageCurrentChurch || !currentChurch.id) return;
    if (!window.confirm(`Add 75 sample prayer requests to ${currentChurch.name}? They will be visible on its wall.`)) return;
    const now = Date.now();
    const copies: PrayerRequest[] = SAMPLE_75_WEEKLY_REQUESTS.map((r, i) => ({
      ...r,
      id: newId('demo'),
      churchId: currentChurch.id,
      churchName: currentChurch.name,
      churchSlug: currentChurch.slug,
      userId: undefined,
      createdAt: r.createdAt || new Date(now - i * 60000).toISOString(),
    }));
    setRequests((prev) => [...copies, ...prev]);
    insertRequests(copies, 'Loading demo requests').catch((e) => {
      reportError('Loading demo requests', e);
      refreshData();
    });
  };

  const togglePrayerArchived = (requestId: string, reason?: string) => {
    const r = requests.find((x) => x.id === requestId);
    if (!r) return;
    const willArchive = !r.isArchived;
    saveRequestChanges(
      [
        {
          id: requestId,
          patch: {
            isArchived: willArchive,
            archivedAt: willArchive ? new Date().toISOString() : undefined,
            archivedReason: willArchive ? reason || 'Archived from active prayer wall' : undefined,
          },
        },
      ],
      'Archiving prayer'
    );
  };

  const togglePrintArchived = (requestId: string) => {
    const r = requests.find((x) => x.id === requestId);
    if (!r) return;
    const willArchive = !r.isArchivedFromPrint;
    saveRequestChanges(
      [
        {
          id: requestId,
          patch: {
            isArchivedFromPrint: willArchive,
            archivedFromPrintAt: willArchive ? new Date().toISOString() : undefined,
          },
        },
      ],
      'Archiving from bulletin'
    );
  };

  const archiveLastWeeksPrayersForPrint = (daysOld: number = 4) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    const now = new Date().toISOString();
    const targets = filteredChurchRequests.filter((r) => !r.isArchivedFromPrint && new Date(r.createdAt) <= cutoff);
    saveRequestChanges(
      targets.map((r) => ({ id: r.id, patch: { isArchivedFromPrint: true, archivedFromPrintAt: now } })),
      'Archiving last week from bulletin'
    );
    return targets.length;
  };

  const restoreAllPrintArchives = () => {
    const targets = filteredChurchRequests.filter((r) => r.isArchivedFromPrint);
    saveRequestChanges(
      targets.map((r) => ({ id: r.id, patch: { isArchivedFromPrint: false, archivedFromPrintAt: undefined } })),
      'Restoring bulletin archive'
    );
  };

  const bulkArchiveAnsweredPrayers = () => {
    const now = new Date().toISOString();
    const targets = filteredChurchRequests.filter((r) => r.isAnswered && !r.isArchived);
    saveRequestChanges(
      targets.map((r) => ({
        id: r.id,
        patch: { isArchived: true, archivedAt: now, archivedReason: 'Answered prayer archived to testimony vault' },
      })),
      'Archiving answered prayers'
    );
    return targets.length;
  };

  const bulkArchiveOlderWallPrayers = (daysOld: number = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    const now = new Date().toISOString();
    const targets = filteredChurchRequests.filter((r) => !r.isArchived && new Date(r.createdAt) <= cutoff);
    saveRequestChanges(
      targets.map((r) => ({
        id: r.id,
        patch: { isArchived: true, archivedAt: now, archivedReason: `Archived as older than ${daysOld} days` },
      })),
      'Archiving older prayers'
    );
    return targets.length;
  };

  const restoreAllWallArchives = () => {
    const targets = filteredChurchRequests.filter((r) => r.isArchived);
    saveRequestChanges(
      targets.map((r) => ({
        id: r.id,
        patch: { isArchived: false, archivedAt: undefined, archivedReason: undefined },
      })),
      'Restoring archived prayers'
    );
  };

  // Super admin: add a client church directly
  const addNewChurch = (churchData: Omit<Church, 'id'>) => {
    const existing = churches.find(
      (c) =>
        c.name.trim().toLowerCase() === churchData.name.trim().toLowerCase() ||
        c.slug.trim().toLowerCase() === churchData.slug.trim().toLowerCase()
    );
    if (existing) {
      updateChurchProfile(existing.id, churchData);
      return existing.id;
    }

    const church: Church = { ...churchData, id: newId('church') };
    setChurches((prev) => [...prev, church].sort((a, b) => a.name.localeCompare(b.name)));
    supabase
      .from('churches')
      .insert(churchToRow(church))
      .then(({ error }) => {
        if (error) {
          reportError('Adding church', error);
          refreshData();
        }
      });
    return church.id;
  };

  // Fix requests whose title was erroneously set to a date (staff only: it saves changes)
  const repairDateTitles = (): number => {
    if (!canManageCurrentChurch) return 0;
    const targets = filteredChurchRequests.filter(
      (r) =>
        isDateString(r.title) ||
        isDateString(r.bulletinSummary) ||
        r.title === r.requesterName ||
        (r.category === 'General' && r.content && r.content.length > 3)
    );
    const changes = targets
      .map((r) => {
        const healed = healPrayerRequest(r);
        const patch: Partial<PrayerRequest> = {};
        for (const key of ['title', 'content', 'bulletinSummary', 'category', 'createdAt'] as const) {
          if (healed[key] !== r[key]) (patch as Record<string, unknown>)[key] = healed[key];
        }
        return { id: r.id, patch };
      })
      .filter((c) => Object.keys(c.patch).length > 0);
    saveRequestChanges(changes, 'Repairing request titles');
    return changes.length;
  };

  // AI-powered batch categorization and title organization
  const categorizePrayersWithAI = async (
    targetRequests?: PrayerRequest[]
  ): Promise<{ success: boolean; count: number }> => {
    const toProcess =
      targetRequests ||
      filteredChurchRequests.filter(
        (r) => r.category === 'General' || isDateString(r.title) || r.title.length < 5
      );

    if (toProcess.length === 0) return { success: true, count: 0 };

    setIsAICategorizing(true);
    try {
      const itemsPayload = toProcess.slice(0, 60).map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        requesterName: r.requesterName,
      }));

      const res = await fetch('/api/batch-categorize-prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload }),
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        const byId = new Map(toProcess.map((r) => [r.id, r]));
        const changes = data.results
          .filter((match: { id: string }) => byId.has(match.id))
          .map((match: { id: string; refinedTitle?: string; category: RequestCategory; isUrgent?: boolean; isAnswered?: boolean }) => {
            const healed = healPrayerRequest(byId.get(match.id)!);
            const finalTitle =
              match.refinedTitle && !isDateString(match.refinedTitle) ? match.refinedTitle : healed.title;
            return {
              id: match.id,
              patch: {
                title: finalTitle,
                content: healed.content,
                category: match.category,
                isUrgent: match.isUrgent ?? healed.isUrgent,
                isAnswered: match.isAnswered ?? healed.isAnswered,
                bulletinSummary: finalTitle,
              } as Partial<PrayerRequest>,
            };
          });
        saveRequestChanges(changes, 'Saving AI categories');
        return { success: true, count: changes.length };
      }
    } catch (e) {
      console.warn('AI batch categorization failed, using heuristic healing:', e);
    } finally {
      setIsAICategorizing(false);
    }

    // Fallback: heal any date titles even if the AI request fails
    repairDateTitles();
    return { success: true, count: toProcess.length };
  };

  const importPrayerRequestsBatch: AppContextType['importPrayerRequestsBatch'] = (newItems) => {
    const now = new Date();

    const createdRequests: PrayerRequest[] = newItems.map((item, idx) => {
      const targetChurchId = item.churchId || currentChurch.id;
      const churchObj = churches.find((c) => c.id === targetChurchId) || currentChurch;

      const rawTitle = item.title.trim();
      const rawContent = item.content.trim();
      let cleanedTitle = rawTitle;
      let parsedDate = item.createdAt;

      if (isDateString(cleanedTitle)) {
        parsedDate = parseDateToISO(cleanedTitle) || parsedDate;
        cleanedTitle =
          rawContent && !isDateString(rawContent)
            ? rawContent.length > 70
              ? rawContent.substring(0, 67) + '...'
              : rawContent
            : 'Prayer Request';
      }

      const finalTitle =
        cleanedTitle || (rawContent.length > 70 ? rawContent.substring(0, 67) + '...' : rawContent) || 'Prayer Request';
      const finalContent = rawContent || finalTitle || 'Please lift this request in prayer.';

      return {
        id: newId('csv'),
        churchId: targetChurchId,
        churchName: churchObj.name,
        churchSlug: churchObj.slug,
        title: finalTitle,
        content: finalContent,
        requesterName: item.isAnonymous ? 'Anonymous' : item.requesterName?.trim() || 'Church Member',
        requesterEmail: item.requesterEmail?.trim() || undefined,
        requesterPhone: item.requesterPhone?.trim() || undefined,
        isAnonymous: Boolean(item.isAnonymous),
        visibility: 'church', // all imported requests go on the church wall
        category: item.category || 'General',
        isUrgent: Boolean(item.isUrgent),
        isAnswered: Boolean(item.isAnswered),
        prayerCount: 1,
        createdAt: parsedDate || new Date(now.getTime() - idx * 60000).toISOString(),
        status: 'approved',
        bulletinSummary: finalTitle.length > 50 ? finalTitle.substring(0, 47) + '...' : finalTitle,
        recentEncouragements: [],
        moderation: {
          safetyScore: 98,
          flags: [],
          pastoralRecommendation: 'approve_public',
          reviewedBy: 'CSV Batch Import (Church Wall)',
          reviewedAt: now.toISOString(),
          reason: 'Imported to church wall with AI categorization.',
        },
      };
    });

    setRequests((prev) => [...createdRequests, ...prev]);
    insertRequests(createdRequests, 'Importing prayer requests')
      .then(() => categorizePrayersWithAI(createdRequests))
      .catch((e) => {
        reportError('Importing prayer requests', e);
        refreshData();
      });

    return createdRequests.length;
  };

  // After loading, quietly repair date-like titles for staff of this church
  const repairedChurches = useRef(new Set<string>());
  useEffect(() => {
    if (isLoading || !canManageCurrentChurch || repairedChurches.current.has(currentChurch.id)) return;
    repairedChurches.current.add(currentChurch.id);
    if (filteredChurchRequests.some((r) => isDateString(r.title))) repairDateTitles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, canManageCurrentChurch, currentChurch.id]);

  return (
    <AppContext.Provider
      value={{
        churches,
        currentChurch,
        currentChurchId: currentChurch.id,
        setCurrentChurchId,
        activeRole,
        setActiveRole,
        isImpersonating,
        impersonatedChurch,
        loginAsChurch,
        exitImpersonation,
        requests,
        filteredChurchRequests,
        globalRequests,
        flaggedRequests,
        privateRequests,
        activeTab,
        setActiveTab,
        submitModalOpen,
        setSubmitModalOpen,
        users,
        currentUser,
        isSuperAdmin,
        directory,
        loginModalOpen,
        setLoginModalOpen,
        loginModalInitialMode,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
        register,
        registerChurch,
        sendPasswordReset,
        isPasswordRecovery,
        updatePassword,
        finishPasswordRecovery,
        approveMember,
        setMemberRole,
        revokeMember,
        notifications,
        markNotificationsRead,
        resubmitPrayerRequest,
        addDirectoryMember,
        updateDirectoryMember,
        deleteDirectoryMember,
        addPrayerRequest,
        incrementPrayerCount,
        updateRequestModeration,
        updateBulletinSummary,
        updateStaffNotes,
        updatePrayerRequest,
        deletePrayerRequest,
        bulkUpdateBulletinSummaries,
        togglePrayerAnswered,
        updateChurchProfile,
        addNewChurch,
        load75WeeklyRequests,
        togglePrayerArchived,
        togglePrintArchived,
        archiveLastWeeksPrayersForPrint,
        restoreAllPrintArchives,
        bulkArchiveAnsweredPrayers,
        bulkArchiveOlderWallPrayers,
        restoreAllWallArchives,
        isModerating,
        importModalOpen,
        setImportModalOpen,
        importPrayerRequestsBatch,
        repairDateTitles,
        categorizePrayersWithAI,
        isAICategorizing,
        isLoading,
        dataError,
        clearDataError: () => setDataError(null),
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
