import { forwardRef, useId } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Progress
 *
 * A linear progress bar. Give it a `value` for determinate progress (rollout at
 * 64%, quota nearly full); omit `value` for an indeterminate sweep while the
 * duration is unknown. The track/fill geometry matches the MetricCard target
 * bar so metric surfaces and standalone bars read as one family.
 *
 * Props:
 * - value:     0–max. undefined → indeterminate animated sweep
 * - max:       the scale's top end                          (default 100)
 * - tone:      'primary' | 'success' | 'warning' | 'danger', or a chromatic
 *              family for categorical (no good/bad) series:
 *              'azure' | 'harbor' | 'emerald' | 'amber' | 'rose' | 'orchid' | 'clay'
 *              (default 'primary')
 * - size:      'sm' | 'md' | 'lg' → 4 / 8 / 12px track       (default 'md')
 * - label:     visible label above the bar (also names the progressbar)
 * - showValue: show the percentage beside the label          (default false)
 * - all native div attributes (aria-label lands on the progressbar itself)
 *
 * Accessibility:
 * - role="progressbar" with aria-valuemin/max/now; indeterminate drops
 *   aria-valuenow and sets aria-busy instead.
 * - A visible `label` is wired up via aria-labelledby. Without one, pass
 *   `aria-label` so the bar still has a name.
 * - prefers-reduced-motion: the sweep becomes a gentle opacity pulse and the
 *   fill snaps to its width instead of sliding.
 *
 * @example
 * <Progress value={64} label="Rollout" showValue />
 * <Progress value={92} tone="danger" size="sm" aria-label="Disk usage" />
 * <Progress aria-label="Scanning" />   // indeterminate
 */
export const Progress = forwardRef(function Progress(
  {
    value,
    max = 100,
    tone = 'primary',
    size = 'md',
    label,
    showValue = false,
    'aria-label': ariaLabel,
    className,
    ...props
  },
  ref,
) {
  const labelId = useId()
  const indeterminate = value == null
  const clamped = indeterminate ? undefined : Math.min(Math.max(value, 0), max)
  const pct = indeterminate ? undefined : (clamped / max) * 100
  const hasHead = label != null || (showValue && !indeterminate)

  return (
    <div
      ref={ref}
      className={cx(
        'vds-progress',
        `vds-progress--${size}`,
        `vds-progress--${tone}`,
        indeterminate && 'vds-progress--indeterminate',
        className,
      )}
      {...props}
    >
      {hasHead && (
        <div className="vds-progress__head">
          {label != null && (
            <span id={labelId} className="vds-progress__label">
              {label}
            </span>
          )}
          {showValue && !indeterminate && (
            <span className="vds-progress__value">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div
        className="vds-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-busy={indeterminate || undefined}
        aria-labelledby={label != null ? labelId : undefined}
        aria-label={label == null ? ariaLabel : undefined}
      >
        <div
          className="vds-progress__fill"
          style={indeterminate ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  )
})

Progress.displayName = 'Progress'
