import { useState, useEffect, useRef } from 'react'
import {
  Mail, Send, Laptop, GraduationCap, Database, ScrollText, Radar, Settings,
  FileText, ShieldCheck, Monitor, Bell, UserCog, User, Key, ArrowUpRight,
  PanelLeftClose, PanelLeftOpen, LayoutDashboard, Moon, Sun,
  Boxes, Store, Zap, ChevronLeft, ChevronRight, ChevronDown, Check, Search, X,
  ArrowLeft, ArrowRight,
} from '@icons'
import { ScopeProvider, useScope } from '../ScopeContext'
import { DistributorIcon, ResellerIcon, CustomerIcon } from '../entityIcons.jsx'
import distributorTile from '../assets/entity/distributor.svg'
import resellerTile from '../assets/entity/reseller.svg'
import customerTile from '../assets/entity/customer.svg'
import { useBrand, brandStyleVars, BrandLogo, BrandPicker } from './branding.jsx'
import { mockData } from '../data'
import { isEntityUnmanaged } from '../config'
import { ProvisioningModal, SuccessToast } from '../ProvisioningModal'
import { ChildrenListView } from '../EntityDetail.jsx'
import { EntityDataDrawer } from '../DashboardPageB'
import { PORTALS } from './portalData.js'
import lockBadge from './assets/lock-badge.svg'
import { PRODUCT_GLYPHS } from './productGlyphs.js'
import { ProductTile, OverviewTile, CustomersTile, DashboardTile } from './ProductTile.jsx'
import { DevicesGlyph, PoliciesGlyph, IncidentsGlyph } from './pageGlyphs.jsx'
import './shell.css'

/* ============================================================================
   MSP SHELL  (Figma 73:310)
   The scope navigator lives in the LEFT NAV as a vertical breadcrumb (ScopeTree)
   instead of a horizontal bar in the top chrome. One persistent nav — PARTNERS
   (the scope trail) + PRODUCTS (accordions) + OTHER — stays put across every page,
   so scope is always-visible global context. The top chrome is just the VIPRE
   logo strip; the current scope name renders in the content header.

   V2: iteration copy of MspShell — reached at ?view=msp2 (or /msp2). The
   original ?view=msp stays frozen for reference.
   ========================================================================== */

// Navy chrome = fixed midnight ramp (same in light/dark); content surfaces = semantic.
const C = {
  topbar: 'var(--vds-midnight-950)',
  menu: 'var(--vds-midnight-950)',
  menuBorder: 'var(--vds-midnight-1000)',
  white: 'var(--vds-white)',
  ink: 'var(--vds-midnight-200)',
  inkDim: 'var(--vds-midnight-300)',
  icon: 'var(--vds-midnight-400)',
  selected: 'var(--nav-accent)',     // follows the reseller brand (default = cobalt #0068cb)
  onSelected: 'var(--vds-white)',
  content: 'var(--shell-canvas)',
  card: 'var(--vds-surface)',
  line: 'var(--vds-line)',
  // Full-portal (focus mode) — a LIGHT product nav that flips with the theme.
  portalBg: 'var(--vds-surface)',
  portalInk: 'var(--vds-ink-muted)',
  portalEyebrow: 'var(--vds-ink-subtle)',
}

const NAV_PAD_X = 16
// Collapsed rail centers the x=36 icon column (2 × 36), so icons keep the EXACT same x
// as the expanded nav — they never slide horizontally on collapse/expand.
const SYM_W_COLLAPSED = 72
const SYM_W_EXPANDED = 242
// "Emphasized decelerate" — starts brisk, lands soft. One curve for all nav motion.
const OB_EASE = 'cubic-bezier(0.2, 0, 0, 1)'
// Labels fade OUT fast when collapsing (get out of the way), fade IN slightly late when
// expanding (let the width lead, then the words arrive) — asymmetry reads as intent.
const labelFade = (collapsed) =>
  collapsed
    ? `max-width 220ms ${OB_EASE}, margin-left 220ms ${OB_EASE}, opacity 90ms ease`
    : `max-width 220ms ${OB_EASE}, margin-left 220ms ${OB_EASE}, opacity 200ms ease 70ms`
// Concentric radius system with a 2px nesting gap: the 32px tiles are radius 8; pills
// wrap a tile with 2px padding → radius 10; cards wrap a pill with 2px padding →
// radius 12. Every nested corner shares the same center (inner radius + gap = outer).
const R_TILE = 8
const NEST = 2
const R_PILL = R_TILE + NEST   // 10
const R_CARD = R_PILL + NEST   // 12
const PRODUCT_CARD = { background: 'var(--vds-midnight-1000)', borderRadius: R_CARD, padding: NEST, display: 'flex', flexDirection: 'column', gap: 2 }
// Full-portal nav widths (match the original Symphony workspace nav).
const POR_PAD = 32
const POR_W_COLLAPSED = 80
const POR_W_EXPANDED = 200

// How ScopeTree renders each tenancy type (mirrors the main app + the mock data types).
const SCOPE_TYPE_CONFIG = {
  distributor: { label: 'Distributor', icon: DistributorIcon, tile: distributorTile, tone: 'azure' },
  partner: { label: 'Reseller', icon: ResellerIcon, tile: resellerTile, tone: 'rose' },
  customer: { label: 'Customer', icon: CustomerIcon, tile: customerTile, tone: 'emerald' },
}

/* ---- Data (same product taxonomy as SymphonyShell) ---- */
const PRODUCTS = [
  { id: 'ies', label: 'IES', icon: Mail, glyph: PRODUCT_GLYPHS.ies, items: [
    { id: 'ies-logs', label: 'Message Logs', icon: ScrollText },
    { id: 'ies-threat', label: 'Threat Explorer', icon: Radar },
    { id: 'ies-config', label: 'Email Config', icon: Settings },
  ] },
  { id: 'safesend', label: 'SafeSend', icon: Send, glyph: PRODUCT_GLYPHS.safesend, items: [
    { id: 'ss-reports', label: 'Reports', icon: FileText },
    { id: 'ss-policies', label: 'Policies', icon: ShieldCheck },
    { id: 'ss-settings', label: 'Settings', icon: Settings },
  ] },
  { id: 'edr', label: 'EDR', icon: Laptop, glyph: PRODUCT_GLYPHS.edr, items: [
    { id: 'edr-devices-s', label: 'Devices', icon: Monitor },
    { id: 'edr-incidents-s', label: 'Incidents', icon: Bell },
    { id: 'edr-settings-s', label: 'Settings', icon: Settings },
  ] },
  { id: 'sat', label: 'SAT', icon: GraduationCap, glyph: PRODUCT_GLYPHS.sat, items: [
    { id: 'sat-campaigns', label: 'Campaigns', icon: Send },
    { id: 'sat-courses', label: 'Courses', icon: GraduationCap },
    { id: 'sat-reports', label: 'Reports', icon: FileText },
  ] },
  { id: 'archive', label: 'Archive', icon: Database, glyph: PRODUCT_GLYPHS.archive, items: [
    { id: 'arch-search', label: 'Message Search', icon: ScrollText },
    { id: 'arch-retention', label: 'Retention', icon: ShieldCheck },
    { id: 'arch-exports', label: 'Exports', icon: FileText },
  ] },
]
const FOOTER = [
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'admins', label: 'Admins', icon: UserCog },
  { id: 'saml', label: 'SAML', icon: Key },
  { id: 'roles', label: 'Roles', icon: ShieldCheck },
  { id: 'profile', label: 'Profile', icon: User },
]
const PRODUCTS_OVERVIEW = { id: 'products-overview', label: 'Overview', icon: Boxes, Tile: OverviewTile }
// PARTNERS Dashboard tile — bare button above the scope tree; opens the My Accounts
// dashboard (the content the Customers scope-tree root used to host).
const PARTNER_DASHBOARD = { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, Tile: (props) => <DashboardTile {...props} outline /> }
// Plain Customers link (replaces the old vertical scope tree). Clicking it lists the
// customers of whatever node is currently logged into (shown in the account header).
const PARTNER_CUSTOMERS = { id: 'customers', label: 'Customers', icon: Store, Tile: (props) => <CustomersTile {...props} /> }

// The signed-in reseller the shell mimics — their name heads the left nav so the
// whole portal reads as "logged in as Melvin Industries".
const LOGGED_IN_RESELLER = { name: 'Melvin Industries', typeLabel: 'Distributor' }

