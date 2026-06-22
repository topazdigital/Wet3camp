import React, { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Search, AlertTriangle, Flag, MapPin, Calendar, Shield, User, CheckCircle2 } from 'lucide-react'
import { useSEO } from '@/lib/useSEO'
import { useAuth } from '@/lib/auth-context'

const SEVERITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: '#EF4444', bg: '#EF444420', label: 'CRITICAL' },
  high:     { color: '#F97316', bg: '#F9731620', label: 'HIGH'     },
  medium:   { color: '#FFD700', bg: '#FFD70020', label: 'MEDIUM'   },
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('w3c_token') || localStorage.getItem('auth_token')
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`)
  return data
}

type EscortSuggestion = { id: string; name: string; city?: string }

export default function BlacklistPage() {
  useSEO({
    title: 'Escort Blacklist Kenya — Safety Database',
    description: 'Community-maintained safety blacklist for escorts and clients in Kenya. Report bad actors and protect yourself.',
    keywords: 'escort blacklist Kenya, bad clients Kenya, safety database escorts',
    canonicalPath: '/blacklist',
  })
  const { isLoggedIn } = useAuth()
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('All')
  const [entries, setEntries]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportName, setReportName] = useState('')
  const [reportType, setReportType] = useState('client')
  const [reportReason, setReportReason] = useState('')
  const [reportCity, setReportCity]     = useState('Nairobi')
  const [reportSeverity, setReportSeverity] = useState('medium')
  const [reportSent, setReportSent]     = useState(false)
  const [reportError, setReportError]   = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  const [escortSuggestions, setEscortSuggestions] = useState<EscortSuggestion[]>([])
  const [showSuggestions, setShowSuggestions]     = useState(false)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Load blacklist entries
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (filter !== 'All') params.set('filter', filter)
    const t = setTimeout(() => {
      setLoading(true)
      fetch(`/api/blacklist?${params}`)
        .then(r => r.json())
        .then(d => { setEntries(Array.isArray(d) ? d : []); setLoading(false) })
        .catch(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [search, filter])

  // Escort name autocomplete
  useEffect(() => {
    clearTimeout(suggestTimer.current)
    if (!reportName || reportName.length < 2) { setEscortSuggestions([]); return }
    suggestTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/escorts/search?q=${encodeURIComponent(reportName)}`)
        if (r.ok) setEscortSuggestions(await r.json())
      } catch {}
    }, 350)
    return () => clearTimeout(suggestTimer.current)
  }, [reportName])

  const handleReport = async () => {
    if (!reportName || !reportReason) { setReportError('Name and reason are required'); return }
    if (!isLoggedIn) { setReportError('Please sign in to submit a report'); return }
    setReportLoading(true); setReportError('')
    try {
      await apiFetch('/blacklist/report', {
        method: 'POST',
        body: JSON.stringify({ name: reportName, type: reportType, reason: reportReason, city: reportCity, severity: reportSeverity }),
      })
      setReportSent(true)
      setTimeout(() => { setReportSent(false); setReportOpen(false); setReportName(''); setReportReason('') }, 3500)
    } catch (e: any) {
      setReportError(e.message)
    }
    setReportLoading(false)
  }

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        <div className="w-full relative h-40 border-b border-color overflow-hidden flex items-end" style={{ background: 'linear-gradient(135deg,#EF444420,#8B000020)' }}>
          <div className="relative px-5 sm:px-8 pb-5 w-full">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle size={13} className="text-[#EF4444]" /><span className="text-xs text-[#EF4444] font-bold uppercase tracking-widest">Safety</span></div>
            <h1 className="text-3xl font-black text-text-light">Blacklist</h1>
            <p className="text-sm text-text-muted mt-1">Community-reported bad actors. Stay safe — check before booking.</p>
          </div>
        </div>

        <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-2xl flex items-start gap-3">
          <Shield size={16} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#EF4444]">Community Safety Tool</p>
            <p className="text-[11px] text-text-muted mt-0.5">Entries here are based on verified community reports. All reports are reviewed before publishing. Report suspicious behavior to protect the community.</p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="px-4 sm:px-6 py-4 border-b border-color flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or reason…" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#EF4444] transition-all" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {['All', 'client', 'escort', 'agency', 'critical', 'high', 'medium'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all capitalize ${filter === f ? 'bg-[#EF4444] text-white' : 'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-text-muted">{loading ? '…' : `${entries.length} entries found`}</p>
            <button onClick={() => setReportOpen(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold rounded-xl hover:bg-[#EF4444]/20 transition-all">
              <Flag size={12} /> Report Someone
            </button>
          </div>

          {/* Report form */}
          {reportOpen && (
            <div className="mb-5 bg-card-bg border border-[#EF4444]/30 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-text-light mb-4">Submit a Report</h3>
              {reportSent ? (
                <div className="flex items-center gap-2 text-[#28a745] text-sm"><CheckCircle2 size={16} /> Report submitted. Our team will review within 24 hours.</div>
              ) : (
                <div className="space-y-3">
                  {!isLoggedIn && (
                    <p className="text-xs text-[#FFD700] p-2.5 bg-[#FFD700]/10 rounded-xl">You must be signed in to submit a report.</p>
                  )}
                  <div className="relative">
                    <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10" />
                    <input
                      value={reportName}
                      onChange={e => { setReportName(e.target.value); setShowSuggestions(true) }}
                      onFocus={() => { if (reportName.length >= 2) setShowSuggestions(true) }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Person's name or alias"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#EF4444] transition-all"
                      autoComplete="off"
                    />
                    {showSuggestions && escortSuggestions.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card-bg border border-color rounded-xl shadow-xl overflow-hidden">
                        <p className="px-3 py-1.5 text-[9px] text-text-muted uppercase tracking-widest border-b border-color/40">Registered escorts matching</p>
                        {escortSuggestions.map(s => (
                          <button key={s.id} type="button" onMouseDown={() => { setReportName(s.name); setShowSuggestions(false) }}
                            className="w-full text-left px-3.5 py-2.5 text-xs text-text-light hover:bg-dark-bg flex items-center gap-2 border-b border-color/30 last:border-0">
                            <User size={10} className="text-text-muted flex-shrink-0" />
                            <span className="font-semibold">{s.name}</span>
                            {s.city && <span className="text-text-muted ml-auto">{s.city}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1">Type</label>
                      <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#EF4444]">
                        <option value="client">Client</option>
                        <option value="escort">Escort</option>
                        <option value="agency">Agency</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1">Severity</label>
                      <select value={reportSeverity} onChange={e => setReportSeverity(e.target.value)} className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#EF4444]">
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <input value={reportCity} onChange={e => setReportCity(e.target.value)} placeholder="City (e.g. Nairobi)" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#EF4444] transition-all" />

                  <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} rows={3} placeholder="Describe what happened in detail…" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#EF4444] transition-all resize-none" />

                  {reportError && <p className="text-xs text-red-400">{reportError}</p>}

                  <button onClick={handleReport} disabled={reportLoading || !isLoggedIn} className="px-6 py-2.5 bg-[#EF4444] text-white font-bold text-xs rounded-xl hover:bg-[#dc3545] transition-all disabled:opacity-50">
                    {reportLoading ? 'Submitting…' : 'Submit Report'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card-bg border border-color rounded-2xl p-4 flex items-start gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-dark-bg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-dark-bg rounded w-32" />
                    <div className="h-2.5 bg-dark-bg rounded w-3/4" />
                    <div className="h-2.5 bg-dark-bg rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && entries.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <Shield size={40} className="text-[#28a745]/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-text-light mb-1">No blacklist entries found</p>
              <p className="text-xs">{search ? 'Try a different search term.' : 'No verified reports yet. The community is safe!'}</p>
            </div>
          )}

          {/* Entries */}
          {!loading && entries.length > 0 && (
            <div className="space-y-3">
              {entries.map(b => {
                const sev = SEVERITY_STYLE[b.severity] ?? SEVERITY_STYLE.medium
                return (
                  <div key={b.id} className="bg-card-bg border border-color rounded-2xl p-4 flex items-start gap-4 hover:border-[#EF4444]/30 transition-all">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: sev.bg }}>
                      <AlertTriangle size={16} style={{ color: sev.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-text-light text-sm">{b.name}</p>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold capitalize" style={{ backgroundColor: sev.bg, color: sev.color }}>{sev.label}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-dark-bg text-text-muted border border-color capitalize">{b.type}</span>
                      </div>
                      <p className="text-xs text-text-muted mb-2">{b.reason}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {b.city && <span className="flex items-center gap-1 text-[10px] text-text-muted"><MapPin size={9} />{b.city}</span>}
                        {b.created_at && <span className="flex items-center gap-1 text-[10px] text-text-muted"><Calendar size={9} />{new Date(b.created_at).toLocaleDateString('en-KE')}</span>}
                        <span className="flex items-center gap-1 text-[10px] text-[#EF4444]"><Flag size={9} />{b.report_count} reports</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
