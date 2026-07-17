import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Kbd
 *
 * A tiny inline key cap for keyboard hints — shortcut chips in menus,
 * palette footers, and docs ("Press ⌘K"). Renders a semantic <kbd> with a
 * subtle raised-key treatment: surface fill, hairline border, and a bottom
 * edge shadow. Numerals are tabular so combos like "F5" and "F12" line up.
 *
 * Props:
 * - size: 'sm' | 'md'   (default 'md')
 * - all native <kbd> attributes (title, aria-*, …)
 *
 * Accessibility:
 * - Screen readers announce the text content as-is; prefer real key names
 *   ("Esc", "Enter") over glyph-only content when the glyph isn't read
 *   (e.g. pair "↵" with an aria-label).
 *
 * @example
 * Press <Kbd>⌘</Kbd><Kbd>K</Kbd> to search
 * <Kbd size="sm">esc</Kbd>
 */
export const Kbd = forwardRef(function Kbd({ size = 'md', className, children, ...props }, ref) {
  return (
    <kbd ref={ref} className={cx('vds-kbd', `vds-kbd--${size}`, className)} {...props}>
      {children}
    </kbd>
  )
})

Kbd.displayName = 'Kbd'
