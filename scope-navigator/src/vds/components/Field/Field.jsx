import { forwardRef, cloneElement, isValidElement, useId } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * Field
 *
 * The canonical wrapper for a labelled form control (Input, Select, Textarea).
 * Renders a label above and optional help / error text below, and wires the
 * accessibility automatically: it injects `id`, `aria-describedby`, and (when
 * `error` is set) `invalid` onto the single child control.
 *
 * Props:
 * - label:   the field label (string or node)
 * - eyebrow: render the label as an uppercase overline instead of a plain label
 * - help:    muted helper text below the control
 * - error:   danger message below (role="alert"); also marks the control invalid
 * - htmlFor: control id (auto-generated if omitted)
 * - children: exactly one control element
 *
 * @example
 * <Field label="Email" help="We'll never share it.">
 *   <Input type="email" />
 * </Field>
 * <Field label="Status" error="Pick a status"><Select>…</Select></Field>
 */
export const Field = forwardRef(function Field(
  { label, eyebrow = false, help, error, htmlFor, className, children, ...props },
  ref,
) {
  const autoId = useId()
  const childId = isValidElement(children) ? children.props.id : undefined
  const id = htmlFor || childId || autoId
  const helpId = help ? `${id}-help` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy =
    [isValidElement(children) ? children.props['aria-describedby'] : null, errorId || helpId]
      .filter(Boolean)
      .join(' ') || undefined

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-describedby': describedBy,
        invalid: error ? true : children.props.invalid,
      })
    : children

  return (
    <div ref={ref} className={cx('vds-field', className)} {...props}>
      {label != null && (
        <label htmlFor={id} className={cx('vds-field__label', eyebrow && 'vds-field__label--eyebrow')}>
          {label}
        </label>
      )}
      {control}
      {error ? (
        <span id={errorId} role="alert" className="vds-field__error">
          {error}
        </span>
      ) : help ? (
        <span id={helpId} className="vds-field__help">
          {help}
        </span>
      ) : null}
    </div>
  )
})

Field.displayName = 'Field'
