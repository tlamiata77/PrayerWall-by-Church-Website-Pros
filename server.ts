import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gemini SDK on the server only
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Basic heuristic safety check as immediate first-pass / fallback
function fallbackHeuristicCheck(title: string, content: string) {
  const text = `${title} ${content}`.toLowerCase();
  
  const severeProfanity = ['fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'nigger', 'faggot', 'whore', 'slut'];
  const spamKeywords = ['viagra', 'crypto pump', 'buy followers', 'casino', 'free bitcoin', 'telegram @', 'whatsapp +', 'loan offer'];
  const crisisKeywords = ['kill myself', 'suicide', 'end my life', 'want to die', 'slit my wrists', 'overdose'];

  const foundSevere = severeProfanity.filter(word => text.includes(word));
  const foundSpam = spamKeywords.filter(word => text.includes(word));
  const foundCrisis = crisisKeywords.filter(word => text.includes(word));

  if (foundCrisis.length > 0) {
    return {
      status: 'flagged' as const,
      safetyScore: 35,
      flags: ['crisis_distress'],
      reason: 'Contains expressions of acute emotional crisis or self-harm risk. Immediate pastoral care outreach recommended.',
      pastoralRecommendation: 'keep_private' as const,
      suggestedCategory: 'Comfort & Grief',
      suggestedBulletinSummary: 'Pray for comfort, peace, and God’s healing presence during an intense trial.',
      crisisAssistanceDetected: true,
    };
  }

  if (foundSevere.length > 0) {
    return {
      status: 'rejected' as const,
      safetyScore: 10,
      flags: ['inappropriate_language', 'profanity'],
      reason: `Flagged for inappropriate language or vulgarity (${foundSevere.join(', ')}).`,
      pastoralRecommendation: 'decline' as const,
      suggestedCategory: 'General',
      suggestedBulletinSummary: '',
      crisisAssistanceDetected: false,
    };
  }

  if (foundSpam.length > 0 || text.includes('http://') || text.includes('https://') || text.includes('.com/')) {
    return {
      status: 'flagged' as const,
      safetyScore: 40,
      flags: ['commercial_spam', 'links_detected'],
      reason: 'Contains external web link or commercial keywords that require staff review.',
      pastoralRecommendation: 'review_needed' as const,
      suggestedCategory: 'General',
      suggestedBulletinSummary: 'Pray for guidance and blessings.',
      crisisAssistanceDetected: false,
    };
  }

  return {
    status: 'approved' as const,
    safetyScore: 98,
    flags: [],
    reason: 'Content is respectful, supportive, and appropriate for church community prayer.',
    pastoralRecommendation: 'approve_public' as const,
    suggestedCategory: 'Health & Healing',
    suggestedBulletinSummary: title.length > 10 ? title : 'Lifting up needs in prayer before our Lord.',
    crisisAssistanceDetected: false,
  };
}

/**
 * POST /api/moderate
 * Evaluates a prayer request for community safety, profanity, spam, and crisis flags.
 * Also suggests a clean 1-sentence bulletin summary and appropriate category.
 */
app.post('/api/moderate', async (req: Request, res: Response) => {
  try {
    const { title = '', content = '', requesterName = '', visibility = 'church' } = req.body;

    if (!title && !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    // If Gemini is available, use Gemini 3.8 Flash for intelligent nuanced moderation
    if (ai) {
      try {
        const prompt = `You are an empathetic, discerning church ministry pastoral assistant and community safety moderator.
Analyze the following prayer request submitted to a church prayer wall:
Requester: "${requesterName || 'Anonymous'}"
Title: "${title}"
Details: "${content}"
Requested Visibility: "${visibility}" (private = staff only, church = local congregation wall, global = multi-church network wall)

Evaluate the request:
1. Is it supportive, reverent, and safe for a public church congregation wall?
2. Does it contain profanity, vulgarity, hate speech, harassment, or mockery of faith?
3. Does it contain commercial spam, advertising, or suspicious phishing links?
4. Does it reveal overly sensitive private information without consent (e.g. accusations of crimes, medical gossip about third parties, SSN)?
5. Does it express acute mental health crisis or self-harm (where pastoral intervention and crisis hotline support is crucial)?
6. Provide a concise, dignified 1-sentence bulletin summary suitable for printing in a Sunday church bulletin or prayer sheet (protecting modesty and privacy if needed).
7. Suggest the best category ('Health & Healing', 'Comfort & Grief', 'Family & Relationships', 'Spiritual Growth', 'Missions & Outreach', 'Praise & Thanksgiving', 'Guidance & Provision', 'General').`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                status: {
                  type: Type.STRING,
                  description: "'approved' if safe for public wall; 'flagged' if needs staff review/pastoral discernment; 'rejected' if blatant abuse/profanity/spam.",
                },
                safetyScore: {
                  type: Type.NUMBER,
                  description: 'Safety score from 0 to 100 (100 is completely wholesome).',
                },
                flags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Specific flags if any, e.g. ['inappropriate_language', 'commercial_spam', 'sensitive_personal_info', 'crisis_distress', 'interpersonal_conflict'].",
                },
                reason: {
                  type: Type.STRING,
                  description: 'Pastoral explanation of why it was approved, flagged, or rejected.',
                },
                pastoralRecommendation: {
                  type: Type.STRING,
                  description: "'approve_public', 'review_needed', 'keep_private', or 'decline'.",
                },
                suggestedCategory: {
                  type: Type.STRING,
                  description: "Suggested ministry category name.",
                },
                suggestedBulletinSummary: {
                  type: Type.STRING,
                  description: "Respectful, compact 1-sentence prayer request suitable for a Sunday printed bulletin.",
                },
                crisisAssistanceDetected: {
                  type: Type.BOOLEAN,
                  description: 'True if requester expresses acute despair, self-harm, or suicidal crisis.',
                },
              },
              required: [
                'status',
                'safetyScore',
                'flags',
                'reason',
                'pastoralRecommendation',
                'suggestedCategory',
                'suggestedBulletinSummary',
                'crisisAssistanceDetected',
              ],
            },
          },
        });

        const jsonText = response.text?.trim() || '';
        const parsed = JSON.parse(jsonText);
        res.json({
          success: true,
          provider: 'gemini-3.8-flash',
          data: parsed,
        });
        return;
      } catch (err: any) {
        console.warn('Gemini API call failed, using heuristic fallback:', err?.message || err);
      }
    }

    // Heuristic fallback if Gemini is offline or not configured
    const fallbackResult = fallbackHeuristicCheck(title, content);
    res.json({
      success: true,
      provider: 'heuristic_engine',
      data: fallbackResult,
    });
  } catch (error: any) {
    console.error('Error in /api/moderate:', error);
    res.status(500).json({ error: error.message || 'Moderation check failed' });
  }
});

