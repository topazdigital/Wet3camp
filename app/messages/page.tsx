'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, ChevronLeft, Search, Heart } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

interface Message {
  id: number
  senderName: string
  senderImage: string
  lastMessage: string
  timestamp: string
  unread: boolean
}

interface Conversation {
  id: number
  messages: Array<{
    id: number
    sender: 'me' | 'other'
    text: string
    timestamp: string
  }>
}

const mockConversations: Message[] = [
  {
    id: 1,
    senderName: 'Amara',
    senderImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    lastMessage: 'Hey, I am available now',
    timestamp: '2 min ago',
    unread: true,
  },
  {
    id: 2,
    senderName: 'Zara',
    senderImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    lastMessage: 'Thanks for the tip!',
    timestamp: '1 hour ago',
    unread: false,
  },
  {
    id: 3,
    senderName: 'Luna',
    senderImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    lastMessage: 'When can you be free?',
    timestamp: '5 hours ago',
    unread: false,
  },
]

const mockChatMessages: Conversation['messages'] = [
  {
    id: 1,
    sender: 'other',
    text: 'Hey there! How are you doing?',
    timestamp: '10:00 AM',
  },
  {
    id: 2,
    sender: 'me',
    text: 'Hi! I&apos;m doing good, how about you?',
    timestamp: '10:02 AM',
  },
  {
    id: 3,
    sender: 'other',
    text: 'I am available now if you want to book',
    timestamp: '10:05 AM',
  },
]

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState(mockChatMessages)

  const filteredConversations = mockConversations.filter(conv =>
    conv.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentConversation = mockConversations.find(c => c.id === selectedConversation)

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: 'me',
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
      setNewMessage('')
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <div className="hidden lg:block lg:flex-shrink-0">
        <Sidebar />
      </div>

      <div className="lg:hidden">
        <Sidebar />
      </div>

      <div className="flex-1 w-full overflow-x-hidden flex flex-col">
        <Header />

        <div className="flex flex-1 min-h-0">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden sm:flex' : 'flex'} sm:flex w-full sm:w-96 flex-col border-r border-gray-700 bg-card-bg`}>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-text-light mb-3">Messages</h2>
              
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-darker-bg text-text-light rounded-lg border border-gray-700 focus:border-secondary-color outline-none text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-2 sm:p-4 border-b border-gray-700 hover:bg-darker-bg transition text-left ${
                    selectedConversation === conv.id ? 'bg-darker-bg' : ''
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <img
                      src={conv.senderImage}
                      alt={conv.senderName}
                      className="w-10 sm:w-12 h-10 sm:h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-1">
                        <h3 className={`font-semibold text-text-light text-xs sm:text-sm truncate ${conv.unread ? 'font-bold' : ''}`}>
                          {conv.senderName}
                        </h3>
                        <span className="text-xs text-text-muted flex-shrink-0">{conv.timestamp}</span>
                      </div>
                      <p className={`text-xs truncate ${conv.unread ? 'text-text-light font-medium' : 'text-text-muted'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread && (
                      <div className="w-2 h-2 rounded-full bg-secondary-color flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation && currentConversation ? (
            <div className="flex-1 flex flex-col bg-dark-bg min-h-0">
              {/* Chat Header */}
              <div className="p-2 sm:p-4 border-b border-gray-700 bg-card-bg flex items-center justify-between flex-shrink-0 gap-2">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="sm:hidden p-2 hover:bg-darker-bg rounded transition"
                >
                  <ChevronLeft size={18} className="text-text-light" />
                </button>

                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <img
                    src={currentConversation.senderImage}
                    alt={currentConversation.senderName}
                    className="w-8 sm:w-10 h-8 sm:h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-light text-xs sm:text-sm truncate">{currentConversation.senderName}</h3>
                    <p className="text-xs text-green-400">Online</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button className="p-1.5 sm:p-2 hover:bg-darker-bg rounded transition text-text-light">
                    <Heart size={16} className="sm:w-5 sm:h-5" />
                  </button>
                  <button className="p-1.5 sm:p-2 hover:bg-darker-bg rounded transition text-text-light">
                    <MessageCircle size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${
                        msg.sender === 'me'
                          ? 'bg-secondary-color text-black'
                          : 'bg-gray-700 text-text-light'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-gray-800' : 'text-text-muted'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-2 sm:p-4 border-t border-gray-700 bg-card-bg flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-darker-bg text-text-light rounded-lg border border-gray-700 focus:border-secondary-color outline-none text-xs sm:text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-3 sm:px-6 py-1.5 sm:py-2 bg-secondary-color text-black font-medium text-xs sm:text-sm rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition flex-shrink-0"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex flex-1 items-center justify-center bg-dark-bg">
              <div className="text-center">
                <MessageCircle size={40} className="sm:size-48 mx-auto mb-3 sm:mb-4 text-text-muted opacity-50" />
                <p className="text-text-muted mb-2 text-sm">No conversation selected</p>
                <p className="text-xs text-text-muted opacity-75">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
