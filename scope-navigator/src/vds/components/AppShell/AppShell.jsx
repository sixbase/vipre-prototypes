import { createContext, forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { cx } from '../../lib/cx.js'
import { getFocusable, useFocusReturn, useScrollLock } from '../Modal/overlayUtils.js'

/* Shares nav-drawer state with <AppShellNavTrigger> without prop-drilling. */
const AppShellContext = createContext(null)

/* Below this width the nav column becomes an off-canvas drawer. Read from the
   --vds-bp-lg token so JS and the SCSS media query never drift apart. */
function readLgBreakpoint() {
  if (typeof window === 'undefined') return 1024
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--vds-bp-lg')
  const px = parseFloat(raw)
  return Number.isNaN(px) ? 1024 : px
}

/** True while the viewport is narrower than the lg breakpoint (drawer mode). */
function useDrawerMode() {
  const [narrow, setNarrow] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(`(max-width: ${readLgBreakpoint() - 0.02}px)`).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${readLgBreakpoint() - 0.02}px)`)
    const onChange = (e) => setNarrow(e.matches)
    setNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return narrow
}

/**
 * AppShell
 *
 * The application frame: a fixed nav rail on the left (usually a SideNav), an
 * optional TopBar above the content, and a content area that owns its own
 * scroll. The shell fills the viewport; only the content scrolls.
 *
 * The nav COLUMN sizes itself to whatever you put in it — a SideNav animates
 * its own width between --vds-sidenav-w and --vds-sidenav-w-collapsed, and the
 * content follows along for free.
 *
 * RESPONSIVE: below the lg breakpoint the nav leaves the layout and becomes an
 * off-canvas drawer over a scrim. Put an <AppShellNavTrigger> (the hamburger —
 * it only shows below lg) in your TopBar to open it. The drawer closes on
 * Escape, on a scrim click, and automatically when the viewport grows past lg;
 * body scroll locks while it is open, and focus moves into the nav and returns
 * to the trigger on close.
 *
 * The content area is a container (container-type: inline-size), so
 * @container queries inside it respond to the CONTENT width — which changes
 * when the rail collapses — not the viewport.
 *
 * Nav-drawer state is controlled OR uncontrolled: pass `navOpen` (+
 * `onNavOpenChange`) to own it, or let the shell manage itself.
 *
 * Props:
 * - nav:             node — the nav rail (a SideNav, or anything).
 * - topBar:          node — rendered above the content (usually a TopBar).
 * - navOpen:         boolean — controlled drawer state (below lg only).
 * - defaultNavOpen:  boolean — uncontrolled initial state (default false).
 * - onNavOpenChange: (open) => void
 * - children:        the page content.
 * - all native div attributes spread onto the shell root
 *
 * @example
 * <AppShell
 *   nav={<SideNav sections={sections} activeId={page} onSelect={setPage} />}
 *   topBar={<TopBar leading={<AppShellNavTrigger />}>Devices</TopBar>}
 * >
 *   <PageContent />
 * </AppShell>
 */
export const AppShell = forwardRef(function AppShell(
  {
    nav,
    topBar,
    navOpen: navOpenProp,
    defaultNavOpen = false,
    onNavOpenChange,
    className,
    children,
    ...props
  },
  ref,
) {
  // ---- drawer state: controlled + uncontrolled ----
  const controlled = navOpenProp !== undefined
  const [internalOpen, setInternalOpen] = useState(defaultNavOpen)
  const navOpen = controlled ? !!navOpenProp : internalOpen
  const setNavOpen = (next) => {
    if (!controlled) setInternalOpen(next)
    onNavOpenChange?.(next)
  }

  const drawerMode = useDrawerMode()
  const drawerOpen = drawerMode && navOpen
  const navRef = useRef(null)

  // The page behind the drawer must not scroll; focus goes back to the
  // trigger when the drawer closes.
  useScrollLock(drawerOpen)
  useFocusReturn(drawerOpen)

  // Escape closes the drawer from anywhere.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  // Move focus into the nav when the drawer opens.
  useEffect(() => {
    if (!drawerOpen) return
    const target = getFocusable(navRef.current)[0] ?? navRef.current
    target?.focus?.({ preventScroll: true })
  }, [drawerOpen])

  // Growing past lg dissolves the drawer — never leave it silently open.
  useEffect(() => {
    if (!drawerMode && navOpen) setNavOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerMode])

  return (
    <AppShellContext.Provider value={{ navOpen, setNavOpen }}>
      <div
        ref={ref}
        className={cx('vds-appshell', drawerOpen && 'vds-appshell--nav-open', className)}
        {...props}
      >
        {drawerOpen && (
          <div className="vds-appshell__scrim" onMouseDown={() => setNavOpen(false)} />
        )}
        <div
          ref={navRef}
          className="vds-appshell__nav"
          tabIndex={-1}
          // Off-screen and inert for assistive tech while closed in drawer mode.
          aria-hidden={drawerMode && !navOpen ? true : undefined}
        >
          {nav}
        </div>
        <div className="vds-appshell__main">
          {topBar != null && <div className="vds-appshell__topbar">{topBar}</div>}
          <main className="vds-appshell__content">{children}</main>
        </div>
      </div>
    </AppShellContext.Provider>
  )
})

AppShell.displayName = 'AppShell'

/**
 * AppShellNavTrigger
 *
 * The hamburger that opens the AppShell's off-canvas nav. Renders nothing
 * visible at lg and wider (the rail is already in the layout) — put it in
 * your TopBar's `leading` slot and forget about it. Must be a descendant of
 * an <AppShell>.
 *
 * Props:
 * - aria-label: accessible name (default 'Open navigation')
 * - all native button attributes
 *
 * @example
 * <TopBar leading={<AppShellNavTrigger />}>Devices</TopBar>
 */
export const AppShellNavTrigger = forwardRef(function AppShellNavTrigger(
  { className, 'aria-label': ariaLabel = 'Open navigation', onClick, ...props },
  ref,
) {
  const shell = useContext(AppShellContext)
  return (
    <button
      ref={ref}
      type="button"
      className={cx('vds-appshell-trigger', className)}
      aria-label={ariaLabel}
      aria-expanded={shell?.navOpen || false}
      onClick={(e) => {
        onClick?.(e)
        shell?.setNavOpen(!shell.navOpen)
      }}
      {...props}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M3 5h14M3 10h14M3 15h14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
})

AppShellNavTrigger.displayName = 'AppShellNavTrigger'
