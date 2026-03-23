/**
 * Brevo (formerly Sendinblue) Email Service
 * Used to send invite emails to apartment members.
 *
 * Setup:
 * 1. Create account at https://app.brevo.com
 * 2. Go to SMTP & API → API Keys → Generate a new key
 * 3. Add to .env: VITE_BREVO_API_KEY=your_key_here
 * 4. Add your verified sender email: VITE_BREVO_SENDER_EMAIL=you@yourdomain.com
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
const SENDER_EMAIL  = import.meta.env.VITE_BREVO_SENDER_EMAIL || 'noreply@homeconnect.app';
const SENDER_NAME   = 'HomeConnect';

interface SendInviteEmailParams {
  toEmail: string;
  apartmentName: string;
  inviterName: string;
  unitNumber?: string;
  inviteToken: string;
}

/**
 * Sends an apartment invitation email via Brevo API
 */
export async function sendInviteEmail({
  toEmail,
  apartmentName,
  inviterName,
  unitNumber,
  inviteToken,
}: SendInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!BREVO_API_KEY) {
    console.warn('[Brevo] VITE_BREVO_API_KEY is not set. Email not sent.');
    return { success: false, error: 'Brevo API key not configured.' };
  }

  const joinUrl = `${window.location.origin}/join?token=${inviteToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:12px 20px;margin-bottom:16px;">
            <span style="font-size:24px;">🏢</span>
          </div>
          <h1 style="color:white;margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px;">You're Invited!</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:15px;">Join ${apartmentName} on HomeConnect</p>
        </div>

        <!-- Body -->
        <div style="padding:40px;">
          <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">
            Hi there! <strong>${inviterName}</strong> has invited you to join
            <strong>${apartmentName}</strong> on HomeConnect — your community management platform.
          </p>

          ${unitNumber ? `
          <div style="background:#eef2ff;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#4f46e5;font-weight:700;font-size:14px;">🏠 Your Assigned Unit: <span style="font-size:16px;">${unitNumber}</span></p>
          </div>
          ` : ''}

          <p style="color:#64748b;font-size:14px;margin:0 0 28px;">
            Click the button below to accept your invitation and sign in with Google:
          </p>

          <div style="text-align:center;margin-bottom:32px;">
            <a href="${joinUrl}"
               style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;padding:16px 40px;border-radius:14px;font-weight:900;font-size:16px;letter-spacing:0.3px;box-shadow:0 8px 20px rgba(79,70,229,0.3);">
              Accept Invitation →
            </a>
          </div>

          <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;">
            <p style="margin:0;color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Or copy this link</p>
            <p style="margin:6px 0 0;color:#4f46e5;font-size:13px;word-break:break-all;">${joinUrl}</p>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">
            This invite link expires in 7 days. If you didn't expect this email, you can safely ignore it.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;color:#cbd5e1;font-size:12px;">© 2024 HomeConnect · Built for modern communities</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail }],
        subject: `You're invited to join ${apartmentName} on HomeConnect`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[Brevo] Error:', err);
      return { success: false, error: err.message || 'Failed to send email.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Brevo] Network error:', err);
    return { success: false, error: 'Network error while sending email.' };
  }
}
