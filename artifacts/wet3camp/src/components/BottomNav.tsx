import { Home, Radio, Newspaper, MessageCircle, User, UserCircle2, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { useAuth } from '@/lib/auth-context'

const BASE_TABS = [
  { href: '/',         icon: Home,          label: 'Home'  },
  { href: '/feeds',    icon: Newspaper,     label: 'Feeds' },
  { href: '/live',     icon: Radio,         label: 'Live', isLive: true },
  { href: '/messages', icon: MessageCircle, label: 'Inbox' },
]

export default function BottomNav() {
  const [location] = useLocation()
  const { isLoggedIn, isEscort } = useAuth()
  const isActive = (href: string) => href === '/' ? location === '/' : location.startsWith(href)

  // Role-based last tab
  const lastTab = isLoggedIn
    ? isEscort
      ? { href: '/my-profile', icon: UserCircle2, label: 'Profile',  isSpecial: false }
      : { href: '/account',    icon: User,        label: 'Account',  isSpecial: false }
    : { href: '/register',   icon: Sparkles,    label: 'Join',     isSpecial: true  }

  const tabs = [...BASE_TABS, lastTab]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-color bg-card-bg/95 backdrop-blur-md">
      <div className="flex items-end justify-around px-1 pb-1 pt-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = isActive(tab.href)

          if ((tab as any).isLive) {
            return (
              <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center group relative">
                <div className={`-mt-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 ${active ? 'bg-[#E91E63] shadow-[#E91E63]/60' : 'bg-gradient-to-br from-[#8B0000] to-[#E91E63] shadow-[#8B0000]/50 group-hover:scale-105'}`}>
                  <Icon size={22} className="text-white" />
                  {!active && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#28a745] border-2 border-[#1a1a1a] animate-pulse" />}
                </div>
                <span className="text-[10px] font-medium leading-none mt-0.5 mb-1.5 text-[#E91E63]">{tab.label}</span>
              </Link>
            )
          }

          if ((tab as any).isSpecial) {
            return (
              <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center group relative">
                <div className="relative -mt-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-[#FFD700] to-[#8B0000] shadow-[#FFD700]/30 group-hover:scale-105 transition-all duration-200">
                  <Icon size={20} className="text-white" />
                  <span className="absolute inset-0 rounded-full animate-ping bg-[#FFD700]/20 pointer-events-none" />
                </div>
                <span className="text-[10px] font-bold leading-none mt-1 mb-1.5 text-[#FFD700]">{tab.label}</span>
              </Link>
            )
          }

          return (
            <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center group relative">
              {active && !('isLive' in tab) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#8B0000]" />
              )}
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all mt-1 ${active ? 'bg-[#8B0000]/20' : 'group-hover:bg-dark-bg'}`}>
                <Icon size={20} className={`transition-colors ${active ? 'text-[#8B0000]' : 'text-text-muted group-hover:text-text-light'}`} />
              </div>
              <span className={`text-[10px] font-medium leading-none mt-1 mb-1.5 transition-colors ${active ? 'text-[#8B0000]' : 'text-text-muted group-hover:text-text-light'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
