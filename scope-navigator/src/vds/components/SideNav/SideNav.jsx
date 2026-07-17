import { Fragment, createElement, forwardRef, isValidElement, useEffect, useRef, useState } from 'react'
import { cx } from '../../lib/cx.js'
import { ProductTile } from './ProductTile.jsx'

/* ----------------------------------------------------------------------------
   Component-owned chrome glyphs (inline SVG — NOT content icons; consumers pass
   their own icons in the data). Kept inline so the component is icon-agnostic.
   -------------------------------------------------------------------------- */
function ProductChevron() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 14L12 10L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function BackChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 12.5L5.5 8L10 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function EscapeArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 11L11 5M6.5 5H11V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CollapseGlyph({ collapsed }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2" />
      <path d="M6.25 2.75v10.5" />
      {collapsed ? <path d="M9.5 6.25 11.25 8 9.5 9.75" /> : <path d="M11.75 6.25 10 8l1.75 1.75" />}
    </svg>
  )
}
/* Corner badge on a not-subscribed product tile. The "expand out" arrow reads as
   "add / go get this" — an invitation. A padlock only says no, which is the wrong
   note for a product the customer can buy. Same disc + ring geometry as before, so
   it sits identically over the tile's corner. Painted from SCSS, not inline. */
function UnsubscribedBadge() {
  return (
    <svg className="vds-sidenav__unsub" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle className="vds-sidenav__unsub-disc" cx="8" cy="8" r="7.25" />
      <path
        className="vds-sidenav__unsub-arrow"
        d="M5.9 10.1 10.1 5.9M6.7 5.9h3.4v3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* The seam handle's chevron — points the way the rail will move. */
function EdgeChevron({ collapsed }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={collapsed ? 'M6.25 3.5 10.75 8l-4.5 4.5' : 'M9.75 3.5 5.25 8l4.5 4.5'} />
    </svg>
  )
}

/* Icons in data may be a React element (<Mail size={16}/>) or a component (Mail). */
function renderIcon(icon, size = 16) {
  if (icon == null) return null
  if (isValidElement(icon)) return icon
  return createElement(icon, { size })
}

/* A product's tile: an explicit node/component wins; a glyph string renders a
   ProductTile (muted when locked). */
function renderTile(entry, locked) {
  if (entry.tile) return isValidElement(entry.tile) ? entry.tile : createElement(entry.tile)
  if (entry.glyph) return <ProductTile glyph={entry.glyph} muted={locked} />
  return null
}

/* An item renders as a 32px-tile pill when it carries a tile or glyph (or child
   items); otherwise it's a bare 16px-icon menu row. */
const isPillItem = (item) => !!(item.tile || item.glyph || item.items)

/* ---- One bare menu row: 16px icon + fading label (+ badge) ---- */
function Row({ item, active, collapsed, onSelect, sub = false, escape = false }) {
  const tip = typeof item.label === 'string' ? item.label : undefined
  return (
    <button
      type="button"
      className={cx(
        'vds-sidenav__row',
        sub && 'vds-sidenav__row--sub',
        escape && 'vds-sidenav__row--escape',
        active && 'vds-sidenav__row--active',
      )}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? undefined : tip}
      data-tip={collapsed ? tip : undefined}
      onClick={() => (item.onClick ? item.onClick(item) : onSelect?.(item.id, item))}
    >
      <span className="vds-sidenav__row-icon">{escape ? (renderIcon(item.icon) ?? <EscapeArrow />) : renderIcon(item.icon)}</span>
      <span className="vds-sidenav__label">{item.label}</span>
      {item.badge != null && <span className="vds-sidenav__badge">{item.badge}</span>}
    </button>
  )
}

/* ---- A bare tile pill (no child items): e.g. Dashboard / Customers / Overview ---- */
function PillRow({ item, active, collapsed, onSelect }) {
  const tip = typeof item.label === 'string' ? item.label : undefined
  return (
    <button
      type="button"
      className={cx('vds-sidenav__pill', active && 'vds-sidenav__pill--active')}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? undefined : tip}
      data-tip={collapsed ? tip : undefined}
      onClick={() => (item.onClick ? item.onClick(item) : onSelect?.(item.id, item))}
    >
      <span className="vds-sidenav__pill-main">
        <span className="vds-sidenav__tile">{renderTile(item, false)}</span>
        <span className="vds-sidenav__label vds-sidenav__label--pill">{item.label}</span>
      </span>
    </button>
  )
}

