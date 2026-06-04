import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Stack
 *
 * Vertical layout primitive — children flow top-to-bottom with a token-spaced
 * gap. Replaces ad-hoc `flex flex-col gap-*` so vertical rhythm is always a
 * spacing token, never a raw value.
 *
 * Props:
 * - gap:     spacing step 0–12          (default 4 → --vds-space-4 / 16px)
 * - align:   'start'|'center'|'end'|'stretch'           (default 'stretch')
 * - justify: 'start'|'center'|'between'|'end'            (optional)
 * - as:      element/tag to render      (default 'div')
 * - all native attributes
 *
 * @example
 * <Stack gap={2}>…</Stack>
 * <Stack gap={6} align="center" as="section">…</Stack>
 */
export const Stack = forwardRef(function Stack(
  { gap = 4, align = 'stretch', justify, as: Tag = 'div', className, children, ...props },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx(
        'vds-stack',
        `vds-stack--gap-${gap}`,
        `vds-stack--align-${align}`,
        justify && `vds-stack--justify-${justify}`,
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
})

Stack.displayName = 'Stack'
