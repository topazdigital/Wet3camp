import React, { useState, useRef, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Send, Search, CheckCheck, Check, MoreVertical, Phone, Video, Paperclip, Smile, ArrowLeft } from 'lucide-react'

const CONVERSATIONS = [
  { id: 1, name: 'Amara K.',  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop', last: 'Available tonight?',         time: '2m',   unread: 2, online: true  },
  { id: 2, name: 'Zara M.',   avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop', last: 'Thanks for booking!',        time: '1h',   unread: 0, online: true  },
  { id: 3, name: 'Luna K.',   avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop', last: 'What time works for you?',   time: '3h',   unread: 1, online: false },
  { id: 4, name: 'Priya S.',  avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop', last: 'Sure, I\'ll confirm ASAP.',   time: 'Yesterday', unread: 0, online: false },
  { id: 5, name: 'Fatuma H.', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop', last: 'Perfect, see you then!',      time: '2 days', unread: 0, online: false },
]

const CHAT: Record<number, { id: number; text: string; mine: boolean; time: string; status?: 'sent' | 'read' }[]> = {
  1: [
    { id: 1, text: 'Hey! Are you available this evening?',     mine: false, time: '7:02 PM' },
    { id: 2, text: 'Yes I am 😊 What time were you thinking?', mine: true,  time: '7:05 PM', status: 'read' },
    { id: 3, text: 'Around 8 PM works?',                       mine: false, time: '7:06 PM' },
    { id: 4, text: 'Perfect. How long?',                       mine: true,  time: '7:07 PM', status: 'read' },
    { id: 5, text: 'Maybe 2 hours. KES 16,000 right?',         mine: false, time: '7:08 PM' },
    { id: 6, text: 'Yes that\'s correct. See you at 8 PM 🔥',  mine: true,  time: '7:09 PM', status: 'sent' },
    { id: 7, text: 'Available tonight?',                       mine: false, time: '7:15 PM' },
  ],
  2: [
    { id: 1, text: 'Hi! Your booking is confirmed for tomorrow.', mine: false, time: '2:00 PM' },
    { id: 2, text: 'Great, looking forward to it!',               mine: true,  time: '2:05 PM', status: 'read' },
    { id: 3, text: 'Thanks for booking!',                          mine: false, time: '2:10 PM' },
  ],
}

export default function MessagesPage() {
  const [selected, setSelected] = useState<number | null>(1)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState(CHAT)
  const [showList, setShowList] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selected, messages])

  const sendMsg = () => {
    if (!input.trim() || !selected) return
    const newMsg = { id: Date.now(), text: input.trim(), mine: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'sent' as const }
    setMessages(prev => ({ ...prev, [selected]: [...(prev[selected] ?? []), newMsg] }))
    setInput('')
  }

  const activeCon = CONVERSATIONS.find(c => c.id === selected)
  const filtered = CONVERSATIONS.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full min-w-0 lg:pb-0 overflow-hidden">
        <Header />
        <div className="flex h-[calc(100vh-56px)] overflow-hidden pb-16 lg:pb-0">

          {/* Conversation List */}
          <div className={`${selected && !showList ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 flex-col border-r border-color bg-card-bg`}>
            <div className="p-3 border-b border-color">
              <h2 className="text-sm font-bold text-text-light mb-3">Messages</h2>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…" className="w-full pl-8 pr-3 py-2 bg-dark-bg border border-color rounded-xl text-xs text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 transition-all" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(conv => (
                <button key={conv.id} onClick={() => { setSelected(conv.id); setShowList(false) }} className={`w-full flex items-center gap-3 px-3 py-3.5 border-b border-color/50 transition-colors text-left ${selected === conv.id ? 'bg-[#8B0000]/10' : 'hover:bg-dark-bg'}`}>
                  <div className="relative flex-shrink-0">
                    <img src={conv.avatar} alt={conv.name} className="w-11 h-11 rounded-full object-cover" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card-bg ${conv.online ? 'bg-[#28a745]' : 'bg-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${conv.unread ? 'text-text-light' : 'text-text-light'}`}>{conv.name}</span>
                      <span className="text-[10px] text-text-muted">{conv.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs truncate ${conv.unread ? 'text-text-light font-semibold' : 'text-text-muted'}`}>{conv.last}</span>
                      {conv.unread > 0 && <span className="w-5 h-5 bg-[#8B0000] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 ml-1">{conv.unread}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
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
                  <p className="text-[11px] text-[#28a745]">{activeCon?.online ? 'Online' : 'Offline'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg transition-colors"><Phone size={16} /></button>
                  <button className="p-2 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg transition-colors"><Video size={16} /></button>
                  <button className="p-2 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg transition-colors"><MoreVertical size={16} /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {(messages[selected] ?? []).map(msg => (
                  <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${msg.mine ? 'bg-[#8B0000] text-white rounded-br-sm' : 'bg-card-bg text-text-light border border-color rounded-bl-sm'}`}>
                      {msg.text}
                      <div className={`flex items-center gap-1 mt-1 ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[9px] ${msg.mine ? 'text-white/60' : 'text-text-muted'}`}>{msg.time}</span>
                        {msg.mine && (msg.status === 'read' ? <CheckCheck size={11} className="text-[#FFD700]" /> : <Check size={11} className="text-white/60" />)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-color bg-card-bg">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-text-muted hover:text-text-light rounded-xl hover:bg-dark-bg transition-colors flex-shrink-0"><Paperclip size={17} /></button>
                  <div className="flex-1 relative">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMsg())}
                      placeholder="Type a message…"
                      className="w-full pl-4 pr-10 py-2.5 bg-dark-bg border border-color rounded-2xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/50 transition-all"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-[#FFD700] transition-colors"><Smile size={16} /></button>
                  </div>
                  <button onClick={sendMsg} className="w-9 h-9 flex items-center justify-center bg-[#8B0000] hover:bg-[#a00000] text-white rounded-xl transition-colors flex-shrink-0 disabled:opacity-40" disabled={!input.trim()}>
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
