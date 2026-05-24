import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { ShoppingCart, Star, Shield, Truck, Lock, Filter, Heart } from 'lucide-react'
import { useSEO } from '@/lib/useSEO'

const PRODUCTS = [
  { id:1, name:'Luxury Silk Set', price:8500, category:'Premium', image:'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=300&h=400&fit=crop', rating:4.8, reviews:124, tag:'Best Seller' },
  { id:2, name:'Beginners Bundle', price:3200, category:'Starter', image:'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&h=400&fit=crop', rating:4.6, reviews:87, tag:null },
  { id:3, name:'Professional Grade Set', price:12000, category:'Premium', image:'https://images.unsplash.com/photo-1551431009-381d36ac3a4b?w=300&h=400&fit=crop', rating:4.9, reviews:201, tag:'Top Rated' },
  { id:4, name:'Discreet Travel Kit', price:4500, category:'Travel', image:'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=300&h=400&fit=crop', rating:4.7, reviews:156, tag:null },
  { id:5, name:'Couples Deluxe Bundle', price:15000, category:'Premium', image:'https://images.unsplash.com/photo-1576091160550-112173faf00e?w=300&h=400&fit=crop', rating:4.8, reviews:98, tag:'New' },
  { id:6, name:'Solo Pleasure Pro', price:6800, category:'Popular', image:'https://images.unsplash.com/photo-1549887534-f2cb8a4e6d1a?w=300&h=400&fit=crop', rating:4.9, reviews:312, tag:'Most Popular' },
  { id:7, name:'Premium Massage Kit', price:5200, category:'Wellness', image:'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=400&fit=crop', rating:4.7, reviews:143, tag:null },
  { id:8, name:'Luxury Lingerie Set', price:3800, category:'Fashion', image:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop', rating:4.5, reviews:67, tag:'Limited' },
]

const CATS = ['All','Premium','Starter','Popular','Travel','Wellness','Fashion']

export default function ShopPage() {
  useSEO({
    title: 'Adult Shop Kenya — Discreet Delivery',
    description: 'Shop discreetly for premium adult products with fast delivery across Kenya. Lingerie, toys, accessories and more.',
    keywords: 'adult shop Kenya, adult products Nairobi, discreet delivery Kenya, lingerie Kenya',
    canonicalPath: '/shop',
  })
  const [cat, setCat] = useState('All')
  const [cart, setCart] = useState<number[]>([])
  const [liked, setLiked] = useState<number[]>([])

  const filtered = PRODUCTS.filter(p => cat==='All'||p.category===cat)
  const addToCart = (id: number) => setCart(p => p.includes(id)?p.filter(x=>x!==id):[...p,id])
  const toggleLike = (id: number) => setLiked(p => p.includes(id)?p.filter(x=>x!==id):[...p,id])

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>

        <div className="w-full border-b border-color px-4 sm:px-6 py-4 flex items-center justify-between" style={{background:'linear-gradient(135deg,#8B000010,#FFD70010)'}}>
          <div>
            <h1 className="text-2xl font-black text-text-light">Premium Shop</h1>
            <p className="text-sm text-text-muted mt-0.5">Discreet, quality products delivered safely to your door</p>
          </div>
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-card-bg border border-color rounded-xl text-sm font-bold text-text-light hover:border-[#FFD700] transition-all">
              <ShoppingCart size={16}/> Cart
            </button>
            {cart.length > 0 && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#8B0000] rounded-full flex items-center justify-center text-white text-[10px] font-black">{cart.length}</div>}
          </div>
        </div>

        {/* Trust badges */}
        <div className="px-4 sm:px-6 py-3 border-b border-color grid grid-cols-3 gap-2 text-center">
          {[[Shield,'100% Discreet'],[Truck,'Fast Delivery'],[Lock,'Secure Payment']].map(([Icon,text])=>(
            <div key={text as string} className="flex items-center justify-center gap-1.5">
              {React.createElement(Icon as any,{size:12,className:'text-[#28a745]'})}
              <span className="text-[10px] text-text-muted">{text as string}</span>
            </div>
          ))}
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-color">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter size={13} className="text-text-muted flex-shrink-0"/>
            {CATS.map(c=><button key={c} onClick={()=>setCat(c)} className={`px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${cat===c?'bg-[#8B0000] text-white':'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>)}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(p=>(
              <div key={p.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden group hover:border-[#FFD700]/50 hover:shadow-lg hover:shadow-[#FFD700]/5 transition-all">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"/>
                  {p.tag && <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#FFD700] text-black text-[9px] font-black rounded-md">{p.tag}</div>}
                  <button onClick={()=>toggleLike(p.id)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-[#8B0000] transition-colors">
                    <Heart size={12} className={liked.includes(p.id)?'fill-white text-white':'text-white'}/>
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-text-light mb-1 line-clamp-2">{p.name}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <Star size={10} className="fill-[#FFD700] text-[#FFD700]"/>
                    <span className="text-[10px] text-text-light font-bold">{p.rating}</span>
                    <span className="text-[10px] text-text-muted">({p.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-[#FFD700]">KES {p.price.toLocaleString()}</span>
                    <span className="text-[9px] text-text-muted px-1.5 py-0.5 bg-dark-bg border border-color rounded">{p.category}</span>
                  </div>
                  <button onClick={()=>addToCart(p.id)} className={`w-full py-2 font-bold text-xs rounded-xl transition-all ${cart.includes(p.id)?'bg-[#28a745] text-white':'bg-[#8B0000] hover:bg-[#a00000] text-white'}`}>
                    {cart.includes(p.id)?'✓ Added':'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
