import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/** Tones that convey live status and should announce via role="status". */
const STATUS_TONES = new Set(['success', 'warning', 'danger'])

/**
 * Badge
 *
 * A compact status pill with six tones and an optional leading status dot.
 * Soft-tinted background paired with matching ink, sized off the small end of
 * the typescale so it reads as a label.
 *
 * Props:
 * - tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'  (default 'neutral')
 * - dot:  boolean — show a leading status dot  (default false)
 * - all native span attributes
 *
 * Accessibility:
 * - Status tones (success/warning/danger) auto-apply role="status" so changes
 *   are announced; pass an explicit `role` to override.
 * - The dot is decorative (aria-hidden) — meaning lives in the text.
 * - Don't rely on color alone; keep the label explicit ("At risk", not just amber).
 *
 * @example
 * <Badge tone="success" dot>Protected</Badge>
 * <Badge tone="danger" dot>Threat</Badge>
 */
export const Badge = forwardRef(function Badge(
  { tone = 'neutral', dot = false, role, className, children, ...props },
  ref,
) {
  const resolvedRole = role ?? (STATUS_TONES.has(tone) ? 'status' : undefined)
  return (
    <span
      ref={ref}
      role={resolvedRole}
      className={cx('vds-badge', `vds-badge--${tone}`, className)}
      {...props}
    >
      {dot && <span className="vds-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'
