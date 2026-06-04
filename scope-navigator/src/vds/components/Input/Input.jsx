import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Input
 *
 * A single-line text field. Sizes match Button (sm/md/lg). Optional leading
 * and trailing slots hold icons or actions — compose a search field with a
 * leading <Icon as={Search}/> and a trailing clear button. The forwarded ref
 * points at the underlying <input>.
 *
 * Props:
 * - size:     'sm' | 'md' | 'lg'   (default 'md')
 * - invalid:  boolean — danger border + aria-invalid   (default false)
 * - leading:  node rendered before the field (e.g. an Icon)
 * - trailing: node rendered after the field (e.g. a clear button)
 * - all native <input> attributes (value, onChange, placeholder, disabled, type…)
 *
 * Accessibility:
 * - Always pair with a <label> (or aria-label). `invalid` sets aria-invalid.
 * - Decorative leading/trailing icons should be aria-hidden (Icon does this).
 *
 * @example
 * <Input placeholder="Search devices…" leading={<Icon as={Search} size="sm" tone="subtle" />} />
 * <Input invalid value={email} onChange={onChange} />
 */
export const Input = forwardRef(function Input(
  { size = 'md', invalid = false, leading, trailing, className, disabled, ...props },
  ref,
) {
  return (
    <div
      className={cx(
        'vds-input',
        `vds-input--${size}`,
        invalid && 'vds-input--invalid',
        disabled && 'vds-input--disabled',
        className,
      )}
    >
      {leading && <span className="vds-input__affix vds-input__affix--lead">{leading}</span>}
      <input
        ref={ref}
        className="vds-input__field"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...props}
      />
      {trailing && <span className="vds-input__affix vds-input__affix--trail">{trailing}</span>}
    </div>
  )
})

Input.displayName = 'Input'
