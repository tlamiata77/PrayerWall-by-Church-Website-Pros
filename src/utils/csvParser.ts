import { RequestCategory, VisibilityType, ModerationStatus } from '../types';

export interface ParsedPrayerRow {
  id: string;
  title: string;
  content: string;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  category: RequestCategory;
  visibility: VisibilityType;
  isUrgent: boolean;
  isAnswered: boolean;
  isAnonymous: boolean;
  status: ModerationStatus;
  selected: boolean;
  isValid: boolean;
  validationError?: string;
}

const VALID_CATEGORIES: RequestCategory[] = [
  'Health & Healing',
  'Comfort & Grief',
  'Family & Relationships',
  'Spiritual Growth',
  'Missions & Outreach',
  'Praise & Thanksgiving',
  'Guidance & Provision',
  'General',
];

export function normalizeCategory(catStr?: string): RequestCategory {
  if (!catStr) return 'General';
  const clean = catStr.trim().toLowerCase();

  for (const cat of VALID_CATEGORIES) {
    if (cat.toLowerCase() === clean) return cat;
  }

  // Fuzzy matches
  if (clean.includes('heal') || clean.includes('sick') || clean.includes('health') || clean.includes('surger') || clean.includes('cancer')) {
    return 'Health & Healing';
  }
  if (clean.includes('grief') || clean.includes('comfort') || clean.includes('loss') || clean.includes('pass') || clean.includes('mourn')) {
    return 'Comfort & Grief';
  }
  if (clean.includes('fam') || clean.includes('marri') || clean.includes('child') || clean.includes('parent') || clean.includes('spous')) {
    return 'Family & Relationships';
  }
  if (clean.includes('spirit') || clean.includes('faith') || clean.includes('growth') || clean.includes('salvat') || clean.includes('bibl')) {
    return 'Spiritual Growth';
  }
  if (clean.includes('miss') || clean.includes('outreach') || clean.includes('evangel') || clean.includes('communit')) {
    return 'Missions & Outreach';
  }
  if (clean.includes('praise') || clean.includes('thank') || clean.includes('testim') || clean.includes('answer')) {
    return 'Praise & Thanksgiving';
  }
  if (clean.includes('guid') || clean.includes('provis') || clean.includes('job') || clean.includes('finan') || clean.includes('decis')) {
    return 'Guidance & Provision';
  }

  return 'General';
}

export function normalizeVisibility(visStr?: string): VisibilityType {
  if (!visStr) return 'church';
  const clean = visStr.trim().toLowerCase();
  if (clean.includes('priv') || clean.includes('staff') || clean.includes('confid') || clean.includes('secret')) {
    return 'private';
  }
  if (clean.includes('glob') || clean.includes('pub') || clean.includes('world') || clean.includes('net')) {
    return 'global';
  }
  return 'church';
}

export function parseBoolean(val?: string): boolean {
  if (!val) return false;
  const clean = val.trim().toLowerCase();
  return clean === 'true' || clean === 'yes' || clean === 'y' || clean === '1' || clean === 'urgent';
}

/**
 * Robust CSV parser that handles commas inside quotes, multiline values, and escaped quotes.
 */
export function parseCSVToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Skip carriage return
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses CSV raw rows into validated prayer requests.
 */
