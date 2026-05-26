import nodemailer from 'nodemailer'

const SITE = 'https://wet3.camp'
const FROM_NAME = 'Wet3.camp'

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass || pass === 'CHANGE_ME') return null

  return nodemailer.createTransport({
    host,
    port,
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

// ─── Registration ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(name: string, email: string) {
  await send({
    to: email,
    subject: `Welcome to Wet3.camp, ${name}!`,
    text: `Hi ${name},\n\nWelcome to Wet3.camp — Kenya's premier escort marketplace.\n\nYou can browse escorts, make bookings, and manage your account at ${SITE}\n\nEnjoy,\nThe Wet3.camp Team`,
    html: `<div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#8B0000">Welcome to Wet3.camp, ${name}!</h2>
      <p>Your account is ready. Start browsing Kenya's top escorts.</p>
      <a href="${SITE}" style="display:inline-block;background:#8B0000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">Visit Wet3.camp</a>
      <p style="color:#999;font-size:12px">Wet3.camp — Discreet. Verified. Trusted.</p>
    </div>`,
  })
}

export async function sendEscortWelcomeEmail(name: string, email: string) {
  const adminEmail = process.env.SMTP_USER!
  await Promise.all([
    send({
      to: email,
      subject: `Your Wet3.camp escort profile is under review`,
      text: `Hi ${name},\n\nThank you for registering as an escort on Wet3.camp.\n\nYour profile is currently under review. Once approved by our team, it will go live and clients will be able to find and book you.\n\nWe'll email you as soon as your profile is approved.\n\nBest,\nThe Wet3.camp Team`,
      html: `<div style="font-family:sans-serif;max-width:500px">
        <h2 style="color:#8B0000">Profile Received — Under Review</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for registering on Wet3.camp. Your profile is currently being reviewed by our team.</p>
        <p>Once approved, your profile will go live and you'll receive a confirmation email.</p>
        <p style="color:#999;font-size:12px">Wet3.camp — Discreet. Verified. Trusted.</p>
      </div>`,
    }),
    send({
      to: adminEmail,
      subject: `New escort registration — ${name}`,
      text: `A new escort has registered and is awaiting approval:\n\nName: ${name}\nEmail: ${email}\n\nReview at ${SITE}/admin`,
      html: `<div style="font-family:sans-serif;max-width:500px">
        <h2 style="color:#8B0000">New Escort Registration</h2>
        <p><strong>${name}</strong> (${email}) has registered and is awaiting approval.</p>
        <a href="${SITE}/admin" style="display:inline-block;background:#8B0000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">Review in Admin Panel</a>
      </div>`,
    }),
  ])
}

// ─── Escort approval / rejection ──────────────────────────────────────────────

export async function sendEscortApprovedEmail(name: string, email: string) {
  await send({
    to: email,
    subject: `Your Wet3.camp profile is now live! 🎉`,
    text: `Hi ${name},\n\nGreat news — your escort profile has been approved and is now live on Wet3.camp!\n\nClients can now find and book you. Log in to manage your profile and availability:\n${SITE}/dashboard\n\nBest,\nThe Wet3.camp Team`,
    html: `<div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#8B0000">Your Profile is Live! 🎉</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your escort profile has been <strong>approved</strong> and is now visible to clients on Wet3.camp.</p>
      <a href="${SITE}/dashboard" style="display:inline-block;background:#8B0000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">Manage Your Profile</a>
      <p style="color:#999;font-size:12px">Wet3.camp — Discreet. Verified. Trusted.</p>
    </div>`,
  })
}

export async function sendEscortRejectedEmail(name: string, email: string) {
  await send({
    to: email,
    subject: `Update on your Wet3.camp application`,
    text: `Hi ${name},\n\nUnfortunately your escort profile application was not approved at this time. If you believe this is an error, please contact us at ${process.env.SMTP_USER}.\n\nThe Wet3.camp Team`,
    html: `<div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#8B0000">Application Update</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We're sorry — your profile application was not approved at this time.</p>
      <p>If you believe this is an error, please reply to this email or contact <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER}</a>.</p>
      <p style="color:#999;font-size:12px">Wet3.camp — Discreet. Verified. Trusted.</p>
    </div>`,
  })
}

// ─── Bookings ────────────────────────────────────────────────────────────────

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
  const details = `
Escort:   ${opts.escortName}
Client:   ${opts.clientName} <${opts.clientEmail}>
Date:     ${opts.date}
Time:     ${opts.time}
Duration: ${opts.duration} hr(s)
Type:     ${opts.type}
Amount:   KES ${opts.amount.toLocaleString()}
${opts.location ? `Location: ${opts.location}` : ''}
${opts.notes ? `Notes:    ${opts.notes}` : ''}`.trim()

  const detailsHtml = details.replace(/\n/g, '<br>')

  const promises: Promise<void>[] = [
    send({
      to: adminEmail,
      subject: `New Booking — ${opts.escortName} on ${opts.date}`,
      text: `New booking received on Wet3.camp\n\n${details}`,
      html: `<div style="font-family:sans-serif;max-width:500px"><h2 style="color:#8B0000">New Booking</h2><p>${detailsHtml}</p></div>`,
    }),
  ]

  if (opts.escortEmail) {
    promises.push(send({
      to: opts.escortEmail,
      subject: `New booking on ${opts.date}`,
      text: `Hi ${opts.escortName},\n\nYou have a new booking:\n\n${details}\n\nManage it at ${SITE}/dashboard`,
      html: `<div style="font-family:sans-serif;max-width:500px"><h2 style="color:#8B0000">New Booking Request</h2><p>Hi <strong>${opts.escortName}</strong>,</p><p>${detailsHtml}</p><a href="${SITE}/dashboard" style="display:inline-block;background:#8B0000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">View in Dashboard</a></div>`,
    }))
  }

  if (opts.clientEmail) {
    promises.push(send({
      to: opts.clientEmail,
      subject: `Booking confirmed — ${opts.escortName}`,
      text: `Hi ${opts.clientName},\n\nYour booking has been received:\n\n${details}\n\nView your bookings at ${SITE}/bookings`,
      html: `<div style="font-family:sans-serif;max-width:500px"><h2 style="color:#8B0000">Booking Confirmed</h2><p>Hi <strong>${opts.clientName}</strong>,</p><p>${detailsHtml}</p><a href="${SITE}/bookings" style="display:inline-block;background:#8B0000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">View My Bookings</a></div>`,
    }))
  }

  await Promise.all(promises)
}

// ─── Messages ────────────────────────────────────────────────────────────────

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
    html: `<div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#8B0000">New Message</h2>
      <p>Hi <strong>${opts.toName}</strong>,</p>
      <p><strong>${opts.fromName}</strong> sent you a message:</p>
      <blockquote style="border-left:3px solid #8B0000;padding-left:12px;color:#444">${opts.preview}</blockquote>
      <a href="${SITE}/messages" style="display:inline-block;background:#8B0000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">Reply Now</a>
      <p style="color:#999;font-size:12px">Wet3.camp — Discreet. Verified. Trusted.</p>
    </div>`,
  })
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${SITE}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
  await send({
    to: email,
    subject: `Reset your Wet3.camp password`,
    text: `You requested a password reset.\n\nClick this link to reset your password (valid for 1 hour):\n${link}\n\nIf you didn't request this, ignore this email.`,
    html: `<div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#8B0000">Password Reset</h2>
      <p>You requested a password reset for your Wet3.camp account.</p>
      <a href="${link}" style="display:inline-block;background:#8B0000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">Reset My Password</a>
      <p style="color:#555;font-size:13px">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      <p style="color:#999;font-size:12px">Wet3.camp — Discreet. Verified. Trusted.</p>
    </div>`,
  })
}
