import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'
import { Input } from '../Input/index.js'

/* OFFICIAL icon-size mapping for fields: xs→"xs", sm/md→"sm", lg/xl→"md". */
const ICON_SIZE = { xs: 'xs', sm: 'sm', md: 'sm', lg: 'md', xl: 'md' }

/**
 * PasswordInput
 *
 * A password field composed on Input: a real show/hide toggle button sits in
 * the trailing slot and flips the input's `type` between `password` and `text`.
 * The value is never stored or exposed specially — the browser's own input
 * holds it, and the forwarded ref points at that native <input>, so
 * `autoComplete`, form submission, and password managers all work normally.
 *
 * The Input owns the field's soft focus ring; the toggle is an action control,
 * so it carries its OWN hard-outline :focus-visible ring (control-anatomy §3).
 *
 * Props:
 * - size:           'xs' | 'sm' | 'md' | 'lg' | 'xl'   (default 'md')
 * - invalid:        boolean — danger border + aria-invalid   (default false)
 * - disabled:       boolean — fades + disables the whole field   (default false)
 * - defaultVisible: boolean — start with the password revealed   (default false)
 * - all native <input> attributes (value, onChange, autoComplete, name…)
 *
 * Accessibility:
 * - The toggle is a real <button type="button"> with an aria-label that flips
 *   between "Show password" / "Hide password", plus aria-pressed = visible.
 * - Pair with a <label> (or aria-label) like any Input; `invalid` sets aria-invalid.
 *
 * @example
 * <PasswordInput autoComplete="new-password" placeholder="Create a password" />
 * <PasswordInput invalid defaultVisible />
 */
export const PasswordInput = forwardRef(function PasswordInput(
  { size = 'md', invalid = false, disabled = false, defaultVisible = false, className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(defaultVisible)
  const isz = ICON_SIZE[size] ?? 'sm'

  const toggle = (
    <button
      type="button"
      className="vds-password__toggle"
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      tabIndex={0}
      onClick={() => setVisible((v) => !v)}
    >
      <Icon as={visible ? EyeOff : Eye} size={isz} />
    </button>
  )

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      className={cx('vds-password', className)}
      size={size}
      invalid={invalid}
      disabled={disabled}
      trailing={toggle}
      {...props}
    />
  )
})

PasswordInput.displayName = 'PasswordInput'
