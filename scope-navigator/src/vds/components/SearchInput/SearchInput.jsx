import { forwardRef, useRef, useState } from 'react'
import { Search, X } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/Icon.jsx'
import { Input } from '../Input/Input.jsx'
import { Spinner } from '../Spinner/Spinner.jsx'

/* Merge the forwarded ref with the local one (both point at the <input>). */
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
 * SearchInput
 *
 * A search field composed on Input: leading search icon (a spinner while
 * `loading`), a clear button that appears once there's text, and Escape to
 * clear. Uses type="search" semantics but suppresses the browser's native
 * cancel button in favour of ours, so it looks the same everywhere.
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 * `onChange` receives the STRING, not the event.
 *
 * Props:
 * - value / defaultValue: controlled / uncontrolled text
 * - onChange:     (value, event?) => void — clearing calls onChange('')
 * - onClear:      called after the field is cleared (button or Escape)
 * - loading:      spinner replaces the search icon
 * - shortcutHint: e.g. "⌘K" — chip shown while empty and unfocused
 * - size:         'sm' | 'md' | 'lg'   (default 'md')
 * - placeholder:  default 'Search…'
 * - all other native <input> attributes
 *
 * Accessibility:
 * - aria-label defaults to 'Search' — override it, or wrap in a Field and
 *   pass aria-label={undefined} so the visible label names it instead.
 * - Escape clears only when there's text (and stops there); otherwise the
 *   key bubbles on, so an enclosing dialog can still close.
 *
 * @example
 * <SearchInput shortcutHint="⌘K" onChange={setQuery} />
 */
export const SearchInput = forwardRef(function SearchInput(
  {
    value,
    defaultValue,
    onChange,
    onClear,
    loading = false,
    shortcutHint,
    size = 'md',
    placeholder = 'Search…',
    'aria-label': ariaLabel = 'Search',
    className,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
  },
  ref,
) {
  const innerRef = useRef(null)
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const [focused, setFocused] = useState(false)
  const current = isControlled ? value : internalValue
  const hasText = String(current ?? '').length > 0

  const handleChange = (e) => {
    if (!isControlled) setInternalValue(e.target.value)
    onChange?.(e.target.value, e)
  }

  const clear = () => {
    if (!isControlled) setInternalValue('')
    onChange?.('')
    onClear?.()
    innerRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    // Escape clears — but only when there's something to clear, so an empty
    // field still lets Escape bubble (e.g. to close a surrounding dialog).
    if (e.key === 'Escape' && hasText) {
      e.stopPropagation()
      clear()
    }
    onKeyDown?.(e)
  }

  const trailing = hasText ? (
    <button
      type="button"
      className="vds-search-input__clear"
      aria-label="Clear search"
      onClick={clear}
    >
      <Icon as={X} size="sm" />
    </button>
  ) : shortcutHint && !focused ? (
    <kbd className="vds-search-input__hint" aria-hidden="true">
      {shortcutHint}
    </kbd>
  ) : null

  return (
    <Input
      ref={mergeRefs(ref, innerRef)}
      type="search"
      className={cx('vds-search-input', className)}
      size={size}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={current}
      onChange={handleChange}
      onFocus={(e) => {
        setFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        onBlur?.(e)
      }}
      onKeyDown={handleKeyDown}
      leading={loading ? <Spinner size="sm" label="Searching" /> : <Icon as={Search} size="sm" />}
      trailing={trailing}
      {...props}
    />
  )
})

SearchInput.displayName = 'SearchInput'