export function parseCSVToPrayerRequests(csvText: string): ParsedPrayerRow[] {
  const rawRows = parseCSVToRows(csvText);
  if (rawRows.length === 0) return [];

  // Determine headers
  const headerRow = rawRows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  // Check if first row is actually a header
  const hasHeader = headerRow.some((h) =>
    ['title', 'subject', 'content', 'details', 'request', 'name', 'requester', 'category'].includes(h)
  );

  let colTitle = -1;
  let colContent = -1;
  let colName = -1;
  let colCategory = -1;
  let colVisibility = -1;
  let colUrgent = -1;
  let colEmail = -1;
  let colPhone = -1;
  let colAnswered = -1;
  let dataRows: string[][] = [];

  if (hasHeader) {
    dataRows = rawRows.slice(1);
    headerRow.forEach((h, idx) => {
      if (h.includes('title') || h === 'subject') colTitle = idx;
      else if (h.includes('content') || h.includes('detail') || h.includes('desc') || h.includes('body') || h === 'request' || h.includes('prayerrequest')) colContent = idx;
      else if (h.includes('name') || h.includes('requester') || h.includes('author') || h.includes('from') || h.includes('submitter')) colName = idx;
      else if (h.includes('cat') || h.includes('type')) colCategory = idx;
      else if (h.includes('visib') || h.includes('priv') || h.includes('access')) colVisibility = idx;
      else if (h.includes('urgent') || h.includes('prior') || h.includes('emerg')) colUrgent = idx;
      else if (h.includes('email') || h.includes('mail')) colEmail = idx;
      else if (h.includes('phone') || h.includes('cell') || h.includes('tel')) colPhone = idx;
      else if (h.includes('answer') || h.includes('praise')) colAnswered = idx;
    });
  } else {
    // Positional fallback
    dataRows = rawRows;
    colTitle = 0;
    colContent = 1;
    colName = 2;
    colCategory = 3;
    colVisibility = 4;
    colUrgent = 5;
  }

  // Fallback defaults if title or content columns weren't explicitly found
  if (colTitle === -1) colTitle = 0;
  if (colContent === -1) colContent = colTitle === 0 ? 1 : 0;

  return dataRows.map((row, idx) => {
    const title = (row[colTitle] || '').trim();
    const content = (row[colContent] || '').trim();
    const name = colName >= 0 ? (row[colName] || '').trim() : '';
    const categoryRaw = colCategory >= 0 ? (row[colCategory] || '').trim() : '';
    const visibilityRaw = colVisibility >= 0 ? (row[colVisibility] || '').trim() : '';
    const urgentRaw = colUrgent >= 0 ? (row[colUrgent] || '').trim() : '';
    const emailRaw = colEmail >= 0 ? (row[colEmail] || '').trim() : '';
    const phoneRaw = colPhone >= 0 ? (row[colPhone] || '').trim() : '';
    const answeredRaw = colAnswered >= 0 ? (row[colAnswered] || '').trim() : '';

    const isValid = Boolean(title.length > 0 || content.length > 0);
    const finalTitle = title || (content.length > 50 ? content.substring(0, 47) + '...' : content) || 'Prayer Request';
    const finalContent = content || title || 'Please lift this request in prayer.';
    const isAnonymous = !name || name.toLowerCase() === 'anonymous' || name.toLowerCase() === 'anon';

    return {
      id: `row-${idx}-${Date.now()}`,
      title: finalTitle,
      content: finalContent,
      requesterName: isAnonymous ? 'Anonymous' : (name || 'Church Member'),
      requesterEmail: emailRaw || undefined,
      requesterPhone: phoneRaw || undefined,
      category: normalizeCategory(categoryRaw),
      visibility: normalizeVisibility(visibilityRaw),
      isUrgent: parseBoolean(urgentRaw),
      isAnswered: parseBoolean(answeredRaw),
      isAnonymous,
      status: 'approved',
      selected: isValid,
      isValid,
      validationError: !isValid ? 'Row must contain a Title or Details.' : undefined,
    };
  });
}

export const SAMPLE_CSV_CONTENT = `Title,Content,Requester Name,Category,Visibility,Is Urgent,Requester Email,Requester Phone,Is Answered
"Healing for Harold's surgery","Please pray for Harold's hip replacement surgery scheduled this Thursday morning. Pray for guidance for Dr. Henderson and quick pain relief.","Harold & Eleanor Vance","Health & Healing","church","false","vance.h@gmail.com","(555) 345-6789","false"
"Comfort for the Miller Family","Our neighbors the Millers lost their grandfather unexpectedly this weekend. Pray for peace that surpasses all understanding for the children.","Sarah Jenkins","Comfort & Grief","church","true","","","false"
"Praise for new job provision!","Praise God! After 5 months of searching and prayer, the Lord opened the door to a wonderful position at Blount Medical Center. Thank you church family for your prayers!","Michael Chen","Praise & Thanksgiving","church","false","mchen@gmail.com","(555) 890-1234","true"
"Confidential prayer for marriage healing","Pastoral staff, please hold our family in confidential prayer during this challenging season. Trusting the Lord for restoration.","Anonymous","Family & Relationships","private","false","","","false"
"Youth Missions Trip to Appalachia","Lifting up our 18 high school students and chaperones heading out next week for summer home repair mission outreach in Mountain City.","Pastor Mark Rodriguez","Missions & Outreach","church","false","mark@church.org","","false"`;
