'use client'

import React, { useState } from 'react'
import { X, ChevronRight } from 'lucide-react'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<'escort' | 'client' | 'advertiser' | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    displayName: '',
    city: '',
    loginMethod: 'email' as 'email' | 'phone' | 'username',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleUserTypeSelect = (type: 'escort' | 'client' | 'advertiser') => {
    setUserType(type)
    setStep(2)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!userType) {
      setError('Please select user type')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      // Save token
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Reload
      window.location.href = '/'
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Join Wet3 Camp</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            // Step 1: User Type Selection
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Choose your experience</h3>
              {[
                { type: 'escort', icon: '👩', label: 'I\'m a Service Provider', desc: 'Offer your services' },
                { type: 'client', icon: '👨', label: 'I\'m a Client', desc: 'Browse & book services' },
                { type: 'advertiser', icon: '📢', label: 'I\'m an Advertiser', desc: 'Promote your business' },
              ].map(({ type, icon, label, desc }) => (
                <button
                  key={type}
                  onClick={() => handleUserTypeSelect(type as 'escort' | 'client' | 'advertiser')}
                  className="w-full p-3 border-2 border-gray-200 hover:border-primary-color rounded transition flex items-center justify-between group"
                >
                  <div className="text-left">
                    <div className="text-2xl">{icon}</div>
                    <div className="text-sm font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-primary-color" />
                </button>
              ))}
            </div>
          ) : (
            // Step 2: Registration Form
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Username*</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Choose username"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-color"
                  required
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Display Name*</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Public profile name"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-color"
                  required
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City*</label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-color"
                  required
                >
                  <option value="">Select city</option>
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Kisumu">Kisumu</option>
                  <option value="Nakuru">Nakuru</option>
                  <option value="Eldoret">Eldoret</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Login Method Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Choose login method*</label>
                <div className="flex gap-2">
                  {['email', 'phone', 'username'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => handleInputChange('loginMethod', method)}
                      className={`flex-1 py-2 px-2 text-xs rounded font-medium transition ${
                        formData.loginMethod === method
                          ? 'bg-primary-color text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              {formData.loginMethod === 'email' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-color"
                    required
                  />
                </div>
              )}

              {/* Phone */}
              {formData.loginMethod === 'phone' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone*</label>
                  <div className="flex gap-1.5">
                    <select
                      className="w-16 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none"
                      defaultValue="+254"
                    >
                      <option value="+254">+254</option>
                    </select>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="712345678"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-color"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password*</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-color"
                  required
                />
              </div>

              {/* Error */}
              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-secondary-color text-black rounded font-medium text-sm hover:bg-opacity-90 disabled:opacity-50 transition"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs text-gray-600 hover:text-gray-900"
              >
                Back to user type
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
