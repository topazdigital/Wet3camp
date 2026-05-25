import { Home, Radio, Newspaper, MessageCircle, LayoutGrid } from 'lucide-react'
import { Link, useLocation } from 'wouter'

const TABS = [
  { href: '/',         icon: Home,          label: 'Home'   },
  { href: '/feeds',    icon: Newspaper,     label: 'Feeds'  },
  { href: '/live',     icon: Radio,         label: 'Live',  isLive: true },
  { href: '/messages', icon: MessageCircle, label: 'Inbox'  },
  { href: '/exclusive',icon: LayoutGrid,    label: 'More'   },
]

export default function BottomNav() {
  const [location] = useLocation()
  const isActive = (href: string) => href === '/' ? location === '/' : location.startsWith(href)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-color bg-card-bg/95 backdrop-blur-md">
      <div className="flex items-end justify-around px-1 pb-1 pt-1">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = isActive(tab.href)
          return (
            <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center group relative">
              {tab.isLive ? (
                <div className={`-mt-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 ${active ? 'bg-[#E91E63] shadow-[#E91E63]/60' : 'bg-gradient-to-br from-[#8B0000] to-[#E91E63] shadow-[#8B0000]/50 group-hover:scale-105'}`}>
                  <Icon size={22} className="text-white" />
                  {!active && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#28a745] border-2 border-[#1a1a1a] animate-pulse" />}
                </div>
              ) : (
                <div className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all mt-1 ${active ? 'bg-[#8B0000]/20' : 'group-hover:bg-dark-bg'}`}>
                  <Icon size={20} className={`transition-colors ${active ? 'text-[#8B0000]' : 'text-text-muted group-hover:text-text-light'}`} />
                </div>
              )}
              <span className={`text-[10px] font-medium leading-none mt-1 mb-1.5 transition-colors ${tab.isLive ? 'text-[#E91E63] mt-0.5' : active ? 'text-[#8B0000]' : 'text-text-muted group-hover:text-text-light'}`}>
                {tab.label}
              </span>
              {active && !tab.isLive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#8B0000]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
