import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Check, X } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/Icon.jsx'
import { Input } from '../Input/Input.jsx'
import { Popover } from '../Popover/Popover.jsx'

/* Merge a forwarded ref with a local one (both point at the <input>). */
function mergeRefs(...refs) {
  return (node) => {
    for (const r of refs) {
      if (!r) continue
      if (typeof r === 'function') r(node)
      else r.current = node
    }
  }
}

/* Default option filter: case-insensitive substring match on the label. */
function defaultFilter(option, query) {
  return String(option.label).toLowerCase().includes(query.trim().toLowerCase())
}

/**
 * Combobox
 *
 * A searchable single-select: an Input you type into, with a filtered option
 * list floating below it. Composed on the same two primitives as Select —
 * Input supplies the field chrome, Popover supplies the anchored panel that
 * flips, clamps to the viewport (down to 320px screens), and dismisses on
 * outside click / Escape. Options render as the canonical Popover menu items,
 * so every dropdown in the system keeps one look.
 *
 * Focus stays in the input the whole time (ARIA combobox pattern): the list
 * highlight is a virtual cursor driven by aria-activedescendant, not real focus.
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 * `onChange` receives the chosen option's `value` (or null after clearing).
 *
 * Props:
 * - options:      [{ value, label, description?, icon?, disabled? }]
 * - value:        controlled selected value
 * - defaultValue: uncontrolled initial value
 * - onChange:     (value) => void — null when cleared
 * - placeholder:  input placeholder            (default 'Search…')
 * - size:         'sm' | 'md' | 'lg'           (default 'md')
 * - invalid:      boolean — danger border + aria-invalid   (default false)
 * - disabled:     boolean
 * - clearable:    show an × that clears the selection      (default false)
 * - emptyMessage: shown when nothing matches   (default 'No matches')
 * - filter:       (option, query) => boolean — replace the label-substring default
 * - placement:    Popover placement            (default 'bottom-start')
 *
 * Keyboard: type to filter; ArrowDown/ArrowUp open the list and move the
 * highlight; Enter selects; Escape closes; blur closes and restores the
 * selected label.
 *
 * Accessibility:
 * - The input is role="combobox" with aria-expanded / aria-controls /
 *   aria-activedescendant; the panel is role="listbox" with role="option" rows.
 * - Pair with a <label> / Field, or pass aria-label.
 *
 * @example
 * <Combobox
 *   options={[
 *     { value: 'us-east', label: 'US East', description: 'Virginia' },
 *     { value: 'eu-west', label: 'EU West', description: 'Ireland' },
 *   ]}
 *   placeholder="Pick a region…"
 *   onChange={setRegion}
 * />
 */