// ---- Faked per-customer subscriptions ----
// We don't have real entitlement data, so the Symphony nav's PRODUCTS section is
// driven by a deterministic hash of the scoped entity → one of these profiles. Each
// profile is the SET of products that customer subscribes to; everything else renders
// locked. Scoping into different customers therefore flips the nav between states.
const SUB_PROFILES = [
  ['ies', 'safesend', 'edr'],                      // Core security (the default)
  ['ies', 'safesend'],                             // Email only
  ['edr', 'sat'],                                  // Endpoint + training
  ['ies', 'safesend', 'edr', 'sat', 'archive'],    // Full suite
  ['safesend', 'sat', 'archive'],                  // Compliance-led
  ['ies'],                                         // Starter
  ['ies', 'edr', 'archive'],                       // Endpoint + archiving
]
function subscriptionFor(scopeKey) {
  if (!scopeKey || scopeKey === 'root') return new Set(SUB_PROFILES[0])
  let h = 0
  for (let i = 0; i < scopeKey.length; i++) h = (h * 31 + scopeKey.charCodeAt(i)) >>> 0
  return new Set(SUB_PROFILES[h % SUB_PROFILES.length])
}
// Which product owns a given sub-page id (null if it's not a product page).
function productOfPage(id) {
  for (const p of PRODUCTS) for (const it of p.items || []) if (it.id === id) return p.id
  return null
}
// Landing page for a leaf with no Dashboard (a customer / the end-customer lens): its first
// subscribed product's first sub-page. There's no Products "Overview" nav item anymore, so
// we land on real product content instead. Unmanaged (products hidden) → 'products-overview'
// as a neutral fallback page (still rendered by ContentCard, just not in the nav).
function firstProductPageFor(scopeKey, unmanaged) {
  if (unmanaged) return 'products-overview'
  const subs = subscriptionFor(scopeKey)
  const p = PRODUCTS.find((prod) => subs.has(prod.id))
  return p?.items?.[0]?.id ?? 'products-overview'
}

/* ---- nav rows (dark) ---- */
function MenuItem({ icon, label, labelSize = 12, labelWeight = 500, color, iconColor = C.icon, fp, selected, onClick, collapsed, centerCollapsed, ariaCurrent, title }) {
  const Tag = onClick ? 'button' : 'div'
  // Collapsed rail: expose the label as data-tip for the shell's right-anchored tooltip
  // and drop the native (cursor-following) title so the two don't both appear.
  const tipText = title || (typeof label === 'string' ? label : undefined)
  return (
    <Tag
      {...(onClick ? { type: 'button', onClick } : {})}
      aria-current={ariaCurrent}
      title={collapsed ? undefined : tipText}
      data-tip={collapsed ? tipText : undefined}
      className={['ob-mrow', selected && 'ob-mrow--sel'].filter(Boolean).join(' ')}
      style={{
        // Identical padding in both rail states — rows never shift on collapse/expand.
        // gap 0 + animated label margin (not flex gap) so the collapsed row carries no
        // phantom 8px gap after the icon — the fill stays perfectly centered.
        // Backgrounds + transitions live in shell.css (.msp-nav--v2) so hover/press
        // timing can be asymmetric — inline styles would override the :hover rules.
        display: 'flex', alignItems: 'center', width: '100%', borderRadius: R_PILL, border: 0,
        padding: '6px 10px',
        cursor: onClick ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'left',
      }}
    >
      <span className={fp ? 'ob-fp-icon' : undefined}
        style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: fp ? undefined : (selected ? C.white : iconColor), transition: 'color 200ms ease' }}>{icon}</span>
      <span style={{
        color: selected ? C.white : color,
        maxWidth: collapsed ? 0 : 200, opacity: collapsed ? 0 : 1, minWidth: 0, marginLeft: collapsed ? 0 : 8,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: labelSize, fontWeight: labelWeight,
        transition: labelFade(collapsed),
      }}>{label}</span>
    </Tag>
  )
}

function Eyebrow({ collapsed, children }) {
  // paddingLeft 4 aligns the label with the tile column (section 16 + inset 2 + pill 2).
  // Fades (never unmounts) on collapse so section heights are identical in both states.
  return <p style={{ margin: 0, paddingLeft: 4, fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', color: C.inkDim, whiteSpace: 'nowrap', overflow: 'hidden', opacity: collapsed ? 0 : 1, transition: collapsed ? 'opacity 90ms ease' : 'opacity 200ms ease 70ms' }}>{children}</p>
}

function MenuDivider() {
  // Inset hairline — reads as a quiet separator rather than a full-bleed cut.
  return <div style={{ height: 1, margin: '0 12px', background: 'var(--vds-midnight-1000)', flexShrink: 0 }} />
}

// The identity pinned at the top of the nav, above Dashboard and Customers. Defaults to
// the signed-in distributor, but follows the current scope: opening any entity from the
// Customers list re-heads the nav with THAT entity (its name, type + gradient tile).
function accountFor(path) {
  const leaf = path.at(-1)
  if (!leaf) return { name: LOGGED_IN_RESELLER.name, typeLabel: LOGGED_IN_RESELLER.typeLabel, tile: distributorTile }
  const cfg = SCOPE_TYPE_CONFIG[leaf.type]
  return { name: leaf.name, typeLabel: cfg?.label ?? 'Account', tile: cfg?.tile ?? distributorTile }
}
// Shown above the account header when the logged-into node has a parent — steps the scope
// back up one level so you can climb back out of an entity you drilled into.
function BackRow({ collapsed, parentName, onBack }) {
  return (
    <button type="button" onClick={onBack}
      data-tip={collapsed ? `Back to ${parentName}` : undefined}
      title={collapsed ? undefined : `Back to ${parentName}`}
      className="ob-mrow"
      // Fixed 24px row, same padding both states — the chevron holds x=36-center and the
      // label fades/shrinks, so collapsing never nudges anything vertically.
      style={{ display: 'flex', alignItems: 'center', width: '100%', height: 24, border: 0, borderRadius: R_PILL, padding: '4px 10px', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
      <ChevronLeft size={16} style={{ flexShrink: 0, color: C.inkDim }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: C.inkDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: collapsed ? 0 : 160, opacity: collapsed ? 0 : 1, marginLeft: collapsed ? 0 : 6, transition: labelFade(collapsed) }}>Back to {parentName}</span>
    </button>
  )
}
// The inner content of the account header (tile + name/type) — shared by the static
// and the interactive (switcher) variants so both render identically.
function AccountHeaderInner({ collapsed, account, chevron }) {
  return (
    <>
      <img src={account.tile} alt="" style={{ width: 32, height: 32, borderRadius: R_TILE, flexShrink: 0 }} />
      {/* flex:1 lets the text fill the pill so the chevron is pushed to the right edge
          (rather than floating next to the name). */}
      <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0, maxWidth: collapsed ? 0 : 160, opacity: collapsed ? 0 : 1, marginLeft: collapsed ? 0 : 8, overflow: 'hidden', transition: labelFade(collapsed) }}>
        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.name}</span>
        <span style={{ fontSize: 10, fontWeight: 400, lineHeight: 1.3, letterSpacing: '0.5px', color: C.inkDim, whiteSpace: 'nowrap' }}>{account.typeLabel}</span>
      </span>
      {chevron && (
        /* Drop chevron in a 24px box at the right edge — mirrors the product-header chevron
           exactly (same padding/inset), so it aligns pixel-for-pixel with the product
           accordion chevrons directly below. Shrinks/fades with the label on collapse. */
        <span aria-hidden style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, flexShrink: 0, color: C.icon, maxWidth: collapsed ? 0 : 24, opacity: collapsed ? 0 : 1, overflow: 'hidden', transition: labelFade(collapsed) }}>
          <ChevronDown size={16} style={{ transform: chevron === 'open' ? 'rotate(180deg)' : 'none', transition: `transform 200ms ${OB_EASE}` }} />
        </span>
      )}
    </>
  )
}

// Static (non-interactive) account header — used when the node has no children to switch
// into (a customer leaf) or in the single-tenant end-customer lens.
function AccountHeader({ collapsed, account }) {
  return (
    <div data-tip={collapsed ? `${account.name} · ${account.typeLabel}` : undefined}
      // Concentric pill: 2px padding around the radius-8 tile → radius 10. Fixed 36px
      // height; the text block fades/shrinks instead of unmounting so the pill (and
      // everything below it) holds its exact y through collapse/expand.
      style={{ display: 'flex', alignItems: 'center', height: 36, padding: NEST, borderRadius: R_PILL }}>
      <AccountHeaderInner collapsed={collapsed} account={account} />
    </div>
  )
}

