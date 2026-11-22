import { useState } from 'react'
import { proxyImg, type ImageWidth } from '@/lib/proxyImg'

interface ProfilePhotoProps {
  src?: string | null
  alt: string
  name: string
  width?: ImageWidth
  loading?: 'eager' | 'lazy'
  priority?: boolean
  className: string
  draggable?: boolean
}

export default function ProfilePhoto({
  src,
  alt,
  name,
  width = 640,
  loading = 'lazy',
  priority = false,
  className,
  draggable = false,
}: ProfilePhotoProps) {
  const imageSrc = proxyImg(src, width)
  const [loadedSrc, setLoadedSrc] = useState<string>()
  const [failedSrc, setFailedSrc] = useState<string>()
  const loaded = loadedSrc === imageSrc
  const failed = failedSrc === imageSrc

  const initial = (name || '?').charAt(0).toUpperCase()

  return (
    <>
      {imageSrc && !loaded && !failed && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1a1a1a] to-[#2a1a1a]"
        />
      )}
      {imageSrc && !failed ? (
        <img
          src={imageSrc}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading={loading}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          draggable={draggable}
          onLoad={() => setLoadedSrc(imageSrc)}
          onError={() => setFailedSrc(imageSrc)}
        />
      ) : (
        <div
          role="img"
          aria-label={`${name || 'Profile'} photo unavailable`}
          className={`${className} absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2a1a1a]`}
        >
          <span className="select-none text-5xl font-black text-[#8B0000]/60">{initial}</span>
        </div>
      )}
    </>
  )
}
