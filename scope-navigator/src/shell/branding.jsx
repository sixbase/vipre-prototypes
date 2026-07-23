import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { VipreMark, VipreWordmark } from '../config'
import { ChevronDown, Check } from '@icons'

/* ============================================================================
   RESELLER BRANDING  (shared by SymphonyShell ?view=shell + MspShell ?view=msp)

   Vipre lets certain resellers white-label the portal. A "brand" bundles a color
   ramp + a logo (mark + wordmark). Picking one:
     1. Re-tints the whole shell chrome by remapping --vds-midnight-50…1000 to the
        chosen ramp's steps (applied as inline style on the .shell-root element, so
        it cascades to everything inside — nav, header, and dark-mode content
        surfaces — but never leaks to the rest of the app).
     2. Repoints --nav-accent (the active-pill / selected / CTA color, today cobalt)
        at the brand ramp's 600 step, so the accent follows the brand.
     3. Swaps the Vipre mark + wordmark for the reseller's logo lockup.

   The choice persists in localStorage and is shared across both shells.

   The midnight ramp is the source-of-truth nav ramp, so the DEFAULT (Vipre) needs
   NO override — it just keeps real midnight + the cobalt accent (today's look,
   pixel-identical). Only the 8 reseller brands remap.
   ========================================================================== */

/* ---- Brand marks: simple geometric SVGs, currentColor so the lockup colors them.
        These stand in for a real reseller logo in the POC — swap in actual SVGs later. */
function MarkPeaks(p) {           // azure — Northpeak
  return <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M1 20L7 8l4 7 5-10 7 15z" fill="currentColor" /></svg>
}
function MarkRings(p) {           // harbor — Tidewater
  return <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.4" /><circle cx="12" cy="12" r="3.4" fill="currentColor" /></svg>
}
function MarkLeaf(p) {            // emerald — Evergreen
  return <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 2C18 8 18 16 12 22 6 16 6 8 12 2z" fill="currentColor" /></svg>
}
function MarkEmber(p) {           // rose — Ember
  return <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 2c1 5 7 7 7 13a7 7 0 11-14 0c0-3 2-4 3-6 1 2 2 2 3 2 0-3-2-6-2-9z" fill="currentColor" /></svg>
}
function MarkSpark(p) {           // orchid — Lumen
  return <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="currentColor" /></svg>
}
function MarkHex(p) {             // clay — Terra
  return <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 2l9 5v10l-9 5-9-5V7z" fill="currentColor" /></svg>
}
function MarkSun(p) {             // amber — Sunstone
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="4.6" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1.5" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22.5" />
        <line x1="1.5" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22.5" y2="12" />
        <line x1="4.6" y1="4.6" x2="6.4" y2="6.4" /><line x1="17.6" y1="17.6" x2="19.4" y2="19.4" />
        <line x1="19.4" y1="4.6" x2="17.6" y2="6.4" /><line x1="6.4" y1="17.6" x2="4.6" y2="19.4" />
      </g>
    </svg>
  )
}
function MarkSlate(p) {           // graphite — Slate
  return <svg viewBox="0 0 24 24" fill="none" {...p}><rect x="5.5" y="5.5" width="13" height="13" rx="2.5" transform="rotate(45 12 12)" stroke="currentColor" strokeWidth="2.4" /><rect x="9" y="9" width="6" height="6" rx="1.4" fill="currentColor" /></svg>
}

/* ---- Brand registry. `ramp` drives the chrome swap; vipre is the default (no swap). ---- */
export const BRANDS = [
  // VIPRE accent is the literal cobalt #0068cb — the cobalt token isn't in the loaded
  // index.css bundle (only the 9 ramps + midnight are), so a var() here would resolve empty.
  { id: 'vipre',      name: 'VIPRE',      ramp: 'midnight', accent: '#0068cb',                vipre: true },
  { id: 'northpeak',  name: 'Northpeak',  ramp: 'azure',    accent: 'var(--vds-azure-600)',    Mark: MarkPeaks },
  { id: 'tidewater',  name: 'Tidewater',  ramp: 'harbor',   accent: 'var(--vds-harbor-600)',   Mark: MarkRings },
  { id: 'evergreen',  name: 'Evergreen',  ramp: 'emerald',  accent: 'var(--vds-emerald-600)',  Mark: MarkLeaf },
  { id: 'ember',      name: 'Ember',      ramp: 'rose',     accent: 'var(--vds-rose-600)',     Mark: MarkEmber },
  { id: 'lumen',      name: 'Lumen',      ramp: 'orchid',   accent: 'var(--vds-orchid-600)',   Mark: MarkSpark },
  { id: 'terra',      name: 'Terra',      ramp: 'clay',     accent: 'var(--vds-clay-600)',     Mark: MarkHex },
  { id: 'sunstone',   name: 'Sunstone',   ramp: 'amber',    accent: 'var(--vds-amber-600)',    Mark: MarkSun },
  { id: 'slate',      name: 'Slate',      ramp: 'graphite', accent: 'var(--vds-graphite-600)', Mark: MarkSlate },
]

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

