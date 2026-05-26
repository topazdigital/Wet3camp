import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { ShoppingCart, Star, Shield, Truck, Lock, Filter, Heart, X, ChevronRight, Package, AlertCircle } from 'lucide-react'
import { useSEO } from '@/lib/useSEO'

const PRODUCTS = [
  {
    id: 1, name: 'Luxury Silk Set', price: 8500, category: 'Premium',
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=600&h=800&fit=crop',
    rating: 4.8, reviews: 124, tag: 'Best Seller',
    description: 'Indulge in the finest silk accessories for an unforgettable evening. Includes satin blindfold, silk restraints, and massage oil. Premium quality, body-safe materials.',
    features: ['100% Mulberry Silk', 'Adjustable fit', 'Machine washable', 'Includes storage pouch'],
    reviewsData: [
      { id: 1, name: 'J.M.', rating: 5, text: 'Absolutely stunning quality. My partner loved it. Delivery was fast and discreet.', date: '2 weeks ago' },
      { id: 2, name: 'A.K.', rating: 5, text: 'Perfect for a special night. The silk feels incredible on the skin.', date: '1 month ago' },
      { id: 3, name: 'S.O.', rating: 4, text: 'Great quality, arrived well-packaged. Would buy again.', date: '1 month ago' },
    ],
  },
  {
    id: 2, name: 'Beginners Bundle', price: 3200, category: 'Starter',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop',
    rating: 4.6, reviews: 87, tag: null,
    description: 'The perfect starter kit for couples exploring intimacy together. Everything you need in one discreetly packaged bundle. Body-safe, non-toxic, and beginner-friendly.',
    features: ['Body-safe silicone', '3 speed settings', 'USB rechargeable', 'Waterproof'],
    reviewsData: [
      { id: 1, name: 'P.W.', rating: 5, text: 'Great starter kit! Very good value for money.', date: '3 weeks ago' },
      { id: 2, name: 'T.N.', rating: 4, text: 'Exactly as described. Discreet packaging as promised.', date: '1 month ago' },
    ],
  },
  {
    id: 3, name: 'Professional Grade Set', price: 12000, category: 'Premium',
    image: 'https://images.unsplash.com/photo-1551431009-381d36ac3a4b?w=600&h=800&fit=crop',
    rating: 4.9, reviews: 201, tag: 'Top Rated',
    description: 'For those who demand nothing but the best. This professional-grade set includes everything an escort or couple needs for premium experiences. Medical-grade silicone, adjustable, and built to last.',
    features: ['Medical-grade silicone', 'Professional quality', 'Multiple settings', 'Includes carry case'],
    reviewsData: [
      { id: 1, name: 'M.A.', rating: 5, text: 'Worth every shilling. This is genuinely professional quality.', date: '1 week ago' },
      { id: 2, name: 'R.K.', rating: 5, text: 'My absolute favourite product on this platform. 10/10.', date: '2 weeks ago' },
      { id: 3, name: 'C.B.', rating: 5, text: 'Exceptional quality. Delivered next day, super discreet.', date: '3 weeks ago' },
    ],
  },
  {
    id: 4, name: 'Discreet Travel Kit', price: 4500, category: 'Travel',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=600&h=800&fit=crop',
    rating: 4.7, reviews: 156, tag: null,
    description: 'Everything you need in a compact, TSA-approved travel case. Perfect for escorts and clients who travel frequently. Lightweight, discreet, and airline-safe.',
    features: ['Travel-sized items', 'TSA approved', 'Lockable case', 'Carry-on friendly'],
    reviewsData: [
      { id: 1, name: 'F.H.', rating: 5, text: 'Perfect for travel. Fits perfectly in my carry-on.', date: '2 weeks ago' },
      { id: 2, name: 'B.M.', rating: 4, text: 'Very convenient and discreet. Exactly what I needed.', date: '1 month ago' },
    ],
  },
  {
    id: 5, name: 'Couples Deluxe Bundle', price: 15000, category: 'Premium',
    image: 'https://images.unsplash.com/photo-1576091160550-112173faf00e?w=600&h=800&fit=crop',
    rating: 4.8, reviews: 98, tag: 'New',
    description: 'The ultimate couples experience bundle. Designed to enhance intimacy and create unforgettable moments together. Luxury materials, thoughtfully curated for maximum pleasure.',
    features: ['For couples', 'Dual stimulation', 'App-controlled', 'Gift-box packaging'],
    reviewsData: [
      { id: 1, name: 'L.A.', rating: 5, text: "Best purchase I've made. My partner and I love it.", date: '1 week ago' },
      { id: 2, name: 'D.K.', rating: 5, text: 'Amazing gift! Delivered beautifully packaged.', date: '2 weeks ago' },
    ],
  },
  {
    id: 6, name: 'Solo Pleasure Pro', price: 6800, category: 'Popular',
    image: 'https://images.unsplash.com/photo-1549887534-f2cb8a4e6d1a?w=600&h=800&fit=crop',
    rating: 4.9, reviews: 312, tag: 'Most Popular',
    description: 'Our most popular product for a reason. Powerful, quiet, and incredibly satisfying. The Solo Pleasure Pro is the go-to choice for thousands of Kenyan women.',
    features: ['10 vibration modes', 'Ultra-quiet motor', 'Waterproof', '2-hour battery life'],
    reviewsData: [
      { id: 1, name: 'N.K.', rating: 5, text: 'Life-changing purchase. I have no words. Just buy it.', date: '3 days ago' },
      { id: 2, name: 'W.A.', rating: 5, text: 'Lives up to the hype. The most popular for good reason!', date: '1 week ago' },
      { id: 3, name: 'O.M.', rating: 5, text: 'Incredibly quiet and powerful. Perfect for a hotel room.', date: '2 weeks ago' },
    ],
  },
  {
    id: 7, name: 'Premium Massage Kit', price: 5200, category: 'Wellness',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=800&fit=crop',
    rating: 4.7, reviews: 143, tag: null,
    description: 'Professional-grade massage oils, candles, and accessories for the ultimate sensual massage experience. Perfect for escorts offering massage services.',
    features: ['6 aromatherapy oils', 'Massage candles', 'Feather tickler', 'How-to guide'],
    reviewsData: [
      { id: 1, name: 'E.N.', rating: 5, text: 'The oils smell absolutely divine. My clients love them.', date: '1 week ago' },
      { id: 2, name: 'G.R.', rating: 4, text: 'Great selection of scents. Fast, discreet delivery.', date: '3 weeks ago' },
    ],
  },
  {
    id: 8, name: 'Luxury Lingerie Set', price: 3800, category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=800&fit=crop',
    rating: 4.5, reviews: 67, tag: 'Limited',
    description: 'Exquisite lingerie crafted for confidence and allure. Available in S, M, L, XL. Perfect for escorts who want to look and feel their absolute best.',
    features: ['Sizes S–XL', 'Premium lace', 'Multiple colours', 'Hand-wash care'],
    reviewsData: [
      { id: 1, name: 'V.A.', rating: 5, text: 'Fits perfectly and looks stunning. Very flattering.', date: '2 weeks ago' },
      { id: 2, name: 'H.K.', rating: 4, text: 'Beautiful quality. True to size.', date: '1 month ago' },
    ],
  },
]

