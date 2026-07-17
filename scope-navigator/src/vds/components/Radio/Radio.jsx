import { forwardRef, useContext } from 'react'
import { cx } from '../../lib/cx.js'
import { RadioGroupContext } from '../RadioGroup/RadioGroupContext.js'

/**
 * Radio
 *
 * A labelled radio button — pick exactly one of a set. Mirrors Checkbox's
 * construction: a real <input type="radio"> (kept accessible) behind a styled
 * circle, wrapped in a <label> so the text selects it too.
 *
 * Usually rendered inside a RadioGroup, which supplies `name`, the selected
 * value, and the change handler via context — each Radio then only needs its
 * `value` and label. Standalone use works too: pass native props yourself.
 *
 * Props:
 * - value:    this option's value (matched against RadioGroup's value)
 * - children: optional label content
 * - all native radio attributes (name, checked, defaultChecked, onChange, disabled…)
 *
 * Accessibility:
 * - Native input keeps full keyboard behaviour: Tab reaches the group,
 *   Arrow keys move the selection between same-name radios.
 *
 * @example
 * <RadioGroup label="Plan" defaultValue="pro" onChange={setPlan}>
 *   <Radio value="starter">Starter</Radio>
 *   <Radio value="pro">Pro</Radio>
 * </RadioGroup>
 */
export const Radio = forwardRef(function Radio(
  { value, name, checked, onChange, disabled, className, children, ...props },
  ref,
) {
  const group = useContext(RadioGroupContext)
  const isDisabled = disabled ?? group?.disabled

  // Inside a group, the group owns name + selection; standalone, native props rule.
  const inputProps = group
    ? {
        name: name ?? group.name,
        checked: group.value === value,
        onChange: (e) => {
          group.onSelect(value, e)
          onChange?.(e)
        },
      }
    : { name, checked, onChange }

  return (
    <label className={cx('vds-radio', isDisabled && 'vds-radio--disabled', className)}>
      <input
        ref={ref}
        type="radio"
        className="vds-radio__input"
        value={value}
        disabled={isDisabled}
        {...inputProps}
        {...props}
      />
      <span className="vds-radio__circle" aria-hidden="true" />
      {children != null && <span className="vds-radio__label">{children}</span>}
    </label>
  )
})

Radio.displayName = 'Radio'
