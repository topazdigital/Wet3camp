import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'
import { ESCORTS } from '@/data/escorts'
import { Eye, Calendar, Star, TrendingUp, Edit3, Camera, Toggle, CheckCircle2, Phone, MapPin, Clock, DollarSign, Users, Heart, MessageCircle, BarChart2, Shield, Zap } from 'lucide-react'
import { Link } from 'wouter'

const TABS = ['Overview', 'Edit Profile', 'Gallery', 'Bookings', 'Earnings']

export default function MyProfile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Overview')
  const [available, setAvailable] = useState(true)
  const [editBio, setEditBio] = useState('')
  const [editSaved, setEditSaved] = useState(false)

  const myEscort = ESCORTS.find(e => e.id === user?.profileId) ?? ESCORTS[0]

  const stats = [
    { icon: Eye,           label: 'Profile Views',   value: '2,847',  change: '+12%', color: '#2196F3' },
    { icon: Calendar,      label: 'Bookings This Mo', value: '23',     change: '+8%',  color: '#8B0000' },
    { icon: DollarSign,    label: 'Revenue (KES)',    value: '184,000', change: '+21%', color: '#28a745' },
    { icon: Star,          label: 'Avg Rating',       value: '4.9',    change: '+0.1', color: '#FFD700' },
    { icon: Heart,         label: 'Favourites',       value: '341',    change: '+45',  color: '#E91E63' },
    { icon: MessageCircle, label: 'Messages',         value: '17',     change: 'unread', color: '#9C27B0' },
  ]

  const recentBookings = [
    { client: 'John K.',  date: 'Today, 8:00 PM',   duration: '2hrs',  amount: 16000, status: 'confirmed' },
    { client: 'Mike O.',  date: 'Tomorrow, 6:00 PM', duration: '1hr',   amount: 8000,  status: 'pending' },
    { client: 'David L.', date: 'Sat, 7:00 PM',     duration: 'Overnight', amount: 50000, status: 'confirmed' },
    { client: 'Paul M.',  date: 'Last week',         duration: '3hrs',  amount: 24000, status: 'completed' },
    { client: 'James K.', date: 'Last week',         duration: '1hr',   amount: 8000,  status: 'completed' },
  ]

  const statusColor = { confirmed: '#28a745', pending: '#FFD700', completed: '#6B7280' }

  const handleSaveBio = () => {
    setEditSaved(true)
    setTimeout(() => setEditSaved(false), 2000)
  }

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Hero / Profile Banner */}
        <div className="relative h-40 bg-gradient-to-r from-[#8B0000] to-[#1a1a1a] overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${myEscort.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B0000]/80 to-black/60" />
          <div className="relative h-full flex items-end px-5 sm:px-8 pb-4">
            <div className="flex items-end gap-4">
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
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Availability toggle */}
              <button
                onClick={() => setAvailable(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${available ? 'bg-[#28a745]/20 border border-[#28a745]/40 text-[#28a745]' : 'bg-black/40 border border-white/10 text-white/50'}`}
              >
                <div className={`w-2 h-2 rounded-full ${available ? 'bg-[#28a745] animate-pulse' : 'bg-gray-500'}`} />
                {available ? 'Available' : 'Unavailable'}
              </button>
              <Link href={`/profile/${myEscort.id}`} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl transition-all">
                <Eye size={12} /> View Public
              </Link>
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
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-4 py-3 text-xs font-semibold transition-all border-b-2 ${
                  activeTab === tab ? 'text-[#FFD700] border-[#FFD700]' : 'text-text-muted border-transparent hover:text-text-light'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">

          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: recent bookings */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-color flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text-light">Recent Bookings</h3>
                    <span className="text-[10px] text-text-muted">Last 30 days</span>
                  </div>
                  <div className="divide-y divide-color/40">
                    {recentBookings.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-dark-bg flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
                          {b.client.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-text-light">{b.client}</p>
                          <p className="text-[10px] text-text-muted">{b.date} · {b.duration}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-[#FFD700]">KES {b.amount.toLocaleString()}</p>
                          <span className="text-[9px] font-semibold capitalize" style={{ color: (statusColor as any)[b.status] }}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly chart placeholder */}
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-text-light">Earnings This Week</h3>
                    <span className="text-xs text-[#28a745] font-semibold">KES 46,000</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-24">
                    {[35, 62, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-lg" style={{ height: `${h}%`, background: `linear-gradient(to top, #8B0000, #E91E63)`, opacity: i === 5 ? 1 : 0.5 }} />
                        <span className="text-[8px] text-text-muted">{['M','T','W','T','F','S','S'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: quick actions + profile tips */}
              <div className="space-y-4">
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-text-light mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    {[
                      { icon: Edit3,    label: 'Edit Bio',         tab: 'Edit Profile', color: '#8B0000' },
                      { icon: Camera,   label: 'Add Photos',       tab: 'Gallery',      color: '#9C27B0' },
                      { icon: Calendar, label: 'View Bookings',    tab: 'Bookings',     color: '#2196F3' },
                      { icon: BarChart2,label: 'See Earnings',     tab: 'Earnings',     color: '#28a745' },
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
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-[#FFD700]" />
                    <span className="text-xs font-bold text-text-light">Profile Completion</span>
                  </div>
                  <div className="w-full h-2 bg-dark-bg rounded-full mb-2">
                    <div className="h-full bg-gradient-to-r from-[#8B0000] to-[#FFD700] rounded-full" style={{ width: '78%' }} />
                  </div>
                  <p className="text-[10px] text-text-muted">78% — Add more photos to reach 100%</p>
                </div>

                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className="text-[#28a745]" />
                    <span className="text-xs font-bold text-text-light">Verification Status</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-[#28a745]/10 border border-[#28a745]/20 rounded-xl">
                    <CheckCircle2 size={14} className="text-[#28a745]" fill="#28a745" />
                    <span className="text-xs font-semibold text-[#28a745]">ID Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Edit Profile' && (
            <div className="max-w-2xl space-y-5">
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Display Name</label>
                    <input defaultValue={myEscort.name} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Bio</label>
                    <textarea
                      defaultValue={myEscort.bio}
                      onChange={e => setEditBio(e.target.value)}
                      rows={4}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Age</label>
                      <input type="number" defaultValue={myEscort.age} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Height</label>
                      <input defaultValue={myEscort.height} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">City</label>
                      <input defaultValue={myEscort.city} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Area</label>
                      <input defaultValue={myEscort.area} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4">Pricing (KES)</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[['Per Hour', myEscort.pricing.hourly],['Overnight', myEscort.pricing.overnight],['Video Call', myEscort.pricing.video]].map(([l, v]) => (
                    <div key={l as string}>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">{l}</label>
                      <input type="number" defaultValue={v as number} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700] transition-all" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4">Services</h3>
                <div className="space-y-2">
                  {myEscort.services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-dark-bg rounded-xl border border-color/50">
                      <span className="text-xs font-medium text-text-light">{s.name}</span>
                      <button
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${s.available ? 'bg-[#28a745]/20 text-[#28a745] border border-[#28a745]/30' : 'bg-dark-bg text-text-muted border border-color'}`}
                      >
                        {s.available ? 'On' : 'Off'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleSaveBio} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${editSaved ? 'bg-[#28a745] text-white' : 'bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white hover:from-[#a00000] hover:to-[#8B0000]'}`}>
                {editSaved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'Gallery' && (
            <div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                {myEscort.gallery.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-color group">
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="text-white text-xs font-bold">Remove</button>
                    </div>
                  </div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-color hover:border-[#8B0000] transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                  <Camera size={20} className="text-text-muted" />
                  <span className="text-[10px] text-text-muted">Add Photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" />
                </label>
              </div>
              <p className="text-xs text-text-muted">Maximum 12 photos. Cover photo is always first.</p>
            </div>
          )}

          {activeTab === 'Bookings' && (
            <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-color">
                <h3 className="text-sm font-bold text-text-light">All Bookings</h3>
              </div>
              <div className="divide-y divide-color/40">
                {recentBookings.map((b, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <div className="w-10 h-10 rounded-full bg-dark-bg flex items-center justify-center text-sm font-bold text-text-muted flex-shrink-0">{b.client.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-light">{b.client}</p>
                      <p className="text-xs text-text-muted">{b.date} · {b.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#FFD700]">KES {b.amount.toLocaleString()}</p>
                      <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full" style={{ color: (statusColor as any)[b.status], backgroundColor: (statusColor as any)[b.status] + '20' }}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Earnings' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'This Month', amount: 184000, bookings: 23 },
                { label: 'Last Month', amount: 152000, bookings: 19 },
                { label: 'Total',      amount: 1284000, bookings: 187 },
              ].map(e => (
                <div key={e.label} className="bg-card-bg border border-color rounded-2xl p-5">
                  <p className="text-xs text-text-muted mb-2">{e.label}</p>
                  <p className="text-2xl font-black text-[#FFD700]">KES {e.amount.toLocaleString()}</p>
                  <p className="text-xs text-text-muted mt-1">{e.bookings} bookings</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
