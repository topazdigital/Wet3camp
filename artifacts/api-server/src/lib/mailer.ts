import nodemailer from 'nodemailer'

const SITE      = 'https://wet3.camp'
const FROM_NAME = 'Wet3.camp'

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass || pass === 'CHANGE_ME') return null
  return nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  })
}

function from() {
  return `"${FROM_NAME}" <${process.env.SMTP_USER}>`
}

async function send(opts: { to: string; subject: string; text: string; html?: string }) {
  const t = createTransport()
  if (!t) return
  await t.sendMail({ from: from(), ...opts }).catch(() => {})
}

// ─── Shared HTML template ─────────────────────────────────────────────────────

function emailWrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Wet3.camp</title>
</head>
<body style="margin:0;padding:0;background:#080000;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080000;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#0d0000;border:1px solid #2a0000;border-radius:16px;overflow:hidden;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0000 0%,#0d0000 100%);padding:28px 36px;border-bottom:2px solid #8B0000;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:44px;height:44px;background:linear-gradient(135deg,#8B0000,#1a0000);border-radius:10px;text-align:center;vertical-align:middle;border:1px solid #8B0000;">
                          <span style="font-size:22px;line-height:44px;display:block;">👑</span>
                        </td>
                        <td style="padding-left:14px;vertical-align:middle;">
                          <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">Wet3<span style="color:#FFD700;">Camp</span></span>
                          <div style="font-size:9px;color:#666666;letter-spacing:2px;text-transform:uppercase;margin-top:1px;">PREMIUM ESCORT PLATFORM</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <a href="${SITE}" style="font-size:11px;color:#8B0000;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">wet3.camp</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── CONTENT ── -->
          <tr>
            <td style="padding:40px 36px;">
              ${content}
            </td>
          </tr>

          <!-- ── DIVIDER ── -->
          <tr>
            <td style="padding:0 36px;">
              <div style="height:1px;background:linear-gradient(to right,transparent,#2a0000,transparent);"></div>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="padding:24px 36px;background:#0a0000;">
              <p style="margin:0 0 6px;font-size:11px;color:#555555;text-align:center;line-height:1.6;">
                © 2026 <a href="${SITE}" style="color:#8B0000;text-decoration:none;">Wet3.camp</a> — Kenya's #1 Premium Escort Platform
              </p>
              <p style="margin:0;font-size:10px;color:#3a3a3a;text-align:center;">
                Adult platform · 18+ only · Discreet &amp; Trusted
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function btn(label: string, href: string, color = '#8B0000'): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr>
      <td style="background:${color};border-radius:10px;">
        <a href="${href}" style="display:block;padding:14px 32px;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">${label} →</a>
      </td>
    </tr>
  </table>`
}

function detailsTable(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#160000;border:1px solid #2a0000;border-radius:10px;margin:20px 0;overflow:hidden;">
    ${rows.map(([k, v]) => `<tr>
      <td style="padding:10px 18px;border-bottom:1px solid #1e0000;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;width:38%;white-space:nowrap;">${k}</td>
      <td style="padding:10px 18px;border-bottom:1px solid #1e0000;font-size:13px;color:#dddddd;font-weight:600;">${v}</td>
    </tr>`).join('')}
  </table>`
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 6px;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">${text}</h2>`
}

function subtext(text: string): string {
  return `<p style="margin:0 0 20px;font-size:13px;color:#888888;line-height:1.6;">${text}</p>`
}

function badge(text: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 12px;background:${color}22;border:1px solid ${color}55;border-radius:20px;font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;">${text}</span>`
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

export async function sendTelegramNotification(
  message: string,
  opts?: { token?: string; chatId?: string }
) {
  const token  = opts?.token  ?? process.env.TELEGRAM_TOKEN
  const chatId = opts?.chatId ?? process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(8000),
    })
  } catch {}
}

