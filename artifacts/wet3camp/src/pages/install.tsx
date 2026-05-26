import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useSEO } from '@/lib/useSEO'
import { Smartphone, Monitor, Download, CheckCircle2, Share2, Plus, Menu, Chrome, Bell, Zap, Wifi, Lock, Star } from 'lucide-react'

type Platform = 'android' | 'ios' | 'desktop'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'android'
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'desktop'
}

const INSTRUCTIONS: Record<Platform, { title: string; steps: { icon: React.ReactNode; text: string; sub?: string }[] }> = {
  android: {
    title: 'Android — Chrome',
    steps: [
      { icon: <Chrome size={18} />, text: 'Open wet3.camp in Chrome browser', sub: 'Make sure you\'re using Google Chrome' },
      { icon: <Menu size={18} />, text: 'Tap the three-dot menu (⋮)', sub: 'Top-right corner of Chrome' },
      { icon: <Download size={18} />, text: 'Tap "Add to Home screen"', sub: 'Or "Install app" if you see that option' },
      { icon: <CheckCircle2 size={18} />, text: 'Confirm by tapping "Add"', sub: 'The app icon will appear on your home screen' },
    ],
  },
  ios: {
    title: 'iPhone / iPad — Safari',
    steps: [
      { icon: <Smartphone size={18} />, text: 'Open wet3.camp in Safari', sub: 'Must use Safari — Chrome on iOS doesn\'t support this' },
      { icon: <Share2 size={18} />, text: 'Tap the Share button (□↑)', sub: 'Bottom toolbar in Safari' },
      { icon: <Plus size={18} />, text: 'Scroll down and tap "Add to Home Screen"', sub: 'Look for the + square icon' },
      { icon: <CheckCircle2 size={18} />, text: 'Tap "Add" in the top-right corner', sub: 'The app icon appears on your home screen immediately' },
    ],
  },
  desktop: {
    title: 'Desktop — Chrome / Edge',
    steps: [
      { icon: <Chrome size={18} />, text: 'Open wet3.camp in Chrome or Edge', sub: 'Firefox doesn\'t support PWA installation' },
      { icon: <Download size={18} />, text: 'Click the install icon in the address bar', sub: 'Small computer/download icon on the right of the URL bar' },
      { icon: <CheckCircle2 size={18} />, text: 'Click "Install" in the popup', sub: 'Wet3 Camp will open as a standalone app' },
      { icon: <Star size={18} />, text: 'Pin the app to your taskbar or dock', sub: 'Right-click the app icon for more options' },
    ],
  },
}

const FEATURES = [
  { icon: <Zap size={18} className="text-[#FFD700]" />, title: 'Lightning Fast', desc: 'Loads instantly, even on slow connections' },
  { icon: <Wifi size={18} className="text-[#28a745]" />, title: 'Works Offline', desc: 'Browse previously loaded profiles offline' },
  { icon: <Bell size={18} className="text-[#FF4500]" />, title: 'Push Notifications', desc: 'Get notified when escorts come online' },
  { icon: <Lock size={18} className="text-[#229ED9]" />, title: 'Private & Secure', desc: 'No Play Store — direct, private installation' },
]

