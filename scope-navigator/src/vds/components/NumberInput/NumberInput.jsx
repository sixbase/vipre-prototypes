import { forwardRef, useRef, useState } from 'react'
import { Plus, Minus } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'
import { Input } from '../Input/index.js'

/* Merge the forwarded ref with the local one (both point at the <input>). */
function mergeRefs(...refs) {
  return (node) => {
    for (const r of refs) {
      if (!r) continue
      if (typeof r === 'function') r(node)
      else r.current = node
    }
  }
}

/**
 * NumberInput
 *
 * A numeric field composed on Input (type="number"). The native input is the
 * source of truth — Enter, ArrowUp / ArrowDown, and typing all work natively;
 * the trailing slot adds a vertical stepper (Increment / Decrement) as a
 * pointer affordance that clamps to `min` / `max` and moves by `step`. Each
 * stepper button disables itself at its bound. Text is flush-right by default
 * (--vds-number-align) because numbers read better right-aligned.
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 * `onChange` receives a NUMBER, or '' when the field is cleared — never the event.
 *
 * Props:
 * - value / defaultValue: controlled / uncontrolled number (or '')
 * - onChange:   (value: number | '') => void
 * - min / max:  optional bounds — clamp the stepper and disable it at the edge
 * - step:       stepper increment   (default 1)
 * - precision:  optional — round stepped values to this many decimals
 * - size:       'xs' | 'sm' | 'md' | 'lg' | 'xl'   (default 'md')
 * - invalid:    boolean — danger border + aria-invalid   (default false)
 * - disabled:   boolean   (default false)
 * - all other native <input> attributes
 *
 * Accessibility:
 * - Stepper buttons are real <button type="button">s with aria-labels
 *   "Increment" / "Decrement"; they sit OUT of the tab order (tabIndex -1)
 *   because the native input already offers ArrowUp / ArrowDown to keyboards.
 * - Pair with a <label> (or aria-label) like any Input; `invalid` sets aria-invalid.
 *
 * @example
 * <NumberInput min={0} max={10} defaultValue={1} onChange={setQty} />
 * <NumberInput step={0.5} precision={2} defaultValue={1.5} />
 */
export const NumberInput = forwardRef(function NumberInput(
  {
    value,
    defaultValue,
    onChange,
    min,
    max,
    step = 1,
    precision,
    size = 'md',
    invalid = false,
    disabled = false,
    className,
    ...props
  },
  ref,
) {
  const innerRef = useRef(null)
  const isControlled = value !== undefined
  const [internal, setInternal] = useState(defaultValue ?? '')
  const current = isControlled ? value : internal

  const hasMin = min !== undefined && min !== null && min !== ''
  const hasMax = max !== undefined && max !== null && max !== ''

  const clamp = (n) => {
    let out = n
    if (hasMin && out < Number(min)) out = Number(min)
    if (hasMax && out > Number(max)) out = Number(max)
    return out
  }
  const applyPrecision = (n) =>
    precision !== undefined && precision !== null ? Number(n.toFixed(precision)) : n

  const commit = (next) => {
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  const handleChange = (e) => {
    const raw = e.target.value
    if (!isControlled) setInternal(raw === '' ? '' : Number(raw))
    onChange?.(raw === '' ? '' : Number(raw))
  }

  const stepBy = (dir) => {
    const base =
      current === '' || current === null || current === undefined || Number.isNaN(Number(current))
        ? hasMin
          ? Number(min)
          : 0
        : Number(current)
    commit(applyPrecision(clamp(base + dir * step)))
    innerRef.current?.focus()
  }

  const numeric = current === '' || current === null || current === undefined ? null : Number(current)
  const atMax = hasMax && numeric !== null && numeric >= Number(max)
  const atMin = hasMin && numeric !== null && numeric <= Number(min)

  const stepper = (
    <span className="vds-number__stepper">
      <button
        type="button"
        className="vds-number__step vds-number__step--up"
        aria-label="Increment"
        tabIndex={-1}
        disabled={disabled || atMax}
        onClick={() => stepBy(1)}
      >
        <Icon as={Plus} size="xs" />
      </button>
      <button
        type="button"
        className="vds-number__step vds-number__step--down"
        aria-label="Decrement"
        tabIndex={-1}
        disabled={disabled || atMin}
        onClick={() => stepBy(-1)}
      >
        <Icon as={Minus} size="xs" />
      </button>
    </span>
  )

  return (
    <Input
      ref={mergeRefs(ref, innerRef)}
      type="number"
      inputMode="decimal"
      className={cx('vds-number', className)}
      size={size}
      invalid={invalid}
      disabled={disabled}
      value={current}
      onChange={handleChange}
      min={hasMin ? min : undefined}
      max={hasMax ? max : undefined}
      step={step}
      trailing={stepper}
      {...props}
    />
  )
})

NumberInput.displayName = 'NumberInput'
