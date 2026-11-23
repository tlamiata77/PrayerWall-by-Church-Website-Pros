import type { DirectoryMember } from '../types';

/**
 * Where a listing sits by its role: the pastor first, then any other pastors, then deacons,
 * then everyone else.
 */
const leadershipRank = (roleTitle: string | undefined): number => {
  const role = (roleTitle || '').toLowerCase();
  if (/\bpastor\b/.test(role)) return /\b(senior|lead)\b/.test(role) || role.trim() === 'pastor' ? 0 : 1;
  if (/\bdeacon/.test(role)) return 2;
  return 3;
};

/**
 * The name a listing is alphabetized by: the family name ("The Keens", "The Wilson Family")
 * or the last name of a person ("Mary Smith", "John & Mary Keen", "Bob Jones Jr.").
 */
export const directorySortName = (name: string): string => {
  const words = name
    .replace(/^\s*the\s+/i, '')
    .replace(/\s+family\s*$/i, '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .filter((w) => !/^(jr|sr|ii|iii|iv)\.?$/i.test(w));
  return (words[words.length - 1] || name).toLowerCase();
};

/** Pastor and deacons first, then everyone else alphabetically by last or family name */
export const sortDirectory = <T extends Pick<DirectoryMember, 'name' | 'roleTitle'>>(members: T[]): T[] =>
  [...members].sort(
    (a, b) =>
      leadershipRank(a.roleTitle) - leadershipRank(b.roleTitle) ||
      directorySortName(a.name).localeCompare(directorySortName(b.name), undefined, { sensitivity: 'base' }) ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