// Inline CSS-var bundle to spread onto .shell-root. Remaps the midnight ramp to the
// brand ramp (default vipre = no remap) + sets the accent. The deepest well (midnight-1000,
// used for the recessed product cards + nav outline) is synthesized from the ramp's 950.
export function brandStyleVars(brand) {
  const v = { '--nav-accent': brand.accent }
  if (brand.ramp !== 'midnight') {
    for (const s of STEPS) v[`--vds-midnight-${s}`] = `var(--vds-${brand.ramp}-${s})`
    v['--vds-midnight-1000'] = `color-mix(in srgb, var(--vds-${brand.ramp}-950) 62%, #000)`
    // The bright top edge of the product-tile border (default #3EB3F0) follows the ramp too.
    v['--tile-edge'] = `var(--vds-${brand.ramp}-400)`
  }
  return v
}

const KEY = 'vds-shell-brand'
// Persisted brand selection, shared across both shells via one localStorage key.
export function useBrand() {
  const [id, setId] = useState(() => {
    try { return localStorage.getItem(KEY) || 'vipre' } catch { return 'vipre' }
  })
  useEffect(() => { try { localStorage.setItem(KEY, id) } catch { /* ignore */ } }, [id])
  const brand = BRANDS.find((b) => b.id === id) || BRANDS[0]
  return [brand, setId]
}

/* ---- Logo lockup (mark + wordmark), rendered white on the navy chrome. Vipre keeps its
        real mark + wordmark; resellers get their geometric mark + name.

        `collapsed` (opt-in) drives the rail-collapse treatment: the wordmark reduces to the
        mark alone. The VIPRE mark occupies the SAME x-region (0–47) in the wordmark SVG as
        the standalone mark, so we overlay them and cross-fade — the mark holds its exact
        position while the letters dissolve, never sliding. GSAP runs the cross-fade and the
        box's width tween on one curve so they land together. Resellers fade + collapse the
        name beside a fixed mark. v1 shells (?view=msp / ?view=shell) pass no `collapsed`, so
        they keep the old static lockup untouched. ---- */
const LOGO_H = 17
const VIPRE_WORD_W = (LOGO_H * 220) / 40 // wordmark viewBox aspect at LOGO_H tall
const VIPRE_MARK_W = (LOGO_H * 47) / 40  // mark viewBox aspect — the collapsed width

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// Animate only on a real collapse toggle — never on mount (which would play an unwanted
// entrance), and never under StrictMode's double-invoked effect. We compare against the
// previous value and set (not tween) on the first pass.
function useCollapseTween(collapsed, apply) {
  const prev = useRef(undefined)
  useLayoutEffect(() => {
    const first = prev.current === undefined
    const changed = prev.current !== collapsed
    prev.current = collapsed
    if (first || prefersReducedMotion()) return apply(collapsed, false)
    if (changed) return apply(collapsed, true)
  }, [collapsed, apply])
}

function VipreLogo({ collapsed }) {
  const word = useRef(null)
  const mark = useRef(null)
  const box = useRef(null)
  const apply = useRef((next, animate) => {
    const to = next
      ? { boxW: VIPRE_MARK_W, word: 0, mark: 1 }
      : { boxW: VIPRE_WORD_W, word: 1, mark: 0 }
    if (!animate) {
      gsap.set(box.current, { width: to.boxW })
      gsap.set(word.current, { opacity: to.word })
      gsap.set(mark.current, { opacity: to.mark })
      return
    }
    // Letters lead out, mark leads in — the collapse reads as the words peeling away to
    // leave the mark, not two things dissolving at once.
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    tl.to(box.current, { width: to.boxW, duration: 0.28 }, 0)
      .to(word.current, { opacity: to.word, duration: next ? 0.14 : 0.26 }, 0)
      .to(mark.current, { opacity: to.mark, duration: next ? 0.26 : 0.14 }, 0)
    return () => tl.kill()
  }).current
  useCollapseTween(collapsed, apply)
  return (
    <span ref={box} style={{ position: 'relative', display: 'block', height: LOGO_H, width: VIPRE_WORD_W, overflow: 'hidden', color: 'var(--vds-white)' }}>
      <span ref={word} style={{ display: 'block', width: VIPRE_WORD_W, height: LOGO_H }}>
        {/* width AND height, so the wordmark renders at the same height-20 scale as the
            overlay mark (its default width=90 would shrink it and shorten its mark, making
            the mark grow during the cross-fade instead of holding still). */}
        <VipreWordmark width={VIPRE_WORD_W} height={LOGO_H} style={{ display: 'block' }} />
      </span>
      {/* Overlaid at left:0 so its mark sits exactly over the wordmark's mark. */}
      <span ref={mark} style={{ position: 'absolute', left: 0, top: 0, height: LOGO_H, opacity: 0 }}>
        <VipreMark height={LOGO_H} style={{ display: 'block' }} />
      </span>
    </span>
  )
}

