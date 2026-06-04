import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/Icon.jsx'

/**
 * Select
 *
 * A native <select> styled to match Input (same neutral-graphite chrome, sizes,
 * and recessed fill) with a chevron affix. The forwarded ref points at the
 * underlying <select>; pass <option> children.
 *
 * Props:
 * - size:    'sm' | 'md' | 'lg'   (default 'md')
 * - invalid: boolean — danger border + aria-invalid   (default false)
 * - all native <select> attributes (value, onChange, disabled…)
 *
 * Accessibility:
 * - Native select = full keyboard + platform picker. Pair with a <label>.
 *
 * @example
 * <Select defaultValue="active">
 *   <option value="active">Active</option>
 *   <option value="suspended">Suspended</option>
 * </Select>
 */
export const Select = forwardRef(function Select(
  { size = 'md', invalid = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <div
      className={cx(
        'vds-select',
        `vds-select--${size}`,
        invalid && 'vds-select--invalid',
        disabled && 'vds-select--disabled',
        className,
      )}
    >
      <select
        ref={ref}
        className="vds-select__field"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
      <span className="vds-select__chevron" aria-hidden="true">
        <Icon as={ChevronDown} size="sm" />
      </span>
    </div>
  )
})

Select.displayName = 'Select'
