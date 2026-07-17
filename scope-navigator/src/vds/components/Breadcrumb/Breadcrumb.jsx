import { forwardRef } from 'react'
import { ChevronRight, MoreHorizontal } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'
import { Popover } from '../Popover/index.js'

/* One crumb: link (href), button (onClick), or plain text (current / inert). */
function Crumb({ item, isCurrent }) {
  const content = (
    <>
      {item.icon && <span className="vds-breadcrumb__icon">{item.icon}</span>}
      <span className="vds-breadcrumb__text">{item.label}</span>
    </>
  )
  if (isCurrent) {
    return (
      <span className="vds-breadcrumb__crumb vds-breadcrumb__crumb--current" aria-current="page">
        {content}
      </span>
    )
  }
  if (item.href) {
    return (
      <a className="vds-breadcrumb__crumb" href={item.href} onClick={item.onClick}>
        {content}
      </a>
    )
  }
  if (item.onClick) {
    return (
      <button type="button" className="vds-breadcrumb__crumb" onClick={item.onClick}>
        {content}
      </button>
    )
  }
  return <span className="vds-breadcrumb__crumb vds-breadcrumb__crumb--inert">{content}</span>
}

/**
 * Breadcrumb
 *
 * The "where am I" trail. Pass the path as data; the last item is the current
 * page (rendered as text with aria-current="page"), everything before it is a
 * link or button. Long trails collapse: when there are more than `maxItems`
 * crumbs, the middle ones fold into a "…" button that opens a Popover menu of
 * the hidden pages.
 *
 * Props:
 * - items:     [{ label, href?, onClick?, icon? }] — first → last = root → current
 * - maxItems:  collapse when the trail is longer than this (default 4;
 *              pass Infinity to never collapse)
 * - separator: node between crumbs (default a chevron)
 * - all native <nav> attributes
 *
 * Responsive: first/middle crumbs get a max-width and truncate with an
 * ellipsis; the cap tightens on narrow screens so the current page keeps room.
 *
 * Accessibility:
 * - <nav aria-label="Breadcrumb"> + an ordered list; separators are
 *   aria-hidden; the current page carries aria-current="page".
 *
 * @example
 * <Breadcrumb
 *   items={[
 *     { label: 'All Accounts', href: '#/accounts' },
 *     { label: 'Meridian MSP', href: '#/accounts/meridian' },
 *     { label: 'Devices' },
 *   ]}
 * />
 */
const ELLIPSIS = Symbol('ellipsis')

export const Breadcrumb = forwardRef(function Breadcrumb(
  { items = [], maxItems = 4, separator, className, ...props },
  ref,
) {
  const sep = separator ?? <Icon as={ChevronRight} size="xs" />

  // Collapse the middle: keep the first crumb + the last (maxItems - 2), and
  // fold everything between into the "…" menu.
  let visible = items
  let hidden = []
  if (items.length > maxItems && maxItems >= 2) {
    const tail = Math.max(1, maxItems - 2)
    hidden = items.slice(1, items.length - tail)
    visible = [items[0], ELLIPSIS, ...items.slice(items.length - tail)]
  }

  return (
    <nav ref={ref} aria-label="Breadcrumb" className={cx('vds-breadcrumb', className)} {...props}>
      <ol className="vds-breadcrumb__list">
        {visible.map((item, i) => (
          <li key={i} className="vds-breadcrumb__item">
            {i > 0 && (
              <span className="vds-breadcrumb__sep" aria-hidden="true">
                {sep}
              </span>
            )}
            {item === ELLIPSIS ? (
              <Popover
                role="menu"
                aria-label="Hidden pages"
                trigger={
                  <button
                    type="button"
                    className="vds-breadcrumb__ellipsis"
                    aria-label={`Show ${hidden.length} hidden pages`}
                  >
                    <Icon as={MoreHorizontal} size="sm" />
                  </button>
                }
              >
                {({ close }) => (
                  <div className="vds-popover__menu">
                    {hidden.map((h, j) =>
                      h.href ? (
                        <a
                          key={j}
                          role="menuitem"
                          className="vds-popover__item"
                          href={h.href}
                          onClick={(e) => {
                            h.onClick?.(e)
                            close()
                          }}
                        >
                          <span className="vds-popover__item-label">{h.label}</span>
                        </a>
                      ) : (
                        <button
                          key={j}
                          type="button"
                          role="menuitem"
                          className="vds-popover__item"
                          onClick={(e) => {
                            h.onClick?.(e)
                            close()
                          }}
                        >
                          <span className="vds-popover__item-label">{h.label}</span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </Popover>
            ) : (
              <Crumb item={item} isCurrent={i === visible.length - 1} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
})

Breadcrumb.displayName = 'Breadcrumb'
