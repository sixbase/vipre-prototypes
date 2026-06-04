import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Switch
 *
 * An on/off toggle for immediate settings (e.g. dark mode, a filter). Renders a
 * real checkbox with role="switch" behind a track + thumb, wrapped in a <label>.
 *
 * Props:
 * - children: optional label content
 * - all native checkbox attributes (checked, defaultChecked, onChange, disabled…)
 *
 * Accessibility:
 * - role="switch" exposes the on/off state; the native input handles keyboard.
 * - Use for instant changes; use a Checkbox for "select then submit" choices.
 *
 * @example
 * <Switch defaultChecked>Email alerts</Switch>
 */
export const Switch = forwardRef(function Switch({ disabled, className, children, ...props }, ref) {
  return (
    <label className={cx('vds-switch', disabled && 'vds-switch--disabled', className)}>
      <input ref={ref} type="checkbox" role="switch" className="vds-switch__input" disabled={disabled} {...props} />
      <span className="vds-switch__track" aria-hidden="true">
        <span className="vds-switch__thumb" />
      </span>
      {children != null && <span className="vds-switch__label">{children}</span>}
    </label>
  )
})

Switch.displayName = 'Switch'
