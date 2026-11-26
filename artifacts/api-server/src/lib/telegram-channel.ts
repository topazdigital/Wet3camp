type PromotionResult = {
  status: 'sent' | 'failed' | 'skipped' | 'already_sent'
  message: string
}

type TelegramApiResult = {
  ok?: boolean
  description?: string
  result?: { message_id?: number }
}

function affectedRows(result: any): number {
  return Number(result?.affectedRows ?? result?.rowCount ?? result?.changes ?? 0)
}

async function setPromotionState(
  pool: any,
  escortId: string | number,
  status: string,
  details: { messageId?: number | null; error?: string | null } = {},
) {
  await pool.query(
    `UPDATE escorts
     SET telegram_promo_status = ?, telegram_promo_message_id = ?,
         telegram_promo_sent_at = ?, telegram_promo_error = ?
     WHERE id = ?`,
    [
      status,
      details.messageId ?? null,
      status === 'sent' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
      details.error?.slice(0, 500) ?? null,
      escortId,
    ],
  )
}

export async function publishApprovedEscortToTelegram(
  pool: any,
  escortId: string | number,
): Promise<PromotionResult> {
  const [[escort]] = await pool.query(
    `SELECT id, name, city, area, is_active, verified, telegram_promo_opt_in,
            telegram_promo_status
     FROM escorts WHERE id = ? LIMIT 1`,
    [escortId],
  )

  if (!escort) return { status: 'skipped', message: 'Escort profile was not found.' }
  if (!Number(escort.is_active) || !Number(escort.verified)) {
    return { status: 'skipped', message: 'The profile is not approved yet.' }
  }
  if (!Number(escort.telegram_promo_opt_in)) {
    return { status: 'skipped', message: 'The escort has not opted into Telegram promotion.' }
  }
  if (escort.telegram_promo_status === 'sent') {
    return { status: 'already_sent', message: 'This profile was already posted.' }
  }
  if (escort.telegram_promo_status === 'sending') {
    return { status: 'skipped', message: 'A Telegram post is already being sent for this profile.' }
  }

  const [settingsRows] = await pool.query(
    `SELECT \`key\`, \`value\` FROM platform_settings
     WHERE \`key\` IN ('telegram_token', 'telegram_channel_id')`,
  )
  const settings = Object.fromEntries((settingsRows as any[]).map(row => [row.key, String(row.value ?? '')]))
  const token = settings.telegram_token?.trim()
  const channelId = settings.telegram_channel_id?.trim()
  if (!token || !channelId) {
    const message = 'Telegram bot token or channel destination is not configured.'
    await setPromotionState(pool, escortId, 'failed', { error: message })
    return { status: 'failed', message }
  }

  const [claimResult] = await pool.query(
    `UPDATE escorts SET telegram_promo_status = 'sending', telegram_promo_error = NULL
     WHERE id = ? AND telegram_promo_opt_in = 1
       AND is_active = 1 AND verified = 1
       AND telegram_promo_status NOT IN ('sending', 'sent')`,
    [escortId],
  )
  if (affectedRows(claimResult) === 0) {
    const [[current]] = await pool.query(
      'SELECT telegram_promo_status FROM escorts WHERE id = ? LIMIT 1',
      [escortId],
    )
    if (current?.telegram_promo_status === 'sent') {
      return { status: 'already_sent', message: 'This profile was already posted.' }
    }
    return { status: 'skipped', message: 'A Telegram post is already being sent for this profile.' }
  }

  const profileUrl = `https://wet3.camp/profile/${encodeURIComponent(String(escort.id))}`
  const location = [escort.area, escort.city].filter(Boolean).join(', ')
  const text = [
    `New profile on Wet3 Camp`,
    `Name: ${String(escort.name ?? 'New profile')}`,
    location ? `Location: ${String(location)}` : '',
    `View profile: ${profileUrl}`,
  ].filter(Boolean).join('\n')

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text,
        disable_web_page_preview: false,
      }),
      signal: AbortSignal.timeout(10000),
    })
    const result = await response.json() as TelegramApiResult
    if (!response.ok || !result.ok || !result.result?.message_id) {
      throw new Error(result.description || `Telegram returned HTTP ${response.status}.`)
    }

    await setPromotionState(pool, escortId, 'sent', { messageId: result.result.message_id })
    return { status: 'sent', message: 'Profile posted to the Telegram channel.' }
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Telegram posting failed.'
    await setPromotionState(pool, escortId, 'failed', { error: message })
    return { status: 'failed', message }
  }
}
