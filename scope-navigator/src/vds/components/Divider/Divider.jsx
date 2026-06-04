import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Divider
 *
 * A 1px hairline in the line token. Use to separate stacked rows (horizontal)
 * or inline items (vertical) instead of hand-rolling a `w-px`/`h-px` element.
 *
 * Props:
 * - orientation: 'horizontal' | 'vertical'   (default 'horizontal')
 * - all native attributes
 *
 * Accessibility:
 * - Renders role="separator" with the matching aria-orientation. A vertical
 *   divider must sit inside a flex/inline row tall enough to stretch into.
 *
 * @example
 * <Divider />
 * <Inline gap={3}>A <Divider orientation="vertical" /> B</Inline>
 */
export const Divider = forwardRef(function Divider(
  { orientation = 'horizontal', className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cx('vds-divider', `vds-divider--${orientation}`, className)}
      {...props}
    />
  )
})

Divider.displayName = 'Divider'
