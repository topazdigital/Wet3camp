import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Eye, Calendar, Star, Edit3, Camera, CheckCircle2, XCircle, MapPin, DollarSign, Users, Heart, MessageCircle, BarChart2, Zap, Crown, Smartphone, Instagram, Loader2, AlertCircle, UserCheck, Globe } from 'lucide-react'
import { Link } from 'wouter'
import { useFollow } from '@/lib/follow-context'
import { useSEO } from '@/lib/useSEO'

const TABS = ['Overview', 'My Bookings', 'My Rooms', 'Edit Profile', 'Gallery', 'Followers', 'Get Featured', 'Instagram Import', 'Subscription', 'Earnings']

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=face'

export default function MyProfile() {
  useSEO({ title: 'My Profile — Dashboard', noIndex: true })
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Overview')
  const [editSaved, setEditSaved] = useState(false)

  // Real escort profile loaded from API
  const [escortProfile, setEscortProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Real bookings loaded from API
  const [recentBookings, setRecentBookings] = useState<any[]>([])

  useEffect(() => {
    if (user?.role !== 'escort') { setProfileLoading(false); return }
    api.profile.getEscort()
      .then(data => {
        setEscortProfile(data)
        setAvailable(!!data.available)
        setEditBodyType(data.body_type || '')
        setEditEthnicity(data.ethnicity || '')
        setEditHair(data.hair_color || '')
        setEditLangs(Array.isArray(data.languages) ? data.languages : [])
        setEditWhatsapp(data.whatsapp || '')
        setEditTelegram(data.telegram || '')
        setEditBio(data.bio || '')
        setEditCity(data.city || '')
        setEditArea(data.area || '')
        setEditHeight(data.height || '')
        setEditHourly(data.price_hourly ? String(data.price_hourly) : '')
        setEditOvernight(data.price_overnight ? String(data.price_overnight) : '')
        setEditVideo(data.price_video ? String(data.price_video) : '')
        setEditIncall(data.price_incall ? String(data.price_incall) : '')
        setEditOutcall(data.price_outcall ? String(data.price_outcall) : '')
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
    api.bookings.list()
      .then(data => setRecentBookings(data.slice(0, 5)))
      .catch(() => {})
    api.profile.getEarnings()
      .then(data => setEarnings(data))
      .catch(() => {})
    api.profile.getFollowers()
      .then(data => setFollowersData(data))
      .catch(() => {})
    api.profile.getSubscription()
      .then(data => setSubscription(data))
      .catch(() => {})
  }, [user?.role])

  const [available, setAvailable] = useState(false)
  const toggleAvailable = async () => {
    const next = !available
    setAvailable(next)
    try { await api.profile.updateEscort({ available: next }) } catch {}
  }

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

  const { followerCount } = useFollow()

  // Edit Profile controlled state (all populated from API on load)
  const [editDob, setEditDob] = useState('')
  const [editBodyType, setEditBodyType] = useState('')
  const [editEthnicity, setEditEthnicity] = useState('')
  const [editHair, setEditHair] = useState('')
  const [editLangs, setEditLangs] = useState<string[]>([])
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [editTelegram, setEditTelegram] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editArea, setEditArea] = useState('')
  const [editHeight, setEditHeight] = useState('')
  const [editHourly, setEditHourly] = useState('')
  const [editOvernight, setEditOvernight] = useState('')
  const [editVideo, setEditVideo] = useState('')
  const [editIncall, setEditIncall] = useState('')
  const [editOutcall, setEditOutcall] = useState('')
  const [editSaveError, setEditSaveError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Real earnings from API
  const [earnings, setEarnings] = useState<any>(null)
  // Real followers from API
  const [followersData, setFollowersData] = useState<any>(null)
  // Real subscription from API
  const [subscription, setSubscription] = useState<any>(null)

  // Incoming bookings (escort side)
  const [incomingBookings, setIncomingBookings]     = useState<any[]>([])
  const [incomingLoading, setIncomingLoading]       = useState(false)
  const [bookingStatusLoading, setBookingStatusLoading] = useState<string | null>(null)

  const fetchIncoming = async () => {
    setIncomingLoading(true)
    try { const data = await api.bookings.incoming(); setIncomingBookings(data) } catch {}
    setIncomingLoading(false)
  }

  const updateBookingStatus = async (id: string | number, status: 'confirmed' | 'cancelled' | 'completed') => {
    setBookingStatusLoading(String(id))
    try {
      await api.bookings.updateStatus(id, status)
      setIncomingBookings(prev => prev.map(b => String(b.id) === String(id) ? { ...b, status } : b))
    } catch {}
    setBookingStatusLoading(null)
  }

  // Add Room form state
  const [roomForm, setRoomForm] = useState({ name: '', hotel: '', city: 'Nairobi', area: '', type: 'Standard', price_night: '', price_hourly: '', amenities: [] as string[] })
  const [roomSaving, setRoomSaving] = useState(false)
  const [roomSaved, setRoomSaved] = useState(false)
  const [roomError, setRoomError] = useState('')

  const ROOM_AMENITIES = ['WiFi', 'AC', 'TV', 'En-suite', 'Room Service', 'Parking', 'Hot Shower', 'CCTV', 'Private Entrance', 'Mini Bar']
  const toggleRoomAmenity = (a: string) => setRoomForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }))

  const handleAddRoom = async () => {
    if (!roomForm.name || !roomForm.hotel || !roomForm.city || !roomForm.price_night) { setRoomError('Name, hotel, city and price per night are required.'); return }
    setRoomSaving(true); setRoomError('')
    try {
      await api.rooms.add({
        name: roomForm.name, hotel: roomForm.hotel, city: roomForm.city, area: roomForm.area,
        type: roomForm.type, price_night: Number(roomForm.price_night), price_hourly: roomForm.price_hourly ? Number(roomForm.price_hourly) : undefined,
        amenities: roomForm.amenities,
      })
      setRoomSaved(true)
      setRoomForm({ name: '', hotel: '', city: 'Nairobi', area: '', type: 'Standard', price_night: '', price_hourly: '', amenities: [] })
      setTimeout(() => setRoomSaved(false), 4000)
    } catch (err: any) {
      setRoomError(err?.message ?? 'Failed to add room. Please try again.')
    }
    setRoomSaving(false)
  }

  // Photo upload state
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [galleryError, setGalleryError] = useState('')
  const [gallery, setGallery] = useState<string[]>([])

  // Load gallery when escort profile loads
  useEffect(() => {
    if (escortProfile?.gallery) setGallery(escortProfile.gallery)
  }, [escortProfile?.gallery])

  // Compress + resize image client-side before upload (reduces payload from 5-15MB to <2MB)
  const compressImage = (file: File, maxDim = 1500, quality = 0.82): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = () => {
        const img = new Image()
        img.onerror = reject
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1))
          const w = Math.round(img.width * scale)
          const h = Math.round(img.height * scale)
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) { resolve(reader.result as string); return }
          ctx.drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const data = await compressImage(file, 800, 0.88)
      const res = await api.upload.photo(data, 'avatar', file.name)
      setEscortProfile((p: any) => ({ ...p, image: res.url }))
    } catch (err: any) {
      console.error('[avatar upload]', err?.message ?? err)
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  const tierPhotoLimit = (() => {
    const t = (escortProfile?.tier ?? 'standard').toLowerCase()
    if (t === 'elite')   return 30
    if (t === 'vip')     return 20
    if (t === 'premium') return 15
    return 10
  })()

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (gallery.length + files.length > tierPhotoLimit) {
      setGalleryError(`Maximum ${tierPhotoLimit} photos allowed for your ${escortProfile?.tier ?? 'Standard'} tier.`); return
    }
    setGalleryError(''); setGalleryUploading(true)
    let uploaded = 0
    try {
      for (const file of files) {
        const data = await compressImage(file, 1500, 0.82)
        const res = await api.upload.photo(data, 'gallery', file.name)
        if (res?.url) { setGallery(g => [...g, res.url]); uploaded++ }
      }
      if (uploaded === 0) setGalleryError('No photos were uploaded. Please try again.')
    } catch (err: any) {
      setGalleryError(err?.message ?? 'Upload failed. Please try a smaller photo or check your connection.')
    } finally {
      setGalleryUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveGalleryPhoto = async (url: string) => {
    setGallery(g => g.filter(u => u !== url))
    try { await api.upload.removeGallery(url) } catch {}
  }

  const BODY_TYPES  = ['Slim', 'Athletic', 'Curvy', 'Petite', 'BBW', 'Average', 'Muscular']
  const ETHNICITIES = ['Kenyan', 'African', 'Asian', 'Mixed Race', 'European', 'Middle Eastern', 'Latin', 'Other']
  const HAIR_COLORS = ['Black', 'Dark Brown', 'Brown', 'Auburn', 'Blonde', 'Red', 'Natural', 'Braids', 'Locs', 'Coloured / Dyed']
  const LANGUAGES   = ['English', 'Swahili', 'French', 'Arabic', 'Hindi', 'Luo', 'Kikuyu', 'Kalenjin', 'Kamba', 'German', 'Spanish', 'Italian', 'Somali', 'Oromo', 'Luganda']
  const toggleEditLang = (l: string) => setEditLangs(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l])
  const calcAge = (d: string) => { if (!d) return null; const b = new Date(d), t = new Date(); let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a }
  const editAge = calcAge(editDob)

  const stats = [
    { icon: Eye,           label: 'Profile Views',    value: escortProfile?.views_count ? escortProfile.views_count.toLocaleString() : '—',  change: '',      color: '#2196F3' },
    { icon: Calendar,      label: 'Contacts This Mo', value: '—',      change: '',      color: '#8B0000' },
    { icon: DollarSign,    label: 'Rating',           value: escortProfile?.rating ? String(escortProfile.rating) : '—', change: '', color: '#28a745' },
    { icon: Star,          label: 'Reviews',          value: escortProfile?.reviews_count ? String(escortProfile.reviews_count) : '0', change: '', color: '#FFD700' },
    { icon: Heart,         label: 'Favourites',       value: '—',      change: '',      color: '#E91E63' },
    { icon: MessageCircle, label: 'Messages',         value: '—',      change: '',      color: '#9C27B0' },
  ]

  const statusColor = { confirmed: '#28a745', pending: '#FFD700', completed: '#6B7280', cancelled: '#EF4444' }

  const handleSave = async () => {
    setEditSaveError(''); setEditSaving(true)
    try {
      await api.profile.updateEscort({
        bio:          editBio,
        city:         editCity,
        area:         editArea,
        whatsapp:     editWhatsapp,
        telegram:     editTelegram,
        bodyType:     editBodyType,
        ethnicity:    editEthnicity,
        hairColor:    editHair,
        height:       editHeight,
        languages:    editLangs,
        rateHourly:   editHourly   ? parseInt(editHourly)   : undefined,
        rateOvernight:editOvernight ? parseInt(editOvernight) : undefined,
        rateVideo:    editVideo    ? parseInt(editVideo)    : undefined,
        rateIncall:   editIncall   ? parseInt(editIncall)   : undefined,
        rateOutcall:  editOutcall  ? parseInt(editOutcall)  : undefined,
      })
      setEditSaved(true); setTimeout(() => setEditSaved(false), 3000)
    } catch (err: any) {
      setEditSaveError(err.message ?? 'Failed to save. Please try again.')
    } finally {
      setEditSaving(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'My Bookings' && user?.role === 'escort') fetchIncoming()
  }, [activeTab])

  const fetchInstagram = () => {
    setIgError('Instagram import requires the Instagram Basic Display API to be configured. Please contact the admin to enable it.')
  }

  const toggleIgPost = (id: string) => setIgPosts(p => p.map(post => post.id === id ? { ...post, selected: !post.selected } : post))

  const importSelected = () => {
    setIgImported(true)
    setTimeout(() => setIgImported(false), 3000)
  }

  const [subError, setSubError] = useState('')

  const handleSubscribe = async () => {
    const cleaned = subPhone.replace(/\s/g, '').replace(/^\+/, '')
    if (!cleaned || cleaned.length < 9) { setSubError('Enter a valid M-Pesa phone number.'); return }
    setSubError(''); setSubLoading(true)
    try {
      const res = await api.profile.subscribe(subPlan, cleaned)
      setSubTxRef(res.txRef)
      setSubscription({ active: false, plan: res.plan, expiresAt: res.expiresAt, status: 'pending' })
    } catch (err: any) {
      setSubError(err?.message ?? 'Failed to initiate subscription. Please try again.')
    } finally {
      setSubLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Banner */}
        <div className="relative h-40 bg-gradient-to-r from-[#8B0000] to-[#1a1a1a] overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${escortProfile?.image || PLACEHOLDER_IMG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B0000]/80 to-black/60" />
          <div className="relative h-full flex items-end px-5 sm:px-8 pb-4">
            <div className="flex items-end gap-4 w-full">
              <div className="relative">
                <img src={escortProfile?.image || PLACEHOLDER_IMG} alt={escortProfile?.name || user?.name || 'Profile'} className="w-20 h-20 rounded-2xl object-cover border-2 border-[#FFD700]/50 shadow-xl" />
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#8B0000] rounded-full flex items-center justify-center border border-dark-bg cursor-pointer" title="Change profile photo">
                  {avatarUploading ? <Loader2 size={10} className="text-white animate-spin" /> : <Camera size={10} className="text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                </label>
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-black text-white">{escortProfile?.name || user?.name || 'My Profile'}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin size={11} className="text-white/60" />
                  <span className="text-xs text-white/60">{escortProfile?.area || '—'}, {escortProfile?.city || '—'}</span>
                  {escortProfile?.tier && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 uppercase">{escortProfile.tier}</span>}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={toggleAvailable} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${available ? 'bg-[#28a745]/20 border border-[#28a745]/40 text-[#28a745]' : 'bg-black/40 border border-white/10 text-white/50'}`}>
                  <div className={`w-2 h-2 rounded-full ${available ? 'bg-[#28a745] animate-pulse' : 'bg-gray-500'}`} />
                  {available ? 'Available' : 'Unavailable'}
                </button>
                {escortProfile?.id && (
                  <Link href={`/profile/${escortProfile.id}`} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl transition-all">
                    <Eye size={12} /> View Profile
                  </Link>
                )}
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

        {/* Tabs — escort-only tabs hidden for clients */}
        <div className="px-4 sm:px-6 border-b border-color">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.filter(tab => {
              const escortOnly = ['My Bookings', 'Gallery', 'Followers', 'Get Featured', 'Instagram Import', 'Subscription', 'Earnings']
              if (user?.role !== 'escort' && escortOnly.includes(tab)) return false
              return true
            }).map(tab => (
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
                    {recentBookings.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-text-muted">No bookings yet</div>
                    ) : recentBookings.map((b: any, i: number) => {
                      const clientName = b.client_name || b.client || b.user_name || 'Client'
                      const bookingDate = b.date || b.booking_date || b.scheduled_at || '—'
                      const status = b.status || 'pending'
                      const amount = b.price || b.amount || b.total || 0
                      return (
                        <div key={b.id || i} className="flex items-center gap-3 px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-dark-bg flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">{clientName.charAt(0).toUpperCase()}</div>
                          <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-text-light">{clientName}</p><p className="text-[10px] text-text-muted">{typeof bookingDate === 'string' ? bookingDate.slice(0,16).replace('T',' ') : bookingDate}</p></div>
                          <div className="text-right flex-shrink-0">
                            {amount > 0 && <p className="text-xs font-bold text-[#FFD700]">KES {Number(amount).toLocaleString()}</p>}
                            <span className="text-[9px] font-semibold capitalize" style={{ color: (statusColor as any)[status] || '#9CA3AF' }}>{status}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-text-light">Earnings This Week</h3>
                    <span className="text-xs text-[#28a745] font-semibold">{earnings ? `KES ${Number(earnings.weeklyTotal).toLocaleString()}` : '—'}</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-24">
                    {(earnings?.weeklyChart ?? [0,0,0,0,0,0,0]).map((v: number, i: number)=>{
                      const maxVal = Math.max(...(earnings?.weeklyChart ?? [1]), 1)
                      const pct = Math.max(4, Math.round((v / maxVal) * 100))
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-lg" style={{height:`${pct}%`,background:'linear-gradient(to top,#8B0000,#E91E63)',opacity:v>0?1:0.2}}/>
                          <span className="text-[8px] text-text-muted">{['M','T','W','T','F','S','S'][i]}</span>
                        </div>
                      )
                    })}
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
                  {(() => {
                    const p = escortProfile
                    let pct = 0
                    if (p?.bio && p.bio.length > 10) pct += 20
                    if (p?.city && p?.area) pct += 10
                    if (gallery.length > 0) pct += 30
                    if (p?.whatsapp || p?.telegram) pct += 20
                    if (p?.languages?.length > 0) pct += 10
                    if (p?.services?.length > 0) pct += 10
                    const hint = pct < 100 ? (gallery.length === 0 ? 'Add photos to boost visibility' : pct < 70 ? 'Fill in your bio and contacts' : 'Add services to reach 100%') : 'Profile complete!'
                    return (<>
                      <div className="w-full h-2 bg-dark-bg rounded-full mb-2"><div className="h-full bg-gradient-to-r from-[#8B0000] to-[#FFD700] rounded-full transition-all" style={{width:`${pct}%`}}/></div>
                      <p className="text-[10px] text-text-muted">{pct}% — {hint}</p>
                    </>)
                  })()}
                </div>
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2"><Users size={14} className="text-[#2196F3]"/><span className="text-xs font-bold text-text-light">Followers</span></div>
                  <p className="text-2xl font-black text-text-light">{followersData ? Number(followersData.total).toLocaleString() : followerCount(escortProfile?.id || '').toLocaleString()}</p>
                  {followersData?.thisWeek > 0 && <p className="text-[10px] text-[#28a745] mt-0.5">+{followersData.thisWeek} this week</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── MY BOOKINGS (escort side) ───────────────────────────────── */}
          {activeTab === 'My Bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-light flex items-center gap-2"><Calendar size={14} className="text-[#8B0000]"/>Incoming Bookings</h2>
                <button
                  onClick={fetchIncoming}
                  disabled={incomingLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-bg border border-color rounded-xl text-xs text-text-muted hover:text-text-light transition-all disabled:opacity-50"
                >
                  {incomingLoading ? <Loader2 size={11} className="animate-spin"/> : <MessageCircle size={11}/>}
                  {incomingLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>

              {incomingLoading && incomingBookings.length === 0 && (
                <div className="flex items-center justify-center py-16 gap-2 text-text-muted">
                  <Loader2 size={16} className="animate-spin"/><span className="text-sm">Loading bookings…</span>
                </div>
              )}

              {!incomingLoading && incomingBookings.length === 0 && (
                <div className="text-center py-16">
                  <Calendar size={36} className="mx-auto text-text-muted mb-3"/>
                  <p className="text-sm font-semibold text-text-light mb-1">No bookings yet</p>
                  <p className="text-xs text-text-muted">When clients book you, their requests will appear here.</p>
                  <button onClick={fetchIncoming} className="mt-4 px-4 py-2 bg-[#8B0000]/20 border border-[#8B0000]/30 text-[#8B0000] text-xs font-bold rounded-xl hover:bg-[#8B0000]/30 transition-colors">
                    Check Now
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {incomingBookings.map(b => {
                  const sc: Record<string, string> = { pending: '#FFD700', confirmed: '#28a745', completed: '#6B7280', cancelled: '#EF4444' }
                  const sColor = sc[b.status] ?? '#9CA3AF'
                  const isLoading = bookingStatusLoading === String(b.id)
                  return (
                    <div key={b.id} className="bg-card-bg border border-color rounded-xl p-4 hover:border-[#8B0000]/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-xs font-bold text-[#8B0000] flex-shrink-0">
                              {(b.clientName || 'C').charAt(0).toUpperCase()}
                            </div>
                            <p className="text-sm font-semibold text-text-light">{b.clientName || 'Client'}</p>
                          </div>
                          <div className="space-y-0.5 pl-9">
                            <p className="text-xs text-text-muted">
                              📅 {typeof b.date === 'string' ? b.date.slice(0, 10) : b.date}
                              {b.time && ` at ${b.time}`}
                              {b.duration && ` · ${b.duration}hr`}
                              {b.type && ` · ${b.type}`}
                            </p>
                            {b.location && <p className="text-xs text-text-muted">📍 {b.location}</p>}
                            {b.notes && <p className="text-xs text-text-muted italic">"{b.notes}"</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-[#FFD700]">KES {Number(b.amount || 0).toLocaleString()}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ color: sColor, background: sColor + '20' }}>{b.status}</span>
                        </div>
                      </div>

                      {b.status === 'pending' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-color/40">
                          <button
                            onClick={() => updateBookingStatus(b.id, 'confirmed')}
                            disabled={isLoading}
                            className="flex-1 py-2 bg-[#28a745]/20 border border-[#28a745]/30 text-[#28a745] text-xs font-bold rounded-xl hover:bg-[#28a745]/30 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 size={11} className="animate-spin"/> : <CheckCircle2 size={11}/>}
                            Accept Booking
                          </button>
                          <button
                            onClick={() => updateBookingStatus(b.id, 'cancelled')}
                            disabled={isLoading}
                            className="flex-1 py-2 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-bold rounded-xl hover:bg-[#EF4444]/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 size={11} className="animate-spin"/> : <XCircle size={11}/>}
                            Decline
                          </button>
                        </div>
                      )}
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => updateBookingStatus(b.id, 'completed')}
                          disabled={isLoading}
                          className="mt-3 w-full py-2 bg-[#6B7280]/10 border border-[#6B7280]/20 text-[#9CA3AF] text-xs font-bold rounded-xl hover:bg-[#6B7280]/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 size={11} className="animate-spin"/> : <CheckCircle2 size={11}/>}
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── MY ROOMS ─────────────────────────────────────────────────── */}
          {activeTab === 'My Rooms' && (
            <div className="max-w-xl space-y-5">
              {roomSaved && (
                <div className="flex items-center gap-2 p-4 bg-[#28a745]/10 border border-[#28a745]/30 rounded-2xl">
                  <CheckCircle2 size={16} className="text-[#28a745]"/>
                  <div>
                    <p className="text-xs font-bold text-[#28a745]">Room listed successfully!</p>
                    <p className="text-[10px] text-text-muted">Your room is now live on the Rooms page and clients can book it.</p>
                  </div>
                </div>
              )}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4 flex items-center gap-2"><MapPin size={14} className="text-[#8B0000]"/>Add a Room Listing</h3>
                <p className="text-[11px] text-text-muted mb-4">List a hotel room or private space on the Rooms page. Clients can browse and book it directly.</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Room Name *</label>
                      <input value={roomForm.name} onChange={e => setRoomForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Deluxe Suite 201" className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#8B0000] transition-all"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Hotel / Building *</label>
                      <input value={roomForm.hotel} onChange={e => setRoomForm(f => ({...f, hotel: e.target.value}))} placeholder="e.g. Sarova Stanley" className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#8B0000] transition-all"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">City *</label>
                      <select value={roomForm.city} onChange={e => setRoomForm(f => ({...f, city: e.target.value}))} className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all">
                        {['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Malindi','Thika','Nyeri'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Area / Estate</label>
                      <input value={roomForm.area} onChange={e => setRoomForm(f => ({...f, area: e.target.value}))} placeholder="e.g. Westlands" className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#8B0000] transition-all"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Room Type</label>
                      <select value={roomForm.type} onChange={e => setRoomForm(f => ({...f, type: e.target.value}))} className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all">
                        {['Standard','Deluxe','Suite','Executive','Short-Stay','Hourly'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Price / Night (KES) *</label>
                      <input type="number" value={roomForm.price_night} onChange={e => setRoomForm(f => ({...f, price_night: e.target.value}))} placeholder="e.g. 3500" className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#FFD700] transition-all"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Price / Hour (KES)</label>
                      <input type="number" value={roomForm.price_hourly} onChange={e => setRoomForm(f => ({...f, price_hourly: e.target.value}))} placeholder="e.g. 800" className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#FFD700] transition-all"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2">Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {ROOM_AMENITIES.map(a => (
                        <button key={a} type="button" onClick={() => toggleRoomAmenity(a)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${roomForm.amenities.includes(a) ? 'bg-[#8B0000] border-[#8B0000] text-white' : 'bg-dark-bg border-color text-text-muted hover:border-text-muted'}`}>{a}</button>
                      ))}
                    </div>
                  </div>
                </div>
                {roomError && <p className="text-[11px] text-[#EF4444] mt-3 bg-[#EF4444]/10 px-3 py-2 rounded-lg">{roomError}</p>}
                <button
                  onClick={handleAddRoom}
                  disabled={roomSaving}
                  className="mt-4 w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold text-sm rounded-xl hover:from-[#a00000] hover:to-[#8B0000] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {roomSaving ? <Loader2 size={15} className="animate-spin"/> : <MapPin size={15}/>}
                  {roomSaving ? 'Listing Room…' : 'List This Room'}
                </button>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-2xl">
                <Star size={14} className="text-[#FFD700] flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="text-xs font-bold text-[#FFD700] mb-0.5">How it works</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">Fill in the details above and click "List This Room". Your room will be immediately visible on the <Link href="/rooms" className="text-[#FFD700] hover:underline">Rooms page</Link> for clients to browse and book. You can list as many rooms as you like.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Edit Profile' && (
            <div className="max-w-2xl space-y-5">
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Display Name</label><input value={escortProfile?.name || user?.name || ''} readOnly className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light/60 focus:outline-none transition-all"/></div>
                  <div><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Bio</label><textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all resize-none"/></div>
                  {/* DOB & Age */}
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Calendar size={10}/> Date of Birth</label>
                    <input type="date" value={editDob} onChange={e=>setEditDob(e.target.value)} max={new Date(new Date().setFullYear(new Date().getFullYear()-18)).toISOString().split('T')[0]} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all [color-scheme:dark]"/>
                    {editAge !== null && <p className="text-[10px] text-[#28a745] mt-1 flex items-center gap-1"><CheckCircle2 size={9}/> Age: {editAge} years old</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Height</label>
                      <select value={editHeight} onChange={e => setEditHeight(e.target.value)} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all appearance-none">
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
                      <input value={editCity} onChange={e => setEditCity(e.target.value)} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Area</label>
                      <input value={editArea} onChange={e => setEditArea(e.target.value)} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all"/>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Per Hour</label><input type="number" value={editHourly}    onChange={e => setEditHourly(e.target.value)}    className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700] transition-all"/></div>
                  <div><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Overnight</label><input type="number" value={editOvernight} onChange={e => setEditOvernight(e.target.value)} className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700] transition-all"/></div>
                  <div><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Video Call</label><input type="number" value={editVideo}    onChange={e => setEditVideo(e.target.value)}    className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700] transition-all"/></div>
                  <div><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Incall Rate</label><input type="number" value={editIncall}   onChange={e => setEditIncall(e.target.value)}   placeholder="e.g. 4000" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700] transition-all"/></div>
                  <div><label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Outcall Rate</label><input type="number" value={editOutcall}  onChange={e => setEditOutcall(e.target.value)}  placeholder="e.g. 5000" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700] transition-all"/></div>
                </div>
                <p className="text-[10px] text-text-muted mt-2">Incall = client comes to you. Outcall = you go to client.</p>
              </div>
              {editSaveError && <p className="text-xs text-[#EF4444] text-center">{editSaveError}</p>}
              <button onClick={handleSave} disabled={editSaving} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${editSaved?'bg-[#28a745] text-white':editSaving?'bg-gray-600 text-white cursor-wait':'bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white hover:from-[#a00000] hover:to-[#8B0000]'}`}>
                {editSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                {editSaved ? '✓ Saved!' : editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'Gallery' && (
            <div>
              {galleryError && (
                <div className="mb-3 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle size={14}/>{galleryError}
                </div>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                {gallery.map((img: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-color group">
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleRemoveGalleryPhoto(img)}
                        className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors"
                      >Remove</button>
                    </div>
                    {i === 0 && <span className="absolute top-1 left-1 text-[8px] font-bold bg-[#FFD700] text-black px-1.5 py-0.5 rounded">COVER</span>}
                  </div>
                ))}
                {gallery.length < tierPhotoLimit && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-color hover:border-[#8B0000] transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                    {galleryUploading ? <Loader2 size={20} className="text-text-muted animate-spin"/> : <Camera size={20} className="text-text-muted"/>}
                    <span className="text-[10px] text-text-muted">{galleryUploading ? 'Uploading…' : 'Add Photo'}</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} disabled={galleryUploading}/>
                  </label>
                )}
              </div>
              <p className="text-xs text-text-muted">{gallery.length}/{tierPhotoLimit} photos ({escortProfile?.tier ?? 'Standard'} tier limit). Cover photo is always first. Tap a photo and click Remove to delete it.</p>
            </div>
          )}

          {activeTab === 'Followers' && (
            <div className="max-w-lg space-y-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-card-bg border border-color rounded-2xl p-4 text-center"><p className="text-2xl font-black text-text-light">{followersData ? Number(followersData.total).toLocaleString() : '—'}</p><p className="text-[10px] text-text-muted mt-0.5">Followers</p></div>
                <div className="bg-card-bg border border-color rounded-2xl p-4 text-center"><p className="text-2xl font-black text-text-light">{followersData?.thisWeek ?? '—'}</p><p className="text-[10px] text-text-muted mt-0.5">This week</p></div>
              </div>
              <div className="bg-card-bg border border-color rounded-2xl p-4">
                <h3 className="text-sm font-bold text-text-light mb-3">Recent Followers</h3>
                {(!followersData || followersData.recent.length === 0) ? (
                  <p className="text-xs text-text-muted text-center py-4">No followers yet — upgrade your tier for more visibility</p>
                ) : (
                  <div className="space-y-3">
                    {followersData.recent.map((f: any, i: number) => {
                      const timeAgo = (() => {
                        if (!f.followedAt) return ''
                        const diff = Date.now() - new Date(f.followedAt).getTime()
                        const mins = Math.floor(diff / 60000)
                        if (mins < 60) return `${mins}m ago`
                        const hrs = Math.floor(mins / 60)
                        if (hrs < 24) return `${hrs}h ago`
                        return `${Math.floor(hrs / 24)}d ago`
                      })()
                      return (
                        <div key={i} className="flex items-center gap-3">
                          {f.avatar ? (
                            <img src={f.avatar} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={f.name} />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-sm font-bold text-[#8B0000] flex-shrink-0">{f.name.charAt(0).toUpperCase()}</div>
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-text-light">{f.name}</p>
                            {timeAgo && <p className="text-[10px] text-text-muted">{timeAgo}</p>}
                          </div>
                          <UserCheck size={13} className="text-[#28a745]" />
                        </div>
                      )
                    })}
                  </div>
                )}
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

              <div className="p-5 bg-card-bg border border-[#E91E63]/30 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-[#E91E63] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-text-light mb-1">Instagram API Not Configured</p>
                    <p className="text-xs text-text-muted leading-relaxed">The Instagram Basic Display API requires app registration and approval from Meta. This feature is not yet active on this platform.</p>
                  </div>
                </div>
                <div className="border-t border-color pt-4">
                  <p className="text-xs font-bold text-text-light mb-2">In the meantime, add photos directly:</p>
                  <button onClick={() => setActiveTab('Gallery')} className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:from-[#a00000] hover:to-[#8B0000] transition-all">
                    <Camera size={14} /> Go to Gallery Tab → Add Photos
                  </button>
                </div>
                <p className="text-[10px] text-text-muted border-t border-color pt-3">Once the admin configures an Instagram API key, this feature will allow you to import photos directly from your public Instagram profile.</p>
              </div>
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
                  {subError && <p className="text-[11px] text-[#EF4444] bg-[#EF4444]/10 px-3 py-2 rounded-lg">{subError}</p>}
                  <button onClick={handleSubscribe} disabled={subLoading||!subPhone} className="w-full py-3.5 bg-[#28a745] hover:bg-[#218838] text-white font-black text-sm rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {subLoading?<Loader2 size={15} className="animate-spin"/>:<Smartphone size={15}/>}
                    {subLoading?'Initiating subscription…':'Pay via M-Pesa'}
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
                {subscription === null ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"/>
                    <span className="text-xs text-text-muted">Loading…</span>
                  </div>
                ) : subscription.active ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#28a745] rounded-full animate-pulse"/>
                    <span className="text-xs font-bold text-[#28a745]">
                      Active{subscription.plan ? ` — ${subscription.plan}` : ''}{subscription.expiresAt ? ` — expires ${new Date(subscription.expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#EF4444] rounded-full"/>
                    <span className="text-xs font-bold text-[#EF4444]">No active subscription</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Earnings' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'This Month', key: 'thisMonth' },
                  { label: 'Last Month', key: 'lastMonth' },
                  { label: 'All Time',   key: 'total' },
                ].map(({ label, key }) => {
                  const d = earnings?.[key]
                  return (
                    <div key={label} className="bg-card-bg border border-color rounded-2xl p-5">
                      <p className="text-xs text-text-muted mb-2">{label}</p>
                      <p className="text-2xl font-black text-[#FFD700]">
                        {d ? `KES ${Number(d.amount).toLocaleString()}` : '—'}
                      </p>
                      <p className="text-xs text-text-muted mt-1">{d ? `${d.contacts} confirmed booking${d.contacts !== 1 ? 's' : ''}` : 'Loading…'}</p>
                    </div>
                  )
                })}
              </div>
              {earnings && earnings.total.contacts === 0 && (
                <div className="text-center py-8 text-text-muted">
                  <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No confirmed bookings yet. Earnings will appear here once clients book and confirm.</p>
                </div>
              )}
              {earnings && earnings.total.contacts > 0 && (
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-text-light">This Week by Day</h3>
                    <span className="text-xs text-[#28a745] font-semibold">KES {Number(earnings.weeklyTotal).toLocaleString()}</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-24">
                    {(earnings.weeklyChart ?? []).map((v: number, i: number) => {
                      const maxVal = Math.max(...earnings.weeklyChart, 1)
                      const pct = Math.max(4, Math.round((v / maxVal) * 100))
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-lg" style={{height:`${pct}%`,background:'linear-gradient(to top,#8B0000,#E91E63)',opacity:v>0?1:0.2}}/>
                          <span className="text-[8px] text-text-muted">{['M','T','W','T','F','S','S'][i]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
