import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Button
 *
 * The primary interactive element. Four variants to match the weight of the
 * action, three sizes, an opacity-based disabled state, and a visible keyboard
 * focus ring. Forwards all native <button> attributes.
 *
 * Props:
 * - variant: 'primary' | 'secondary' | 'ghost' | 'danger'  (default 'primary')
 * - size:    'sm' | 'md' | 'lg'                              (default 'md')
 * - all native ButtonHTMLAttributes (onClick, disabled, type, aria-*, …)
 *
 * Accessibility:
 * - Focus ring via --vds-focus-ring, shown only for keyboard nav (:focus-visible)
 * - Disabled uses opacity + pointer-events, never a new color
 * - Icon-only buttons must be given an aria-label
 *
 * @example
 * <Button variant="primary" onClick={save}>Save</Button>
 * <Button variant="ghost" size="sm">Cancel</Button>
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', type = 'button', className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('vds-button', `vds-button--${variant}`, `vds-button--${size}`, className)}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'