// ─── Registration ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(name: string, email: string) {
  await send({
    to: email,
    subject: `Welcome to Wet3.camp, ${name}!`,
    text: `Hi ${name},\n\nWelcome to Wet3.camp — Kenya's premier escort platform.\n\nBrowse escorts, make bookings, and manage your account at ${SITE}\n\nEnjoy,\nThe Wet3.camp Team`,
    html: emailWrap(`
      ${heading('Welcome to Wet3Camp')}
      ${subtext(`Hi <strong style="color:#FFD700;">${name}</strong>, your account is ready. You're now part of Kenya's #1 premium escort community.`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        ${[
          ['✓ Verified escorts', 'All profiles reviewed by our team'],
          ['✓ Discreet platform', 'Your privacy is our priority'],
          ['✓ Real reviews', 'From verified clients only'],
        ].map(([icon, desc]) => `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #1e0000;">
              <span style="font-size:13px;color:#FFD700;font-weight:700;margin-right:10px;">${icon}</span>
              <span style="font-size:13px;color:#cccccc;">${desc}</span>
            </td>
          </tr>
        `).join('')}
      </table>
      ${btn('Browse Escorts', SITE)}
      <p style="margin:16px 0 0;font-size:11px;color:#555;">Discreet. Verified. Trusted.</p>
    `),
  })
}

export async function sendEscortWelcomeEmail(name: string, email: string) {
  const adminEmail = process.env.SMTP_USER!
  await Promise.all([
    send({
      to: email,
      subject: `Your Wet3.camp escort profile is under review`,
      text: `Hi ${name},\n\nThank you for registering as an escort on Wet3.camp.\n\nYour profile is currently under review. Once approved, it will go live and clients will be able to find and book you.\n\nWe'll email you as soon as your profile is approved.\n\nBest,\nThe Wet3.camp Team`,
      html: emailWrap(`
        ${heading('Profile Under Review')}
        ${badge('Pending Approval', '#FFD700')}
        <p style="margin:20px 0 0;font-size:14px;color:#cccccc;line-height:1.7;">
          Hi <strong style="color:#FFD700;">${name}</strong>,<br/><br/>
          Thank you for registering on Wet3.camp. Your profile has been received and is currently being reviewed by our team.
        </p>
        <p style="margin:12px 0 24px;font-size:14px;color:#cccccc;line-height:1.7;">
          Once approved, your profile will go live and you'll receive a confirmation email. This typically takes <strong style="color:#fff;">24–48 hours</strong>.
        </p>
        ${detailsTable([
          ['Status', '⏳ Under Review'],
          ['Profile Name', name],
          ['Email', email],
          ['Next Step', 'Wait for approval email'],
        ])}
        ${btn('Visit Your Dashboard', `${SITE}/my-profile`)}
        <p style="margin:12px 0 0;font-size:11px;color:#555;">Questions? Reply to this email and we'll help you out.</p>
      `),
    }),
    send({
      to: adminEmail,
      subject: `New escort registration — ${name}`,
      text: `A new escort has registered:\n\nName: ${name}\nEmail: ${email}\n\nReview at ${SITE}/admin`,
      html: emailWrap(`
        ${heading('New Escort Registration')}
        ${badge('Action Required', '#FF9800')}
        <p style="margin:20px 0;font-size:14px;color:#cccccc;line-height:1.7;">
          A new escort has registered and is awaiting your approval.
        </p>
        ${detailsTable([
          ['Name', name],
          ['Email', email],
          ['Status', '⏳ Pending Review'],
          ['Registered', new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })],
        ])}
        ${btn('Review in Admin Panel', `${SITE}/admin`, '#8B0000')}
      `),
    }),
  ])
}

// ─── Escort approval / rejection ──────────────────────────────────────────────

export async function sendEscortApprovedEmail(name: string, email: string) {
  await send({
    to: email,
    subject: `Your Wet3.camp profile is now LIVE! 🎉`,
    text: `Hi ${name},\n\nGreat news — your escort profile has been approved and is now live!\n\nClients can now find and book you. Log in to manage your profile:\n${SITE}/my-profile\n\nBest,\nThe Wet3.camp Team`,
    html: emailWrap(`
      ${heading('Your Profile is Live! 🎉')}
      ${badge('Approved', '#22c55e')}
      <p style="margin:20px 0;font-size:14px;color:#cccccc;line-height:1.7;">
        Hi <strong style="color:#FFD700;">${name}</strong>,<br/><br/>
        Great news! Your escort profile has been <strong style="color:#22c55e;">approved</strong> and is now visible to clients across Kenya on Wet3.camp.
      </p>
      ${detailsTable([
        ['Status', '✅ Live & Active'],
        ['Profile Name', name],
        ['Approved', new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })],
      ])}
      <div style="background:#160000;border:1px solid #2a0000;border-radius:10px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Next steps</p>
        ${['Complete your profile with photos', 'Set your availability and pricing', 'Respond promptly to client bookings'].map(s =>
          `<p style="margin:6px 0 0;font-size:13px;color:#cccccc;padding-left:14px;position:relative;">
            <span style="color:#FFD700;margin-right:8px;">→</span>${s}
          </p>`
        ).join('')}
      </div>
      ${btn('Manage My Profile', `${SITE}/my-profile`)}
    `),
  })
}

