// Vercel Serverless Function to send contact form emails via Resend API
// Required env vars in Vercel Project Settings -> Environment Variables:
// - RESEND_API_KEY: your Resend API key
// - CONTACT_TO_EMAIL: destination email address
// - CONTACT_FROM_EMAIL: verified sender email on Resend (e.g., contact@yourdomain.com)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, subject, message } = req.body || {};

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields: name, email, message' });
    }

    // basic email shape check
    const emailOk = /.+@.+\..+/.test(String(email));
    if (!emailOk) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;

    if (!to || !from || !apiKey) {
      return res.status(500).json({ error: 'Server not configured: missing RESEND_API_KEY/CONTACT_TO_EMAIL/CONTACT_FROM_EMAIL' });
    }

    const emailSubject = subject && String(subject).trim() !== ''
      ? `[OnlineTutor] ${subject}`
      : '[OnlineTutor] New contact form submission';

    // Compose a simple HTML email
    const html = `
      <div style="font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#0f2137">
        <h2 style="margin:0 0 12px">New Contact Form Submission</h2>
        <p style="margin:0 0 8px"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${subject ? `<p style="margin:0 0 8px"><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ''}
        <p style="margin:12px 0 6px"><strong>Message</strong></p>
        <pre style="white-space:pre-wrap;background:#f6f8fc;padding:12px;border-radius:8px;border:1px solid #e6edf7">${escapeHtml(message)}</pre>
      </div>
    `;

    // Send via Resend API using fetch
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: emailSubject,
        html,
        reply_to: email // so you can reply directly to the sender
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return res.status(502).json({ error: 'Failed to send email', details: err });
    }

    const data = await resp.json().catch(() => ({}));
    return res.status(200).json({ ok: true, id: data?.id || null });
  } catch (e) {
    console.error('contact handler error', e);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
