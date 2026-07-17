import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'
import { Kbd } from '../Kbd/index.js'
import { Surface } from '../Surface/index.js'

/* Does an item match the query? Checks the label and any keywords. */
function matches(item, q) {
  if (!q) return true
  if (item.label.toLowerCase().includes(q)) return true
  return (item.keywords ?? []).some((k) => k.toLowerCase().includes(q))
}

/**
 * CommandPalette
 *
 * The app-wide search overlay (⌘K). Self-contained: it owns its scrim, panel,
 * focus trap, and scroll lock — no Modal dependency. Fully data-driven: pass
 * grouped items; it filters them client-side across label + keywords as the
 * user types.
 *
 * Props:
 * - open / onOpenChange: controlled visibility (required)
 * - placeholder:  search input placeholder      (default 'Search…')
 * - groups:       [{ id, label, items: [{ id, label, icon?, hint?,
 *                 keywords?, onSelect? }] }]
 * - onSelect:     (item) => void — fired for any pick, after item.onSelect
 * - emptyMessage: shown when nothing matches    (default 'No results found.')
 * - footer:       custom footer node (default: Kbd hints — ↑↓ navigate ·
 *                 ↵ select · esc close)
 * - all native attributes spread onto the panel
 *
 * Behavior:
 * - Autofocuses the search input; focus is trapped there (combobox pattern —
 *   the list is driven by aria-activedescendant, not Tab stops).
 * - ↑/↓ move the highlight (scrolled into view), Home/End jump, Enter selects,
 *   Escape closes. Selecting or closing returns focus to where it was.
 * - Locks body scroll while open.
 *
 * Styling: Surface overlay at --vds-z-modal, top-aligned (~15vh) on desktop;
 * below the `sm` breakpoint it goes full-screen.
 *
 * @example
 * <CommandPalette
 *   open={open}
 *   onOpenChange={setOpen}
 *   placeholder="Search customers, devices, actions…"
 *   groups={[{ id: 'nav', label: 'Go to', items: [
 *     { id: 'devices', label: 'Devices', hint: 'G D', keywords: ['endpoints'],
 *       onSelect: () => navigate('/devices') },
 *   ]}]}
 * />
 */
export const CommandPalette = forwardRef(function CommandPalette(
  {
    open,
    onOpenChange,
    placeholder = 'Search…',
    groups = [],
    onSelect,
    emptyMessage = 'No results found.',
    footer,
    className,
    ...props
  },
  ref,
) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const returnFocusRef = useRef(null)
  const baseId = useId()
  const listId = `${baseId}-list`
  const optionId = (item) => `${baseId}-opt-${item.id}`

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, items: g.items.filter((it) => matches(it, q)) }))
        .filter((g) => g.items.length > 0),
    [groups, q],
  )
  const flat = useMemo(() => filtered.flatMap((g) => g.items), [filtered])

  const close = useCallback(() => onOpenChange?.(false), [onOpenChange])

  const select = useCallback(
    (item) => {
      item.onSelect?.(item)
      onSelect?.(item)
      close()
    },
    [onSelect, close],
  )

  // Reset + focus + scroll lock + focus return, per open/close.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    returnFocusRef.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      document.body.style.overflow = prevOverflow
      returnFocusRef.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  // Keep the highlight in range as the results change.
  useEffect(() => {
    setActive(0)
  }, [q])

  // Keep the highlighted option visible.
  useEffect(() => {
    if (!open || !flat[active]) return
    document.getElementById(optionId(flat[active]))?.scrollIntoView({ block: 'nearest' })
  }, [open, active, flat]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const onKeyDown = (e) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(i + 1, flat.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        if (e.target.selectionStart === 0) setActive(0)
        break
      case 'End':
        if (e.target.selectionStart === e.target.value.length) setActive(flat.length - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (flat[active]) select(flat[active])
        break
      case 'Tab':
        e.preventDefault() // focus trap: the input is the only tab stop
        break
      default:
    }
  }

  return (
    <div className="vds-command" onKeyDown={onKeyDown}>
      <div className="vds-command__scrim" onMouseDown={close} />
      <Surface
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={placeholder}
        elevation="overlay"
        padding={null}
        radius="lg"
        className={cx('vds-command__panel', className)}
        {...props}
      >
        <div className="vds-command__search">
          <Icon as={Search} size="sm" tone="subtle" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={flat[active] ? optionId(flat[active]) : undefined}
            aria-autocomplete="list"
            aria-label={placeholder}
            className="vds-command__input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Kbd size="sm" aria-hidden="true">
            esc
          </Kbd>
        </div>

        <div className="vds-command__list" role="listbox" id={listId} aria-label="Results">
          {flat.length === 0 ? (
            <div className="vds-command__empty">{emptyMessage}</div>
          ) : (
            filtered.map((group) => (
              <div key={group.id} role="group" aria-label={group.label} className="vds-command__group">
                {group.label && (
                  <div className="vds-command__group-label" aria-hidden="true">
                    {group.label}
                  </div>
                )}
                {group.items.map((item) => {
                  const index = flat.indexOf(item)
                  const isActive = index === active
                  return (
                    <div
                      key={item.id}
                      id={optionId(item)}
                      role="option"
                      aria-selected={isActive}
                      className={cx('vds-command__item', isActive && 'vds-command__item--active')}
                      onMouseEnter={() => setActive(index)}
                      onMouseDown={(e) => e.preventDefault()} // keep focus in the input
                      onClick={() => select(item)}
                    >
                      {item.icon && <span className="vds-command__item-icon">{item.icon}</span>}
                      <span className="vds-command__item-label">{item.label}</span>
                      {item.hint && <span className="vds-command__item-hint">{item.hint}</span>}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="vds-command__footer">
          {footer ?? (
            <>
              <span className="vds-command__hint">
                <Kbd size="sm" aria-label="Up arrow">↑</Kbd>
                <Kbd size="sm" aria-label="Down arrow">↓</Kbd> navigate
              </span>
              <span className="vds-command__hint">
                <Kbd size="sm" aria-label="Enter">↵</Kbd> select
              </span>
              <span className="vds-command__hint">
                <Kbd size="sm">esc</Kbd> close
              </span>
            </>
          )}
        </div>
      </Surface>
    </div>
  )
})

CommandPalette.displayName = 'CommandPalette'