/**
 * POST /api/bulletin-summary
 * Condenses a prayer request into a polished, print-ready church bulletin entry
 */
app.post('/api/bulletin-summary', async (req: Request, res: Response) => {
  try {
    const { title = '', content = '', requesterName = '' } = req.body;

    if (!title && !content) {
      res.status(400).json({ error: 'Title or content required' });
      return;
    }

    if (ai) {
      try {
        const prompt = `Condense this prayer request into a dignified, reverent 1-sentence line for a printed Sunday church bulletin.
Requester: ${requesterName || 'A church member'}
Title: ${title}
Details: ${content}

Format: Return just the 1 sentence prayer point, e.g. "Pray for Brother John and family as he recovers from hip replacement surgery."`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const summary = response.text?.trim().replace(/^"|"$/g, '') || title;
        res.json({ success: true, summary });
        return;
      } catch (err) {
        console.warn('Gemini bulletin summary failed:', err);
      }
    }

    // Fallback
    const fallback = `${title} (Pray for ${requesterName || 'our church family'})`;
    res.json({ success: true, summary: fallback });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Summary failed' });
  }
});

/**
 * POST /api/bulk-compress-bulletin
 * High-speed batch compression for churches with 50-100+ weekly requests.
 * Compresses each item into an ultra-concise 3-7 word prayer point for high-density printing.
 */