// Interactive account header: a dropdown trigger that pops a scope switcher listing the
// PARENT's children — i.e. the current node PLUS its siblings (the list you drilled in
// from). The current node is checked; picking a sibling switches laterally to it (re-heads
// the nav, lands on its home page). At the root the "parent" is the signed-in distributor,
// so its children are the top-level accounts. Falls back to the static header when there's
// nothing to switch between (a lone child, or the end-customer lens).
function AccountSwitcher({ collapsed, account, owner, currentId, children, onPick }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)       // trigger geometry, captured on open
  const [query, setQuery] = useState('')
  const [mgmt, setMgmt] = useState('all')       // all | managed | unmanaged
  const btnRef = useRef(null)
  const searchRef = useRef(null)

  const toggle = () => {
    if (open) { setOpen(false); return }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setRect(r)
    setQuery(''); setMgmt('all'); setOpen(true)
  }
  // Focus the search box once the popover mounts.
  useEffect(() => { if (open) searchRef.current?.focus() }, [open])
  // Escape closes.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const managedCount = children.filter((c) => !isEntityUnmanaged(c)).length
  const unmanagedCount = children.length - managedCount
  const q = query.trim().toLowerCase()
  const filtered = children.filter((c) => {
    if (mgmt === 'managed' && isEntityUnmanaged(c)) return false
    if (mgmt === 'unmanaged' && !isEntityUnmanaged(c)) return false
    if (q && !c.name.toLowerCase().includes(q)) return false
    return true
  })

  // Popover geometry: flies out to the RIGHT of the trigger (off the nav's right edge),
  // top-aligned to the trigger — same anchoring whether the rail is expanded or collapsed.
  const POP_W = 264
  const pos = rect
    ? { left: rect.right + 10, top: rect.top }
    : { left: 0, top: 0 }

  const chips = [
    { id: 'all', label: 'All', count: children.length },
    { id: 'managed', label: 'Managed', count: managedCount },
    { id: 'unmanaged', label: 'Unmanaged', count: unmanagedCount },
  ]

  return (
    <>
      <button ref={btnRef} type="button" onClick={toggle}
        aria-haspopup="menu" aria-expanded={open}
        data-tip={collapsed && !open ? `${account.name} · ${account.typeLabel}` : undefined}
        className="msp-acct-btn"
        // Same 36px pill geometry as the static header so nothing shifts when a node gains
        // or loses its switcher. gap 0 + animated margins keep the collapsed pill centered.
        style={{ display: 'flex', alignItems: 'center', width: '100%', height: 36, padding: NEST, borderRadius: R_PILL, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
        <AccountHeaderInner collapsed={collapsed} account={account} chevron={open ? 'open' : true} />
      </button>

      {open && (
        <>
          {/* click-scrim closes the popover (same pattern as the product switcher) */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 70 }} />
          <div role="menu" className="msp-acct-pop" style={{
            position: 'fixed', left: pos.left, top: pos.top, width: POP_W, zIndex: 71,
            display: 'flex', flexDirection: 'column', maxHeight: 'min(420px, calc(100vh - 120px))',
            background: 'var(--vds-midnight-900)', border: '1px solid var(--vds-midnight-800)',
            borderRadius: 12, boxShadow: 'var(--vds-shadow-lg)', overflow: 'hidden',
            fontFamily: 'var(--vds-font-sans)',
          }}>
            {/* owner header — names the parent whose accounts this list is, so it's obvious
                you're switching among siblings (not drilling deeper). */}
            {owner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--vds-midnight-1000)' }}>
                <img src={owner.tile} alt="" style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0 }} />
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: C.inkDim, lineHeight: 1.5 }}>Accounts under</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.white, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{owner.name}</span>
                </span>
              </div>
            )}
            {/* search */}
            <div style={{ padding: 8, borderBottom: '1px solid var(--vds-midnight-1000)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 8px', borderRadius: 6, background: 'var(--vds-midnight-1000)', border: '1px solid var(--vds-midnight-800)' }}>
                <Search size={15} style={{ color: C.icon, flexShrink: 0 }} />
                <input ref={searchRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search accounts" aria-label="Search accounts"
                  className="msp-acct-field"
                  style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', color: C.white, fontSize: 13, fontFamily: 'inherit' }} />
                {query && (
                  <button type="button" onClick={() => { setQuery(''); searchRef.current?.focus() }} aria-label="Clear search"
                    style={{ display: 'flex', border: 0, background: 'transparent', padding: 0, cursor: 'pointer', color: C.icon }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* managed / unmanaged filter chips */}
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {chips.map((chip) => {
                  const sel = mgmt === chip.id
                  return (
                    <button key={chip.id} type="button" onClick={() => setMgmt(chip.id)}
                      className={['msp-acct-chip', sel && 'msp-acct-chip--sel'].filter(Boolean).join(' ')}
                      aria-pressed={sel}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px', borderRadius: 6, border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {chip.label}
                      <span style={{ fontSize: 10, opacity: 0.8 }}>{chip.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            {/* children list */}
            <div className="ob-scroll-dark" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 5 }}>
              {filtered.length === 0 ? (
                <p style={{ margin: 0, padding: '14px 10px', fontSize: 12, color: C.inkDim, textAlign: 'center' }}>No matches</p>
              ) : filtered.map((child) => {
                const cfg = SCOPE_TYPE_CONFIG[child.type]
                const isCur = child.id === currentId
                return (
                  <button key={child.id} type="button" role="menuitemradio" aria-checked={isCur}
                    onClick={() => { setOpen(false); if (!isCur) onPick(child) }}
                    className={['msp-acct-item', isCur && 'msp-acct-item--cur'].filter(Boolean).join(' ')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 6, border: 0, borderRadius: 8, background: 'transparent', cursor: isCur ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                    <img src={cfg?.tile ?? distributorTile} alt="" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }} />
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: isCur ? 600 : 500, color: C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{child.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: '0.4px', color: C.inkDim }}>{isCur ? `${cfg?.label ?? 'Account'} · current` : (cfg?.label ?? 'Account')}</span>
                    </span>
                    {isCur && <Check size={16} style={{ color: C.selected, flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}

// Shimmer placeholder card shown while a scoped customer's subscriptions "load".
function ProductSkeleton({ collapsed, labelWidth = 80 }) {
  return (
    <div style={PRODUCT_CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: NEST }}>
        <span className="nav-skel" style={{ width: 32, height: 32, borderRadius: R_TILE, flexShrink: 0 }} />
        {!collapsed && <span className="nav-skel" style={{ height: 12, borderRadius: 4, flex: 1, maxWidth: labelWidth }} />}
      </div>
    </div>
  )
}

function ProductHeader({ product, collapsed, open, onToggle, onOpen, bare, selected }) {
  const locked = product.locked
  const action = locked ? undefined : (onToggle || onOpen)
  const Tag = action ? 'button' : 'div'
  const fullTitle = locked ? `${product.label} — not subscribed` : onToggle ? `${open ? 'Collapse' : 'Expand'} ${product.label}` : `Open ${product.label}`
  // Collapsed rail tooltip shows just the product (plus its locked state); the verbose
  // expand/collapse hint stays as a native title in the expanded nav.
  const tipText = locked ? `${product.label} — not subscribed` : product.label
  return (
    <Tag
      {...(action ? { type: 'button', onClick: action } : {})}
      className={['ob-phead', bare && 'ob-phead--bare', bare && selected && 'ob-phead--sel'].filter(Boolean).join(' ')}
      aria-expanded={onToggle ? open : undefined}
      aria-current={bare && selected ? 'page' : undefined}
      title={collapsed ? undefined : fullTitle}
      data-tip={collapsed ? tipText : undefined}
      // Concentric pill: 2px padding wraps the radius-8 tile → radius 10 corners share
      // the tile's corner centers. Same padding in both rail states; the label's lead
      // margin (not flex gap) animates away so the collapsed pill is perfectly centered.
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', border: 0, padding: NEST, borderRadius: R_PILL, cursor: action ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'left' }}>
      <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <span className="ob-ptile" style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
          {product.Tile
            ? <product.Tile />
            : product.glyph
            ? <ProductTile glyph={product.glyph} muted={locked} />
            : <img src={product.tileAsset} alt="" style={{ width: 32, height: 32, display: 'block' }} />}
          {locked && <img src={lockBadge} alt="" style={{ position: 'absolute', left: 20, top: 20, width: 16, height: 16 }} />}
        </span>
        {/* Label fades + shrinks (not instant-removed) so nothing jumps on collapse/expand. */}
        <span style={{ fontSize: 14, fontWeight: 600, color: locked ? C.ink : C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: collapsed ? 0 : 160, opacity: collapsed ? 0 : 1, marginLeft: collapsed ? 0 : 8, transition: labelFade(collapsed) }}>{product.label}</span>
      </span>
      {!locked && onToggle && (
        /* Chevron shrinks/fades in step with the label so the pill never pops on collapse. */
        <span className="ob-chevc" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24, borderRadius: 12, flexShrink: 0, maxWidth: collapsed ? 0 : 24, opacity: collapsed ? 0 : 1, overflow: 'hidden', transition: labelFade(collapsed) }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: 'block', transform: open ? 'none' : 'rotate(180deg)', transition: `transform 200ms ${OB_EASE}` }}>
            <path d="M8 14L12 10L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </Tag>
  )
}

/* ====================== The persistent left nav (dark) ====================== */
function ShellNav({
  collapsed, page, openIds, onToggleProduct, onSelectItem, onOpenPortal, onToggleCollapse, dark, onToggleDark,
  path, onBack, parentName, subscribed, loading, unmanaged, showAccount = true, showPartners = true, showOverview = false,
  switcherChildren = [], switcherOwner, currentId, onPickChild,
}) {
  const px = NAV_PAD_X
  // Subscribed products keep their order at the top; unsubscribed sink to the bottom
  // (rendered locked, like SAT/Archive in the original nav). The key replays the
  // re-enter animation only when the resulting set/order actually changes.
  const orderedProducts = [
    ...PRODUCTS.filter((p) => subscribed.has(p.id)),
    ...PRODUCTS.filter((p) => !subscribed.has(p.id)),
  ]
  const subKey = orderedProducts.map((p) => p.id + (subscribed.has(p.id) ? '1' : '0')).join('|')

  // Collapsed-rail tooltips. The native `title` follows the cursor and is clipped to the
  // icons' meaning poorly; instead we delegate hover/focus over any [data-tip] row and float
  // a single tooltip anchored just off the rail's right edge, vertically centered on the row.
  const [tip, setTip] = useState(null) // { label, x, y }
  useEffect(() => { if (!collapsed) setTip(null) }, [collapsed])
  const showTip = (e) => {
    if (!collapsed) return
    const el = e.target.closest?.('[data-tip]')
    const label = el?.getAttribute('data-tip')
    if (!label) { setTip(null); return }
    const r = el.getBoundingClientRect()
    setTip({ label, x: r.right + 10, y: r.top + r.height / 2 })
  }
  const hideTip = () => setTip(null)

  return (
    <nav className="msp-nav msp-nav--v2"
      onMouseOver={showTip} onMouseLeave={hideTip} onFocusCapture={showTip} onBlurCapture={hideTip}
      style={{
        // No borderRight — it sat against the content column's identical navy frame
        // (invisible) while eating 1px from the rail, skewing the icon column off-center.
        width: collapsed ? SYM_W_COLLAPSED : SYM_W_EXPANDED, flexShrink: 0, background: C.menu,
        display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--vds-font-sans)', transition: `width 220ms ${OB_EASE}`,
      }}>
      <div className="ob-scroll-dark" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Account identity (+ Back to parent) — the node currently logged into. Shown for the
            whole reseller flow, including a customer leaf that has no Dashboard/Customers.
            The 4px inset mirrors the cards' padding so the tile column is one x everywhere. */}
        {showAccount && (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: `10px ${px}px` }}>
          {onBack && (
            <div style={{ padding: `0 ${NEST}px` }}>
              <BackRow collapsed={collapsed} parentName={parentName} onBack={onBack} />
            </div>
          )}
          <div style={{ padding: `0 ${NEST}px` }}>
            {/* More than one peer in this list → interactive sibling switcher; otherwise
                (a lone child, or the end-customer lens) → the static header. */}
            {switcherChildren.length > 1 && onPickChild ? (
              <AccountSwitcher collapsed={collapsed} account={accountFor(path)}
                owner={switcherOwner} currentId={currentId}
                children={switcherChildren} onPick={onPickChild} />
            ) : (
              <AccountHeader collapsed={collapsed} account={accountFor(path)} />
            )}
          </div>
        </div>
        <MenuDivider />
        </>
        )}

        {/* PARTNERS — Dashboard + Customers for the logged-into node. Hidden on a customer
            leaf (no sub-accounts) and in the single-tenant end-customer lens. */}
        {showPartners && (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: `10px ${px}px` }}>
          {/* 2px inset matches the cards' padding so bare pills sit on the same x (and
              width) as carded ones; kept in both states so icons never shift x. */}
          <div style={{ padding: `0 ${NEST}px` }}>
            <ProductHeader product={PARTNER_DASHBOARD} collapsed={collapsed} bare
              selected={page === 'dashboard'} onOpen={() => onSelectItem('dashboard')} />
          </div>
          <div style={{ padding: `0 ${NEST}px` }}>
            <ProductHeader product={PARTNER_CUSTOMERS} collapsed={collapsed} bare
              selected={page === 'customers'} onOpen={() => onSelectItem('customers')} />
          </div>
        </div>

        <MenuDivider />
        </>
        )}

        {/* PRODUCTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: `10px ${px}px` }}>
          <Eyebrow collapsed={collapsed}>PRODUCTS</Eyebrow>
          {unmanaged ? (
            /* Unmanaged entity (customer, reseller, or distributor) — nothing to manage. */
            !collapsed && (
              <p style={{ margin: 0, padding: '4px 8px', fontSize: 12, lineHeight: 1.45, color: C.inkDim }}>
                No managed products — this account is unmanaged.
              </p>
            )
          ) : (
          <>
          {/* Overview — only in the End-customer lens (single tenant); the reseller/customer-
              node views drop straight into the product accordions. */}
          {showOverview && (
            <div style={{ padding: `0 ${NEST}px` }}>
              <ProductHeader product={PRODUCTS_OVERVIEW} collapsed={collapsed} bare
                selected={page === PRODUCTS_OVERVIEW.id}
                onOpen={() => onSelectItem(PRODUCTS_OVERVIEW.id)} />
            </div>
          )}
          {loading ? (
            <div key="skel" className="nav-products-anim" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[80, 96, 64, 84, 72].map((w, i) => (
                <ProductSkeleton key={i} collapsed={collapsed} labelWidth={w} />
              ))}
            </div>
          ) : (
          <div key={subKey} className="nav-products-anim" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {orderedProducts.map((p) => {
              // Subscription is faked off the scoped entity — locked = not in the set.
              const locked = !subscribed.has(p.id)
              const prod = { ...p, locked }
              if (locked) {
                return (
                  <div key={p.id} style={PRODUCT_CARD}>
                    <ProductHeader product={prod} collapsed={collapsed} />
                  </div>
                )
              }
              const open = openIds[p.id] ?? true
              return (
                <div key={p.id} style={{ ...PRODUCT_CARD, gap: 0 }}>
                  <ProductHeader product={prod} collapsed={collapsed} open={open}
                    onToggle={() => onToggleProduct(p.id)} />
                  <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: `grid-template-rows 240ms ${OB_EASE}` }}>
                    <div style={{ overflow: 'hidden', minHeight: 0 }} aria-hidden={!open}>
                      {/* Items fade in a beat after the card starts opening (and drop out
                          quickly on close) — the reveal reads as two soft stages, not a pop. */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2, opacity: open ? 1 : 0, transition: open ? 'opacity 200ms ease 60ms' : 'opacity 110ms ease' }}>
                        {p.items.map((it) => (
                          <MenuItem key={it.id} collapsed={collapsed} icon={<it.icon size={16} />} label={it.label} labelSize={13} color={C.ink}
                            selected={page === it.id} ariaCurrent={page === it.id ? 'page' : undefined} onClick={() => onSelectItem(it.id)} />
                        ))}
                        <MenuItem collapsed={collapsed} icon={<ArrowUpRight size={16} />} label="Full Portal" labelSize={11} labelWeight={400} color={C.inkDim} fp
                          onClick={() => onOpenPortal(p.id)} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          )}
          </>
          )}
        </div>
      </div>

      {/* pinned bottom: OTHER + dark-mode toggle + collapse */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <MenuDivider />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: `10px ${px}px` }}>
          <Eyebrow collapsed={collapsed}>OTHER</Eyebrow>
          {/* 2px inset mirrors the product cards' inner padding so these 16px glyphs
              center on the same x-axis (36px) as the 32px tiles above — kept in both
              states so the icons never shift x on collapse/expand. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: `0 ${NEST}px` }}>
            {FOOTER.map((f) => (
              <MenuItem key={f.id} collapsed={collapsed} icon={<f.icon size={16} />} label={f.label} color={C.ink}
                selected={page === f.id} onClick={() => onSelectItem(f.id)} />
            ))}
          </div>
        </div>
        <MenuDivider />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: `6px ${px + NEST}px` }}>
          <MenuItem collapsed={collapsed} icon={dark ? <Sun size={16} /> : <Moon size={16} />} label={dark ? 'Light mode' : 'Dark mode'} color={C.ink} onClick={onToggleDark} />
          <MenuItem collapsed={collapsed} icon={collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />} label="Collapse" color={C.ink} onClick={onToggleCollapse} />
        </div>
      </div>

      {/* Collapsed-rail tooltip — a single floating label pinned to the right of the
          hovered/focused icon (escapes the rail via fixed positioning). */}
      {tip && (
        <div role="tooltip" key={tip.label} className="msp-tip" style={{
          position: 'fixed', left: tip.x, top: tip.y, transform: 'translateY(-50%)', zIndex: 80,
          pointerEvents: 'none', background: 'var(--vds-midnight-1000)', color: C.white,
          fontSize: 12, fontWeight: 500, lineHeight: 1, padding: '7px 9px', borderRadius: 6,
          whiteSpace: 'nowrap', boxShadow: 'var(--vds-shadow-lg)', border: '1px solid var(--vds-midnight-800)',
        }}>
          {tip.label}
          <span aria-hidden style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: '4px solid var(--vds-midnight-1000)' }} />
        </div>
      )}
    </nav>
  )
}

