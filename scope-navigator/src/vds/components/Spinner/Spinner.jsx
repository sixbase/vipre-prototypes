import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Spinner
 *
 * An indeterminate loading indicator (a rotating ring). Inherits the current
 * text color by default; set `tone="primary"` for a branded spinner.
 *
 * Props:
 * - size:  'sm' | 'md' | 'lg'  → 16 / 20 / 24px   (default 'md')
 * - tone:  'current' | 'primary'   (default 'current')
 * - label: accessible name (default 'Loading'). Rendered via role="status".
 *
 * Accessibility:
 * - role="status" + aria-label announces the loading state.
 * - Honors prefers-reduced-motion (the ring stops spinning).
 *
 * @example
 * <Spinner />
 * <Button disabled><Spinner size="sm" /> Saving…</Button>
 */
export const Spinner = forwardRef(function Spinner(
  { size = 'md', tone = 'current', label = 'Loading', className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-label={label}
      className={cx('vds-spinner', `vds-spinner--${size}`, tone !== 'current' && `vds-spinner--${tone}`, className)}
      {...props}
    />
  )
})

Spinner.displayName = 'Spinner'
