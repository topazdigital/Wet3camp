import React, { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { User, Phone, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Calendar, ChevronRight, LogOut, BedDouble, MapPin } from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { useSEO } from '@/lib/useSEO'

type Tab = 'info' | 'password' | 'bookings' | 'rooms'

export default function Account() {
  useSEO({ title: 'My Account', noIndex: true })
  const { user, logout } = useAuth()

  const [tab, setTab] = useState<Tab>('info')

  // ── Profile info ──────────────────────────────────────────────────────────
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [infoMsg,  setInfoMsg]  = useState<{ok: boolean; text: string} | null>(null)
  const [infoSaving, setInfoSaving] = useState(false)

  // ── Password ──────────────────────────────────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [pwMsg,  setPwMsg]  = useState<{ok: boolean; text: string} | null>(null)
  const [pwSaving, setPwSaving] = useState(false)

  // ── Bookings ──────────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState<any[]>([])
  const [bookLoading, setBookLoading] = useState(false)

  // ── Room bookings ─────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState<any[]>([])
  const [roomLoading, setRoomLoading] = useState(false)

  useEffect(() => {
    api.profile.get().then(data => {
      setName(data.name  ?? '')
      setPhone(data.phone ?? '')
      setEmail(data.email ?? '')
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab !== 'bookings') return
    setBookLoading(true)
    api.bookings.list().then(data => {
      const list = Array.isArray(data) ? data : (data as any).bookings ?? []
      setBookings(list)
    }).catch(() => setBookings([])).finally(() => setBookLoading(false))
  }, [tab])

  useEffect(() => {
    if (tab !== 'rooms') return
    setRoomLoading(true)
    fetch('/api/bookings/my-rooms', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(data => setRooms(Array.isArray(data) ? data : []))
      .catch(() => setRooms([]))
      .finally(() => setRoomLoading(false))
  }, [tab])

  const saveInfo = async () => {
    setInfoMsg(null); setInfoSaving(true)
    try {
      await api.profile.update({ name, phone })
      setInfoMsg({ ok: true, text: 'Account updated successfully.' })
    } catch (e: any) {
      setInfoMsg({ ok: false, text: e?.message ?? 'Failed to save changes.' })
    } finally { setInfoSaving(false) }
  }

  const changePassword = async () => {
    setPwMsg(null)
    if (!currentPw) { setPwMsg({ ok: false, text: 'Enter your current password.' }); return }
    if (newPw.length < 8) { setPwMsg({ ok: false, text: 'New password must be at least 8 characters.' }); return }
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: 'New passwords do not match.' }); return }
    setPwSaving(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message)
      setPwMsg({ ok: true, text: 'Password changed successfully.' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (e: any) {
      setPwMsg({ ok: false, text: e?.message ?? 'Failed to change password.' })
    } finally { setPwSaving(false) }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'info',     label: 'Account Info' },
    { id: 'password', label: 'Password' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'rooms',    label: 'Rooms' },
  ]

  function statusColor(s: string) {
    if (s === 'confirmed') return 'text-emerald-400 bg-emerald-400/10'
    if (s === 'pending')   return 'text-yellow-400 bg-yellow-400/10'
    if (s === 'cancelled') return 'text-red-400 bg-red-400/10'
    return 'text-gray-400 bg-gray-400/10'
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">

          {/* Header row */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="text-text-muted hover:text-text-light transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B0000] to-[#FFD700]/40 flex items-center justify-center text-white font-bold text-lg">
              {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-light">{user?.name ?? 'My Account'}</h1>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
            <button onClick={logout} className="ml-auto flex items-center gap-1.5 text-xs text-text-muted hover:text-red-400 transition-colors">
              <LogOut size={14} /> Sign out
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-card-bg border border-color rounded-xl p-1 mb-6">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t.id ? 'bg-[#8B0000] text-white shadow' : 'text-text-muted hover:text-text-light'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Account Info tab ── */}
          {tab === 'info' && (
            <div className="bg-card-bg border border-color rounded-2xl p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Display Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-9 pr-4 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder:text-text-muted focus:outline-none focus:border-[#8B0000]/60 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    value={email}
                    disabled
                    className="w-full pl-9 pr-4 py-2.5 bg-dark-bg/50 border border-color rounded-xl text-sm text-text-muted opacity-60 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-1">Email cannot be changed. Contact support if needed.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Phone / WhatsApp</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full pl-9 pr-4 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder:text-text-muted focus:outline-none focus:border-[#8B0000]/60 transition"
                  />
                </div>
              </div>

              {infoMsg && (
                <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 ${infoMsg.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {infoMsg.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {infoMsg.text}
                </div>
              )}

              <button
                onClick={saveInfo}
                disabled={infoSaving}
                className="w-full py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#8B0000]/80 text-white text-sm font-semibold transition-all disabled:opacity-60"
              >
                {infoSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ── Change Password tab ── */}
          {tab === 'password' && (
            <div className="bg-card-bg border border-color rounded-2xl p-6 space-y-5">
              <p className="text-xs text-text-muted">
                If you signed up with Google or Apple, you may not have a password set. In that case, leave "Current password" blank and just set a new one.
              </p>

              {[
                { label: 'Current Password', val: currentPw, set: setCurrentPw, show: showCurrent, setShow: setShowCurrent },
                { label: 'New Password',     val: newPw,     set: setNewPw,     show: showNew,     setShow: setShowNew     },
                { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw, show: showNew, setShow: setShowNew },
              ].map(({ label, val, set, show, setShow }, i) => (
                <div key={i}>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">{label}</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type={show ? 'text' : 'password'}
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder:text-text-muted focus:outline-none focus:border-[#8B0000]/60 transition"
                    />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light transition-colors">
                      {show ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}

              {pwMsg && (
                <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 ${pwMsg.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {pwMsg.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {pwMsg.text}
                </div>
              )}

              <button
                onClick={changePassword}
                disabled={pwSaving}
                className="w-full py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#8B0000]/80 text-white text-sm font-semibold transition-all disabled:opacity-60"
              >
                {pwSaving ? 'Updating…' : 'Change Password'}
              </button>
            </div>
          )}

          {/* ── My Bookings tab ── */}
          {tab === 'bookings' && (
            <div className="space-y-3">
              {bookLoading && (
                <div className="text-center py-16 text-text-muted text-sm">Loading bookings…</div>
              )}
              {!bookLoading && bookings.length === 0 && (
                <div className="bg-card-bg border border-color rounded-2xl p-10 text-center">
                  <Calendar size={32} className="mx-auto mb-3 text-text-muted opacity-50" />
                  <p className="text-text-muted text-sm">No bookings yet.</p>
                  <Link href="/" className="mt-4 inline-block text-xs text-[#FFD700] hover:underline">Browse companions →</Link>
                </div>
              )}
              {bookings.map((b: any) => (
                <div key={b.id} className="bg-card-bg border border-color rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B0000]/40 to-[#FFD700]/20 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-[#FFD700]/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-light truncate">{b.escort_name ?? b.escort_id ?? 'Booking'}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {b.date ? new Date(b.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      {b.duration ? ` · ${b.duration}` : ''}
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${statusColor(b.status)}`}>
                    {b.status ?? 'pending'}
                  </span>
                  <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* ── My Rooms tab ── */}
          {tab === 'rooms' && (
            <div className="space-y-3">
              {roomLoading && (
                <div className="text-center py-16 text-text-muted text-sm">Loading room bookings…</div>
              )}
              {!roomLoading && rooms.length === 0 && (
                <div className="bg-card-bg border border-color rounded-2xl p-10 text-center">
                  <BedDouble size={32} className="mx-auto mb-3 text-text-muted opacity-50" />
                  <p className="text-text-muted text-sm">No room bookings yet.</p>
                  <Link href="/rooms" className="mt-4 inline-block text-xs text-[#FFD700] hover:underline">Browse rooms →</Link>
                </div>
              )}
              {rooms.map((r: any) => (
                <div key={r.id} className="bg-card-bg border border-color rounded-2xl p-4 flex items-start gap-4">
                  {r.image ? (
                    <img src={r.image} alt={r.room_name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8B0000]/30 to-[#FFD700]/10 flex items-center justify-center flex-shrink-0">
                      <BedDouble size={18} className="text-[#FFD700]/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-light truncate">{r.room_name ?? r.hotel ?? 'Room'}</p>
                    {(r.hotel || r.city) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-text-muted flex-shrink-0" />
                        <p className="text-xs text-text-muted truncate">{[r.hotel, r.city].filter(Boolean).join(' · ')}</p>
                      </div>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      {r.check_in ? new Date(r.check_in).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      {r.check_out ? ` → ${new Date(r.check_out).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}` : ''}
                      {r.nights ? ` · ${r.nights} night${r.nights !== 1 ? 's' : ''}` : ''}
                      {r.guests > 1 ? ` · ${r.guests} guests` : ''}
                    </p>
                    {r.total_amount != null && (
                      <p className="text-xs font-semibold text-[#FFD700]/80 mt-0.5">
                        KES {Number(r.total_amount).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${statusColor(r.status)}`}>
                    {r.status ?? 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
