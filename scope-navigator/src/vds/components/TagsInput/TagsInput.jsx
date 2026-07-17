import { forwardRef, useRef, useState } from 'react'
import { cx } from '../../lib/cx.js'
import { Tag } from '../Tag/index.js'

/**
 * TagsInput
 *
 * A multi-value field: committed values render as dismissible Tag chips
 * followed by a borderless text input that grows to fill the row. Enter or
 * comma commits the typed text; Backspace on an empty input removes the last
 * chip. Duplicates and blanks are skipped; `max` and `validate` gate additions.
 *
 * Props:
 * - value:        controlled string[]
 * - defaultValue: uncontrolled initial string[]        (default [])
 * - onChange:     (string[]) => void
 * - placeholder:  input placeholder                    (default 'Add a tag…')
 * - disabled:     opacity 0.5 + pointer-events none     (default false)
 * - size:         'sm' | 'md' | 'lg'                    (default 'md')
 * - max:          cap the number of chips
 * - validate:     (value: string) => boolean — reject when it returns false
 * - all native attributes, spread onto the root
 *
 * Accessibility:
 * - The shell is role="group" with an aria-label; clicking anywhere in it
 *   focuses the input. Each chip's remove button is labelled "Remove {tag}"
 *   (from Tag). A polite live region announces adds and removes.
 *
 * @example
 * <TagsInput defaultValue={['edr', 'siem']} onChange={setTags} max={8} />
 */
export const TagsInput = forwardRef(function TagsInput(
  {
    value,
    defaultValue = [],
    onChange,
    placeholder = 'Add a tag…',
    disabled = false,
    size = 'md',
    max,
    validate,
    className,
    'aria-label': groupLabel = 'Tags',
    ...props
  },
  ref,
) {
  const isControlled = value != null
  const [inner, setInner] = useState(defaultValue)
  const tags = isControlled ? value : inner
  const [draft, setDraft] = useState('')
  const [announce, setAnnounce] = useState('')
  const inputRef = useRef(null)

  const setInputRef = (node) => {
    inputRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  const setTags = (next) => {
    if (!isControlled) setInner(next)
    onChange?.(next)
  }

  const addTag = (rawValue) => {
    const t = rawValue.trim()
    if (!t) return
    setDraft('')
    if (tags.includes(t)) return
    if (max != null && tags.length >= max) return
    if (typeof validate === 'function' && !validate(t)) return
    setTags([...tags, t])
    setAnnounce(`Added ${t}`)
  }

  const removeAt = (i) => {
    const removed = tags[i]
    setTags(tags.filter((_, idx) => idx !== i))
    setAnnounce(`Removed ${removed}`)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && tags.length) {
      e.preventDefault()
      removeAt(tags.length - 1)
    }
  }

  const focusInput = () => {
    if (!disabled) inputRef.current?.focus()
  }

  // Chip size tracks the field size — the big field gets md chips, the rest sm.
  const tagSize = size === 'lg' ? 'md' : 'sm'

  return (
    <div
      className={cx('vds-tags', `vds-tags--${size}`, disabled && 'vds-tags--disabled', className)}
      role="group"
      aria-label={groupLabel}
      onClick={focusInput}
      {...props}
    >
      {tags.map((t, i) => (
        <Tag
          key={t}
          size={tagSize}
          className="vds-tags__tag"
          onDismiss={disabled ? undefined : () => removeAt(i)}
        >
          {t}
        </Tag>
      ))}
      <input
        ref={setInputRef}
        className="vds-tags__input"
        value={draft}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={groupLabel}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <span className="vds-visually-hidden" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  )
})

TagsInput.displayName = 'TagsInput'
