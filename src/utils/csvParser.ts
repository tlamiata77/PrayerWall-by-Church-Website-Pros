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
  createdAt?: string;
  originalDateStr?: string;
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

export function isDateString(val?: string): boolean {
  if (!val) return false;
  const clean = val.trim();
  if (clean.length < 4 || clean.length > 35) return false;

  // YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}(\s.*|T.*)?$/.test(clean)) return true;

  // MM/DD/YYYY or DD/MM/YYYY or M/D/YY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}(\s.*)?$/.test(clean)) return true;

  // Month and day without a year, like 10-18 or 10/18
  if (/^\d{1,2}[-/]\d{1,2}$/.test(clean)) return true;

  // Month names like "October 4, 2026" or "Oct 4"
  if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(,?\s+\d{2,4})?/i.test(clean)) return true;

  return false;
}

export function parseDateToISO(val?: string): string | undefined {
  if (!val) return undefined;
  const clean = val.trim();
  if (!isDateString(clean)) return undefined;

  // Check YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }

  // Check MM/DD/YYYY or M/D/YYYY
  const usMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (usMatch) {
    const m = parseInt(usMatch[1], 10) - 1;
    const d = parseInt(usMatch[2], 10);
    let y = parseInt(usMatch[3], 10);
    if (y < 100) y += 2000;
    const dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }

  // Month and day without a year: this year, or last year if that date is still ahead
  const mdMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (mdMatch) {
    const m = parseInt(mdMatch[1], 10) - 1;
    const d = parseInt(mdMatch[2], 10);
    if (m > 11 || d < 1 || d > 31) return undefined;
    const now = new Date();
    let dt = new Date(Date.UTC(now.getFullYear(), m, d, 12, 0, 0));
    if (dt.getTime() > now.getTime() + 86400000) dt = new Date(Date.UTC(now.getFullYear() - 1, m, d, 12, 0, 0));
    return dt.toISOString();
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  return undefined;
}

export function healPrayerRequest<
  T extends {
    title: string;
    content: string;
    createdAt?: string;
    bulletinSummary?: string;
    category?: RequestCategory;
    isAnswered?: boolean;
    [key: string]: any;
  }
>(req: T): T {
  let title = (req.title || '').trim();
  let content = (req.content || '').trim();
  let bulletinSummary = (req.bulletinSummary || '').trim();
  let createdAt = req.createdAt || new Date().toISOString();
  let category: RequestCategory = req.category || 'General';
  let isAnswered = Boolean(req.isAnswered);

  // If title is a date string, extract date and fix title
  if (isDateString(title)) {
    const parsedDate = parseDateToISO(title);
    if (parsedDate) createdAt = parsedDate;
    title = content && !isDateString(content)
      ? (content.length > 70 ? content.substring(0, 67) + '...' : content)
      : 'Prayer Request';
  }

  // If bulletinSummary is a date string or missing, fix it
  if (!bulletinSummary || isDateString(bulletinSummary)) {
    bulletinSummary = title && !isDateString(title)
      ? title
      : content && !isDateString(content)
      ? content
      : 'Prayer Request';
  }

  // Clean titles: strip bracketed class names like [Joy] from title if present
  let cleanTitle = title.replace(/^\[[^\]]+\]\s*/, '');
  if (!cleanTitle || isDateString(cleanTitle)) {
    cleanTitle = content.replace(/^\[[^\]]+\]\s*/, '') || 'Prayer Request';
  }

  const reqName = (req.requesterName || '').trim().toLowerCase();
  const cleanTitleLower = cleanTitle.toLowerCase();

  // If title was erroneously set to requesterName (e.g., "Wanda D.", "Karen", "Sue S.")
  // or Sunday School class name (e.g., "Joy"), recover the actual prayer statement from content!
  if (
    cleanTitleLower === reqName ||
    cleanTitleLower === 'joy' ||
    cleanTitleLower === 'pairs & spares' ||
    cleanTitleLower === 'pairs & spares / the seekers' ||
    cleanTitleLower === 'thursday night ladies bible study' ||
    (reqName && reqName.length > 2 && cleanTitleLower === reqName)
  ) {
    const rawContentNoClass = content.replace(/^\[[^\]]+\]\s*/, '').trim();
    if (rawContentNoClass && !isDateString(rawContentNoClass) && rawContentNoClass.toLowerCase() !== reqName) {
      cleanTitle = rawContentNoClass.length > 65
        ? rawContentNoClass.substring(0, 62) + '...'
        : rawContentNoClass;
    }
  }

  // If requesterName was accidentally set to Sunday School class name like "Joy"
  let requesterName = req.requesterName || 'Church Member';
  if (
    requesterName.toLowerCase() === 'joy' ||
    requesterName.toLowerCase().includes('pairs & spares') ||
    requesterName.toLowerCase().includes('bible study')
  ) {
    requesterName = 'Sunday School Class Member';
  }

  // Re-normalize category with content context
  const fullText = `${cleanTitle} ${content}`;
  category = normalizeCategory(category, fullText);

  if (
    category === 'Praise & Thanksgiving' ||
    fullText.toLowerCase().includes('praise') ||
    fullText.toLowerCase().includes('thankful') ||
    fullText.toLowerCase().includes('answered')
  ) {
    isAnswered = true;
    category = 'Praise & Thanksgiving';
  }

  return {
    ...req,
    title: cleanTitle,
    requesterName,
    content: content || cleanTitle,
    createdAt,
    bulletinSummary: cleanTitle,
    category,
    isAnswered,
  } as T;
}

