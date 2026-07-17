import { forwardRef, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/Icon.jsx'
import { Surface } from '../Surface/Surface.jsx'
import { Heading } from '../Text/Text.jsx'
import {
  getFocusable,
  mergeRefs,
  trapTabKey,
  useFocusReturn,
  usePresence,
  useScrollLock,
} from '../Modal/overlayUtils.js'

// Exit-animation grace period — covers the --vds-dur-slow slide out.
const EXIT_MS = 360

/**
 * Drawer
 *
 * A panel that slides in from an edge of the screen and blocks the page
 * behind a scrim — for detail views, filter stacks, and multi-field forms
 * that don't fit a Modal. Same dialog semantics as Modal (focus trap, scroll
 * lock, Escape/scrim dismiss, focus return), on --vds-z-drawer, with an
 * --vds-ease-emphatic slide that respects prefers-reduced-motion.
 *
 * Props:
 * - open:        boolean — controlled; you own this state
 * - onClose:     () => void — called on Escape, scrim click, and the ✕ button
 * - side:        'right' | 'left' | 'bottom'   (default 'right')
 * - size:        'sm' | 'md' | 'lg' — width for side drawers, height for the
 *                bottom sheet   (default 'md')
 * - title:       header text (wired to aria-labelledby)
 * - footer:      node pinned to the bottom (usually action Buttons)
 * - dismissible: Escape / scrim / ✕ can close it   (default true)
 * - all native div attributes spread onto the overlay root
 *
 * Below the sm breakpoint, side drawers go full-width; the bottom sheet caps
 * at 90vh. Long content scrolls inside the body.
 *
 * @example
 * const [open, setOpen] = useState(false)
 * <Button onClick={() => setOpen(true)}>Device details</Button>
 * <Drawer open={open} onClose={() => setOpen(false)} title="Device details">
 *   …detail content…
 * </Drawer>
 */
export const Drawer = forwardRef(function Drawer(
  {
    open = false,
    onClose,
    side = 'right',
    size = 'md',
    title,
    footer,
    dismissible = true,
    className,
    children,
    'aria-label': ariaLabel,
    ...props
  },
  ref,
) {
  const { mounted, closing } = usePresence(open, EXIT_MS)
  const panelRef = useRef(null)
  const titleId = useId()

  useScrollLock(mounted)
  useFocusReturn(open)

  // Move focus into the panel on open.
  useEffect(() => {
    if (!open || !mounted) return
    const target = getFocusable(panelRef.current)[0] ?? panelRef.current
    target?.focus({ preventScroll: true })
  }, [open, mounted])

  if (!mounted) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (dismissible) {
        e.stopPropagation()
        onClose?.()
      }
      return
    }
    trapTabKey(e, panelRef.current)
  }

  return createPortal(
    <div
      className={cx(
        'vds-drawer',
        `vds-drawer--${side}`,
        `vds-drawer--${size}`,
        closing && 'vds-drawer--closing',
        className,
      )}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div
        className="vds-drawer__scrim"
        onMouseDown={dismissible ? () => onClose?.() : undefined}
      />
      <Surface
        ref={mergeRefs(ref, panelRef)}
        elevation="overlay"
        padding={null}
        radius={null}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={title != null ? titleId : undefined}
        tabIndex={-1}
        className="vds-drawer__panel"
      >
        {(title != null || dismissible) && (
          <header className="vds-drawer__header">
            {title != null && (
              <Heading level="heading" as="h2" id={titleId} className="vds-drawer__title">
                {title}
              </Heading>
            )}
            {dismissible && (
              <button
                type="button"
                className="vds-drawer__close"
                aria-label="Close"
                onClick={() => onClose?.()}
              >
                <Icon as={X} size="sm" />
              </button>
            )}
          </header>
        )}
        <div className="vds-drawer__body">{children}</div>
        {footer != null && <footer className="vds-drawer__footer">{footer}</footer>}
      </Surface>
    </div>,
    document.body,
  )
})

Drawer.displayName = 'Drawer'
