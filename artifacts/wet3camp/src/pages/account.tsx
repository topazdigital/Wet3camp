import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'wouter'
import {
  AlertCircle, ArrowDownRight, ArrowRight, Bell, BedDouble, CalendarDays, Check,
  CheckCircle2, ChevronRight, Clock3, Eye, EyeOff, Heart, LockKeyhole, LogOut,
  Mail, MapPin, MessageCircle, RefreshCw, ShieldCheck, UserRound, Phone,
} from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'
import { api, getToken } from '@/lib/api'
import { useSEO } from '@/lib/useSEO'

type Tab = 'overview' | 'requests' | 'rooms' | 'settings'
type Booking = {
  id: string | number; escortId: string; escortName: string; escortImage?: string
  escortArea?: string; date?: string; time?: string; duration?: number | string
  type?: string; amount?: number | string; location?: string; notes?: string
  status?: string; createdAt?: string
}
type RoomBooking = Record<string, any>
type Thread = {
  escortId: string; escortName: string; escortImage?: string
  messages: { id: string | number; content: string; fromEscort: boolean; createdAt: string; readAt?: string | null }[]
}
type Notice = {
  id: string; type: string; text: string; link: string; dot?: string
  avatar?: string | null; read_at?: string | null; read?: boolean; created_at?: string; time?: string
}
type Profile = { name?: string | null; email?: string | null; phone?: string | null; id?: string | number }
type LoadState<T> = { data: T; loading: boolean; error: string | null }

