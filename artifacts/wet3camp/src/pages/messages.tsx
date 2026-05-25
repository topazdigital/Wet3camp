import React, { useState, useRef, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useSEO } from '@/lib/useSEO'
import { Send, Search, CheckCheck, Check, MoreVertical, Phone, Video, Paperclip, Smile, ArrowLeft, Calendar, X } from 'lucide-react'
import { Link } from 'wouter'

const CONVERSATIONS = [
  { id: 1, name: 'Amara K.',  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop', last: 'Available tonight?',            time: '2m',     unread: 2, online: true,  tier: 'Elite'   },
  { id: 2, name: 'Zara M.',   avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop', last: 'Thanks for booking!',           time: '1h',     unread: 0, online: true,  tier: 'VIP'     },
  { id: 3, name: 'Luna K.',   avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop', last: 'What time works for you?',      time: '3h',     unread: 1, online: false, tier: 'VIP'     },
  { id: 4, name: 'Priya S.',  avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop', last: "Sure, I'll confirm ASAP.",       time: 'Yesterday', unread: 0, online: false, tier: 'Elite' },
  { id: 5, name: 'Fatuma H.', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop', last: 'Perfect, see you then!',         time: '2 days', unread: 0, online: false, tier: 'Premium' },
]

type MsgStatus = 'sent' | 'read'
interface Msg { id: number; text: string; mine: boolean; time: string; status?: MsgStatus; isBookingReq?: boolean }

const INITIAL_CHAT: Record<number, Msg[]> = {
  1: [
    { id: 1, text: 'Hey! Are you available this evening?',      mine: false, time: '7:02 PM' },
    { id: 2, text: 'Yes I am 😊 What time were you thinking?',  mine: true,  time: '7:05 PM', status: 'read' },
    { id: 3, text: 'Around 8 PM works?',                        mine: false, time: '7:06 PM' },
    { id: 4, text: 'Perfect. How long?',                        mine: true,  time: '7:07 PM', status: 'read' },
    { id: 5, text: 'Maybe 2 hours. KES 16,000 right?',          mine: false, time: '7:08 PM' },
    { id: 6, text: "Yes that's correct. See you at 8 PM 🔥",    mine: true,  time: '7:09 PM', status: 'sent' },
    { id: 7, text: 'Available tonight?',                        mine: false, time: '7:15 PM' },
  ],
  2: [
    { id: 1, text: 'Hi! Your booking is confirmed for tomorrow.', mine: false, time: '2:00 PM' },
    { id: 2, text: 'Great, looking forward to it!',               mine: true,  time: '2:05 PM', status: 'read' },
    { id: 3, text: 'Thanks for booking!',                          mine: false, time: '2:10 PM' },
  ],
  3: [
    { id: 1, text: 'Hi! Are you available on Friday?', mine: true, time: '10:00 AM', status: 'read' },
    { id: 2, text: 'What time works for you?',          mine: false, time: '10:15 AM' },
  ],
}

const AUTO_REPLIES: Record<number, string[]> = {
  1: ["I'd love that! Let me check my schedule 😊", "That sounds perfect 🔥", "Sure! What's your preference for location?", "I'm available — when exactly?"],
  2: ["Of course! Looking forward to seeing you 💕", "I'll send you my location details shortly.", "Perfect, see you soon! 🌟"],
  3: ["Yes I'm free! What time works for you? 🌸", "Let me know the details.", "That works! Just message me your address."],
  4: ["I'll confirm shortly 💋", "Sounds good to me!", "Let me check my calendar and get back to you."],
  5: ["Can't wait! 😊", "Perfect, I'll be there!", "That sounds wonderful, see you then!"],
}

const TIER_COLOR: Record<string, string> = { Elite: '#8B0000', VIP: '#FF4500', Premium: '#B8860B' }

export default function MessagesPage() {
  useSEO({ title: 'Messages', noIndex: true })

  const [selected, setSelected] = useState<number | null>(1)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState<Record<number, Msg[]>>(INITIAL_CHAT)
  const [showList, setShowList] = useState(true)
  const [typing, setTyping] = useState<Record<number, boolean>>({})
  const [unread, setUnread] = useState<Record<number, number>>({ 1: 2, 3: 1 })
  const [bookingPrompt, setBookingPrompt] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected, messages, typing])

  const selectConv = (id: number) => {
    setSelected(id)
    setShowList(false)
    setUnread(prev => ({ ...prev, [id]: 0 }))
    setBookingPrompt(false)
  }

  const sendMsg = () => {
    if (!input.trim() || !selected) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newMsg: Msg = { id: Date.now(), text: input.trim(), mine: true, time: now, status: 'sent' }
    setMessages(prev => ({ ...prev, [selected]: [...(prev[selected] ?? []), newMsg] }))
    setInput('')

    const convId = selected
    setTimeout(() => {
      setTyping(prev => ({ ...prev, [convId]: true }))
      const replyDelay = 1500 + Math.random() * 1500
      setTimeout(() => {
        setTyping(prev => ({ ...prev, [convId]: false }))
        const replies = AUTO_REPLIES[convId] ?? ["Thanks for your message!"]
        const replyText = replies[Math.floor(Math.random() * replies.length)]
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const reply: Msg = { id: Date.now() + 1, text: replyText, mine: false, time: replyTime }
        setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] ?? []), reply] }))
        if (convId !== selected) {
          setUnread(prev => ({ ...prev, [convId]: (prev[convId] ?? 0) + 1 }))
        }
      }, replyDelay)
    }, 800)
  }

  const sendBookingRequest = () => {
    if (!selected) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const reqMsg: Msg = {
      id: Date.now(),
      text: '📅 Booking request sent — please check your bookings to confirm.',
      mine: true,
      time: now,
      status: 'sent',
      isBookingReq: true,
    }
    setMessages(prev => ({ ...prev, [selected]: [...(prev[selected] ?? []), reqMsg] }))
    setBookingPrompt(false)

    const convId = selected
    setTimeout(() => {
      setTyping(prev => ({ ...prev, [convId]: true }))
      setTimeout(() => {
        setTyping(prev => ({ ...prev, [convId]: false }))
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const reply: Msg = {
          id: Date.now() + 1,
          text: "I received your booking request! I'll confirm shortly 💕",
          mine: false,
          time: replyTime,
        }
        setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] ?? []), reply] }))
      }, 2500)
    }, 1200)
  }

  const activeCon = CONVERSATIONS.find(c => c.id === selected)
  const filtered  = CONVERSATIONS.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
  const totalUnread = Object.values(unread).reduce((s, n) => s + n, 0)

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full min-w-0 lg:pb-0 overflow-hidden">
        <Header />
        <div className="flex h-[calc(100vh-56px)] overflow-hidden pb-16 lg:pb-0">

          {/* ── Conversation List ── */}
          <div className={`${selected && !showList ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 flex-col border-r border-color bg-card-bg`}>
            <div className="p-3 border-b border-color">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-text-light">Messages</h2>
                {totalUnread > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-[#8B0000] text-white rounded-full">{totalUnread} new</span>
                )}
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full pl-8 pr-3 py-2 bg-dark-bg border border-color rounded-xl text-xs text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]/60 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(conv => {
                const tierColor = TIER_COLOR[conv.tier] ?? '#8B0000'
                const convUnread = unread[conv.id] ?? 0
                const isTypingHere = typing[conv.id]
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConv(conv.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3.5 border-b border-color/50 transition-colors text-left ${selected === conv.id ? 'bg-[#8B0000]/10 border-l-2 border-l-[#8B0000]' : 'hover:bg-dark-bg border-l-2 border-l-transparent'}`}
                  >
                    <div className="relative flex-shrink-0">
                      <img src={conv.avatar} alt={conv.name} className="w-11 h-11 rounded-full object-cover border-2" style={{ borderColor: tierColor + '60' }} />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card-bg ${conv.online ? 'bg-[#28a745]' : 'bg-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-light">{conv.name}</span>
                        <span className="text-[10px] text-text-muted">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className={`text-xs truncate ${isTypingHere ? 'text-[#28a745] italic' : convUnread ? 'text-text-light font-semibold' : 'text-text-muted'}`}>
                          {isTypingHere ? 'typing…' : (messages[conv.id]?.slice(-1)[0]?.text ?? conv.last)}
                        </span>
                        {convUnread > 0 && (
                          <span className="w-5 h-5 bg-[#8B0000] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 ml-1">{convUnread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Chat Area ── */}
          {selected ? (
            <div className={`${!showList ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>

              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-color bg-card-bg">
                <button className="md:hidden p-1.5 text-text-muted hover:text-text-light mr-1" onClick={() => setShowList(true)}>
                  <ArrowLeft size={18} />
                </button>
                <div className="relative">
                  <img src={activeCon?.avatar} alt={activeCon?.name} className="w-9 h-9 rounded-full object-cover" />
                  {activeCon?.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#28a745] rounded-full border-2 border-card-bg" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-light text-sm">{activeCon?.name}</p>
                  <p className={`text-[11px] ${typing[selected] ? 'text-[#28a745] animate-pulse' : activeCon?.online ? 'text-[#28a745]' : 'text-text-muted'}`}>
                    {typing[selected] ? 'typing…' : activeCon?.online ? 'Online' : 'Offline'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBookingPrompt(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FFD700] border border-[#FFD700]/30 rounded-lg hover:bg-[#FFD700]/10 transition-all"
                  >
                    <Calendar size={13} /> Book
                  </button>
                  <button className="p-2 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg transition-colors"><Phone size={16} /></button>
                  <button className="p-2 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg transition-colors"><Video size={16} /></button>
                  <button className="p-2 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg transition-colors"><MoreVertical size={16} /></button>
                </div>
              </div>

              {/* Booking prompt banner */}
              {bookingPrompt && (
                <div className="mx-4 mt-3 p-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#FFD700]">📅 Request a Booking</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Send {activeCon?.name.split(' ')[0]} a booking request directly via chat.</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button onClick={sendBookingRequest} className="px-3 py-1.5 bg-[#8B0000] text-white text-xs font-bold rounded-lg hover:bg-[#a00000] transition-all">
                      Send Request
                    </button>
                    <Link href="/bookings" className="px-3 py-1.5 bg-dark-bg border border-color text-text-muted text-xs font-semibold rounded-lg hover:border-text-muted transition-all">
                      View Bookings
                    </Link>
                    <button onClick={() => setBookingPrompt(false)} className="p-1 text-text-muted hover:text-text-light">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {/* Date separator */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-color" />
                  <span className="text-[10px] text-text-muted px-2">Today</span>
                  <div className="flex-1 h-px bg-color" />
                </div>

                {(messages[selected] ?? []).map(msg => (
                  <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                    {!msg.mine && (
                      <img src={activeCon?.avatar} alt="" className="w-6 h-6 rounded-full object-cover mr-2 self-end flex-shrink-0" />
                    )}
                    <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${
                      msg.mine
                        ? msg.isBookingReq
                          ? 'bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] rounded-br-sm'
                          : 'bg-[#8B0000] text-white rounded-br-sm'
                        : 'bg-card-bg text-text-light border border-color rounded-bl-sm'
                    }`}>
                      {msg.text}
                      <div className={`flex items-center gap-1 mt-1 ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[9px] ${msg.mine ? 'text-white/60' : 'text-text-muted'} ${msg.isBookingReq ? '!text-[#FFD700]/60' : ''}`}>{msg.time}</span>
                        {msg.mine && (
                          msg.status === 'read'
                            ? <CheckCheck size={11} className="text-[#FFD700]" />
                            : <Check size={11} className="text-white/60" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {typing[selected] && (
                  <div className="flex justify-start items-end gap-2">
                    <img src={activeCon?.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    <div className="bg-card-bg border border-color rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.9s' }} />
                      <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '200ms', animationDuration: '0.9s' }} />
                      <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '400ms', animationDuration: '0.9s' }} />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-color bg-card-bg">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-text-muted hover:text-text-light rounded-xl hover:bg-dark-bg transition-colors flex-shrink-0">
                    <Paperclip size={17} />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMsg())}
                      placeholder="Type a message…"
                      className="w-full pl-4 pr-10 py-2.5 bg-dark-bg border border-color rounded-2xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]/50 transition-all"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-[#FFD700] transition-colors">
                      <Smile size={16} />
                    </button>
                  </div>
                  <button
                    onClick={sendMsg}
                    disabled={!input.trim()}
                    className="w-9 h-9 flex items-center justify-center bg-[#8B0000] hover:bg-[#a00000] text-white rounded-xl transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center flex-col gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-card-bg border border-color flex items-center justify-center">
                <Send size={28} className="text-text-muted" />
              </div>
              <p className="text-text-light font-semibold">Select a conversation</p>
              <p className="text-text-muted text-sm">Choose someone from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
