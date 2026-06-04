import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Sparkline
 *
 * A tiny inline trend chart (line + optional area fill) drawn as a single SVG —
 * no charting dependency. Inherits a tone color. Great inside a Stat Tile or a
 * table cell.
 *
 * Props:
 * - data:        number[] — the series (≥2 points)
 * - tone:        'primary' | 'success' | 'warning' | 'danger' | 'muted', or a
 *                chromatic family for categorical series: 'azure' | 'harbor' |
 *                'emerald' | 'amber' | 'rose' | 'orchid' | 'clay'  (default 'primary')
 * - width/height: px of the drawing box   (default 96 × 28)
 * - area:        fill under the line       (default true)
 * - label:       accessible name; if omitted the chart is decorative (aria-hidden)
 *
 * @example
 * <Sparkline data={[3,5,4,6,8,7,9]} tone="success" label="7-day growth" />
 */
export const Sparkline = forwardRef(function Sparkline(
  { data = [], tone = 'primary', width = 96, height = 28, area = true, className, label, ...props },
  ref,
) {
  const pad = 2 // keep the stroke off the edges
  const n = data.length
  let line = ''
  let fill = ''
  if (n >= 2) {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const stepX = (width - pad * 2) / (n - 1)
    const pts = data.map((v, i) => {
      const x = pad + i * stepX
      const y = pad + (1 - (v - min) / range) * (height - pad * 2)
      return [x, y]
    })
    line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    fill = `M${pad},${height - pad} ` + pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${width - pad},${height - pad} Z`
  }
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' }

  return (
    <svg
      ref={ref}
      className={cx('vds-sparkline', `vds-sparkline--${tone}`, className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      {...a11y}
      {...props}
    >
      {area && fill && <path className="vds-sparkline__area" d={fill} />}
      {line && <polyline className="vds-sparkline__line" points={line} />}
    </svg>
  )
})

Sparkline.displayName = 'Sparkline'