const initial = <T,>(data: T): LoadState<T> => ({ data, loading: true, error: null })
const dateLabel = (date?: string) => {
  if (!date) return 'Date to be confirmed'
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
const shortTime = (value?: string) => value ? value.slice(0, 5) : ''
const humanStatus = (status?: string) => (status || 'pending').replace(/[_-]/g, ' ')
const statusTone = (status?: string) => {
  const value = (status || 'pending').toLowerCase()
  if (value === 'confirmed' || value === 'completed') return 'text-emerald-300 bg-emerald-300/10 border-emerald-300/15'
  if (value === 'cancelled' || value === 'declined' || value === 'rejected') return 'text-rose-300 bg-rose-300/10 border-rose-300/15'
  return 'text-amber-200 bg-amber-200/10 border-amber-200/15'
}
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.'

export default function Account() {
  useSEO({ title: 'My Account', noIndex: true })
  const { user, logout } = useAuth()
  const userKey = user?.id == null ? '' : String(user.id)
  const [tab, setTab] = useState<Tab>('overview')
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', phone: '' })
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [infoMsg, setInfoMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [infoSaving, setInfoSaving] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pwSaving, setPwSaving] = useState(false)
  const [bookings, setBookings] = useState<LoadState<Booking[]>>(initial([]))
  const [rooms, setRooms] = useState<LoadState<RoomBooking[]>>(initial([]))
  const [favorites, setFavorites] = useState<LoadState<string[]>>(initial([]))
  const [threads, setThreads] = useState<LoadState<Thread[]>>(initial([]))
  const [notices, setNotices] = useState<LoadState<Notice[]>>(initial([]))
  const activeLoadCancel = useRef<(() => void) | null>(null)
  const [noticeBusy, setNoticeBusy] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const loadDashboard = useCallback(() => {
    if (!userKey) return () => {}
    let active = true
    setBookings(initial([])); setRooms(initial([])); setFavorites(initial([]))
    setThreads(initial([])); setNotices(initial([]))
    setProfileLoading(true); setProfileError(null)
    const load = async <T,>(task: Promise<T>, setter: (state: LoadState<any>) => void, normalize: (data: any) => T) => {
      try {
        const result = await task
        if (active) setter({ data: normalize(result), loading: false, error: null })
      } catch (error) {
        if (active) setter({ data: [], loading: false, error: messageOf(error) })
      }
    }
    const profileTask = api.profile.get().then((result: Profile) => {
      if (!active) return
      setProfile(result)
      setName(result.name ?? '')
      setPhone(result.phone ?? '')
      setProfileLoading(false)
    }).catch((error: unknown) => {
      if (!active) return
      setProfileError(messageOf(error)); setProfileLoading(false)
    })
    void load(api.bookings.list(), setBookings, (data: any) => Array.isArray(data) ? data : data?.bookings ?? [])
    void load(api.favorites.list(), setFavorites, (data: any) => Array.isArray(data) ? data : [])
    void load(api.messages.list(), setThreads, (data: any) => Array.isArray(data) ? data : [])
    void load(api.notifications.list(), setNotices, (data: any) => Array.isArray(data) ? data : [])
    const token = getToken()
    const roomTask = token
      ? fetch('/api/bookings/my-rooms', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }).then(async response => {
          if (!response.ok) {
            const body = await response.json().catch(() => ({}))
            throw new Error(body.message || response.statusText || 'Could not load room requests.')
          }
          return response.json()
        })
      : Promise.reject(new Error('Sign in again to load room requests.'))
    void load(roomTask, setRooms, (data: any) => Array.isArray(data) ? data : [])
    void profileTask
    return () => { active = false }
  }, [userKey])

  useEffect(() => {
    if (!userKey) {
      activeLoadCancel.current?.()
      activeLoadCancel.current = null
      setProfile({ name: '', email: '', phone: '' }); setName(''); setPhone('')
      setProfileLoading(false); setProfileError(null)
      setBookings({ data: [], loading: false, error: null })
      setRooms({ data: [], loading: false, error: null })
      setFavorites({ data: [], loading: false, error: null })
      setThreads({ data: [], loading: false, error: null })
      setNotices({ data: [], loading: false, error: null })
      return
    }
    activeLoadCancel.current?.()
    activeLoadCancel.current = loadDashboard()
    return () => {
      activeLoadCancel.current?.()
      activeLoadCancel.current = null
    }
  }, [userKey, loadDashboard])

  const refresh = () => {
    activeLoadCancel.current?.()
    activeLoadCancel.current = loadDashboard()
  }
  const openBookings = useMemo(() => bookings.data
    .filter(booking => {
      const status = (booking.status || 'pending').toLowerCase()
      if (status === 'pending') return true
      if (status !== 'confirmed') return false
      const date = booking.date ? new Date(booking.date) : null
      if (!date || Number.isNaN(date.getTime())) return true
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      date.setHours(0, 0, 0, 0)
      return date >= today
    })
    .sort((a, b) => {
      const aDate = a.date ? Date.parse(a.date) : Number.POSITIVE_INFINITY
      const bDate = b.date ? Date.parse(b.date) : Number.POSITIVE_INFINITY
      return (Number.isNaN(aDate) ? Number.POSITIVE_INFINITY : aDate) - (Number.isNaN(bDate) ? Number.POSITIVE_INFINITY : bDate)
    }), [bookings.data])
  const openCount = openBookings.length
  const unreadCount = notices.data.filter(n => !(n.read_at || n.read)).length
  const lastThreads = [...threads.data].sort((a, b) => {
    const da = a.messages?.[a.messages.length - 1]?.createdAt || ''
    const db = b.messages?.[b.messages.length - 1]?.createdAt || ''
    return db.localeCompare(da)
  }).slice(0, 3)

  const saveInfo = async () => {
    setInfoMsg(null); setInfoSaving(true)
    try {
      const updated = await api.profile.update({ name, phone })
      setProfile(prev => ({ ...prev, ...updated, name: updated.name ?? name, phone: updated.phone ?? phone }))
      setInfoMsg({ ok: true, text: 'Your contact details are saved.' })
    } catch (error) {
      setInfoMsg({ ok: false, text: messageOf(error) })
    } finally { setInfoSaving(false) }
  }

  const changePassword = async () => {
    setPwMsg(null)
    if (!currentPw) { setPwMsg({ ok: false, text: 'Enter your current password.' }); return }
    if (newPw.length < 8) { setPwMsg({ ok: false, text: 'Use at least 8 characters for your new password.' }); return }
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: 'Your new passwords do not match.' }); return }
    const token = getToken()
    if (!token) { setPwMsg({ ok: false, text: 'Your session has expired. Sign in again.' }); return }
    setPwSaving(true)
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PATCH', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || response.statusText || 'Could not update password.')
      setPwMsg({ ok: true, text: 'Password changed successfully.' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (error) {
      setPwMsg({ ok: false, text: messageOf(error) })
    } finally { setPwSaving(false) }
  }

  const markNoticeRead = async (notice: Notice) => {
    if (notice.read_at || notice.read) return
    setNoticeBusy(notice.id)
    try {
      await api.notifications.markRead(notice.id)
      setNotices(prev => ({ ...prev, data: prev.data.map(item => item.id === notice.id ? { ...item, read: true, read_at: new Date().toISOString() } : item) }))
    } catch {
      setNotices(prev => ({ ...prev, error: 'Could not update this notification. Try again.' }))
    } finally { setNoticeBusy(null) }
  }
  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      await api.notifications.markAllRead()
      setNotices(prev => ({ ...prev, data: prev.data.map(item => ({ ...item, read: true, read_at: item.read_at || new Date().toISOString() })) }))
    } catch {
      setNotices(prev => ({ ...prev, error: 'Could not update notifications. Try again.' }))
    } finally { setMarkingAll(false) }
  }

  const tabs: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
    { id: 'overview', label: 'Overview', icon: CalendarDays },
    { id: 'requests', label: 'Requests', icon: Clock3 },
    { id: 'rooms', label: 'Room requests', icon: BedDouble },
    { id: 'settings', label: 'Account & security', icon: ShieldCheck },
  ]
  const displayName = profile.name || user?.name || 'Your account'

  return (
    <div className="min-h-[100dvh] bg-[#111111] text-[#f2eee8]">
      <Header />
      <div className="flex min-h-[calc(100dvh-64px)]">
        <Sidebar />
        <main className="mx-auto w-full min-w-0 max-w-[1380px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12">
          <div className="mb-7 flex flex-col gap-5 border-b border-[#ffffff12] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-[#FFD700]">
                <span className="h-px w-6 bg-[#FFD700]" /> Private client space
              </p>
              <h1 className="text-3xl font-semibold tracking-[-.04em] sm:text-[2.65rem]" data-testid="text-account-title">
                Good to see you, <span className="text-[#FFD700]">{displayName.split(' ')[0]}</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[#a7a19a]">A discreet place to keep track of your requests, conversations and saved profiles.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refresh} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ffffff1b] bg-[#ffffff08] px-3 text-xs font-semibold text-[#c9c3bb] transition hover:border-[#FFD70066] hover:text-white" data-testid="button-refresh-account">
                <RefreshCw size={14} /> Refresh
              </button>
              <button onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-[#a7a19a] transition hover:bg-rose-400/10 hover:text-rose-200" data-testid="button-sign-out">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryTile label="Active requests" value={bookings.loading ? '—' : String(openCount)} note="Pending or upcoming" icon={CalendarDays} accent />
            <SummaryTile label="Saved profiles" value={favorites.loading ? '—' : String(favorites.data.length)} note="Your private shortlist" icon={Heart} />
            <SummaryTile label="Conversations" value={threads.loading ? '—' : String(threads.data.length)} note="Message threads" icon={MessageCircle} />
            <SummaryTile label="Unread updates" value={notices.loading ? '—' : String(unreadCount)} note="Account notifications" icon={Bell} />
          </div>

          <nav className="scrollbar-hide mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-[#ffffff12] bg-[#191919] p-1.5" aria-label="Account sections">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition sm:px-4 ${tab === id ? 'bg-[#8B0000] text-white' : 'text-[#a7a19a] hover:bg-white/[.05] hover:text-white'}`} data-testid={`tab-${id}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </nav>

          {tab === 'overview' && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)]">
              <section className="min-w-0 space-y-5">
                <div className="overflow-hidden rounded-2xl border border-[#ffffff12] bg-[#191919]">
                  <div className="flex items-center justify-between border-b border-[#ffffff10] px-5 py-4 sm:px-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8f8981]">Your activity</p>
                      <h2 className="mt-1 text-lg font-semibold">Appointment requests</h2>
                    </div>
                    <button onClick={() => setTab('requests')} className="inline-flex items-center gap-1 text-xs font-semibold text-[#FFD700] hover:text-[#FFD700]" data-testid="button-view-all-requests">View all <ArrowRight size={14} /></button>
                  </div>
                  {bookings.loading ? <SkeletonRows count={2} /> : bookings.error ? <ErrorBlock message={bookings.error} retry={refresh} /> : bookings.data.length ? (
                    <div className="divide-y divide-[#ffffff0d]">
                      {openBookings.slice(0, 3).map(booking => <BookingRow key={booking.id} booking={booking} />)}
                    </div>
                  ) : <EmptyBlock icon={CalendarDays} title="No open requests" text="Pending requests and confirmed upcoming appointments will appear here." action={<Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-[#8B0000] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#a00000]" data-testid="link-browse-profiles">Browse profiles <ArrowRight size={13} /></Link>} />}
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#ffffff12] bg-[#191919]">
                  <div className="flex items-center justify-between border-b border-[#ffffff10] px-5 py-4 sm:px-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8f8981]">Recent messages</p>
                      <h2 className="mt-1 text-lg font-semibold">Your conversations</h2>
                    </div>
                    <Link href="/messages" className="inline-flex items-center gap-1 text-xs font-semibold text-[#FFD700] hover:text-[#FFD700]" data-testid="link-all-messages">Open inbox <ArrowRight size={14} /></Link>
                  </div>
                  {threads.loading ? <SkeletonRows count={2} /> : threads.error ? <ErrorBlock message={threads.error} retry={refresh} /> : lastThreads.length ? (
                    <div className="divide-y divide-[#ffffff0d]">
                      {lastThreads.map(thread => {
                        const latest = thread.messages?.[thread.messages.length - 1]
                        return <div key={thread.escortId} className="flex items-center gap-3 px-5 py-4 sm:px-6" data-testid={`thread-summary-${thread.escortId}`}>
                          <Avatar src={thread.escortImage} name={thread.escortName} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#eee9e2]" data-testid={`text-thread-name-${thread.escortId}`}>{thread.escortName || 'Conversation'}</p>
                            <p className="mt-1 truncate text-xs text-[#8f8981]" data-testid={`text-thread-last-message-${thread.escortId}`}>{latest?.content || 'No messages yet'}</p>
                          </div>
                          <span className="shrink-0 text-[10px] text-[#756f68]">{latest?.createdAt ? dateLabel(latest.createdAt) : ''}</span>
                        </div>
                      })}
                    </div>
                  ) : <EmptyBlock icon={MessageCircle} title="No conversations" text="Your message threads with profiles will appear here." action={<Link href="/messages" className="text-xs font-semibold text-[#FFD700] hover:underline" data-testid="link-start-messaging">Go to messages</Link>} />}
                </div>
              </section>

              <aside className="space-y-5">
                <section className="rounded-2xl border border-[#8B000066] bg-[linear-gradient(135deg,#240808_0%,#191919_70%)] p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#FFD700]">Quick access</p>
                      <h2 className="mt-1 text-lg font-semibold">Keep things close</h2>
                    </div>
                    <ArrowDownRight className="text-[#FFD700]" size={20} />
                  </div>
                  <div className="space-y-2">
                    <QuickLink href="/favorites" icon={Heart} title="Saved profiles" detail="Return to your shortlist" testId="link-favorites" />
                    <QuickLink href="/messages" icon={MessageCircle} title="Messages" detail="Pick up a conversation" testId="link-messages" />
                    <button onClick={() => setTab('rooms')} className="flex w-full items-center gap-3 rounded-xl border border-[#ffffff0d] bg-[#ffffff06] px-3.5 py-3 text-left transition hover:border-[#FFD70055] hover:bg-[#ffffff0a]" data-testid="button-room-requests">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#FFD70017] text-[#FFD700]"><BedDouble size={16} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-semibold">Room requests</span><span className="mt-0.5 block text-[10px] text-[#8f8981]">Review your room bookings</span></span><ChevronRight size={15} className="text-[#726d66]" />
                    </button>
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-[#ffffff12] bg-[#191919]">
                  <div className="flex items-center justify-between border-b border-[#ffffff10] px-5 py-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8f8981]">Private updates</p>
                      <h2 className="mt-1 text-lg font-semibold">Notifications</h2>
                    </div>
                    {unreadCount > 0 && <span className="rounded-full bg-[#FFD700] px-2 py-1 text-[10px] font-bold text-[#171512]">{unreadCount} new</span>}
                  </div>
                  <NoticeList state={notices} busy={noticeBusy} onRead={markNoticeRead} retry={refresh} compact />
                  <div className="border-t border-[#ffffff0d] px-5 py-3">
                    {unreadCount > 0 ? <button onClick={markAllRead} disabled={markingAll} className="text-xs font-semibold text-[#FFD700] disabled:opacity-50" data-testid="button-mark-all-read">{markingAll ? 'Updating…' : 'Mark all as read'}</button> : <span className="text-[11px] text-[#77716a]">You’re all caught up.</span>}
                  </div>
                </section>
              </aside>
            </div>
          )}

          {tab === 'requests' && (
            <section className="overflow-hidden rounded-2xl border border-[#ffffff12] bg-[#191919]">
              <div className="border-b border-[#ffffff10] px-5 py-5 sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#FFD700]">Appointment requests</p>
                <h2 className="mt-1 text-xl font-semibold">Request history</h2>
                <p className="mt-1 text-xs text-[#8f8981]">These are requests, not paid bookings. Payment is arranged offline with the profile.</p>
              </div>
              {bookings.loading ? <SkeletonRows count={4} /> : bookings.error ? <ErrorBlock message={bookings.error} retry={refresh} /> : bookings.data.length ? <div className="divide-y divide-[#ffffff0d]">{bookings.data.map(b => <BookingRow key={b.id} booking={b} detailed />)}</div> : <EmptyBlock icon={CalendarDays} title="Your request history is empty" text="Your sent appointment requests and their status will show here." action={<Link href="/" className="rounded-lg bg-[#8B0000] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#a00000]" data-testid="link-browse-after-empty">Browse profiles</Link>} />}
            </section>
          )}

          {tab === 'rooms' && (
            <section className="overflow-hidden rounded-2xl border border-[#ffffff12] bg-[#191919]">
              <div className="border-b border-[#ffffff10] px-5 py-5 sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#FFD700]">Rooms</p>
                <h2 className="mt-1 text-xl font-semibold">Your room requests</h2>
                <p className="mt-1 text-xs text-[#8f8981]">Review details and status for rooms you’ve requested.</p>
              </div>
              {rooms.loading ? <SkeletonRows count={3} /> : rooms.error ? <ErrorBlock message={rooms.error} retry={refresh} /> : rooms.data.length ? <div className="divide-y divide-[#ffffff0d]">{rooms.data.map((room, index) => <RoomRow key={room.id ?? index} room={room} />)}</div> : <EmptyBlock icon={BedDouble} title="No room requests" text="Room requests you make will be listed here." action={<Link href="/rooms" className="rounded-lg bg-[#8B0000] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#a00000]" data-testid="link-browse-rooms">Browse rooms</Link>} />}
            </section>
          )}

          {tab === 'settings' && (
            <div className="grid gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border border-[#ffffff12] bg-[#191919] p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#FFD700]">Contact profile</p><h2 className="mt-1 text-xl font-semibold">Account details</h2></div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFD70016] text-[#FFD700]"><UserRound size={18} /></span>
                </div>
                {profileLoading ? <div className="space-y-4"><div className="h-10 animate-pulse rounded-xl bg-white/[.06]" /><div className="h-10 animate-pulse rounded-xl bg-white/[.06]" /><div className="h-10 animate-pulse rounded-xl bg-white/[.06]" /></div> : profileError ? <ErrorBlock message={profileError} retry={refresh} /> : (
                  <div className="space-y-4">
                    <Field label="Display name" icon={UserRound}><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inputClass} data-testid="input-account-name" /></Field>
                    <Field label="Email address" icon={Mail}><input value={profile.email || user?.email || ''} disabled className={`${inputClass} cursor-not-allowed opacity-60`} data-testid="input-account-email" /></Field>
                    <p className="-mt-2 text-[11px] text-[#77716a]">Email address is fixed. Contact support if it needs to be updated.</p>
                    <Field label="Phone / WhatsApp" icon={Phone}><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" className={inputClass} data-testid="input-account-phone" /></Field>
                    {infoMsg && <Feedback ok={infoMsg.ok} text={infoMsg.text} />}
                    <button onClick={saveInfo} disabled={infoSaving} className={primaryButton} data-testid="button-save-profile">{infoSaving ? 'Saving details…' : 'Save contact details'}</button>
                  </div>
                )}
              </section>
              <section className="rounded-2xl border border-[#ffffff12] bg-[#191919] p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#FFD700]">Sign-in safety</p><h2 className="mt-1 text-xl font-semibold">Change password</h2></div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFD70016] text-[#FFD700]"><LockKeyhole size={18} /></span>
                </div>
                 <p className="mb-5 text-xs leading-relaxed text-[#8f8981]">Choose a password you don’t use on other sites.</p>
                <div className="space-y-4">
                  <PasswordField label="Current password" value={currentPw} onChange={setCurrentPw} visible={showCurrent} onToggle={() => setShowCurrent(v => !v)} testId="input-current-password" />
                  <PasswordField label="New password" value={newPw} onChange={setNewPw} visible={showNew} onToggle={() => setShowNew(v => !v)} testId="input-new-password" />
                  <PasswordField label="Confirm new password" value={confirmPw} onChange={setConfirmPw} visible={showNew} onToggle={() => setShowNew(v => !v)} testId="input-confirm-password" />
                  {pwMsg && <Feedback ok={pwMsg.ok} text={pwMsg.text} />}
                  <button onClick={changePassword} disabled={pwSaving} className={primaryButton} data-testid="button-change-password">{pwSaving ? 'Changing password…' : 'Update password'}</button>
                </div>
              </section>
              <section className="flex items-center gap-4 rounded-2xl border border-[#ffffff12] bg-[#191919] p-5 sm:p-6 xl:col-span-2">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FFD70016] text-[#FFD700]"><ShieldCheck size={19} /></span>
                <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">Room and appointment settings</h3><p className="mt-1 text-xs text-[#8f8981]">Review the status and details of your requests in one place.</p></div>
                <button onClick={() => setTab('rooms')} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#FFD700] hover:text-[#FFD700]" data-testid="button-open-room-settings">Room requests <ArrowRight size={14} /></button>
              </section>
            </div>
          )}
          <div className="mt-7 flex items-center justify-center gap-2 text-[10px] text-[#706a63]" data-testid="text-discretion-note"><ShieldCheck size={12} /> Manage your account and client activity in one place.</div>
        </main>
      </div>
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-[#ffffff15] bg-[#111111] py-3 pl-10 pr-3 text-sm text-[#eee9e2] outline-none transition placeholder:text-[#615d57] focus:border-[#FFD70088]'
const primaryButton = 'w-full rounded-xl bg-[#8B0000] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#a00000] disabled:cursor-wait disabled:opacity-55'

function SummaryTile({ label, value, note, icon: Icon, accent = false }: { label: string; value: string; note: string; icon: typeof CalendarDays; accent?: boolean }) {
  return <div className={`rounded-2xl border p-4 sm:p-5 ${accent ? 'border-[#8B000066] bg-[#8B00000d]' : 'border-[#ffffff12] bg-[#191919]'}`} data-testid={`summary-${label.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#9b958d]">{label}</span><Icon size={15} className={accent ? 'text-[#FFD700]' : 'text-[#756f68]'} /></div>
    <p className="mt-3 text-2xl font-semibold tracking-tight" data-testid={`value-${label.toLowerCase().replace(/\s/g, '-')}`}>{value}</p>
    <p className="mt-1 text-[10px] text-[#756f68]">{note}</p>
  </div>
}

function Avatar({ src, name }: { src?: string | null; name?: string }) {
  return src ? <img src={src} alt={name || 'Profile'} className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover" data-testid="img-profile-avatar" /> : <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#FFD70033] bg-[#FFD70013] text-xs font-bold text-[#FFD700]" data-testid="avatar-fallback">{(name || 'P').slice(0, 1).toUpperCase()}</div>
}

function BookingRow({ booking, detailed = false }: { booking: Booking; detailed?: boolean }) {
  return <article className="flex gap-3 px-5 py-4 sm:gap-4 sm:px-6" data-testid={`booking-row-${booking.id}`}>
    <Avatar src={booking.escortImage} name={booking.escortName} />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-sm font-semibold" data-testid={`text-booking-escort-${booking.id}`}>{booking.escortName || 'Appointment request'}</p>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize ${statusTone(booking.status)}`} data-testid={`status-booking-${booking.id}`}>{humanStatus(booking.status)}</span>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8f8981]" data-testid={`text-booking-date-${booking.id}`}>
        <span>{dateLabel(booking.date)}</span>{booking.time && <><span className="text-[#4e4a45]">/</span><span>{shortTime(booking.time)}</span></>}
        {booking.duration && <><span className="text-[#4e4a45]">/</span><span>{booking.duration} {typeof booking.duration === 'number' ? 'hours' : ''}</span></>}
      </p>
      {detailed && <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#77716a]">
        {booking.escortArea && <span className="inline-flex items-center gap-1"><MapPin size={11} />{booking.escortArea}</span>}
        {booking.type && <span className="capitalize">{booking.type.replace(/[_-]/g, ' ')}</span>}
        {booking.location && <span>{booking.location}</span>}
        {booking.amount != null && <span>KES {Number(booking.amount).toLocaleString('en-KE')} · arranged offline</span>}
        {booking.notes && <span className="basis-full italic">{booking.notes}</span>}
      </div>}
    </div>
    <ChevronRight className="mt-1 shrink-0 text-[#625d56]" size={15} />
  </article>
}

function RoomRow({ room }: { room: RoomBooking }) {
  const place = [room.hotel, room.city].filter(Boolean).join(' · ')
  return <article className="flex gap-3 px-5 py-4 sm:gap-4 sm:px-6" data-testid={`room-request-${room.id ?? 'item'}`}>
    {room.image ? <img src={room.image} alt={room.room_name || 'Room'} className="h-14 w-14 shrink-0 rounded-xl border border-white/10 object-cover" data-testid={`img-room-${room.id ?? 'item'}`} /> : <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#FFD70014] text-[#FFD700]"><BedDouble size={19} /></div>}
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold" data-testid={`text-room-name-${room.id ?? 'item'}`}>{room.room_name || room.hotel || 'Room request'}</p><span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize ${statusTone(room.status)}`} data-testid={`status-room-${room.id ?? 'item'}`}>{humanStatus(room.status)}</span></div>
      {place && <p className="mt-1 flex items-center gap-1 text-[11px] text-[#8f8981]"><MapPin size={11} />{place}</p>}
      <p className="mt-1 text-[11px] text-[#77716a]">
        {room.check_in ? dateLabel(room.check_in) : 'Dates not set'}{room.check_out ? ` → ${dateLabel(room.check_out)}` : ''}
        {room.nights ? ` · ${room.nights} night${room.nights !== 1 ? 's' : ''}` : ''}{room.guests ? ` · ${room.guests} guest${room.guests !== 1 ? 's' : ''}` : ''}
      </p>
    </div>
    <ChevronRight className="mt-1 shrink-0 text-[#625d56]" size={15} />
  </article>
}

function QuickLink({ href, icon: Icon, title, detail, testId }: { href: string; icon: typeof Heart; title: string; detail: string; testId: string }) {
  return <Link href={href} className="flex items-center gap-3 rounded-xl border border-[#ffffff0d] bg-[#ffffff06] px-3.5 py-3 transition hover:border-[#FFD70055] hover:bg-[#ffffff0a]" data-testid={testId}>
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#FFD70017] text-[#FFD700]"><Icon size={16} /></span>
    <span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{title}</span><span className="mt-0.5 block text-[10px] text-[#8f8981]">{detail}</span></span>
    <ChevronRight size={15} className="text-[#726d66]" />
  </Link>
}

function SkeletonRows({ count }: { count: number }) {
  return <div className="divide-y divide-[#ffffff0d]" aria-label="Loading">
    {Array.from({ length: count }, (_, index) => <div key={index} className="flex items-center gap-3 px-5 py-4"><div className="h-10 w-10 animate-pulse rounded-full bg-white/[.07]" /><div className="flex-1 space-y-2"><div className="h-3 w-1/3 animate-pulse rounded bg-white/[.07]" /><div className="h-2.5 w-2/3 animate-pulse rounded bg-white/[.05]" /></div><div className="h-5 w-16 animate-pulse rounded-full bg-white/[.05]" /></div>)}
  </div>
}

function EmptyBlock({ icon: Icon, title, text, action }: { icon: typeof CalendarDays; title: string; text: string; action?: React.ReactNode }) {
  return <div className="flex flex-col items-center px-5 py-10 text-center" data-testid="state-empty">
    <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-[#FFD7002b] bg-[#FFD7000d] text-[#FFD700]"><Icon size={18} /></span>
    <h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 max-w-sm text-xs leading-relaxed text-[#8f8981]">{text}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
}

function ErrorBlock({ message, retry }: { message: string; retry: () => void }) {
  return <div className="flex items-center gap-3 px-5 py-6" role="alert" data-testid="state-error">
    <AlertCircle size={17} className="shrink-0 text-rose-300" />
    <p className="min-w-0 flex-1 text-xs leading-relaxed text-[#c4bcb3]">{message}</p>
    <button onClick={retry} className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-[#FFD700] hover:bg-white/5" data-testid="button-retry-load">Retry</button>
  </div>
}

function NoticeList({ state, busy, onRead, retry, compact = false }: { state: LoadState<Notice[]>; busy: string | null; onRead: (notice: Notice) => void; retry: () => void; compact?: boolean }) {
  if (state.loading) return <div className="p-5"><div className="h-12 animate-pulse rounded-xl bg-white/[.05]" /><div className="mt-2 h-12 animate-pulse rounded-xl bg-white/[.05]" /></div>
  if (state.error) return <ErrorBlock message={state.error} retry={retry} />
  const rows = compact ? state.data.slice(0, 3) : state.data
  if (!rows.length) return <div className="px-5 py-8 text-center" data-testid="state-no-notifications"><Bell size={19} className="mx-auto mb-2 text-[#635e57]" /><p className="text-xs text-[#8f8981]">No notifications so far.</p></div>
  return <div className="divide-y divide-[#ffffff0d]">
    {rows.map(notice => {
      const read = !!(notice.read_at || notice.read)
      return <div key={notice.id} className={`flex gap-3 px-5 py-3.5 ${read ? 'opacity-65' : ''}`} data-testid={`notification-${notice.id}`}>
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: notice.dot || (read ? '#5f5b55' : '#FFD700') }} />
         <div className="min-w-0 flex-1">
           {notice.link?.startsWith('/') ? <Link href={notice.link} onClick={() => { if (!read) onRead(notice) }} className="text-xs leading-relaxed text-[#d5cfc7] hover:text-[#FFD700]" data-testid={`link-notification-${notice.id}`}>{notice.text}</Link> : <p className="text-xs leading-relaxed text-[#d5cfc7]" data-testid={`text-notification-${notice.id}`}>{notice.text}</p>}
           <p className="mt-1 text-[10px] text-[#77716a]">{notice.created_at ? dateLabel(notice.created_at) : notice.time || notice.type}</p>
         </div>
        {!read && <button onClick={() => onRead(notice)} disabled={busy === notice.id} className="self-start rounded-md p-1 text-[#8f8981] hover:bg-white/10 hover:text-[#FFD700] disabled:opacity-50" aria-label="Mark notification as read" data-testid={`button-read-notification-${notice.id}`}><Check size={14} /></button>}
      </div>
    })}
  </div>
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof UserRound; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#9d968e]">{label}</span><span className="relative block"><Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#77716a]" />{children}</span></label>
}

function PasswordField({ label, value, onChange, visible, onToggle, testId }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; testId: string }) {
  return <Field label={label} icon={LockKeyhole}>
    <input type={visible ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder="At least 8 characters" className={`${inputClass} pr-11`} data-testid={testId} />
    <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#77716a] hover:text-white" aria-label={visible ? 'Hide password' : 'Show password'} data-testid={`button-toggle-${testId}`} >{visible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
  </Field>
}

function Feedback({ ok, text }: { ok: boolean; text: string }) {
  const Icon = ok ? CheckCircle2 : AlertCircle
  return <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs ${ok ? 'border-emerald-300/15 bg-emerald-300/[.07] text-emerald-200' : 'border-rose-300/15 bg-rose-300/[.07] text-rose-200'}`} role="status" data-testid={ok ? 'status-success' : 'status-form-error'}><Icon size={15} className="shrink-0" />{text}</div>
}
