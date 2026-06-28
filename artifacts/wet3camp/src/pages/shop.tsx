import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { ShoppingCart, Star, Shield, Truck, Lock, Filter, Heart, X, ChevronRight, Package, Store } from 'lucide-react'
import { useSEO } from '@/lib/useSEO'

const CATS = ['All', 'Premium', 'Starter', 'Popular', 'Travel', 'Wellness', 'Fashion', 'General']

// ── Product detail modal ──────────────────────────────────────────────────────
function ProductModal({ product, cart, onAddToCart, onClose }: { product: any; cart: number[]; onAddToCart: (id: number) => void; onClose: () => void }) {
  const inCart = cart.includes(product.id)
  const [justAdded, setJustAdded] = useState(false)
  const features: string[] = product.features
    ? (typeof product.features === 'string' ? product.features.split('\n').filter(Boolean) : product.features)
    : []

  const handleAdd = () => {
    onAddToCart(product.id)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div className="w-full sm:max-w-2xl bg-card-bg border border-color rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-color sticky top-0 bg-card-bg z-10">
          <div>
            <h2 className="font-black text-text-light text-sm">{product.name}</h2>
            <span className="text-[10px] text-text-muted">{product.category}</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-light rounded-lg transition-colors"><X size={18} /></button>
        </div>

        <div className="grid sm:grid-cols-2 gap-0">
          <div className="p-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-dark-bg">
              {(product.image ?? product.image_url)
                ? <img src={product.image ?? product.image_url} alt={product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-5xl">🛍️</div>
              }
            </div>
          </div>

          <div className="p-4 space-y-4">
            {product.tag && <span className="inline-block px-2 py-0.5 bg-[#FFD700] text-black text-[9px] font-black rounded-md">{product.tag}</span>}
            <h3 className="text-lg font-black text-text-light">{product.name}</h3>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className={i <= Math.round(product.rating || 0) ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'} />)}
              </div>
              <span className="text-xs font-bold text-text-light">{product.rating || 'New'}</span>
              <span className="text-xs text-text-muted">({product.review_count || 0} reviews)</span>
            </div>

            <p className="text-3xl font-black text-[#FFD700]">KES {Number(product.price ?? product.price_kes ?? 0).toLocaleString()}</p>
            {product.description && <p className="text-sm text-text-muted leading-relaxed">{product.description}</p>}

            {features.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-light mb-2">What's Included</p>
                <ul className="space-y-1.5">
                  {features.map((f: string) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                      <ChevronRight size={10} className="text-[#28a745] flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-dark-bg border border-color rounded-xl">
              <Package size={14} className="text-[#28a745]" />
              <div>
                <p className="text-[10px] text-[#28a745] font-bold">Discreet Delivery</p>
                <p className="text-[10px] text-text-muted">Plain packaging · 1–3 days Kenya-wide</p>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className={`w-full py-3.5 font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${inCart || justAdded ? 'bg-[#28a745] text-white' : 'bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white hover:shadow-lg hover:shadow-[#8B0000]/30'}`}
            >
              <ShoppingCart size={15} />
              {justAdded ? '✓ Added to Cart' : inCart ? '✓ In Your Cart' : 'Add to Cart'}
            </button>

            <div className="flex gap-2">
              {([Shield, Truck, Lock] as const).map((Icon, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 p-2 bg-dark-bg rounded-xl border border-color text-center">
                  {React.createElement(Icon as any, { size: 13, className: 'text-[#28a745]' })}
                  <span className="text-[9px] text-text-muted">{['100% Discreet', 'Fast Delivery', 'Secure Pay'][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ShopPage() {
  useSEO({
    title: 'Adult Shop Kenya — Discreet Delivery',
    description: 'Shop discreetly for premium adult products with fast delivery across Kenya. Lingerie, toys, accessories and more.',
    keywords: 'adult shop Kenya, adult products Nairobi, discreet delivery Kenya, lingerie Kenya',
    canonicalPath: '/shop',
  })
  const [cat, setCat]   = useState('All')
  const [cart, setCart] = useState<number[]>([])
  const [liked, setLiked] = useState<number[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (cat !== 'All') params.set('cat', cat)
    setLoading(true)
    fetch(`/api/shop?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cat])

  const addToCart   = (id: number) => setCart(p  => p.includes(id)  ? p.filter(x => x !== id)  : [...p, id])
  const toggleLike  = (id: number) => setLiked(p => p.includes(id)  ? p.filter(x => x !== id)  : [...p, id])

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Header */}
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
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#8B0000] rounded-full flex items-center justify-center text-white text-[10px] font-black">{cart.length}</div>
            )}
          </div>
        </div>

        {/* Trust signals */}
        <div className="px-4 sm:px-6 py-3 border-b border-color grid grid-cols-3 gap-2 text-center">
          {([[Shield, '100% Discreet'], [Truck, 'Fast Delivery'], [Lock, 'Secure Payment']] as const).map(([Icon, text]) => (
            <div key={text} className="flex items-center justify-center gap-1.5">
              {React.createElement(Icon as any, { size: 12, className: 'text-[#28a745]' })}
              <span className="text-[10px] text-text-muted">{text}</span>
            </div>
          ))}
        </div>

        {/* Category filters */}
        <div className="px-4 sm:px-6 py-3 border-b border-color">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter size={13} className="text-text-muted flex-shrink-0" />
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${cat === c ? 'bg-[#8B0000] text-white' : 'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card-bg border border-color rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[3/4] bg-dark-bg" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-dark-bg rounded" />
                    <div className="h-3 bg-dark-bg rounded w-2/3" />
                    <div className="h-7 bg-dark-bg rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store size={52} className="text-[#FFD700]/20 mb-4" />
              <h2 className="text-lg font-bold text-text-light mb-2">Shop Coming Soon</h2>
              <p className="text-sm text-text-muted max-w-sm mb-6">
                We're curating the finest adult products for discreet delivery across Kenya. Products are added by our admin team.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <a href="mailto:admin@wet3.camp" className="px-5 py-3 bg-[#FFD700] text-black text-sm font-black rounded-xl hover:bg-[#e6c000] transition-all">Suggest a Product</a>
                <a href="mailto:admin@wet3.camp" className="px-5 py-3 bg-card-bg border border-color text-text-muted text-sm font-bold rounded-xl hover:border-text-muted transition-all">Partner with Us</a>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-md">
                {['Discreet', 'Fast', 'Verified'].map((label, i) => (
                  <div key={label} className="p-3 bg-card-bg border border-color rounded-xl text-center">
                    {React.createElement(([Shield, Truck, Lock] as const)[i] as any, { size: 20, className: 'text-[#28a745] mx-auto mb-1' })}
                    <p className="text-[10px] text-text-muted">{label} Delivery</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product grid */}
          {!loading && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map(p => (
                <div key={p.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden group hover:border-[#FFD700]/50 hover:shadow-lg hover:shadow-[#FFD700]/5 transition-all cursor-pointer" onClick={() => setSelectedProduct(p)}>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {(p.image ?? p.image_url)
                      ? <img src={p.image ?? p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full bg-gradient-to-br from-[#1a0000] to-[#2a1a1a] flex items-center justify-center text-4xl">🛍️</div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    {p.tag && <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#FFD700] text-black text-[9px] font-black rounded-md">{p.tag}</div>}
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
                      <span className="text-[10px] text-text-light font-bold">{p.rating || 'New'}</span>
                      <span className="text-[10px] text-text-muted">({p.review_count || 0})</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-[#FFD700]">KES {Number(p.price ?? p.price_kes ?? 0).toLocaleString()}</span>
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
          )}
        </div>
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} cart={cart} onAddToCart={addToCart} onClose={() => setSelectedProduct(null)} />
      )}
    </main>
  )
}
