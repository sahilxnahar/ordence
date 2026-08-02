import "server-only";

/**
 * Transactional email via Resend.
 *
 * Deliberately fail-soft: with no API key configured the send is logged
 * and reported as skipped rather than throwing. A missing key must never
 * lose a signup — the request is already durably in KV by the time we
 * try to notify anyone, so email is a notification channel, not the
 * system of record.
 *
 * Setup: npx wrangler secret put RESEND_API_KEY
 */

const FROM = "Ordence <onboarding@ordence.com>";

export interface EmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

async function getEnvValue(key: string): Promise<string | undefined> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const value = (env as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
  } catch {
    /* not running on Workers — fall through to process.env */
  }
  return process.env[key];
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const apiKey = await getEnvValue("RESEND_API_KEY");

  if (!apiKey) {
    console.log(
      `[ordence:email] RESEND_API_KEY not set — would have sent "${subject}" to ${to}`,
    );
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const error = await res.text();
      console.error("[ordence:email] send failed:", res.status, error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (error) {
    console.error("[ordence:email] send threw:", error);
    return { ok: false, error: String(error) };
  }
}

/** Shared shell so every Ordence email looks like the brand. */
export function emailShell(bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:32px;background:#faf9f6;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111827">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(17,24,39,.12);border-radius:16px">
    <tr><td style="padding:32px">
      <p style="margin:0 0 24px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#6d45e8;font-weight:600">Ordence</p>
      ${bodyHtml}
    </td></tr>
  </table>
  <p style="max-width:560px;margin:20px auto 0;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a92a6;text-align:center">ordence.com — the operating system for ambitious businesses</p>
</body></html>`;
}

export function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#111827;color:#faf9f6;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:600;font-size:14px">${label}</a>`;
}
