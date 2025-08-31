// Vercel Serverless Function to send contact form emails via Nodemailer (Gmail SMTP)
// Required env vars in Vercel Project Settings -> Environment Variables:
// - SMTP_HOST=smtp.gmail.com
// - SMTP_USER=yourgmail@gmail.com
// - SMTP_PASS=your_app_password (16 chars)
// - SMTP_PORT=587 (or 465)
// - SMTP_SECURE=tls (or ssl)
// - CONTACT_TO_EMAIL=destination@example.com
// - CONTACT_FROM_EMAIL=yourgmail@gmail.com (usually same as SMTP_USER)
// - CONTACT_FROM_NAME=OnlineTutor

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields: name, email, message' });
    }

    const emailOk = /.+@.+\..+/.test(String(email));
    if (!emailOk) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = (process.env.SMTP_SECURE || 'tls').toLowerCase() === 'ssl';
    const forceFromUser = String(process.env.FORCE_FROM_USER || '').toLowerCase() === 'true';

    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL || smtpUser;
    const fromName = process.env.CONTACT_FROM_NAME || 'OnlineTutor';

    if (!smtpUser || !smtpPass || !to || !from) {
      return res.status(500).json({ error: 'Server not configured: missing SMTP_USER/SMTP_PASS/CONTACT_TO_EMAIL/CONTACT_FROM_EMAIL' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for 465, false for 587
      auth: { user: smtpUser, pass: smtpPass },
    });

    const baseSubject = subject && String(subject).trim() !== '' ? subject : 'Online Tutor';
    // Prefix subject with user's name to surface it in inbox list even if From is rewritten by provider
    const emailSubject = name ? `${name} — ${baseSubject}` : baseSubject;

    const html = `
      <div style="font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#0f2137">
        <h2 style="margin:0 0 12px">${escapeHtml(subject || 'Message')}</h2>
        <p style="margin:0 0 8px"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${subject ? `<p style="margin:0 0 8px"><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ''}
        <p style="margin:12px 0 6px"><strong>Message</strong></p>
        <pre style="white-space:pre-wrap;background:#f6f8fc;padding:12px;border-radius:8px;border:1px solid #e6edf7">${escapeHtml(message)}</pre>
      </div>
    `;

    const mailOptions = forceFromUser
      ? {
          // Force exact user From and SMTP envelope
          from: { name, address: email },
          to,
          subject: emailSubject,
          html,
          replyTo: { name, address: email },
          text: `${subject || 'Message'}\n\nName: ${name}\nEmail: ${email}\n${subject ? `Subject: ${subject}\n\n` : '\n'}${message}`,
          envelope: { from: email, to },
        }
      : {
          // Deliverability-safe: user shows in From header, but SMTP uses authenticated sender
          from: { name, address: email },
          sender: { name: fromName, address: from },
          to,
          subject: emailSubject,
          html,
          replyTo: { name, address: email },
          text: `${subject || 'Message'}\n\nName: ${name}\nEmail: ${email}\n${subject ? `Subject: ${subject}\n\n` : '\n'}${message}`,
          envelope: { from: smtpUser, to },
        };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({ ok: true, id: info?.messageId || null });
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
