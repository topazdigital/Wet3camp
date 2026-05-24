import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useAuth, tryLogin } from '@/lib/auth-context'
import { Shield, Users, Calendar, BarChart2, Settings, Plus, Trash2, Edit2, CheckCircle2, XCircle, AlertTriangle, Lock, Mail, Eye, EyeOff, TrendingUp, DollarSign } from 'lucide-react'

const TABS = ['Overview','Escorts','Clients','Bookings','Moderators','Settings']

interface Moderator { id: number; name: string; email: string; role: string; level: 1|2|3; status: 'active'|'inactive'; createdAt: string }

const INIT_MODS: Moderator[] = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@wet3camp.com', role: 'admin',     level: 3, status: 'active', createdAt: '2024-01-15' },
  { id: 2, name: 'Mike Chen',     email: 'mike@wet3camp.com',  role: 'moderator', level: 2, status: 'active', createdAt: '2024-02-20' },
]

const ESCORTS_DATA = [
  { name: 'Amara K.',    city: 'Nairobi', tier: 'Elite',   status: 'active',  earnings: 184000, bookings: 23, verified: true  },
  { name: 'Zara M.',     city: 'Nairobi', tier: 'VIP',     status: 'active',  earnings: 142000, bookings: 18, verified: true  },
  { name: 'Wanjiku G.',  city: 'Mombasa', tier: 'Elite',   status: 'active',  earnings: 231000, bookings: 31, verified: true  },
  { name: 'Diana V.',    city: 'Nairobi', tier: 'Standard',status: 'pending', earnings: 0,      bookings: 0,  verified: false },
  { name: 'Faith C.',    city: 'Eldoret', tier: 'Standard',status: 'pending', earnings: 0,      bookings: 0,  verified: false },
]
const CLIENTS_DATA = [
  { name: 'John K.',  email: 'john@gmail.com',  city: 'Nairobi', joined: '2024-05-10', bookings: 12, spent: 96000 },
  { name: 'Mike O.',  email: 'mike@yahoo.com',  city: 'Nairobi', joined: '2024-04-22', bookings: 8,  spent: 64000 },
  { name: 'David L.', email: 'david@gmail.com', city: 'Mombasa', joined: '2024-06-01', bookings: 5,  spent: 40000 },
  { name: 'Paul M.',  email: 'paul@icloud.com', city: 'Kisumu',  joined: '2024-05-30', bookings: 3,  spent: 24000 },
]
const BOOKINGS_DATA = [
  { client: 'John K.',  escort: 'Amara K.',   date: 'Today 8PM',   duration: '2hrs',  amount: 16000, status: 'confirmed' },
  { client: 'Mike O.',  escort: 'Zara M.',    date: 'Tomorrow 6PM',duration: '1hr',   amount: 8000,  status: 'pending'   },
  { client: 'David L.', escort: 'Wanjiku G.', date: 'Sat 7PM',     duration: 'Overnight', amount: 60000, status: 'confirmed' },
  { client: 'Paul M.',  escort: 'Luna K.',    date: 'Last week',   duration: '3hrs',  amount: 15000, status: 'completed' },
]

function AdminLogin() {
  const [email, setEmail] = useState('admin@wet3camp.com')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!email || !password) { setError('Please fill all fields.'); return }
    setLoading(true)
    setTimeout(() => {
      const user = tryLogin(email, password)
      if (user?.role === 'admin') { login(user) }
      else { setError('Invalid admin credentials.') }
      setLoading(false)
    }, 800)
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
              {loading?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:null}
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
  const { logout } = useAuth()

  const addMod = () => {
    if (!newMod.name || !newMod.email) return
    setMods(p => [...p, { id: Date.now(), ...newMod, status: 'active', createdAt: new Date().toISOString().split('T')[0] }])
    setNewMod({ name:'', email:'', role:'moderator', level: 1 }); setShowAddMod(false)
  }

  const statusColor: Record<string,'#28a745'|'#FFD700'|'#6B7280'|'#EF4444'> = { confirmed: '#28a745', pending: '#FFD700', completed: '#6B7280', active: '#28a745', inactive: '#EF4444' }

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
              <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${activeTab===tab?'text-[#FFD700] border-[#FFD700]':'text-text-muted border-transparent hover:text-text-light'}`}>{tab}</button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">

          {activeTab === 'Overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Users,     label: 'Total Escorts', value: '1,247', change: '+23 this month', color: '#8B0000'  },
                  { icon: Users,     label: 'Active Clients', value: '8,432', change: '+156 this month', color: '#2196F3' },
                  { icon: Calendar,  label: 'Bookings Today', value: '89',    change: '+12% vs yesterday', color: '#28a745' },
                  { icon: DollarSign,label: 'Revenue (KES)',  value: '4.2M',  change: '+18% this month', color: '#FFD700'  },
                ].map(s=>{
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
                        <div className="w-full rounded-t-lg" style={{height:`${h}%`,background:`linear-gradient(to top,#8B0000,#E91E63)`,opacity:i===5?1:0.5}}/>
                        <span className="text-[8px] text-text-muted">{['M','T','W','T','F','S','S'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {activeTab === 'Moderators' && (
            <div className="space-y-4">
              <div className="flex justify-end"><button onClick={()=>setShowAddMod(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#8B0000] text-white text-xs font-bold rounded-xl"><Plus size={13}/>Add Moderator</button></div>
              {showAddMod && (
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input value={newMod.name} onChange={e=>setNewMod(p=>({...p,name:e.target.value}))} placeholder="Full Name" className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all"/>
                    <input value={newMod.email} onChange={e=>setNewMod(p=>({...p,email:e.target.value}))} placeholder="Email" className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all"/>
                    <select value={newMod.role} onChange={e=>setNewMod(p=>({...p,role:e.target.value}))} className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none">
                      <option value="moderator">Moderator</option><option value="admin">Admin</option>
                    </select>
                    <select value={newMod.level} onChange={e=>setNewMod(p=>({...p,level:+e.target.value as 1|2|3}))} className="px-3 py-2 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none">
                      <option value={1}>Level 1 - Basic</option><option value={2}>Level 2 - Advanced</option><option value={3}>Level 3 - Full</option>
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

          {activeTab === 'Settings' && (
            <div className="max-w-xl space-y-5">
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4 flex items-center gap-2"><Settings size={14}/>Platform Settings</h3>
                <div className="space-y-4">
                  {[['Platform Name','Wet3 Camp'],['Tagline','Kenya\'s #1 Premium Companion Platform'],['Support Email','support@wet3camp.com'],['Min Escort Rate (KES)','1500']].map(([l,v])=>(
                    <div key={l}><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">{l}</label><input defaultValue={v} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all"/></div>
                  ))}
                </div>
                <button className="mt-5 px-6 py-2.5 bg-[#8B0000] text-white text-xs font-bold rounded-xl hover:bg-[#a00000] transition-all">Save Settings</button>
              </div>
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4">Admin Credentials</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-bg border border-color rounded-xl p-3"><p className="text-[10px] text-text-muted mb-1">Email</p><p className="text-xs font-mono text-text-light">admin@wet3camp.com</p></div>
                  <div className="bg-dark-bg border border-color rounded-xl p-3"><p className="text-[10px] text-text-muted mb-1">Password</p><p className="text-xs font-mono text-[#FFD700]">••••••••••••••</p></div>
                </div>
                <p className="text-[10px] text-[#EF4444] mt-3 flex items-center gap-1"><Shield size={10}/>Keep these credentials secure and never share them.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <AdminLogin />
  return <AdminDashboard />
}
