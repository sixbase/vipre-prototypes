import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'
import { Popover } from '../Popover/index.js'

/* ----------------------------------------------------------------------------
   Vanilla Date math — no library. Every helper takes explicit args and never
   reads the clock, so it is deterministic and safe at module scope. The only
   clock read (`new Date()` for "today") lives inside the component, in a lazy
   state initializer — never at module scope (that breaks the build sandbox).
   Weeks start on Sunday.
   -------------------------------------------------------------------------- */
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function isSameDay(a, b) {
  return (
    !!a && !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
/* The 6×7 = 42 cells covering `month`, padded from the Sunday before the 1st. */
function buildGrid(year, month) {
  const first = new Date(year, month, 1)
  const gridStart = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
  )
}
const monthOf = (d) => ({ year: d.getFullYear(), month: d.getMonth() })
const defaultFormat = (d) => d.toLocaleDateString()

/**
 * DatePicker
 *
 * An Input-style trigger that opens a month-grid calendar in a Popover — so
 * placement, outside-click, Escape, and focus-return all come from the shared
 * overlay primitive. The month grid is computed with plain Date math (no date
 * library); weeks start on Sunday. The trigger reuses Input's chrome tokens so
 * it reads as a form control, and the calendar paints selection with the brand
 * accent (`--vds-primary`) and marks today with a ring.
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 * `onChange` receives a `Date` (or `null` — never fired here, kept for parity).
 *
 * Props:
 * - value / defaultValue: Date | null
 * - onChange:     (date: Date | null) => void
 * - min / max:    Date — days outside the range are disabled
 * - size:         'xs' | 'sm' | 'md' | 'lg' | 'xl'   (default 'md')
 * - invalid:      boolean — danger border + aria-invalid   (default false)
 * - disabled:     boolean
 * - placeholder:  shown on the trigger when nothing is selected (default 'Select date')
 * - format:       (date) => string — how the chosen date reads (default toLocaleDateString)
 *
 * Accessibility:
 * - Trigger is a button with aria-haspopup="dialog"; the panel is role="dialog".
 * - The day grid is role="grid" with role="row" weeks and role="gridcell"
 *   day buttons carrying aria-selected + a full-date aria-label.
 * - Keyboard: arrows move by day, PageUp/PageDown by month, Enter/Space select,
 *   Escape closes (Popover returns focus to the trigger).
 *
 * @example
 * <DatePicker defaultValue={null} onChange={setDate} placeholder="Pick a day" />
 */
export const DatePicker = forwardRef(function DatePicker(
  {
    value,
    defaultValue = null,
    onChange,
    min,
    max,
    size = 'md',
    invalid = false,
    disabled = false,
    placeholder = 'Select date',
    format = defaultFormat,
    placement = 'bottom-start',
    'aria-label': ariaLabel,
    className,
    ...props
  },
  ref,
) {
  const isControlled = value !== undefined
  const [internal, setInternal] = useState(defaultValue)
  const selected = isControlled ? value : internal

  // "today" — read the clock once, inside the component (never at module scope).
  const [today] = useState(() => startOfDay(new Date()))
  const base = selected ?? today
  const [view, setView] = useState(() => monthOf(base))
  const [focusDate, setFocusDate] = useState(() => startOfDay(base))

  const gridRef = useRef(null)
  const pendingFocus = useRef(false)

  const minDay = min ? startOfDay(min) : null
  const maxDay = max ? startOfDay(max) : null
  const isDisabledDay = useCallback(
    (d) => (minDay && d < minDay) || (maxDay && d > maxDay),
    [minDay, maxDay],
  )

  // After a keyboard move, shift DOM focus onto the newly-focused day button.
  useEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    gridRef.current?.querySelector('[data-focus="true"]')?.focus()
  }, [focusDate, view])

  const moveFocus = useCallback((d) => {
    pendingFocus.current = true
    setFocusDate(startOfDay(d))
    setView(monthOf(d))
  }, [])

  const select = useCallback(
    (d) => {
      const day = startOfDay(d)
      if (!isControlled) setInternal(day)
      onChange?.(day)
    },
    [isControlled, onChange],
  )

  const onGridKeyDown = (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (e.key in step) {
      e.preventDefault()
      moveFocus(addDays(focusDate, step[e.key]))
    } else if (e.key === 'PageUp') {
      e.preventDefault()
      moveFocus(addMonths(focusDate, -1))
    } else if (e.key === 'PageDown') {
      e.preventDefault()
      moveFocus(addMonths(focusDate, 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      moveFocus(addDays(focusDate, -focusDate.getDay()))
    } else if (e.key === 'End') {
      e.preventDefault()
      moveFocus(addDays(focusDate, 6 - focusDate.getDay()))
    }
  }

  // Reset the calendar to the selected month (or today) each time it opens.
  const onOpenChange = (isOpen) => {
    if (isOpen) {
      const b = selected ?? today
      setView(monthOf(b))
      setFocusDate(startOfDay(b))
    }
  }

  const trigger = (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cx(
        'vds-datepicker__trigger',
        `vds-datepicker--${size}`,
        invalid && 'vds-datepicker--invalid',
        !selected && 'vds-datepicker--placeholder',
        className,
      )}
    >
      <Icon as={Calendar} size="sm" className="vds-datepicker__lead" />
      <span className="vds-datepicker__value">
        {selected ? format(selected) : placeholder}
      </span>
    </button>
  )

  const cells = buildGrid(view.year, view.month)
  const weeks = Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7))

  return (
    <Popover
      role="dialog"
      aria-label={ariaLabel || 'Choose date'}
      placement={placement}
      trigger={trigger}
      onOpenChange={onOpenChange}
      className={cx('vds-datepicker', disabled && 'vds-datepicker--disabled')}
      panelClassName="vds-datepicker__pop"
      {...props}
    >
      {({ close }) => (
        <div className="vds-datepicker__panel">
          <div className="vds-datepicker__header">
            <button
              type="button"
              className="vds-datepicker__nav"
              aria-label="Previous month"
              onClick={() => setView(monthOf(addMonths(new Date(view.year, view.month, 1), -1)))}
            >
              <Icon as={ChevronLeft} size="sm" />
            </button>
            <span className="vds-datepicker__title" aria-live="polite">
              {MONTHS[view.month]} {view.year}
            </span>
            <button
              type="button"
              className="vds-datepicker__nav"
              aria-label="Next month"
              onClick={() => setView(monthOf(addMonths(new Date(view.year, view.month, 1), 1)))}
            >
              <Icon as={ChevronRight} size="sm" />
            </button>
          </div>

          <div className="vds-datepicker__weekdays" aria-hidden="true">
            {WEEKDAYS.map((w) => (
              <span key={w} className="vds-datepicker__weekday">{w}</span>
            ))}
          </div>

          <div
            ref={gridRef}
            role="grid"
            className="vds-datepicker__grid"
            onKeyDown={onGridKeyDown}
          >
            {weeks.map((week, wi) => (
              <div role="row" className="vds-datepicker__row" key={wi}>
                {week.map((cell) => {
                  const outside = cell.getMonth() !== view.month
                  const isSelected = isSameDay(cell, selected)
                  const isToday = isSameDay(cell, today)
                  const isFocus = isSameDay(cell, focusDate)
                  const dayDisabled = isDisabledDay(cell)
                  return (
                    <button
                      key={cell.getTime()}
                      type="button"
                      role="gridcell"
                      data-focus={isFocus || undefined}
                      tabIndex={isFocus ? 0 : -1}
                      aria-selected={isSelected}
                      aria-disabled={dayDisabled || undefined}
                      aria-label={cell.toLocaleDateString(undefined, {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      })}
                      className={cx(
                        'vds-datepicker__day',
                        outside && 'vds-datepicker__day--outside',
                        isSelected && 'vds-datepicker__day--selected',
                        isToday && !isSelected && 'vds-datepicker__day--today',
                        dayDisabled && 'vds-datepicker__day--disabled',
                      )}
                      onClick={() => {
                        if (dayDisabled) return
                        select(cell)
                        close()
                      }}
                    >
                      {cell.getDate()}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </Popover>
  )
})

DatePicker.displayName = 'DatePicker'