/* ---- content header actions ---- */
const HEADER_BUTTONS = ['Action 1', 'Action 2', 'Action 3']
function HeaderButtons() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
      {HEADER_BUTTONS.map((label) => (
        <button key={label} type="button" className="ob-hbtn"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 32, padding: '0 12px', borderRadius: 5, border: 0, background: C.selected, color: C.white, fontSize: 14, fontWeight: 500, lineHeight: 1, fontFamily: 'inherit', whiteSpace: 'nowrap', cursor: 'pointer' }}>
          {label}
        </button>
      ))}
    </div>
  )
}

// Page-title icon — the page's own line glyph (Figma 96:1428): bare, ink-muted, 28px,
// no background tile. Shared by ContentCard and the Performance/Customers page headers.
function TitleIcon({ icon: Icon }) {
  return <Icon size={28} strokeWidth={1.75} style={{ color: 'var(--vds-ink-muted)', flexShrink: 0 }} />
}

// Pages whose heading uses the exact Vipre DS glyph (Figma 96:1428/1466/1508) instead of
// the app's line icon. Rendered on the 48px artboard, so a larger size matches the frame.
const PAGE_TITLE_GLYPHS = {
  'edr-devices-s': DevicesGlyph,
  'ss-policies': PoliciesGlyph,
  'edr-incidents-s': IncidentsGlyph,
}

