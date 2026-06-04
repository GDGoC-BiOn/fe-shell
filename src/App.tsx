import { lazy, Suspense, useEffect, useState } from 'react'
import { AccountBadge, Button } from '@bion-mfe-ui/react'
import { VueSlot } from './VueSlot'
import type { MarqetProduct } from './types'
import './shell.css'

// React → React: the catalog remote is consumed as a real React component.
const Catalog = lazy(() => import('catalog/App'))

// Stable loader reference so VueSlot mounts the cart once.
const loadCart = () => import('cart/mount')

// Skeleton shown while the catalog remote is fetched (Suspense fallback), so the
// catalog area shows its shape instead of a bare "loading" line.
function CatalogSkeleton() {
  return (
    <>
      <div className="skel skel-hero" />
      <div className="skel-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="skel-card" key={i}>
            <div className="skel t" />
            <div className="skel a" />
            <div className="skel b" />
            <div className="skel c" />
          </div>
        ))}
      </div>
    </>
  )
}

export default function App() {
  const [count, setCount] = useState(0)
  const [query, setQuery] = useState('')

  // React → Vue: forward the catalog's callback to the cart over the bus.
  const addToCart = (p: MarqetProduct) =>
    window.dispatchEvent(new CustomEvent('cart:add-item', { detail: { product: p } }))

  // Vue → React: the cart reports its item count; the shell owns the badge.
  useEffect(() => {
    const onCount = (e: WindowEventMap['cart:count']) => setCount(e.detail.count)
    window.addEventListener('cart:count', onCount)
    return () => window.removeEventListener('cart:count', onCount)
  }, [])

  return (
    <>
      <header>
        <div className="wrap">
          <div className="topnav">
            <div className="logo">Marqet</div>
            <input
              className="search"
              placeholder="Cari produk"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="nav-icons">
              <Button variant="icon" icon="heart" label="Suka" />
              <AccountBadge name="Ilham" />
              <Button
                variant="outline"
                icon="cart"
                onClick={() => window.dispatchEvent(new CustomEvent('cart:open'))}
              >
                Keranjang{count > 0 ? ` (${count})` : ''}
              </Button>
            </div>
          </div>
          <nav className="subnav">
            <a href="#">Semua</a>
            <a href="#">Deal hari ini</a>
            <a href="#">Audio</a>
            <a href="#">Kamera</a>
            <a href="#">Wearable</a>
          </nav>
        </div>
      </header>

      <main className="wrap">
        <section className="reco">
          <div className="reco-item greet">
            <div className="av">IL</div>
            <div>
              <div className="t">Hai, Ilham</div>
              <div className="s">Rekomendasi untukmu</div>
            </div>
          </div>
          <div className="reco-item">
            <div className="av">📦</div>
            <div>
              <div className="t">Pesananmu</div>
              <div className="s">Lacak 2 paket</div>
            </div>
          </div>
          <div className="reco-item">
            <div className="av">🎧</div>
            <div>
              <div className="t">Elektronik</div>
              <div className="s">Sale 30%</div>
            </div>
          </div>
          <div className="reco-item">
            <div className="av">🏠</div>
            <div>
              <div className="t">Rumah &amp; dapur</div>
              <div className="s">Sale 30%</div>
            </div>
          </div>
        </section>

        <Suspense fallback={<CatalogSkeleton />}>
          <Catalog onAddToCart={addToCart} query={query} />
        </Suspense>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="logo">Marqet</div>
              <p>Marketplace perangkat pilihan. Dirakit di Bandung, dikirim ke mana pun.</p>
            </div>
            <div className="foot-col">
              <h4>Belanja</h4>
              <a href="#">Deal hari ini</a>
              <a href="#">Kategori</a>
              <a href="#">Brand</a>
              <a href="#">Kartu hadiah</a>
            </div>
            <div className="foot-col">
              <h4>Bantuan</h4>
              <a href="#">Lacak pesanan</a>
              <a href="#">Pengembalian</a>
              <a href="#">Garansi</a>
              <a href="#">Kontak</a>
            </div>
            <div className="foot-col">
              <h4>Perusahaan</h4>
              <a href="#">Tentang</a>
              <a href="#">Karier</a>
              <a href="#">Privasi</a>
              <a href="#">Syarat</a>
            </div>
          </div>
          <div className="foot-bot">
            <div>© 2026 Marqet</div>
            <div>Indonesia · IDR</div>
          </div>
        </div>
      </footer>

      {/* Vue cart remote — mounted into a DOM node, talks only over the bus. */}
      <VueSlot loader={loadCart} />
    </>
  )
}
