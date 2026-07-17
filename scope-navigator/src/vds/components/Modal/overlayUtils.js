/* ----------------------------------------------------------------------------
   overlayUtils — shared behavior for the blocking overlays (Modal, Drawer).

   Both components need the same four things, so they live here once:
   - usePresence:   keeps the overlay mounted during its exit animation.
   - useScrollLock: freezes body scroll while any overlay is open (counted,
                    so stacked overlays don't unlock each other early).
   - useFocusReturn: remembers what had focus before the overlay opened and
                    gives it back when the overlay closes.
   - trapTabKey / getFocusable: the Tab-cycle focus trap.
   -------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'

/** Merge a forwarded ref with local refs so a node is reachable by all of them. */
export function mergeRefs(...refs) {
  return (node) => {
    for (const r of refs) {
      if (!r) continue
      if (typeof r === 'function') r(node)
      else r.current = node
    }
  }
}

/** The focusable descendants of a node, in DOM order (same list Popover uses). */
export function getFocusable(root) {
  if (!root) return []
  return Array.from(
    root.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    ),
  )
}

/**
 * Keep Tab / Shift+Tab cycling inside `panel`. Call from the overlay root's
 * onKeyDown — focus is already inside the overlay, so no document listener.
 */
export function trapTabKey(e, panel) {
  if (e.key !== 'Tab' || !panel) return
  const focusables = getFocusable(panel)
  if (focusables.length === 0) {
    e.preventDefault()
    return
  }
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement
  if (e.shiftKey && (active === first || active === panel)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

/**
 * Mount/unmount with room for an exit animation. `open` flips instantly;
 * `mounted` stays true (with `closing` set) for `duration` ms after close so
 * the CSS exit animation can play before the node is removed.
 * `duration` should be a touch longer than the CSS animation it covers.
 */
export function usePresence(open, duration = 240) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }
    if (!mounted) return
    setClosing(true)
    const t = setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, duration)
    return () => clearTimeout(t)
  }, [open, mounted, duration])

  return { mounted, closing }
}

// Counted lock: two stacked overlays (drawer under modal) each take a lock;
// scroll only unfreezes when the last one releases.
let scrollLocks = 0

/** Freeze body scroll while `active`. */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return
    scrollLocks += 1
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      scrollLocks -= 1
      if (scrollLocks === 0) document.body.style.overflow = prev
    }
  }, [active])
}

/** Remember the opener on open; put focus back on it after close. */
export function useFocusReturn(open) {
  const openerRef = useRef(null)
  const hasOpenedRef = useRef(false)

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true
      openerRef.current = document.activeElement
    } else if (hasOpenedRef.current) {
      openerRef.current?.focus?.({ preventScroll: true })
      openerRef.current = null
    }
  }, [open])
}