// Figma 73:1272-1277: borderless white cards on the grey body.
const cardStyle = { flex: 1, minWidth: 0, background: C.card, borderRadius: 8 }
function ContentCard({ page, path }) {
  const PageIcon = iconOf(page)
  const ExactGlyph = PAGE_TITLE_GLYPHS[page]
  const title = labelOf(page)
  // The title icon is the page's own line glyph (Figma 96:1428) — bare, ink-muted, no
  // background tile. (pid is still resolved for the breadcrumb's product crumb.)
  const pid = productOfPage(page)
  // The page header is one unified panel (Figma 96:1381): a breadcrumb, a 1px divider, then
  // the page-title row — all on the content canvas with 24px gaps. The breadcrumb (scope leaf
  // → product → page) only shows when a path is supplied (the reseller's scoped views); the
  // portal and the single-tenant end-customer pass none and render the title row alone.
  const crumbs = path != null
    ? [path.at(-1)?.name ?? 'All Customers', pid && PRODUCTS.find((p) => p.id === pid)?.label, title].filter(Boolean)
    : null
  return (
    <div style={{ flex: 1, minWidth: 0, background: C.content, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, overflow: 'hidden' }}>
      {crumbs && (
        <>
          <Breadcrumb items={crumbs} />
          <div style={{ height: 1, width: '100%', background: 'var(--vds-line)', flexShrink: 0 }} />
        </>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {ExactGlyph
            ? <ExactGlyph size={40} style={{ color: 'var(--vds-ink-muted)', flexShrink: 0 }} />
            : <TitleIcon icon={PageIcon} />}
          <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--vds-ink)' }}>{title}</span>
        </div>
        <HeaderButtons />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
          <div style={cardStyle} /><div style={cardStyle} />
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
          <div style={cardStyle} /><div style={cardStyle} /><div style={cardStyle} />
        </div>
      </div>
    </div>
  )
}

function labelOf(id) {
  if (id === 'dashboard') return 'Dashboard'
  if (id === 'customers') return 'Customers'
  for (const p of PRODUCTS) for (const it of p.items || []) if (it.id === id) return it.label
  for (const key in PORTALS) for (const s of PORTALS[key].sections) for (const it of s.items) if (it.id === id) return it.label
  for (const f of FOOTER) if (f.id === id) return f.label
  return 'Overview'
}
function iconOf(id) {
  if (id === 'dashboard') return LayoutDashboard
  if (id === 'customers') return Store
  if (id === 'products-overview') return Zap
  for (const p of PRODUCTS) for (const it of p.items || []) if (it.id === id) return it.icon
  for (const key in PORTALS) for (const s of PORTALS[key].sections) for (const it of s.items) if (it.id === id) return it.icon
  for (const f of FOOTER) if (f.id === id) return f.icon
  return LayoutDashboard
}

// Resolve the current scope into the bits the entity bar renders.
function toScope(path) {
  const leaf = path.at(-1)
  const cfg = leaf ? SCOPE_TYPE_CONFIG[leaf.type] : null
  return {
    key: leaf ? leaf.id : 'root',
    name: leaf ? leaf.name : 'All Customers',
    tile: cfg ? cfg.tile : null,
    icon: cfg ? cfg.icon : Boxes,
    depth: path.length,
  }
}

/* Page-location breadcrumb (Figma 96:1384): scope leaf → product → current page. Ancestor
   crumbs are muted (--vds-ink-subtle = #6b7585), the active page is ink, separated by 14px
   right-chevrons. Shown only in scoped (reseller) views; the first crumb truncates if long. */
function Breadcrumb({ items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 }}>
      {items.flatMap((label, i) => {
        const last = i === items.length - 1
        const nodes = []
        if (i > 0) nodes.push(
          <ChevronRight key={`s${i}`} size={14} style={{ color: 'var(--vds-ink-subtle)', flexShrink: 0 }} />,
        )
        nodes.push(
          <span key={`l${i}`} style={{
            fontSize: 11, fontWeight: 400, lineHeight: 1,
            color: last ? 'var(--vds-ink)' : 'var(--vds-ink-subtle)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            flexShrink: i === 0 ? 1 : 0, minWidth: i === 0 ? 0 : undefined,
          }}>{label}</span>,
        )
        return nodes
      })}
    </div>
  )
}

/* ============================ Full portal (focus mode) ============================ */
// A product's portal def. Products without a PORTALS entry fall back to a single
// section built from their nav items so "Full Portal" still opens something.
function portalDef(pid) {
  if (PORTALS[pid]) return PORTALS[pid]
  const p = PRODUCTS.find((x) => x.id === pid)
  return { label: p?.label || 'Portal', defaultPage: p?.items?.[0]?.id, sections: [{ label: 'Pages', items: p?.items || [] }] }
}

