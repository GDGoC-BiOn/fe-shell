export interface MarqetProduct {
  id: string
  brand: string
  name: string
  icon: 'audio' | 'watch' | 'camera' | 'speaker' | 'earbuds'
  price: number
  old: number | null
  rate: number
  rev: string
  tag: string | null
}

// The shell is the bridge: catalog (React) hands it a product via a callback,
// and it forwards over the bus to the cart (Vue); the cart reports its count back.
declare global {
  interface WindowEventMap {
    'cart:add-item': CustomEvent<{ product: MarqetProduct }>
    'cart:open': CustomEvent<void>
    'cart:count': CustomEvent<{ count: number }>
  }
}