const CATS = ['All', 'Premium', 'Starter', 'Popular', 'Travel', 'Wellness', 'Fashion']

interface ProductModalProps {
  product: typeof PRODUCTS[0]
  cart: number[]
  onAddToCart: (id: number) => void
  onClose: () => void
}

function ProductModal({ product, cart, onAddToCart, onClose }: ProductModalProps) {
  const [activeImg, setActiveImg] = useState(product.image)
  const inCart = cart.includes(product.id)
  const [justAdded, setJustAdded] = useState(false)

  const handleAdd = () => {
    onAddToCart(product.id)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl bg-card-bg border border-color rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[95vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-color sticky top-0 bg-card-bg z-10">
          <div>
            <h2 className="font-black text-text-light text-sm">{product.name}</h2>
            <span className="text-[10px] text-text-muted">{product.category}</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-light rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-0">
          <div className="p-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-dark-bg mb-3">
              <img src={activeImg} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {product.tag && (
                  <span className="px-2 py-0.5 bg-[#FFD700] text-black text-[9px] font-black rounded-md">{product.tag}</span>
                )}
              </div>
              <h3 className="text-lg font-black text-text-light">{product.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={12} className={i <= Math.round(product.rating) ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'} />
                  ))}
                </div>
                <span className="text-xs font-bold text-text-light">{product.rating}</span>
                <span className="text-xs text-text-muted">({product.reviews} reviews)</span>
              </div>
            </div>

            <p className="text-3xl font-black text-[#FFD700]">KES {product.price.toLocaleString()}</p>

            <p className="text-sm text-text-muted leading-relaxed">{product.description}</p>

            <div>
              <p className="text-xs font-bold text-text-light mb-2">What's Included</p>
              <ul className="space-y-1.5">
                {product.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                    <ChevronRight size={10} className="text-[#28a745] flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 p-3 bg-dark-bg border border-color rounded-xl">
              <Package size={14} className="text-[#28a745]" />
              <div>
                <p className="text-[10px] text-[#28a745] font-bold">Discreet Delivery</p>
                <p className="text-[10px] text-text-muted">Plain packaging · 1–3 days Kenya-wide</p>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className={`w-full py-3.5 font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                inCart || justAdded
                  ? 'bg-[#28a745] text-white'
                  : 'bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white hover:shadow-lg hover:shadow-[#8B0000]/30'
              }`}
            >
              <ShoppingCart size={15} />
              {justAdded ? '✓ Added to Cart' : inCart ? '✓ In Your Cart' : 'Add to Cart'}
            </button>

            <div className="flex gap-2">
              {[Shield, Truck, Lock].map((Icon, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 p-2 bg-dark-bg rounded-xl border border-color text-center">
                  <Icon size={13} className="text-[#28a745]" />
                  <span className="text-[9px] text-text-muted">{['100% Discreet', 'Fast Delivery', 'Secure Pay'][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="px-5 pb-5">
          <h4 className="text-sm font-bold text-text-light mb-3">Customer Reviews</h4>
          <div className="space-y-3">
            {product.reviewsData.map(r => (
              <div key={r.id} className="p-4 bg-dark-bg border border-color rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-xs font-bold text-[#8B0000]">
                      {r.name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-text-light">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={10} className={i <= r.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'} />
                    ))}
                    <span className="text-[10px] text-text-muted ml-1">{r.date}</span>
                  </div>
                </div>
                <p className="text-sm text-text-muted">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null)

  const filtered = PRODUCTS.filter(p => cat === 'All' || p.category === cat)
  const addToCart = (id: number) => setCart(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleLike = (id: number) => setLiked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        <div className="w-full border-b border-color px-4 sm:px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#8B000010,#FFD70010)' }}>
          <div>
            <h1 className="text-2xl font-black text-text-light">Premium Shop</h1>
            <p className="text-sm text-text-muted mt-0.5">Discreet, quality products delivered safely to your door</p>
          </div>
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-card-bg border border-color rounded-xl text-sm font-bold text-text-light hover:border-[#FFD700] transition-all">
              <ShoppingCart size={16} /> Cart
            </button>
            {cart.length > 0 && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#8B0000] rounded-full flex items-center justify-center text-white text-[10px] font-black">
                {cart.length}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-color grid grid-cols-3 gap-2 text-center">
          {([[Shield, '100% Discreet'], [Truck, 'Fast Delivery'], [Lock, 'Secure Payment']] as const).map(([Icon, text]) => (
            <div key={text} className="flex items-center justify-center gap-1.5">
              {React.createElement(Icon as any, { size: 12, className: 'text-[#28a745]' })}
              <span className="text-[10px] text-text-muted">{text}</span>
            </div>
          ))}
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-color">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter size={13} className="text-text-muted flex-shrink-0" />
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${cat === c ? 'bg-[#8B0000] text-white' : 'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(p => (
              <div
                key={p.id}
                className="bg-card-bg border border-color rounded-2xl overflow-hidden group hover:border-[#FFD700]/50 hover:shadow-lg hover:shadow-[#FFD700]/5 transition-all cursor-pointer"
                onClick={() => setSelectedProduct(p)}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  {p.tag && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#FFD700] text-black text-[9px] font-black rounded-md">{p.tag}</div>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); toggleLike(p.id) }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-[#8B0000] transition-colors"
                  >
                    <Heart size={12} className={liked.includes(p.id) ? 'fill-white text-white' : 'text-white'} />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-text-light mb-1 line-clamp-2">{p.name}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <Star size={10} className="fill-[#FFD700] text-[#FFD700]" />
                    <span className="text-[10px] text-text-light font-bold">{p.rating}</span>
                    <span className="text-[10px] text-text-muted">({p.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-[#FFD700]">KES {p.price.toLocaleString()}</span>
                    <span className="text-[9px] text-text-muted px-1.5 py-0.5 bg-dark-bg border border-color rounded">{p.category}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); addToCart(p.id) }}
                    className={`w-full py-2 font-bold text-xs rounded-xl transition-all ${cart.includes(p.id) ? 'bg-[#28a745] text-white' : 'bg-[#8B0000] hover:bg-[#a00000] text-white'}`}
                  >
                    {cart.includes(p.id) ? '✓ Added' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          cart={cart}
          onAddToCart={addToCart}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  )
}
