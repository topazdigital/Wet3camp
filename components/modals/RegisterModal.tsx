'use client'

import React, { useState, useEffect } from 'react'
import { X, ChevronRight, Upload, Eye, EyeOff } from 'lucide-react'

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
    confirmEmail: '',
    phone: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    country: '',
    state: '',
    city: '',
    dateOfBirth: '',
    gender: '',
    bio: '',
    approvalPhotoFile: null as File | null,
  })
  const [otpCode, setOtpCode] = useState(['', '', '', ''])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otpCode]
    newOtp[index] = value.slice(0, 1)
    setOtpCode(newOtp)
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleUserTypeSelect = (type: 'escort' | 'client' | 'advertiser') => {
    setUserType(type)
    setStep(2)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, approvalPhotoFile: file }))
    }
  }

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  
  const validatePassword = (pwd: string) => pwd.length >= 8

  const sendOtp = async () => {
    setError('')
    if (!validateEmail(formData.email)) {
      setError('Please enter valid email')
      return
    }
    setLoading(true)
    try {
      // Simulate OTP sending
      setTimeout(() => {
        setOtpSent(true)
        setLoading(false)
      }, 1000)
    } catch (err) {
      setError('Failed to send OTP')
      setLoading(false)
    }
  }

  const verifyOtp = () => {
    const otp = otpCode.join('')
    if (otp.length !== 4) {
      setError('Please enter 4 digit code')
      return
    }
    // Simulate OTP verification
    if (otp === '1234' || true) { // For demo, accept any code
      setOtpVerified(true)
      setError('')
      setStep(4)
    } else {
      setError('Invalid OTP code')
    }
  }

  const isValidStep = () => {
    switch(step) {
      case 2:
        return formData.username && formData.email && formData.confirmEmail === formData.email && 
               validatePassword(formData.password) && formData.confirmPassword === formData.password &&
               formData.displayName && formData.phone
      case 4:
        return formData.country && formData.state && formData.city && formData.dateOfBirth && formData.gender
      case 5:
        return formData.bio.length > 10
      case 6:
        return userType === 'escort' ? formData.approvalPhotoFile !== null : true
      default:
        return true
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!userType || !isValidStep()) {
      setError('Please complete all required fields')
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
          loginMethod: 'email',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.location.href = '/'
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Step 1: User Type Selection
  const renderStep1 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Choose your role</h3>
      {[
        { type: 'escort', icon: '👩', label: 'I&apos;m a Service Provider', desc: 'Offer your services' },
        { type: 'client', icon: '👨', label: 'I&apos;m a Client', desc: 'Browse & book services' },
        { type: 'advertiser', icon: '📢', label: 'I&apos;m an Advertiser', desc: 'Promote your business' },
      ].map(({ type, icon, label, desc }) => (
        <button
          key={type}
          onClick={() => handleUserTypeSelect(type as 'escort' | 'client' | 'advertiser')}
          className="w-full p-3 border-2 border-gray-200 hover:border-red-500 rounded transition flex items-center justify-between group"
        >
          <div className="text-left">
            <div className="text-2xl">{icon}</div>
            <div className="text-sm font-medium text-gray-900">{label}</div>
            <div className="text-xs text-gray-500">{desc}</div>
          </div>
          <ChevronRight size={18} className="text-gray-400 group-hover:text-red-500" />
        </button>
      ))}
    </div>
  )

  // Step 2: Account Details
  const renderStep2 = () => (
    <form onSubmit={(e) => { e.preventDefault(); setStep(3) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Username*</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="Enter here"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email ID*</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter Email"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Email ID*</label>
          <input
            type="email"
            value={formData.confirmEmail}
            onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
            placeholder="Re-enter Email"
            className={`w-full px-3 py-2 border rounded text-sm focus:outline-none ${
              formData.confirmEmail && formData.email !== formData.confirmEmail ? 'border-red-500' : 'border-gray-300 focus:border-red-500'
            }`}
            required
          />
          {formData.confirmEmail && formData.email !== formData.confirmEmail && (
            <p className="text-xs text-red-500 mt-1">Email addresses match</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Create Password*</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 pr-9 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2.5 text-gray-500"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Re-enter Password*</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Confirm password"
            className={`w-full px-3 py-2 pr-9 border rounded text-sm focus:outline-none ${
              formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500' : 'border-gray-300 focus:border-red-500'
            }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-2.5 text-gray-500"
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Display Name*</label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            placeholder="Enter here"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Number*</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="e.g. 0801234567"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
            required
          />
        </div>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <button
        type="submit"
        disabled={loading || !isValidStep()}
        className="w-full py-2.5 bg-red-500 text-white rounded font-medium text-sm hover:bg-red-600 disabled:opacity-50"
      >
        Next
      </button>
      <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-gray-600 hover:text-gray-900">
        Back
      </button>
    </form>
  )

  // Step 3: Email Verification
  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-2">Email Verification</h3>
        {!otpSent ? (
          <p className="text-xs text-gray-600 mb-4">
            Verify your email by clicking the link we sent or enter the code below.
          </p>
        ) : (
          <p className="text-xs text-gray-600 mb-4">
            We have shared a 4 digit verification code on your email <strong>{formData.email}</strong>
          </p>
        )}
      </div>

      {!otpSent ? (
        <button
          onClick={sendOtp}
          disabled={loading}
          className="w-full py-2.5 bg-red-500 text-white rounded font-medium text-sm hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Enter Code</label>
            <div className="flex gap-2">
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-12 h-12 border border-gray-300 rounded text-center text-lg font-bold focus:outline-none focus:border-red-500"
                />
              ))}
            </div>
          </div>

          <button
            onClick={verifyOtp}
            className="w-full py-2.5 bg-red-500 text-white rounded font-medium text-sm hover:bg-red-600"
          >
            Verify
          </button>

          <div className="text-center">
            <span className="text-xs text-gray-600">
              Didn&apos;t get otp?{' '}
              <button className="text-red-500 hover:text-red-600 font-semibold">
                Resend code
              </button>
            </span>
          </div>
        </>
      )}

      {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <button type="button" onClick={() => setStep(2)} className="w-full text-xs text-gray-600 hover:text-gray-900">
        Back
      </button>
    </div>
  )

  // Step 4: Personal Details
  const renderStep4 = () => (
    <form onSubmit={(e) => { e.preventDefault(); setStep(5) }} className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Personal Details</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Country*</label>
          <select
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
            required
          >
            <option value="">Select</option>
            <option value="Kenya">Kenya</option>
            <option value="Uganda">Uganda</option>
            <option value="Tanzania">Tanzania</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">State*</label>
          <select
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
            required
          >
            <option value="">Select</option>
            <option value="Nairobi">Nairobi</option>
            <option value="Mombasa">Mombasa</option>
            <option value="Kisumu">Kisumu</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">City*</label>
          <select
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
            required
          >
            <option value="">Select</option>
            <option value="Nairobi">Nairobi</option>
            <option value="Mombasa">Mombasa</option>
            <option value="Kisumu">Kisumu</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth*</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Date of birth cannot be changed after registration</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Gender*</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="gender"
              value="Male"
              checked={formData.gender === 'Male'}
              onChange={(e) => handleInputChange('gender', e.target.value)}
            />
            <span className="text-sm">Male</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="gender"
              value="Female"
              checked={formData.gender === 'Female'}
              onChange={(e) => handleInputChange('gender', e.target.value)}
            />
            <span className="text-sm">Female</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">Gender cannot be changed after registration</p>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <button
        type="submit"
        disabled={loading || !isValidStep()}
        className="w-full py-2.5 bg-red-500 text-white rounded font-medium text-sm hover:bg-red-600 disabled:opacity-50"
      >
        Next
      </button>
      <button type="button" onClick={() => setStep(3)} className="w-full text-xs text-gray-600">
        Back
      </button>
    </form>
  )

  // Step 5: Bio/Heading
  const renderStep5 = () => (
    <form onSubmit={(e) => { e.preventDefault(); setStep(userType === 'escort' ? 6 : 7) }} className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Profile Heading</h3>
      <p className="text-xs text-gray-600">In a short sentence, tell your clients what you offer.</p>
      
      <textarea
        value={formData.bio}
        onChange={(e) => handleInputChange('bio', e.target.value)}
        placeholder="In a short sentence, tell your clients what you offer."
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500 resize-none"
        rows={4}
        required
      />
      <p className="text-xs text-gray-500">{formData.bio.length}/200</p>

      {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <button
        type="submit"
        disabled={loading || !isValidStep()}
        className="w-full py-2.5 bg-red-500 text-white rounded font-medium text-sm hover:bg-red-600 disabled:opacity-50"
      >
        {userType === 'escort' ? 'Next: Upload Approval Photo' : 'Complete Registration'}
      </button>
      <button type="button" onClick={() => setStep(4)} className="w-full text-xs text-gray-600">
        Back
      </button>
    </form>
  )

  // Step 6: Approval Photo (Escort Only)
  const renderStep6 = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <h3 className="text-sm font-bold text-gray-900">Approval Photo</h3>
      <p className="text-xs text-gray-600">Please upload a photo holding your ID or passport for verification purposes.</p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-500 transition cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
          id="approval-photo"
          required
        />
        <label htmlFor="approval-photo" className="cursor-pointer">
          <Upload size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            {formData.approvalPhotoFile ? formData.approvalPhotoFile.name : 'Click to upload photo'}
          </p>
          <p className="text-xs text-gray-500">PNG, JPG or GIF (max 10MB)</p>
        </label>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <button
        type="submit"
        disabled={loading || !formData.approvalPhotoFile}
        className="w-full py-2.5 bg-red-500 text-white rounded font-medium text-sm hover:bg-red-600 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Verify Details'}
      </button>
      <button type="button" onClick={() => setStep(5)} className="w-full text-xs text-gray-600">
        Back
      </button>
    </form>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg my-8">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">
            {step === 1 ? 'Choose Account Type' : `Step ${step}/6`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        {step > 1 && (
          <div className="flex gap-1 px-4 pt-3">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition ${
                  s < step ? 'bg-red-500' : s === step ? 'bg-red-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        <div className="overflow-y-auto max-h-[calc(100vh-200px)] p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && userType === 'escort' && renderStep6()}
        </div>
      </div>
    </div>
  )
}
