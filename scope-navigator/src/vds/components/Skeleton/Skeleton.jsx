import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/* Numbers become px; strings pass through ('4rem', '50%', …). */
function dim(v) {
  return typeof v === 'number' ? `${v}px` : v
}

/**
 * Skeleton
 *
 * A shimmering placeholder shown while real content loads. Match its shape to
 * the content it stands in for: `text` for lines of copy, `rect` for blocks
 * (cards, charts, images), `circle` for avatars. The shimmer uses the same
 * line → line-strong gradient as the Table and StatTile skeletons, so mixed
 * loading states pulse in one voice.
 *
 * Props:
 * - variant: 'text' | 'rect' | 'circle'   (default 'text')
 * - width:   CSS size (number → px)        (defaults: text/rect 100%, circle 2.5rem)
 * - height:  CSS size (number → px)        (defaults: text 0.75rem, rect 3rem, circle 2.5rem)
 * - lines:   text only — render N bars, the last one shorter   (default 1)
 * - all native span attributes
 *
 * Accessibility:
 * - aria-hidden — a skeleton carries no information; announce loading on the
 *   REGION instead (aria-busy on the container, or a visually hidden "Loading…").
 * - prefers-reduced-motion: the shimmer stops; bars hold a static tint.
 *
 * @example
 * <Skeleton variant="text" lines={3} />
 * <Skeleton variant="circle" width={40} height={40} />
 * <Skeleton variant="rect" height={120} />
 */
export const Skeleton = forwardRef(function Skeleton(
  { variant = 'text', width, height, lines = 1, className, style, ...props },
  ref,
) {
  const sized = {
    ...(width != null && { width: dim(width) }),
    ...(height != null && { height: dim(height) }),
    ...style,
  }

  // Multi-line text: the root becomes a stack of shimmering bars; the last bar
  // runs short so the block reads as a paragraph, not a grey slab.
  if (variant === 'text' && lines > 1) {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cx('vds-skeleton', 'vds-skeleton--lines', className)}
        style={sized}
        {...props}
      >
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="vds-skeleton__line" />
        ))}
      </span>
    )
  }

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cx('vds-skeleton', `vds-skeleton--${variant}`, className)}
      style={sized}
      {...props}
    />
  )
})

Skeleton.displayName = 'Skeleton'
