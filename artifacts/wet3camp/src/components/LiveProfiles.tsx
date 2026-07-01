import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { Radio } from 'lucide-react'

interface LiveSession {
  id: string
  escortId: number
  name: string
  avatar?: string
  image?: string
  city?: string
  tier?: string
  viewerCount: number
}

export default function LiveProfiles() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => {
      fetch('/api/live')
        .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
        .then(data => { setSessions(Array.isArray(data) ? data : []); setLoading(false) })
        .catch(() => setLoading(false))
    }
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  if (loading || sessions.length === 0) return null

  return (
    <div className="bg-dark-bg py-4 border-b border-color">
      <div className="px-4">
        <h2 className="text-sm font-bold text-text-light mb-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E91E63] animate-pulse" />
          <Radio size={13} className="text-[#E91E63]" />
          Now Live
          <span className="text-[10px] text-text-muted font-normal">{sessions.length} streaming</span>
        </h2>

        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-4 min-w-min">
            {sessions.map(s => {
              const photo = s.avatar || s.image
              return (
                <Link key={s.id} href={`/live/${s.escortId}`} className="flex-shrink-0 flex flex-col items-center gap-1.5 group cursor-pointer">
                  {/* Gradient ring — no spin so photo stays upright */}
                  <div className="relative">
                    <div className="w-[76px] h-[76px] rounded-full p-[3px] bg-gradient-to-br from-[#E91E63] via-[#FF4500] to-[#8B0000] shadow-[0_0_14px_#E91E6360] group-hover:shadow-[0_0_20px_#E91E6380] transition-shadow">
                      <div className="w-full h-full rounded-full p-[2px] bg-dark-bg">
                        <div className="w-full h-full rounded-full overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          {photo
                            ? <img src={photo} alt={s.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-card-bg flex items-center justify-center text-xl font-black text-[#8B0000]/50">
                                {(s.name || '?')[0]}
                              </div>
                          }
                        </div>
                      </div>
                    </div>
                    {/* LIVE badge */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-[#E91E63] px-2 py-0.5 rounded-full border border-dark-bg">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      <span className="text-[7px] font-black text-white leading-none tracking-wide">LIVE</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-light text-center max-w-[68px] truncate font-semibold group-hover:text-[#E91E63] transition-colors">
                    {s.name.split(' ')[0]}
                  </p>
                  <p className="text-[9px] text-text-muted text-center -mt-1">👁 {s.viewerCount}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
