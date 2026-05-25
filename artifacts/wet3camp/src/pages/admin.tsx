import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'
import {
  Shield, Users, Calendar, BarChart2, Settings, Plus, Trash2, Edit2, CheckCircle2, XCircle,
  AlertTriangle, Lock, Mail, Eye, EyeOff, TrendingUp, DollarSign, Crown, Key, Instagram,
  Smartphone, Globe, MessageCircle, Bell, Star, Save, RefreshCw
} from 'lucide-react'
import { useSEO } from '@/lib/useSEO'

const TABS = ['Overview','Escorts','Clients','Bookings','Moderators','Featured','API Keys','Settings']

interface Moderator { id: number; name: string; email: string; role: string; level: 1|2|3; status: 'active'|'inactive'; createdAt: string }

const INIT_MODS: Moderator[] = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@wet3camp.com', role: 'admin',     level: 3, status: 'active',   createdAt: '2024-01-15' },
  { id: 2, name: 'Mike Chen',     email: 'mike@wet3camp.com',  role: 'moderator', level: 2, status: 'active',   createdAt: '2024-02-20' },
]

const ESCORTS_DATA = [
  { name: 'Amara K.',   city: 'Nairobi', tier: 'Elite',    status: 'active',  earnings: 184000, bookings: 23, verified: true  },
  { name: 'Zara M.',    city: 'Nairobi', tier: 'VIP',      status: 'active',  earnings: 142000, bookings: 18, verified: true  },
  { name: 'Wanjiku G.', city: 'Mombasa', tier: 'Elite',    status: 'active',  earnings: 231000, bookings: 31, verified: true  },
  { name: 'Diana V.',   city: 'Nairobi', tier: 'Standard', status: 'pending', earnings: 0,      bookings: 0,  verified: false },
  { name: 'Faith C.',   city: 'Eldoret', tier: 'Standard', status: 'pending', earnings: 0,      bookings: 0,  verified: false },
]

const CLIENTS_DATA = [
  { name: 'John K.',  email: 'john@gmail.com',  city: 'Nairobi', joined: '2024-05-10', bookings: 12, spent: 96000  },
  { name: 'Mike O.',  email: 'mike@yahoo.com',  city: 'Nairobi', joined: '2024-04-22', bookings: 8,  spent: 64000  },
  { name: 'David L.', email: 'david@gmail.com', city: 'Mombasa', joined: '2024-06-01', bookings: 5,  spent: 40000  },
  { name: 'Paul M.',  email: 'paul@icloud.com', city: 'Kisumu',  joined: '2024-05-30', bookings: 3,  spent: 24000  },
]

const BOOKINGS_DATA = [
  { client: 'John K.',  escort: 'Amara K.',   date: 'Today 8PM',    duration: '2hrs',      amount: 16000, status: 'confirmed' },
  { client: 'Mike O.',  escort: 'Zara M.',    date: 'Tomorrow 6PM', duration: '1hr',        amount: 8000,  status: 'pending'   },
  { client: 'David L.', escort: 'Wanjiku G.', date: 'Sat 7PM',      duration: 'Overnight',  amount: 60000, status: 'confirmed' },
  { client: 'Paul M.',  escort: 'Luna K.',    date: 'Last week',    duration: '3hrs',       amount: 15000, status: 'completed' },
]

interface FeaturedRequest {
  id: number; name: string; city: string; plan: string; amount: number
  txRef: string; date: string; status: 'pending' | 'approved' | 'rejected'
  phone: string
}
const INIT_FEATURED: FeaturedRequest[] = [
  { id:1, name:'Sophia N.', city:'Kilimani',  plan:'Weekly Featured',  amount:1500, txRef:'FT-A3K9B', date:'Today 9:12 AM',    status:'pending',  phone:'0712 345 004' },
  { id:2, name:'Faith C.',  city:'Eldoret',   plan:'3-Day Boost',      amount:500,  txRef:'FT-M2X7P', date:'Today 8:45 AM',    status:'pending',  phone:'0723 456 005' },
  { id:3, name:'Priya S.',  city:'Lavington', plan:'Monthly Elite',    amount:4500, txRef:'FT-R5W1Q', date:'Yesterday 5:30 PM',status:'approved', phone:'0712 345 005' },
  { id:4, name:'Diana V.',  city:'Nairobi',   plan:'3-Day Boost',      amount:500,  txRef:'FT-N8L4T', date:'2 days ago',       status:'rejected', phone:'0701 234 006' },
]

