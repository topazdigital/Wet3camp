'use client'

import React, { useState, useEffect } from 'react'
import { LogOut, BarChart3, Users, ShieldAlert, Eye, DollarSign, Settings, Bell, TrendingUp, Check, X, AlertCircle, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AdminStats {
  totalUsers: number
  totalEscorts: number
  totalClients: number
  totalBookings: number
  totalRevenue: number
  pendingApprovals: number
  activeListings: number
  totalReports: number
  conversionRate: number
  avgBookingValue: number
}

interface PendingApproval {
  id: string
  username: string
  email: string
  type: 'escort' | 'photo' | 'video'
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [searchQuery, setSearchQuery] = useState('')

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
    fetchPendingApprovals(token)
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
      console.error('[v0] Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingApprovals = async (token: string) => {
    try {
      const res = await fetch('/api/admin/approvals/pending', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setPendingApprovals(data)
      }
    } catch (error) {
      console.error('[v0] Failed to fetch pending approvals:', error)
    }
  }

  const handleApprove = async (approvalId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/admin/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setPendingApprovals(prev => prev.map(p => p.id === approvalId ? { ...p, status: 'approved' } : p))
      }
    } catch (error) {
      console.error('[v0] Approval failed:', error)
    }
  }

  const handleReject = async (approvalId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/admin/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setPendingApprovals(prev => prev.map(p => p.id === approvalId ? { ...p, status: 'rejected' } : p))
      }
    } catch (error) {
      console.error('[v0] Rejection failed:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  if (!user) return null

  const filteredApprovals = pendingApprovals.filter(a => 
    a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <header className="bg-card-bg border-b border-color sticky top-0 z-40">
        <div className="w-full px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-gradient-to-br from-primary-color to-secondary-color flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} className="sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-text-light text-sm sm:text-base">Admin Panel</h1>
              <p className="text-xs text-text-muted">Wet3Camp Management</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary-color hover:bg-opacity-90 text-white rounded text-xs sm:text-sm font-medium transition flex-shrink-0"
          >
            <LogOut size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-color px-3 sm:px-4 py-2 flex gap-2 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'approvals', label: 'Approvals', icon: Check },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'payments', label: 'Payments', icon: DollarSign },
            { id: 'reports', label: 'Reports', icon: AlertCircle },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition whitespace-nowrap flex-shrink-0 ${
                activeTab === id
                  ? 'bg-primary-color text-white'
                  : 'text-text-light hover:text-secondary-color'
              }`}
            >
              <Icon size={14} className="sm:w-4 sm:h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 w-full px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-text-light mb-4">Dashboard Overview</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary-color border-t-transparent rounded-full" />
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
                  {[
                    { label: 'Total Users', value: stats.totalUsers, color: 'bg-blue-500/20 text-blue-400', icon: Users },
                    { label: 'Escorts', value: stats.totalEscorts, color: 'bg-purple-500/20 text-purple-400', icon: Eye },
                    { label: 'Clients', value: stats.totalClients, color: 'bg-green-500/20 text-green-400', icon: Users },
                    { label: 'Bookings', value: stats.totalBookings, color: 'bg-pink-500/20 text-pink-400', icon: Check },
                    { label: 'Revenue', value: `KES ${(stats.totalRevenue / 1000).toFixed(1)}k`, color: 'bg-yellow-500/20 text-yellow-400', icon: DollarSign },
                    { label: 'Pending', value: stats.pendingApprovals, color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
                    { label: 'Active', value: stats.activeListings, color: 'bg-cyan-500/20 text-cyan-400', icon: TrendingUp },
                    { label: 'Reports', value: stats.totalReports, color: 'bg-orange-500/20 text-orange-400', icon: Eye },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className={`${color} rounded-lg p-3 flex items-center gap-2`}>
                      <Icon size={18} className="flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium opacity-75">{label}</p>
                        <p className="text-lg sm:text-xl font-bold">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-card-bg rounded-lg p-4 border border-color">
                    <p className="text-text-muted text-sm mb-1">Conversion Rate</p>
                    <p className="text-2xl font-bold text-secondary-color">{stats.conversionRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-card-bg rounded-lg p-4 border border-color">
                    <p className="text-text-muted text-sm mb-1">Avg Booking Value</p>
                    <p className="text-2xl font-bold text-secondary-color">KES {stats.avgBookingValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-card-bg rounded-lg p-4 border border-color">
                    <p className="text-text-muted text-sm mb-1">Platform Commission</p>
                    <p className="text-2xl font-bold text-green-400">10%</p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-bold text-text-light">Pending Approvals</h2>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-2.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-dark-bg border border-color rounded text-xs text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredApprovals.length === 0 ? (
                <div className="bg-card-bg rounded-lg p-8 text-center text-text-muted">
                  <Bell size={24} className="mx-auto mb-2 opacity-50" />
                  <p>No pending approvals</p>
                </div>
              ) : (
                filteredApprovals.map((approval) => (
                  <div key={approval.id} className="bg-card-bg rounded-lg p-4 border border-color flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-light text-sm truncate">{approval.username}</p>
                      <p className="text-xs text-text-muted truncate">{approval.email}</p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs bg-primary-color/20 text-primary-color px-2 py-1 rounded">{approval.type}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          approval.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                          approval.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {approval.status}
                        </span>
                      </div>
                    </div>
                    {approval.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(approval.id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition flex items-center gap-1"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(approval.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition flex items-center gap-1"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-text-light mb-4">User Management</h2>
            <div className="bg-card-bg rounded-lg p-6 sm:p-8 text-center text-text-muted border border-color">
              <Users size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">User management interface with search, filter, suspend, delete capabilities</p>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-text-light mb-4">Payment Management</h2>
            <div className="bg-card-bg rounded-lg p-6 sm:p-8 text-center text-text-muted border border-color">
              <DollarSign size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">View transactions, process payouts, dispute resolution</p>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-text-light mb-4">Reports & Analytics</h2>
            <div className="bg-card-bg rounded-lg p-6 sm:p-8 text-center text-text-muted border border-color">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Spam, scam reports, and platform analytics</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-text-light mb-4">Platform Settings</h2>
            <div className="space-y-4">
              {[
                { label: 'Commission Rate', value: '10%', type: 'decimal' },
                { label: 'Payment Gateway Fee', value: '2.5%', type: 'decimal' },
                { label: 'Minimum Withdrawal', value: 'KES 500', type: 'currency' },
                { label: 'Deposit Requirement', value: '50%', type: 'percentage' },
              ].map((setting) => (
                <div key={setting.label} className="bg-card-bg rounded-lg p-4 border border-color flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-light text-sm">{setting.label}</p>
                    <p className="text-xs text-text-muted">Type: {setting.type}</p>
                  </div>
                  <input
                    type="text"
                    defaultValue={setting.value}
                    className="px-3 py-2 bg-dark-bg border border-color rounded text-xs text-text-light focus:outline-none focus:border-secondary-color"
                  />
                </div>
              ))}
              <button className="w-full py-2.5 bg-secondary-color text-black font-medium rounded hover:bg-opacity-90 transition text-sm">
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
