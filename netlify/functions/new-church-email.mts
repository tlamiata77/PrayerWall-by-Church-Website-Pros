/**
 * Emails the super admin when a pastor registers a new church.
 *
 * Called by a Supabase Database Webhook on INSERT into public.admin_notifications
 * (each new church writes one row there). Netlify environment variables:
 *   RESEND_API_KEY   Resend API key with sending access
 *   WEBHOOK_SECRET   shared secret; the webhook sends it in the x-webhook-secret header
 *   NOTIFY_EMAIL     who gets the alert (optional, defaults to the super admin below)
 *   EMAIL_FROM       sender (optional)
 */

const DEFAULT_TO = 'tessa@churchwebsitepros.com';
const DEFAULT_FROM = 'PrayerKeeper <team@prayers.churchwebsitepros.com>';

interface WebhookPayload {
  type?: string;
  table?: string;
  record?: {
    kind?: string;
    message?: string;
    church_id?: string | null;
    created_at?: string;
  };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const record = payload.record;
  if (payload.type !== 'INSERT' || payload.table !== 'admin_notifications' || record?.kind !== 'church_registered') {
    // Nothing to email for other events; acknowledge so Supabase doesn't retry
    return new Response('Ignored', { status: 200 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return new Response('RESEND_API_KEY is not set', { status: 500 });

  const message = record.message || 'A new church registered on PrayerKeeper.';
  const siteUrl = process.env.URL || '';
  const when = record.created_at ? new Date(record.created_at).toUTCString() : new Date().toUTCString();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [process.env.NOTIFY_EMAIL || DEFAULT_TO],
      subject: 'New church registered on PrayerKeeper',
      text: `${message}\n\nRegistered: ${when}\n${siteUrl ? `\nReview it in the Super Admin Portal: ${siteUrl}\n` : ''}`,
      html: `<p>${escapeHtml(message)}</p><p style="color:#666">Registered: ${escapeHtml(when)}</p>${
        siteUrl ? `<p><a href="${escapeHtml(siteUrl)}">Open the Super Admin Portal</a></p>` : ''
      }`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('Resend error', res.status, detail);
    return new Response(`Email failed: ${detail}`, { status: 502 });
  }
  return new Response('Sent', { status: 200 });
};
