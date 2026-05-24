import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Search, AlertTriangle, Flag, MapPin, Calendar, Shield, Eye } from 'lucide-react'

const BLACKLIST = [
  { id:1, name:'John D.',   type:'client',  reason:'Non-payment',              city:'Nairobi',  date:'2025-12-10', severity:'high',   reports:7  },
  { id:2, name:'Peter M.', type:'client',  reason:'Abusive behavior',          city:'Mombasa',  date:'2025-11-22', severity:'critical',reports:12 },
  { id:3, name:'Kevin O.', type:'client',  reason:'Booking no-show (repeated)',city:'Nairobi',  date:'2026-01-05', severity:'medium', reports:4  },
  { id:4, name:'Sam K.',   type:'escort',  reason:'Fraud / fake profile',      city:'Kisumu',   date:'2025-10-30', severity:'critical',reports:15 },
  { id:5, name:'Mary W.',  type:'escort',  reason:'Extortion',                 city:'Nairobi',  date:'2025-09-14', severity:'critical',reports:9  },
  { id:6, name:'Brian L.', type:'client',  reason:'Threatening messages',      city:'Nakuru',   date:'2026-02-20', severity:'high',   reports:5  },
  { id:7, name:'Agency X', type:'agency',  reason:'Operating without license', city:'Nairobi',  date:'2026-03-01', severity:'high',   reports:8  },
  { id:8, name:'Ann G.',   type:'escort',  reason:'Identity theft',            city:'Mombasa',  date:'2025-08-17', severity:'critical',reports:11 },
]

const SEVERITY_STYLE: Record<string,{color:string,bg:string,label:string}> = {
  critical: { color:'#EF4444', bg:'#EF444420', label:'CRITICAL' },
  high:     { color:'#F97316', bg:'#F9731620', label:'HIGH'     },
  medium:   { color:'#FFD700', bg:'#FFD70020', label:'MEDIUM'   },
}

export default function BlacklistPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [reportOpen, setReportOpen] = useState(false)
  const [reportName, setReportName] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent] = useState(false)

  const filtered = BLACKLIST.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.reason.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter==='All'||b.type===filter||b.severity===filter
    return matchSearch && matchFilter
  })

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>
        <div className="w-full relative h-40 border-b border-color overflow-hidden flex items-end" style={{background:'linear-gradient(135deg,#EF444420,#8B000020)'}}>
          <div className="relative px-5 sm:px-8 pb-5 w-full">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle size={13} className="text-[#EF4444]"/><span className="text-xs text-[#EF4444] font-bold uppercase tracking-widest">Safety</span></div>
            <h1 className="text-3xl font-black text-text-light">Blacklist</h1>
            <p className="text-sm text-text-muted mt-1">Community-reported bad actors. Stay safe — check before booking.</p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-2xl flex items-start gap-3">
          <Shield size={16} className="text-[#EF4444] mt-0.5 flex-shrink-0"/>
          <div>
            <p className="text-xs font-bold text-[#EF4444]">Community Safety Tool</p>
            <p className="text-[11px] text-text-muted mt-0.5">Entries here are based on verified community reports. Always exercise caution. Report any suspicious behavior to protect the community.</p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="px-4 sm:px-6 py-4 border-b border-color flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or reason…" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#EF4444] transition-all"/>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {['All','client','escort','agency','critical','high','medium'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all capitalize ${filter===f?'bg-[#EF4444] text-white':'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-text-muted">{filtered.length} entries found</p>
            <button onClick={()=>setReportOpen(v=>!v)} className="flex items-center gap-2 px-4 py-2 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold rounded-xl hover:bg-[#EF4444]/20 transition-all">
              <Flag size={12}/> Report Someone
            </button>
          </div>

          {reportOpen && (
            <div className="mb-5 bg-card-bg border border-[#EF4444]/30 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-text-light mb-4">Submit a Report</h3>
              {reportSent ? (
                <div className="flex items-center gap-2 text-[#28a745] text-sm"><Shield size={16}/> Report submitted. Our team will review within 24 hours.</div>
              ) : (
                <div className="space-y-3">
                  <input value={reportName} onChange={e=>setReportName(e.target.value)} placeholder="Person's name or alias" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#EF4444] transition-all"/>
                  <textarea value={reportReason} onChange={e=>setReportReason(e.target.value)} rows={3} placeholder="Describe what happened…" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#EF4444] transition-all resize-none"/>
                  <button onClick={()=>{setReportSent(true);setTimeout(()=>{setReportSent(false);setReportOpen(false);setReportName('');setReportReason('')},3000)}} className="px-6 py-2.5 bg-[#EF4444] text-white font-bold text-xs rounded-xl hover:bg-[#dc3545] transition-all">Submit Report</button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {filtered.map(b=>{
              const sev = SEVERITY_STYLE[b.severity]
              return (
                <div key={b.id} className="bg-card-bg border border-color rounded-2xl p-4 flex items-start gap-4 hover:border-[#EF4444]/30 transition-all">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor:sev.bg}}>
                    <AlertTriangle size={16} style={{color:sev.color}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-text-light text-sm">{b.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold capitalize" style={{backgroundColor:sev.bg,color:sev.color}}>{sev.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-dark-bg text-text-muted border border-color capitalize">{b.type}</span>
                    </div>
                    <p className="text-xs text-text-muted mb-2">{b.reason}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] text-text-muted"><MapPin size={9}/>{b.city}</span>
                      <span className="flex items-center gap-1 text-[10px] text-text-muted"><Calendar size={9}/>{b.date}</span>
                      <span className="flex items-center gap-1 text-[10px] text-[#EF4444]"><Flag size={9}/>{b.reports} reports</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length===0 && <div className="text-center py-10 text-text-muted text-sm">No blacklist entries found for your search.</div>}
          </div>
        </div>
      </div>
    </main>
  )
}
