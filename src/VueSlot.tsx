import { useEffect, useRef } from 'react'

type MountModule = { mount: (el: HTMLElement) => void; unmount: () => void }

// Mounts a framework-agnostic remote (the Vue cart) into a plain DOM node.
// A React host can't render a Vue tree as a React child, so we hand the remote
// a <div> and let it own everything inside; data crosses via the window bus.
export function VueSlot({
  loader,
  onError,
}: {
  loader: () => Promise<MountModule>
  onError?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Hold onError in a ref so passing an inline callback doesn't change the
  // effect deps and remount the remote on every render.
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    let mod: MountModule | undefined
    let alive = true
    loader()
      .then((m) => {
        mod = m
        if (alive && ref.current) m.mount(ref.current)
      })
      .catch((err) => {
        // Cart remote down: log, tell the host so it can degrade the cart UI,
        // and leave the slot empty rather than surfacing an unhandled rejection.
        console.error('Cart remote failed to load:', err)
        if (alive) onErrorRef.current?.()
      })
    return () => {
      alive = false
      mod?.unmount()
    }
  }, [loader])
  return <div ref={ref} />
}