function ResellerLogo({ brand, collapsed }) {
  const M = brand.Mark
  const label = useRef(null)
  const apply = useRef((next, animate) => {
    const to = next ? { opacity: 0, maxWidth: 0, marginLeft: 0 } : { opacity: 1, maxWidth: 160, marginLeft: 9 }
    if (!animate) return void gsap.set(label.current, to)
    const tl = gsap.timeline()
    tl.to(label.current, { ...to, duration: 0.26, ease: 'power2.out' })
    return () => tl.kill()
  }).current
  useCollapseTween(collapsed, apply)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--vds-white)' }}>
      <M width={24} height={24} style={{ display: 'block', flexShrink: 0 }} />
      <span ref={label} style={{ overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 16, fontWeight: 700, letterSpacing: '0.2px' }}>{brand.name}</span>
    </span>
  )
}

export function BrandLogo({ brand, collapsed = false }) {
  return brand.vipre ? <VipreLogo collapsed={collapsed} /> : <ResellerLogo brand={brand} collapsed={collapsed} />
}

/* ---- Header dropdown to pick a reseller theme. Styled for the dark (navy) top strip;
        each row shows a swatch of the brand's accent so the palette is legible. ---- */
export function BrandPicker({ brand, onPick, openUp = false, animated = false }) {
  const [open, setOpen] = useState(false)
  // Opt-in (animated): the menu scales/fades up from the trigger corner and its rows
  // stagger in — driven by CSS (see .brand-menu--anim) so it always completes even if
  // a frame drops. Gated so the frozen v1 / Symphony shells keep their instant menu.
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        title="Switch reseller theme"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', borderRadius: 6,
          border: '1px solid var(--vds-midnight-700)', background: 'var(--vds-midnight-900)',
          color: 'var(--vds-midnight-200)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
        }}>
        <span aria-hidden style={{ width: 12, height: 12, borderRadius: 3, background: brand.accent, flexShrink: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.18)' }} />
        <span style={{ whiteSpace: 'nowrap' }}>{brand.name}</span>
        <ChevronDown size={14} style={{ opacity: 0.6, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
          <div role="menu" className={animated ? 'brand-menu--anim' : undefined} style={{
            // openUp: anchor above the trigger (for a bottom-of-screen FAB, where a
            // downward menu would fall off the viewport).
            position: 'absolute', right: 0, zIndex: 61, minWidth: 224,
            transformOrigin: openUp ? 'bottom right' : 'top right',
            ...(openUp ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
            background: 'var(--vds-midnight-900)', border: '1px solid var(--vds-midnight-700)',
            borderRadius: 10, boxShadow: 'var(--vds-shadow-lg, 0 10px 30px rgba(0,0,0,0.45))', padding: 6,
          }}>
            <p style={{ margin: '4px 8px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '1px', color: 'var(--vds-midnight-400)' }}>RESELLER THEME</p>
            {BRANDS.map((b, i) => {
              const cur = b.id === brand.id
              const M = b.Mark
              return (
                <button key={b.id} type="button" role="menuitemradio" aria-checked={cur}
                  onClick={() => { setOpen(false); if (!cur) onPick(b.id) }}
                  className="ob-brand-item"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 8px', border: 0,
                    borderRadius: 6, background: cur ? 'var(--vds-midnight-800)' : 'transparent', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, color: 'var(--vds-white)', textAlign: 'left',
                    // CSS stagger index (consumed by .brand-menu--anim rows).
                    ...(animated ? { animationDelay: `${0.04 + i * 0.028}s` } : null),
                  }}>
                  <span aria-hidden style={{ width: 14, height: 14, borderRadius: 4, background: b.accent, flexShrink: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.18)' }} />
                  <span aria-hidden style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--vds-white)' }}>
                    {b.vipre ? <VipreMark width={16} /> : <M width={17} height={17} />}
                  </span>
                  <span style={{ flex: 1, fontWeight: cur ? 600 : 400 }}>{b.name}</span>
                  {cur && <Check size={15} style={{ color: b.accent, flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
