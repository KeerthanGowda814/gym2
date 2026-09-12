import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { 
  SMTP_HOST, 
  SMTP_PORT, 
  SMTP_USER, 
  SMTP_PASS,
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
  EMAILJS_PRIVATE_KEY
} = process.env;

// Check configuration status
const isSmtpConfigured = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS;
const isEmailJSConfigured = EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY;

let transporter = null;
if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

/**
 * Sends a broadcast email to all registered user email addresses.
 * If SMTP is not configured, logs to console instead.
 * @param {string} subject 
 * @param {string} htmlMessage 
 * @param {Array<string>} recipientEmails 
 */
export async function sendBroadcastEmail(subject, htmlMessage, recipientEmails) {
  if (!recipientEmails || recipientEmails.length === 0) {
    console.log('[EmailService] No recipients found for broadcast email.');
    return;
  }

  const emailBody = `
    <div style="font-family: sans-serif; background-color: #0c0d12; color: #ffffff; padding: 2rem; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #1a1c24;">
      <div style="text-align: center; border-bottom: 1px solid #1a1c24; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
        <h2 style="color: #c6ff00; text-transform: uppercase; margin: 0; font-weight: 800; letter-spacing: 1px;">Apex Athletics</h2>
        <span style="color: #8e919f; font-size: 0.85rem;">Official Club Announcement</span>
      </div>
      
      <div style="font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;">
        <h3 style="color: #ffffff; margin-top: 0;">${subject}</h3>
        <p style="color: #b3b5c2; font-size: 0.95rem;">${htmlMessage}</p>
      </div>

      <div style="text-align: center; border-top: 1px solid #1a1c24; padding-top: 1.5rem; color: #5c5c6e; font-size: 0.75rem;">
        This is an automated broadcast alert sent to registered members of Apex Athletics Gym.<br/>
        Please check your member portal dashboard for real-time updates.
      </div>
    </div>
  `;

  if (isSmtpConfigured && transporter) {
    console.log(`[EmailService] Dispatching real SMTP broadcast emails to ${recipientEmails.length} recipients...`);
    try {
      // Send to all users (using bcc to avoid exposing all emails in CC field)
      const mailOptions = {
        from: `"Apex Athletics Alert" <${SMTP_USER}>`,
        to: SMTP_USER, // Sent to self
        bcc: recipientEmails, // BCC all users
        subject: `[Apex Athletics Alert] ${subject}`,
        html: emailBody
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('[EmailService] SMTP Broadcast dispatch successful:', info.messageId);
      return true;
    } catch (err) {
      console.error('[EmailService] SMTP Broadcast dispatch failed:', err.message);
      return false;
    }
  } else if (isEmailJSConfigured) {
    console.log(`[EmailService] Dispatching real EmailJS broadcast emails to ${recipientEmails.length} recipients...`);
    try {
      for (const email of recipientEmails) {
        const templateParams = {
          subject: subject,
          title: subject,
          alert_title: subject,
          message: htmlMessage,
          alert_message: htmlMessage,
          to_email: email,
          recipient_email: email,
          email: email,
          to_name: email.split('@')[0] || 'Valued Member',
          from_name: 'Apex Athletics Club Admin'
        };

        const payload = {
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: templateParams
        };

        if (EMAILJS_PRIVATE_KEY) {
          payload.accessToken = EMAILJS_PRIVATE_KEY;
        }

        let response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // Retry without accessToken if EmailJS returns 403 or 400 auth error
        if (!response.ok && EMAILJS_PRIVATE_KEY) {
          delete payload.accessToken;
          response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[EmailService] EmailJS send warning for ${email}: ${response.status} ${errText}`);
        }
      }
      console.log(`[EmailService] EmailJS Broadcast dispatch completed for ${recipientEmails.length} recipients.`);
      return true;
    } catch (err) {
      console.error('[EmailService] EmailJS Broadcast dispatch failed:', err.message);
      return false;
    }
  } else {
    // Mock simulation
    console.log('========================================================================');
    console.log(`📡 [EmailService MOCK DISPATCH] BROADCAST ALERT EMAIL DISPATCHED SUCCESSFULLY!`);
    console.log(`📧 SUBJECT: [Apex Athletics Alert] ${subject}`);
    console.log(`👥 RECIPIENTS (${recipientEmails.length}): ${recipientEmails.join(', ')}`);
    console.log(`📄 MESSAGE BODY: \n${htmlMessage}`);
    console.log('========================================================================');
    return true;
  }
}