export function normalizeCategory(catStr?: string, contentStr?: string): RequestCategory {
  const clean = (catStr || '').trim().toLowerCase();
  const content = (contentStr || '').trim().toLowerCase();
  const text = `${clean} ${content}`;

  // Direct matches
  for (const cat of VALID_CATEGORIES) {
    if (cat.toLowerCase() === clean) return cat;
  }

  // Health & Healing
  if (
    clean === 'health' ||
    clean.includes('heal') ||
    clean.includes('sick') ||
    clean.includes('medical') ||
    clean.includes('doctor') ||
    clean.includes('surger') ||
    clean.includes('cancer') ||
    clean.includes('bleed') ||
    clean.includes('injury') ||
    clean.includes('palsy') ||
    clean.includes('pain') ||
    clean.includes('hospital') ||
    text.includes('gi doctor') ||
    text.includes('laser treatment') ||
    text.includes('testing for toxicity') ||
    text.includes('oxygen dependent') ||
    text.includes('brain bleed') ||
    text.includes('back trouble') ||
    text.includes('back injury') ||
    text.includes('heart surgery') ||
    text.includes('breathing and meds') ||
    text.includes('patricia neal') ||
    text.includes('cancer doctor') ||
    text.includes('shoulder and arm pain') ||
    text.includes('ccu') ||
    text.includes('heart attack') ||
    text.includes('not feeling well')
  ) {
    return 'Health & Healing';
  }

  // Praise & Thanksgiving
  if (
    clean === 'praise' ||
    clean.includes('thank') ||
    clean.includes('answer') ||
    clean.includes('testim') ||
    text.includes('does not have to go back to ut') ||
    text.includes('starting work on their house') ||
    text.includes('fish fry') ||
    text.includes('great-grandbaby') ||
    text.includes('thankful') ||
    text.includes('praises')
  ) {
    return 'Praise & Thanksgiving';
  }

  // Comfort & Grief
  if (
    clean === 'grief' ||
    clean.includes('grief') ||
    clean.includes('comfort') ||
    clean.includes('loss') ||
    clean.includes('pass') ||
    clean.includes('mourn') ||
    clean.includes('funeral') ||
    clean.includes('bereav') ||
    text.includes('passed away')
  ) {
    return 'Comfort & Grief';
  }

  // Spiritual Growth
  if (
    clean === 'salvation' ||
    clean.includes('salvat') ||
    clean.includes('spirit') ||
    clean.includes('faith') ||
    clean.includes('growth') ||
    clean.includes('convict') ||
    clean.includes('baptism') ||
    clean.includes('bibl') ||
    text.includes('salvation') ||
    text.includes('conviction')
  ) {
    return 'Spiritual Growth';
  }

  // Family & Relationships
  if (
    clean === 'family' ||
    clean === 'unspoken' ||
    clean === 'travel' ||
    clean.includes('fam') ||
    clean.includes('marri') ||
    clean.includes('child') ||
    clean.includes('parent') ||
    clean.includes('spous') ||
    clean.includes('nephew') ||
    clean.includes('mother') ||
    clean.includes('father') ||
    clean.includes('sister') ||
    clean.includes('brother') ||
    clean.includes('daughter') ||
    clean.includes('son') ||
    clean.includes('sil') ||
    clean.includes('travel') ||
    text.includes('in-laws') ||
    text.includes('unspoken') ||
    text.includes('travel') ||
    text.includes('sil') ||
    text.includes('niece')
  ) {
    return 'Family & Relationships';
  }

  // Missions & Outreach
  if (
    clean.includes('miss') ||
    clean.includes('outreach') ||
    clean.includes('evangel') ||
    clean.includes('communit') ||
    text.includes('luncheon') ||
    text.includes('mission') ||
    text.includes('outreach')
  ) {
    return 'Missions & Outreach';
  }

  // Guidance & Provision
  if (
    clean.includes('guid') ||
    clean.includes('provis') ||
    clean.includes('job') ||
    clean.includes('finan') ||
    clean.includes('decis') ||
    clean.includes('hous')
  ) {
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

export interface CSVColumnMapping {
  colDate: number;
  colName: number;
  colTitle: number;
  colContent: number;
  colRequest: number;
  colClass: number;
  colType: number;
  colCategory: number;
  colVisibility: number;
  colUrgent: number;
  colEmail: number;
  colPhone: number;
  colAnswered: number;
}

/**
 * Intelligently analyzes headers and sample row values to detect column mappings.
 */
export function detectCSVColumnMapping(rawRows: string[][]): {
  mapping: CSVColumnMapping;
  headers: string[];
  hasHeader: boolean;
} {
  if (rawRows.length === 0) {
    return {
      mapping: {
        colDate: -1,
        colName: -1,
        colTitle: -1,
        colContent: -1,
        colRequest: -1,
        colClass: -1,
        colType: -1,
        colCategory: -1,
        colVisibility: -1,
        colUrgent: -1,
        colEmail: -1,
        colPhone: -1,
        colAnswered: -1,
      },
      headers: [],
      hasHeader: false,
    };
  }

  const firstRow = rawRows[0];
  const cleanedHeaders = firstRow.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  const hasHeader = cleanedHeaders.some((h) =>
    ['date', 'time', 'timestamp', 'created', 'submitted', 'title', 'subject', 'content', 'details', 'request', 'name', 'requester', 'category', 'class', 'type'].includes(h)
  );

  const sampleRows = hasHeader ? rawRows.slice(1, 10) : rawRows.slice(0, 10);
  const colCount = Math.max(...rawRows.map((r) => r.length), firstRow.length);
  const headers = hasHeader
    ? firstRow
    : Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);

  let colDate = -1;
  let colTitle = -1;
  let colContent = -1;
  let colRequest = -1;
  let colClass = -1;
  let colType = -1;
  let colName = -1;
  let colCategory = -1;
  let colVisibility = -1;
  let colUrgent = -1;
  let colEmail = -1;
  let colPhone = -1;
  let colAnswered = -1;

  // 1. Identify columns from headers
  if (hasHeader) {
    cleanedHeaders.forEach((h, idx) => {
      if (h.includes('date') || h.includes('time') || h === 'created' || h === 'submitted' || h.includes('timestamp') || h.includes('when')) {
        colDate = idx;
      } else if (h.includes('class') || h.includes('group') || h.includes('sundayschool') || h.includes('fellowship') || h.includes('study')) {
        colClass = idx;
      } else if (h === 'type' || h.includes('kind') || h.includes('recordtype')) {
        colType = idx;
        if (sampleRows.some((r) => (r[idx] || '').toLowerCase().includes('praise'))) {
          colAnswered = idx;
        }
      } else if (h.includes('title') || h === 'subject' || h.includes('short') || h.includes('summary') || h.includes('headline') || h.includes('statement') || h.includes('brief') || h.includes('topic')) {
        colTitle = idx;
      } else if (h.includes('content') || h.includes('detail') || h.includes('desc') || h.includes('body') || h.includes('note') || h.includes('explanation') || h.includes('message')) {
        colContent = idx;
      } else if (h === 'request' || h === 'requests' || h.includes('prayer') || h.includes('need') || h.includes('petition')) {
        colRequest = idx;
      } else if (h.includes('email') || h.includes('mail')) {
        colEmail = idx;
      } else if (h.includes('phone') || h.includes('cell') || h.includes('tel')) {
        colPhone = idx;
      } else if (h.includes('name') || h.includes('requester') || h.includes('author') || h.includes('from') || h.includes('submitter') || h.includes('member') || h.includes('person') || h.includes('who')) {
        if (colName === -1) colName = idx;
      } else if (h.includes('cat') || h.includes('ministry') || h.includes('tag')) {
        colCategory = idx;
      } else if (h.includes('visib') || h.includes('priv') || h.includes('access')) {
        colVisibility = idx;
      } else if (h.includes('urgent') || h.includes('prior') || h.includes('emerg')) {
        colUrgent = idx;
      } else if (h.includes('answer') || h.includes('praise')) {
        colAnswered = idx;
      }
    });
  }

  // 2. Data-driven detection for Date column if not found via header
  if (colDate === -1 && sampleRows.length > 0) {
    for (let c = 0; c < colCount; c++) {
      const dateCount = sampleRows.filter((r) => r[c] && isDateString(r[c])).length;
      if (dateCount >= 1) {
        colDate = c;
        break;
      }
    }
  }

  // 3. Resolve Title & Content
  if (colRequest >= 0) {
    if (colTitle === -1) colTitle = colRequest;
    if (colContent === -1) colContent = colRequest;
  } else if (colTitle === -1 && colContent >= 0) {
    colTitle = colContent;
  } else if (colTitle >= 0 && colContent === -1) {
    colContent = colTitle;
  } else if (colTitle === -1 && colContent === -1) {
    // Find candidate text columns that are NOT date, name, class, type, category
    const remainingCols = [];
    for (let c = 0; c < colCount; c++) {
      if (c !== colDate && c !== colName && c !== colClass && c !== colType && c !== colEmail && c !== colPhone && c !== colCategory) {
        remainingCols.push(c);
      }
    }
    if (remainingCols.length > 0) {
      colTitle = remainingCols[0];
      colContent = remainingCols.length > 1 ? remainingCols[1] : remainingCols[0];
    }
  }

  // Ensure colTitle and colContent NEVER point to colDate!
  if (colDate >= 0) {
    if (colTitle === colDate) {
      colTitle = colRequest >= 0 && colRequest !== colDate ? colRequest : colContent !== colDate ? colContent : -1;
    }
    if (colContent === colDate) {
      colContent = colRequest >= 0 && colRequest !== colDate ? colRequest : colTitle !== colDate ? colTitle : -1;
    }
  }

  return {
    mapping: {
      colDate,
      colName,
      colTitle,
      colContent,
      colRequest,
      colClass,
      colType,
      colCategory,
      colVisibility,
      colUrgent,
      colEmail,
      colPhone,
      colAnswered,
    },
    headers,
    hasHeader,
  };
}

/**
 * Parses CSV raw text into validated prayer requests with automatic date extraction and clean title mapping.
 */
export function parseCSVToPrayerRequests(
  csvText: string,
  customMapping?: Partial<CSVColumnMapping>
): ParsedPrayerRow[] {
  const rawRows = parseCSVToRows(csvText);
  if (rawRows.length === 0) return [];

  const { mapping: autoMapping, hasHeader } = detectCSVColumnMapping(rawRows);
  const mapping: CSVColumnMapping = {
    ...autoMapping,
    ...customMapping,
  };

  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
  let lastSeenDate: string | undefined = undefined;

  return dataRows.map((row, idx) => {
    // Extract date
    const rawDate = mapping.colDate >= 0 ? (row[mapping.colDate] || '').trim() : '';
    let parsedDate = parseDateToISO(rawDate);
    if (parsedDate) {
      lastSeenDate = parsedDate;
    } else if (lastSeenDate) {
      parsedDate = lastSeenDate;
    }

    // Extract title (short statement), content, request, class
    let rawTitle = mapping.colTitle >= 0 ? (row[mapping.colTitle] || '').trim() : '';
    let rawContent = mapping.colContent >= 0 ? (row[mapping.colContent] || '').trim() : '';
    let rawRequest = mapping.colRequest >= 0 ? (row[mapping.colRequest] || '').trim() : '';
    const className = mapping.colClass >= 0 ? (row[mapping.colClass] || '').trim() : '';
    const typeVal = mapping.colType >= 0 ? (row[mapping.colType] || '').trim() : '';

    // CRITICAL: If rawTitle, rawContent, or rawRequest is a date string, immediately discard it as text!
    if (isDateString(rawTitle)) {
      if (!parsedDate) parsedDate = parseDateToISO(rawTitle);
      rawTitle = '';
    }
    if (isDateString(rawContent)) {
      if (!parsedDate) parsedDate = parseDateToISO(rawContent);
      rawContent = '';
    }
    if (isDateString(rawRequest)) {
      if (!parsedDate) parsedDate = parseDateToISO(rawRequest);
      rawRequest = '';
    }

    const name = mapping.colName >= 0 ? (row[mapping.colName] || '').trim() : '';
    const categoryRaw = mapping.colCategory >= 0 ? (row[mapping.colCategory] || '').trim() : '';
    const visibilityRaw = mapping.colVisibility >= 0 ? (row[mapping.colVisibility] || '').trim() : '';
    const urgentRaw = mapping.colUrgent >= 0 ? (row[mapping.colUrgent] || '').trim() : '';
    const emailRaw = mapping.colEmail >= 0 ? (row[mapping.colEmail] || '').trim() : '';
    const phoneRaw = mapping.colPhone >= 0 ? (row[mapping.colPhone] || '').trim() : '';
    const answeredRaw = mapping.colAnswered >= 0 ? (row[mapping.colAnswered] || '').trim() : '';

    // Determine core prayer text: the details column wins over the title/request column
    let prayerText = rawContent || rawRequest || rawTitle;
    if (!prayerText || isDateString(prayerText)) {
      prayerText = 'Please lift this request in prayer.';
    }

    // Include Sunday School / Small Group class name in content if provided
    let finalContent = prayerText;
    if (className && !finalContent.includes(className)) {
      finalContent = `[${className}] ${prayerText}`;
    }

    // Derive concise, clean card title (short statement) - NEVER a date!
    let finalTitle = rawTitle;
    if (!finalTitle || isDateString(finalTitle) || (name && finalTitle.trim().toLowerCase() === name.trim().toLowerCase())) {
      // Use prayer text directly if short, or summarize first line
      finalTitle = prayerText.length > 55 ? prayerText.substring(0, 52) + '...' : prayerText;
    }
    if (!finalTitle || isDateString(finalTitle)) {
      finalTitle = 'Prayer Request';
    }

    // Check praise status
    const isAnswered =
      parseBoolean(answeredRaw) ||
      typeVal.toLowerCase().includes('praise') ||
      categoryRaw.toLowerCase().includes('praise') ||
      answeredRaw.toLowerCase().includes('praise');

    const determinedCategory = isAnswered
      ? 'Praise & Thanksgiving'
      : normalizeCategory(categoryRaw, prayerText);

    const isValid = Boolean(
      (finalTitle && !isDateString(finalTitle)) ||
      (finalContent && !isDateString(finalContent))
    );

    const isAnonymous = !name || name.toLowerCase() === 'anonymous' || name.toLowerCase() === 'anon';

    return {
      id: `row-${idx}-${Date.now()}`,
      title: finalTitle,
      content: finalContent,
      requesterName: isAnonymous ? 'Anonymous' : (name || 'Church Member'),
      requesterEmail: emailRaw || undefined,
      requesterPhone: phoneRaw || undefined,
      category: determinedCategory,
      visibility: normalizeVisibility(visibilityRaw),
      isUrgent: parseBoolean(urgentRaw),
      isAnswered,
      isAnonymous,
      status: 'approved',
      selected: isValid,
      isValid,
      createdAt: parsedDate,
      originalDateStr: rawDate || (isDateString(row[0]) ? row[0] : undefined),
      validationError: !isValid ? 'Row must contain a Prayer Request statement.' : undefined,
    };
  });
}

export const SAMPLE_CSV_CONTENT = `Title,Content,Requester Name,Category,Visibility,Is Urgent,Requester Email,Requester Phone,Is Answered
"Healing for Harold's surgery","Please pray for Harold's hip replacement surgery scheduled this Thursday morning. Pray for guidance for Dr. Henderson and quick pain relief.","Harold & Eleanor Vance","Health & Healing","church","false","vance.h@gmail.com","(555) 345-6789","false"
"Comfort for the Miller Family","Our neighbors the Millers lost their grandfather unexpectedly this weekend. Pray for peace that surpasses all understanding for the children.","Sarah Jenkins","Comfort & Grief","church","true","","","false"
"Praise for new job provision!","Praise God! After 5 months of searching and prayer, the Lord opened the door to a wonderful position at Blount Medical Center. Thank you church family for your prayers!","Michael Chen","Praise & Thanksgiving","church","false","mchen@gmail.com","(555) 890-1234","true"
"Confidential prayer for marriage healing","Pastoral staff, please hold our family in confidential prayer during this challenging season. Trusting the Lord for restoration.","Anonymous","Family & Relationships","private","false","","","false"
"Youth Missions Trip to Appalachia","Lifting up our 18 high school students and chaperones heading out next week for summer home repair mission outreach in Mountain City.","Pastor Mark Rodriguez","Missions & Outreach","church","false","mark@church.org","","false"`;