export default function InstallPage() {
  useSEO({
    title: 'Install Wet3 Camp — Download Our App',
    description: 'Install the Wet3 Camp app directly on your phone or desktop. No Play Store needed. Fast, private, and works offline.',
    canonicalPath: '/install',
  })

  const [platform, setPlatform] = useState<Platform>('android')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)
  const [showInstallBtn, setShowInstallBtn] = useState(false)

  useEffect(() => {
    setPlatform(detectPlatform())

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBtn(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setShowInstallBtn(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      setShowInstallBtn(false)
    }
    setDeferredPrompt(null)
  }

  const instructions = INSTRUCTIONS[platform]

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Hero */}
        <div className="w-full px-5 sm:px-8 py-10 border-b border-color text-center" style={{ background: 'linear-gradient(135deg, #8B000015, #FFD70010)' }}>
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-[#8B0000]/30">
            <Smartphone size={36} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-light mb-2">Install Wet3 Camp</h1>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            Get the full app experience directly on your device. No Play Store. No App Store. Just tap and install.
          </p>

          {installed ? (
            <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#28a745]/20 border border-[#28a745]/40 rounded-2xl text-[#28a745] font-bold">
              <CheckCircle2 size={18} /> App installed successfully!
            </div>
          ) : showInstallBtn ? (
            <button
              onClick={handleInstallClick}
              className="mt-6 px-8 py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-black rounded-2xl hover:shadow-xl hover:shadow-[#8B0000]/30 transition-all text-sm flex items-center gap-2 mx-auto"
            >
              <Download size={17} /> Install Now — It's Free
            </button>
          ) : (
            <p className="mt-5 text-xs text-text-muted">Follow the steps below for your device ↓</p>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* Features */}
          <div>
            <h2 className="text-lg font-black text-text-light mb-4 text-center">Why Install the App?</h2>
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <div key={f.title} className="bg-card-bg border border-color rounded-2xl p-4">
                  <div className="mb-2">{f.icon}</div>
                  <p className="font-bold text-text-light text-sm">{f.title}</p>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform tabs */}
          <div>
            <h2 className="text-lg font-black text-text-light mb-4 text-center">Install Instructions</h2>

            <div className="flex gap-1 p-1 bg-dark-bg rounded-xl border border-color mb-5">
              {([
                { key: 'android' as Platform, label: 'Android', icon: <Smartphone size={14} /> },
                { key: 'ios' as Platform,     label: 'iPhone / iPad', icon: <Smartphone size={14} /> },
                { key: 'desktop' as Platform, label: 'Desktop', icon: <Monitor size={14} /> },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setPlatform(t.key)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${platform === t.key ? 'bg-card-bg text-text-light border border-color' : 'text-text-muted hover:text-text-light'}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-color bg-dark-bg">
                <p className="text-xs font-bold text-[#FFD700]">{instructions.title}</p>
              </div>
              <div className="divide-y divide-color">
                {instructions.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4">
                    <div className="w-8 h-8 rounded-xl bg-[#8B0000]/15 border border-[#8B0000]/20 flex items-center justify-center text-[#8B0000] flex-shrink-0 mt-0.5">
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-light">{step.text}</p>
                      {step.sub && <p className="text-[11px] text-text-muted mt-0.5">{step.sub}</p>}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#8B0000] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {platform === 'ios' && (
              <div className="mt-3 p-4 bg-[#229ED9]/10 border border-[#229ED9]/20 rounded-2xl text-xs text-text-muted">
                <p className="font-bold text-[#229ED9] mb-1">⚠️ iPhone tip:</p>
                <p>You <strong>must</strong> use Safari on iPhone/iPad — Chrome and other browsers on iOS don't support Add to Home Screen.</p>
              </div>
            )}
          </div>

          {/* QR code placeholder */}
          <div className="bg-card-bg border border-color rounded-2xl p-6 flex items-center gap-5">
            <div className="w-20 h-20 bg-dark-bg border-2 border-dashed border-color rounded-2xl flex items-center justify-center flex-shrink-0">
              <div className="text-center">
                <p className="text-[9px] text-text-muted font-mono leading-tight">WET3.CAMP</p>
              </div>
            </div>
            <div>
              <p className="font-black text-text-light text-sm">Share with a Friend</p>
              <p className="text-xs text-text-muted mt-1">Send them this link:</p>
              <a href="https://wet3.camp/install" className="text-xs text-[#FFD700] hover:underline font-mono mt-1 block">https://wet3.camp/install</a>
              <button
                onClick={() => navigator.clipboard?.writeText('https://wet3.camp/install')}
                className="mt-2 px-3 py-1 bg-dark-bg border border-color text-xs text-text-muted rounded-lg hover:border-text-muted transition-all"
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="text-sm font-bold text-text-light mb-3">Common Questions</h3>
            <div className="space-y-2">
              {[
                { q: 'Is it safe to install?', a: 'Yes. This is a PWA (Progressive Web App) — it\'s just a shortcut that opens our website in full-screen mode. No virus risk, no hidden permissions.' },
                { q: 'Will it use up my storage?', a: 'Very little — typically under 5MB. It only stores the app icon and some cached data for offline use.' },
                { q: 'How do I uninstall it?', a: 'Same as any app — press and hold the icon, then tap "Remove" or "Uninstall". On desktop, right-click and uninstall.' },
                { q: 'Does it send me ads?', a: 'No. We only send notifications when you enable them, and only for things you care about (new messages, escorts online, etc.).' },
              ].map((faq, i) => (
                <div key={i} className="bg-card-bg border border-color rounded-xl p-4">
                  <p className="text-sm font-bold text-text-light">{faq.q}</p>
                  <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
