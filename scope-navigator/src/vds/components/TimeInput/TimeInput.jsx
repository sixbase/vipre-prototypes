import { forwardRef } from 'react'
import { Clock } from '@icons'
import { Icon } from '../Icon/index.js'
import { Input } from '../Input/index.js'

/**
 * TimeInput
 *
 * A time field — native-first. It is an Input with `type="time"` and a leading
 * Clock icon, so it inherits every bit of Input's chrome (sizes, invalid state,
 * focus ring, disabled) for free and delegates the actual time entry to the
 * platform's built-in time UI (the browser's stepper / clock popover). No
 * custom parsing, no custom dropdown — the OS keyboard and locale win.
 *
 * Props:
 * - value / defaultValue: 'HH:mm' string (native <input type=time> format)
 * - onChange:  native change handler — read e.target.value
 * - min / max: 'HH:mm' bounds
 * - step:      seconds granularity (e.g. 60 = minute steps, 900 = 15 min)
 * - size:      'xs' | 'sm' | 'md' | 'lg' | 'xl'   (default 'md')
 * - invalid:   boolean — danger border + aria-invalid
 * - disabled:  boolean
 * - all other native <input> attributes spread onto the field
 *
 * Accessibility:
 * - Pair with a <label> (or aria-label). `invalid` sets aria-invalid.
 * - The leading Clock icon is decorative (aria-hidden via Icon).
 * - The platform time UI carries its own keyboard behavior — nothing to reimplement.
 *
 * @example
 * <TimeInput defaultValue="09:30" step={900} onChange={(e) => set(e.target.value)} />
 */
export const TimeInput = forwardRef(function TimeInput(
  { size = 'md', invalid = false, disabled = false, ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      type="time"
      size={size}
      invalid={invalid}
      disabled={disabled}
      className="vds-timeinput"
      leading={<Icon as={Clock} size="sm" className="vds-timeinput__lead" />}
      {...props}
    />
  )
})

TimeInput.displayName = 'TimeInput'
