

import { X } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card-bg rounded-lg border border-color max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-light">Login</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-light transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form className="space-y-4">
          <div>
            <label className="text-sm font-medium text-light block mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 bg-dark-bg border border-color rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-light block mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-3 py-2 bg-dark-bg border border-color rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary-color hover:bg-[#A00000] text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
