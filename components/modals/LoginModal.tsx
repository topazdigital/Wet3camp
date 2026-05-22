'use client'

import React, { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'username'>('email')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password, loginMethod }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      // Save token to localStorage
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Reload page
      window.location.href = '/'
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Login to Wet3</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {['email', 'phone', 'username'].map((method) => (
              <button
                key={method}
                onClick={() => setLoginMethod(method as 'email' | 'phone' | 'username')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded transition ${
                  loginMethod === method
                    ? 'bg-primary-color text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                {loginMethod === 'email' ? 'Email' : loginMethod === 'phone' ? 'Phone' : 'Username'}
              </label>
              <input
                type={loginMethod === 'email' ? 'email' : 'text'}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder={`Enter your ${loginMethod}`}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-color"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-color"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-color text-white rounded font-medium text-sm hover:bg-opacity-90 disabled:opacity-50 transition"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                className="text-xs text-primary-color hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
