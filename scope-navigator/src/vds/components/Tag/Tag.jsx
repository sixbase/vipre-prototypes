import { forwardRef } from 'react'
import { X } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'

/* Best-effort plain text from children, for the dismiss button's label. */
function textOf(children) {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(textOf).join('')
  return ''
}

/**
 * Tag
 *
 * Badge's bigger, workable sibling: a labeled chip that can be clicked,
 * dismissed, or both. Neutral by default, or any of the categorical accent
 * families (soft tint + matching ink) for grouping — accents carry no
 * good/bad meaning; use Badge's status tones for health.
 *
 * Props:
 * - tone:         'neutral' | 'rose' | 'clay' | 'amber' | 'lime' | 'emerald' |
 *                 'harbor' | 'azure' | 'cobalt' | 'purple' | 'orchid' | 'magenta'
 *                 (default 'neutral')
 * - size:         'sm' | 'md'                      (default 'md')
 * - icon:         leading icon component
 * - onClick:      makes the tag interactive (renders a <button>)
 * - onDismiss:    adds an × button labelled "Remove {text}"
 * - dismissLabel: override the × button's accessible name (needed when
 *                 children aren't plain text)
 * - disabled:     opacity + pointer-events off      (default false)
 * - all native attributes, spread onto the root
 *
 * Accessibility:
 * - The dismiss button gets aria-label "Remove {text}", and a ≥44px hit area
 *   on coarse (touch) pointers even though the glyph stays small.
 * - Clickable + dismissible together render two sibling buttons (never nested),
 *   so both stay keyboard-reachable.
 * - Disabled = opacity 0.5 + pointer-events none, never a new gray.
 *
 * @example
 * <Tag tone="azure">Endpoint</Tag>
 * <Tag tone="emerald" onDismiss={() => remove('EDR')}>EDR</Tag>
 * <Tag icon={Globe} onClick={() => filterBy('EU')}>EU region</Tag>
 */
export const Tag = forwardRef(function Tag(
  {
    tone = 'neutral',
    size = 'md',
    icon,
    onClick,
    onDismiss,
    dismissLabel,
    disabled = false,
    className,
    children,
    ...props
  },
  ref,
) {
  const interactive = typeof onClick === 'function'
  const dismissible = typeof onDismiss === 'function'
  const split = interactive && dismissible

  const rootClass = cx(
    'vds-tag',
    `vds-tag--${tone}`,
    `vds-tag--${size}`,
    interactive && !split && 'vds-tag--interactive',
    split && 'vds-tag--split',
    disabled && 'vds-tag--disabled',
    className,
  )

  const content = (
    <>
      {icon && <Icon as={icon} size="xs" />}
      <span className="vds-tag__label">{children}</span>
    </>
  )

  const removeLabel = dismissLabel ?? `Remove ${textOf(children)}`.trim()
  const dismissBtn = dismissible && (
    <button
      type="button"
      className="vds-tag__dismiss"
      aria-label={removeLabel}
      onClick={onDismiss}
      disabled={disabled}
    >
      <Icon as={X} size="xs" />
    </button>
  )

  // Clickable AND dismissible → two sibling buttons inside a passive shell
  // (a button may not contain a button).
  if (split) {
    return (
      <span ref={ref} className={rootClass} {...props}>
        <button type="button" className="vds-tag__action" onClick={onClick} disabled={disabled}>
          {content}
        </button>
        {dismissBtn}
      </span>
    )
  }

  if (interactive) {
    return (
      <button
        ref={ref}
        type="button"
        className={rootClass}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {content}
      </button>
    )
  }

  return (
    <span ref={ref} className={rootClass} {...props}>
      {content}
      {dismissBtn}
    </span>
  )
})

Tag.displayName = 'Tag'
