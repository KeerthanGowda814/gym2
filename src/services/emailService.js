/**
 * Frontend EmailJS Dispatcher Service
 * Direct integration with EmailJS REST API (service_pptcalc / template_wuvv9um)
 */

const EMAILJS_SERVICE_ID = 'service_pptcalc';
const EMAILJS_TEMPLATE_ID = 'template_wuvv9um';
const EMAILJS_PUBLIC_KEY = 'DqcGq9-cXnfABcpJU';
const EMAILJS_PRIVATE_KEY = 'Akzz_QTX1TS7q2iUULjiw';

export async function sendEmailJSBroadcastAlert({ title, message, type, recipientEmails }) {
  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    console.log('[Frontend EmailJS] No recipients provided for broadcast.');
    return { success: true, count: 0 };
  }

  let sentCount = 0;
  let errors = [];

  for (const email of recipientEmails) {
    if (!email || !email.includes('@')) continue;

    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        subject: title,
        title: title,
        alert_title: title,
        message: message,
        alert_message: message,
        category: type || 'General Alert',
        to_email: email,
        recipient_email: email,
        email: email,
        to_name: email.split('@')[0] || 'Valued Member',
        from_name: 'Apex Athletics Club Admin'
      }
    };

    if (EMAILJS_PRIVATE_KEY) {
      payload.accessToken = EMAILJS_PRIVATE_KEY;
    }

    try {
      let res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Retry without accessToken if 403 / 400 security header issue occurs
      if (!res.ok && EMAILJS_PRIVATE_KEY) {
        delete payload.accessToken;
        res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        sentCount++;
      } else {
        const text = await res.text();
        errors.push(`${email}: ${res.status} ${text}`);
      }
    } catch (err) {
      errors.push(`${email}: ${err.message}`);
    }
  }

  console.log(`[Frontend EmailJS] Broadcast complete. ${sentCount}/${recipientEmails.length} emails dispatched.`);
  return {
    success: sentCount > 0 || recipientEmails.length === 0,
    sentCount,
    errors
  };
}
