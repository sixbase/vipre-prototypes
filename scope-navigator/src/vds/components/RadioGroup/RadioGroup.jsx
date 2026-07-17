import { forwardRef, useCallback, useId, useState } from 'react'
import { cx } from '../../lib/cx.js'
import { RadioGroupContext } from './RadioGroupContext.js'

/**
 * RadioGroup
 *
 * Groups Radio children into one exclusive choice. It supplies the shared
 * `name`, tracks the selected value (controlled or uncontrolled), and hands
 * the change handler down via context — each Radio only needs a `value`.
 *
 * Standard radio keyboard behaviour comes free from the native inputs:
 * Tab reaches the group, Arrow keys move the selection.
 *
 * Props:
 * - name:         shared input name (auto-generated if omitted)
 * - value:        controlled selected value
 * - defaultValue: uncontrolled initial value
 * - onChange:     (value, event) => void
 * - orientation:  'vertical' (default) | 'horizontal' — horizontal wraps back
 *                 to vertical stacking when the container gets narrow
 * - label:        visible group label (or pass aria-label instead)
 * - disabled:     disables every Radio inside
 *
 * Accessibility:
 * - Renders role="radiogroup", named by `label` (aria-labelledby) or aria-label.
 *
 * @example
 * <RadioGroup label="Scan depth" defaultValue="quick" onChange={setDepth}>
 *   <Radio value="quick">Quick</Radio>
 *   <Radio value="full">Full</Radio>
 *   <Radio value="custom">Custom</Radio>
 * </RadioGroup>
 */
export const RadioGroup = forwardRef(function RadioGroup(
  {
    name,
    value,
    defaultValue,
    onChange,
    orientation = 'vertical',
    label,
    disabled = false,
    'aria-label': ariaLabel,
    className,
    children,
    ...props
  },
  ref,
) {
  const autoId = useId()
  const groupName = name ?? `vds-rg-${autoId}`
  const labelId = label != null ? `${groupName}-label` : undefined

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const selectedValue = isControlled ? value : internalValue

  const onSelect = useCallback(
    (next, event) => {
      if (!isControlled) setInternalValue(next)
      onChange?.(next, event)
    },
    [isControlled, onChange],
  )

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-labelledby={labelId}
      aria-label={labelId ? undefined : ariaLabel}
      className={cx(
        'vds-radio-group',
        `vds-radio-group--${orientation}`,
        disabled && 'vds-radio-group--disabled',
        className,
      )}
      {...props}
    >
      {label != null && (
        <span id={labelId} className="vds-radio-group__label">
          {label}
        </span>
      )}
      <div className="vds-radio-group__items">
        <RadioGroupContext.Provider
          value={{ name: groupName, value: selectedValue, onSelect, disabled }}
        >
          {children}
        </RadioGroupContext.Provider>
      </div>
    </div>
  )
})

RadioGroup.displayName = 'RadioGroup'
