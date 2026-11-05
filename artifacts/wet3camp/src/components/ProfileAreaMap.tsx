import { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import { ExternalLink, MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import './ProfileAreaMap.css'

type ApproximatePoint = {
  lat: number
  lng: number
  radius: number
  zoom: number
}

const CITY_CENTERS: Record<string, [number, number]> = {
  nairobi: [-1.2921, 36.8219],
  mombasa: [-4.0435, 39.6682],
  kisumu: [-0.1022, 34.7617],
  nakuru: [-0.3031, 36.08],
  eldoret: [0.5143, 35.2698],
  thika: [-1.0332, 37.0693],
}

function getApproximatePoint(lat: number, lng: number, city: string): ApproximatePoint | null {
  // Round profile coordinates to a coarse grid before displaying or linking out.
  // This keeps the map useful for orientation without publishing an exact pin.
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    (lat !== 0 || lng !== 0) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  ) {
    const grid = 0.02
    return {
      lat: Math.round(lat / grid) * grid,
      lng: Math.round(lng / grid) * grid,
      radius: 2400,
      zoom: 13,
    }
  }

  const cityCenter = CITY_CENTERS[city.trim().toLowerCase()]
  if (!cityCenter) return null
  return {
    lat: cityCenter[0],
    lng: cityCenter[1],
    radius: 7000,
    zoom: 12,
  }
}

type ProfileAreaMapProps = {
  area?: string
  city?: string
  lat?: number
  lng?: number
  className?: string
}

export default function ProfileAreaMap({
  area = '',
  city = '',
  lat = 0,
  lng = 0,
  className = '',
}: ProfileAreaMapProps) {
  const mapElement = useRef<HTMLDivElement>(null)
  const [hasSize, setHasSize] = useState(false)
  const point = getApproximatePoint(Number(lat), Number(lng), city)
  const place = [area, city].filter(Boolean).join(', ')

  useEffect(() => {
    const element = mapElement.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      const visible = entry.contentRect.width > 0 && entry.contentRect.height > 0
      setHasSize(current => current === visible ? current : visible)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = mapElement.current
    if (!point || !hasSize || !element) return

    const map = L.map(element, {
      center: [point.lat, point.lng],
      zoom: point.zoom,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.circle([point.lat, point.lng], {
      radius: point.radius,
      color: '#f4c542',
      weight: 2,
      fillColor: '#8b0000',
      fillOpacity: 0.2,
    }).addTo(map)

    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    resizeObserver.observe(element)
    return () => {
      resizeObserver.disconnect()
      map.remove()
    }
  }, [hasSize, point?.lat, point?.lng, point?.radius, point?.zoom])

  if (!point) return null

  const mapUrl = `https://www.openstreetmap.org/#map=${point.zoom}/${point.lat}/${point.lng}`

  return (
    <section
      className={`profile-area-map overflow-hidden rounded-2xl border border-white/15 bg-[#101010]/95 shadow-2xl backdrop-blur-md ${className}`}
      aria-label={`Approximate service area map${place ? ` for ${place}` : ''}`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <MapPin size={12} className="shrink-0 text-[#f4c542]" />
            Approximate area
          </div>
          {place && <p className="mt-0.5 truncate text-[10px] text-white/65">{place}</p>}
        </div>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open approximate area in OpenStreetMap"
          className="shrink-0 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <ExternalLink size={13} />
        </a>
      </div>
      <div ref={mapElement} className="profile-area-map__canvas h-36 w-full" />
      <p className="px-3 py-2 text-[9px] leading-snug text-white/55">
        General area only. Confirm meeting details directly.
      </p>
    </section>
  )
}