app.post('/api/bulk-compress-bulletin', async (req: Request, res: Response) => {
  try {
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Items array required' });
      return;
    }

    if (ai) {
      try {
        const prompt = `You are an expert church bulletin editor.
We have a weekly prayer list of many requests (approx 75 requests) that must fit onto a 1-page or 2-page printed Sunday bulletin insert.
Compress each of the following prayer requests into an ultra-short, dignified prayer point of 3 to 7 words maximum.
Do NOT write full sentences. Format like: "[Subject/Name] — [Key need in 3-5 words]".
Example: "Harold Sterling — Bypass surgery recovery"
Example: "Evelyn Miller family — Bereavement and comfort"
Example: "Honduras Mission Team — Safe travels & clinics"

Input items:
${JSON.stringify(items.map((it: any) => ({ id: it.id, name: it.requesterName || 'Member', title: it.title, text: it.content?.slice(0, 120) })))}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  ultraSummary: { type: Type.STRING, description: '3 to 7 word ultra-concise bulletin point' },
                },
                required: ['id', 'ultraSummary'],
              },
            },
          },
        });

        const jsonText = response.text?.trim() || '[]';
        const parsed = JSON.parse(jsonText);
        res.json({ success: true, results: parsed });
        return;
      } catch (err: any) {
        console.warn('Gemini bulk compression failed, using heuristic fallback:', err?.message || err);
      }
    }

    // Heuristic Fallback
    const results = items.map((it: any) => {
      const cleanTitle = it.title.replace(/^(prayer for|prayers for|please pray for)\s*/i, '');
      const words = cleanTitle.split(' ').slice(0, 6).join(' ');
      return {
        id: it.id,
        ultraSummary: `${it.requesterName ? `${it.requesterName} — ` : ''}${words}`,
      };
    });

    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Bulk compression failed' });
  }
});

/**
 * POST /api/generate-encouragement
 * Generates a warm, uplifting scripture-themed encouragement note for a requester
 */
app.post('/api/generate-encouragement', async (req: Request, res: Response) => {
  try {
    const { title = '', category = 'Health & Healing' } = req.body;

    if (ai) {
      try {
        const prompt = `Write a short, heartfelt, 2-sentence Christian encouragement and brief Bible verse reference for someone requesting prayer for "${title}" in category "${category}".
Tone: Gentle, compassionate, faith-filled, non-preachy.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        res.json({ success: true, encouragement: response.text?.trim() });
        return;
      } catch (err) {
        console.warn('Gemini encouragement failed:', err);
      }
    }

    res.json({
      success: true,
      encouragement: "May the Lord grant you peace and strength today. 'The Lord is near to all who call on Him.' (Psalm 145:18)",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Encouragement failed' });
  }
});

/**
 * POST /api/transcribe-audio
 * Accepts base64 encoded audio (e.g. audio/webm or audio/mp4 recorded from browser microphone)
 * and returns high-accuracy speech-to-text transcription using Gemini.
 */
app.post('/api/transcribe-audio', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64) {
      res.status(400).json({ error: 'Missing audio data' });
      return;
    }

    if (ai) {
      try {
        // Strip data: prefix if present
        const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            'Please accurately transcribe this spoken prayer request into clean, clear text. Transcribe the words exactly as spoken, with proper punctuation and capitalization. Output only the transcribed prayer request text without introductory or conversational phrases.',
          ],
        });

        const text = response.text?.trim() || '';
        res.json({ success: true, text });
        return;
      } catch (err: any) {
        console.warn('Gemini audio transcription model (gemini-3.5-transcribe) error, trying gemini-3.8-flash:', err?.message || err);
        try {
          const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
              'Please transcribe this audio into plain text. Provide only the transcription.',
            ],
          });
          const text = response.text?.trim() || '';
          res.json({ success: true, text });
          return;
        } catch (subErr: any) {
          console.warn('Fallback Gemini audio transcription also failed:', subErr?.message || subErr);
        }
      }
    }

    res.status(503).json({
      error: 'Audio transcription service currently unavailable. Please type your request or use browser voice dictation.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Transcription error' });
  }
});

// Setup Vite middleware for local development
async function start() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GraceWall server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
