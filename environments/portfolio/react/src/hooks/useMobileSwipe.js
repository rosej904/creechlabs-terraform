import { useState, useRef, useCallback } from 'react'

const SWIPE_THRESHOLD_PX = 50    // minimum horizontal distance to register as a swipe
const DIRECTION_RATIO = 1.5       // horizontal must be this much larger than vertical

export function useMobileSwipe(panelCount) {
  const [activePanel, setActivePanel] = useState(1)
  const touchStart = useRef(null)

  const onTouchStart = useCallback((e) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    touchStart.current = null

    // Ignore if mostly vertical (user is scrolling, not swiping panels)
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
    if (Math.abs(dy) * DIRECTION_RATIO > Math.abs(dx)) return

    if (dx < 0) {
      // swipe left → next panel
      setActivePanel((p) => Math.min(p + 1, panelCount - 1))
    } else {
      // swipe right → prev panel
      setActivePanel((p) => Math.max(p - 1, 0))
    }
  }, [panelCount])

  return { activePanel, setActivePanel, onTouchStart, onTouchEnd }
}