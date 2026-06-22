import { useState, useRef, useCallback } from 'react'
import { getToken } from './api'

const API = '/api'

export type MpesaStage = 'idle' | 'sending' | 'waiting' | 'success' | 'failed'

export interface UseMpesaPaymentResult {
  stage: MpesaStage
  txRef: string
  error: string
  initiate: (opts: { phone: string; amount: number; type: string }) => Promise<void>
  reset: () => void
}

export function useMpesaPayment(): UseMpesaPaymentResult {
  const [stage, setStage] = useState<MpesaStage>('idle')
  const [txRef, setTxRef] = useState('')
  const [error, setError] = useState('')
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null }
  }

  const poll = useCallback((ref: string) => {
    let attempts = 0
    const MAX = 40 // 40 × 3 s = 2 min
    pollTimer.current = setInterval(async () => {
      attempts++
      if (attempts >= MAX) {
        stopPolling()
        setStage('failed')
        setError("Payment timed out. Haven't received the prompt? Try again.")
        return
      }
      try {
        const token = getToken()
        const r = await fetch(`${API}/payments/status/${ref}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!r.ok) return
        const data = await r.json()
        if (data.paid) {
          stopPolling()
          setStage('success')
        } else if (data.failed) {
          stopPolling()
          setStage('failed')
          setError('Payment was cancelled or declined. Please try again.')
        }
      } catch { /* network hiccup — keep polling */ }
    }, 3000)
  }, [])

  const initiate = useCallback(async (opts: { phone: string; amount: number; type: string }) => {
    stopPolling()
    setError('')
    setStage('sending')
    try {
      const token = getToken()
      const r = await fetch(`${API}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(opts),
      })
      const data = await r.json()
      if (!r.ok || !data.success) {
        setStage('failed')
        setError(data.message ?? 'Failed to send M-Pesa prompt. Check your phone number.')
        return
      }
      setTxRef(data.txRef)
      setStage('waiting')
      poll(data.txRef)
    } catch (e: any) {
      setStage('failed')
      setError(e?.message ?? 'Network error. Please try again.')
    }
  }, [poll])

  const reset = useCallback(() => {
    stopPolling()
    setStage('idle')
    setTxRef('')
    setError('')
  }, [])

  return { stage, txRef, error, initiate, reset }
}
