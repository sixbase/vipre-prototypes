import { forwardRef, useEffect, useRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Checkbox
 *
 * A labelled checkbox with checked / unchecked / indeterminate states. Renders
 * a real <input type="checkbox"> (kept accessible) behind a styled box, wrapped
 * in a <label> so the text toggles it too.
 *
 * Props:
 * - indeterminate: boolean — the "some selected" dash (set imperatively on the input)
 * - children: optional label content
 * - all native checkbox attributes (checked, defaultChecked, onChange, disabled…)
 *
 * Accessibility:
 * - Native input keeps full keyboard + screen-reader behaviour.
 * - `indeterminate` is a visual/AT state only — remember to resolve it in state.
 *
 * @example
 * <Checkbox defaultChecked>Include archived</Checkbox>
 * <Checkbox indeterminate>Select all</Checkbox>
 */
export const Checkbox = forwardRef(function Checkbox(
  { indeterminate = false, disabled, className, children, ...props },
  ref,
) {
  const innerRef = useRef(null)

  // indeterminate can only be set via the DOM property, not an attribute.
  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate
  }, [indeterminate])

  // merge the forwarded ref with our internal one
  const setRefs = (node) => {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  return (
    <label className={cx('vds-checkbox', disabled && 'vds-checkbox--disabled', className)}>
      <input ref={setRefs} type="checkbox" className="vds-checkbox__input" disabled={disabled} {...props} />
      <span className="vds-checkbox__box" aria-hidden="true" />
      {children != null && <span className="vds-checkbox__label">{children}</span>}
    </label>
  )
})

Checkbox.displayName = 'Checkbox'