/* ---- A product group: card well + tile header + accordion of items ---- */
function ProductGroup({ group, activeId, collapsed, onSelect, open, onToggle }) {
  const locked = !!group.locked
  const tipText = locked ? `${group.label} — ${group.lockHint || 'not subscribed'}` : group.label
  const fullTitle = locked
    ? group.lockHint || `${group.label} — not subscribed`
    : `${open ? 'Collapse' : 'Expand'} ${group.label}`
  const Head = locked ? 'div' : 'button'
  return (
    <div className={cx('vds-sidenav__card', locked && 'vds-sidenav__card--locked')}>
      <Head
        {...(!locked && { type: 'button', onClick: onToggle, 'aria-expanded': open })}
        className={cx('vds-sidenav__pill', locked && 'vds-sidenav__pill--locked')}
        title={collapsed ? undefined : fullTitle}
        data-tip={collapsed ? tipText : undefined}
      >
        <span className="vds-sidenav__pill-main">
          <span className="vds-sidenav__tile">
            {renderTile(group, locked)}
            {locked && <UnsubscribedBadge />}
          </span>
          <span className="vds-sidenav__label vds-sidenav__label--pill">{group.label}</span>
        </span>
        {!locked && (
          <span className={cx('vds-sidenav__chev', !open && 'vds-sidenav__chev--closed')} aria-hidden="true">
            <ProductChevron />
          </span>
        )}
      </Head>
      {!locked && (
        <div className={cx('vds-sidenav__reveal', open && 'vds-sidenav__reveal--open')}>
          <div className="vds-sidenav__reveal-clip" aria-hidden={!open || undefined}>
            <div className="vds-sidenav__reveal-body">
              {(group.items || []).map((it) => (
                <Row key={it.id} item={it} sub active={it.id === activeId} collapsed={collapsed} onSelect={onSelect} />
              ))}
              {group.escape && <Row item={group.escape} escape collapsed={collapsed} onSelect={onSelect} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* Shimmer placeholders standing in for product cards while entitlements load.
   Widths cycle so the skeleton reads as real, varied labels. */
const SKELETON_WIDTHS = [80, 96, 64, 84, 72]

/* How close the cursor must come to the seam before the edge handle shows —
   behaviour (hit-testing), not styling, so it lives here rather than in a token.
   Asymmetric on purpose: the reach extends further INTO the rail than out into
   the content, because sliding out of the rail is the gesture that means "I want
   the edge", while drifting in from the page usually does not. */
const EDGE_REACH_IN = 26
const EDGE_REACH_OUT = 18
function SkeletonCard({ labelWidth }) {
  return (
    <div className="vds-sidenav__card">
      <div className="vds-sidenav__skel-row">
        <span className="vds-sidenav__skel vds-sidenav__skel--tile" />
        <span className="vds-sidenav__skel vds-sidenav__skel--label" style={{ maxWidth: labelWidth }} />
      </div>
    </div>
  )
}

/* ---- One section: eyebrow + items. Consecutive bare rows cluster tightly in a
   shared wrapper; pills and cards sit directly in the section's 4px rhythm. ---- */
function SectionBlock({ section, activeId, collapsed, onSelect, isOpen, onToggleGroup, loading }) {
  if (loading) {
    const count = Math.max(section.items?.length ?? 0, 3)
    return (
      <div className="vds-sidenav__section">
        {section.label && <p className="vds-sidenav__eyebrow">{section.label}</p>}
        {Array.from({ length: Math.min(count, 5) }, (_, i) => (
          <SkeletonCard key={i} labelWidth={SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]} />
        ))}
      </div>
    )
  }

  // Nothing to show — an account with no managed products, say. Say so in words
  // rather than leaving a bare eyebrow over a void. The note hides on the
  // collapsed rail: a 72px column can't carry a sentence, and there is no icon to
  // stand in for one.
  if (section.empty && !(section.items || []).length) {
    return (
      <div className="vds-sidenav__section">
        {section.label && <p className="vds-sidenav__eyebrow">{section.label}</p>}
        <p className="vds-sidenav__empty">{section.empty}</p>
      </div>
    )
  }

  // Chunk consecutive bare rows so they cluster (2px apart) like the prototype,
  // while pills/cards keep the section's looser 4px rhythm.
  const blocks = []
  for (const item of section.items || []) {
    if (!isPillItem(item)) {
      const last = blocks[blocks.length - 1]
      if (last?.type === 'rows') last.items.push(item)
      else blocks.push({ type: 'rows', items: [item] })
    } else {
      blocks.push({ type: 'pill', item })
    }
  }

  return (
    <div className="vds-sidenav__section">
      {/* Eyebrow fades on collapse but never unmounts — section heights stay identical. */}
      {section.label && <p className="vds-sidenav__eyebrow">{section.label}</p>}
      {blocks.map((block, i) =>
        block.type === 'rows' ? (
          <div key={i} className="vds-sidenav__rows">
            {block.items.map((it) => (
              <Row key={it.id} item={it} active={it.id === activeId} collapsed={collapsed} onSelect={onSelect} />
            ))}
          </div>
        ) : block.item.items || block.item.locked ? (
          <ProductGroup
            key={block.item.id}
            group={block.item}
            activeId={activeId}
            collapsed={collapsed}
            onSelect={onSelect}
            open={isOpen(block.item)}
            onToggle={() => onToggleGroup(block.item)}
          />
        ) : (
          <div key={block.item.id} className="vds-sidenav__inset">
            <PillRow item={block.item} active={block.item.id === activeId} collapsed={collapsed} onSelect={onSelect} />
          </div>
        ),
      )}
    </div>
  )
}

/**
 * SideNav
 *
 * The product navigation rail — the fixed navy chrome on the left of every
 * screen, ported from the MSP v2 shell. Data-driven: you hand it sections of
 * items; it renders the whole rail, including the collapse choreography, the
 * accordion product cards, locked (not-subscribed) states, loading skeletons,
 * and the collapsed-rail tooltips.
 *
 * FIXED CHROME: always the midnight navy, in BOTH themes — it is product
 * chrome, not a theme surface. The selected fill follows --vds-nav-accent, the
 * one token resellers re-point to re-brand the highlight.
 *
 * Item shapes (all under `sections[].items`):
 * - Bare row:      { id, label, icon?, badge?, onClick? } — 16px icon + label.
 * - Bare tile row: { id, label, tile } or { id, label, glyph } — a 32px tile
 *   pill with no children (e.g. Dashboard / Customers / Overview).
 * - Product group: { id, label, tile|glyph, items: Item[], escape?, locked?,
 *   lockHint?, defaultOpen? } — a recessed card that opens/closes. `escape` is
 *   the "Full portal" door out ({ id, label, icon? }). `locked` renders the
 *   muted tile + the "go get this" badge and hides the items.
 * `icon` and `tile` accept a React element or a component; `glyph` is an SVG
 * path string rendered via ProductTile. The component ships no icon set.
 *
 * Collapse is controlled OR uncontrolled: pass `collapsed` (+
 * `onCollapsedChange`) to own it, or just `defaultCollapsed` to let the rail
 * manage itself via its built-in toggle row.
 *
 * Props:
 * - account:           { name, typeLabel?, tile? } — identity header at the top.
 *                      `tile` = img src string, element, or component.
 * - onBack:            () => void — shows a "Back to {parentName}" row above
 *                      the account header.
 * - parentName:        string — names the back target.
 * - sections:          Section[] = { id, label?, items, empty? } — the scrollable
 *                      middle, separated by inset hairlines. `empty` is a message
 *                      shown in place of an empty section (e.g. an unmanaged
 *                      account with no products); it hides on the collapsed rail.
 * - footerSections:    Section[] — pinned above the utility rows.
 * - utilities:         Item[] — bare rows in the pinned bottom cluster (e.g. a
 *                      dark-mode toggle; give it an onClick).
 * - collapseToggle:    boolean — render the built-in Collapse row (default true).
 * - edgeHandle:        boolean — also show a round collapse handle on the rail's
 *                      outer seam, which fades in as the cursor nears it (default
 *                      false). A pointer shortcut layered on top of the Collapse
 *                      row, never a replacement: it is aria-hidden and untabbable,
 *                      so keyboard and screen-reader users still go through the
 *                      row. Needs a positioned shell around the rail only if you
 *                      clip overflow — the handle sticks out by half its width.
 * - collapsed:         boolean — controlled collapse state.
 * - defaultCollapsed:  boolean — uncontrolled initial state (default false).
 * - onCollapsedChange: (collapsed) => void
 * - activeId:          id of the current page (accent fill + aria-current).
 * - onSelect:          (id, item) => void — any row, escape link, or utility.
 * - loading:           boolean — swap section items for shimmer skeleton cards.
 * - all native <nav> attributes (aria-label, …)
 *
 * @example
 * <SideNav
 *   aria-label="Product"
 *   account={{ name: 'Melvin Industries', typeLabel: 'Distributor', tile: <ProductTile glyph={STORE} /> }}
 *   onBack={goUp} parentName="Acme Distribution"
 *   activeId={page} onSelect={setPage}
 *   sections={[
 *     { id: 'partners', label: 'Partners', items: [
 *       { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
 *     ]},
 *     { id: 'products', label: 'Products', items: [
 *       { id: 'ies', label: 'IES', glyph: IES_GLYPH, items: [
 *         { id: 'logs', label: 'Message Logs', icon: ScrollText },
 *       ], escape: { id: 'ies-portal', label: 'Full portal' } },
 *       { id: 'sat', label: 'SAT', glyph: SAT_GLYPH, locked: true, lockHint: 'Not subscribed' },
 *     ]},
 *   ]}
 *   footerSections={[{ id: 'other', label: 'Other', items: [{ id: 'admins', label: 'Admins', icon: UserCog }] }]}
 *   utilities={[{ id: 'theme', label: 'Dark mode', icon: Moon, onClick: toggleTheme }]}
 * />
 */
export const SideNav = forwardRef(function SideNav(
  {
    account,
    onBack,
    parentName,
    sections = [],
    footerSections = [],
    utilities = [],
    collapseToggle = true,
    edgeHandle = false,
    collapsed: collapsedProp,
    defaultCollapsed = false,
    onCollapsedChange,
    activeId,
    onSelect,
    loading = false,
    className,
    ...props
  },
  ref,
) {
  // ---- collapse: controlled + uncontrolled ----
  const collapseControlled = collapsedProp !== undefined
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed)
  const collapsed = collapseControlled ? !!collapsedProp : internalCollapsed
  const setCollapsed = (next) => {
    if (!collapseControlled) setInternalCollapsed(next)
    onCollapsedChange?.(next)
  }

  // ---- product groups: open unless defaultOpen === false; track only toggles ----
  const [openOverrides, setOpenOverrides] = useState({})
  const isOpen = (g) => openOverrides[g.id] ?? g.defaultOpen !== false
  const toggleGroup = (g) =>
    setOpenOverrides((prev) => ({ ...prev, [g.id]: !(prev[g.id] ?? g.defaultOpen !== false) }))

  // ---- collapsed-rail tooltip: one floating label, delegated over [data-tip].
  // The native `title` follows the cursor and clips awkwardly against the rail;
  // instead a single fixed-position tooltip floats just off the rail's right
  // edge, vertically centered on the hovered/focused row. ----
  const [tip, setTip] = useState(null) // { label, x, y }
  useEffect(() => {
    if (!collapsed) setTip(null)
  }, [collapsed])
  const showTip = (e) => {
    if (!collapsed) return
    const el = e.target.closest?.('[data-tip]')
    const label = el?.getAttribute('data-tip')
    if (!label) {
      setTip(null)
      return
    }
    const r = el.getBoundingClientRect()
    setTip({ label, x: r.right + 10, y: r.top + r.height / 2 })
  }
  const hideTip = () => setTip(null)

  // ---- edge handle: a collapse control that rides the nav/content seam and
  // surfaces only when you reach for it, so the rail stays quiet at rest.
  // Proximity is tracked on `window` and measured against the rail's OWN right
  // edge — deliberately not delegated to a parent wrapper. The cursor approaches
  // across the content, which the rail does not own, so a self-listener is what
  // keeps this a drop-in rather than a contract on whoever renders the shell.
  // The footer's Collapse row remains the keyboard-reachable path; this is a
  // pointer affordance layered on top, never the only way through. ----
  const navRef = useRef(null)
  const setNavRef = (node) => {
    navRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }
  const [edge, setEdge] = useState({ y: 0, on: false })
  useEffect(() => {
    if (!edgeHandle) return undefined
    let frame = 0
    const onMove = (e) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = navRef.current?.getBoundingClientRect()
        if (!r) return
        const near =
          e.clientX >= r.right - EDGE_REACH_IN &&
          e.clientX <= r.right + EDGE_REACH_OUT &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        setEdge((prev) => (near ? { y: e.clientY - r.top, on: true } : prev.on ? { ...prev, on: false } : prev))
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [edgeHandle])

  const backLabel = parentName ? `Back to ${parentName}` : 'Back'
  const accountTile = account?.tile
  const accountTip = account ? [account.name, account.typeLabel].filter(Boolean).join(' · ') : undefined
  const hasFooter = footerSections.length > 0 || utilities.length > 0 || collapseToggle

  const sectionProps = { activeId, collapsed, onSelect, isOpen, onToggleGroup: toggleGroup, loading }

  return (
    <nav
      ref={setNavRef}
      className={cx('vds-sidenav', collapsed && 'vds-sidenav--collapsed', className)}
      onMouseOver={showTip}
      onMouseLeave={hideTip}
      onFocusCapture={showTip}
      onBlurCapture={hideTip}
      {...props}
    >
      <div className="vds-sidenav__scroll">
        {(account || onBack) && (
          <>
            <div className="vds-sidenav__section vds-sidenav__section--account">
              {onBack && (
                <div className="vds-sidenav__inset">
                  <button
                    type="button"
                    className="vds-sidenav__row vds-sidenav__back"
                    onClick={onBack}
                    title={collapsed ? undefined : backLabel}
                    data-tip={collapsed ? backLabel : undefined}
                  >
                    <span className="vds-sidenav__row-icon">
                      <BackChevron />
                    </span>
                    <span className="vds-sidenav__label">{backLabel}</span>
                  </button>
                </div>
              )}
              {account && (
                <div className="vds-sidenav__inset">
                  <div className="vds-sidenav__account" data-tip={collapsed ? accountTip : undefined}>
                    {accountTile && (
                      <span className="vds-sidenav__account-tile">
                        {typeof accountTile === 'string' ? (
                          <img src={accountTile} alt="" />
                        ) : (
                          renderTile({ tile: accountTile }, false)
                        )}
                      </span>
                    )}
                    <span className="vds-sidenav__account-text">
                      <span className="vds-sidenav__account-name">{account.name}</span>
                      {account.typeLabel && <span className="vds-sidenav__account-type">{account.typeLabel}</span>}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="vds-sidenav__divider" />
          </>
        )}

        {sections.map((section, i) => (
          <Fragment key={section.id}>
            {i > 0 && <div className="vds-sidenav__divider" />}
            <SectionBlock section={section} {...sectionProps} />
          </Fragment>
        ))}
      </div>

      {hasFooter && (
        <div className="vds-sidenav__footer">
          {footerSections.map((section) => (
            <Fragment key={section.id}>
              <div className="vds-sidenav__divider" />
              <SectionBlock section={section} {...sectionProps} loading={false} />
            </Fragment>
          ))}
          {(utilities.length > 0 || collapseToggle) && (
            <>
              <div className="vds-sidenav__divider" />
              <div className="vds-sidenav__utilities">
                {utilities.map((item) => (
                  <Row key={item.id} item={item} active={item.id === activeId} collapsed={collapsed} onSelect={onSelect} />
                ))}
                {collapseToggle && (
                  <button
                    type="button"
                    className="vds-sidenav__row"
                    aria-expanded={!collapsed}
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? undefined : 'Collapse'}
                    data-tip={collapsed ? 'Expand' : undefined}
                  >
                    <span className="vds-sidenav__row-icon">
                      <CollapseGlyph collapsed={collapsed} />
                    </span>
                    <span className="vds-sidenav__label">Collapse</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Edge handle — sits ON the seam (half in the rail, half in the content),
          riding the cursor's y. aria-hidden + tabIndex -1 ON PURPOSE: it is a
          duplicate of the footer's Collapse row, which is already in the tab
          order and announced. Exposing both would make a screen reader meet the
          same control twice. */}
      {edgeHandle && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          className={cx('vds-sidenav__edge', edge.on && 'vds-sidenav__edge--on')}
          style={{ top: edge.y }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <EdgeChevron collapsed={collapsed} />
        </button>
      )}

      {/* Collapsed-rail tooltip — pinned right of the hovered/focused row; fixed
          positioning lets it escape the rail. Re-keyed per label so the little
          fade+slide replays as you move between rows. */}
      {tip && (
        <div role="tooltip" key={tip.label} className="vds-sidenav__tip" style={{ left: tip.x, top: tip.y }}>
          {tip.label}
        </div>
      )}
    </nav>
  )
})

SideNav.displayName = 'SideNav'
