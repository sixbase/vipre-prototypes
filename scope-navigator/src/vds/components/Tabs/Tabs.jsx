import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { cx } from '../../lib/cx.js'

const TabsCtx = createContext(null)

/* Merge a forwarded ref with local refs so a node is reachable by all of them. */
function mergeRefs(...refs) {
  return (node) => {
    for (const r of refs) {
      if (!r) continue
      if (typeof r === 'function') r(node)
      else r.current = node
    }
  }
}

/**
 * Tabs
 *
 * WAI-ARIA tabs: a row of tab buttons that switch between panels. Compose the
 * four parts — <Tabs> owns the selected value, <TabList> is the strip,
 * <Tab> is one button, <TabPanel> is one panel:
 *
 *   <Tabs defaultValue="overview">
 *     <TabList aria-label="Device sections">
 *       <Tab value="overview">Overview</Tab>
 *       <Tab value="threats" count={12}>Threats</Tab>
 *     </TabList>
 *     <TabPanel value="overview">…</TabPanel>
 *     <TabPanel value="threats">…</TabPanel>
 *   </Tabs>
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 *
 * Props:
 * - value / defaultValue / onChange: selected tab value (string)
 * - variant: 'underline' | 'pill'   (default 'underline')
 * - size:    'sm' | 'md'            (default 'md')
 * - fitted:  tabs stretch to share the full width equally   (default false)
 *
 * Responsive: when the strip overflows, it scrolls horizontally (hidden
 * scrollbar, edge fade masks) instead of wrapping.
 *
 * Accessibility:
 * - Roving tabindex: only the selected tab is in the Tab order; Arrow keys
 *   move (and select) between tabs, Home/End jump to the ends.
 * - aria-selected / aria-controls / aria-labelledby wired automatically.
 *
 * @example
 * <Tabs defaultValue="all" variant="pill" size="sm">…</Tabs>
 */
export const Tabs = forwardRef(function Tabs(
  {
    value: valueProp,
    defaultValue,
    onChange,
    variant = 'underline',
    size = 'md',
    fitted = false,
    className,
    children,
    ...props
  },
  ref,
) {
  const isControlled = valueProp != null
  const [valueState, setValueState] = useState(defaultValue)
  const value = isControlled ? valueProp : valueState
  const baseId = useId()

  const setValue = useCallback(
    (next) => {
      if (!isControlled) setValueState(next)
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  return (
    <TabsCtx.Provider value={{ value, setValue, variant, size, fitted, baseId }}>
      <div
        ref={ref}
        className={cx('vds-tabs', `vds-tabs--${variant}`, `vds-tabs--${size}`, className)}
        {...props}
      >
        {children}
      </div>
    </TabsCtx.Provider>
  )
})

Tabs.displayName = 'Tabs'

/**
 * TabList — the scrollable strip of Tab buttons (role="tablist").
 * Give it an aria-label describing the set. Owns arrow-key navigation and
 * the overflow fade masks.
 */
export const TabList = forwardRef(function TabList({ className, children, ...props }, ref) {
  const { fitted } = useContext(TabsCtx)
  const listRef = useRef(null)
  const [fade, setFade] = useState({ start: false, end: false })

  // Edge fades: only show a fade on a side that actually has hidden content.
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      setFade({ start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  // Roving focus: arrows move between enabled tabs and select as they go.
  const onKeyDown = (e) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const tabs = Array.from(listRef.current.querySelectorAll('[role="tab"]:not([disabled])'))
    if (tabs.length === 0) return
    const i = tabs.indexOf(document.activeElement)
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = tabs.length - 1
    e.preventDefault()
    tabs[next].focus()
    tabs[next].click() // automatic activation — focus follows selection
  }

  return (
    <div
      ref={mergeRefs(ref, listRef)}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cx(
        'vds-tabs__list',
        fitted && 'vds-tabs__list--fitted',
        fade.start && 'vds-tabs__list--fade-start',
        fade.end && 'vds-tabs__list--fade-end',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})

TabList.displayName = 'TabList'

/**
 * Tab — one tab button.
 * Props: value (required), icon (node), count (badge number/string), disabled.
 */
export const Tab = forwardRef(function Tab(
  { value, icon, count, disabled = false, className, children, ...props },
  ref,
) {
  const { value: selectedValue, setValue, baseId } = useContext(TabsCtx)
  const selected = value === selectedValue

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={cx('vds-tabs__tab', selected && 'vds-tabs__tab--selected', className)}
      {...props}
    >
      {icon && <span className="vds-tabs__icon">{icon}</span>}
      <span className="vds-tabs__label">{children}</span>
      {count != null && <span className="vds-tabs__count">{count}</span>}
    </button>
  )
})

Tab.displayName = 'Tab'

/**
 * TabPanel — the content for one tab. Stays in the DOM and is hidden when
 * its tab isn't selected (so panel state survives switching).
 * Props: value (required, matches its Tab).
 */
export const TabPanel = forwardRef(function TabPanel({ value, className, children, ...props }, ref) {
  const { value: selectedValue, baseId } = useContext(TabsCtx)
  const selected = value === selectedValue

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      hidden={!selected}
      className={cx('vds-tabs__panel', className)}
      {...props}
    >
      {children}
    </div>
  )
})

TabPanel.displayName = 'TabPanel'
