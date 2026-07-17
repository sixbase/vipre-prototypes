import { forwardRef, isValidElement } from 'react'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'

/**
 * EmptyState
 *
 * A centered "nothing here" panel: a big muted icon in a soft ring, a short
 * title, an optional explanation, and the action that fixes it. Use it inside
 * tables, cards, and page bodies when a query returns nothing, a list starts
 * empty, or a filter is too strict.
 *
 * Props:
 * - icon:     icon component (or a rendered node) shown big and muted in a ring
 * - title:    short headline ("No devices yet")
 * - children: the explanation under the title
 * - actions:  node — usually the Button(s) that resolve the emptiness
 * - size:     'sm' | 'md' | 'lg' — padding, ring, and type scale   (default 'md')
 * - inset:    render on a dashed, canvas-tinted well (for placement inside
 *             an existing Surface/Card)                            (default false)
 * - all native div attributes
 *
 * Accessibility:
 * - The title renders as an <h3>; the icon is decorative (aria-hidden).
 * - Keep the fix reachable: put the primary action in `actions`, not only in
 *   a toolbar elsewhere.
 *
 * @example
 * <EmptyState icon={Monitor} title="No devices yet"
 *             actions={<Button>Add a device</Button>}>
 *   Devices appear here after their agent first checks in.
 * </EmptyState>
 */
export const EmptyState = forwardRef(function EmptyState(
  { icon, title, actions, size = 'md', inset = false, className, children, ...props },
  ref,
) {
  const glyphSize = { sm: 'md', md: 'lg', lg: 'lg' }[size] ?? 'lg'
  const iconEl = icon && (isValidElement(icon) ? icon : <Icon as={icon} size={glyphSize} />)

  return (
    <div
      ref={ref}
      className={cx('vds-empty', `vds-empty--${size}`, inset && 'vds-empty--inset', className)}
      {...props}
    >
      {iconEl && (
        <span className="vds-empty__ring" aria-hidden="true">
          {iconEl}
        </span>
      )}
      {title != null && <h3 className="vds-empty__title">{title}</h3>}
      {children != null && <div className="vds-empty__desc">{children}</div>}
      {actions != null && <div className="vds-empty__actions">{actions}</div>}
    </div>
  )
})

EmptyState.displayName = 'EmptyState'
