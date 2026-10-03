export type VisibilityType = 'private' | 'church' | 'global';

export type RequestCategory = 
  | 'Health & Healing'
  | 'Comfort & Grief'
  | 'Family & Relationships'
  | 'Spiritual Growth'
  | 'Missions & Outreach'
  | 'Praise & Thanksgiving'
  | 'Guidance & Provision'
  | 'General';

export type ModerationStatus = 'approved' | 'flagged' | 'rejected' | 'pending';

export interface ModerationDetails {
  safetyScore: number;
  flags: string[];
  reason?: string;
  pastoralRecommendation?: 'approve_public' | 'review_needed' | 'keep_private' | 'decline';
  reviewedBy?: string;
  reviewedAt?: string;
  suggestedBulletinSummary?: string;
  suggestedCategory?: string;
  crisisAssistanceDetected?: boolean;
}

export interface PrayerRequest {
  id: string;
  churchId: string;
  churchName?: string;
  churchSlug?: string;
  title: string;
  content: string;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  isAnonymous?: boolean;
  visibility: VisibilityType;
  category: RequestCategory;
  isUrgent: boolean;
  isAnswered: boolean;
  answeredUpdate?: string;
  prayerCount: number;
  prayedByMe?: boolean;
  createdAt: string;
  status: ModerationStatus;
  moderation: ModerationDetails;
  bulletinSummary?: string;
  staffNotes?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedReason?: string;
  isArchivedFromPrint?: boolean;
  archivedFromPrintAt?: string;
  recentEncouragements?: Array<{ text: string; date: string; from?: string }>;
}

export type WallLayoutType = 'grid' | 'list' | 'compact' | 'masonry';

export interface Church {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  tagline: string;
  denomination: string;
  pastorName: string;
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  websiteUrl: string;
  themeColor: 'amber' | 'emerald' | 'indigo' | 'rose' | 'sky';
  welcomeMessage: string;
  scriptureVerse: string;
  bulletinTitle?: string;
  settings: {
    allowAnonymous: boolean;
    requireStaffReviewBeforePublish: boolean;
    autoApproveHighScores: boolean;
    enablePraiseUpdates: boolean;
    defaultPrintColumns: 1 | 2;
    defaultWallLayout: WallLayoutType;
  };
}

export type UserRole = 'super_admin' | 'church_staff' | 'congregation_member' | 'embed_view';

export interface PrintConfig {
  template: 'bulletin_2col' | 'bulletin_1col' | 'pastoral_care' | 'prayer_meeting';
  categories: RequestCategory[];
  includePrivate: boolean;
  includeAnswered: boolean;
  includeContactInfo: boolean;
  includeScripture: boolean;
  includePastorNote: boolean;
  includeDate: boolean;
  dateRange: 'week' | 'month' | 'all';
  fontSize: 'sm' | 'base' | 'lg';
  sortBy: 'newest' | 'category' | 'urgent_first';
  customTitle: string;
  customSubtitle: string;
  pastorNoteText: string;
}
