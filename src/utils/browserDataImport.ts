import { Church, DirectoryMember, PrayerRequest } from '../types';
import { INITIAL_CHURCHES, INITIAL_REQUESTS } from '../data/initialData';
import { INITIAL_DIRECTORY_MEMBERS } from '../data/initialDirectory';
import { supabase, churchToRow, requestToRows, directoryToRow } from '../lib/supabase';

/**
 * One-time move of data the old version of the app kept only in this browser's
 * localStorage (keys gracewall_churches / gracewall_requests / gracewall_directory)
 * into Supabase. Falls back to the starter data that shipped with the old app.
 */

export interface BrowserChurchSummary {
  church: Church;
  requestCount: number;
  directoryCount: number;
  existsInDatabase: boolean;
}

export interface BrowserDataScan {
  source: 'browser' | 'starter';
  churches: BrowserChurchSummary[];
  requests: PrayerRequest[];
  directory: DirectoryMember[];
}

// Demo churches that shipped with the prototype; unchecked by default
export const DEMO_CHURCH_IDS = new Set(['church-grace', 'church-redeemer', 'church-hope', 'church-cornerstone']);

const readArray = <T,>(key: string): T[] | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : null;
  } catch {
    return null;
  }
};

export const scanBrowserData = (existingChurchIds: Set<string>): BrowserDataScan => {
  const storedChurches = readArray<Church>('gracewall_churches');
  const storedRequests = readArray<PrayerRequest>('gracewall_requests');
  const storedDirectory = readArray<DirectoryMember>('gracewall_directory');

  const source = storedChurches || storedRequests ? 'browser' : 'starter';
  const churches = storedChurches || INITIAL_CHURCHES;
  const requests = storedRequests || INITIAL_REQUESTS;
  const directory = storedDirectory || INITIAL_DIRECTORY_MEMBERS;

  return {
    source,
    churches: churches.map((church) => ({
      church,
      requestCount: requests.filter((r) => r.churchId === church.id).length,
      directoryCount: directory.filter((m) => m.churchId === church.id).length,
      existsInDatabase: existingChurchIds.has(church.id),
    })),
    requests,
    directory,
  };
};

const validDate = (value?: string) => (value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : undefined);

/** Copies the chosen churches with their prayers and directory. Safe to re-run: existing rows are skipped. */
export const importBrowserData = async (
  scan: BrowserDataScan,
  churchIds: string[]
): Promise<{ churches: number; requests: number; directory: number }> => {
  const chosen = new Set(churchIds);
  const churches = scan.churches.filter((c) => chosen.has(c.church.id)).map((c) => c.church);

  // Slugs must be unique in the database
  const { data: slugRows, error: slugError } = await supabase.from('churches').select('id, slug');
  if (slugError) throw slugError;
  const takenSlugs = new Map((slugRows || []).map((r) => [r.slug as string, r.id as string]));

  const churchRows = churches.map((c) => {
    let slug = c.slug || c.id;
    let n = 1;
    while (takenSlugs.has(slug) && takenSlugs.get(slug) !== c.id) {
      n += 1;
      slug = `${c.slug}-${n}`;
    }
    takenSlugs.set(slug, c.id);
    return churchToRow({ ...c, slug });
  });
  if (churchRows.length > 0) {
    const { error } = await supabase.from('churches').upsert(churchRows, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  }

  const requests = scan.requests.filter((r) => chosen.has(r.churchId));
  const requestRows = requests.map((r) => {
    const { row, priv } = requestToRows({
      ...r,
      userId: undefined, // old demo accounts don't exist in the database
      createdAt: validDate(r.createdAt) || new Date().toISOString(),
      archivedAt: validDate(r.archivedAt),
      archivedFromPrintAt: validDate(r.archivedFromPrintAt),
      lastResubmittedAt: validDate(r.lastResubmittedAt),
      moderation: r.moderation || { safetyScore: 95, flags: [] },
      recentEncouragements: r.recentEncouragements || [],
      prayerCount: r.prayerCount || 1,
      status: r.status || 'approved',
      visibility: r.visibility || 'church',
      category: r.category || 'General',
    });
    delete row.prayed_by_me;
    return { row, priv: { request_id: r.id, church_id: r.churchId, ...priv } };
  });
  for (let i = 0; i < requestRows.length; i += 500) {
    const chunk = requestRows.slice(i, i + 500);
    const { error } = await supabase
      .from('prayer_requests')
      .upsert(chunk.map((c) => c.row), { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
    const privRows = chunk
      .map((c) => c.priv as Record<string, unknown>)
      .filter((p) => p.requester_email || p.requester_phone || p.staff_notes);
    if (privRows.length > 0) {
      const { error: privError } = await supabase
        .from('prayer_request_private')
        .upsert(privRows, { onConflict: 'request_id', ignoreDuplicates: true });
      if (privError) throw privError;
    }
  }

  const directory = scan.directory.filter((m) => chosen.has(m.churchId));
  if (directory.length > 0) {
    const { error } = await supabase.from('directory_members').upsert(
      directory.map((m) => directoryToRow({ ...m, createdAt: validDate(m.createdAt) || new Date().toISOString() })),
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (error) throw error;
  }

  return { churches: churches.length, requests: requests.length, directory: directory.length };
};
