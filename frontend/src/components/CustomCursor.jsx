import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dot = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    let mx = 0, my = 0, rx = 0, ry = 0

    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
    }
    window.addEventListener('mousemove', onMove)

    let animId
    const tick = () => {
      if (dot.current) {
        dot.current.style.transform = `translate(${mx - 4}px, ${my - 4}px)`
      }
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      if (ring.current) {
        ring.current.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`
      }
      animId = requestAnimationFrame(tick)
    }
    tick()

    const onEnter = () => {
      if (!ring.current) return
      ring.current.style.width = '48px'
      ring.current.style.height = '48px'
      ring.current.style.borderColor = '#1D9E75'
    }
    const onLeave = () => {
      if (!ring.current) return
      ring.current.style.width = '32px'
      ring.current.style.height = '32px'
      ring.current.style.borderColor = 'rgba(255,255,255,0.5)'
    }

    const addHoverListeners = () => {
      document.querySelectorAll('button, a, [data-hover], input, select, textarea').forEach((el) => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }

    addHoverListeners()
    const observer = new MutationObserver(addHoverListeners)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(animId)
      observer.disconnect()
    }
  }, [])

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null
  }

  return (
    <>
      <div
        ref={dot}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: 8, height: 8, borderRadius: '50%',
          background: '#1D9E75', pointerEvents: 'none',
          zIndex: 9999, transition: 'width .15s, height .15s',
        }}
      />
      <div
        ref={ring}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: 32, height: 32, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.5)',
          pointerEvents: 'none', zIndex: 9998,
          transition: 'width .18s, height .18s, border-color .18s',
        }}
      />
    </>
  )
}
