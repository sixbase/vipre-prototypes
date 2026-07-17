import { Fragment, forwardRef, useId, useState } from 'react'
import { cx } from '../../lib/cx.js'
import { Surface } from '../Surface/Surface.jsx'
import { Checkbox } from '../Checkbox/Checkbox.jsx'

/* Read a row's stable key. `getRowKey` wins; otherwise fall back to row.id,
   then the index (last resort — fine for static data). */
function rowKeyOf(row, index, getRowKey) {
  if (typeof getRowKey === 'function') return getRowKey(row, index)
  if (row != null && row.id != null) return row.id
  return index
}

/* Read a cell's value: a column `render` wins, else the row's value at `key`. */
function cellOf(col, row, index) {
  if (typeof col.render === 'function') return col.render(row, index)
  return row?.[col.key]
}

/* Resolve a column's alignment. An explicit `align` always wins. Otherwise the
   alignment follows the DATA TYPE: numeric columns read best flush-right (the
   digits line up place-by-place, and the header sits over them), everything
   else stays left. Custom-`render` columns can't be sniffed (the output could
   be anything), so they fall back to left unless `align` is set. */
function alignOf(col, data) {
  if (col.align) return col.align
  if (typeof col.render === 'function') return 'left'
  const sample = data.find((row) => row?.[col.key] != null)
  return sample && typeof sample[col.key] === 'number' ? 'right' : 'left'
}

/* Plain-text column label for the responsive mode's data-label attribute.
   Node headers can't live in an attribute, so those fall back to the key. */
function labelOf(col) {
  const header = col.header ?? col.key
  return typeof header === 'string' || typeof header === 'number' ? String(header) : String(col.key)
}

/* The sort glyph — a self-contained caret pair (DS ships no icons). The active
   direction is conveyed by the `--asc`/`--desc` modifier (CSS dims the other). */
function SortGlyph({ direction }) {
  return (
    <span
      className={cx('vds-table__sort', direction && `vds-table__sort--${direction}`)}
      aria-hidden="true"
    >
      <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
        <path className="vds-table__sort-up" d="M4 0L7 4H1L4 0Z" fill="currentColor" />
        <path className="vds-table__sort-down" d="M4 12L1 8H7L4 12Z" fill="currentColor" />
      </svg>
    </span>
  )
}

/* Expand caret — an inline chevron (Table ships no icon deps, like SortGlyph).
   It points right when closed and rotates 90° to point down when its row is
   open; the rotation is driven off the button's aria-expanded in CSS. */
