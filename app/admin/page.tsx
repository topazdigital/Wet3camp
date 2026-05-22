'use client'

import React, { useState, useEffect } from 'react'
import { LogOut, BarChart3, Users, ShieldAlert, Eye } from 'lucide-react'

interface AdminStats {
  users: number
  escorts: number
  clients: number
  advertisers: number
  bookings: number
  pendingVerifications: number
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('auth_token')

    if (!userData || !token) {
      window.location.href = '/'
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.user_type !== 'admin') {
      window.location.href = '/'
      return
    }

    setUser(parsedUser)
    fetchStats(token)
  }, [])

  const fetchStats = async (token: string) => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-card-bg border-b border-color sticky top-0 z-40">
        <div className="max-w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-color to-secondary-color flex items-center justify-center">
              <ShieldAlert size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-text-light">Admin Panel</h1>
              <p className="text-xs text-text-muted">Wet3 Camp Management</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-primary-color hover:bg-opacity-90 text-white rounded text-sm transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-card-bg border-b border-color px-4 py-2 flex gap-4 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'verification', label: 'Verification', icon: ShieldAlert },
          { id: 'reports', label: 'Reports', icon: Eye },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition whitespace-nowrap ${
              activeTab === id
                ? 'bg-primary-color text-white'
                : 'text-text-light hover:text-secondary-color'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-full px-4 py-6">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-lg font-bold text-text-light mb-4">Dashboard Overview</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary-color border-t-transparent rounded-full" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Users', value: stats.users, color: 'bg-blue-500/20 text-blue-400' },
                  { label: 'Escorts', value: stats.escorts, color: 'bg-purple-500/20 text-purple-400' },
                  { label: 'Clients', value: stats.clients, color: 'bg-green-500/20 text-green-400' },
                  { label: 'Advertisers', value: stats.advertisers, color: 'bg-orange-500/20 text-orange-400' },
                  { label: 'Bookings', value: stats.bookings, color: 'bg-pink-500/20 text-pink-400' },
                  { label: 'Pending Verification', value: stats.pendingVerifications, color: 'bg-yellow-500/20 text-yellow-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`${color} rounded-lg p-4`}>
                    <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-lg font-bold text-text-light mb-4">Manage Users</h2>
            <div className="bg-card-bg rounded-lg p-4 text-text-muted text-center">
              User management interface coming soon
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div>
            <h2 className="text-lg font-bold text-text-light mb-4">Verify Users</h2>
            <div className="bg-card-bg rounded-lg p-4 text-text-muted text-center">
              Verification queue coming soon
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <h2 className="text-lg font-bold text-text-light mb-4">Reports & Analytics</h2>
            <div className="bg-card-bg rounded-lg p-4 text-text-muted text-center">
              Reports interface coming soon
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
