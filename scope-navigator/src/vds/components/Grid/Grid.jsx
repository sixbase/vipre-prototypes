import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Grid
 *
 * A responsive auto-fit grid: children flow into as many equal columns as fit
 * at the given minimum width, then collapse — down to a single stacked column
 * on small screens. No media queries, and it never overflows (the column floor
 * is min(100%, min)). Ideal for KPI tiles and card groups.
 *
 * Props:
 * - min: minimum column width before wrapping (default '14rem')
 * - gap: spacing step 0–8 → --vds-space-*  (default 3 / 12px)
 * - as:  element to render (default 'div')
 *
 * @example
 * <Grid min="14rem" gap={3}>
 *   <StatTile … /><StatTile … /><StatTile … />
 * </Grid>
 */
export const Grid = forwardRef(function Grid(
  { min = '14rem', gap = 3, as: Tag = 'div', style, className, children, ...props },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx('vds-grid', className)}
      style={{ '--vds-grid-min': min, gap: `var(--vds-space-${gap})`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  )
})

Grid.displayName = 'Grid'
