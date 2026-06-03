// Ambient declarations for the federated virtual modules.
declare module 'catalog/App' {
  import type { ComponentType } from 'react'
  import type { MarqetProduct } from './types'
  const App: ComponentType<{
    onAddToCart: (p: MarqetProduct) => void
    query?: string
  }>
  export default App
}

declare module 'cart/mount' {
  export function mount(el: HTMLElement): void
  export function unmount(): void
}
