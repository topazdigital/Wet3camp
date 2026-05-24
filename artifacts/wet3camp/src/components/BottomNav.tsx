

import { Link } from 'wouter'
import { useLocation } from 'wouter'
import { Home, Newspaper, ShoppingBag, Heart } from 'lucide-react'

const mobileNavItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Newspaper, label: 'Feeds', href: '/feeds' },
  { icon: ShoppingBag, label: 'Shop', href: '/shop' },
  { icon: Heart, label: 'Favorites', href: '/favorites' },
]

export default function BottomNav() {
  const [pathname] = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card-bg border-t border-color z-40">
      <div className="flex items-center justify-around w-full px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-4 flex-1 transition-colors text-xs ${
                isActive
                  ? 'text-secondary-color'
                  : 'text-text-muted hover:text-light'
              }`}
              title={item.label}
            >
              <Icon size={24} />
              <span className="whitespace-nowrap text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