/* One light portal-nav row. */
function PortalRow({ icon, label, labelSize = 12, labelWeight = 500, selected, collapsed, onClick, ariaLabel }) {
  const pillPad = 8
  const base = POR_PAD
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button', onClick } : {})}
      className={onClick ? 'obrow obrow--light' : undefined}
      aria-current={selected ? 'page' : undefined} aria-label={ariaLabel}
      style={{
        display: 'flex', alignItems: 'center', width: '100%', minHeight: 24,
        paddingLeft: base - pillPad, paddingRight: base - pillPad, border: 0, background: 'transparent',
        cursor: onClick ? 'pointer' : 'default', color: selected ? C.onSelected : C.portalInk,
        fontFamily: 'inherit', textAlign: 'left', transition: `padding 220ms ${OB_EASE}`,
      }}
    >
      <span className="obrow-pill" style={{
        display: 'flex', flex: 1, minWidth: 0, alignItems: 'center', borderRadius: 5,
        paddingTop: 8, paddingBottom: 8, paddingLeft: pillPad, paddingRight: collapsed ? pillPad : 8,
        transition: `padding 220ms ${OB_EASE}, background-color 120ms ease`,
        ...(selected ? { background: C.selected } : {}),
      }}>
        <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
        <span style={{
          maxWidth: collapsed ? 0 : 150, marginLeft: collapsed ? 0 : 8, opacity: collapsed ? 0 : 1, minWidth: 0,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: labelSize, fontWeight: labelWeight,
          transition: `max-width 220ms ${OB_EASE}, margin-left 220ms ${OB_EASE}, opacity 150ms ease`,
        }}>{label}</span>
      </span>
    </Tag>
  )
}

/* The full-portal left nav (light): exit-to-shell, a WORKING-IN customer banner (the
   reference point), a product switcher, and the product's deep sections. */
