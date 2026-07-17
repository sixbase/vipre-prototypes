import { forwardRef, useId, useLayoutEffect, useRef, useState } from 'react'
import { cx } from '../../lib/cx.js'

/* Merge a forwarded ref with a local one. */
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
 * SegmentedControl
 *
 * An inline exclusive toggle — a row of segments where exactly one is active
 * (iOS segments / the MSP persona toggle). Built on native radio inputs, so
 * arrow-key movement, form posting, and screen-reader semantics come free.
 * The active pill is a measured thumb that slides between segments (and
 * simply jumps for reduced-motion users).
 *
 * Use it for switching views of the same data (Day/Week/Month, List/Grid).
 * For settings that submit later, use RadioGroup; for on/off, use Switch.
 *
 * Props:
 * - options:      [{ value, label, icon?, disabled? }] — icon is a node
 * - value:        controlled selected value
 * - defaultValue: uncontrolled initial value
 * - onChange:     (value, event) => void
 * - size:         'sm' | 'md'   (default 'md')
 * - fullWidth:    stretch to the container; segments share the width equally
 * - name:         shared input name (auto-generated if omitted)
 *
 * Accessibility:
 * - Native radios inside role="radiogroup"; name the group with aria-label.
 * - Focus ring on the active segment via :focus-visible.
 * - Overflow scrolls horizontally — segments never wrap.
 *
 * @example
 * <SegmentedControl
 *   aria-label="Timeframe"
 *   options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]}
 *   defaultValue="day"
 *   onChange={setTimeframe}
 * />
 */
export const SegmentedControl = forwardRef(function SegmentedControl(
  {
    options = [],
    value,
    defaultValue,
    onChange,
    size = 'md',
    fullWidth = false,
    name,
    className,
    ...props
  },
  ref,
) {
  const autoId = useId()
  const groupName = name ?? `vds-seg-${autoId}`

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const current = isControlled ? value : internalValue

  const rootRef = useRef(null)
  const segmentRefs = useRef(new Map())
  const [thumb, setThumb] = useState(null) // { left, width } in px

  // Measure the checked segment and park the thumb under it. Re-measures on
  // container resize (fonts, fullWidth reflow) via ResizeObserver.
  useLayoutEffect(() => {
    const measure = () => {
      const seg = segmentRefs.current.get(current)
      if (seg) setThumb({ left: seg.offsetLeft, width: seg.offsetWidth })
      else setThumb(null)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (rootRef.current) ro.observe(rootRef.current)
    return () => ro.disconnect()
  }, [current, options, size, fullWidth])

  const handleChange = (opt) => (e) => {
    if (!isControlled) setInternalValue(opt.value)
    onChange?.(opt.value, e)
  }

  return (
    <div
      ref={mergeRefs(ref, rootRef)}
      role="radiogroup"
      className={cx(
        'vds-segmented',
        `vds-segmented--${size}`,
        fullWidth && 'vds-segmented--full',
        className,
      )}
      {...props}
    >
      {thumb && (
        <span
          className="vds-segmented__thumb"
          aria-hidden="true"
          style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }}
        />
      )}
      {options.map((opt) => {
        const checked = opt.value === current
        return (
          <label
            key={String(opt.value)}
            ref={(node) => {
              if (node) segmentRefs.current.set(opt.value, node)
              else segmentRefs.current.delete(opt.value)
            }}
            className={cx(
              'vds-segmented__segment',
              checked && 'vds-segmented__segment--checked',
              opt.disabled && 'vds-segmented__segment--disabled',
            )}
          >
            <input
              type="radio"
              className="vds-segmented__input"
              name={groupName}
              value={opt.value}
              checked={checked}
              onChange={handleChange(opt)}
              disabled={opt.disabled}
            />
            <span className="vds-segmented__face">
              {opt.icon != null && <span className="vds-segmented__icon">{opt.icon}</span>}
              <span className="vds-segmented__text">{opt.label}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
})

SegmentedControl.displayName = 'SegmentedControl'
