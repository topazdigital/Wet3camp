'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, Flag, Gift, ChevronLeft, Star, MapPin, Award, Zap } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

interface ProfileData {
  id: number
  name: string
  age: number
  location: string
  city: string
  rating: number
  reviews: number
  image: string
  images: string[]
  tier: 'free' | 'standard' | 'premium' | 'vip' | 'elite'
  price: number
  bio: string
  verified: boolean
  available: boolean
  followers: number
  following: number
  posts: number
  saved: boolean
  followed: boolean
}

const mockProfile: ProfileData = {
  id: 1,
  name: 'Amara',
  age: 23,
  location: 'Nairobi CBD',
  city: 'Nairobi',
  rating: 4.9,
  reviews: 156,
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=700&fit=crop',
  images: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=700&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=700&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=700&fit=crop',
  ],
  tier: 'elite',
  price: 5000,
  bio: 'Let me sit on your face with my big boobs. I want someone obsessed with making me shake, moan, lose control and beg for more until I cant even think straight anymore. Such your dick till you cum and make you have a memorable experience. I&apos;m stress free and appreciate stress free people.',
  verified: true,
  available: true,
  followers: 21,
  following: 0,
  posts: 0,
  saved: false,
  followed: false,
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [profile, setProfile] = useState<ProfileData>(mockProfile)
  const [showMessage, setShowMessage] = useState(false)
  const [messageText, setMessageText] = useState('')

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % profile.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + profile.images.length) % profile.images.length)
  }

  const toggleFavorite = () => {
    setProfile(prev => ({ ...prev, saved: !prev.saved }))
  }

  const toggleFollow = () => {
    setProfile(prev => ({
      ...prev,
      followed: !prev.followed,
      followers: prev.followed ? prev.followers - 1 : prev.followers + 1,
    }))
  }

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log('Message sent:', messageText)
      setMessageText('')
      setShowMessage(false)
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg flex">
      <Sidebar />
      
      <div className="flex-1 ml-20 lg:ml-64">
        <Header />
        
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 text-secondary-color hover:text-text-light mb-6 transition">
            <ChevronLeft size={20} />
            Back to Profiles
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Photo Section */}
            <div className="lg:col-span-2">
              <div className="relative bg-card-bg rounded-xl overflow-hidden mb-4">
                {/* Image Carousel */}
                <div className="relative w-full h-96 sm:h-[500px]">
                  <img
                    src={profile.images[currentImageIndex]}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image Navigation */}
                  {profile.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition z-10"
                      >
                        <ChevronLeft size={24} className="text-white" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition z-10"
                      >
                        <ChevronLeft size={24} className="text-white rotate-180" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 rounded-full text-white text-sm font-medium">
                    {currentImageIndex + 1} / {profile.images.length}
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                <div className="flex gap-2 p-3 bg-darker-bg">
                  {profile.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-16 h-16 rounded overflow-hidden border-2 transition ${
                        idx === currentImageIndex ? 'border-secondary-color' : 'border-gray-700'
                      }`}
                    >
                      <img src={img} alt={`${profile.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={toggleFavorite}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                    profile.saved
                      ? 'bg-secondary-color text-black'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  <Heart size={18} fill={profile.saved ? 'currentColor' : 'none'} />
                  {profile.saved ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={() => setShowMessage(!showMessage)}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition"
                >
                  <MessageCircle size={18} />
                  Message
                </button>
              </div>

              {/* Message Input */}
              {showMessage && (
                <div className="bg-card-bg rounded-lg p-4 mb-6">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 bg-darker-bg text-text-light rounded border border-gray-700 focus:border-secondary-color outline-none mb-3 resize-none h-24"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="w-full py-2 bg-secondary-color text-black font-medium rounded hover:bg-opacity-90 disabled:opacity-50 transition"
                  >
                    Send Message
                  </button>
                </div>
              )}

              {/* Additional Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-card-bg text-text-light hover:bg-gray-700 transition">
                  <Gift size={18} />
                  <span className="text-sm">Tip</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-card-bg text-text-light hover:bg-gray-700 transition">
                  <Share2 size={18} />
                  <span className="text-sm">Share</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition">
                  <Flag size={18} />
                  <span className="text-sm">Report</span>
                </button>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-1">
              {/* Header Card */}
              <div className="bg-card-bg rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-3xl font-bold text-text-light">{profile.name}</h1>
                    <p className="text-text-muted text-sm">{profile.age} years old</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-white text-xs font-bold ${
                    profile.tier === 'elite' ? 'bg-red-600' : 'bg-orange-500'
                  }`}>
                    {profile.tier.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-secondary-color" />
                  <span className="text-text-light text-sm">{profile.location}</span>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  <Star size={16} className="fill-secondary-color text-secondary-color" />
                  <span className="font-bold text-text-light">{profile.rating}</span>
                  <span className="text-text-muted text-sm">({profile.reviews} reviews)</span>
                </div>

                {profile.verified && (
                  <div className="flex items-center gap-2 p-2 bg-green-900/30 rounded mb-3">
                    <Award size={16} className="text-green-400" />
                    <span className="text-green-400 text-xs font-medium">Verified Profile</span>
                  </div>
                )}

                {profile.available && (
                  <div className="flex items-center gap-2 p-2 bg-green-900/30 rounded">
                    <Zap size={16} className="text-green-400" />
                    <span className="text-green-400 text-xs font-medium">Available Now</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-card-bg rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-secondary-color">{profile.posts}</div>
                  <div className="text-xs text-text-muted">Posts</div>
                </div>
                <div className="bg-card-bg rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-secondary-color">{profile.followers}</div>
                  <div className="text-xs text-text-muted">Followers</div>
                </div>
                <div className="bg-card-bg rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-secondary-color">{profile.following}</div>
                  <div className="text-xs text-text-muted">Following</div>
                </div>
              </div>

              {/* Follow Button */}
              <button
                onClick={toggleFollow}
                className={`w-full py-3 rounded-lg font-medium mb-4 transition ${
                  profile.followed
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-secondary-color text-black hover:bg-opacity-90'
                }`}
              >
                {profile.followed ? 'Following' : 'Follow'}
              </button>

              {/* Price */}
              <div className="bg-card-bg rounded-lg p-4 mb-4">
                <div className="text-2xl font-bold text-secondary-color mb-2">
                  KES {profile.price.toLocaleString()}/hour
                </div>
                <button className="w-full py-2.5 bg-secondary-color text-black font-bold rounded hover:bg-opacity-90 transition">
                  Book Now
                </button>
              </div>

              {/* About */}
              <div className="bg-card-bg rounded-lg p-4">
                <h3 className="text-lg font-bold text-text-light mb-2">About</h3>
                <p className="text-text-muted text-sm leading-relaxed">{profile.bio}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
