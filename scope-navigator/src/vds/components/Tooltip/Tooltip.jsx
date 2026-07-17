import {
  cloneElement,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx.js'

/* Merge a forwarded ref with local refs so a node is reachable by all of them. */
function mergeRefs(...refs) {
  return (node) => {
    for (const r of refs) {
      if (!r) continue
      if (typeof r === 'function') r(node)
      else r.current = node
    }
  }
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

/* The child's own ref, read without tripping React's dev warnings:
   React 19 moved element.ref into props (reading element.ref warns there),
   while React <=18 warns on props.ref instead. Same guard Radix uses. */
function getChildRef(element) {
  let getter = Object.getOwnPropertyDescriptor(element.props, 'ref')?.get
  if (getter && 'isReactWarning' in getter) return element.ref // React <=18
  getter = Object.getOwnPropertyDescriptor(element, 'ref')?.get
  if (getter && 'isReactWarning' in getter) return element.props.ref // React 19+
  return element.props.ref ?? element.ref
}

const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

// After a tooltip closes, siblings open instantly for a short window — so
// sweeping a row of icon buttons doesn't re-wait the delay on every one.
const WARM_MS = 400
// How long a long-press-opened tooltip stays up after the finger lifts.
const TOUCH_LINGER_MS = 1500
let warmUntil = 0

/**
 * Tooltip
 *
 * A small dark chip that names or explains its trigger. Wraps exactly one
 * focusable child; shows on hover (after a short delay — instant when another
 * tooltip just closed) and on keyboard focus, hides on leave/blur/Escape.
 * Position is fixed on --vds-z-tooltip: it flips to the opposite side when
 * space is tight and clamps into the viewport, with the arrow still pointing
 * at the trigger. Never traps or takes focus, and ignores pointer events so
 * it can't flicker under the cursor.
 *
 * On coarse pointers (touch) there is no hover: it shows on keyboard focus
 * and on long-press only.
 *
 * Props:
 * - content:   what the chip says (keep it short; it's supplementary text)
 * - placement: 'top' | 'bottom' | 'left' | 'right'   (default 'top';
 *              flips automatically when there's no room)
 * - delay:     ms before showing on hover   (default 300)
 * - children:  a single focusable element (the trigger)
 *
 * Accessibility:
 * - The chip is role="tooltip"; while visible the trigger gets
 *   aria-describedby pointing at it.
 * - Icon-only triggers still need their own aria-label — a tooltip is a
 *   description, not a name.
 *
 * @example
 * <Tooltip content="Rescan this device">
 *   <Button iconOnly aria-label="Rescan"><Icon as={Radar} /></Button>
 * </Tooltip>
 */
export const Tooltip = forwardRef(function Tooltip(
  { content, placement = 'top', delay = 300, className, children },
  ref,
) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const openRef = useRef(false)
  const triggerRef = useRef(null)
  const tipRef = useRef(null)
  const showTimer = useRef(null)
  const pressTimer = useRef(null)
  const lingerTimer = useRef(null)

  useEffect(() => {
    openRef.current = open
  })

  // Clear every pending timer on unmount.
  useEffect(
    () => () => {
      clearTimeout(showTimer.current)
      clearTimeout(pressTimer.current)
      clearTimeout(lingerTimer.current)
    },
    [],
  )

  const isCoarse = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

  const show = useCallback(
    (instant) => {
      clearTimeout(showTimer.current)
      if (instant || Date.now() < warmUntil) setOpen(true)
      else showTimer.current = setTimeout(() => setOpen(true), delay)
    },
    [delay],
  )

  const hide = useCallback(() => {
    clearTimeout(showTimer.current)
    clearTimeout(pressTimer.current)
    if (openRef.current) warmUntil = Date.now() + WARM_MS
    setOpen(false)
  }, [])

  // Escape hides it (without touching focus — tooltips never own focus).
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') hide()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, hide])

  // ---- Placement: flip when tight, clamp into the viewport, aim the arrow.
  // (Mirrors Popover's flip+clamp approach, but viewport-fixed.)
  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    const compute = () => {
      const trig = triggerRef.current
      const tip = tipRef.current
      if (!trig || !tip) return
      const t = trig.getBoundingClientRect()
      const p = tip.getBoundingClientRect()
      const m = 8 // viewport margin
      const gap = 8 // trigger ↔ chip gap (includes the arrow)
      const vw = window.innerWidth
      const vh = window.innerHeight

      let side = placement
      const room = { top: t.top, bottom: vh - t.bottom, left: t.left, right: vw - t.right }
      const need = (side === 'left' || side === 'right' ? p.width : p.height) + gap + m
      if (room[side] < need && room[OPPOSITE[side]] > room[side]) side = OPPOSITE[side]

      let top
      let left
      if (side === 'top') {
        top = t.top - gap - p.height
        left = t.left + t.width / 2 - p.width / 2
      } else if (side === 'bottom') {
        top = t.bottom + gap
        left = t.left + t.width / 2 - p.width / 2
      } else if (side === 'left') {
        top = t.top + t.height / 2 - p.height / 2
        left = t.left - gap - p.width
      } else {
        top = t.top + t.height / 2 - p.height / 2
        left = t.right + gap
      }

      // Clamp the cross axis so the chip never hangs off-screen; keep the
      // arrow pointing at the trigger's center even when clamped.
      let arrow
      if (side === 'top' || side === 'bottom') {
        left = clamp(left, m, Math.max(m, vw - m - p.width))
        arrow = clamp(t.left + t.width / 2 - left, 10, p.width - 10)
      } else {
        top = clamp(top, m, Math.max(m, vh - m - p.height))
        arrow = clamp(t.top + t.height / 2 - top, 10, p.height - 10)
      }

      setPos({ side, top, left, arrow })
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true) // capture: scrolling ancestors too
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [open, placement])

  const childProps = children.props
  const triggerEl = cloneElement(children, {
    ref: mergeRefs(ref, triggerRef, getChildRef(children)),
    'aria-describedby': open
      ? [childProps['aria-describedby'], id].filter(Boolean).join(' ')
      : childProps['aria-describedby'],
    onMouseEnter: (e) => {
      childProps.onMouseEnter?.(e)
      if (!isCoarse()) show(false)
    },
    onMouseLeave: (e) => {
      childProps.onMouseLeave?.(e)
      hide()
    },
    onFocus: (e) => {
      childProps.onFocus?.(e)
      show(true) // keyboard focus shows instantly
    },
    onBlur: (e) => {
      childProps.onBlur?.(e)
      hide()
    },
    // Coarse pointers: long-press shows; it lingers briefly after release.
    onTouchStart: (e) => {
      childProps.onTouchStart?.(e)
      clearTimeout(pressTimer.current)
      pressTimer.current = setTimeout(() => setOpen(true), 500)
    },
    onTouchEnd: (e) => {
      childProps.onTouchEnd?.(e)
      clearTimeout(pressTimer.current)
      clearTimeout(lingerTimer.current)
      lingerTimer.current = setTimeout(hide, TOUCH_LINGER_MS)
    },
  })

  return (
    <>
      {triggerEl}
      {open &&
        createPortal(
          <div
            ref={tipRef}
            id={id}
            role="tooltip"
            className={cx('vds-tooltip', `vds-tooltip--${pos?.side ?? placement}`, className)}
            style={{
              top: pos ? pos.top : 0,
              left: pos ? pos.left : 0,
              visibility: pos ? 'visible' : 'hidden',
              '--_tt-arrow': pos ? `${pos.arrow}px` : '50%',
            }}
          >
            {content}
            <span className="vds-tooltip__arrow" aria-hidden="true" />
          </div>,
          document.body,
        )}
    </>
  )
})

Tooltip.displayName = 'Tooltip'
