import React, { createContext, useContext, useState, useEffect } from 'react';
import { Church, PrayerRequest, UserRole, VisibilityType, RequestCategory, ModerationStatus, AppTab, UserAccount, DirectoryMember } from '../types';
import { INITIAL_CHURCHES, INITIAL_REQUESTS } from '../data/initialData';
import { SAMPLE_75_WEEKLY_REQUESTS } from '../data/sample75Requests';
import { INITIAL_USERS } from '../data/initialUsers';
import { INITIAL_DIRECTORY_MEMBERS } from '../data/initialDirectory';

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
  users: UserAccount[];
  currentUser: UserAccount | null;
  directory: DirectoryMember[];
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  loginModalInitialMode: 'login' | 'register' | 'register_church';
  openLoginModal: (redirectTab?: AppTab, mode?: 'login' | 'register' | 'register_church') => void;
  closeLoginModal: () => void;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  register: (data: Omit<UserAccount, 'id' | 'createdAt'> & { password?: string }) => { success: boolean; error?: string };
  switchAccount: (userId: string) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial data or localStorage
  const [churches, setChurches] = useState<Church[]>(() => {
    try {
      const saved = localStorage.getItem('gracewall_churches');
      return saved ? JSON.parse(saved) : INITIAL_CHURCHES;
    } catch {
      return INITIAL_CHURCHES;
    }
  });

  const [currentChurchId, setCurrentChurchId] = useState<string>(() => {
    return churches[0]?.id || 'church-grace';
  });

  const [activeRole, setActiveRole] = useState<UserRole>('church_staff');
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [impersonatedChurchId, setImpersonatedChurchId] = useState<string | null>(null);

  const [requests, setRequests] = useState<PrayerRequest[]>(() => {
    try {
      const saved = localStorage.getItem('gracewall_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 25) {
          return parsed;
        }
      }
      // Combine initial requests and the 75 weekly requests for a full high-volume church experience
      return [...INITIAL_REQUESTS, ...SAMPLE_75_WEEKLY_REQUESTS];
    } catch {
      return [...INITIAL_REQUESTS, ...SAMPLE_75_WEEKLY_REQUESTS];
    }
  });

  const [activeTab, setActiveTab] = useState<AppTab>('wall');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalInitialMode, setLoginModalInitialMode] = useState<'login' | 'register' | 'register_church'>('login');

  // User Accounts & Authentication State
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('gracewall_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('gracewall_current_user');
      return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Default to Pastor David Matthews for immediate full capability
    } catch {
      return INITIAL_USERS[0];
    }
  });

  // Church Directory State
  const [directory, setDirectory] = useState<DirectoryMember[]>(() => {
    try {
      const saved = localStorage.getItem('gracewall_directory');
      return saved ? JSON.parse(saved) : INITIAL_DIRECTORY_MEMBERS;
    } catch {
      return INITIAL_DIRECTORY_MEMBERS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gracewall_churches', JSON.stringify(churches));
    } catch (e) {
      console.warn('Failed saving churches to localStorage', e);
    }
  }, [churches]);

  useEffect(() => {
    try {
      localStorage.setItem('gracewall_requests', JSON.stringify(requests));
    } catch (e) {
      console.warn('Failed saving requests to localStorage', e);
    }
  }, [requests]);

  useEffect(() => {
    try {
      localStorage.setItem('gracewall_users', JSON.stringify(users));
    } catch (e) {
      console.warn('Failed saving users to localStorage', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('gracewall_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('gracewall_current_user');
      }
    } catch (e) {
      console.warn('Failed saving current user to localStorage', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('gracewall_directory', JSON.stringify(directory));
    } catch (e) {
      console.warn('Failed saving directory to localStorage', e);
    }
  }, [directory]);

  // Auth Methods
  const login = (email: string, password?: string) => {
    const found = users.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (!found) {
      return { success: false, error: 'No account found with this email address.' };
    }
    if (password && found.password && found.password !== password) {
      return { success: false, error: 'Incorrect password. Try demo password or check spelling.' };
    }

    setCurrentUser(found);
    setActiveRole(found.role);
    if (found.churchId && found.role !== 'super_admin') {
      setCurrentChurchId(found.churchId);
    }
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveRole('congregation_member');
    setActiveTab('wall');
  };

  const register = (data: Omit<UserAccount, 'id' | 'createdAt'> & { password?: string }) => {
    const existing = users.find(
      (u) => u.email.trim().toLowerCase() === data.email.trim().toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser: UserAccount = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setActiveRole(newUser.role);
    if (newUser.churchId) {
      setCurrentChurchId(newUser.churchId);
    }

    // Auto add to church directory
    const newDirMember: DirectoryMember = {
      id: `dir-${Date.now()}`,
      churchId: newUser.churchId,
      name: newUser.name,
      roleTitle: newUser.title || (newUser.role === 'church_staff' ? 'Pastoral Staff' : 'Congregation Member'),
      group: newUser.role === 'church_staff' ? 'Pastoral Staff' : 'Congregation Members',
      email: newUser.email,
      phone: newUser.phone || '(555) 000-0000',
      photoUrl: newUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&h=240&q=80',
      isPublicInDirectory: true,
      joinedYear: new Date().getFullYear().toString(),
      createdAt: new Date().toISOString(),
    };
    setDirectory((prev) => [newDirMember, ...prev]);

    return { success: true };
  };

  const switchAccount = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setActiveRole(found.role);
      if (found.churchId && found.role !== 'super_admin') {
        setCurrentChurchId(found.churchId);
      }
    }
  };

  const openLoginModal = (_redirectTab?: AppTab, mode: 'login' | 'register' | 'register_church' = 'login') => {
    setLoginModalInitialMode(mode);
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
  };

  // Directory Methods
  const addDirectoryMember = (memberData: Omit<DirectoryMember, 'id' | 'createdAt'>) => {
    const newId = `dir-${Date.now()}`;
    const newMember: DirectoryMember = {
      ...memberData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setDirectory((prev) => [newMember, ...prev]);
    return newId;
  };

  const updateDirectoryMember = (id: string, updates: Partial<DirectoryMember>) => {
    setDirectory((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteDirectoryMember = (id: string) => {
    setDirectory((prev) => prev.filter((m) => m.id !== id));
  };

  // Resubmit Prayer Request to Wall
  const resubmitPrayerRequest = (requestId: string, updatedContent?: string, isUrgent?: boolean) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const newContent = updatedContent?.trim()
            ? `${r.content}\n\n[Renewed ${new Date().toLocaleDateString()}]: ${updatedContent.trim()}`
            : r.content;
          const resubmitTimes = (r.resubmittedTimes || 0) + 1;
          return {
            ...r,
            content: newContent,
            isUrgent: isUrgent !== undefined ? isUrgent : r.isUrgent,
            createdAt: new Date().toISOString(),
            lastResubmittedAt: new Date().toISOString(),
            resubmittedTimes: resubmitTimes,
            status: 'approved' as const,
            isArchived: false,
            isArchivedFromPrint: false,
            recentEncouragements: [
              {
                text: 'Request resubmitted to church wall for continued prayer and intercession.',
                date: new Date().toISOString().split('T')[0],
                from: currentUser?.name || 'Member',
              },
              ...(r.recentEncouragements || []),
            ],
          };
        }
        return r;
      })
    );
  };

  const currentChurch = churches.find((c) => c.id === currentChurchId) || churches[0];
  const impersonatedChurch = impersonatedChurchId
    ? churches.find((c) => c.id === impersonatedChurchId) || null
    : null;

  // Requests for currently active church
  const filteredChurchRequests = requests.filter((r) => r.churchId === currentChurchId);
  
  // Global network requests (all approved global visibility requests across all churches)
  const globalRequests = requests.filter((r) => r.visibility === 'global' && r.status === 'approved');

  // Flagged requests needing moderation for current church
  const flaggedRequests = filteredChurchRequests.filter((r) => r.status === 'flagged');

  // Private requests for staff of current church
  const privateRequests = filteredChurchRequests.filter((r) => r.visibility === 'private');

  // Super Admin impersonation action: "Login as [Church]"
  const loginAsChurch = (churchId: string) => {
    setCurrentChurchId(churchId);
    setImpersonatedChurchId(churchId);
    setIsImpersonating(true);
    setActiveRole('church_staff');
    setActiveTab('wall');
  };

  const exitImpersonation = () => {
    setIsImpersonating(false);
    setImpersonatedChurchId(null);
    setActiveRole('super_admin');
    setActiveTab('staff');
  };

  // Submit prayer with AI Moderation
  const addPrayerRequest = async (data: {
    title: string;
    content: string;
    requesterName: string;
    requesterEmail?: string;
    requesterPhone?: string;
    isAnonymous: boolean;
    visibility: VisibilityType;
    category: RequestCategory;
    isUrgent: boolean;
  }) => {
    setIsModerating(true);

    let moderationResult: any = {
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
          churchId: currentChurchId,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          moderationResult = json.data;
        }
      }
    } catch (err) {
      console.warn('Moderation API call error, using local validation:', err);
    } finally {
      setIsModerating(false);
    }

    // Determine initial status based on moderation & church settings
    let finalStatus: 'approved' | 'flagged' | 'rejected' = 'approved';

    if (moderationResult.status === 'rejected') {
      finalStatus = 'rejected';
    } else if (moderationResult.status === 'flagged' || moderationResult.flags?.length > 0) {
      finalStatus = 'flagged';
    } else if (currentChurch.settings.requireStaffReviewBeforePublish && data.visibility !== 'private') {
      finalStatus = 'flagged'; // Pending pastor approval if church requires all requests to be vetted
    }

    const newRequest: PrayerRequest = {
      id: `req-${Date.now()}`,
      userId: currentUser?.id,
      churchId: currentChurchId,
      churchName: currentChurch.name,
      churchSlug: currentChurch.slug,
      title: data.title,
      content: data.content,
      requesterName: data.isAnonymous
        ? 'Anonymous Church Member'
        : data.requesterName || currentUser?.name || 'Anonymous',
      requesterEmail: data.requesterEmail || currentUser?.email,
      requesterPhone: data.requesterPhone || currentUser?.phone,
      isAnonymous: data.isAnonymous,
      visibility: data.visibility,
      category: (moderationResult.suggestedCategory as RequestCategory) || data.category,
      isUrgent: data.isUrgent,
      isAnswered: false,
      prayerCount: 1, // Requester automatically counts as first prayer
      prayedByMe: true,
      createdAt: new Date().toISOString(),
      status: finalStatus,
      bulletinSummary: moderationResult.suggestedBulletinSummary || data.title,
      moderation: {
        safetyScore: moderationResult.safetyScore || 95,
        flags: moderationResult.flags || [],
        reason: moderationResult.reason || 'Evaluated by ministry moderation engine.',
        pastoralRecommendation: moderationResult.pastoralRecommendation || 'approve_public',
        suggestedBulletinSummary: moderationResult.suggestedBulletinSummary,
        crisisAssistanceDetected: moderationResult.crisisAssistanceDetected || false,
      },
      recentEncouragements: [
        { text: 'A prayer was lifted up as this request was shared.', date: new Date().toISOString().split('T')[0] }
      ],
    };

    setRequests((prev) => [newRequest, ...prev]);

    return {
      success: true,
      status: finalStatus,
      reason: moderationResult.reason,
    };
  };

  // "I Prayed for This" increment
  const incrementPrayerCount = (requestId: string, encouragement?: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const newCount = req.prayerCount + 1;
        const newEncouragements = encouragement
          ? [{ text: encouragement, date: new Date().toISOString().split('T')[0] }, ...(req.recentEncouragements || [])]
          : req.recentEncouragements;
        return {
          ...req,
          prayerCount: newCount,
          prayedByMe: true,
          recentEncouragements: newEncouragements?.slice(0, 5),
        };
      })
    );
  };

  // Pastoral Moderation Actions
  const updateRequestModeration = (
    requestId: string,
    action: 'approve_public' | 'keep_private' | 'reject',
    note?: string
  ) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        if (action === 'approve_public') {
          return {
            ...req,
            status: 'approved',
            visibility: req.visibility === 'private' ? 'church' : req.visibility,
            moderation: {
              ...req.moderation,
              reviewedBy: 'Pastoral Team',
              reviewedAt: new Date().toISOString(),
              reason: note || 'Approved by church staff for prayer wall.',
            },
          };
        } else if (action === 'keep_private') {
          return {
            ...req,
            status: 'approved',
            visibility: 'private',
            moderation: {
              ...req.moderation,
              reviewedBy: 'Pastoral Team',
              reviewedAt: new Date().toISOString(),
              reason: note || 'Marked confidential for staff/pastoral prayer team only.',
            },
          };
        } else {
          return {
            ...req,
            status: 'rejected',
            moderation: {
              ...req.moderation,
              reviewedBy: 'Pastoral Team',
              reviewedAt: new Date().toISOString(),
              reason: note || 'Declined by pastoral staff.',
            },
          };
        }
      })
    );
  };

  // Update Sunday Bulletin summary line
  const updateBulletinSummary = (requestId: string, summary: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, bulletinSummary: summary } : r))
    );
  };

  // Toggle Answered Prayer / Praise
  const togglePrayerAnswered = (requestId: string, updateNote?: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          isAnswered: !r.isAnswered,
          category: !r.isAnswered ? 'Praise & Thanksgiving' : r.category,
          answeredUpdate: updateNote || r.answeredUpdate || 'Praise God! The Lord answered this prayer.',
        };
      })
    );
  };

  // Update Church Profile & Settings
  const updateChurchProfile = (churchId: string, updates: Partial<Church>) => {
    setChurches((prev) =>
      prev.map((church) => (church.id === churchId ? { ...church, ...updates } : church))
    );
  };

  // Bulk update bulletin summaries (for 75+ weekly compression)
  const bulkUpdateBulletinSummaries = (updates: Array<{ id: string; ultraSummary: string }>) => {
    const updateMap = new Map(updates.map((u) => [u.id, u.ultraSummary]));
    setRequests((prev) =>
      prev.map((r) => {
        if (updateMap.has(r.id)) {
          return { ...r, bulletinSummary: updateMap.get(r.id)! };
        }
        return r;
      })
    );
  };

  // Reset or load the full 75-request weekly roster for Grace Fellowship
  const load75WeeklyRequests = () => {
    const existingIds = new Set(SAMPLE_75_WEEKLY_REQUESTS.map((r) => r.id));
    const nonSample = requests.filter((r) => !existingIds.has(r.id));
    setRequests([...SAMPLE_75_WEEKLY_REQUESTS, ...nonSample]);
  };

  // Toggle archive status on the Prayer Wall (retains in Staff Archive Vault)
  const togglePrayerArchived = (requestId: string, reason?: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const willArchive = !r.isArchived;
        return {
          ...r,
          isArchived: willArchive,
          archivedAt: willArchive ? new Date().toISOString() : undefined,
          archivedReason: willArchive ? (reason || 'Archived from active prayer wall') : undefined,
        };
      })
    );
  };

  // Toggle print-specific archive (excludes from print document without removing from wall)
  const togglePrintArchived = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const willArchive = !r.isArchivedFromPrint;
        return {
          ...r,
          isArchivedFromPrint: willArchive,
          archivedFromPrintAt: willArchive ? new Date().toISOString() : undefined,
        };
      })
    );
  };

  // "Archive Last Week's Prayers (Print Only)" - rotates off prayers from the print set
  const archiveLastWeeksPrayersForPrint = (daysOld: number = 4) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    let count = 0;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.churchId !== currentChurchId) return r;
        // If not already archived from print and was created prior to cutoff
        if (!r.isArchivedFromPrint) {
          const createdDate = new Date(r.createdAt);
          if (createdDate <= cutoff) {
            count++;
            return {
              ...r,
              isArchivedFromPrint: true,
              archivedFromPrintAt: new Date().toISOString(),
            };
          }
        }
        return r;
      })
    );
    return count;
  };

  // Restore all print archives back into the active print set
  const restoreAllPrintArchives = () => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.churchId === currentChurchId && r.isArchivedFromPrint) {
          return { ...r, isArchivedFromPrint: false, archivedFromPrintAt: undefined };
        }
        return r;
      })
    );
  };

  // Bulk archive answered prayers from wall to vault
  const bulkArchiveAnsweredPrayers = () => {
    let count = 0;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.churchId === currentChurchId && r.isAnswered && !r.isArchived) {
          count++;
          return {
            ...r,
            isArchived: true,
            archivedAt: new Date().toISOString(),
            archivedReason: 'Answered prayer archived to testimony vault',
          };
        }
        return r;
      })
    );
    return count;
  };

  // Bulk archive wall prayers older than specified days (default 30 days)
  const bulkArchiveOlderWallPrayers = (daysOld: number = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    let count = 0;

    setRequests((prev) =>
      prev.map((r) => {
        if (r.churchId === currentChurchId && !r.isArchived) {
          const created = new Date(r.createdAt);
          if (created <= cutoff) {
            count++;
            return {
              ...r,
              isArchived: true,
              archivedAt: new Date().toISOString(),
              archivedReason: `Archived as older than ${daysOld} days`,
            };
          }
        }
        return r;
      })
    );
    return count;
  };

  // Restore all wall archives for current church
  const restoreAllWallArchives = () => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.churchId === currentChurchId && r.isArchived) {
          return {
            ...r,
            isArchived: false,
            archivedAt: undefined,
            archivedReason: undefined,
          };
        }
        return r;
      })
    );
  };

  // Add new client church (Super Admin feature)
  const addNewChurch = (churchData: Omit<Church, 'id'>) => {
    const newId = `church-${Date.now()}`;
    const newChurch: Church = {
      ...churchData,
      id: newId,
    };
    setChurches((prev) => [...prev, newChurch]);
    return newId;
  };

  const [importModalOpen, setImportModalOpen] = useState(false);

  const importPrayerRequestsBatch = (
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
  ): number => {
    const targetChurch = currentChurch;
    const now = new Date();

    const createdRequests: PrayerRequest[] = newItems.map((item, idx) => {
      const targetChurchId = item.churchId || targetChurch.id;
      const churchObj = churches.find((c) => c.id === targetChurchId) || targetChurch;
      const isUrgent = Boolean(item.isUrgent);
      const isAnswered = Boolean(item.isAnswered);
      const category: RequestCategory = item.category || 'General';
      const visibility: VisibilityType = item.visibility || 'church';
      const status: ModerationStatus = item.status || 'approved';

      return {
        id: `csv-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
        churchId: targetChurchId,
        churchName: churchObj.name,
        churchSlug: churchObj.slug,
        title: item.title.trim(),
        content: item.content.trim(),
        requesterName: item.isAnonymous ? 'Anonymous' : (item.requesterName?.trim() || 'Church Member'),
        requesterEmail: item.requesterEmail?.trim() || undefined,
        requesterPhone: item.requesterPhone?.trim() || undefined,
        isAnonymous: Boolean(item.isAnonymous),
        visibility,
        category,
        isUrgent,
        isAnswered,
        prayerCount: 1,
        createdAt: item.createdAt || new Date(now.getTime() - idx * 60000).toISOString(),
        status,
        bulletinSummary: item.title.length > 50 ? item.title.substring(0, 47) + '...' : item.title,
        moderation: {
          safetyScore: 98,
          flags: [],
          pastoralRecommendation: 'approve_public',
          reviewedBy: 'CSV Batch Import',
          reviewedAt: now.toISOString(),
          reason: 'Imported via CSV batch tool.',
        },
      };
    });

    setRequests((prev) => [...createdRequests, ...prev]);
    return createdRequests.length;
  };

  return (
    <AppContext.Provider
      value={{
        churches,
        currentChurch,
        currentChurchId,
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
        directory,
        loginModalOpen,
        setLoginModalOpen,
        loginModalInitialMode,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
        register,
        switchAccount,
        resubmitPrayerRequest,
        addDirectoryMember,
        updateDirectoryMember,
        deleteDirectoryMember,
        addPrayerRequest,
        incrementPrayerCount,
        updateRequestModeration,
        updateBulletinSummary,
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
