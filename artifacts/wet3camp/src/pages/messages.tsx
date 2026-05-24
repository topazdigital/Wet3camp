

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Send } from 'lucide-react'


export default function MessagesPage() {
  const conversations = [
    {
      id: 1,
      name: 'Amara',
      lastMessage: 'Hey! Are you available today?',
      timestamp: '2 hours ago',
      unread: true,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    {
      id: 2,
      name: 'Zara',
      lastMessage: 'Thanks for booking with me!',
      timestamp: '5 hours ago',
      unread: false,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    {
      id: 3,
      name: 'Maya',
      lastMessage: 'What time works for you?',
      timestamp: '1 day ago',
      unread: false,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
  ]

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24">
        <Header />

        <main className="w-full px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-light mb-2">Messages</h1>
            <p className="text-text-muted mb-6">Your conversations</p>

            {/* Messages List */}
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    conv.unread
                      ? 'bg-primary-color/10 border-primary-color hover:bg-primary-color/20'
                      : 'bg-card-bg border-color hover:border-secondary-color'
                  }`}
                >
                  <img
                    src={conv.image}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className={`font-bold text-sm ${conv.unread ? 'text-light' : 'text-text-light'}`}>
                        {conv.name}
                      </h3>
                      <span className="text-text-muted text-xs flex-shrink-0">{conv.timestamp}</span>
                    </div>
                    <p className={`text-xs truncate ${conv.unread ? 'text-text-light font-semibold' : 'text-text-muted'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
