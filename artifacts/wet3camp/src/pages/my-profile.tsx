import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'
import { ESCORTS } from '@/data/escorts'
import { Eye, Calendar, Star, TrendingUp, Edit3, Camera, CheckCircle2, MapPin, Clock, DollarSign, Users, Heart, MessageCircle, BarChart2, Shield, Zap, Crown, Smartphone, Instagram, Loader2, AlertCircle, UserCheck, Globe } from 'lucide-react'
import { Link } from 'wouter'
import { useFollow } from '@/lib/follow-context'
import { useSEO } from '@/lib/useSEO'

const TABS = ['Overview', 'Edit Profile', 'Gallery', 'Followers', 'Get Featured', 'Instagram Import', 'Subscription', 'Earnings']

export default function MyProfile() {
  useSEO({ title: 'My Profile — Dashboard', noIndex: true })
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Overview')
  const [available, setAvailable] = useState(true)
  const [editSaved, setEditSaved] = useState(false)

  // Instagram import state
  const [igHandle, setIgHandle] = useState('')
  const [igLoading, setIgLoading] = useState(false)
  const [igPosts, setIgPosts] = useState<{ id: string; img: string; selected: boolean }[]>([])
  const [igImported, setIgImported] = useState(false)
  const [igError, setIgError] = useState('')

  // M-Pesa subscription state
  const [subPhone, setSubPhone] = useState('')
  const [subPlan, setSubPlan] = useState<'monthly'|'quarterly'|'annual'>('monthly')
  const [subLoading, setSubLoading] = useState(false)
  const [subTxRef, setSubTxRef] = useState('')

  const myEscort = ESCORTS.find(e => e.id === user?.profileId) ?? ESCORTS[0]
  const { followerCount } = useFollow()

  // Edit Profile state
  const [editDob, setEditDob] = useState('')
  const [editBodyType, setEditBodyType] = useState(myEscort.bodyType || '')
  const [editEthnicity, setEditEthnicity] = useState(myEscort.ethnicity || '')
  const [editHair, setEditHair] = useState(myEscort.hairColor || '')
  const [editLangs, setEditLangs] = useState<string[]>(myEscort.languages || [])
  const [editWhatsapp, setEditWhatsapp] = useState('+254712345001')
  const [editTelegram, setEditTelegram] = useState('@amara_wet3camp')

  const BODY_TYPES  = ['Slim', 'Athletic', 'Curvy', 'Petite', 'BBW', 'Average', 'Muscular']
  const ETHNICITIES = ['Kenyan', 'African', 'Asian', 'Mixed Race', 'European', 'Middle Eastern', 'Latin', 'Other']
  const HAIR_COLORS = ['Black', 'Dark Brown', 'Brown', 'Auburn', 'Blonde', 'Red', 'Natural', 'Braids', 'Locs', 'Coloured / Dyed']
  const LANGUAGES   = ['English', 'Swahili', 'French', 'Arabic', 'Hindi', 'Luo', 'Kikuyu', 'Kalenjin', 'Kamba', 'German', 'Spanish', 'Italian', 'Somali', 'Oromo', 'Luganda']
  const toggleEditLang = (l: string) => setEditLangs(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l])
  const calcAge = (d: string) => { if (!d) return null; const b = new Date(d), t = new Date(); let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a }
  const editAge = calcAge(editDob)

  const stats = [
    { icon: Eye,           label: 'Profile Views',    value: '2,847',   change: '+12%',   color: '#2196F3' },
    { icon: Calendar,      label: 'Contacts This Mo', value: '23',      change: '+8%',    color: '#8B0000' },
    { icon: DollarSign,    label: 'Earnings (KES)',   value: '184,000', change: '+21%',   color: '#28a745' },
    { icon: Star,          label: 'Avg Rating',       value: '4.9',     change: '+0.1',   color: '#FFD700' },
    { icon: Heart,         label: 'Favourites',       value: '341',     change: '+45',    color: '#E91E63' },
    { icon: MessageCircle, label: 'Messages',         value: '17',      change: 'unread', color: '#9C27B0' },
  ]

  const recentBookings = [
    { client: 'John K.',  date: 'Today, 8:00 PM',    duration: '2hrs',      amount: 16000, status: 'confirmed' },
    { client: 'Mike O.',  date: 'Tomorrow, 6:00 PM', duration: '1hr',       amount: 8000,  status: 'pending'   },
    { client: 'David L.', date: 'Sat, 7:00 PM',      duration: 'Overnight', amount: 50000, status: 'confirmed' },
    { client: 'Paul M.',  date: 'Last week',          duration: '3hrs',      amount: 24000, status: 'completed' },
    { client: 'James K.', date: 'Last week',          duration: '1hr',       amount: 8000,  status: 'completed' },
  ]

  const statusColor = { confirmed: '#28a745', pending: '#FFD700', completed: '#6B7280' }

  const handleSave = () => { setEditSaved(true); setTimeout(() => setEditSaved(false), 2000) }

  const fetchInstagram = () => {
    setIgError('')
    if (!igHandle.trim()) { setIgError('Enter your Instagram username.'); return }
    setIgLoading(true)
    // Simulated fetch — replace with real Instagram Basic Display API when key is configured
    setTimeout(() => {
      setIgPosts([
        { id:'ig1', img:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', selected:false },
        { id:'ig2', img:'https://images.unsplash.com/photo-1536329583941-14287ec6fc4e?w=200&h=200&fit=crop', selected:false },
        { id:'ig3', img:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop', selected:false },
        { id:'ig4', img:'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop', selected:false },
        { id:'ig5', img:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', selected:false },
        { id:'ig6', img:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop', selected:false },
      ])
      setIgLoading(false)
    }, 1800)
  }

  const toggleIgPost = (id: string) => setIgPosts(p => p.map(post => post.id === id ? { ...post, selected: !post.selected } : post))

  const importSelected = () => {
    setIgImported(true)
    setTimeout(() => setIgImported(false), 3000)
  }

  const handleSubscribe = () => {
    const cleaned = subPhone.replace(/\s/g, '').replace(/^\+/, '')
    if (!cleaned || cleaned.length < 9) return
    setSubLoading(true)
    setTimeout(() => {
      setSubTxRef('SUB-' + Date.now().toString(36).toUpperCase())
      setSubLoading(false)
    }, 2000)
  }

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Banner */}
        <div className="relative h-40 bg-gradient-to-r from-[#8B0000] to-[#1a1a1a] overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${myEscort.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B0000]/80 to-black/60" />
          <div className="relative h-full flex items-end px-5 sm:px-8 pb-4">
            <div className="flex items-end gap-4 w-full">
              <div className="relative">
                <img src={myEscort.image} alt={myEscort.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-[#FFD700]/50 shadow-xl" />
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#8B0000] rounded-full flex items-center justify-center border border-dark-bg">
                  <Camera size={10} className="text-white" />
                </button>
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-black text-white">{myEscort.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin size={11} className="text-white/60" />
                  <span className="text-xs text-white/60">{myEscort.area}, {myEscort.city}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 uppercase">{myEscort.tier}</span>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => setAvailable(v => !v)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${available ? 'bg-[#28a745]/20 border border-[#28a745]/40 text-[#28a745]' : 'bg-black/40 border border-white/10 text-white/50'}`}>
                  <div className={`w-2 h-2 rounded-full ${available ? 'bg-[#28a745] animate-pulse' : 'bg-gray-500'}`} />
                  {available ? 'Available' : 'Unavailable'}
                </button>
                <Link href={`/profile/${myEscort.id}`} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl transition-all">
                  <Eye size={12} /> View Public
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-0 border-b border-color">
          {stats.map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="p-3 sm:p-4 border-r border-color last:border-r-0 sm:last:border-r-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} style={{ color: s.color }} />
                  <span className="text-[9px] text-text-muted uppercase tracking-widest truncate">{s.label}</span>
                </div>
                <p className="text-sm font-black text-text-light">{s.value}</p>
                <p className="text-[10px] text-[#28a745] mt-0.5">{s.change}</p>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 border-b border-color">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-shrink-0 px-4 py-3 text-xs font-semibold transition-all border-b-2 ${activeTab === tab ? 'text-[#FFD700] border-[#FFD700]' : 'text-text-muted border-transparent hover:text-text-light'}`}>{tab}</button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">

          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-color flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text-light">Recent Contacts</h3>
                    <span className="text-[10px] text-text-muted">Last 30 days</span>
                  </div>
                  <div className="divide-y divide-color/40">
                    {recentBookings.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-dark-bg flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">{b.client.charAt(0)}</div>
                        <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-text-light">{b.client}</p><p className="text-[10px] text-text-muted">{b.date} · {b.duration}</p></div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-[#FFD700]">KES {b.amount.toLocaleString()}</p>
                          <span className="text-[9px] font-semibold capitalize" style={{ color: (statusColor as any)[b.status] }}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-text-light">Earnings This Week</h3>
                    <span className="text-xs text-[#28a745] font-semibold">KES 46,000</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-24">
                    {[35,62,45,80,55,90,70].map((h,i)=>(
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-lg" style={{height:`${h}%`,background:'linear-gradient(to top,#8B0000,#E91E63)',opacity:i===5?1:0.5}}/>
                        <span className="text-[8px] text-text-muted">{['M','T','W','T','F','S','S'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-text-light mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    {[
                      { icon: Edit3,     label: 'Edit Bio',         tab: 'Edit Profile',     color: '#8B0000' },
                      { icon: Camera,    label: 'Add Photos',       tab: 'Gallery',          color: '#9C27B0' },
                      { icon: Crown,     label: 'Get Featured',     tab: 'Get Featured',     color: '#FFD700' },
                      { icon: Instagram, label: 'Import Instagram', tab: 'Instagram Import', color: '#E91E63' },
                      { icon: BarChart2, label: 'See Earnings',     tab: 'Earnings',         color: '#28a745' },
                    ].map(a => {
                      const Icon = a.icon
                      return (
                        <button key={a.label} onClick={() => setActiveTab(a.tab)} className="w-full flex items-center gap-3 px-3 py-2.5 bg-dark-bg hover:bg-dark-bg/80 border border-color/50 rounded-xl transition-all text-left">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: a.color + '20' }}>
                            <Icon size={13} style={{ color: a.color }} />
                          </div>
                          <span className="text-xs font-medium text-text-light">{a.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#8B0000]/20 to-[#FFD700]/5 border border-[#8B0000]/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2"><Zap size={14} className="text-[#FFD700]"/><span className="text-xs font-bold text-text-light">Profile Completion</span></div>
                  <div className="w-full h-2 bg-dark-bg rounded-full mb-2"><div className="h-full bg-gradient-to-r from-[#8B0000] to-[#FFD700] rounded-full" style={{width:'78%'}}/></div>
                  <p className="text-[10px] text-text-muted">78% — Add more photos to reach 100%</p>
                </div>
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2"><Users size={14} className="text-[#2196F3]"/><span className="text-xs font-bold text-text-light">Followers</span></div>
                  <p className="text-2xl font-black text-text-light">{followerCount(myEscort.id).toLocaleString()}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">+42 this week</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Edit Profile' && (
            <div className="max-w-2xl space-y-5">
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Display Name</label><input defaultValue={myEscort.name} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all"/></div>
                  <div><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Bio</label><textarea defaultValue={myEscort.bio} rows={4} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all resize-none"/></div>
                  {/* DOB & Age */}
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Calendar size={10}/> Date of Birth</label>
                    <input type="date" value={editDob} onChange={e=>setEditDob(e.target.value)} max={new Date(new Date().setFullYear(new Date().getFullYear()-18)).toISOString().split('T')[0]} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all [color-scheme:dark]"/>
                    {editAge !== null && <p className="text-[10px] text-[#28a745] mt-1 flex items-center gap-1"><CheckCircle2 size={9}/> Age: {editAge} years old</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Height</label>
                      <select defaultValue={myEscort.height} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all appearance-none">
                        {["4'10\"","4'11\"","5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"","6'0\"","6'1\"","6'2\"","6'3\""].map(h=><option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Body Type</label>
                      <select value={editBodyType} onChange={e=>setEditBodyType(e.target.value)} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all appearance-none">
                        <option value="">Select…</option>
                        {BODY_TYPES.map(b=><option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Ethnicity</label>
                      <select value={editEthnicity} onChange={e=>setEditEthnicity(e.target.value)} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all appearance-none">
                        <option value="">Select…</option>
                        {ETHNICITIES.map(e=><option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Hair Color</label>
                      <select value={editHair} onChange={e=>setEditHair(e.target.value)} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all appearance-none">
                        <option value="">Select…</option>
                        {HAIR_COLORS.map(h=><option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">City</label>
                      <input defaultValue={myEscort.city} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Area</label>
                      <input defaultValue={myEscort.area} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1" style={{color:'#25D366'}}>📱 WhatsApp</label>
                      <input value={editWhatsapp} onChange={e=>setEditWhatsapp(e.target.value)} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#25D366] transition-all"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1" style={{color:'#229ED9'}}>✈️ Telegram</label>
                      <input value={editTelegram} onChange={e=>setEditTelegram(e.target.value)} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#229ED9] transition-all"/>
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2 flex items-center gap-1"><Globe size={10}/> Languages <span className="text-[9px] normal-case">({editLangs.length} selected)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map(l => (
                        <button key={l} type="button" onClick={() => toggleEditLang(l)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${editLangs.includes(l) ? 'bg-[#8B0000] border-[#8B0000] text-white' : 'bg-dark-bg border-color text-text-muted hover:border-text-muted'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4">Pricing (KES)</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[['Per Hour', myEscort.pricing.hourly],['Overnight', myEscort.pricing.overnight],['Video Call', myEscort.pricing.video]].map(([l,v])=>(
                    <div key={l as string}><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">{l}</label><input type="number" defaultValue={v as number} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700] transition-all"/></div>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${editSaved?'bg-[#28a745] text-white':'bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white hover:from-[#a00000] hover:to-[#8B0000]'}`}>
                {editSaved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'Gallery' && (
            <div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                {myEscort.gallery.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-color group">
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="text-white text-xs font-bold">Remove</button>
                    </div>
                  </div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-color hover:border-[#8B0000] transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                  <Camera size={20} className="text-text-muted"/>
                  <span className="text-[10px] text-text-muted">Add Photo</span>
                  <input type="file" accept="image/*" multiple className="hidden"/>
                </label>
              </div>
              <p className="text-xs text-text-muted">Maximum 12 photos. Cover photo is always first.</p>
            </div>
          )}

          {activeTab === 'Followers' && (
            <div className="max-w-lg space-y-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-card-bg border border-color rounded-2xl p-4 text-center"><p className="text-2xl font-black text-text-light">{followerCount(myEscort.id).toLocaleString()}</p><p className="text-[10px] text-text-muted mt-0.5">Followers</p></div>
                <div className="bg-card-bg border border-color rounded-2xl p-4 text-center"><p className="text-2xl font-black text-text-light">143</p><p className="text-[10px] text-text-muted mt-0.5">Following</p></div>
                <div className="bg-card-bg border border-color rounded-2xl p-4 text-center"><p className="text-2xl font-black text-text-light">+42</p><p className="text-[10px] text-text-muted mt-0.5">This week</p></div>
              </div>
              <div className="bg-card-bg border border-color rounded-2xl p-4">
                <h3 className="text-sm font-bold text-text-light mb-3">Recent Followers</h3>
                <div className="space-y-3">
                  {['John K.','Mike O.','David L.','Sarah W.','Peter M.'].map((name,i) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-sm font-bold text-[#8B0000] flex-shrink-0">{name.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-text-light">{name}</p>
                        <p className="text-[10px] text-text-muted">{['2 min ago','1 hour ago','3 hours ago','Yesterday','2 days ago'][i]}</p>
                      </div>
                      <UserCheck size={13} className="text-[#28a745]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Get Featured' && (
            <div className="max-w-lg">
              <div className="text-center mb-6">
                <Crown size={36} className="text-[#FFD700] mx-auto mb-2" />
                <h2 className="text-lg font-black text-text-light">Featured Placement</h2>
                <p className="text-sm text-text-muted">Pay via M-Pesa and get placed at the top of search results and the homepage carousel.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { id:'basic', name:'3-Day Boost', price:500, duration:'3 days', color:'#6B7280', perks:['Top of search','Featured badge','2× visibility'] },
                  { id:'weekly', name:'Weekly Featured', price:1500, duration:'7 days', color:'#B8860B', perks:['Homepage carousel','5× visibility','"Featured" badge'], popular:true },
                  { id:'monthly', name:'Monthly Elite', price:4500, duration:'30 days', color:'#8B0000', perks:['Top position always','10× visibility','Analytics','Priority support'] },
                ].map(plan => (
                  <div key={plan.id} className={`relative bg-dark-bg border-2 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] ${plan.popular?'border-[#FFD700]':'border-color'}`}>
                    {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#FFD700] text-black text-[9px] font-black rounded-full">POPULAR</div>}
                    <p className="text-xs text-text-muted mb-1">{plan.name}</p>
                    <p className="text-xl font-black mb-0.5" style={{ color: plan.color }}>KES {plan.price.toLocaleString()}</p>
                    <p className="text-[10px] text-text-muted mb-3">for {plan.duration}</p>
                    {plan.perks.map(p => <div key={p} className="flex items-center gap-1.5 text-[10px] text-text-muted mb-1"><CheckCircle2 size={10} style={{color:plan.color}}/>{p}</div>)}
                  </div>
                ))}
              </div>
              <Link href="/featured-upgrade" className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-black text-sm rounded-xl hover:from-[#a00000] hover:to-[#8B0000] transition-all shadow-lg shadow-[#8B0000]/30">
                <Smartphone size={15} /> Choose a Plan & Pay with M-Pesa
              </Link>
            </div>
          )}

          {activeTab === 'Instagram Import' && (
            <div className="max-w-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
                  <Instagram size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-light">Import from Instagram</h2>
                  <p className="text-xs text-text-muted">Import your public photos directly to your gallery</p>
                </div>
              </div>

              {!igPosts.length ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Instagram Username</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                        <input value={igHandle} onChange={e=>setIgHandle(e.target.value)} placeholder="yourhandle" className="w-full pl-7 pr-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#E91E63] transition-all"/>
                      </div>
                      <button onClick={fetchInstagram} disabled={igLoading} className="px-4 py-2.5 bg-gradient-to-r from-[#f09433] to-[#bc1888] text-white text-xs font-bold rounded-xl disabled:opacity-60 flex items-center gap-1.5">
                        {igLoading ? <Loader2 size={13} className="animate-spin"/> : <Instagram size={13}/>}
                        {igLoading ? 'Fetching…' : 'Fetch Posts'}
                      </button>
                    </div>
                    {igError && <p className="text-xs text-[#EF4444] mt-1.5 flex items-center gap-1"><AlertCircle size={11}/>{igError}</p>}
                  </div>
                  <div className="p-4 bg-card-bg border border-color rounded-2xl">
                    <p className="text-xs font-bold text-text-light mb-2">How it works</p>
                    <div className="space-y-2">
                      {['Enter your public Instagram @handle','We fetch your most recent 12 posts','Select which photos to import','They appear in your gallery immediately'].map((s,i)=>(
                        <div key={s} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-[#E91E63]/20 flex items-center justify-center text-[9px] font-black text-[#E91E63] flex-shrink-0 mt-0.5">{i+1}</div>
                          <p className="text-xs text-text-muted">{s}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-text-muted mt-3 border-t border-color pt-2">Note: Instagram API key must be configured in Admin Panel → API Keys before this feature works live.</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-text-light">Posts from @{igHandle}</p>
                    <p className="text-[10px] text-text-muted">{igPosts.filter(p=>p.selected).length} selected</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {igPosts.map(post => (
                      <button key={post.id} onClick={() => toggleIgPost(post.id)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative ${post.selected?'border-[#28a745]':'border-transparent hover:border-color'}`}>
                        <img src={post.img} alt="" className="w-full h-full object-cover"/>
                        {post.selected && <div className="absolute inset-0 bg-[#28a745]/20 flex items-center justify-center"><CheckCircle2 size={20} className="text-[#28a745]" fill="#28a745"/></div>}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={importSelected} disabled={!igPosts.filter(p=>p.selected).length} className={`flex-1 py-3 font-bold text-sm rounded-xl transition-all disabled:opacity-40 ${igImported?'bg-[#28a745] text-white':'bg-[#8B0000] text-white hover:bg-[#a00000]'}`}>
                      {igImported?'✓ Imported to Gallery!':'Import Selected Photos'}
                    </button>
                    <button onClick={()=>{setIgPosts([]);setIgHandle('')}} className="px-4 py-3 border border-color text-text-muted text-sm rounded-xl hover:border-text-muted transition-all">Reset</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Subscription' && (
            <div className="max-w-md">
              <div className="text-center mb-6">
                <Smartphone size={32} className="text-[#28a745] mx-auto mb-2" />
                <h2 className="text-base font-bold text-text-light">Platform Subscription</h2>
                <p className="text-xs text-text-muted">Keep your profile active on Wet3 Camp. Pay monthly via M-Pesa.</p>
              </div>

              {!subTxRef ? (
                <div className="bg-card-bg border border-color rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2">Choose Plan</label>
                    <div className="space-y-2">
                      {[
                        { id:'monthly', label:'Monthly', price:'KES 500/month', desc:'Renews monthly' },
                        { id:'quarterly', label:'Quarterly', price:'KES 1,200/quarter', desc:'Save 20% vs monthly' },
                        { id:'annual', label:'Annual', price:'KES 4,000/year', desc:'Save 33% vs monthly' },
                      ].map(plan=>(
                        <label key={plan.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${subPlan===plan.id?'border-[#28a745] bg-[#28a745]/10':'border-color bg-dark-bg hover:border-text-muted'}`}>
                          <input type="radio" name="subPlan" value={plan.id} checked={subPlan===plan.id} onChange={()=>setSubPlan(plan.id as any)} className="accent-[#28a745]"/>
                          <div className="flex-1"><p className="text-xs font-bold text-text-light">{plan.label} — <span className="text-[#28a745]">{plan.price}</span></p><p className="text-[10px] text-text-muted">{plan.desc}</p></div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">M-Pesa Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">🇰🇪</span>
                      <input value={subPhone} onChange={e=>setSubPhone(e.target.value)} placeholder="0712 345 678" className="w-full pl-9 pr-3 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#28a745] transition-all"/>
                    </div>
                  </div>
                  <button onClick={handleSubscribe} disabled={subLoading||!subPhone} className="w-full py-3.5 bg-[#28a745] hover:bg-[#218838] text-white font-black text-sm rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {subLoading?<Loader2 size={15} className="animate-spin"/>:<Smartphone size={15}/>}
                    {subLoading?'Sending prompt…':'Pay via M-Pesa'}
                  </button>
                </div>
              ) : (
                <div className="bg-card-bg border border-[#28a745]/30 rounded-2xl p-6 text-center">
                  <CheckCircle2 size={40} className="text-[#28a745] mx-auto mb-3" fill="#28a745"/>
                  <h3 className="font-black text-text-light text-base mb-1">Payment Sent!</h3>
                  <p className="text-xs text-text-muted mb-4">Check your phone for the M-Pesa prompt and complete payment.</p>
                  <div className="bg-dark-bg border border-color rounded-xl p-3 text-left space-y-1.5 mb-4">
                    <div className="flex justify-between"><span className="text-[10px] text-text-muted">Reference</span><span className="text-[10px] font-mono text-[#FFD700]">{subTxRef}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-text-muted">Plan</span><span className="text-[10px] font-bold text-text-light capitalize">{subPlan}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-text-muted">Status</span><span className="text-[10px] font-bold text-[#FFD700]">⏳ Awaiting payment</span></div>
                  </div>
                  <button onClick={()=>setSubTxRef('')} className="text-xs text-text-muted hover:text-text-light transition-colors">← Try again</button>
                </div>
              )}

              <div className="mt-4 p-4 bg-card-bg border border-color rounded-2xl">
                <p className="text-[10px] text-text-muted font-bold mb-1.5">Current Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#28a745] rounded-full animate-pulse"/>
                  <span className="text-xs font-bold text-[#28a745]">Active — expires 30 June 2026</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Earnings' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'This Month', amount: 184000, contacts: 23 },
                { label: 'Last Month', amount: 152000, contacts: 19 },
                { label: 'Total',      amount: 1284000, contacts: 187 },
              ].map(e => (
                <div key={e.label} className="bg-card-bg border border-color rounded-2xl p-5">
                  <p className="text-xs text-text-muted mb-2">{e.label}</p>
                  <p className="text-2xl font-black text-[#FFD700]">KES {e.amount.toLocaleString()}</p>
                  <p className="text-xs text-text-muted mt-1">{e.contacts} contacts made</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
