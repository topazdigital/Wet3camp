import nodemailer from 'nodemailer'

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  })
}

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
  const transport = createTransport()
  if (!transport) return

  const adminEmail = process.env.SMTP_USER!
  const subject = `New Booking — ${opts.escortName} on ${opts.date}`

  const body = `
New booking received on Wet3.camp

Escort:   ${opts.escortName}
Client:   ${opts.clientName} <${opts.clientEmail}>
Date:     ${opts.date}
Time:     ${opts.time}
Duration: ${opts.duration} hr(s)
Type:     ${opts.type}
Amount:   KES ${opts.amount.toLocaleString()}
${opts.location ? `Location: ${opts.location}` : ''}
${opts.notes ? `Notes:    ${opts.notes}` : ''}
`.trim()

  const promises: Promise<any>[] = []

  promises.push(
    transport.sendMail({
      from: `"Wet3.camp" <${adminEmail}>`,
      to: adminEmail,
      subject,
      text: body,
    }).catch(() => {})
  )

  if (opts.escortEmail) {
    promises.push(
      transport.sendMail({
        from: `"Wet3.camp" <${adminEmail}>`,
        to: opts.escortEmail,
        subject: `You have a new booking on ${opts.date}`,
        text: `Hi ${opts.escortName},\n\nYou have a new booking request:\n\n${body}\n\nLog in to manage it: https://wet3.camp/dashboard`,
      }).catch(() => {})
    )
  }

  promises.push(
    transport.sendMail({
      from: `"Wet3.camp" <${adminEmail}>`,
      to: opts.clientEmail,
      subject: `Booking confirmed — ${opts.escortName}`,
      text: `Hi ${opts.clientName},\n\nYour booking has been received:\n\n${body}\n\nYou can view your bookings at https://wet3.camp/bookings`,
    }).catch(() => {})
  )

  await Promise.all(promises)
}
