import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'
import { Spinner } from '../Spinner/index.js'

/**
 * Button
 *
 * The primary interactive element. Styling is split across two axes:
 *   - `variant` — visual emphasis: solid · soft · outline · ghost
 *   - `tone`    — intent/color:    primary · neutral · success · warning · danger · info
 * Any variant pairs with any tone (e.g. a `soft` `success` confirm, an
 * `outline` `danger` destructive secondary). Plus three sizes, a built-in
 * loading state, an opacity-based disabled state, and a keyboard focus ring.
 * Forwards all native <button> attributes.
 *
 * Props:
 * - variant:   'solid' | 'soft' | 'outline' | 'ghost'                       (default 'solid')
 * - tone:      'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'  (default 'primary')
 * - size:      'sm' | 'md' | 'lg'                                           (default 'md')
 * - loading:   show a Spinner, set aria-busy, and block interaction          (default false)
 * - fullWidth: stretch to fill the container                                 (default false)
 * - iconOnly:  square the button to hold a single icon (no text padding)     (default false)
 * - all native ButtonHTMLAttributes (onClick, disabled, type, aria-*, …)
 *
 * Legacy `variant` values stay supported and map onto the new axes:
 *   primary → solid/primary · secondary → outline/neutral ·
 *   ghost → ghost/primary · danger → solid/danger
 * An explicit `tone` always wins over a legacy variant's default tone.
 *
 * Accessibility:
 * - Focus ring via --vds-focus-ring, shown only for keyboard nav (:focus-visible)
 * - Disabled (and loading) use opacity + pointer-events, never a new color
 * - `loading` sets aria-busy and disables the control so it can't be re-fired
 * - Icon-only buttons MUST be given an aria-label (there's no visible text)
 *
 * @example
 * <Button onClick={save}>Save</Button>
 * <Button variant="soft" tone="success">Approve</Button>
 * <Button variant="outline" tone="danger">Delete…</Button>
 * <Button loading>Saving…</Button>
 * <Button variant="ghost" size="sm" iconOnly aria-label="Edit"><Icon as={Pencil} /></Button>
 */

// Legacy variant → [variant, default tone]. The tone here is only a fallback;
// an explicitly-passed `tone` prop always overrides it.
const LEGACY_VARIANTS = {
  primary: ['solid', 'primary'],
  secondary: ['outline', 'neutral'],
  ghost: ['ghost', 'primary'],
  danger: ['solid', 'danger'],
}

export const Button = forwardRef(function Button(
  {
    variant = 'solid',
    tone,
    size = 'md',
    loading = false,
    fullWidth = false,
    iconOnly = false,
    type = 'button',
    disabled = false,
    className,
    children,
    ...props
  },
  ref,
) {
  // Resolve the legacy single-axis API onto the variant × tone matrix.
  const legacy = LEGACY_VARIANTS[variant]
  const resolvedVariant = legacy ? legacy[0] : variant
  const resolvedTone = tone ?? (legacy ? legacy[1] : 'primary')

  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cx(
        'vds-button',
        `vds-button--${resolvedVariant}`,
        `vds-button--${resolvedTone}`,
        `vds-button--${size}`,
        iconOnly && 'vds-button--icon',
        fullWidth && 'vds-button--full',
        loading && 'vds-button--loading',
        className,
      )}
      {...props}
    >
      {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
      {/* When an icon-only button is loading, the spinner replaces the icon. */}
      {!(loading && iconOnly) && children}
    </button>
  )
})

Button.displayName = 'Button'