function ApiKeyField({ label, placeholder, icon: Icon, hint }: { label: string; placeholder: string; icon: React.ComponentType<{size:number;className?:string}>; hint?: string }) {
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }
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
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${saved ? 'bg-[#28a745] text-white' : 'bg-[#8B0000] text-white hover:bg-[#a00000]'}`}
        >
          <Save size={11} /> {saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
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
          <p className="text-center text-[10px] text-text-muted mt-4">Demo: admin@wet3camp.com / Admin@Wet3Camp2024</p>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [mods, setMods] = useState<Moderator[]>(INIT_MODS)
  const [showAddMod, setShowAddMod] = useState(false)
  const [newMod, setNewMod] = useState({ name:'', email:'', role:'moderator', level: 1 as 1|2|3 })
  const [featuredReqs, setFeaturedReqs] = useState<FeaturedRequest[]>(INIT_FEATURED)
  const { logout } = useAuth()

  const addMod = () => {
    if (!newMod.name || !newMod.email) return
    setMods(p => [...p, { id: Date.now(), ...newMod, status: 'active', createdAt: new Date().toISOString().split('T')[0] }])
    setNewMod({ name:'', email:'', role:'moderator', level: 1 }); setShowAddMod(false)
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Users,      label: 'Total Escorts',  value: '1,247', change: '+23 this month',  color: '#8B0000'  },
                  { icon: Users,      label: 'Active Clients', value: '8,432', change: '+156 this month', color: '#2196F3'  },
                  { icon: Calendar,   label: 'Bookings Today', value: '89',    change: '+12% vs yesterday',color: '#28a745' },
                  { icon: DollarSign, label: 'Revenue (KES)',  value: '4.2M',  change: '+18% this month', color: '#FFD700'  },
                ].map(s => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="bg-card-bg border border-color rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2"><Icon size={14} style={{color:s.color}}/><span className="text-[10px] text-text-muted uppercase tracking-widest">{s.label}</span></div>
                      <p className="text-xl font-black text-text-light">{s.value}</p>
                      <p className="text-[10px] text-[#28a745] mt-1">{s.change}</p>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-text-light mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-[#FFD700]"/>Pending Approvals</h3>
                  <div className="space-y-2">
                    {ESCORTS_DATA.filter(e=>e.status==='pending').map((e,i)=>(
                      <div key={i} className="flex items-center gap-3 p-3 bg-dark-bg rounded-xl border border-color/50">
                        <div className="w-8 h-8 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-xs font-bold text-[#8B0000]">{e.name.charAt(0)}</div>
                        <div className="flex-1"><p className="text-xs font-semibold text-text-light">{e.name}</p><p className="text-[10px] text-text-muted">{e.city} · {e.tier}</p></div>
                        <div className="flex gap-1.5">
                          <button className="px-2.5 py-1 bg-[#28a745]/20 text-[#28a745] text-[10px] font-bold rounded-lg border border-[#28a745]/30">Approve</button>
                          <button className="px-2.5 py-1 bg-[#EF4444]/20 text-[#EF4444] text-[10px] font-bold rounded-lg border border-[#EF4444]/30">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
          {activeTab === 'Escorts' && (
            <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-color flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-light">All Escorts ({ESCORTS_DATA.length})</h3>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B0000] text-white text-xs font-bold rounded-xl"><Plus size={12}/>Add Escort</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-dark-bg border-b border-color">
                    <tr>{['Name','City','Tier','Status','Bookings','Earnings','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-semibold text-text-muted">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {ESCORTS_DATA.map((e,i)=>(
                      <tr key={i} className="border-b border-color/40 hover:bg-dark-bg transition-colors">
                        <td className="px-4 py-3 font-semibold text-text-light">{e.name}</td>
                        <td className="px-4 py-3 text-text-muted">{e.city}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{background:e.tier==='Elite'?'#8B000020':e.tier==='VIP'?'#FF450020':'#55555520',color:e.tier==='Elite'?'#8B0000':e.tier==='VIP'?'#FF4500':'#aaa'}}>{e.tier}</span></td>
                        <td className="px-4 py-3">{e.status==='active'?<span className="flex items-center gap-1 text-[#28a745]"><CheckCircle2 size={11}/>Active</span>:<span className="flex items-center gap-1 text-[#FFD700]"><AlertTriangle size={11}/>Pending</span>}</td>
                        <td className="px-4 py-3 text-text-muted">{e.bookings}</td>
                        <td className="px-4 py-3 text-[#FFD700] font-bold">KES {e.earnings.toLocaleString()}</td>
                        <td className="px-4 py-3"><div className="flex gap-1.5"><button className="p-1.5 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg"><Edit2 size={13}/></button><button className="p-1.5 text-[#EF4444] rounded-lg hover:bg-dark-bg"><Trash2 size={13}/></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CLIENTS ── */}
          {activeTab === 'Clients' && (
            <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-color"><h3 className="text-sm font-bold text-text-light">Registered Clients</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-dark-bg border-b border-color"><tr>{['Name','Email','City','Joined','Bookings','Total Spent','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-semibold text-text-muted">{h}</th>)}</tr></thead>
                  <tbody>
                    {CLIENTS_DATA.map((c,i)=>(
                      <tr key={i} className="border-b border-color/40 hover:bg-dark-bg transition-colors">
                        <td className="px-4 py-3 font-semibold text-text-light">{c.name}</td>
                        <td className="px-4 py-3 text-text-muted">{c.email}</td>
                        <td className="px-4 py-3 text-text-muted">{c.city}</td>
                        <td className="px-4 py-3 text-text-muted">{c.joined}</td>
                        <td className="px-4 py-3 text-text-muted">{c.bookings}</td>
                        <td className="px-4 py-3 text-[#FFD700] font-bold">KES {c.spent.toLocaleString()}</td>
                        <td className="px-4 py-3"><button className="p-1.5 text-[#EF4444] rounded-lg hover:bg-dark-bg"><XCircle size={13}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {activeTab === 'Bookings' && (
            <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-color"><h3 className="text-sm font-bold text-text-light">Recent Bookings</h3></div>
              <div className="divide-y divide-color/40">
                {BOOKINGS_DATA.map((b,i)=>(
                  <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="flex-1"><p className="text-xs font-semibold text-text-light">{b.client} → {b.escort}</p><p className="text-[10px] text-text-muted">{b.date} · {b.duration}</p></div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#FFD700]">KES {b.amount.toLocaleString()}</p>
                      <span className="text-[9px] font-semibold capitalize px-2 py-0.5 rounded-full" style={{color:(statusColor as any)[b.status],backgroundColor:(statusColor as any)[b.status]+'20'}}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MODERATORS ── */}
          {activeTab === 'Moderators' && (
            <div className="space-y-4">
              <div className="flex justify-end"><button onClick={()=>setShowAddMod(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#8B0000] text-white text-xs font-bold rounded-xl"><Plus size={13}/>Add Moderator</button></div>
              {showAddMod && (
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input value={newMod.name} onChange={e=>setNewMod(p=>({...p,name:e.target.value}))} placeholder="Full Name" className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]"/>
                    <input value={newMod.email} onChange={e=>setNewMod(p=>({...p,email:e.target.value}))} placeholder="Email" className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]"/>
                    <select value={newMod.role} onChange={e=>setNewMod(p=>({...p,role:e.target.value}))} className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none">
                      <option value="moderator">Moderator</option><option value="admin">Admin</option>
                    </select>
                    <select value={newMod.level} onChange={e=>setNewMod(p=>({...p,level:+e.target.value as 1|2|3}))} className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none">
                      <option value={1}>Level 1 – Basic</option><option value={2}>Level 2 – Advanced</option><option value={3}>Level 3 – Full</option>
                    </select>
                  </div>
                  <div className="flex gap-2"><button onClick={addMod} className="px-4 py-2 bg-[#28a745] text-white text-xs rounded-xl font-bold">Save</button><button onClick={()=>setShowAddMod(false)} className="px-4 py-2 border border-color text-text-muted text-xs rounded-xl">Cancel</button></div>
                </div>
              )}
              <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-dark-bg border-b border-color"><tr>{['Name','Email','Role','Level','Status','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-semibold text-text-muted">{h}</th>)}</tr></thead>
                  <tbody>
                    {mods.map(m=>(
                      <tr key={m.id} className="border-b border-color/40 hover:bg-dark-bg transition-colors">
                        <td className="px-4 py-3 font-semibold text-text-light">{m.name}</td>
                        <td className="px-4 py-3 text-text-muted">{m.email}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B0000]/20 text-[#8B0000]">{m.role}</span></td>
                        <td className="px-4 py-3 text-text-muted">Level {m.level}</td>
                        <td className="px-4 py-3"><button onClick={()=>setMods(p=>p.map(x=>x.id===m.id?{...x,status:x.status==='active'?'inactive':'active'}:x))} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${m.status==='active'?'bg-[#28a745]/20 text-[#28a745]':'bg-[#EF4444]/20 text-[#EF4444]'}`}>{m.status}</button></td>
                        <td className="px-4 py-3"><button onClick={()=>setMods(p=>p.filter(x=>x.id!==m.id))} className="p-1.5 text-[#EF4444] rounded-lg hover:bg-dark-bg"><Trash2 size={13}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

          {/* ── API KEYS ── */}
          {activeTab === 'API Keys' && (
            <div className="max-w-2xl space-y-6">
              <div className="flex items-start gap-3 p-4 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-2xl">
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
                  <ApiKeyField label="PayHero API Key" placeholder="Enter your PayHero API key" icon={Key} hint="Get this from your PayHero dashboard → Settings → API Keys" />
                  <ApiKeyField label="PayHero Secret" placeholder="Enter your PayHero secret" icon={Lock} />
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Paybill / Till Number</label>
                    <input defaultValue="" placeholder="e.g. 400200" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#28a745] transition-all"/>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Callback URL</label>
                    <input defaultValue="https://wet3camp.com/api/payments/payhero/callback" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#28a745] transition-all font-mono text-xs"/>
                    <p className="text-[10px] text-text-muted mt-1">Set this URL in your PayHero dashboard as the payment callback.</p>
                  </div>
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
                  <ApiKeyField label="Google Client ID" placeholder="xxxxxxxxxx.apps.googleusercontent.com" icon={Key} hint="Create OAuth 2.0 credentials in Google Cloud Console" />
                  <ApiKeyField label="Google Client Secret" placeholder="GOCSPX-xxxxxxxxxxxxxxx" icon={Lock} />
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
                  <ApiKeyField label="Facebook App ID" placeholder="123456789012345" icon={Key} hint="Create an app at Meta for Developers → Facebook Login product" />
                  <ApiKeyField label="Facebook App Secret" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" icon={Lock} />
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
                  <ApiKeyField label="Apple Team ID" placeholder="XXXXXXXXXX" icon={Key} />
                  <ApiKeyField label="Apple Key ID" placeholder="XXXXXXXXXX" icon={Key} hint="10-character key ID from Apple Developer Portal" />
                  <ApiKeyField label="Apple Private Key (.p8)" placeholder="-----BEGIN PRIVATE KEY-----..." icon={Lock} />
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

              {/* Telegram */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle size={16} className="text-[#229ED9]" />
                  <h3 className="text-sm font-bold text-text-light">Telegram Bot (Notifications)</h3>
                  <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-[#FFD700] hover:underline">@BotFather ↗</a>
                </div>
                <div className="space-y-4">
                  <ApiKeyField label="Telegram Bot Token" placeholder="1234567890:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" icon={Key} hint="Create a bot via @BotFather on Telegram" />
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Admin Chat ID</label>
                    <input defaultValue="" placeholder="e.g. -1001234567890" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#229ED9] transition-all"/>
                    <p className="text-[10px] text-text-muted mt-1">Your group chat ID for admin notifications (new registrations, featured requests, etc.)</p>
                  </div>
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
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">SMTP Host</label>
                      <input defaultValue="" placeholder="smtp.gmail.com" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#FF9800] transition-all"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Port</label>
                      <input type="number" defaultValue="587" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FF9800] transition-all"/>
                    </div>
                  </div>
                  <ApiKeyField label="SMTP Username" placeholder="noreply@wet3camp.com" icon={Mail} />
                  <ApiKeyField label="SMTP Password / App Password" placeholder="xxxx xxxx xxxx xxxx" icon={Lock} />
                </div>
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-black text-sm rounded-xl hover:from-[#a00000] hover:to-[#8B0000] transition-all flex items-center justify-center gap-2">
                <RefreshCw size={14} /> Test All Connections
              </button>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'Settings' && (
            <div className="max-w-xl space-y-5">
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4 flex items-center gap-2"><Settings size={14}/>Platform Settings</h3>
                <div className="space-y-4">
                  {[
                    ['Platform Name','Wet3 Camp'],
                    ['Tagline',"Kenya's #1 Premium Companion Platform"],
                    ['Support Email','support@wet3camp.com'],
                    ['Min Escort Rate (KES)','1500'],
                    ['Commission %','10'],
                    ['Max Photos Per Profile','12'],
                  ].map(([l,v])=>(
                    <div key={l}><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">{l}</label><input defaultValue={v} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all"/></div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <input type="checkbox" defaultChecked id="maintenance" className="w-3.5 h-3.5 accent-[#8B0000]"/>
                  <label htmlFor="maintenance" className="text-xs text-text-muted cursor-pointer">Require admin approval for new escort registrations</label>
                </div>
                <button className="mt-5 px-6 py-2.5 bg-[#8B0000] text-white text-xs font-bold rounded-xl hover:bg-[#a00000] transition-all flex items-center gap-2"><Save size={12}/>Save Settings</button>
              </div>
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4">Admin Credentials</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-bg border border-color rounded-xl p-3"><p className="text-[10px] text-text-muted mb-1">Email</p><p className="text-xs font-mono text-text-light">admin@wet3camp.com</p></div>
                  <div className="bg-dark-bg border border-color rounded-xl p-3"><p className="text-[10px] text-text-muted mb-1">Password</p><p className="text-xs font-mono text-[#FFD700]">••••••••••••••</p></div>
                </div>
                <p className="text-[10px] text-[#EF4444] mt-3 flex items-center gap-1"><Shield size={10}/>Keep credentials secure — never share admin access.</p>
              </div>
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4 flex items-center gap-2"><Star size={14} className="text-[#FFD700]"/>Platform Stats</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[['1,247','Total Escorts'],['8,432','Registered Clients'],['23,891','Total Bookings'],['KES 4.2M','Monthly Revenue'],['890+','Verified Profiles'],['12','Active Cities']].map(([v,l])=>(
                    <div key={l} className="bg-dark-bg border border-color rounded-xl p-3 text-center">
                      <p className="text-sm font-black text-[#FFD700]">{v}</p>
                      <p className="text-[9px] text-text-muted mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
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