export const Combobox = forwardRef(function Combobox(
  {
    options = [],
    value,
    defaultValue,
    onChange,
    placeholder = 'Search…',
    size = 'md',
    invalid = false,
    disabled = false,
    clearable = false,
    emptyMessage = 'No matches',
    filter = defaultFilter,
    placement = 'bottom-start',
    'aria-label': ariaLabel,
    className,
    ...props
  },
  ref,
) {
  const baseId = useId()
  const listboxId = `vds-cbx${baseId}listbox`
  const optionId = (i) => `vds-cbx${baseId}opt-${i}`

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const selectedValue = isControlled ? value : internalValue
  const current = useMemo(
    () => options.find((o) => o.value === selectedValue),
    [options, selectedValue],
  )

  const [open, setOpen] = useState(false)
  // query === null → "not editing": the input shows the selected label and the
  // list is unfiltered. It becomes a string the moment the user types.
  const [query, setQuery] = useState(null)
  const [highlight, setHighlight] = useState(-1)

  const rootRef = useRef(null)
  const inputRef = useRef(null)

  const filtered = useMemo(() => {
    if (query == null || query === '') return options
    return options.filter((o) => filter(o, query))
  }, [options, query, filter])

  const closeList = () => {
    setOpen(false)
    setQuery(null)
  }

  const select = (opt) => {
    if (!isControlled) setInternalValue(opt.value)
    onChange?.(opt.value)
    closeList()
  }

  const clear = () => {
    if (!isControlled) setInternalValue(undefined)
    onChange?.(null)
    setQuery(null)
    inputRef.current?.focus()
  }

  // Keep the highlight on a real, enabled row whenever the list opens or the
  // filter changes: prefer the selected option, else the first enabled one.
  useEffect(() => {
    if (!open) {
      setHighlight(-1)
      return
    }
    setHighlight((h) => {
      if (filtered[h] && !filtered[h].disabled) return h
      const selectedIdx = filtered.findIndex((o) => o.value === selectedValue && !o.disabled)
      if (selectedIdx >= 0) return selectedIdx
      return filtered.findIndex((o) => !o.disabled)
    })
  }, [open, filtered, selectedValue])

  // Popover moves focus into its panel on open (right for menus, wrong for a
  // combobox) — pull it straight back to the input. This effect runs after
  // Popover's (child effects fire first), so the input always wins.
  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true })
  }, [open])

  // Keep the highlighted row visible as the virtual cursor moves.
  useEffect(() => {
    if (open && highlight >= 0) {
      document.getElementById(optionId(highlight))?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, highlight]) // eslint-disable-line react-hooks/exhaustive-deps

  const moveHighlight = (dir) => {
    if (filtered.length === 0) return
    let i = highlight
    do {
      i += dir
    } while (i >= 0 && i < filtered.length && filtered[i].disabled)
    if (i >= 0 && i < filtered.length) setHighlight(i)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      else moveHighlight(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) setOpen(true)
      else moveHighlight(-1)
    } else if (e.key === 'Enter') {
      if (open) {
        e.preventDefault()
        const opt = filtered[highlight]
        if (opt && !opt.disabled) select(opt)
      }
    } else if (e.key === 'Home' && open) {
      e.preventDefault()
      setHighlight(filtered.findIndex((o) => !o.disabled))
    } else if (e.key === 'End' && open) {
      e.preventDefault()
      for (let i = filtered.length - 1; i >= 0; i--) {
        if (!filtered[i].disabled) {
          setHighlight(i)
          break
        }
      }
    }
    // Escape while open is handled by Popover (closes; focus stays here).
  }

  const handleBlur = (e) => {
    // Ignore focus moving inside the combobox (e.g. Popover's transient panel
    // focus on open); anything else — Tab away, click elsewhere — closes.
    if (rootRef.current && rootRef.current.contains(e.relatedTarget)) return
    closeList()
  }

  const inputValue = query ?? (current ? String(current.label) : '')
  const showClear = clearable && current != null && !disabled

  const trailing = (
    <span className="vds-combobox__actions">
      {showClear && (
        <button
          type="button"
          className="vds-combobox__clear"
          aria-label="Clear selection"
          // Don't let the click bubble to the anchor — it would toggle the list.
          onClick={(e) => {
            e.stopPropagation()
            clear()
          }}
        >
          <Icon as={X} size="sm" />
        </button>
      )}
      <Icon
        as={ChevronDown}
        size="sm"
        className={cx('vds-combobox__caret', open && 'vds-combobox__caret--open')}
      />
    </span>
  )

  // The anchor div is what Popover measures and toggles — it spans the whole
  // Input shell, so the panel aligns and matches the visible field's width.
  const trigger = (
    <div className="vds-combobox__anchor">
      <Input
        ref={mergeRefs(ref, inputRef)}
        size={size}
        invalid={invalid}
        disabled={disabled}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!open) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && highlight >= 0 ? optionId(highlight) : undefined}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
        trailing={trailing}
        {...props}
      />
    </div>
  )

  return (
    <Popover
      ref={rootRef}
      role="listbox"
      aria-label={ariaLabel}
      placement={placement}
      matchWidth
      open={open}
      onOpenChange={(next) => {
        if (disabled) return
        if (next) setOpen(true)
        else closeList()
      }}
      trigger={trigger}
      className={cx('vds-combobox', disabled && 'vds-combobox--disabled', className)}
      panelClassName="vds-combobox__pop"
      surfaceProps={{ id: listboxId }}
    >
      <div className="vds-popover__menu">
        {filtered.length === 0 ? (
          <div className="vds-combobox__empty">{emptyMessage}</div>
        ) : (
          filtered.map((opt, i) => {
            const active = opt.value === selectedValue
            return (
              <div
                key={String(opt.value)}
                id={optionId(i)}
                role="option"
                aria-selected={active}
                aria-disabled={opt.disabled || undefined}
                className={cx(
                  'vds-popover__item',
                  'vds-combobox__option',
                  active && 'vds-popover__item--active',
                  i === highlight && 'vds-combobox__option--highlighted',
                )}
                // preventDefault keeps focus in the input while clicking rows.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!opt.disabled) select(opt)
                }}
                onMouseMove={() => {
                  if (!opt.disabled && highlight !== i) setHighlight(i)
                }}
              >
                {opt.icon != null && <span className="vds-combobox__option-icon">{opt.icon}</span>}
                <span className="vds-combobox__option-body">
                  <span className="vds-popover__item-label">{opt.label}</span>
                  {opt.description != null && (
                    <span className="vds-combobox__option-desc">{opt.description}</span>
                  )}
                </span>
                {active && <Icon as={Check} size="sm" className="vds-popover__item-check" />}
              </div>
            )
          })
        )}
      </div>
    </Popover>
  )
})

Combobox.displayName = 'Combobox'
