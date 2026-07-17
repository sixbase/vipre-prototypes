import { forwardRef, useState } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Slider
 *
 * A styled native <input type="range"> — pick a number by dragging. The filled
 * part of the track is painted by a CSS gradient bound to a `--vds-slider-pct`
 * custom property that updates as the value changes; the thumb, track, and
 * focus ring are all token-bound. Keyboard support (arrows, Home/End, Page
 * Up/Down) comes free from the native input.
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 *
 * Props:
 * - min / max / step: range bounds            (default 0 / 100 / 1)
 * - value:        controlled value (number)
 * - defaultValue: uncontrolled initial value
 * - onChange:     (value, event) => void — value is a number
 * - showValue:    render the current value inline after the track
 * - marks:        optional tick positions — numbers, or { value, label }
 * - size:         'sm' | 'md'                 (default 'md')
 * - disabled:     boolean
 * - all other native range-input attributes (aria-label, list, name…)
 *
 * Accessibility:
 * - Native range input: full keyboard + screen-reader value reporting.
 * - Give it a name via aria-label or wrap it in a Field.
 * - The hit area grows to --vds-tap-target on touch (coarse) pointers.
 *
 * @example
 * <Slider min={0} max={100} defaultValue={40} showValue aria-label="Threshold" />
 */
export const Slider = forwardRef(function Slider(
  {
    min = 0,
    max = 100,
    step = 1,
    value,
    defaultValue,
    onChange,
    showValue = false,
    marks,
    size = 'md',
    disabled = false,
    className,
    style,
    ...props
  },
  ref,
) {
  const isControlled = value !== undefined
  // native default when neither is given: the midpoint (matches the browser)
  const [internalValue, setInternalValue] = useState(defaultValue ?? min + (max - min) / 2)
  const current = isControlled ? value : internalValue
  const pct = max > min ? ((current - min) / (max - min)) * 100 : 0

  const handleChange = (e) => {
    const next = Number(e.target.value)
    if (!isControlled) setInternalValue(next)
    onChange?.(next, e)
  }

  const tickPct = (v) => (max > min ? ((v - min) / (max - min)) * 100 : 0)
  const normalizedMarks = marks?.map((m) => (typeof m === 'object' ? m : { value: m }))

  return (
    <span
      className={cx(
        'vds-slider',
        `vds-slider--${size}`,
        disabled && 'vds-slider--disabled',
        normalizedMarks?.some((m) => m.label != null) && 'vds-slider--labelled-marks',
        className,
      )}
    >
      <span className="vds-slider__control">
        <input
          ref={ref}
          type="range"
          className="vds-slider__input"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={handleChange}
          disabled={disabled}
          style={{ '--vds-slider-pct': pct, ...style }}
          {...props}
        />
        {normalizedMarks && (
          <span className="vds-slider__marks" aria-hidden="true">
            {normalizedMarks.map((m) => (
              <span
                key={m.value}
                className="vds-slider__mark"
                style={{ '--vds-slider-mark-pct': tickPct(m.value) }}
              >
                {m.label != null && <span className="vds-slider__mark-label">{m.label}</span>}
              </span>
            ))}
          </span>
        )}
      </span>
      {showValue && <output className="vds-slider__value">{current}</output>}
    </span>
  )
})

Slider.displayName = 'Slider'
