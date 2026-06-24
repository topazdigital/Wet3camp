import React, { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'
import {
  Shield, Users, Calendar, BarChart2, Settings, Plus, Trash2, Edit2, CheckCircle2, XCircle,
  AlertTriangle, Lock, Mail, Eye, EyeOff, TrendingUp, Crown, Key, Instagram,
  Smartphone, Globe, MessageCircle, MessageSquare, Bell, Star, Save, RefreshCw, Camera, Radio, WifiOff,
  DollarSign, MapPin, Award
} from 'lucide-react'
import { useSEO } from '@/lib/useSEO'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts'

async function adminFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('w3c_token')
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

interface AdminEscort {
  id: string; name: string; city: string; tier: string
  online: boolean | number; is_active: boolean | number; verified: boolean | number
  featured?: boolean | number; price_hourly?: number; bookings_count?: number
  image?: string; user_id?: string | number | null
}

const TABS = ['Overview','Escorts','Claims','Clients','Bookings','Revenue','Moderators','Featured','Blog','API Keys','Settings','Reports']

interface Moderator { id: number; name: string; email: string; role: string; level: 1|2|3; status: 'active'|'inactive'; createdAt: string }

const INIT_MODS: Moderator[] = []


interface FeaturedRequest {
  id: number; name: string; city: string; plan: string; amount: number
  txRef: string; date: string; status: 'pending' | 'approved' | 'rejected'
  phone: string
}
const INIT_FEATURED: FeaturedRequest[] = []

function PayHeroTestButton() {
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'err'>('idle')
  const [msg, setMsg] = useState('')

  const run = async () => {
    if (!phone.trim()) { setMsg('Enter a phone number first'); setStatus('err'); return }
    setStatus('loading'); setMsg('')
    try {
      const data = await adminFetch('/admin/payments/payhero/test', { method: 'POST', body: JSON.stringify({ phone: phone.trim() }) })
      setMsg(data.message ?? 'STK push sent ✓')
      setStatus('ok')
    } catch (e: any) {
      setMsg(e?.message ?? 'Test failed')
      setStatus('err')
    }
    setTimeout(() => { setStatus('idle'); setMsg('') }, 10000)
  }

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-text-muted uppercase tracking-widest block">Test STK Push (KES 1)</label>
      <div className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="0712345678"
          className="flex-1 px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#28a745] transition-all"
        />
        <button
          onClick={run}
          disabled={status === 'loading'}
          className="px-3 py-2.5 rounded-xl text-xs font-bold bg-[#28a745] text-white hover:bg-[#218838] disabled:opacity-60 flex items-center gap-1 transition-all"
        >
          {status === 'loading' ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Smartphone size={12}/>}
          Test
        </button>
      </div>
      {msg && <p className={`text-[10px] ${status === 'err' ? 'text-[#EF4444]' : 'text-[#28a745]'}`}>{msg}</p>}
    </div>
  )
}

