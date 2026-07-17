import { forwardRef, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/Icon.jsx'
import { Surface } from '../Surface/Surface.jsx'
import { Heading, Text } from '../Text/Text.jsx'
import {
  getFocusable,
  mergeRefs,
  trapTabKey,
  useFocusReturn,
  usePresence,
  useScrollLock,
} from './overlayUtils.js'

// Exit-animation grace period — a touch over --vds-dur-base (200ms) so the
// CSS exit animation finishes before the node unmounts.
const EXIT_MS = 240

/**
 * Modal
 *
 * A blocking dialog: a scrim dims the page and a centered panel (Surface at
 * overlay elevation) holds the content. While open, everything behind it is
 * inert — body scroll is locked, Tab cycles inside the panel, and closing
 * hands focus back to whatever opened it. Rendered in a portal on
 * --vds-z-modal, with a fade + slight-scale entrance that respects
 * prefers-reduced-motion.
 *
 * Props:
 * - open:            boolean — the dialog is controlled; you own this state
 * - onClose:         () => void — called on Escape, scrim click, and the ✕ button
 * - title:           header text (wired to aria-labelledby)
 * - description:     muted text under the title (wired to aria-describedby)
 * - footer:          node pinned to the bottom (usually action Buttons)
 * - size:            'sm' | 'md' | 'lg' | 'full'   (default 'md')
 * - dismissible:     Escape / scrim / ✕ can close it (default true). Set false
 *                    for must-answer dialogs — then only your own buttons close it.
 * - initialFocusRef: ref to the element that should receive focus on open
 *                    (defaults to the first focusable thing in the panel)
 * - all native div attributes spread onto the overlay root
 *
 * Below the sm breakpoint the panel goes near-full-width with small margins
 * and caps its height; long content scrolls inside the body.
 *
 * Accessibility:
 * - role="dialog" + aria-modal="true"; aria-labelledby / aria-describedby are
 *   wired automatically when title / description are given.
 * - Focus trap: Tab and Shift+Tab cycle inside the panel.
 * - Focus returns to the opener on close.
 *
 * @example
 * const [open, setOpen] = useState(false)
 * <Button onClick={() => setOpen(true)}>Delete device</Button>
 * <Modal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Delete device?"
 *   description="This removes the device and its scan history."
 *   footer={
 *     <>
 *       <Button variant="outline" tone="neutral" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button tone="danger" onClick={confirmDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   …body content…
 * </Modal>
 */
export const Modal = forwardRef(function Modal(
  {
    open = false,
    onClose,
    title,
    description,
    footer,
    size = 'md',
    dismissible = true,
    initialFocusRef,
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
  const descId = useId()

  useScrollLock(mounted)
  useFocusReturn(open)

  // Move focus into the panel on open.
  useEffect(() => {
    if (!open || !mounted) return
    const target =
      initialFocusRef?.current ?? getFocusable(panelRef.current)[0] ?? panelRef.current
    target?.focus({ preventScroll: true })
    // initialFocusRef is a ref — its identity is stable, reading .current here is intended.
  }, [open, mounted, initialFocusRef])

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
      className={cx('vds-modal', `vds-modal--${size}`, closing && 'vds-modal--closing', className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div
        className="vds-modal__scrim"
        onMouseDown={dismissible ? () => onClose?.() : undefined}
      />
      <Surface
        ref={mergeRefs(ref, panelRef)}
        elevation="overlay"
        padding={null}
        radius="lg"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={title != null ? titleId : undefined}
        aria-describedby={description != null ? descId : undefined}
        tabIndex={-1}
        className="vds-modal__panel"
      >
        {(title != null || description != null || dismissible) && (
          <header className="vds-modal__header">
            <div className="vds-modal__heading">
              {title != null && (
                <Heading level="heading" as="h2" id={titleId} className="vds-modal__title">
                  {title}
                </Heading>
              )}
              {description != null && (
                <Text variant="body" tone="muted" id={descId} className="vds-modal__desc">
                  {description}
                </Text>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                className="vds-modal__close"
                aria-label="Close"
                onClick={() => onClose?.()}
              >
                <Icon as={X} size="sm" />
              </button>
            )}
          </header>
        )}
        <div className="vds-modal__body">{children}</div>
        {footer != null && <footer className="vds-modal__footer">{footer}</footer>}
      </Surface>
    </div>,
    document.body,
  )
})

Modal.displayName = 'Modal'
