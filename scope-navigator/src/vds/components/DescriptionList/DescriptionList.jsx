import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * DescriptionList.Item
 *
 * One term/description pair. Use it as a child of DescriptionList when the
 * `items` array isn't expressive enough (e.g. a description that needs JSX).
 *
 * Props:
 * - term:     the label (<dt>) — muted
 * - children: the value (<dd>) — ink; any node (Badge, Avatar, links…)
 * - span:     2 | 3 — stretch this pair across grid columns
 * - all native div attributes
 *
 * @example
 * <DescriptionList.Item term="Status"><Badge tone="success" dot>Protected</Badge></DescriptionList.Item>
 */
const DescriptionListItem = forwardRef(function DescriptionListItem(
  { term, span, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx(
        'vds-dl__item',
        span != null && span > 1 && `vds-dl__item--span-${Math.min(span, 3)}`,
        className,
      )}
      {...props}
    >
      <dt className="vds-dl__term">{term}</dt>
      <dd className="vds-dl__desc">{children}</dd>
    </div>
  )
})

DescriptionListItem.displayName = 'DescriptionList.Item'

/**
 * DescriptionList
 *
 * Labeled facts, the metadata workhorse: a real <dl> of term/description
 * pairs for detail panels, drawers, and record summaries. Terms are muted,
 * descriptions are ink, and values can be any node (a Badge, an Avatar, a
 * link). Columns respond to the CONTAINER, not the viewport — a 3-column
 * list dropped into a narrow drawer folds itself back toward one column.
 *
 * Props:
 * - items:       [{ term, description, span? }] — or compose
 *                <DescriptionList.Item> children instead
 * - columns:     1 | 2 | 3 — grid columns in a wide container   (default 1)
 * - orientation: 'vertical' (term above value) | 'horizontal'
 *                (term left, value right)                        (default 'vertical')
 * - divided:     hairline rule under each row                    (default false)
 * - dense:       tighter rhythm for packed side panels           (default false)
 * - all native attributes (spread onto the root)
 *
 * Accessibility:
 * - Renders a real <dl> with <dt>/<dd> pairs, so assistive tech announces
 *   each value with its term. Each pair is wrapped in a <div> (valid HTML,
 *   and it gives the grid its cell).
 * - Layout is purely visual; the reading order always stays term → value.
 *
 * @example
 * <DescriptionList
 *   columns={2}
 *   divided
 *   items={[
 *     { term: 'Hostname', description: 'WKS-0142' },
 *     { term: 'OS', description: 'Windows 11 Pro' },
 *     { term: 'Last seen', description: '2 minutes ago' },
 *     { term: 'Policy', description: 'Ransomware shield', span: 2 },
 *   ]}
 * />
 */
export const DescriptionList = forwardRef(function DescriptionList(
  {
    items,
    columns = 1,
    orientation = 'vertical',
    divided = false,
    dense = false,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx(
        'vds-dl',
        `vds-dl--cols-${columns}`,
        `vds-dl--${orientation}`,
        divided && 'vds-dl--divided',
        dense && 'vds-dl--dense',
        className,
      )}
      {...props}
    >
      <dl className="vds-dl__list">
        {items != null
          ? items.map(({ term, description, span }, i) => (
              <DescriptionListItem key={i} term={term} span={span}>
                {description}
              </DescriptionListItem>
            ))
          : children}
      </dl>
    </div>
  )
})

DescriptionList.displayName = 'DescriptionList'
DescriptionList.Item = DescriptionListItem

export { DescriptionListItem }
