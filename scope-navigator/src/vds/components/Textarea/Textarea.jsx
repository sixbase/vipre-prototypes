import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Textarea
 *
 * Multi-line text field for longer input (notes, descriptions, messages).
 * Shares the Input's neutral-graphite look; vertically resizable.
 *
 * Props:
 * - size:    'sm' | 'md' | 'lg'   (default 'md')
 * - invalid: boolean — danger border + aria-invalid   (default false)
 * - rows:    number of visible lines   (default 4)
 * - all native <textarea> attributes (value, onChange, placeholder, disabled…)
 *
 * Accessibility:
 * - Always pair with a <label> (or aria-label). `invalid` sets aria-invalid.
 *
 * @example
 * <Textarea placeholder="Add a note…" rows={5} />
 */
export const Textarea = forwardRef(function Textarea(
  { size = 'md', invalid = false, rows = 4, className, disabled, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cx(
        'vds-textarea',
        `vds-textarea--${size}`,
        invalid && 'vds-textarea--invalid',
        disabled && 'vds-textarea--disabled',
        className,
      )}
      {...props}
    />
  )
})

Textarea.displayName = 'Textarea'
