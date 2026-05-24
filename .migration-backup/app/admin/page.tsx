'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Plus, Trash2, Edit2, Shield, User } from 'lucide-react'

interface Moderator {
  id: number
  name: string
  email: string
  role: 'moderator' | 'admin' | 'super_admin'
  level: 1 | 2 | 3 // 1 = basic, 2 = advanced, 3 = full
  status: 'active' | 'inactive'
  createdAt: string
}

const ADMIN_CREDENTIALS = {
  email: 'admin@wet3camp.com',
  password: 'Admin@Wet3Camp2024',
}

export default function AdminDashboard() {
  const [moderators, setModerators] = useState<Moderator[]>([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah@wet3camp.com',
      role: 'admin',
      level: 3,
      status: 'active',
      createdAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike@wet3camp.com',
      role: 'moderator',
      level: 2,
      status: 'active',
      createdAt: '2024-02-20',
    },
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'moderator' as const,
    level: 1 as const,
  })

  const handleAddModerator = () => {
    if (formData.name && formData.email) {
      const newModerator: Moderator = {
        id: Math.max(...moderators.map(m => m.id), 0) + 1,
        ...formData,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      }
      setModerators([...moderators, newModerator])
      setFormData({ name: '', email: '', role: 'moderator', level: 1 })
      setShowAddForm(false)
    }
  }

  const handleDeleteModerator = (id: number) => {
    setModerators(moderators.filter(m => m.id !== id))
  }

  const handleToggleStatus = (id: number) => {
    setModerators(
      moderators.map(m =>
        m.id === id
          ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' }
          : m
      )
    )
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-elite-color text-white'
      case 'admin':
        return 'bg-vip-color text-white'
      default:
        return 'bg-premium-color text-black'
    }
  }

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 3:
        return 'Level 3 - Full Access'
      case 2:
        return 'Level 2 - Advanced'
      default:
        return 'Level 1 - Basic'
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden transition-all duration-300 lg:pb-0 pb-24">
        <Header />

        <div className="w-full px-3 sm:px-4 py-6">
          {/* Admin Credentials Section */}
          <div className="mb-8 bg-card-bg rounded-lg border border-color p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={24} className="text-elite-color" />
              <h1 className="text-2xl font-bold text-text-light">Admin Credentials</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-dark-bg rounded p-3 border border-color">
                <p className="text-xs text-text-muted mb-1">Email</p>
                <p className="text-sm font-mono text-text-light break-all">{ADMIN_CREDENTIALS.email}</p>
              </div>
              <div className="bg-dark-bg rounded p-3 border border-color">
                <p className="text-xs text-text-muted mb-1">Password</p>
                <p className="text-sm font-mono text-text-light">{ADMIN_CREDENTIALS.password}</p>
              </div>
            </div>
            <p className="text-xs text-available-orange mt-3 font-semibold">Keep these credentials secure!</p>
          </div>

          {/* Moderators Section */}
          <div className="bg-card-bg rounded-lg border border-color overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-color">
              <div>
                <h2 className="text-xl font-bold text-text-light flex items-center gap-2">
                  <User size={20} />
                  Moderator Management
                </h2>
                <p className="text-xs text-text-muted mt-1">{moderators.length} moderators</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-color text-black rounded font-semibold hover:bg-opacity-90 transition text-sm"
              >
                <Plus size={18} />
                Add Moderator
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="p-4 sm:p-6 border-b border-color bg-dark-bg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="px-3 py-2 bg-card-bg border border-color rounded text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="px-3 py-2 bg-card-bg border border-color rounded text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color text-sm"
                  />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'moderator' | 'admin' })}
                    className="px-3 py-2 bg-card-bg border border-color rounded text-text-light focus:outline-none focus:border-secondary-color text-sm"
                  >
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) as 1 | 2 | 3 })}
                    className="px-3 py-2 bg-card-bg border border-color rounded text-text-light focus:outline-none focus:border-secondary-color text-sm"
                  >
                    <option value="1">Level 1 - Basic</option>
                    <option value="2">Level 2 - Advanced</option>
                    <option value="3">Level 3 - Full Access</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddModerator}
                    className="px-4 py-2 bg-available-green text-white rounded font-semibold hover:opacity-90 transition text-sm"
                  >
                    Save Moderator
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-color text-text-light rounded font-semibold hover:opacity-90 transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Moderators List */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-bg border-b border-color">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-light">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-light">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-light">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-light">Level</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-light">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-light">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {moderators.map((mod) => (
                    <tr key={mod.id} className="border-b border-color hover:bg-dark-bg transition">
                      <td className="px-4 py-3 text-text-light">{mod.name}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{mod.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleColor(mod.role)}`}>
                          {mod.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-light text-xs">{getLevelBadge(mod.level)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(mod.id)}
                          className={`px-2 py-1 rounded text-xs font-semibold transition ${
                            mod.status === 'active'
                              ? 'bg-available-green text-white'
                              : 'bg-no-color text-white'
                          }`}
                        >
                          {mod.status.toUpperCase()}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="p-1.5 text-text-light hover:bg-dark-bg rounded transition" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteModerator(mod.id)}
                            className="p-1.5 text-no-color hover:bg-dark-bg rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permissions Reference */}
          <div className="mt-8 bg-card-bg rounded-lg border border-color p-4 sm:p-6">
            <h3 className="text-lg font-bold text-text-light mb-4">Access Level Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-bg rounded p-4 border border-color">
                <p className="font-semibold text-premium-color mb-2">Level 1 - Basic</p>
                <ul className="text-xs text-text-muted space-y-1">
                  <li>View profiles</li>
                  <li>Mark profiles as spam</li>
                  <li>Basic reports</li>
                </ul>
              </div>
              <div className="bg-dark-bg rounded p-4 border border-color">
                <p className="font-semibold text-vip-color mb-2">Level 2 - Advanced</p>
                <ul className="text-xs text-text-muted space-y-1">
                  <li>Level 1 permissions +</li>
                  <li>Remove listings</li>
                  <li>Suspend users (24hrs)</li>
                  <li>Advanced analytics</li>
                </ul>
              </div>
              <div className="bg-dark-bg rounded p-4 border border-color">
                <p className="font-semibold text-elite-color mb-2">Level 3 - Full Access</p>
                <ul className="text-xs text-text-muted space-y-1">
                  <li>All Level 2 permissions +</li>
                  <li>Ban users permanently</li>
                  <li>Manage moderators</li>
                  <li>System configuration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
