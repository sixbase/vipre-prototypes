import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Inline
 *
 * Horizontal layout primitive — children flow left-to-right with a token-spaced
 * gap, vertically centered by default. Replaces ad-hoc `flex items-center gap-*`.
 *
 * Props:
 * - gap:     spacing step 0–12          (default 2 → --vds-space-2 / 8px)
 * - align:   'start'|'center'|'end'|'baseline'|'stretch'  (default 'center')
 * - justify: 'start'|'center'|'between'|'end'              (optional)
 * - wrap:    allow wrapping             (default false)
 * - as:      element/tag to render      (default 'div')
 * - all native attributes
 *
 * @example
 * <Inline gap={2}><Icon/> <Text>Label</Text></Inline>
 * <Inline justify="between" wrap>…</Inline>
 */
export const Inline = forwardRef(function Inline(
  { gap = 2, align = 'center', justify, wrap = false, as: Tag = 'div', className, children, ...props },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx(
        'vds-inline',
        `vds-inline--gap-${gap}`,
        `vds-inline--align-${align}`,
        justify && `vds-inline--justify-${justify}`,
        wrap && 'vds-inline--wrap',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
})

Inline.displayName = 'Inline'
