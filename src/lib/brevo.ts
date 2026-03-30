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

  const joinUrl = `${window.location.origin}/join/${inviteToken}`;

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
/**
 * Sends an email to administrators when a resident requests a SQFT change.
 */
export async function sendSqftChangeEmail({
  adminEmail,
  residentName,
  apartmentName,
  unitNumber
}: {
  adminEmail: string;
  residentName: string;
  apartmentName: string;
  unitNumber?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!BREVO_API_KEY) return { success: false, error: 'Not configured.' };

  const htmlContent = `
    <div style="font-family:sans-serif;max-width:500px;margin:20px auto;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:#4f46e5;padding:30px;text-align:center;color:white;">
        <h2 style="margin:0;">SQFT Change Request</h2>
      </div>
      <div style="padding:30px;color:#334155;">
        <p>Hi Admin,</p>
        <p><strong>${residentName}</strong> from ${unitNumber ? `Unit <strong>${unitNumber}</strong> at ` : ''} <strong>${apartmentName}</strong> has submitted a request to update their apartment area measurements (SQFT).</p>
        <p>This request requires your manual verification and approval before it affects the billing calculations.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${window.location.origin}/residents" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Review Request →</a>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: adminEmail }],
        subject: `[Request] SQFT Change for ${residentName} (${apartmentName})`,
        htmlContent,
      }),
    });
    return { success: response.ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sends expense notification emails to all apartment members.
 */
export async function sendExpenseEmail({
  toEmails,
  expenseDescription,
  category,
  totalAmount,
  perHeadAmount,
  month,
}: {
  toEmails: string[];
  expenseDescription: string;
  category: string;
  totalAmount: number;
  perHeadAmount: number;
  month: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!BREVO_API_KEY) return { success: false, error: 'Not configured.' };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#dc2626,#e11d48);padding:40px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:12px 20px;margin-bottom:16px;">
            <span style="font-size:28px;">🧾</span>
          </div>
          <h1 style="color:white;margin:0;font-size:24px;font-weight:900;">New Community Expense</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">${month}</p>
        </div>
        <div style="padding:40px;">
          <div style="background:#fef2f2;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid #dc2626;">
            <p style="margin:0 0 4px;color:#991b1b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Category</p>
            <p style="margin:0;color:#dc2626;font-size:18px;font-weight:900;">${category}</p>
          </div>
          <p style="color:#374151;font-size:16px;margin:0 0 8px;">
            <strong>${expenseDescription}</strong>
          </p>
          <p style="color:#64748b;font-size:14px;margin:0 0 28px;">has been logged as a community expense for ${month}.</p>
          
          <div style="display:flex;gap:16px;margin-bottom:28px;">
            <div style="flex:1;background:#fafafa;border:1px solid #e2e8f0;border-radius:16px;padding:20px;text-align:center;">
              <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;">Total Amount</p>
              <p style="margin:0;color:#dc2626;font-size:24px;font-weight:900;">₹${totalAmount.toLocaleString()}</p>
            </div>
            <div style="flex:1;background:#eef2ff;border:1px solid #c7d2fe;border-radius:16px;padding:20px;text-align:center;">
              <p style="margin:0 0 4px;color:#6366f1;font-size:11px;font-weight:700;text-transform:uppercase;">Your Share</p>
              <p style="margin:0;color:#4f46e5;font-size:24px;font-weight:900;">₹${perHeadAmount.toFixed(2)}</p>
            </div>
          </div>
          
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
            This is an automated notification from HomeConnect. Your maintenance charges will be updated accordingly.
          </p>
        </div>
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
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: toEmails.map(email => ({ email })),
        subject: `[HomeConnect] New Expense: ${expenseDescription} — ₹${totalAmount.toLocaleString()}`,
        htmlContent,
      }),
    });
    return { success: response.ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
