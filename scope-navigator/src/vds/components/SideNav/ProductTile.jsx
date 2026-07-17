import { forwardRef, useId } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * ProductTile
 *
 * The 32px rounded gradient tile that fronts a product in the SideNav. One
 * glyph drives two states: a vibrant brand-gradient tile when the product is
 * subscribed, and a muted flat-navy tile when it isn't (`muted`).
 *
 * TOKEN-BOUND GRADIENTS: every stop is a CSS custom property, so a reseller
 * re-brand re-tints the tiles along with the rest of the chrome —
 *   --vds-tile-accent (defaults to --vds-nav-accent) — gradient top + edge base
 *   --vds-tile-edge   (defaults to --vds-azure-400)  — the bright border highlight
 * The tile bottoms out on the fixed midnight ramp, matching the navy rail.
 *
 * Props:
 * - glyph:    string — an SVG path `d` drawn on the 32×32 grid (see the SideNav
 *             docs for ready-made product glyphs). Ignored when children given.
 * - children: custom SVG content (e.g. a <path>/<g>) rendered on the same
 *             32×32 grid instead of `glyph`. Muted tint is NOT applied to
 *             children — style them yourself.
 * - muted:    boolean — the locked / not-subscribed treatment (default false)
 * - size:     number — rendered px size (default 32)
 * - label:    accessible name; without it the tile is decorative (aria-hidden)
 * - all native SVG attributes
 *
 * @example
 * <ProductTile glyph={IES_GLYPH} />
 * <ProductTile glyph={SAT_GLYPH} muted />   // locked product
 * <ProductTile glyph={IES_GLYPH} size={24} />
 */
export const ProductTile = forwardRef(function ProductTile(
  { glyph, muted = false, size = 32, label, className, children, style, ...props },
  ref,
) {
  // Gradient defs need document-unique ids — useId keeps repeated tiles apart.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }

  if (muted) {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className={cx('vds-product-tile', 'vds-product-tile--muted', className)}
        style={{ display: 'block', ...style }}
        {...a11y}
        {...props}
      >
        <rect width="32" height="32" rx="8" style={{ fill: 'var(--vds-midnight-900)' }} />
        {children ?? (glyph && <path d={glyph} style={{ fill: 'var(--vds-midnight-400)' }} />)}
      </svg>
    )
  }

  const bg = `vds-ptbg-${uid}`
  const bd = `vds-ptbd-${uid}`
  const gl = `vds-ptgl-${uid}`
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cx('vds-product-tile', className)}
      style={{ display: 'block', ...style }}
      {...a11y}
      {...props}
    >
      <rect width="32" height="32" rx="8" fill={`url(#${bg})`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke={`url(#${bd})`} strokeOpacity="0.25" />
      {children ?? (glyph && <path d={glyph} fill={`url(#${gl})`} />)}
      <defs>
        {/* Tile face: accent → deepest navy, top-lit. */}
        <linearGradient id={bg} x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: 'var(--vds-tile-accent, var(--vds-nav-accent))' }} />
          <stop offset="1" style={{ stopColor: 'var(--vds-midnight-1000)' }} />
        </linearGradient>
        {/* Edge highlight: bright azure catching the top edge, fading to accent. */}
        <linearGradient id={bd} x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: 'var(--vds-tile-edge, var(--vds-azure-400))' }} />
          <stop offset="1" style={{ stopColor: 'var(--vds-tile-accent, var(--vds-nav-accent))' }} />
        </linearGradient>
        {/* Glyph: white → soft navy, so the mark reads lit from above. */}
        <linearGradient id={gl} x1="16" y1="8" x2="16" y2="24" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: 'var(--vds-white)' }} />
          <stop offset="1" style={{ stopColor: 'var(--vds-midnight-400)' }} />
        </linearGradient>
      </defs>
    </svg>
  )
})

ProductTile.displayName = 'ProductTile'
