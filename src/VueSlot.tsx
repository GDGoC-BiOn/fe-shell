import { useEffect, useRef } from 'react'

type MountModule = { mount: (el: HTMLElement) => void; unmount: () => void }

// Mounts a framework-agnostic remote (the Vue cart) into a plain DOM node.
// A React host can't render a Vue tree as a React child, so we hand the remote
// a <div> and let it own everything inside; data crosses via the window bus.
export function VueSlot({ loader }: { loader: () => Promise<MountModule> }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let mod: MountModule | undefined
    let alive = true
    loader().then((m) => {
      mod = m
      if (alive && ref.current) m.mount(ref.current)
    })
    return () => {
      alive = false
      mod?.unmount()
    }
  }, [loader])
  return <div ref={ref} />
}
