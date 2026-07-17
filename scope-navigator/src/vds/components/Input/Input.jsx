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
 * - size:     'xs' | 'sm' | 'md' | 'lg' | 'xl'   (default 'md')
 * - invalid:  boolean — danger border + aria-invalid   (default false)
 * - prefix:   node/string — an attached segment INSIDE the border, before everything
 *             (e.g. "$", "https://") — chrome, not the affix icon slot
 * - leading:  node rendered before the field (e.g. an Icon)
 * - trailing: node rendered after the field (e.g. a clear button)
 * - suffix:   node/string — an attached segment INSIDE the border, after everything
 *             (e.g. "kg", ".00")
 * - all native <input> attributes (value, onChange, placeholder, disabled, type…)
 *
 * Accessibility:
 * - Always pair with a <label> (or aria-label). `invalid` sets aria-invalid.
 * - Decorative leading/trailing icons should be aria-hidden (Icon does this).
 * - prefix/suffix are static chrome (a unit, a currency mark) — read for context, not
 *   interactive; put the value's real label on the field, not the add-on.
 *
 * @example
 * <Input placeholder="Search devices…" leading={<Icon as={Search} size="sm" tone="subtle" />} />
 * <Input invalid value={email} onChange={onChange} />
 * <Input prefix="$" placeholder="0.00" aria-label="Amount" />
 * <Input suffix="kg" defaultValue="68" aria-label="Weight" />
 */
export const Input = forwardRef(function Input(
  { size = 'md', invalid = false, prefix, suffix, leading, trailing, className, disabled, ...props },
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
      {prefix && <span className="vds-input__addon vds-input__addon--prefix">{prefix}</span>}
      {leading && <span className="vds-input__affix vds-input__affix--lead">{leading}</span>}
      <input
        ref={ref}
        className="vds-input__field"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...props}
      />
      {trailing && <span className="vds-input__affix vds-input__affix--trail">{trailing}</span>}
      {suffix && <span className="vds-input__addon vds-input__addon--suffix">{suffix}</span>}
    </div>
  )
})

Input.displayName = 'Input'
