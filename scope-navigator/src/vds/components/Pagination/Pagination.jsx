import { forwardRef } from 'react'
import { ChevronRight } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'

const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i)
const DOTS = 'dots'

/* The list of page items to render: numbers plus 'dots' gap markers. */
function paginationRange(page, pageCount, siblingCount, showEdges) {
  if (!showEdges) {
    // Just the sliding window around the current page.
    const start = Math.max(1, page - siblingCount)
    const end = Math.min(pageCount, page + siblingCount)
    return [
      ...(start > 1 ? [DOTS] : []),
      ...range(start, end),
      ...(end < pageCount ? [DOTS] : []),
    ]
  }
  // First + last always visible; dots only when they actually hide something.
  const totalNumbers = siblingCount * 2 + 3 // siblings + current + first + last
  if (pageCount <= totalNumbers + 2) return range(1, pageCount)

  const showLeftDots = page - siblingCount > 2
  const showRightDots = page + siblingCount < pageCount - 1

  if (!showLeftDots && showRightDots) {
    return [...range(1, totalNumbers), DOTS, pageCount]
  }
  if (showLeftDots && !showRightDots) {
    return [1, DOTS, ...range(pageCount - totalNumbers + 1, pageCount)]
  }
  return [1, DOTS, ...range(page - siblingCount, page + siblingCount), DOTS, pageCount]
}

/**
 * Pagination
 *
 * Prev/next plus numbered page buttons with "…" gaps. You own the state:
 * pass `page` and handle `onPageChange`.
 *
 * Props:
 * - page:         current page (1-based, required)
 * - pageCount:    total pages (required)
 * - onPageChange: (page) => void
 * - siblingCount: numbers shown on each side of the current page (default 1)
 * - size:         'sm' | 'md'   (default 'md')
 * - showEdges:    keep page 1 and the last page always visible (default true)
 * - compact:      force the compact "Page 3 of 12" form at every width
 *                 (default false)
 * - all native <nav> attributes
 *
 * Responsive: below the `sm` breakpoint the number buttons hide automatically
 * (via media query — no JS) and a "Page 3 of 12" readout shows between
 * prev/next. `compact` forces that form everywhere. Touch targets grow to
 * --vds-tap-target on coarse pointers.
 *
 * Accessibility:
 * - <nav aria-label="Pagination">; every button has an aria-label; the
 *   current page carries aria-current="page".
 *
 * @example
 * <Pagination page={page} pageCount={12} onPageChange={setPage} />
 */
export const Pagination = forwardRef(function Pagination(
  {
    page,
    pageCount,
    onPageChange,
    siblingCount = 1,
    size = 'md',
    showEdges = true,
    compact = false,
    className,
    ...props
  },
  ref,
) {
  const items = paginationRange(page, pageCount, siblingCount, showEdges)
  const go = (p) => {
    if (p >= 1 && p <= pageCount && p !== page) onPageChange?.(p)
  }

  return (
    <nav
      ref={ref}
      aria-label="Pagination"
      className={cx(
        'vds-pagination',
        `vds-pagination--${size}`,
        compact && 'vds-pagination--compact',
        className,
      )}
      {...props}
    >
      <button
        type="button"
        className="vds-pagination__btn vds-pagination__btn--prev"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        <Icon as={ChevronRight} size="sm" />
      </button>

      <ul className="vds-pagination__pages">
        {items.map((item, i) =>
          item === DOTS ? (
            <li key={`dots-${i}`} className="vds-pagination__item">
              <span className="vds-pagination__gap" aria-hidden="true">
                …
              </span>
            </li>
          ) : (
            <li key={item} className="vds-pagination__item">
              <button
                type="button"
                className="vds-pagination__btn vds-pagination__btn--page"
                aria-label={item === page ? `Page ${item}` : `Go to page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => go(item)}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      {/* Compact readout — swapped in for the numbers below `sm` (or always
          with the `compact` prop). aria-hidden: the buttons' labels already
          tell AT where it is. */}
      <span className="vds-pagination__status" aria-hidden="true">
        Page {page} of {pageCount}
      </span>

      <button
        type="button"
        className="vds-pagination__btn vds-pagination__btn--next"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => go(page + 1)}
      >
        <Icon as={ChevronRight} size="sm" />
      </button>
    </nav>
  )
})

Pagination.displayName = 'Pagination'
