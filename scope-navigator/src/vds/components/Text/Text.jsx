import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/* ----------------------------------------------------------------------------
   Typography components — the ONLY way to render text in the system. They bind
   the Rubik typescale classes (.vds-text--title …) to semantic tone classes,
   so callers never reach for raw font sizes or colors. The scale + tone classes
   live in src/styles/_typography.scss (shipped in the styles bundle).
   -------------------------------------------------------------------------- */

const TONE = {
  default: 'vds-text--tone-default',
  muted: 'vds-text--tone-muted',
  subtle: 'vds-text--tone-subtle',
  primary: 'vds-text--tone-primary',
  success: 'vds-text--tone-success',
  warning: 'vds-text--tone-warning',
  danger: 'vds-text--tone-danger',
}

const LEADING = {
  none: 'vds-text--leading-none',
  tight: 'vds-text--leading-tight',
  snug: 'vds-text--leading-snug',
  normal: 'vds-text--leading-normal',
  relaxed: 'vds-text--leading-relaxed',
}

/**
 * Heading — display / title / heading / subheading.
 *
 * `level` sets the visual size; `as` sets the semantic element, so heading
 * hierarchy stays correct independent of how big something looks. `leading`
 * overrides the baked-in line-height for multi-line headings; `tabular` opts
 * into equal-width numerals.
 *
 * @example
 * <Heading level="title" as="h1">Customer Management</Heading>
 */
export const Heading = forwardRef(function Heading(
  { level = 'heading', as, tone = 'default', leading, tabular = false, className, children, ...props },
  ref,
) {
  const Tag = as || 'h2'
  return (
    <Tag
      ref={ref}
      className={cx(
        'vds-text',
        'vds-heading',
        `vds-text--${level}`,
        TONE[tone],
        leading && LEADING[leading],
        tabular && 'vds-text--tabular',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
})

Heading.displayName = 'Heading'

/**
 * Text — body / caption / detail / micro / eyebrow / nano.
 * Defaults to <p>; pass `as="span"` for inline use. `leading` overrides the
 * step's baked-in line-height for wrapping copy; `tabular` opts into
 * equal-width numerals for figures that must align or update in place.
 *
 * @example
 * <Text variant="body" tone="muted">Secondary copy</Text>
 * <Text variant="body" leading="relaxed">Long-form paragraph…</Text>
 * <Text variant="detail" tabular>1,204,398</Text>
 * <Text variant="eyebrow" tone="primary">Overview</Text>
 */
export const Text = forwardRef(function Text(
  { variant = 'body', as = 'p', tone = 'default', leading, tabular = false, className, children, ...props },
  ref,
) {
  const Tag = as
  return (
    <Tag
      ref={ref}
      className={cx(
        'vds-text',
        `vds-text--${variant}`,
        TONE[tone],
        leading && LEADING[leading],
        tabular && 'vds-text--tabular',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
})

Text.displayName = 'Text'