function ExpandGlyph() {
  return (
    <svg
      className="vds-table__expand-glyph"
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      aria-hidden="true"
    >
      <path d="M2 1L6 6L2 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Table
 *
 * A data-driven table: declare `columns`, hand it `data`, and it renders the
 * head + body, owning alignment, density, zebra striping, a sticky header,
 * sortable headers, row selection (composing Checkbox), row-click drill-in, and
 * loading / empty states. Composes Surface for the bordered, rounded shell.
 *
 * Column shape: { key, header, align?, width?, render?, sortable?, className?, headerClassName? }
 * - key:    row property to read (and the sort key)
 * - header: column label (defaults to the key)
 * - align:  'left' | 'center' | 'right'  — omit to auto-align by data type
 *           (numeric columns go right, everything else left)
 * - width:  any CSS width (e.g. '120px', '20%')
 * - render: (row, index) => node  — custom cell (badges, links, actions…)
 * - sortable: mark the header clickable (sorting itself is controlled — see below)
 *
 * Sorting is controlled: pass `sort={{ key, direction }}` for the indicator and
 * `onSortChange` to react. Clicking a sortable header toggles its direction (or
 * starts at 'asc' on a new column); you sort `data` yourself in response.
 *
 * Selection is controlled: pass `selectedKeys` + `onSelectionChange`. The header
 * checkbox toggles the whole page (indeterminate when partial).
 *
 * Props:
 * - columns:     column[]  (required)
 * - data:        row[]     (required)
 * - getRowKey:   (row, i) => key   — defaults to row.id, then the index
 * - density:     'comfortable' (default) | 'compact'
 * - zebra:       striped rows                    (default false)
 * - stickyHeader: header stays put while the body scrolls (pair with `maxHeight`)
 * - maxHeight:   CSS max-height for the scroll body (enables vertical scroll)
 * - minWidth:    CSS min-width for the table — below it the shell scrolls
 *                horizontally instead of crushing columns (responsive default)
 * - responsive:  opt-in stacked mode — below ~640px of the TABLE'S own width
 *                (container query) rows render as labelled cards: the header
 *                row hides visually (kept for assistive tech) and each cell
 *                shows its column header as an inline label. Selection and
 *                row-click keep working. Column labels come from `header`
 *                when it's a string (node headers fall back to the key).
 *                Default off — the classic grid is unchanged.  (default false)
 * - sort:        { key, direction: 'asc' | 'desc' }   — controlled sort indicator
 * - onSortChange: (next: { key, direction }) => void
 * - selectable:  show the selection column          (default false)
 * - selectedKeys: array | Set of selected row keys
 * - onSelectionChange: (keys[]) => void
 * - onRowClick:  (row, index) => void  — makes rows interactive (hover + keyboard)
 * - renderDetail: (row, index) => node — when set, every row gets a leading
 *                expand caret that reveals this node in a full-width detail row
 *                beneath it. This is how you keep dense rows compact: the row
 *                stays a one-line summary, the verbose breakdown lives in the
 *                drawer. Pairs with `expandedKeys`/`onExpandedChange` (controlled)
 *                or `defaultExpandedKeys` (uncontrolled — the common case).
 * - expandedKeys / defaultExpandedKeys / onExpandedChange: which rows are open.
 * - loading:     show skeleton rows                 (default false)
 * - skeletonRows: how many while loading            (default 5)
 * - empty:       node shown when data is empty      (default 'No data')
 * - caption:     accessible <caption> (visually hidden) describing the table
 * - all Surface props pass through (radius, elevation, bordered, raised, as…)
 *
 * @example
 * <Table
 *   columns={[
 *     { key: 'name', header: 'Device' },
 *     { key: 'status', header: 'Status', render: (r) => <Badge tone={r.tone} dot>{r.status}</Badge> },
 *     { key: 'seen', header: 'Last seen', align: 'right', sortable: true },
 *   ]}
 *   data={devices}
 *   sort={sort}
 *   onSortChange={setSort}
 * />
 */
export const Table = forwardRef(function Table(
  {
    columns = [],
    data = [],
    getRowKey,
    density = 'comfortable',
    zebra = false,
    stickyHeader = false,
    maxHeight,
    minWidth,
    responsive = false,
    sort,
    onSortChange,
    selectable = false,
    selectedKeys,
    onSelectionChange,
    onRowClick,
    renderDetail,
    expandedKeys,
    defaultExpandedKeys,
    onExpandedChange,
    loading = false,
    skeletonRows = 5,
    empty = 'No data',
    caption,
    radius,
    className,
    ...props
  },
  ref,
) {
  const captionId = useId()
  const detailBaseId = useId()
  const interactiveRows = typeof onRowClick === 'function'
  const expandable = typeof renderDetail === 'function'
  const totalCols = columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0)

  // Expanded set — controlled via `expandedKeys`, else internal state seeded by
  // `defaultExpandedKeys`. Mirrors Popover's open/defaultOpen split: expansion
  // is purely presentational, so uncontrolled is the common case.
  const isExpandControlled = expandedKeys != null
  const [expandedState, setExpandedState] = useState(() => new Set(defaultExpandedKeys ?? []))
  const expandedSet = isExpandControlled
    ? expandedKeys instanceof Set
      ? expandedKeys
      : new Set(expandedKeys)
    : expandedState

  const toggleExpand = (key) => {
    const next = new Set(expandedSet)
    next.has(key) ? next.delete(key) : next.add(key)
    if (!isExpandControlled) setExpandedState(next)
    onExpandedChange?.([...next])
  }

  // Selection set (accepts an array or a Set). Plain code — no per-row state.
  const selected = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys ?? [])
  const allKeys = data.map((row, i) => rowKeyOf(row, i, getRowKey))
  const selectedCount = allKeys.filter((k) => selected.has(k)).length
  const allSelected = data.length > 0 && selectedCount === data.length
  const someSelected = selectedCount > 0 && !allSelected

  const emitSelection = (next) => onSelectionChange?.([...next])

  const toggleAll = () => {
    if (!onSelectionChange) return
    emitSelection(allSelected ? new Set() : new Set(allKeys))
  }

  const toggleRow = (key) => {
    if (!onSelectionChange) return
    const next = new Set(selected)
    next.has(key) ? next.delete(key) : next.add(key)
    emitSelection(next)
  }

  const handleSort = (col) => {
    if (!col.sortable || !onSortChange) return
    const isActive = sort?.key === col.key
    const direction = isActive && sort?.direction === 'asc' ? 'desc' : 'asc'
    onSortChange({ key: col.key, direction })
  }

  const headerCell = (col) => {
    const active = sort?.key === col.key
    const dir = active ? sort.direction : undefined
    const content = col.header ?? col.key
    return (
      <th
        key={col.key}
        scope="col"
        style={col.width ? { width: col.width } : undefined}
        aria-sort={col.sortable ? (active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
        className={cx(
          'vds-table__th',
          `vds-table__cell--${alignOf(col, data)}`,
          col.sortable && 'vds-table__th--sortable',
          active && 'vds-table__th--active',
          col.headerClassName,
        )}
      >
        {col.sortable && onSortChange ? (
          <button type="button" className="vds-table__sort-btn" onClick={() => handleSort(col)}>
            <span>{content}</span>
            <SortGlyph direction={dir} />
          </button>
        ) : (
          content
        )}
      </th>
    )
  }

  const bodyRows = () => {
    if (loading) {
      return Array.from({ length: skeletonRows }).map((_, i) => (
        <tr key={`sk-${i}`} className="vds-table__row vds-table__row--skeleton">
          {expandable && <td className="vds-table__td vds-table__cell--expand" />}
          {selectable && (
            <td className="vds-table__td vds-table__cell--select">
              <span
                className="vds-table__skeleton"
                style={{ width: 'var(--vds-space-4)' }}
                aria-hidden="true"
              />
            </td>
          )}
          {columns.map((col) => (
            <td
              key={col.key}
              data-label={responsive ? labelOf(col) : undefined}
              className={cx('vds-table__td', `vds-table__cell--${alignOf(col, data)}`)}
            >
              <span className="vds-table__skeleton" aria-hidden="true" />
            </td>
          ))}
        </tr>
      ))
    }

    if (data.length === 0) {
      return (
        <tr className="vds-table__row vds-table__row--empty">
          <td className="vds-table__td vds-table__empty" colSpan={totalCols}>
            {empty}
          </td>
        </tr>
      )
    }

    return data.map((row, i) => {
      const key = rowKeyOf(row, i, getRowKey)
      const isSelected = selected.has(key)
      const isExpanded = expandable && expandedSet.has(key)
      const detailId = `${detailBaseId}-${i}`
      return (
        <Fragment key={key}>
          <tr
            className={cx(
              'vds-table__row',
              interactiveRows && 'vds-table__row--interactive',
              isSelected && 'vds-table__row--selected',
              isExpanded && 'vds-table__row--expanded',
            )}
            aria-selected={selectable ? isSelected : undefined}
            onClick={interactiveRows ? () => onRowClick(row, i) : undefined}
            onKeyDown={
              interactiveRows
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(row, i)
                    }
                  }
                : undefined
            }
            tabIndex={interactiveRows ? 0 : undefined}
            role={interactiveRows ? 'button' : undefined}
          >
            {expandable && (
              // Stop propagation so the caret never fires the row's onClick.
              <td
                className="vds-table__td vds-table__cell--expand"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="vds-table__expand-btn"
                  aria-expanded={isExpanded}
                  aria-controls={isExpanded ? detailId : undefined}
                  aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                  onClick={() => toggleExpand(key)}
                >
                  <ExpandGlyph />
                </button>
              </td>
            )}
            {selectable && (
              // Stop propagation so toggling the box never fires the row's onClick.
              <td
                className="vds-table__td vds-table__cell--select"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => toggleRow(key)}
                  aria-label={`Select row ${i + 1}`}
                />
              </td>
            )}
            {columns.map((col) => (
              <td
                key={col.key}
                data-label={responsive ? labelOf(col) : undefined}
                className={cx('vds-table__td', `vds-table__cell--${alignOf(col, data)}`, col.className)}
              >
                {cellOf(col, row, i)}
              </td>
            ))}
          </tr>
          {isExpanded && (
            <tr className="vds-table__row vds-table__row--detail">
              <td className="vds-table__td vds-table__detail" colSpan={totalCols} id={detailId}>
                {renderDetail(row, i)}
              </td>
            </tr>
          )}
        </Fragment>
      )
    })
  }

  return (
    <Surface
      ref={ref}
      padding={null}
      // Default: let the table's own 6px corner apply (no Surface radius class).
      // Pass `radius` to opt into a token step instead.
      radius={radius ?? null}
      className={cx(
        'vds-table',
        `vds-table--${density}`,
        zebra && 'vds-table--zebra',
        stickyHeader && 'vds-table--sticky',
        responsive && 'vds-table--responsive',
        interactiveRows && 'vds-table--row-interactive',
        className,
      )}
      {...props}
    >
      <div
        className="vds-table__scroll"
        style={maxHeight != null ? { maxHeight, overflowY: 'auto' } : undefined}
      >
        <table
          className="vds-table__el"
          style={minWidth != null ? { minWidth } : undefined}
          aria-describedby={caption ? captionId : undefined}
        >
          {caption && (
            <caption id={captionId} className="vds-table__caption">
              {caption}
            </caption>
          )}
          <thead className="vds-table__head">
            <tr>
              {expandable && <th scope="col" className="vds-table__th vds-table__cell--expand" />}
              {selectable && (
                <th scope="col" className="vds-table__th vds-table__cell--select">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map(headerCell)}
            </tr>
          </thead>
          <tbody className="vds-table__body">{bodyRows()}</tbody>
        </table>
      </div>
    </Surface>
  )
})

Table.displayName = 'Table'
