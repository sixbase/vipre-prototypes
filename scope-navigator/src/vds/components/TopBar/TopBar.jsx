import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * TopBar
 *
 * The horizontal chrome strip across the top of a screen — --vds-topbar-h
 * tall, three slots wide: `leading` (hamburger / logo), `children` (the title
 * or breadcrumb — it takes the middle and truncates first), and `trailing`
 * (actions, avatar, search).
 *
 * Two tones:
 * - 'surface' — a theme surface with a hairline underneath; flips with
 *   light/dark like any other surface.
 * - 'navy'    — the fixed midnight chrome, matching the SideNav rail. Same
 *   navy in BOTH themes; it is product chrome, not a theme surface.
 *
 * Horizontal padding respects device safe areas (notches, rounded corners),
 * so edge slots never hide under hardware.
 *
 * Props:
 * - leading:  node — pinned left, never shrinks (e.g. <AppShellNavTrigger />).
 * - children: the middle slot — title, breadcrumb, tabs. Truncates gracefully.
 * - trailing: node — pinned right, never shrinks.
 * - sticky:   boolean — stick to the top of the nearest scroll container on
 *             --vds-z-sticky (default false; inside an AppShell the bar is
 *             already pinned by the frame).
 * - tone:     'surface' | 'navy'   (default 'surface')
 * - all native header attributes
 *
 * @example
 * <TopBar
 *   leading={<AppShellNavTrigger />}
 *   trailing={<Button size="sm">New policy</Button>}
 * >
 *   <Heading level="subheading" as="h1">Devices</Heading>
 * </TopBar>
 */
export const TopBar = forwardRef(function TopBar(
  { leading, trailing, sticky = false, tone = 'surface', className, children, ...props },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cx(
        'vds-topbar',
        `vds-topbar--${tone}`,
        sticky && 'vds-topbar--sticky',
        className,
      )}
      {...props}
    >
      {leading != null && <div className="vds-topbar__leading">{leading}</div>}
      <div className="vds-topbar__body">{children}</div>
      {trailing != null && <div className="vds-topbar__trailing">{trailing}</div>}
    </header>
  )
})

TopBar.displayName = 'TopBar'
