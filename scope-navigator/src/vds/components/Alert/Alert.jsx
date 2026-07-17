import { forwardRef, isValidElement } from 'react'
import { CircleCheck, TriangleAlert, X } from '@icons'
// The auto-generated @icons shim has no info/error circle glyphs; pull them
// from the same Material Symbols (Rounded) set it wraps.
import InfoGlyph from '~icons/material-symbols/info-outline-rounded'
import ErrorGlyph from '~icons/material-symbols/error-outline-rounded'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'

/* Default glyph per tone. */
const TONE_ICONS = {
  neutral: InfoGlyph,
  info: InfoGlyph,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: ErrorGlyph,
}

/** Tones that demand attention and should interrupt via role="alert". */
const URGENT_TONES = new Set(['warning', 'danger'])

/**
 * Alert
 *
 * An inline banner for page- or section-level messages: a soft tone tint, a
 * tone-colored left accent, an auto-picked icon, and room for a title,
 * description, actions, and a dismiss button. Alerts sit IN the page flow —
 * for transient notifications, reach for a toast layer instead.
 *
 * Props:
 * - tone:        'neutral' | 'info' | 'success' | 'warning' | 'danger'  (default 'info')
 * - title:       bold first line
 * - children:    the description body
 * - icon:        override the tone's default glyph — an icon component or a
 *                rendered node. Pass `icon={false}` (or null) to hide it.
 * - dismissible: show an × button                     (default false)
 * - onDismiss:   called when the × is pressed (the caller unmounts the alert)
 * - actions:     node rendered below the text (e.g. <Button size="sm">…)
 * - all native div attributes (an explicit `role` overrides the automatic one)
 *
 * Accessibility:
 * - info/success/neutral announce politely via role="status"; warning/danger
 *   interrupt via role="alert". Pass `role` to override.
 * - The icon is decorative (aria-hidden) — the meaning lives in the text.
 * - The dismiss button is labelled "Dismiss" and meets the coarse-pointer
 *   tap-target size.
 *
 * @example
 * <Alert tone="success" title="Scan complete">No threats found on 214 devices.</Alert>
 * <Alert tone="danger" title="Agent offline" dismissible onDismiss={hide}
 *        actions={<Button size="sm" tone="danger">Reconnect</Button>}>
 *   3 endpoints have not reported in 24 hours.
 * </Alert>
 */
export const Alert = forwardRef(function Alert(
  {
    tone = 'info',
    title,
    icon,
    dismissible = false,
    onDismiss,
    actions,
    role,
    className,
    children,
    ...props
  },
  ref,
) {
  const resolvedRole = role ?? (URGENT_TONES.has(tone) ? 'alert' : 'status')

  // icon: undefined → tone default · false/null → hidden · node → as-is ·
  // component → wrapped in <Icon>.
  let iconEl = null
  if (icon !== false && icon !== null) {
    const Glyph = icon ?? TONE_ICONS[tone]
    iconEl = isValidElement(Glyph) ? Glyph : <Icon as={Glyph} size="md" />
  }

  return (
    <div
      ref={ref}
      role={resolvedRole}
      className={cx('vds-alert', `vds-alert--${tone}`, className)}
      {...props}
    >
      {iconEl && (
        <span className="vds-alert__icon" aria-hidden="true">
          {iconEl}
        </span>
      )}
      <div className="vds-alert__body">
        {title != null && <div className="vds-alert__title">{title}</div>}
        {children != null && <div className="vds-alert__desc">{children}</div>}
        {actions != null && <div className="vds-alert__actions">{actions}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          className="vds-alert__dismiss"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <Icon as={X} size="sm" />
        </button>
      )}
    </div>
  )
})

Alert.displayName = 'Alert'