function WorkspaceNav({ product, page, collapsed, scope, products, showScope = true, onExit, onSelectPage, onSwitchProduct, onToggleCollapse, dark, onToggleDark, style }) {
  const def = portalDef(product)
  const ProductGlyph = (PRODUCTS.find((p) => p.id === product) || {}).icon || Laptop
  const [switcherOpen, setSwitcherOpen] = useState(false)
  return (
    <div style={{
      width: collapsed ? POR_W_COLLAPSED : POR_W_EXPANDED, flexShrink: 0, background: C.portalBg,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'visible',
      transition: `width 220ms ${OB_EASE}`, ...style,
    }}>
      <div className="ob-scroll-light" style={{ padding: '12px 0 8px', overflowY: 'auto', overflowX: 'visible', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PortalRow collapsed={collapsed} label="Exit portal" labelWeight={500}
          onClick={onExit} ariaLabel="Exit portal" icon={<ChevronLeft size={16} />} />

        {/* WORKING IN — the customer reference point, shown when a reseller is operating
            inside a customer. The end customer is in its own portal, so it's omitted. */}
        {showScope && !collapsed && (
          <div style={{ padding: `0 ${POR_PAD - 8}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, background: 'color-mix(in srgb, var(--vds-ink) 5%, transparent)', border: `1px solid ${C.line}` }}>
              {scope.tile ? <img src={scope.tile} alt="" style={{ width: 28, height: 28, display: 'block', flexShrink: 0 }} />
                : <span style={{ width: 28, height: 28, borderRadius: 6, background: 'color-mix(in srgb, var(--vds-ink) 10%, transparent)', flexShrink: 0 }} />}
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 9, letterSpacing: '0.5px', textTransform: 'uppercase', color: C.portalEyebrow, lineHeight: 1.5 }}>Working in</span>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vds-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scope.name}</span>
              </span>
            </div>
          </div>
        )}

        {/* product switcher */}
        <div style={{ position: 'relative' }}>
          <button type="button" className="obrow obrow--light ob-switcher" onClick={() => setSwitcherOpen((o) => !o)}
            aria-label="Switch product" aria-expanded={switcherOpen}
            style={{
              display: 'flex', alignItems: 'center', width: '100%', minHeight: 24, textAlign: 'left',
              paddingLeft: collapsed ? (POR_W_COLLAPSED - 16) / 2 - 4 : POR_PAD - 6,
              paddingRight: collapsed ? (POR_W_COLLAPSED - 16) / 2 - 4 : POR_PAD - 6,
              border: 0, background: 'transparent', cursor: 'pointer', color: C.portalInk, fontFamily: 'inherit',
              transition: `padding 220ms ${OB_EASE}`,
            }}>
            <span className="obrow-pill" style={{ display: 'flex', flex: 1, minWidth: 0, alignItems: 'center', borderRadius: 5, padding: collapsed ? '8px' : '8px 8px 8px 6px' }}>
              <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ProductGlyph size={16} style={{ color: C.portalInk }} />
              </span>
              {!collapsed && <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--vds-ink)' }}>{def.label}</span>}
              {!collapsed && <ChevronDown size={14} style={{ opacity: 0.55, flexShrink: 0, transform: switcherOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }} />}
            </span>
          </button>
          {switcherOpen && (
            <>
              <div onClick={() => setSwitcherOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 17, zIndex: 31, minWidth: 174, background: C.portalBg, borderRadius: 10, border: `1px solid ${C.line}`, boxShadow: 'var(--vds-shadow-lg)', padding: 5 }}>
                {products.map((p) => {
                  const G = p.icon
                  const cur = p.id === product
                  return (
                    <button key={p.id} type="button" onClick={() => { setSwitcherOpen(false); if (!cur) onSwitchProduct(p.id) }}
                      className="ob-switch-item"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', border: 0, borderRadius: 6, background: cur ? 'color-mix(in srgb, var(--nav-accent) 12%, transparent)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: cur ? 'var(--vds-ink)' : C.portalInk, textAlign: 'left' }}>
                      <G size={16} style={{ flexShrink: 0, color: cur ? C.selected : C.portalInk }} />
                      <span style={{ flex: 1, fontWeight: cur ? 500 : 400 }}>{p.label}</span>
                      {cur && <Check size={15} style={{ color: C.selected }} />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {def.sections.map((sec) => (
          <div key={sec.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: C.portalEyebrow, overflow: 'hidden', whiteSpace: 'nowrap', paddingLeft: POR_PAD, marginBottom: 8, opacity: collapsed ? 0 : 1, transition: 'opacity 150ms ease' }}>{sec.label}</div>
            {sec.items.map((it) => {
              const ItemIcon = it.icon
              return (
                <PortalRow key={it.id} collapsed={collapsed} label={it.label}
                  selected={page === it.id} onClick={() => onSelectPage(it.id)} icon={<ItemIcon size={16} />} />
              )
            })}
          </div>
        ))}
      </div>
      <div style={{ flexShrink: 0, padding: '8px 0 24px' }}>
        <PortalRow collapsed={collapsed} label={dark ? 'Light mode' : 'Dark mode'}
          onClick={onToggleDark} icon={dark ? <Sun size={16} /> : <Moon size={16} />} />
        <PortalRow collapsed={collapsed} label="" onClick={onToggleCollapse} ariaLabel={collapsed ? 'Expand menu' : 'Collapse menu'}
          icon={collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />} />
      </div>
    </div>
  )
}

/* The focus-mode portal: the product's deep nav + content, scoped to the current
   customer (shown in the nav banner AND the content reference header). */
function PortalView({ product, page, collapsed, scope, products, showScope = true, onExit, onSelectPage, onSwitchProduct, onToggleCollapse, dark, onToggleDark }) {
  const def = portalDef(product)
  const ProductGlyph = (PRODUCTS.find((p) => p.id === product) || {}).icon || Laptop
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', background: C.topbar, padding: 8 }}>
      <WorkspaceNav
        product={product} page={page} collapsed={collapsed} scope={scope} products={products} showScope={showScope}
        onExit={onExit} onSelectPage={onSelectPage} onSwitchProduct={onSwitchProduct}
        onToggleCollapse={onToggleCollapse} dark={dark} onToggleDark={onToggleDark}
        style={{ borderRadius: '16px 0 0 16px' }}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: C.content, borderRadius: '0 16px 16px 0', overflow: 'hidden' }}>
        {/* customer + product reference header — the "which customer am I working for" cue.
            The end customer is in its own portal, so only the product is shown. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 32px', flexShrink: 0, background: 'var(--vds-surface)', borderBottom: `1px solid ${C.line}` }}>
          {showScope && (scope.tile ? <img src={scope.tile} alt="" style={{ width: 24, height: 24, display: 'block', flexShrink: 0 }} />
            : <span style={{ width: 24, height: 24, borderRadius: 6, background: 'color-mix(in srgb, var(--vds-ink) 10%, transparent)', flexShrink: 0 }} />)}
          {showScope && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--vds-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scope.name}</span>}
          {showScope && <span style={{ color: C.portalEyebrow, fontSize: 14 }}>›</span>}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.portalInk, flexShrink: 0 }}>
            <ProductGlyph size={15} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{def.label} Full Portal</span>
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <ContentCard page={page} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }} />
        </div>
      </div>
    </div>
  )
}

/* ---- Persona toggle (top chrome) — flips the shell between the two demo lenses:
   the RESELLER/MSP view (scope tree + customers + per-customer products) and the
   single-tenant END CUSTOMER view (products only, no hierarchy). UC3 (reseller inside a
   customer) is just the reseller lens after drilling in, so it needs no third state. */
const PERSONAS = [
  { id: 'reseller', label: 'Reseller' },
  { id: 'customer', label: 'End customer' },
]
function PersonaToggle({ persona, onPick }) {
  return (
    <div role="radiogroup" aria-label="Demo persona" style={{
      display: 'flex', alignItems: 'center', gap: 2, height: 32, padding: 2, borderRadius: 8,
      border: '1px solid var(--vds-midnight-700)', background: 'var(--vds-midnight-900)',
    }}>
      {PERSONAS.map((p) => {
        const cur = p.id === persona
        return (
          <button key={p.id} type="button" role="radio" aria-checked={cur}
            onClick={() => { if (!cur) onPick(p.id) }}
            style={{
              height: 26, padding: '0 12px', borderRadius: 6, border: 0, cursor: cur ? 'default' : 'pointer',
              background: cur ? 'var(--nav-accent)' : 'transparent',
              color: cur ? 'var(--vds-white)' : 'var(--vds-midnight-300)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', transition: 'background-color 120ms ease, color 120ms ease',
            }}>
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

// The single end-customer tenant the UC1 lens represents. Its id seeds the same hashed
// subscription profile the reseller lens uses per-customer, so the products feel real.
const CUSTOMER_TENANT = { id: 'acme-corp', name: 'Acme Corp' }

function ShellInner() {
  const { path, navigate } = useScope()

  const [brand, setBrand] = useBrand()
  const [persona, setPersona] = useState('reseller')
  const isCustomer = persona === 'customer'
  const [dark, setDark] = useState(false)
  const [provModal, setProvModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [openProducts, setOpenProducts] = useState(() => Object.fromEntries(PRODUCTS.map((p) => [p.id, true])))
  // Clicking any row on the Customers page opens this entity-data drawer (dist/reseller/customer).
  const [customerDrawer, setCustomerDrawer] = useState(null)

  // Edge collapse handle: a circular chevron that rides the seam between the nav and the
  // content, following the cursor's Y and revealed only when the cursor is near the nav's
  // right edge. `on` = shown; `y` = cursor Y within the nav row. (The bottom Collapse row
  // stays too — this is an additional affordance.)
  const rowRef = useRef(null)
  const [edge, setEdge] = useState({ y: 0, on: false })
  const onRowMove = (e) => {
    const r = rowRef.current?.getBoundingClientRect()
    if (!r) return
    const x = e.clientX - r.left
    const seam = collapsed ? SYM_W_COLLAPSED : SYM_W_EXPANDED
    const near = x >= seam - 26 && x <= seam + 18
    setEdge((prev) => (near ? { y: e.clientY - r.top, on: true } : (prev.on ? { ...prev, on: false } : prev)))
  }
  const onRowLeave = () => setEdge((p) => (p.on ? { ...p, on: false } : p))

  // The scoped entity drives the faked product subscriptions shown in the nav. In the
  // end-customer lens there's no hierarchy, so the fixed tenant id seeds the profile.
  const leafId = isCustomer ? CUSTOMER_TENANT.id : (path.at(-1)?.id ?? 'root')
  const subscribed = subscriptionFor(leafId)
  // An UNMANAGED entity has nothing to manage — its products never appear in the nav.
  // Covers unmanaged customers, reseller partners, and unmanaged distributors. The end
  // customer always has its own managed products.
  const leaf = isCustomer ? null : path.at(-1)
  const leafUnmanaged = isCustomer ? false : isEntityUnmanaged(leaf)

  // The node currently logged into (= the account-header entity) is the path leaf; at root
  // it's the signed-in distributor. Customer-type nodes are leaves with no sub-accounts, so
  // they get no Dashboard / Customers — just their products.
  const isCustomerNode = isCustomer || path.at(-1)?.type === 'customer'
  // Logging into an entity lands you on its Dashboard; a customer node has none, so it lands
  // on its first subscribed product page (there's no Products "Overview" nav item anymore).
  const landingFor = (entity) => (entity?.type === 'customer' ? firstProductPageFor(entity.id, isEntityUnmanaged(entity)) : 'dashboard')
  // Back up one level to the parent scope. Parents always have children, so → Dashboard.
  const parentName = path.length >= 2 ? path.at(-2).name : LOGGED_IN_RESELLER.name
  const goBack = () => { if (path.length) { navigate(path.slice(0, -1)); setPage('dashboard') } }
  // The account-header switcher lists the PARENT's children — the current node plus its
  // siblings (the list you drilled in from) — so picking one hops laterally between peers.
  // The "parent" of the current node is path[-2]; at root it's the signed-in distributor,
  // whose children are the top-level accounts (mockData). Hidden in the end-customer lens.
  const listOwnerEntity = isCustomer ? null : (path.at(-2) ?? null)
  const switcherChildren = isCustomer ? [] : (listOwnerEntity?.children ?? mockData)
  const switcherOwner = isCustomer
    ? null
    : listOwnerEntity
      ? { name: listOwnerEntity.name, tile: SCOPE_TYPE_CONFIG[listOwnerEntity.type]?.tile ?? distributorTile }
      : { name: LOGGED_IN_RESELLER.name, tile: distributorTile }
  const currentId = path.at(-1)?.id ?? null
  // Switch to a peer: replace the current leaf with the picked sibling (drills in from root,
  // where there is no leaf to replace). Lands on that node's home page.
  const switchTo = (child) => { navigate([...path.slice(0, -1), child]); setPage(landingFor(child)) }

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  // If scoping into a customer that doesn't subscribe to the product you're viewing
  // (or an unmanaged customer with no products at all), fall back to its dashboard so
  // you never sit on a product that isn't shown.
  useEffect(() => {
    const owner = productOfPage(page)
    if (owner && (leafUnmanaged || !subscriptionFor(leafId).has(owner))) setPage(isCustomer ? 'products-overview' : isCustomerNode ? firstProductPageFor(leafId, leafUnmanaged) : 'dashboard')
  }, [leafId, page, leafUnmanaged, isCustomerNode])

  // Simulated "loading this customer's subscriptions": on a scope change, show the nav
  // skeleton briefly so the menu change reads as a fetch (not an instant swap).
  const [navLoading, setNavLoading] = useState(false)
  const navFirst = useRef(true)
  const navTimer = useRef(0)
  useEffect(() => {
    if (navFirst.current) { navFirst.current = false; return }
    setNavLoading(true)
    clearTimeout(navTimer.current)
    navTimer.current = setTimeout(() => setNavLoading(false), 700)
    return () => clearTimeout(navTimer.current)
  }, [leafId])

  // Full portal (focus mode): which product's deep portal is open, scoped to the
  // current customer. null = the normal MSP shell.
  const [openPortal, setOpenPortal] = useState(null)
  const [portalPage, setPortalPage] = useState(null)
  const [portalCollapsed, setPortalCollapsed] = useState(false)
  const openPortalFor = (pid) => { setOpenPortal(pid); setPortalPage(portalDef(pid).defaultPage) }
  const scope = isCustomer
    ? { key: CUSTOMER_TENANT.id, name: CUSTOMER_TENANT.name, tile: null, icon: Boxes, depth: 0 }
    : toScope(path)
  const portalProducts = PRODUCTS.filter((p) => subscribed.has(p.id))

  // Flip the demo lens: reset scope + any open drawers/portal, and land on the lens's
  // home page (reseller → Dashboard; end customer → products Overview).
  const switchPersona = (next) => {
    if (next === persona) return
    setPersona(next)
    setOpenPortal(null)
    setCustomerDrawer(null)
    navigate([])
    setPage(next === 'customer' ? 'products-overview' : 'dashboard')
  }

  const openModal = (type, contextEntity = null, availableTypes = null) => setProvModal({ type, contextEntity, availableTypes })

  return (
    <div className="shell-root" style={{ ...brandStyleVars(brand), height: '100vh', display: 'flex', flexDirection: 'column', background: C.topbar, overflow: 'hidden', fontFamily: 'var(--vds-font-sans)' }}>
      {/* Top chrome: the brand logo strip + reseller theme switcher — the scope navigator lives in the nav. */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, height: 48, background: 'var(--vds-canvas)', borderBottom: '1px solid var(--vds-midnight-1000)' }} className="dark">
        {/* Logo = home: jump back to the root node you signed in as (Melvin Industries). */}
        <button type="button" title="Back to Melvin Industries"
          onClick={() => { navigate([]); setPage('dashboard'); setOpenPortal(null) }}
          style={{ display: 'flex', alignItems: 'center', paddingLeft: 19, color: C.white, background: 'transparent', border: 0, cursor: 'pointer' }}>
          <BrandLogo brand={brand} />
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, paddingRight: 16 }}>
          <PersonaToggle persona={persona} onPick={switchPersona} />
          <BrandPicker brand={brand} onPick={setBrand} />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0, background: C.topbar }}>
        {openPortal ? (
          <PortalView
            product={openPortal} page={portalPage} collapsed={portalCollapsed}
            scope={scope} products={portalProducts} showScope={!isCustomer}
            onExit={() => { setOpenPortal(null); if (isCustomer) setPage('products-overview') }}
            onSelectPage={setPortalPage}
            onSwitchProduct={openPortalFor}
            onToggleCollapse={() => setPortalCollapsed((c) => !c)}
            dark={dark} onToggleDark={() => setDark((d) => !d)}
          />
        ) : (
        <div ref={rowRef} onMouseMove={onRowMove} onMouseLeave={onRowLeave}
          style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex' }}>
        <ShellNav
          collapsed={collapsed} page={page} openIds={openProducts}
          onToggleProduct={(id) => setOpenProducts((o) => ({ ...o, [id]: !o[id] }))}
          onSelectItem={(id) => {
            // Dashboard/Customers both belong to the node currently logged into, so they
            // keep the scope; only the page changes. (Back up a level via the nav's Back
            // button; there's no scope reset here anymore.)
            setPage(id)
          }}
          onBack={path.length ? goBack : null}
          parentName={parentName}
          onOpenPortal={openPortalFor}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          dark={dark} onToggleDark={() => setDark((d) => !d)}
          path={path}
          subscribed={subscribed} loading={navLoading} unmanaged={leafUnmanaged}
          showAccount={!isCustomer}
          showPartners={!isCustomerNode}
          showOverview={isCustomer}
          switcherChildren={switcherChildren} switcherOwner={switcherOwner}
          currentId={currentId} onPickChild={switchTo}
        />

        {/* content column (Figma 73:1278): an 8px navy frame, the white entity bar with
            the rounded top-left corner, then the grey body carrying the inset top shadow. */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', background: 'var(--vds-midnight-1000)', paddingLeft: 8, paddingTop: 8 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            {/* One grey content panel with the rounded top-left corner. On product pages the
                scope/entity bar + divider live INSIDE the panel above the page title (Figma
                91:1135); Dashboard/Customers carry their own header; the single-tenant
                end-customer lens shows no scope bar. */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative', background: C.content, borderRadius: '32px 0 0 0', overflow: 'hidden' }}>
              {page === 'dashboard' ? (
                <div className="shell-customers" style={{ flex: 1, minWidth: 0, background: C.content, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TitleIcon icon={iconOf('dashboard')} />
                    <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--vds-ink)' }}>Dashboard</span>
                  </div>
                  {/* Placeholder dashboard: a row of 4 KPI cards, then 3 full-width rows —
                      mirrors the skeleton blocks the product pages use. */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
                    <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                      {[0, 1, 2, 3].map((i) => <div key={i} style={{ ...cardStyle, aspectRatio: '6 / 4' }} />)}
                    </div>
                    {[0, 1, 2].map((i) => <div key={i} style={{ ...cardStyle, flex: 1, minHeight: 96 }} />)}
                  </div>
                </div>
              ) : page === 'customers' ? (
                <div className="shell-customers" style={{ flex: 1, minWidth: 0, background: C.content, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TitleIcon icon={iconOf('customers')} />
                    <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--vds-ink)' }}>Customers</span>
                  </div>
                  {/* Always the browsable descendants list of the logged-into node (path leaf) —
                      identical to Melvin's view, just scoped to the current entity's children. */}
                  <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
                    <ChildrenListView
                      entity={path.at(-1) ?? { type: 'root', name: 'My Accounts', children: mockData }}
                      filter={null}
                      onDrillDown={(child) => setCustomerDrawer(child)}
                      onOpen={(child) => { navigate([...path, child]); setPage(landingFor(child)) }}
                      openLabel="Login"
                      hideHeader hideTypeBadge statusAsDot showManagementFilter subtleUnmanaged typeTitle mspMeta
                      labelOverrides={{ partner: 'Reseller' }}
                      tileFor={(type) => SCOPE_TYPE_CONFIG[type]?.tile}
                    />
                  </div>
                </div>
              ) : (
                <ContentCard page={page} path={isCustomer ? undefined : path} />
              )}
              {/* subtle inner shadow just below the entity bar (Figma 73:1251). */}
              <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }} />
            </div>
          </div>
        </div>

        {/* Blue accent border literally on the nav's right edge (line hugs the nav's inner
            edge) — fades in with the handle. */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, bottom: 0, left: collapsed ? SYM_W_COLLAPSED : SYM_W_EXPANDED,
          width: 2, transform: 'translateX(-100%)', background: 'var(--nav-accent)', pointerEvents: 'none', zIndex: 44,
          opacity: edge.on ? 1 : 0, transition: `opacity 130ms ease, left 220ms ${OB_EASE}`,
        }} />

        {/* Edge collapse handle — a circular chevron straddling the nav/content seam. It
            follows the cursor's Y and fades in only when the cursor is near the right edge
            (see onRowMove). Blue chevron, white ring + drop shadow. Left chevron collapses;
            right chevron expands. */}
        <button type="button" onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="msp-edge-handle"
          style={{
            position: 'absolute', top: edge.y, left: collapsed ? SYM_W_COLLAPSED : SYM_W_EXPANDED,
            transform: 'translate(-50%, -50%)', width: 24, height: 24, borderRadius: 999,
            display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer', zIndex: 45,
            background: 'var(--nav-accent)', border: 0, color: 'var(--vds-white)',
            boxShadow: '0 0 0 2px var(--vds-white), 0 4px 10px rgba(0,0,0,0.30)',
            opacity: edge.on ? 1 : 0, pointerEvents: edge.on ? 'auto' : 'none',
            transition: `opacity 130ms ease, left 220ms ${OB_EASE}`,
          }}>
          {collapsed ? <ArrowRight size={15} strokeWidth={2.5} /> : <ArrowLeft size={15} strokeWidth={2.5} />}
        </button>
        </div>
        )}
      </div>

      {provModal && (
        <ProvisioningModal
          type={provModal.type}
          contextEntity={provModal.contextEntity}
          availableTypes={provModal.availableTypes}
          onClose={() => setProvModal(null)}
          onSuccess={(m) => setToast(m)}
        />
      )}
      {toast && <SuccessToast message={toast} onDismiss={() => setToast(null)} />}

      {/* Entity-data drawer — opened by clicking any row on the Customers page.
          Same slide-out entity detail the dashboard's descendants drawer uses.
          "Open" drills the scope and populates the Customers surface with that entity's detail. */}
      <EntityDataDrawer
        entity={customerDrawer}
        openLabel="Login"
        siblings={path.at(-1)?.children ?? mockData}
        onOpenEntity={(trail) => {
          // The drawer's trail (clicked row → drilled descendants) appends to the current
          // scope, so the path reflects the full ancestry. Logging in lands on the node's
          // Dashboard (Overview for a customer leaf).
          const full = [...path, ...trail]
          navigate(full); setCustomerDrawer(null); setPage(landingFor(full.at(-1)))
        }}
        onClose={() => setCustomerDrawer(null)}
      />
    </div>
  )
}

export default function MspShellV2() {
  return (
    <ScopeProvider>
      <ShellInner />
    </ScopeProvider>
  )
}
