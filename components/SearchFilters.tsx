'use client'

import React, { useState } from 'react'
import { Search, MapPin, Filter, ChevronDown } from 'lucide-react'

export default function SearchFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedRating, setSelectedRating] = useState('all')

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'elite', label: 'Elite', color: 'bg-elite-color' },
    { id: 'vip', label: 'VIP', color: 'bg-vip-color' },
    { id: 'premium', label: 'Premium', color: 'bg-premium-color' },
    { id: 'standard', label: 'Standard', color: 'bg-available-green' },
  ]

  const ratings = [
    { id: 'all', label: 'All Ratings' },
    { id: '5', label: '5 Stars' },
    { id: '4', label: '4+ Stars' },
    { id: '3', label: '3+ Stars' },
  ]

  return (
    <section className="bg-card-bg border-b border-color py-8">
      <div className="container mx-auto px-4">
        {/* Main Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Search by name, location, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-market-bg border border-market-border rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color transition"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-text-muted text-sm mb-2 flex items-center gap-2">
              <Filter size={16} />
              Category
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-market-bg border border-market-border rounded-lg text-text-light appearance-none focus:outline-none focus:border-secondary-color transition cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
            </div>
          </div>

          {/* Rating Filter */}
          <div className="flex-1">
            <label className="block text-text-muted text-sm mb-2">Rating</label>
            <div className="relative">
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full px-4 py-2 bg-market-bg border border-market-border rounded-lg text-text-light appearance-none focus:outline-none focus:border-secondary-color transition cursor-pointer"
              >
                {ratings.map((rating) => (
                  <option key={rating.id} value={rating.id}>
                    {rating.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
            </div>
          </div>

          {/* Location Filter */}
          <div className="flex-1">
            <label className="block text-text-muted text-sm mb-2 flex items-center gap-2">
              <MapPin size={16} />
              Location
            </label>
            <input
              type="text"
              placeholder="City or area..."
              className="w-full px-4 py-2 bg-market-bg border border-market-border rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color transition"
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button className="w-full px-6 py-2 bg-primary-color hover:bg-opacity-90 text-white rounded-lg font-medium transition">
              Search
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="text-text-muted text-sm">Quick Filter:</span>
          {categories.slice(1).map((cat) => (
            <button
              key={cat.id}
              className="px-4 py-1 bg-market-bg border border-market-border rounded-full text-text-light text-sm hover:border-secondary-color transition"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