export async function sendEscortRejectedEmail(name: string, email: string) {
  await send({
    to: email,
    subject: `Update on your Wet3.camp application`,
    text: `Hi ${name},\n\nUnfortunately your escort profile application was not approved at this time.\n\nIf you believe this is an error, please contact us at ${process.env.SMTP_USER}.\n\nThe Wet3.camp Team`,
    html: emailWrap(`
      ${heading('Application Update')}
      ${badge('Not Approved', '#EF4444')}
      <p style="margin:20px 0;font-size:14px;color:#cccccc;line-height:1.7;">
        Hi <strong style="color:#FFD700;">${name}</strong>,<br/><br/>
        Thank you for applying to join Wet3.camp. Unfortunately, your profile application was not approved at this time.
      </p>
      <div style="background:#160000;border:1px solid #2a0000;border-radius:10px;padding:18px 20px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#cccccc;line-height:1.7;">
          If you believe this was an error, or would like more information, please reply to this email. We're happy to help clarify and assist you in reapplying.
        </p>
      </div>
      ${btn('Contact Support', `mailto:${process.env.SMTP_USER ?? 'support@wet3.camp'}`)}
    `),
  })
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function sendBookingNotification(opts: {
  escortName: string
  escortEmail: string | null
  clientName: string
  clientEmail: string
  date: string
  time: string
  duration: number
  type: string
  amount: number
  location: string | null
  notes: string | null
}) {
  const adminEmail = process.env.SMTP_USER!
  const rows: [string, string][] = [
    ['Escort',    opts.escortName],
    ['Client',    `${opts.clientName}`],
    ['Date',      opts.date],
    ['Time',      opts.time],
    ['Duration',  `${opts.duration} hour${opts.duration !== 1 ? 's' : ''}`],
    ['Type',      opts.type.charAt(0).toUpperCase() + opts.type.slice(1)],
    ['Amount',    `KES ${opts.amount.toLocaleString()}`],
  ]
  if (opts.location) rows.push(['Location', opts.location])
  if (opts.notes)    rows.push(['Notes',    opts.notes])

  const promises: Promise<void>[] = [
    send({
      to: adminEmail,
      subject: `New Booking — ${opts.escortName} on ${opts.date}`,
      text: `New booking on Wet3.camp\n\nEscort: ${opts.escortName}\nClient: ${opts.clientName} (${opts.clientEmail})\nDate: ${opts.date} ${opts.time}\nDuration: ${opts.duration}hr\nType: ${opts.type}\nAmount: KES ${opts.amount.toLocaleString()}`,
      html: emailWrap(`
        ${heading('New Booking Received')}
        ${badge('New', '#2196F3')}
        <p style="margin:20px 0;font-size:14px;color:#cccccc;">A new escort booking has been placed on the platform.</p>
        ${detailsTable(rows)}
        ${btn('View in Admin Panel', `${SITE}/admin`)}
      `),
    }),
  ]

  if (opts.escortEmail) {
    promises.push(send({
      to: opts.escortEmail,
      subject: `New booking request — ${opts.date}`,
      text: `Hi ${opts.escortName},\n\nYou have a new booking request.\n\nClient: ${opts.clientName}\nDate: ${opts.date} ${opts.time}\nDuration: ${opts.duration}hr\nType: ${opts.type}\nAmount: KES ${opts.amount.toLocaleString()}\n\nManage it at ${SITE}/my-profile`,
      html: emailWrap(`
        ${heading('New Booking Request!')}
        ${badge('Action Needed', '#FF9800')}
        <p style="margin:20px 0;font-size:14px;color:#cccccc;line-height:1.7;">
          Hi <strong style="color:#FFD700;">${opts.escortName}</strong>,<br/>
          You have a new booking request from a client. Please review the details below.
        </p>
        ${detailsTable([
          ['Client',   opts.clientName],
          ['Date',     opts.date],
          ['Time',     opts.time],
          ['Duration', `${opts.duration} hour${opts.duration !== 1 ? 's' : ''}`],
          ['Type',     opts.type],
          ['Amount',   `KES ${opts.amount.toLocaleString()}`],
          ...(opts.location ? [['Location', opts.location] as [string,string]] : []),
        ])}
        ${btn('View My Dashboard', `${SITE}/my-profile`)}
      `),
    }))
  }

  if (opts.clientEmail) {
    promises.push(send({
      to: opts.clientEmail,
      subject: `Booking confirmed — ${opts.escortName}`,
      text: `Hi ${opts.clientName},\n\nYour booking with ${opts.escortName} has been received.\n\nDate: ${opts.date} ${opts.time}\nDuration: ${opts.duration}hr\nAmount: KES ${opts.amount.toLocaleString()}\n\nView bookings at ${SITE}/bookings`,
      html: emailWrap(`
        ${heading('Booking Confirmed!')}
        ${badge('Confirmed', '#22c55e')}
        <p style="margin:20px 0;font-size:14px;color:#cccccc;line-height:1.7;">
          Hi <strong style="color:#FFD700;">${opts.clientName}</strong>,<br/>
          Your booking has been received and is confirmed. Here's your summary:
        </p>
        ${detailsTable([
          ['Escort',   opts.escortName],
          ['Date',     opts.date],
          ['Time',     opts.time],
          ['Duration', `${opts.duration} hour${opts.duration !== 1 ? 's' : ''}`],
          ['Type',     opts.type],
          ['Amount',   `KES ${opts.amount.toLocaleString()}`],
          ...(opts.location ? [['Location', opts.location] as [string,string]] : []),
        ])}
        <div style="background:#160000;border:1px solid #2a0000;border-radius:10px;padding:14px 18px;margin:20px 0 4px;">
          <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
            ℹ️ Payment and service arrangements are made directly with the escort. Wet3.camp facilitates introductions — we do not process payments.
          </p>
        </div>
        ${btn('View My Bookings', `${SITE}/bookings`)}
      `),
    }))
  }

  await Promise.all(promises)
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function sendNewMessageEmail(opts: {
  toEmail: string
  toName: string
  fromName: string
  preview: string
}) {
  await send({
    to: opts.toEmail,
    subject: `New message from ${opts.fromName} on Wet3.camp`,
    text: `Hi ${opts.toName},\n\n${opts.fromName} sent you a message:\n\n"${opts.preview}"\n\nReply at ${SITE}/messages`,
    html: emailWrap(`
      ${heading('New Message')}
      <p style="margin:0 0 20px;font-size:14px;color:#cccccc;line-height:1.7;">
        Hi <strong style="color:#FFD700;">${opts.toName}</strong>,<br/>
        <strong>${opts.fromName}</strong> sent you a message on Wet3.camp.
      </p>
      <div style="background:#160000;border-left:3px solid #8B0000;border-radius:0 10px 10px 0;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;color:#dddddd;font-style:italic;line-height:1.6;">"${opts.preview}"</p>
        <p style="margin:8px 0 0;font-size:11px;color:#666;">— ${opts.fromName}</p>
      </div>
      ${btn('Reply Now', `${SITE}/messages`)}
    `),
  })
}

// ─── Room Bookings ────────────────────────────────────────────────────────────

export async function sendRoomBookingEmail(opts: {
  roomName: string
  hotel: string
  city: string
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  totalAmount: number
  notes: string | null
}) {
  const adminEmail = process.env.SMTP_USER!
  const rows: [string, string][] = [
    ['Room',      `${opts.roomName} — ${opts.hotel}`],
    ['City',      opts.city],
    ['Guest',     opts.guestName],
    ['Check-in',  opts.checkIn],
    ['Check-out', opts.checkOut],
    ['Nights',    String(opts.nights)],
    ['Guests',    String(opts.guests)],
    ['Total',     `KES ${opts.totalAmount.toLocaleString()}`],
  ]
  if (opts.notes) rows.push(['Notes', opts.notes])

  await Promise.all([
    send({
      to: adminEmail,
      subject: `New Room Booking — ${opts.roomName} (${opts.checkIn})`,
      text: `New room booking on Wet3.camp\n\nRoom: ${opts.roomName} — ${opts.hotel}, ${opts.city}\nGuest: ${opts.guestName} <${opts.guestEmail}>\nCheck-in: ${opts.checkIn}\nCheck-out: ${opts.checkOut}\nTotal: KES ${opts.totalAmount.toLocaleString()}`,
      html: emailWrap(`
        ${heading('New Room Booking')}
        ${badge('New', '#2196F3')}
        <p style="margin:20px 0;font-size:14px;color:#cccccc;">A new room booking has been placed on the platform.</p>
        ${detailsTable(rows)}
        ${btn('View in Admin Panel', `${SITE}/admin`)}
      `),
    }),
    send({
      to: opts.guestEmail,
      subject: `Room Booking Received — ${opts.roomName}`,
      text: `Hi ${opts.guestName},\n\nYour room booking has been received.\n\nRoom: ${opts.roomName} — ${opts.hotel}\nCheck-in: ${opts.checkIn}\nCheck-out: ${opts.checkOut}\nNights: ${opts.nights}\nTotal: KES ${opts.totalAmount.toLocaleString()}\n\nWe'll confirm within 2 hours.\n\nWet3.camp Team`,
      html: emailWrap(`
        ${heading('Booking Received ✓')}
        ${badge('Pending Confirmation', '#FF9800')}
        <p style="margin:20px 0;font-size:14px;color:#cccccc;line-height:1.7;">
          Hi <strong style="color:#FFD700;">${opts.guestName}</strong>,<br/>
          Your room booking has been received and is pending confirmation. Here's your summary:
        </p>
        ${detailsTable(rows)}
        <div style="background:#160000;border:1px solid #2a0000;border-radius:10px;padding:14px 18px;margin:20px 0 4px;">
          <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
            ⏱ We'll confirm availability and contact you within <strong style="color:#fff;">2 hours</strong>.
          </p>
        </div>
        ${btn('Browse More Rooms', `${SITE}/rooms`, '#FF9800')}
      `),
    }),
  ])
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${SITE}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
  await send({
    to: email,
    subject: `Reset your Wet3.camp password`,
    text: `You requested a password reset.\n\nClick this link (valid for 1 hour):\n${link}\n\nIf you didn't request this, ignore this email.`,
    html: emailWrap(`
      ${heading('Password Reset')}
      <p style="margin:0 0 20px;font-size:14px;color:#cccccc;line-height:1.7;">
        You requested a password reset for your Wet3.camp account. Click the button below to set a new password.
      </p>
      ${detailsTable([
        ['Account', email],
        ['Link Valid', '1 hour from sending'],
      ])}
      ${btn('Reset My Password', link)}
      <div style="background:#160000;border:1px solid #2a0000;border-radius:10px;padding:14px 18px;margin:20px 0 0;">
        <p style="margin:0;font-size:12px;color:#666;line-height:1.6;">
          🔒 If you didn't request this reset, you can safely ignore this email. Your password will not change.
        </p>
      </div>
    `),
  })
}

// ─── Africa's Talking SMS ─────────────────────────────────────────────────────

export async function sendSmsOtp(
  phone: string,
  code: string,
  name: string,
  credentials: { apiKey: string; username: string; senderId?: string }
): Promise<boolean> {
  try {
    // Normalise to E.164 (+254XXXXXXXXX)
    let e164 = phone.trim()
    if (!e164.startsWith('+')) {
      e164 = e164.startsWith('0') ? `+254${e164.slice(1)}` : `+254${e164}`
    }
    // africastalking is CommonJS — use createRequire
    const { createRequire } = await import('module')
    const require = createRequire(import.meta.url)
    const AT = require('africastalking')
    const at = AT({ apiKey: credentials.apiKey, username: credentials.username })
    const message = `Wet3Camp: Hi ${name}, your verification code is ${code}. Valid 10 mins. Do NOT share it.`
    const result = await at.SMS.send({
      to: [e164],
      message,
      ...(credentials.senderId ? { from: credentials.senderId } : {}),
    })
    const recipients: any[] = result?.SMSMessageData?.Recipients ?? []
    const ok = recipients.some((r: any) => r.status === 'Success' || r.statusCode === 101)
    if (!ok) console.warn('[SMS OTP] AT recipients:', JSON.stringify(recipients))
    return ok
  } catch (err) {
    console.error('[SMS OTP] Africa\'s Talking error:', err)
    return false
  }
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export async function sendOtpEmail(email: string, otp: string, name?: string) {
  await send({
    to: email,
    subject: `Your Wet3.camp verification code: ${otp}`,
    text: `Hi${name ? ` ${name}` : ''},\n\nYour Wet3.camp verification code is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
    html: emailWrap(`
      ${heading('Verification Code')}
      <p style="margin:0 0 28px;font-size:14px;color:#cccccc;line-height:1.7;">
        ${name ? `Hi <strong style="color:#FFD700;">${name}</strong>, enter` : 'Enter'} this code to verify your identity on Wet3.camp.
      </p>
      <div style="text-align:center;margin:0 0 28px;">
        <div style="display:inline-block;background:#160000;border:2px solid #8B0000;border-radius:14px;padding:20px 40px;">
          <span style="font-size:38px;font-weight:900;letter-spacing:10px;color:#FFD700;font-family:monospace;">${otp}</span>
        </div>
        <p style="margin:12px 0 0;font-size:12px;color:#666;">Expires in 10 minutes</p>
      </div>
      <div style="background:#160000;border:1px solid #2a0000;border-radius:10px;padding:14px 18px;margin:0;">
        <p style="margin:0;font-size:12px;color:#666;line-height:1.6;">
          🔒 Never share this code with anyone. Wet3.camp staff will never ask for your OTP.
        </p>
      </div>
    `),
  })
}