function TextSettingField({ label, placeholder, settingKey, hint, type: inputType }: { label: string; placeholder: string; settingKey: string; hint?: string; type?: string }) {
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    adminFetch('/admin/settings').then((s: Record<string,string>) => {
      if (s[settingKey] !== undefined) setValue(s[settingKey])
    }).catch(() => {})
  }, [settingKey])

  const save = async () => {
    if (!value.trim()) return
    setSaving(true); setErr('')
    try {
      await adminFetch('/admin/settings', { method: 'POST', body: JSON.stringify({ key: settingKey, value }) })
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch {
      setErr('Save failed')
    }
    setSaving(false)
  }

  return (
    <div>
      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input
          type={inputType ?? 'text'}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#FF9800] transition-all"
        />
        <button
          onClick={save}
          disabled={saving}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${saved ? 'bg-[#28a745] text-white' : 'bg-[#8B0000] text-white hover:bg-[#a00000]'} disabled:opacity-60`}
        >
          {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={11} />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
      {err  && <p className="text-[10px] text-[#EF4444] mt-1">{err}</p>}
    </div>
  )
}

function TestAllConnectionsButton() {
  const [status, setStatus] = useState<'idle'|'loading'|'done'>('idle')
  const [results, setResults] = useState<Record<string,{ok:boolean;message:string}>>({})

  const run = async () => {
    setStatus('loading'); setResults({})
    try {
      const data = await adminFetch('/admin/test-connections', { method: 'POST' })
      setResults(data.results ?? {})
    } catch (e: any) {
      setResults({ error: { ok: false, message: e?.message ?? 'Request failed' } })
    }
    setStatus('done')
    setTimeout(() => setStatus('idle'), 12000)
  }

  return (
    <div className="space-y-2">
      <button
        onClick={run}
        disabled={status === 'loading'}
        className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-black text-sm rounded-xl hover:from-[#a00000] hover:to-[#8B0000] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {status === 'loading' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={14} />}
        {status === 'loading' ? 'Testing…' : 'Test All Connections'}
      </button>
      {status === 'done' && Object.keys(results).length > 0 && (
        <div className="space-y-1.5">
          {Object.entries(results).map(([name, r]) => (
            <div key={name} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${r.ok ? 'bg-[#28a745]/10 border border-[#28a745]/20' : 'bg-[#EF4444]/10 border border-[#EF4444]/20'}`}>
              <span className={`font-bold uppercase tracking-wider w-16 flex-shrink-0 ${r.ok ? 'text-[#28a745]' : 'text-[#EF4444]'}`}>{name}</span>
              <span className={r.ok ? 'text-[#28a745]' : 'text-[#EF4444]'}>{r.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ApiKeyField({ label, placeholder, icon: Icon, hint, settingKey }: { label: string; placeholder: string; icon: React.ComponentType<{size:number;className?:string}>; hint?: string; settingKey?: string }) {
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!settingKey) return
    adminFetch('/admin/settings').then((s: Record<string,string>) => {
      if (s[settingKey]) setValue(s[settingKey])
    }).catch(() => {})
  }, [settingKey])

  const save = async () => {
    if (!value.trim()) return
    setSaving(true); setErr('')
    try {
      if (settingKey) {
        await adminFetch('/admin/settings', { method: 'POST', body: JSON.stringify({ key: settingKey, value }) })
      }
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch {
      setErr('Save failed')
    }
    setSaving(false)
  }
  return (
    <div>
      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
        <Icon size={10} className="text-text-muted" /> {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-3.5 pr-9 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#8B0000] transition-all font-mono text-xs"
          />
          <button type="button" onClick={() => setVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light">
            {visible ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${saved ? 'bg-[#28a745] text-white' : 'bg-[#8B0000] text-white hover:bg-[#a00000]'} disabled:opacity-60`}
        >
          {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={11} />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
      {err  && <p className="text-[10px] text-[#EF4444] mt-1">{err}</p>}
    </div>
  )
}

function ClientsTab() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    setLoading(true)
    adminFetch('/admin/users?limit=200')
      .then((data: any[]) => setClients(data))
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false))
  }, [])

  const deactivate = async (id: string) => {
    try {
      await adminFetch(`/admin/users/${id}`, { method: 'DELETE' })
      setClients(p => p.filter(c => c.id !== id))
    } catch {}
  }

  return (
    <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-color flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-light">Registered Users</h3>
        {!loading && <span className="text-[10px] text-text-muted">{clients.length} total</span>}
      </div>
      {loading && <div className="flex items-center justify-center py-16 gap-2 text-text-muted"><div className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin"/><span className="text-sm">Loading…</span></div>}
      {!loading && error && <div className="m-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl"><p className="text-xs text-[#EF4444]">{error}</p></div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-dark-bg border-b border-color">
              <tr>{['Name','Email','Role','Phone','Joined','Status','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-semibold text-text-muted">{h}</th>)}</tr>
            </thead>
            <tbody>
              {clients.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-text-muted">No users yet.</td></tr>}
              {clients.map(c=>(
                <tr key={c.id} className="border-b border-color/40 hover:bg-dark-bg transition-colors">
                  <td className="px-4 py-3 font-semibold text-text-light">{c.display_name || c.username}</td>
                  <td className="px-4 py-3 text-text-muted">{c.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.role==='admin'?'bg-[#8B0000]/20 text-[#8B0000]':c.role==='escort'?'bg-[#FF9800]/20 text-[#FF9800]':'bg-[#2196F3]/20 text-[#2196F3]'}`}>{c.role}</span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold ${c.is_active?'text-[#28a745]':'text-[#EF4444]'}`}>{c.is_active?'Active':'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {c.role !== 'admin' && (
                        <button
                          onClick={() => {
                            const token = localStorage.getItem('w3c_token')
                            fetch(`/api/admin/impersonate/${c.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
                              .then(r => r.json()).then(data => {
                                if (!data.token) { alert(data.message ?? 'Impersonation failed'); return }
                                const name = c.display_name || c.username || c.email
                                const url = `/view-as?token=${encodeURIComponent(data.token)}&name=${encodeURIComponent(name)}&role=${c.role}&uid=${c.id}&redirect=/`
                                window.open(url, '_blank')
                              }).catch(() => alert('Impersonation failed'))
                          }}
                          title="View As User"
                          className="p-1.5 text-[#2196F3] rounded-lg hover:bg-dark-bg"
                        ><Eye size={13}/></button>
                      )}
                      {c.role !== 'admin' && (
                        <button onClick={() => deactivate(c.id)} title="Deactivate" className="p-1.5 text-[#EF4444] rounded-lg hover:bg-dark-bg"><XCircle size={13}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function BookingsTab() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const statusColor: Record<string,string> = { confirmed:'#28a745', pending:'#FFD700', completed:'#6B7280', cancelled:'#EF4444' }

  useEffect(() => {
    setLoading(true)
    adminFetch('/admin/bookings?limit=200')
      .then((data: any[]) => setBookings(data))
      .catch(() => setError('Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-color flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-light">All Bookings</h3>
        {!loading && <span className="text-[10px] text-text-muted">{bookings.length} total</span>}
      </div>
      {loading && <div className="flex items-center justify-center py-16 gap-2 text-text-muted"><div className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin"/><span className="text-sm">Loading…</span></div>}
      {!loading && error && <div className="m-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl"><p className="text-xs text-[#EF4444]">{error}</p></div>}
      {!loading && !error && (
        <div className="divide-y divide-color/40">
          {bookings.length === 0 && <p className="text-center text-text-muted text-sm py-10">No bookings yet.</p>}
          {bookings.map(b=>(
            <div key={b.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-dark-bg transition-colors">
              <div className="flex-1">
                <p className="text-xs font-semibold text-text-light">{b.clientName} → {b.escortName}</p>
                <p className="text-[10px] text-text-muted">{b.date} {b.time} · {b.duration}hr{b.duration>1?'s':''} · {b.type}</p>
                {b.location && <p className="text-[10px] text-text-muted">{b.location}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#FFD700]">KES {Number(b.amount).toLocaleString()}</p>
                <span className="text-[9px] font-semibold capitalize px-2 py-0.5 rounded-full" style={{color:statusColor[b.status]??'#aaa',backgroundColor:(statusColor[b.status]??'#aaa')+'20'}}>{b.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlatformSettingsForm() {
  const keys = [
    { label: 'Platform Name',              key: 'platform_name',      def: 'Wet3 Camp',                              section: 'general' },
    { label: 'Tagline',                    key: 'tagline',            def: "Kenya's #1 Premium Escort Platform",  section: 'general' },
    { label: 'Support Email',              key: 'support_email',      def: 'support@wet3camp.com',                   section: 'general' },
    { label: 'Min Escort Rate (KES)',      key: 'min_rate',           def: '1500',                                   section: 'general' },
    { label: 'Commission %',              key: 'commission_pct',     def: '10',                                     section: 'general' },
    { label: 'Elite Tier Price (KES/mo)', key: 'tier_elite_monthly', def: '8500',                                   section: 'tiers' },
    { label: 'VIP Tier Price (KES/mo)',   key: 'tier_vip_monthly',   def: '4500',                                   section: 'tiers' },
    { label: 'Premium Tier Price (KES/mo)',key:'tier_premium_monthly',def: '2200',                                   section: 'tiers' },
    { label: 'Standard Tier Price (KES/mo)',key:'tier_standard_monthly',def:'0',                                    section: 'tiers' },
    { label: 'Featured 3-Day (KES)',      key: 'featured_3day',      def: '500',                                    section: 'featured' },
    { label: 'Featured Weekly (KES)',     key: 'featured_weekly',    def: '1500',                                   section: 'featured' },
    { label: 'Featured Monthly (KES)',    key: 'featured_monthly',   def: '4500',                                   section: 'featured' },
    { label: 'Subscription Monthly (KES)',key: 'sub_monthly',        def: '500',                                    section: 'subscriptions' },
    { label: 'Subscription Quarterly (KES)',key:'sub_quarterly',     def: '1200',                                   section: 'subscriptions' },
    { label: 'Subscription Annual (KES)', key: 'sub_annual',         def: '4000',                                   section: 'subscriptions' },
  ]
  const [values, setValues]   = useState<Record<string,string>>({})
  const [approval, setApproval] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [err, setErr]         = useState('')

  useEffect(() => {
    adminFetch('/admin/settings').then((s: Record<string,string>) => {
      const v: Record<string,string> = {}
      for (const { key, def } of keys) v[key] = s[key] ?? def
      setValues(v)
      if (s.require_approval !== undefined) setApproval(s.require_approval === '1')
    }).catch(() => {
      const v: Record<string,string> = {}
      for (const { key, def } of keys) v[key] = def
      setValues(v)
    })
  }, [])

  const save = async () => {
    setSaving(true); setErr('')
    try {
      await adminFetch('/admin/settings/bulk', {
        method: 'POST',
        body: JSON.stringify({ ...values, require_approval: approval ? '1' : '0' }),
      })
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch {
      setErr('Failed to save settings')
    }
    setSaving(false)
  }

  const sections = [
    { id: 'general',       label: 'General'                 },
    { id: 'tiers',         label: 'Tier Subscription Prices' },
    { id: 'featured',      label: 'Featured Placement Prices' },
    { id: 'subscriptions', label: 'Platform Subscription Prices' },
  ]

  return (
    <div className="space-y-6">
      {sections.map(sec => (
        <div key={sec.id} className="space-y-3">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-color pb-1.5">{sec.label}</p>
          {keys.filter(k => k.section === sec.id).map(({ label, key }) => (
            <div key={key}>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">{label}</label>
              <input
                value={values[key] ?? ''}
                onChange={e => setValues(p => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all"
              />
            </div>
          ))}
        </div>
      ))}
      <div className="flex items-center gap-3 mt-2">
        <input type="checkbox" checked={approval} onChange={e => setApproval(e.target.checked)} id="approval" className="w-3.5 h-3.5 accent-[#8B0000]"/>
        <label htmlFor="approval" className="text-xs text-text-muted cursor-pointer">Require admin approval for new escort registrations</label>
      </div>
      {err && <p className="text-[10px] text-[#EF4444]">{err}</p>}
      <button
        onClick={save}
        disabled={saving}
        className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${saved?'bg-[#28a745]':'bg-[#8B0000] hover:bg-[#a00000]'} disabled:opacity-60`}
      >
        {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={12}/>}
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>
    </div>
  )
}

function OverviewStats() {
  const [stats, setStats] = useState<{users:number;escorts:number;pending:number;bookings:number;reviews:number;room_bookings:number}|null>(null)
  useEffect(() => {
    adminFetch('/admin/stats').then(setStats).catch(() => {})
  }, [])
  const items = [
    { icon: Users,      label: 'Total Escorts',  value: stats ? String(stats.escorts)  : '…', color: '#8B0000'  },
    { icon: Users,      label: 'Registered Users',value: stats ? String(stats.users)   : '…', color: '#2196F3'  },
    { icon: Calendar,   label: 'Total Bookings', value: stats ? String(stats.bookings)  : '…', color: '#28a745' },
    { icon: Star,       label: 'Pending Approval',value: stats ? String(stats.pending) : '…', color: '#FFD700'  },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(s => {
        const Icon = s.icon
        return (
          <div key={s.label} className="bg-card-bg border border-color rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2"><Icon size={14} style={{color:s.color}}/><span className="text-[10px] text-text-muted uppercase tracking-widest">{s.label}</span></div>
            <p className="text-xl font-black text-text-light">{s.value}</p>
          </div>
        )
      })}
    </div>
  )
}

function PendingApprovals() {
  const [escorts, setEscorts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    adminFetch('/admin/escorts?limit=200')
      .then((data: any[]) => setEscorts(data.filter(e => !Boolean(e.is_active) && !Boolean(e.verified))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const approve = async (id: string) => {
    try { await adminFetch(`/admin/escorts/${id}/verify`, { method: 'PATCH' }); setEscorts(p => p.filter(e => e.id !== id)) } catch {}
  }
  const reject = async (id: string) => {
    try { await adminFetch(`/admin/escorts/${id}/reject`, { method: 'PATCH' }); setEscorts(p => p.filter(e => e.id !== id)) } catch {}
  }

  return (
    <div className="bg-card-bg border border-color rounded-2xl p-4">
      <h3 className="text-sm font-bold text-text-light mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-[#FFD700]"/>Pending Approvals</h3>
      {loading && <div className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin mx-auto my-4"/>}
      {!loading && escorts.length === 0 && <p className="text-xs text-text-muted">No pending approvals.</p>}
      <div className="space-y-2">
        {escorts.slice(0,5).map(e=>(
          <div key={e.id} className="flex items-center gap-3 p-3 bg-dark-bg rounded-xl border border-color/50">
            <div className="w-8 h-8 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-xs font-bold text-[#8B0000]">{(e.name||'?').charAt(0)}</div>
            <div className="flex-1"><p className="text-xs font-semibold text-text-light">{e.name}</p><p className="text-[10px] text-text-muted">{e.city||'—'} · {e.tier||'Standard'}</p></div>
            <div className="flex gap-1.5">
              <button onClick={() => approve(e.id)} className="px-2.5 py-1 bg-[#28a745]/20 text-[#28a745] text-[10px] font-bold rounded-lg border border-[#28a745]/30 hover:bg-[#28a745]/30">Approve</button>
              <button onClick={() => reject(e.id)}  className="px-2.5 py-1 bg-[#EF4444]/20 text-[#EF4444]  text-[10px] font-bold rounded-lg border border-[#EF4444]/30 hover:bg-[#EF4444]/30">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SmtpTestButton() {
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'err'>('idle')
  const [msg, setMsg] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [dns, setDns] = useState<any>(null)
  const [dnsLoading, setDnsLoading] = useState(false)

  const send = async (recipient?: string) => {
    setStatus('loading'); setMsg('')
    try {
      let data: any
      if (recipient) {
        data = await adminFetch('/admin/test-email-to', { method: 'POST', body: JSON.stringify({ to: recipient }) })
      } else {
        data = await adminFetch('/admin/test-email', { method: 'POST' })
      }
      setStatus('ok'); setMsg(data.message ?? 'Test email sent!')
    } catch (e: any) {
      setStatus('err'); setMsg(e?.message ?? 'SMTP test failed.')
    }
    setTimeout(() => setStatus('idle'), 8000)
  }

  const checkDns = async () => {
    setDnsLoading(true); setDns(null)
    try {
      const data = await adminFetch('/admin/check-email-dns')
      setDns(data)
    } catch (e: any) {
      setDns({ error: e?.message ?? 'DNS check failed' })
    }
    setDnsLoading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => send()}
          disabled={status === 'loading'}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${status==='ok'?'bg-[#28a745] text-white':status==='err'?'bg-[#EF4444] text-white':'bg-[#FF9800]/20 text-[#FF9800] border border-[#FF9800]/30 hover:bg-[#FF9800]/30'}`}
        >
          {status==='loading' ? <div className="w-3 h-3 border-2 border-[#FF9800]/30 border-t-[#FF9800] rounded-full animate-spin" /> : <Mail size={12}/>}
          {status==='loading'?'Sending…':status==='ok'?'✓ Sent':status==='err'?'✕ Failed':'Test (self)'}
        </button>
        <input
          type="email"
          value={toEmail}
          onChange={e => setToEmail(e.target.value)}
          placeholder="or send to another email…"
          className="flex-1 bg-[#1a0000] border border-[#2a0000] rounded-xl px-3 py-2 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#8B0000]"
        />
        <button
          onClick={() => { if (toEmail.includes('@')) send(toEmail) }}
          disabled={status === 'loading' || !toEmail.includes('@')}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-[#8B0000]/30 text-[#ff6b6b] border border-[#8B0000]/40 hover:bg-[#8B0000]/50 disabled:opacity-40 transition-all whitespace-nowrap"
        >
          <Mail size={11}/> Send
        </button>
      </div>
      {msg && <p className={`text-[10px] ${status==='ok'?'text-[#28a745]':'text-[#EF4444]'}`}>{msg}</p>}

      {/* DNS Deliverability Check */}
      <div className="border-t border-[#1a0000] pt-3">
        <button
          onClick={checkDns}
          disabled={dnsLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#0a1a2a] text-[#4fc3f7] border border-[#1a3a5a]/40 hover:bg-[#0d2236] transition-all whitespace-nowrap"
        >
          {dnsLoading ? <div className="w-3 h-3 border-2 border-[#4fc3f7]/30 border-t-[#4fc3f7] rounded-full animate-spin" /> : <Globe size={12}/>}
          {dnsLoading ? 'Checking DNS…' : '🔍 Check Email Deliverability (SPF/DKIM)'}
        </button>
        {dns && !dns.error && (
          <div className="mt-2 bg-[#080e14] border border-[#1a3a5a]/40 rounded-xl p-3 space-y-2 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-[#aaa]">Domain: <strong className="text-white">{dns.domain}</strong></span>
              <span className="text-[#aaa]">Server IP: <strong className="text-white">{dns.serverIp}</strong></span>
            </div>
            <div className="flex gap-3">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${dns.spf?.found ? (dns.spf?.serverIncluded ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300') : 'bg-red-900 text-red-300'}`}>
                SPF {dns.spf?.found ? (dns.spf?.serverIncluded ? '✓ OK' : '⚠ IP missing') : '✕ MISSING'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${dns.dkim?.found ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                DKIM {dns.dkim?.found ? '✓ OK' : '✕ MISSING'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${dns.mx ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                MX {dns.mx ? '✓ OK' : '✕ MISSING'}
              </span>
            </div>
            {dns.spf?.record && <p className="text-[#666] font-mono break-all">Current SPF: {dns.spf.record}</p>}
            <p className={`whitespace-pre-wrap leading-relaxed ${dns.ok ? 'text-green-400' : 'text-yellow-300'}`}>{dns.fix}</p>
          </div>
        )}
        {dns?.error && <p className="mt-1 text-[10px] text-red-400">{dns.error}</p>}
      </div>
    </div>
  )
}

function OverviewBulkToggle() {
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('all')
  const [bulkLoading, setBulkLoading] = useState<'online'|'offline'|null>(null)
  const [feedback, setFeedback] = useState<{msg:string;ok:boolean}|null>(null)

  useEffect(() => {
    adminFetch('/admin/escorts?limit=500').then((data: any) => {
      const arr: string[] = Array.from(new Set(
        (Array.isArray(data) ? data : data?.data ?? []).map((e: any) => e.city).filter(Boolean)
      )).sort() as string[]
      setCities(arr)
    }).catch(() => {})
  }, [])

  const doBulk = async (online: boolean) => {
    setBulkLoading(online ? 'online' : 'offline')
    try {
      const body: Record<string, any> = { online }
      if (selectedCity !== 'all') body.city = selectedCity
      const result = await adminFetch('/admin/escorts/bulk-online', { method: 'PATCH', body: JSON.stringify(body) })
      const label = selectedCity === 'all' ? 'All escorts' : `${selectedCity} escorts`
      setFeedback({ msg: `✓ ${label} set ${online ? 'online' : 'offline'} (${result.affected ?? 0} updated)`, ok: true })
    } catch {
      setFeedback({ msg: 'Failed — check connection', ok: false })
    }
    setBulkLoading(null)
    setTimeout(() => setFeedback(null), 4000)
  }

  return (
    <div className="bg-card-bg border border-color rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Radio size={14} className="text-[#8B0000]" />
        <h3 className="text-sm font-bold text-text-light">Quick Online Status Toggle</h3>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
          className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-xs text-text-light focus:outline-none focus:border-[#8B0000] transition-all"
        >
          <option value="all">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => doBulk(true)}
          disabled={!!bulkLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#28a745] text-white text-xs font-bold rounded-xl hover:bg-[#22a041] disabled:opacity-50 transition-all"
        >
          <Radio size={11} /> {bulkLoading === 'online' ? 'Setting…' : 'All Online'}
        </button>
        <button
          onClick={() => doBulk(false)}
          disabled={!!bulkLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-dark-bg border border-[#EF4444]/40 text-[#EF4444] text-xs font-bold rounded-xl hover:bg-[#EF4444]/10 disabled:opacity-50 transition-all"
        >
          <WifiOff size={11} /> {bulkLoading === 'offline' ? 'Setting…' : 'All Offline'}
        </button>
      </div>
      {feedback && (
        <p className={`mt-2 text-[11px] font-semibold ${feedback.ok ? 'text-[#28a745]' : 'text-[#EF4444]'}`}>{feedback.msg}</p>
      )}
    </div>
  )
}

function AdminLogin() {
  const [email, setEmail] = useState('admin@wet3camp.com')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginWithApi } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!email || !password) { setError('Please fill all fields.'); return }
    setLoading(true)
    const result = await loginWithApi(email, password)
    if (result.success && result.user?.role === 'admin') {
    } else if (result.success) {
      setError('You do not have admin privileges.')
    } else {
      setError(result.error ?? 'Invalid admin credentials.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#8B0000]/30">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-text-light">Admin Access</h1>
          <p className="text-sm text-text-muted mt-1">Restricted area — authorized personnel only</p>
        </div>
        <div className="bg-card-bg border border-color rounded-2xl p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl">
              <AlertTriangle size={14} className="text-[#EF4444]" />
              <p className="text-xs text-[#EF4444]">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Admin Email</label>
              <div className="relative"><Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all"/></div>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Password</label>
              <div className="relative"><Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"/><input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Admin password" className="w-full pl-9 pr-9 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all"/><button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">{showPass?<EyeOff size={13}/>:<Eye size={13}/>}</button></div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
              {loading?'Authenticating…':'Enter Admin Panel →'}
            </button>
          </form>
          <p className="text-center text-[10px] text-text-muted mt-4">Use the admin credentials you set up via /api/auth/setup-admin</p>
        </div>
      </div>
    </div>
  )
}

function OnlineToggle({ id, online, onToggle }: { id: string; online: boolean; onToggle: (id: string, val: boolean) => void }) {
  const [loading, setLoading] = useState(false)
  const toggle = async () => {
    setLoading(true)
    try {
      await adminFetch(`/admin/escorts/${id}/online`, { method: 'PATCH', body: JSON.stringify({ online: !online }) })
      onToggle(id, !online)
    } catch {}
    setLoading(false)
  }
  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={online ? 'Set offline' : 'Set online'}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none disabled:opacity-50 ${online ? 'bg-[#28a745] border-[#28a745]' : 'bg-gray-600 border-gray-600'}`}
    >
      <span className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform duration-200 mt-px ${online ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function BulkOnlinePanel({ escorts, onBulkToggle }: { escorts: AdminEscort[]; onBulkToggle: (city: string | null, online: boolean, affected: number) => void }) {
  const cities = Array.from(new Set(escorts.map(e => e.city).filter(Boolean))).sort()
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [bulkLoading, setBulkLoading] = useState<'online' | 'offline' | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const doBulk = async (online: boolean) => {
    setBulkLoading(online ? 'online' : 'offline')
    setFeedback(null)
    try {
      const body: Record<string, unknown> = { online }
      if (selectedCity !== 'all') body.city = selectedCity
      const result = await adminFetch('/admin/escorts/bulk-online', {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      const label = selectedCity === 'all' ? 'All escorts' : `All ${selectedCity} escorts`
      setFeedback(`✓ ${label} set ${online ? 'online' : 'offline'} (${result.affected} updated)`)
      onBulkToggle(selectedCity === 'all' ? null : selectedCity, online, result.affected)
    } catch {
      setFeedback('Failed to update. Check your connection.')
    }
    setBulkLoading(null)
    setTimeout(() => setFeedback(null), 4000)
  }

  const cityCount = selectedCity === 'all'
    ? escorts.length
    : escorts.filter(e => e.city === selectedCity).length
  const cityOnline = selectedCity === 'all'
    ? escorts.filter(e => Boolean(e.online)).length
    : escorts.filter(e => e.city === selectedCity && Boolean(e.online)).length

  return (
    <div className="bg-card-bg border border-[#28a745]/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Radio size={13} className="text-[#28a745]" />
        <h3 className="text-sm font-bold text-text-light">Bulk Online Toggle</h3>
        <span className="text-[10px] text-text-muted ml-1">Set all escorts in a city online or offline at once</span>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
          className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-xs text-text-light focus:outline-none focus:border-[#28a745] transition-all min-w-[160px]"
        >
          <option value="all">All Cities ({escorts.length})</option>
          {cities.map(city => {
            const count = escorts.filter(e => e.city === city).length
            const online = escorts.filter(e => e.city === city && Boolean(e.online)).length
            return <option key={city} value={city}>{city} — {online}/{count} online</option>
          })}
        </select>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-dark-bg border border-color rounded-xl">
          <Radio size={10} className="text-[#28a745]" />
          <span className="text-[10px] text-text-muted">{cityOnline}/{cityCount} online</span>
        </div>
        <button
          onClick={() => doBulk(true)}
          disabled={!!bulkLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#28a745] hover:bg-[#22a03a] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {bulkLoading === 'online' ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Radio size={12} />}
          All Online
        </button>
        <button
          onClick={() => doBulk(false)}
          disabled={!!bulkLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {bulkLoading === 'offline' ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <WifiOff size={12} />}
          All Offline
        </button>
        {feedback && (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${feedback.startsWith('✓') ? 'text-[#28a745] bg-[#28a745]/10 border-[#28a745]/30' : 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30'}`}>
            {feedback}
          </span>
        )}
      </div>
    </div>
  )
}

function EditEscortModal({ escort, onClose, onSaved }: { escort: AdminEscort; onClose: () => void; onSaved: (e: any) => void }) {
  const [form, setForm] = useState({
    name: escort.name ?? '',
    city: escort.city ?? '',
    area: '',
    age: '',
    tier: escort.tier ?? 'standard',
    bio: '',
    whatsapp: '',
    telegram: '',
    gender: 'Female',
    price_incall: '',
    price_outcall: '',
    price_incall_overnight: '',
    price_outcall_overnight: '',
    price_video: '',
    image: escort.image ?? '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    adminFetch(`/admin/escorts/${escort.id}`)
      .then((data: any) => {
        setForm({
          name: data.name ?? '',
          city: data.city ?? '',
          area: data.area ?? '',
          age: data.age ? String(data.age) : '',
          tier: data.tier ?? 'standard',
          bio: data.bio ?? '',
          whatsapp: data.whatsapp ?? '',
          telegram: data.telegram ?? '',
          gender: data.gender ?? 'Female',
          price_incall: data.price_incall ? String(data.price_incall) : '',
          price_outcall: data.price_outcall ? String(data.price_outcall) : '',
          price_incall_overnight: data.price_incall_overnight ? String(data.price_incall_overnight) : '',
          price_outcall_overnight: data.price_outcall_overnight ? String(data.price_outcall_overnight) : '',
          price_video: data.price_video ? String(data.price_video) : '',
          image: data.image ?? '',
        })
      })
      .catch(() => setError('Could not load escort details.'))
      .finally(() => setLoading(false))
  }, [escort.id])

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = () => {
        const img = new Image()
        img.onerror = reject
        img.onload = () => {
          const scale = Math.min(1, 1200 / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPhotoUploading(true); setError('')
    try {
      const base64 = await compressImage(file)
      const data = await adminFetch('/upload', { method: 'POST', body: JSON.stringify({ data: base64, filename: file.name, type: 'gallery' }) })
      if (data?.url) setForm(f => ({ ...f, image: data.url }))
    } catch { setError('Photo upload failed.') }
    setPhotoUploading(false)
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true); setError('')
    try {
      const data = await adminFetch(`/admin/escorts/${escort.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          age: form.age ? parseInt(form.age) : undefined,
          price_incall:            form.price_incall            ? parseInt(form.price_incall)            : undefined,
          price_outcall:           form.price_outcall           ? parseInt(form.price_outcall)           : undefined,
          price_incall_overnight:  form.price_incall_overnight  ? parseInt(form.price_incall_overnight)  : undefined,
          price_outcall_overnight: form.price_outcall_overnight ? parseInt(form.price_outcall_overnight) : undefined,
          price_video:             form.price_video             ? parseInt(form.price_video)             : undefined,
        }),
      })
      onSaved(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save changes.')
    }
    setSaving(false)
  }

  const inputCls = 'w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#8B0000] transition-all'
  const priceCls = 'w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#FFD700] transition-all'

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card-bg border border-color rounded-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-color">
          <h3 className="text-sm font-bold text-text-light flex items-center gap-2"><Edit2 size={14} className="text-[#8B0000]"/>Edit — {escort.name}</h3>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-light rounded-lg"><XCircle size={16}/></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-text-muted">
            <div className="w-5 h-5 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin"/>
            <span className="text-sm">Loading…</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 px-3 py-2 rounded-lg">{error}</p>}

            {/* Profile Photo */}
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2">Profile Photo</label>
              <div className="flex items-center gap-3">
                {form.image ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#28a745]/40 flex-shrink-0">
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover"/>
                    <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"><XCircle size={10}/></button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-dashed border-color bg-dark-bg flex items-center justify-center text-text-muted flex-shrink-0"><Camera size={18}/></div>
                )}
                <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 border border-dashed rounded-xl text-xs font-semibold cursor-pointer transition-all ${photoUploading ? 'border-color text-text-muted opacity-60' : 'border-[#8B0000]/40 text-text-muted hover:border-[#8B0000] hover:text-text-light'}`}>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" disabled={photoUploading} onChange={handlePhotoUpload}/>
                  {photoUploading ? <><div className="w-3 h-3 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin"/>Uploading…</> : <><Camera size={13}/>{form.image ? 'Change Photo' : 'Upload Photo'}</>}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Name *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Amara K." className={inputCls}/>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Gender</label>
                <select value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} className={inputCls}>
                  {['Female','Male','Trans Woman','Trans Man','Non-Binary'].map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">City</label>
                <input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="e.g. Nairobi" className={inputCls}/>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Area / Estate</label>
                <input value={form.area} onChange={e=>setForm(f=>({...f,area:e.target.value}))} placeholder="e.g. Westlands" className={inputCls}/>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Age</label>
                <input type="number" min="18" max="70" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} placeholder="e.g. 24" className={inputCls}/>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Tier</label>
                <select value={form.tier} onChange={e=>setForm(f=>({...f,tier:e.target.value}))} className={inputCls}>
                  {['standard','premium','vip','elite'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Bio</label>
              <textarea rows={3} value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="Short profile bio…" className={inputCls + ' resize-none'}/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">WhatsApp</label>
                <input value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} placeholder="+254712345678" className={inputCls}/>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Telegram</label>
                <input value={form.telegram} onChange={e=>setForm(f=>({...f,telegram:e.target.value}))} placeholder="@handle" className={inputCls}/>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2">Rates (KES)</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Incall / hr', key: 'price_incall' as const },
                  { label: 'Outcall / hr', key: 'price_outcall' as const },
                  { label: 'Incall Overnight', key: 'price_incall_overnight' as const },
                  { label: 'Outcall Overnight', key: 'price_outcall_overnight' as const },
                  { label: 'Video Call', key: 'price_video' as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-[9px] text-text-muted uppercase tracking-widest block mb-1">{label}</label>
                    <input type="number" min="0" value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder="0" className={priceCls}/>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-color text-text-muted text-sm rounded-xl hover:border-text-muted/50 transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#8B0000] hover:bg-[#a00000] text-white text-sm font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                {saving ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</> : <><Save size={13}/>Save Changes</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function AddEscortModal({ onClose, onCreated }: { onClose: () => void; onCreated: (e: any) => void }) {
  const [form, setForm] = useState({
    name: '', city: '', area: '', age: '', tier: 'standard',
    bio: '', whatsapp: '', telegram: '', gender: 'Female',
    price_incall: '', price_outcall: '',
    price_incall_overnight: '', price_outcall_overnight: '',
    price_video: '', image: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showCitySugg, setShowCitySugg] = useState(false)
  const cityPickedRef = useRef(false)

  useEffect(() => {
    if (cityPickedRef.current || !form.city || form.city.length < 2) { setCitySuggestions([]); return }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.city)}&format=json&addressdetails=1&limit=6&countrycodes=ke`)
        const data = await r.json()
        const names: string[] = []
        for (const d of data) {
          const a = d.address ?? {}
          const n = a.city || a.town || a.village || a.county || d.display_name.split(',')[0]
          if (n && !names.includes(n)) names.push(n)
        }
        setCitySuggestions(names.slice(0, 5))
        setShowCitySugg(names.length > 0)
      } catch {}
    }, 450)
    return () => clearTimeout(t)
  }, [form.city])

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = () => {
        const img = new Image()
        img.onerror = reject
        img.onload = () => {
          const scale = Math.min(1, 1200 / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPhotoUploading(true); setError('')
    try {
      const base64 = await compressImage(file)
      const data = await adminFetch('/upload', { method: 'POST', body: JSON.stringify({ data: base64, filename: file.name, type: 'gallery' }) })
      if (data?.url) setForm(f => ({ ...f, image: data.url }))
    } catch { setError('Photo upload failed.') }
    setPhotoUploading(false)
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.city) { setError('Name and city are required.'); return }
    setSaving(true); setError('')
    try {
      const data = await adminFetch('/admin/escorts', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          age: form.age ? parseInt(form.age) : 0,
          price_incall:           form.price_incall           ? parseInt(form.price_incall)           : 0,
          price_outcall:          form.price_outcall          ? parseInt(form.price_outcall)          : 0,
          price_incall_overnight: form.price_incall_overnight ? parseInt(form.price_incall_overnight) : 0,
          price_outcall_overnight:form.price_outcall_overnight? parseInt(form.price_outcall_overnight): 0,
          price_video:            form.price_video            ? parseInt(form.price_video)            : 0,
        }),
      })
      onCreated(data)
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create escort.')
    }
    setSaving(false)
  }

  const inputCls = 'w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#8B0000] transition-all'
  const priceCls = 'w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#FFD700] transition-all'

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card-bg border border-color rounded-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-color">
          <h3 className="text-sm font-bold text-text-light flex items-center gap-2"><Plus size={14} className="text-[#8B0000]"/>Add Escort Profile</h3>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-light rounded-lg"><XCircle size={16}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 px-3 py-2 rounded-lg">{error}</p>}

          {/* Profile Photo */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2">Profile Photo</label>
            <div className="flex items-center gap-3">
              {form.image ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#28a745]/40 flex-shrink-0">
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover"/>
                  <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"><XCircle size={10}/></button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl border border-dashed border-color bg-dark-bg flex items-center justify-center text-text-muted flex-shrink-0"><Camera size={18}/></div>
              )}
              <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 border border-dashed rounded-xl text-xs font-semibold cursor-pointer transition-all ${photoUploading ? 'border-color text-text-muted opacity-60' : 'border-[#8B0000]/40 text-text-muted hover:border-[#8B0000] hover:text-text-light'}`}>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" disabled={photoUploading} onChange={handlePhotoUpload}/>
                {photoUploading ? <><div className="w-3 h-3 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin"/>Uploading…</> : <><Camera size={13}/>{form.image ? 'Change Photo' : 'Upload Photo'}</>}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Amara K." className={inputCls}/>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Gender</label>
              <select value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} className={inputCls}>
                {['Female','Male','Trans Woman','Trans Man','Non-Binary'].map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            {/* City with geocoding */}
            <div className="relative">
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">City *</label>
              <input
                value={form.city}
                onChange={e => { cityPickedRef.current = false; setForm(f => ({...f, city: e.target.value})) }}
                onBlur={() => setTimeout(() => setShowCitySugg(false), 150)}
                placeholder="Type city name…"
                className={inputCls}
                autoComplete="off"
              />
              {showCitySugg && citySuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card-bg border border-color rounded-xl shadow-xl z-50 overflow-hidden">
                  {citySuggestions.map(s => (
                    <button key={s} type="button" className="w-full text-left px-3 py-2 text-xs text-text-light hover:bg-dark-bg border-b border-color/30 last:border-0 transition-colors"
                      onMouseDown={() => { cityPickedRef.current = true; setForm(f => ({...f, city: s})); setShowCitySugg(false) }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Area / Estate</label>
              <input value={form.area} onChange={e=>setForm(f=>({...f,area:e.target.value}))} placeholder="e.g. Westlands" className={inputCls}/>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Age</label>
              <input type="number" min="18" max="70" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} placeholder="e.g. 24" className={inputCls}/>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Tier</label>
              <select value={form.tier} onChange={e=>setForm(f=>({...f,tier:e.target.value}))} className={inputCls}>
                {['standard','premium','vip','elite'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} rows={3} placeholder="Short profile description…" className={`${inputCls} resize-none`}/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">WhatsApp</label>
              <input value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} placeholder="254712345678" className={inputCls}/>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Telegram</label>
              <input value={form.telegram} onChange={e=>setForm(f=>({...f,telegram:e.target.value}))} placeholder="@username" className={inputCls}/>
            </div>
          </div>

          {/* Pricing — 2-column incall/outcall grid */}
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 border-b border-color pb-1.5">Pricing (KES)</p>
            {/* Header row */}
            <div className="grid grid-cols-2 gap-3 mb-1">
              <p className="text-[10px] font-bold text-[#8B0000] uppercase tracking-widest text-center">Incall</p>
              <p className="text-[10px] font-bold text-[#FFD700] uppercase tracking-widest text-center">Outcall</p>
            </div>
            {/* Short 1hr */}
            <p className="text-[9px] text-text-muted uppercase tracking-widest mb-1 mt-2">Short (1hr)</p>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={form.price_incall} onChange={e=>setForm(f=>({...f,price_incall:e.target.value}))} placeholder="e.g. 3000" className={priceCls}/>
              <input type="number" value={form.price_outcall} onChange={e=>setForm(f=>({...f,price_outcall:e.target.value}))} placeholder="e.g. 5000" className={priceCls}/>
            </div>
            {/* Overnight */}
            <p className="text-[9px] text-text-muted uppercase tracking-widest mb-1 mt-3">Overnight</p>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={form.price_incall_overnight} onChange={e=>setForm(f=>({...f,price_incall_overnight:e.target.value}))} placeholder="e.g. 20000" className={priceCls}/>
              <input type="number" value={form.price_outcall_overnight} onChange={e=>setForm(f=>({...f,price_outcall_overnight:e.target.value}))} placeholder="e.g. 25000" className={priceCls}/>
            </div>
            {/* Video Call */}
            <p className="text-[9px] text-text-muted uppercase tracking-widest mb-1 mt-3">Video Call</p>
            <input type="number" value={form.price_video} onChange={e=>setForm(f=>({...f,price_video:e.target.value}))} placeholder="e.g. 1500" className={priceCls}/>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-color text-text-muted text-sm rounded-xl hover:bg-dark-bg transition-all">Cancel</button>
            <button type="submit" disabled={saving || photoUploading} className="flex-1 py-2.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
              {saving ? 'Creating…' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReportsTab() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    adminFetch('/admin/reports')
      .then((data: any[]) => setReports(Array.isArray(data) ? data : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id)
    try {
      await adminFetch(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setReports(p => p.map(r => r.id === id ? { ...r, status } : r))
    } catch {}
    setUpdating(null)
  }

  const statusColor: Record<string, string> = {
    pending: '#FFD700',
    reviewed: '#2196F3',
    dismissed: '#6B7280',
    actioned: '#EF4444',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">Profile reports submitted by users. Review and take action as needed.</p>
        <span className="px-3 py-1 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-bold rounded-xl">
          {reports.filter(r => r.status === 'pending').length} pending
        </span>
      </div>
      {loading ? (
        <div className="text-center py-10 text-xs text-text-muted">Loading reports…</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-10 text-xs text-text-muted">No reports yet.</div>
      ) : (
        <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-color bg-dark-bg">
                {['Escort','Reporter','Reason','Details','Status','Date','Actions'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={r.id} className={`border-b border-color hover:bg-dark-bg/50 transition-colors ${i % 2 === 0 ? '' : 'bg-dark-bg/20'}`}>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-text-light">{r.escort_name ?? `#${r.escort_id}`}</p>
                    {r.escort_city && <p className="text-[10px] text-text-muted">{r.escort_city}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-text-muted">
                    {r.reporter_name ? <><p>{r.reporter_name}</p><p className="text-[10px]">{r.reporter_email}</p></> : <span className="italic">Anonymous</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 rounded-lg text-[10px] font-bold whitespace-nowrap">{r.reason}</span>
                  </td>
                  <td className="px-3 py-2.5 text-text-muted max-w-[150px]">
                    <p className="truncate" title={r.details ?? ''}>{r.details || <span className="italic text-[10px]">—</span>}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border" style={{ color: statusColor[r.status] ?? '#fff', borderColor: (statusColor[r.status] ?? '#fff') + '44', background: (statusColor[r.status] ?? '#fff') + '11' }}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-text-muted text-[10px] whitespace-nowrap">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {r.status === 'pending' && (
                      <div className="flex gap-1">
                        <button disabled={updating === r.id} onClick={() => updateStatus(r.id, 'reviewed')} className="px-2 py-1 bg-[#2196F3]/10 border border-[#2196F3]/30 text-[#2196F3] text-[10px] font-bold rounded-lg hover:bg-[#2196F3]/20 transition-colors disabled:opacity-50">Review</button>
                        <button disabled={updating === r.id} onClick={() => updateStatus(r.id, 'actioned')} className="px-2 py-1 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[10px] font-bold rounded-lg hover:bg-[#EF4444]/20 transition-colors disabled:opacity-50">Action</button>
                        <button disabled={updating === r.id} onClick={() => updateStatus(r.id, 'dismissed')} className="px-2 py-1 bg-dark-bg border border-color text-text-muted text-[10px] font-bold rounded-lg hover:border-text-muted transition-colors disabled:opacity-50">Dismiss</button>
                      </div>
                    )}
                    {r.status !== 'pending' && (
                      <button disabled={updating === r.id} onClick={() => updateStatus(r.id, 'pending')} className="px-2 py-1 bg-dark-bg border border-color text-text-muted text-[10px] rounded-lg hover:border-text-muted transition-colors disabled:opacity-50">Reopen</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ClaimsTab() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminFetch('/admin/claims')
      setClaims(Array.isArray(data) ? data : [])
    } catch {
      setClaims([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id + '_' + action)
    try {
      await adminFetch(`/admin/claims/${id}/${action}`, { method: 'PATCH' })
      setClaims(prev => prev.map(c => String(c.id) === id ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c))
      setFeedback({ ok: true, msg: action === 'approve' ? 'Claim approved — profile linked to user.' : 'Claim rejected.' })
    } catch {
      setFeedback({ ok: false, msg: 'Action failed. Please try again.' })
    }
    setActionLoading(null)
    setTimeout(() => setFeedback(null), 4000)
  }

  const pending = claims.filter(c => c.status === 'pending')
  const resolved = claims.filter(c => c.status !== 'pending')

  return (
    <div className="space-y-5">
      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-xl border ${feedback.ok ? 'bg-[#28a745]/10 border-[#28a745]/20 text-[#28a745]' : 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'}`}>
          <p className="text-xs font-semibold">{feedback.msg}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card-bg border border-[#FFD700]/20 rounded-2xl p-4">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Pending</p>
          <p className="text-2xl font-black text-[#FFD700]">{pending.length}</p>
        </div>
        <div className="bg-card-bg border border-color rounded-2xl p-4">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Resolved</p>
          <p className="text-2xl font-black text-text-light">{resolved.length}</p>
        </div>
      </div>
      <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-color flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-light">Profile Claim Requests</h3>
          <button onClick={load} className="p-1 text-text-muted hover:text-text-light rounded-lg" title="Refresh"><RefreshCw size={12}/></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
            <div className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin"/>
            <span className="text-sm">Loading…</span>
          </div>
        ) : claims.length === 0 ? (
          <p className="text-center py-12 text-sm text-text-muted">No claim requests yet.</p>
        ) : (
          <div className="divide-y divide-color/40">
            {[...pending, ...resolved].map(c => (
              <div key={c.id} className="flex items-start gap-4 px-4 py-4 hover:bg-dark-bg transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-xs font-bold text-[#8B0000] flex-shrink-0">
                  {(c.user_name || c.user_email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-light">{c.user_name || c.user_email}</p>
                  <p className="text-[10px] text-text-muted">
                    claiming <span className="text-text-light font-semibold">{c.escort_name}</span>
                    {c.escort_city && <span> ({c.escort_city})</span>}
                  </p>
                  {c.message && <p className="text-[10px] text-text-muted italic mt-0.5">"{c.message}"</p>}
                  <p className="text-[9px] text-text-muted mt-0.5">{new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex-shrink-0">
                  {c.status === 'pending' ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAction(String(c.id), 'approve')}
                        disabled={!!actionLoading}
                        className="px-2.5 py-1 bg-[#28a745]/20 text-[#28a745] text-[9px] font-bold rounded-lg border border-[#28a745]/30 hover:bg-[#28a745]/30 disabled:opacity-50 flex items-center gap-1"
                      >
                        {actionLoading === c.id + '_approve' ? <div className="w-2.5 h-2.5 border border-[#28a745]/40 border-t-[#28a745] rounded-full animate-spin"/> : <CheckCircle2 size={10}/>}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(String(c.id), 'reject')}
                        disabled={!!actionLoading}
                        className="px-2.5 py-1 bg-[#EF4444]/20 text-[#EF4444] text-[9px] font-bold rounded-lg border border-[#EF4444]/30 hover:bg-[#EF4444]/30 disabled:opacity-50 flex items-center gap-1"
                      >
                        {actionLoading === c.id + '_reject' ? <div className="w-2.5 h-2.5 border border-[#EF4444]/40 border-t-[#EF4444] rounded-full animate-spin"/> : <XCircle size={10}/>}
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${c.status === 'approved' ? 'bg-[#28a745]/20 text-[#28a745]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>{c.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RevenueDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch('/admin/revenue')
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-[#8B0000] border-t-[#FFD700] rounded-full animate-spin"/></div>
  if (!data) return <div className="text-center py-10 text-text-muted text-sm">Failed to load revenue data.</div>

  const { summary, daily, topEscorts, byCity } = data
  const tierColor: Record<string, string> = { elite: '#FFD700', vip: '#E91E63', premium: '#FF9800', standard: '#607D8B' }
  const cityColors = ['#8B0000','#E91E63','#FF9800','#2196F3','#28a745','#9C27B0','#00BCD4']

  const statCards = [
    { label: 'Total Revenue', value: `KES ${Number(summary.totalRevenue).toLocaleString()}`, icon: DollarSign, color: '#FFD700' },
    { label: 'Paid Subscriptions', value: summary.paidCount, icon: CheckCircle2, color: '#28a745' },
    { label: 'Pending Payments', value: summary.pendingCount, icon: AlertTriangle, color: '#FF9800' },
    { label: 'Avg per Sub', value: summary.paidCount > 0 ? `KES ${Math.round(summary.totalRevenue / summary.paidCount).toLocaleString()}` : '—', icon: TrendingUp, color: '#2196F3' },
  ]

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(c => (
          <div key={c.label} className="bg-card-bg border border-color rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon size={14} style={{ color: c.color }} />
              <span className="text-[10px] text-text-muted uppercase tracking-widest">{c.label}</span>
            </div>
            <p className="text-xl font-black text-text-light">{c.value}</p>
          </div>
        ))}
      </div>

      {/* 30-day daily revenue chart */}
      <div className="bg-card-bg border border-color rounded-2xl p-5">
        <h3 className="text-sm font-bold text-text-light mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-[#28a745]"/>Daily Revenue — Last 30 Days
        </h3>
        {daily.length === 0
          ? <p className="text-xs text-text-muted text-center py-6">No paid transactions yet. Revenue will appear here once escorts pay for subscriptions.</p>
          : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e0000" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#666' }} tickFormatter={v => v?.slice(5) ?? ''} />
                <YAxis tick={{ fontSize: 9, fill: '#666' }} tickFormatter={v => `${v/1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#0d0000', border: '1px solid #2a0000', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: any) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#8B0000" strokeWidth={2} dot={{ fill: '#FFD700', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top escorts */}
        <div className="bg-card-bg border border-color rounded-2xl p-5">
          <h3 className="text-sm font-bold text-text-light mb-4 flex items-center gap-2">
            <Award size={14} className="text-[#FFD700]"/>Top Escorts by Revenue
          </h3>
          {topEscorts.length === 0
            ? <p className="text-xs text-text-muted text-center py-6">No paid subscriptions yet.</p>
            : (
              <div className="space-y-2">
                {topEscorts.map((e: any, i: number) => (
                  <div key={e.id} className="flex items-center gap-3 py-2 border-b border-color last:border-0">
                    <span className="text-xs font-black text-text-muted w-4">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-light truncate">{e.name}</p>
                      <p className="text-[10px] text-text-muted">{e.city} · <span style={{ color: tierColor[e.tier] ?? '#888' }}>{e.tier}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#FFD700]">KES {Number(e.total).toLocaleString()}</p>
                      <p className="text-[10px] text-text-muted">{e.txns} sub{e.txns !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Revenue by city */}
        <div className="bg-card-bg border border-color rounded-2xl p-5">
          <h3 className="text-sm font-bold text-text-light mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-[#E91E63]"/>Revenue by City
          </h3>
          {byCity.length === 0
            ? <p className="text-xs text-text-muted text-center py-6">No city data yet.</p>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byCity} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e0000" />
                  <XAxis dataKey="city" tick={{ fontSize: 9, fill: '#666' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#666' }} tickFormatter={v => `${v/1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#0d0000', border: '1px solid #2a0000', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {byCity.map((_: any, idx: number) => (
                      <Cell key={idx} fill={cityColors[idx % cityColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>
    </div>
  )
}

function EscortsTab() {
  const [escorts, setEscorts] = useState<AdminEscort[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all'|'pending'|'active'>('all')
  const [actionLoading, setActionLoading] = useState<string|null>(null)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupMsg, setCleanupMsg] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editEscort, setEditEscort] = useState<AdminEscort | null>(null)
  const [bulkApproveLoading, setBulkApproveLoading] = useState(false)
  const [bulkApproveMsg, setBulkApproveMsg] = useState('')

  const handleBulkApprove = async () => {
    if (!window.confirm('Approve ALL pending escorts at once? They will go live on the platform immediately.')) return
    setBulkApproveLoading(true); setBulkApproveMsg('')
    try {
      const data = await adminFetch('/admin/escorts/bulk-approve', { method: 'POST' })
      setBulkApproveMsg(`✓ ${data.message}`)
      load()
    } catch {
      setBulkApproveMsg('Failed to bulk approve.')
    }
    setBulkApproveLoading(false)
    setTimeout(() => setBulkApproveMsg(''), 6000)
  }

  const handleCleanupFake = async () => {
    if (!window.confirm('This will permanently delete all seed/fake escorts (those without a real user account). Continue?')) return
    setCleanupLoading(true); setCleanupMsg('')
    try {
      const data = await adminFetch('/admin/cleanup-seed-escorts', { method: 'DELETE' })
      setCleanupMsg(`✓ Deleted ${data.deleted} fake escort profile${data.deleted !== 1 ? 's' : ''}.`)
      load()
    } catch {
      setCleanupMsg('Failed to delete fake escorts.')
    }
    setCleanupLoading(false)
  }

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await adminFetch('/admin/escorts')
      setEscorts(data)
    } catch {
      setError('Failed to load escorts')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = (id: string, online: boolean) => {
    setEscorts(prev => prev.map(e => e.id === id ? { ...e, online } : e))
  }

  const handleBulkToggle = (city: string | null, online: boolean) => {
    setEscorts(prev => prev.map(e =>
      city === null || e.city === city ? { ...e, online } : e
    ))
  }

  const handleToggleVerified = async (id: string, currentlyVerified: boolean) => {
    setActionLoading(id + '_verified')
    try {
      await adminFetch(`/admin/escorts/${id}/toggle-verified`, { method: 'PATCH' })
      setEscorts(prev => prev.map(e => e.id === id ? { ...e, verified: !currentlyVerified, is_active: !currentlyVerified ? true : e.is_active } : e))
    } catch {}
    setActionLoading(null)
  }

  const handleApprove = async (id: string) => {
    setActionLoading(id + '_approve')
    try {
      await adminFetch(`/admin/escorts/${id}/verify`, { method: 'PATCH' })
      setEscorts(prev => prev.map(e => e.id === id ? { ...e, is_active: true, verified: true } : e))
    } catch {}
    setActionLoading(null)
  }

  const handleReject = async (id: string) => {
    setActionLoading(id + '_reject')
    try {
      await adminFetch(`/admin/escorts/${id}/reject`, { method: 'PATCH' })
      setEscorts(prev => prev.map(e => e.id === id ? { ...e, is_active: false, verified: false } : e))
    } catch {}
    setActionLoading(null)
  }

  const handleFeature = async (id: string) => {
    setActionLoading(id + '_feature')
    try {
      const data = await adminFetch(`/admin/escorts/${id}/featured`, { method: 'PATCH' })
      setEscorts(prev => prev.map(e => e.id === id ? { ...e, featured: data.featured ? 1 : 0 } : e))
    } catch {}
    setActionLoading(null)
  }

  const handleDeleteForever = async (id: string, name: string) => {
    if (!window.confirm(`⚠️ PERMANENTLY DELETE "${name}"?\n\nThis removes the escort and ALL their data (gallery, services, languages) from the database forever.\n\nThis CANNOT be undone.`)) return
    setActionLoading(id + '_delete')
    try {
      await adminFetch(`/admin/escorts/${id}`, { method: 'DELETE' })
      setEscorts(prev => prev.filter(e => e.id !== id))
    } catch {}
    setActionLoading(null)
  }

  const pendingCount = escorts.filter(e => !Boolean(e.is_active) && !Boolean(e.verified)).length

  const filtered = escorts.filter(e => {
    const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.city?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (statusFilter === 'pending' ? (!Boolean(e.is_active) && !Boolean(e.verified)) : Boolean(e.is_active))
    return matchSearch && matchStatus
  })

  const onlineCount = escorts.filter(e => Boolean(e.online)).length

  return (
    <div className="space-y-4">
      <BulkOnlinePanel escorts={escorts} onBulkToggle={handleBulkToggle} />
      <div className="flex items-center gap-3 p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl">
        <Trash2 size={14} className="text-[#EF4444] flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-[#EF4444] font-semibold">Remove Fake / Seed Escorts</p>
          <p className="text-[10px] text-text-muted">Deletes all escort profiles that have no real user account (demo/seeded data). Run this before going live.</p>
          {cleanupMsg && <p className="text-[10px] text-[#28a745] mt-0.5 font-bold">{cleanupMsg}</p>}
        </div>
        <button onClick={handleCleanupFake} disabled={cleanupLoading} className="px-3 py-1.5 bg-[#EF4444] hover:bg-red-700 text-white text-[10px] font-bold rounded-lg disabled:opacity-60 flex items-center gap-1.5 transition-all whitespace-nowrap">
          {cleanupLoading ? <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/>Deleting…</> : <><Trash2 size={10}/>Delete Fakes</>}
        </button>
      </div>
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-2xl">
          <AlertTriangle size={14} className="text-[#FFD700] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-[#FFD700] font-semibold">{pendingCount} escort{pendingCount !== 1 ? 's' : ''} waiting for approval</p>
            {bulkApproveMsg && <p className="text-[10px] text-[#28a745] mt-0.5 font-bold">{bulkApproveMsg}</p>}
          </div>
          <button onClick={() => setStatusFilter('pending')} className="px-3 py-1 bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-bold rounded-lg border border-[#FFD700]/30">Review</button>
          <button onClick={handleBulkApprove} disabled={bulkApproveLoading} className="px-3 py-1 bg-[#28a745] text-white text-[10px] font-bold rounded-lg disabled:opacity-60 flex items-center gap-1">
            {bulkApproveLoading ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/> : <CheckCircle2 size={10}/>}
            Approve All
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#28a745]/10 border border-[#28a745]/30 rounded-xl">
            <Radio size={11} className="text-[#28a745]" />
            <span className="text-xs font-bold text-[#28a745]">{onlineCount} Online</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-bg border border-color rounded-xl">
            <WifiOff size={11} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted">{escorts.length - onlineCount} Offline</span>
          </div>
          <div className="flex gap-1">
            {(['all','pending','active'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg capitalize transition-all ${statusFilter===f?'bg-[#8B0000] text-white':'bg-dark-bg border border-color text-text-muted'}`}>
                {f}{f==='pending'&&pendingCount>0?` (${pendingCount})`:''}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-1.5 text-text-muted hover:text-text-light rounded-lg hover:bg-card-bg transition-colors" title="Refresh"><RefreshCw size={13} /></button>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or city…"
          className="w-full sm:w-56 px-3 py-1.5 bg-dark-bg border border-color rounded-xl text-xs text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#8B0000] transition-all"
        />
      </div>

      <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-color flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-light">All Escorts {!loading && `(${filtered.length})`}</h3>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B0000] text-white text-xs font-bold rounded-xl"><Plus size={12}/>Add Escort</button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-text-muted">
            <div className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
            <span className="text-sm">Loading escorts…</span>
          </div>
        )}
        {!loading && error && (
          <div className="flex items-center gap-2 m-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl">
            <AlertTriangle size={14} className="text-[#EF4444]" /><p className="text-xs text-[#EF4444]">{error}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-dark-bg border-b border-color">
                <tr>{['Photo','Name','City','Tier','Active','Online Now','Verified','Featured','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-semibold text-text-muted">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-text-muted">No escorts found.</td></tr>
                )}
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-color/40 hover:bg-dark-bg transition-colors">
                    <td className="px-2 py-2">
                      {e.image
                        ? <img src={e.image} alt={e.name} className="w-10 h-10 rounded-lg object-cover border border-color" onError={ev => { ev.currentTarget.style.display = 'none'; const fb = ev.currentTarget.parentElement?.querySelector<HTMLElement>('.img-fb'); if (fb) fb.style.display = 'flex' }} />
                        : null}
                      <div className="img-fb w-10 h-10 rounded-lg bg-[#8B0000]/20 border border-color items-center justify-center text-sm font-black text-[#8B0000]" style={{ display: e.image ? 'none' : 'flex' }}>
                        {(e.name || '?').charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-light">{e.name}</td>
                    <td className="px-4 py-3 text-text-muted">{e.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{background:e.tier==='Elite'?'#8B000020':e.tier==='VIP'?'#FF450020':'#55555520',color:e.tier==='Elite'?'#8B0000':e.tier==='VIP'?'#FF4500':'#aaa'}}>
                        {e.tier || 'Standard'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {Boolean(e.is_active)
                        ? <span className="flex items-center gap-1 text-[#28a745]"><CheckCircle2 size={11}/>Active</span>
                        : <span className="flex items-center gap-1 text-text-muted"><XCircle size={11}/>Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <OnlineToggle id={e.id} online={Boolean(e.online)} onToggle={handleToggle} />
                        <span className={`text-[10px] font-semibold ${Boolean(e.online) ? 'text-[#28a745]' : 'text-text-muted'}`}>
                          {Boolean(e.online) ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVerified(e.id, Boolean(e.verified))}
                        disabled={actionLoading === e.id + '_verified'}
                        title={Boolean(e.verified) ? 'Click to unverify' : 'Click to verify'}
                        className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all disabled:opacity-50 ${Boolean(e.verified) ? 'text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/10 hover:bg-[#FFD700]/20' : 'text-text-muted border-color bg-dark-bg hover:border-[#FFD700]/40 hover:text-[#FFD700]'}`}
                      >
                        {actionLoading === e.id + '_verified' ? <div className="w-2.5 h-2.5 border border-current/40 border-t-current rounded-full animate-spin" /> : Boolean(e.verified) ? <CheckCircle2 size={11}/> : <AlertTriangle size={11}/>}
                        {Boolean(e.verified) ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleFeature(e.id)}
                        disabled={actionLoading === e.id + '_feature'}
                        title={Boolean(e.featured) ? 'Remove boost' : 'Boost this escort to top'}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all flex items-center gap-1 disabled:opacity-50 ${Boolean(e.featured) ? 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/40 hover:bg-[#FFD700]/30' : 'bg-dark-bg text-text-muted border-color hover:border-[#FFD700]/50 hover:text-[#FFD700]'}`}
                      >
                        {actionLoading === e.id + '_feature' ? <div className="w-2.5 h-2.5 border border-current/40 border-t-current rounded-full animate-spin" /> : <Crown size={10}/>}
                        {Boolean(e.featured) ? 'Boosted' : 'Boost'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {!Boolean(e.is_active) && !Boolean(e.verified) ? (
                          <>
                            <button
                              onClick={() => handleApprove(e.id)}
                              disabled={actionLoading === e.id + '_approve'}
                              className="px-2.5 py-1 bg-[#28a745]/20 text-[#28a745] text-[9px] font-bold rounded-lg border border-[#28a745]/30 hover:bg-[#28a745]/30 disabled:opacity-50 flex items-center gap-1"
                            >
                              {actionLoading === e.id + '_approve' ? <div className="w-2.5 h-2.5 border border-[#28a745]/40 border-t-[#28a745] rounded-full animate-spin" /> : <CheckCircle2 size={10}/>}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(e.id)}
                              disabled={actionLoading === e.id + '_reject'}
                              className="px-2.5 py-1 bg-[#EF4444]/20 text-[#EF4444] text-[9px] font-bold rounded-lg border border-[#EF4444]/30 hover:bg-[#EF4444]/30 disabled:opacity-50 flex items-center gap-1"
                            >
                              {actionLoading === e.id + '_reject' ? <div className="w-2.5 h-2.5 border border-[#EF4444]/40 border-t-[#EF4444] rounded-full animate-spin" /> : <XCircle size={10}/>}
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditEscort(e)} className="p-1.5 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg" title="Edit"><Edit2 size={13}/></button>
                            <button
                              onClick={() => {
                                const uid = e.user_id ? String(e.user_id) : null
                                if (!uid) { alert('This escort has no linked user account.'); return }
                                const token = localStorage.getItem('w3c_token')
                                fetch(`/api/admin/impersonate/${uid}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
                                  .then(r => r.json()).then(data => {
                                    if (!data.token) { alert(data.message ?? 'Impersonation failed'); return }
                                    const url = `/view-as?token=${encodeURIComponent(data.token)}&name=${encodeURIComponent(e.name)}&role=escort&uid=${uid}&redirect=/my-profile`
                                    window.open(url, '_blank')
                                  }).catch(() => alert('Impersonation failed'))
                              }}
                              className="p-1.5 text-[#2196F3] hover:bg-dark-bg rounded-lg"
                              title="View As Escort"
                            ><Eye size={13}/></button>
                            {Boolean(e.is_active) && (
                              <button
                                onClick={() => handleReject(e.id)}
                                disabled={actionLoading === e.id + '_reject'}
                                className="p-1.5 text-[#FF9800] rounded-lg hover:bg-dark-bg disabled:opacity-50"
                                title="Deactivate (reversible)"
                              >
                                {actionLoading === e.id + '_reject'
                                  ? <div className="w-3.5 h-3.5 border border-[#FF9800]/40 border-t-[#FF9800] rounded-full animate-spin" />
                                  : <XCircle size={13}/>}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteForever(e.id, e.name)}
                              disabled={actionLoading === e.id + '_delete'}
                              className="p-1.5 text-[#EF4444] bg-[#EF4444]/10 rounded-lg hover:bg-[#EF4444]/20 disabled:opacity-50"
                              title="Delete Forever — removes from database permanently"
                            >
                              {actionLoading === e.id + '_delete'
                                ? <div className="w-3.5 h-3.5 border border-[#EF4444]/40 border-t-[#EF4444] rounded-full animate-spin" />
                                : <Trash2 size={13}/>}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editEscort && (
        <EditEscortModal
          escort={editEscort}
          onClose={() => setEditEscort(null)}
          onSaved={updated => {
            setEscorts(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e))
            setEditEscort(null)
          }}
        />
      )}
      {showAddModal && (
        <AddEscortModal
          onClose={() => setShowAddModal(false)}
          onCreated={e => setEscorts(prev => [{ ...e, online: false, is_active: true, verified: false }, ...prev])}
        />
      )}
    </div>
  )
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [mods, setMods] = useState<Moderator[]>(INIT_MODS)
  const [modsLoading, setModsLoading] = useState(false)
  const [modsError, setModsError] = useState('')
  const [showAddMod, setShowAddMod] = useState(false)
  const [newMod, setNewMod] = useState({ name:'', email:'', role:'moderator', level: 1 as 1|2|3, password:'' })
  const [addingMod, setAddingMod] = useState(false)
  const [addModErr, setAddModErr] = useState('')
  const [featuredReqs, setFeaturedReqs] = useState<FeaturedRequest[]>(INIT_FEATURED)
  const { logout } = useAuth()

  useEffect(() => {
    if (activeTab !== 'Moderators') return
    setModsLoading(true); setModsError('')
    adminFetch('/admin/moderators')
      .then((data: any[]) => setMods(data.map(m => ({
        id: m.id,
        name: m.name || m.email,
        email: m.email,
        role: m.role,
        level: m.role === 'admin' ? 3 : 1,
        status: m.is_active ? 'active' : 'inactive',
        createdAt: m.created_at ? new Date(m.created_at).toLocaleDateString() : '—',
      }))))
      .catch(e => setModsError(e?.message ?? 'Failed to load moderators'))
      .finally(() => setModsLoading(false))
  }, [activeTab])

  const addMod = async () => {
    if (!newMod.name || !newMod.email || !newMod.password) { setAddModErr('Name, email and password are required'); return }
    setAddingMod(true); setAddModErr('')
    try {
      await adminFetch('/admin/moderators', { method: 'POST', body: JSON.stringify({ name: newMod.name, email: newMod.email, role: newMod.role, password: newMod.password }) })
      const data: any[] = await adminFetch('/admin/moderators')
      setMods(data.map(m => ({ id: m.id, name: m.name || m.email, email: m.email, role: m.role, level: m.role === 'admin' ? 3 : 1, status: m.is_active ? 'active' : 'inactive', createdAt: m.created_at ? new Date(m.created_at).toLocaleDateString() : '—' })))
      setNewMod({ name:'', email:'', role:'moderator', level: 1, password:'' }); setShowAddMod(false)
    } catch (e: any) {
      setAddModErr(e?.message ?? 'Failed to create moderator')
    }
    setAddingMod(false)
  }

  const approveFeatured = (id: number) => setFeaturedReqs(p => p.map(r => r.id === id ? { ...r, status: 'approved' } : r))
  const rejectFeatured  = (id: number) => setFeaturedReqs(p => p.map(r => r.id === id ? { ...r, status: 'rejected'  } : r))

  const statusColor: Record<string, '#28a745'|'#FFD700'|'#6B7280'|'#EF4444'> = {
    confirmed: '#28a745', pending: '#FFD700', completed: '#6B7280',
    active: '#28a745', inactive: '#EF4444', approved: '#28a745', rejected: '#EF4444',
  }

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Admin header */}
        <div className="w-full px-4 sm:px-6 py-4 bg-gradient-to-r from-[#8B0000]/20 to-transparent border-b border-color flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B0000]/20 border border-[#8B0000]/30 flex items-center justify-center">
              <Shield size={18} className="text-[#8B0000]" />
            </div>
            <div>
              <h1 className="text-base font-black text-text-light">Admin Panel</h1>
              <p className="text-[10px] text-text-muted">Platform management dashboard</p>
            </div>
          </div>
          <button onClick={logout} className="px-3 py-1.5 border border-[#EF4444]/30 text-[#EF4444] text-xs rounded-xl hover:bg-[#EF4444]/10 transition-all">Sign Out</button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 border-b border-color">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${activeTab===tab?'text-[#FFD700] border-[#FFD700]':'text-text-muted border-transparent hover:text-text-light'}`}>{tab}</button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">

          {/* ── OVERVIEW ── */}
          {activeTab === 'Overview' && (
            <div className="space-y-5">
              <OverviewStats />
              <OverviewBulkToggle />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <PendingApprovals />
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-text-light mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-[#28a745]"/>Revenue This Week</h3>
                  <div className="flex items-end gap-1.5 h-28">
                    {[40,65,48,85,60,92,75].map((h,i)=>(
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-lg" style={{height:`${h}%`,background:'linear-gradient(to top,#8B0000,#E91E63)',opacity:i===5?1:0.5}}/>
                        <span className="text-[8px] text-text-muted">{['M','T','W','T','F','S','S'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Pending featured */}
              <div className="bg-card-bg border border-[#FFD700]/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-text-light flex items-center gap-2"><Crown size={14} className="text-[#FFD700]"/>Featured Requests Pending</h3>
                  <button onClick={() => setActiveTab('Featured')} className="text-xs text-[#FFD700] hover:underline">View all →</button>
                </div>
                <div className="flex gap-3">
                  {featuredReqs.filter(r=>r.status==='pending').slice(0,3).map(r=>(
                    <div key={r.id} className="flex-1 bg-dark-bg border border-color rounded-xl p-3">
                      <p className="text-xs font-bold text-text-light">{r.name}</p>
                      <p className="text-[10px] text-text-muted mb-2">{r.plan} · KES {r.amount.toLocaleString()}</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => approveFeatured(r.id)} className="flex-1 py-1 bg-[#28a745]/20 text-[#28a745] text-[9px] font-bold rounded-lg border border-[#28a745]/30">✓ Approve</button>
                        <button onClick={() => rejectFeatured(r.id)}  className="flex-1 py-1 bg-[#EF4444]/20 text-[#EF4444]  text-[9px] font-bold rounded-lg border border-[#EF4444]/30">✕ Reject</button>
                      </div>
                    </div>
                  ))}
                  {featuredReqs.filter(r=>r.status==='pending').length === 0 && (
                    <p className="text-xs text-text-muted">No pending featured requests.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── ESCORTS ── */}
          {activeTab === 'Escorts' && <EscortsTab />}

          {/* ── CLAIMS ── */}
          {activeTab === 'Claims' && <ClaimsTab />}

          {/* ── CLIENTS ── */}
          {activeTab === 'Clients' && <ClientsTab />}

          {/* ── BOOKINGS ── */}
          {activeTab === 'Bookings' && <BookingsTab />}

          {/* ── REPORTS ── */}
          {activeTab === 'Reports' && <ReportsTab />}

          {/* ── REVENUE ── */}
          {activeTab === 'Revenue' && <RevenueDashboard />}

          {/* ── MODERATORS ── */}
          {activeTab === 'Moderators' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">Admin and moderator accounts with platform access.</p>
                <button onClick={()=>{setShowAddMod(true);setAddModErr('')}} className="flex items-center gap-1.5 px-4 py-2 bg-[#8B0000] text-white text-xs font-bold rounded-xl"><Plus size={13}/>Add Moderator</button>
              </div>
              {showAddMod && (
                <div className="bg-card-bg border border-color rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-text-light mb-1">New Moderator / Admin</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={newMod.name} onChange={e=>setNewMod(p=>({...p,name:e.target.value}))} placeholder="Full Name" className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]"/>
                    <input value={newMod.email} onChange={e=>setNewMod(p=>({...p,email:e.target.value}))} placeholder="Email address" className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]"/>
                    <input type="password" value={newMod.password} onChange={e=>setNewMod(p=>({...p,password:e.target.value}))} placeholder="Temporary password" className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]"/>
                    <select value={newMod.role} onChange={e=>setNewMod(p=>({...p,role:e.target.value}))} className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none">
                      <option value="moderator">Moderator</option><option value="admin">Admin</option>
                    </select>
                  </div>
                  {addModErr && <p className="text-[10px] text-[#EF4444]">{addModErr}</p>}
                  <div className="flex gap-2">
                    <button onClick={addMod} disabled={addingMod} className="px-4 py-2 bg-[#28a745] text-white text-xs rounded-xl font-bold disabled:opacity-60 flex items-center gap-1.5">
                      {addingMod && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                      {addingMod ? 'Creating…' : 'Create Account'}
                    </button>
                    <button onClick={()=>setShowAddMod(false)} className="px-4 py-2 border border-color text-text-muted text-xs rounded-xl">Cancel</button>
                  </div>
                </div>
              )}
              {modsLoading && <div className="flex items-center justify-center py-10 gap-2 text-text-muted"><div className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin"/><span className="text-sm">Loading…</span></div>}
              {modsError && <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl"><p className="text-xs text-[#EF4444]">{modsError}</p></div>}
              {!modsLoading && (
                <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-color flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text-light">Staff Accounts</h3>
                    <span className="text-[10px] text-text-muted">{mods.length} account{mods.length!==1?'s':''}</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="bg-dark-bg border-b border-color"><tr>{['Name','Email','Role','Status','Joined','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-semibold text-text-muted">{h}</th>)}</tr></thead>
                    <tbody>
                      {mods.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted text-xs">No staff accounts yet. Add a moderator above.</td></tr>}
                      {mods.map(m=>(
                        <tr key={m.id} className="border-b border-color/40 hover:bg-dark-bg transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-[10px] font-bold text-[#8B0000]">{(m.name||'?').charAt(0).toUpperCase()}</div>
                              <span className="font-semibold text-text-light">{m.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{m.email}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.role==='admin'?'bg-[#8B0000]/20 text-[#8B0000]':'bg-[#2196F3]/20 text-[#2196F3]'}`}>{m.role}</span></td>
                          <td className="px-4 py-3">
                            <button
                              onClick={async ()=>{
                                try {
                                  await adminFetch(`/admin/users/${m.id}/toggle-active`, { method: 'PATCH' })
                                  setMods(p=>p.map(x=>x.id===m.id?{...x,status:x.status==='active'?'inactive':'active'}:x))
                                } catch {}
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${m.status==='active'?'bg-[#28a745]/20 text-[#28a745] hover:bg-[#28a745]/30':'bg-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/30'}`}
                            >{m.status}</button>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{m.createdAt}</td>
                          <td className="px-4 py-3">
                            {m.role !== 'admin' && (
                              <button
                                onClick={async ()=>{
                                  if (!confirm(`Remove ${m.name}?`)) return
                                  try {
                                    await adminFetch(`/admin/users/${m.id}`, { method: 'DELETE' })
                                    setMods(p=>p.filter(x=>x.id!==m.id))
                                  } catch {}
                                }}
                                className="p-1.5 text-[#EF4444] rounded-lg hover:bg-dark-bg transition-colors"
                                title="Remove"
                              ><Trash2 size={13}/></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── FEATURED ── */}
          {activeTab === 'Featured' && (
            <div className="space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label:'Pending',  value: featuredReqs.filter(r=>r.status==='pending').length,  color:'#FFD700' },
                  { label:'Approved', value: featuredReqs.filter(r=>r.status==='approved').length, color:'#28a745' },
                  { label:'Rejected', value: featuredReqs.filter(r=>r.status==='rejected').length, color:'#EF4444' },
                  { label:'Revenue',  value:'KES '+(featuredReqs.filter(r=>r.status==='approved').reduce((a,r)=>a+r.amount,0)).toLocaleString(), color:'#FFD700' },
                ].map(s => (
                  <div key={s.label} className="bg-card-bg border border-color rounded-2xl p-4">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Pricing editor */}
              <div className="bg-card-bg border border-[#FFD700]/20 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4 flex items-center gap-2"><Crown size={14} className="text-[#FFD700]"/>Featured Pricing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {[['3-Day Boost','KES','500'],['Weekly Featured','KES','1500'],['Monthly Elite','KES','4500']].map(([plan,cur,def])=>(
                    <div key={plan}>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">{plan}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">{cur}</span>
                        <input type="number" defaultValue={def} className="flex-1 px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700] transition-all"/>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-[#8B0000]"/>
                    <span className="text-xs text-text-muted">Require admin approval before going live</span>
                  </label>
                </div>
                <button className="mt-4 px-5 py-2 bg-[#8B0000] text-white text-xs font-bold rounded-xl hover:bg-[#a00000] transition-all">Save Pricing</button>
              </div>

              {/* Request list */}
              <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-color flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-light">All Featured Requests</h3>
                  <span className="text-[10px] text-text-muted">{featuredReqs.length} total</span>
                </div>
                <div className="divide-y divide-color/40">
                  {featuredReqs.map(r => (
                    <div key={r.id} className="flex items-center gap-4 px-4 py-3.5">
                      <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-sm font-bold text-[#FFD700] flex-shrink-0">{r.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text-light">{r.name}</p>
                        <p className="text-[10px] text-text-muted">{r.city} · {r.plan} · {r.date}</p>
                        <p className="text-[10px] text-text-muted font-mono">ref: {r.txRef} · {r.phone}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-[#FFD700]">KES {r.amount.toLocaleString()}</p>
                        {r.status === 'pending' ? (
                          <div className="flex gap-1.5 mt-1">
                            <button onClick={() => approveFeatured(r.id)} className="px-2.5 py-1 bg-[#28a745]/20 text-[#28a745] text-[9px] font-bold rounded-lg border border-[#28a745]/30">✓ Approve</button>
                            <button onClick={() => rejectFeatured(r.id)}  className="px-2.5 py-1 bg-[#EF4444]/20 text-[#EF4444]  text-[9px] font-bold rounded-lg border border-[#EF4444]/30">✕ Reject</button>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize" style={{color:(statusColor as any)[r.status],backgroundColor:(statusColor as any)[r.status]+'20'}}>{r.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── BLOG ── */}
          {activeTab === 'Blog' && <AdminBlog />}

          {/* ── API KEYS ── */}
          {activeTab === 'API Keys' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="lg:col-span-2 flex items-start gap-3 p-4 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-2xl">
                <AlertTriangle size={14} className="text-[#FFD700] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#FFD700] mb-0.5">Security Notice</p>
                  <p className="text-[10px] text-text-muted">API keys are stored securely and never exposed to the frontend. Only enter credentials in this panel. All keys are encrypted at rest.</p>
                </div>
              </div>

              {/* PayHero / M-Pesa */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone size={16} className="text-[#28a745]" />
                  <h3 className="text-sm font-bold text-text-light">PayHero (M-Pesa STK Push)</h3>
                  <a href="https://payhero.co.ke" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-[#FFD700] hover:underline">payhero.co.ke ↗</a>
                </div>
                <div className="space-y-4">
                  <ApiKeyField label="PayHero API Key (Username)" placeholder="e.g. e2s7pxzvlsHZcaAIuo80" icon={Key} hint="Found in PayHero dashboard → Settings → API Keys" settingKey="payhero_api_key" />
                  <ApiKeyField label="PayHero Secret (Password)" placeholder="Enter your PayHero API password" icon={Lock} settingKey="payhero_secret" />
                  <TextSettingField label="Channel ID" placeholder="e.g. 5107" settingKey="payhero_channel_id" hint="PayHero → Payment Channels → Channel ID column" />
                  <TextSettingField label="Till / Paybill Number" placeholder="e.g. 9867233" settingKey="payhero_till" hint="Your M-Pesa till or paybill number for display" />
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Callback URL (copy into PayHero)</label>
                    <input readOnly value="https://wet3.camp/api/payments/payhero/callback" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#28a745] transition-all font-mono text-xs cursor-text" onClick={e => (e.target as HTMLInputElement).select()}/>
                    <p className="text-[10px] text-text-muted mt-1">Copy this into PayHero → Payment Channels → Callback URL.</p>
                  </div>
                  <PayHeroTestButton />
                </div>
              </div>

              {/* Google OAuth */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={16} className="text-[#4285F4]" />
                  <h3 className="text-sm font-bold text-text-light">Google OAuth</h3>
                  <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-[#FFD700] hover:underline">Google Console ↗</a>
                </div>
                <div className="space-y-4">
                  <ApiKeyField label="Google Client ID" placeholder="xxxxxxxxxx.apps.googleusercontent.com" icon={Key} hint="Create OAuth 2.0 credentials in Google Cloud Console" settingKey="google_client_id" />
                  <ApiKeyField label="Google Client Secret" placeholder="GOCSPX-xxxxxxxxxxxxxxx" icon={Lock} settingKey="google_client_secret" />
                </div>
              </div>

              {/* Facebook OAuth */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={16} className="text-[#1877F2]" />
                  <h3 className="text-sm font-bold text-text-light">Facebook / Meta OAuth</h3>
                  <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-[#FFD700] hover:underline">Meta Developers ↗</a>
                </div>
                <div className="space-y-4">
                  <ApiKeyField label="Facebook App ID" placeholder="123456789012345" icon={Key} hint="Create an app at Meta for Developers → Facebook Login product" settingKey="facebook_app_id" />
                  <ApiKeyField label="Facebook App Secret" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" icon={Lock} settingKey="facebook_app_secret" />
                </div>
              </div>

              {/* Apple Sign-In */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={16} className="text-text-light" />
                  <h3 className="text-sm font-bold text-text-light">Apple Sign-In</h3>
                  <a href="https://developer.apple.com" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-[#FFD700] hover:underline">Apple Developer ↗</a>
                </div>
                <div className="space-y-4">
                  <ApiKeyField label="Apple Service ID" placeholder="com.wet3camp.auth" icon={Key} hint="Services ID registered in Apple Developer → Certificates, Identifiers & Profiles" settingKey="apple_service_id" />
                  <ApiKeyField label="Apple Team ID" placeholder="XXXXXXXXXX" icon={Key} settingKey="apple_team_id" />
                  <ApiKeyField label="Apple Key ID" placeholder="XXXXXXXXXX" icon={Key} hint="10-character key ID from Apple Developer Portal" settingKey="apple_key_id" />
                  <ApiKeyField label="Apple Private Key (.p8)" placeholder="-----BEGIN PRIVATE KEY-----..." icon={Lock} settingKey="apple_private_key" />
                </div>
              </div>

              {/* Instagram */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Instagram size={16} className="text-[#E91E63]" />
                  <h3 className="text-sm font-bold text-text-light">Instagram Import API</h3>
                  <a href="https://developers.facebook.com/docs/instagram-basic-display-api" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-[#FFD700] hover:underline">Docs ↗</a>
                </div>
                <div className="space-y-4">
                  <ApiKeyField label="Instagram App ID" placeholder="Instagram Basic Display App ID" icon={Key} hint="Used so escorts can import their public posts from Instagram" />
                  <ApiKeyField label="Instagram App Secret" placeholder="Instagram App Secret" icon={Lock} />
                </div>
              </div>

              {/* Africa's Talking SMS */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={16} className="text-[#22c55e]" />
                  <h3 className="text-sm font-bold text-text-light">Africa's Talking (SMS)</h3>
                  <a href="https://account.africastalking.com" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-[#FFD700] hover:underline">Dashboard ↗</a>
                </div>
                <p className="text-[11px] text-text-muted mb-4">Used to send OTP codes when escorts claim their profile via phone number verification.</p>
                <div className="space-y-4">
                  <TextSettingField label="AT Username" placeholder="sandbox  (or your production app name)" settingKey="at_username" hint="Use 'sandbox' for testing, or your app/team name for live" />
                  <ApiKeyField label="AT API Key" placeholder="atsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" icon={Key} settingKey="at_api_key" hint="Settings → API Key inside your Sandbox or Team app on AT dashboard" />
                  <TextSettingField label="Sender ID (optional)" placeholder="WET3CAMP" settingKey="at_sender_id" hint="Custom SMS sender name — leave blank to use default AT short code. Requires approval from AT." />
                </div>
              </div>

              {/* Telegram */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle size={16} className="text-[#229ED9]" />
                  <h3 className="text-sm font-bold text-text-light">Telegram Bot (Notifications)</h3>
                  <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-[#FFD700] hover:underline">@BotFather ↗</a>
                </div>
                <div className="space-y-4">
                  <ApiKeyField label="Telegram Bot Token" placeholder="1234567890:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" icon={Key} settingKey="telegram_token" hint="Create a bot via @BotFather on Telegram" />
                  <TextSettingField label="Admin Chat ID" placeholder="e.g. -1001234567890" settingKey="telegram_chat_id" hint="Your group chat ID for admin notifications (new registrations, featured requests, etc.)" />
                </div>
              </div>

              {/* Email / SMTP */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={16} className="text-[#FF9800]" />
                  <h3 className="text-sm font-bold text-text-light">Email / SMTP (Notifications)</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <TextSettingField label="SMTP Host" placeholder="smtp.gmail.com" settingKey="smtp_host" />
                    <TextSettingField label="Port" placeholder="587" settingKey="smtp_port" type="number" />
                  </div>
                  <ApiKeyField label="SMTP Username" placeholder="noreply@wet3camp.com" icon={Mail} settingKey="smtp_user" />
                  <ApiKeyField label="SMTP Password / App Password" placeholder="xxxx xxxx xxxx xxxx" icon={Lock} settingKey="smtp_pass" />
                  <SmtpTestButton />
                </div>
              </div>

              <TestAllConnectionsButton />
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'Settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4 flex items-center gap-2"><Settings size={14}/>Platform Settings</h3>
                <PlatformSettingsForm />
              </div>
              <div className="bg-card-bg border border-[#FFD700]/20 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-2 flex items-center gap-2">
                  <Camera size={14} className="text-[#FFD700]" /> Verification Pose Reference Photo
                </h3>
                <p className="text-[11px] text-text-muted mb-4">This photo is shown to escorts during registration as the required selfie pose. Update it here when you want a different pose.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Current Pose Guide</p>
                    <div className="aspect-[4/3] rounded-2xl border-2 border-[#FFD700]/20 bg-dark-bg overflow-hidden flex items-center justify-center">
                      <img src="/pose-guide.png" alt="Pose guide" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <p className="text-xs text-text-muted absolute">No pose guide uploaded yet</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Upload New Pose</p>
                    <label className="aspect-[4/3] rounded-2xl border-2 border-dashed border-color hover:border-[#FFD700] transition-all cursor-pointer bg-dark-bg flex flex-col items-center justify-center gap-2">
                      <Camera size={24} className="text-text-muted" />
                      <span className="text-xs text-text-muted text-center px-4">Click to upload a new pose reference photo</span>
                      <span className="text-[10px] text-text-muted">PNG, JPG · Max 5MB</span>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>
                </div>
                <button className="mt-4 px-4 py-2 bg-[#FFD700] text-black text-xs font-bold rounded-xl hover:bg-[#e6c000] transition-all flex items-center gap-2">
                  <Save size={12} /> Save Pose Photo
                </button>
              </div>
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4">Admin Credentials</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-bg border border-color rounded-xl p-3"><p className="text-[10px] text-text-muted mb-1">Email</p><p className="text-xs font-mono text-text-light">admin@wet3camp.com</p></div>
                  <div className="bg-dark-bg border border-color rounded-xl p-3"><p className="text-[10px] text-text-muted mb-1">Password</p><p className="text-xs font-mono text-[#FFD700]">••••••••••••••</p></div>
                </div>
                <p className="text-[10px] text-[#EF4444] mt-3 flex items-center gap-1"><Shield size={10}/>Keep credentials secure — never share admin access.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AdminBlog() {
  const [posts, setPosts] = useState<Array<{id:string;title:string;category:string;published:boolean;publishedAt:string;slug:string}>>([])
  const [editing, setEditing] = useState<{id:string;title:string;excerpt:string;content:string;category:string;tags:string;imageUrl:string;published:boolean} | null>(null)
  const [creating, setCreating] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    import('@/data/blog').then(({ getBlogPosts }) => {
      setPosts(getBlogPosts().map((p: any) => ({ id: p.id, title: p.title, category: p.category, published: p.published, publishedAt: p.publishedAt, slug: p.slug })))
    })
  }, [])

  const blank = { id: '', title: '', excerpt: '', content: '', category: 'Kenya Escorts Guide', tags: '', imageUrl: '', published: false }

  const save = async () => {
    const { getBlogPosts, saveBlogPosts, slugify } = await import('@/data/blog')
    const all = getBlogPosts()
    if (editing?.id) {
      const updated = all.map((p: any) => p.id === editing.id ? { ...p, ...editing, tags: editing.tags.split(',').map((t: string) => t.trim()), slug: slugify(editing.title), updatedAt: new Date().toISOString().split('T')[0] } : p)
      saveBlogPosts(updated)
    } else if (creating) {
      const newPost = { ...editing, id: Date.now().toString(), slug: slugify(editing!.title), tags: editing!.tags.split(',').map((t: string) => t.trim()), author: 'Wet3Camp Editorial', readTime: Math.ceil(editing!.content.split(' ').length / 200), publishedAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] }
      saveBlogPosts([...all, newPost])
    }
    const updated2 = await import('@/data/blog').then(m => m.getBlogPosts())
    setPosts(updated2.map((p: any) => ({ id: p.id, title: p.title, category: p.category, published: p.published, publishedAt: p.publishedAt, slug: p.slug })))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
    setEditing(null); setCreating(false)
  }

  const deletePost = async (id: string) => {
    const { getBlogPosts, saveBlogPosts } = await import('@/data/blog')
    saveBlogPosts(getBlogPosts().filter((p: any) => p.id !== id))
    setPosts(p => p.filter(x => x.id !== id))
  }

  const togglePublish = async (id: string) => {
    const { getBlogPosts, saveBlogPosts } = await import('@/data/blog')
    const all = getBlogPosts()
    saveBlogPosts(all.map((p: any) => p.id === id ? { ...p, published: !p.published } : p))
    setPosts(posts.map(p => p.id === id ? { ...p, published: !p.published } : p))
  }

  const startEdit = async (id: string) => {
    const { getBlogPosts } = await import('@/data/blog')
    const post = getBlogPosts().find((p: any) => p.id === id)
    if (post) { setEditing({ ...post, tags: post.tags.join(', ') }); setCreating(false) }
  }

  if (editing || creating) {
    const form = editing ?? blank
    const set = (k: string, v: string | boolean) => setEditing((e: any) => e ? { ...e, [k]: v } : { ...blank, [k]: v })
    return (
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => { setEditing(null); setCreating(false) }} className="text-xs text-text-muted hover:text-text-light">← Back</button>
          <h3 className="text-sm font-black text-text-light">{creating ? 'New Article' : 'Edit Article'}</h3>
        </div>
        {(['title','excerpt','imageUrl'] as const).map(field => (
          <div key={field}>
            <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">{field}</label>
            <input value={(form as any)[field] ?? ''} onChange={e => set(field, e.target.value)} className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all" />
          </div>
        ))}
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Content (Markdown)</label>
          <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={12} className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all font-mono text-xs resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all">
              {['Safety Tips','Kenya Escorts Guide','Nairobi Nightlife','Mombasa Escorts','Booking Tips','Platform News','Escort Reviews','Travel Companions'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => set('published', !form.published)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${form.published ? 'bg-[#28a745]/20 border-[#28a745]/40 text-[#28a745]' : 'bg-dark-bg border-color text-text-muted'}`}>
            {form.published ? '● Published' : '○ Draft'}
          </button>
          <button onClick={save} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${saved ? 'bg-[#28a745] text-white' : 'bg-[#8B0000] text-white hover:bg-[#a00000]'}`}>
            {saved ? '✓ Saved' : 'Save Article'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-text-light">Blog Management</h3>
          <p className="text-[10px] text-text-muted mt-0.5">{posts.length} articles total · {posts.filter(p=>p.published).length} published</p>
        </div>
        <button onClick={() => { setCreating(true); setEditing({ ...blank }) }} className="px-3 py-2 bg-[#8B0000] text-white text-xs font-bold rounded-xl hover:bg-[#a00000] transition-all flex items-center gap-1.5">
          + New Article
        </button>
      </div>
      <div className="space-y-2">
        {posts.map(post => (
          <div key={post.id} className="flex items-center gap-3 p-3 bg-card-bg border border-color rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-light truncate">{post.title}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{post.category} · {post.publishedAt}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${post.published ? 'bg-[#28a745]/20 text-[#28a745]' : 'bg-[#6B7280]/20 text-[#6B7280]'}`}>
              {post.published ? 'Published' : 'Draft'}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => togglePublish(post.id)} className="px-2 py-1 bg-dark-bg border border-color text-[9px] text-text-muted rounded-lg hover:border-[#8B0000]/50 transition-all">
                {post.published ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => startEdit(post.id)} className="px-2 py-1 bg-[#8B0000]/20 border border-[#8B0000]/30 text-[#8B0000] text-[9px] rounded-lg hover:bg-[#8B0000]/30 transition-all">Edit</button>
              <button onClick={() => deletePost(post.id)} className="px-2 py-1 bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-[9px] rounded-lg hover:bg-[#EF4444]/30 transition-all">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminPage() {
  useSEO({ title: 'Admin Dashboard', noIndex: true })
  const { isAdmin } = useAuth()
  if (!isAdmin) return <AdminLogin />
  return <AdminDashboard />
}
