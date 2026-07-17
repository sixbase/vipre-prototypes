import { createContext, forwardRef, useCallback, useContext, useId, useState } from 'react'
import { ChevronDown } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'

const AccordionCtx = createContext(null)
const ItemCtx = createContext(null)

/* Normalise the open value to an array regardless of type. */
const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v])

/**
 * Accordion
 *
 * Vertically stacked disclosure sections. `type="single"` keeps at most one
 * section open (opening one closes the rest); `type="multiple"` lets any
 * number stay open. Compose the four parts:
 *
 *   <Accordion type="single" defaultValue="policies">
 *     <AccordionItem value="policies">
 *       <AccordionTrigger>Policies</AccordionTrigger>
 *       <AccordionContent>…</AccordionContent>
 *     </AccordionItem>
 *   </Accordion>
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 * For `single`, value is a string (or null); for `multiple`, an array.
 *
 * Props:
 * - type:  'single' | 'multiple'   (default 'single')
 * - value / defaultValue / onChange: open item(s)
 *
 * Motion: open/close animates height with the grid-template-rows 0fr→1fr
 * technique (240ms, --vds-ease-emphatic); the body text fades in a beat
 * later. prefers-reduced-motion switches to instant.
 *
 * Accessibility:
 * - Trigger is a real <button> inside a heading, with aria-expanded +
 *   aria-controls; the panel is a labelled region.
 *
 * @example
 * <Accordion type="multiple" defaultValue={['a', 'b']}>…</Accordion>
 */
export const Accordion = forwardRef(function Accordion(
  { type = 'single', value: valueProp, defaultValue, onChange, className, children, ...props },
  ref,
) {
  const isControlled = valueProp !== undefined
  const [valueState, setValueState] = useState(defaultValue)
  const open = toArray(isControlled ? valueProp : valueState)

  const toggle = useCallback(
    (itemValue) => {
      let next
      if (type === 'multiple') {
        next = open.includes(itemValue)
          ? open.filter((v) => v !== itemValue)
          : [...open, itemValue]
      } else {
        next = open.includes(itemValue) ? null : itemValue
      }
      if (!isControlled) setValueState(next)
      onChange?.(next)
    },
    [type, open, isControlled, onChange],
  )

  return (
    <AccordionCtx.Provider value={{ open, toggle }}>
      <div ref={ref} className={cx('vds-accordion', className)} {...props}>
        {children}
      </div>
    </AccordionCtx.Provider>
  )
})

Accordion.displayName = 'Accordion'

/**
 * AccordionItem — one section. Props: value (required), disabled.
 */
export const AccordionItem = forwardRef(function AccordionItem(
  { value, disabled = false, className, children, ...props },
  ref,
) {
  const { open, toggle } = useContext(AccordionCtx)
  const baseId = useId()
  const isOpen = open.includes(value)

  return (
    <ItemCtx.Provider
      value={{
        isOpen,
        disabled,
        toggle: () => toggle(value),
        triggerId: `${baseId}-trigger`,
        panelId: `${baseId}-panel`,
      }}
    >
      <div
        ref={ref}
        data-state={isOpen ? 'open' : 'closed'}
        className={cx(
          'vds-accordion__item',
          isOpen && 'vds-accordion__item--open',
          disabled && 'vds-accordion__item--disabled',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </ItemCtx.Provider>
  )
})

AccordionItem.displayName = 'AccordionItem'

/**
 * AccordionTrigger — the header button. The chevron rotates when open.
 * Props: as — the heading tag wrapping the button (default 'h3').
 */
export const AccordionTrigger = forwardRef(function AccordionTrigger(
  { as: Tag = 'h3', className, children, ...props },
  ref,
) {
  const { isOpen, disabled, toggle, triggerId, panelId } = useContext(ItemCtx)

  return (
    <Tag className="vds-accordion__header">
      <button
        ref={ref}
        type="button"
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        disabled={disabled}
        onClick={toggle}
        className={cx('vds-accordion__trigger', className)}
        {...props}
      >
        <span className="vds-accordion__label">{children}</span>
        <Icon as={ChevronDown} size="sm" className="vds-accordion__chevron" />
      </button>
    </Tag>
  )
})

AccordionTrigger.displayName = 'AccordionTrigger'

/**
 * AccordionContent — the collapsible body. Stays in the DOM so the height
 * animation can run; it's hidden from focus/AT while closed.
 */
export const AccordionContent = forwardRef(function AccordionContent(
  { className, children, ...props },
  ref,
) {
  const { isOpen, triggerId, panelId } = useContext(ItemCtx)

  return (
    <div
      ref={ref}
      role="region"
      id={panelId}
      aria-labelledby={triggerId}
      aria-hidden={!isOpen}
      className={cx('vds-accordion__panel', isOpen && 'vds-accordion__panel--open', className)}
      {...props}
    >
      <div className="vds-accordion__clip">
        <div className="vds-accordion__body">{children}</div>
      </div>
    </div>
  )
})

AccordionContent.displayName = 'AccordionContent'
