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

/**
 * Heading — display / title / heading / subheading.
 *
 * `level` sets the visual size; `as` sets the semantic element, so heading
 * hierarchy stays correct independent of how big something looks.
 *
 * @example
 * <Heading level="title" as="h1">Customer Management</Heading>
 */
export const Heading = forwardRef(function Heading(
  { level = 'heading', as, tone = 'default', className, children, ...props },
  ref,
) {
  const Tag = as || 'h2'
  return (
    <Tag
      ref={ref}
      className={cx('vds-text', 'vds-heading', `vds-text--${level}`, TONE[tone], className)}
      {...props}
    >
      {children}
    </Tag>
  )
})

Heading.displayName = 'Heading'

/**
 * Text — body / caption / detail / micro / eyebrow / nano.
 * Defaults to <p>; pass `as="span"` for inline use.
 *
 * @example
 * <Text variant="body" tone="muted">Secondary copy</Text>
 * <Text variant="eyebrow" tone="primary">Overview</Text>
 */
export const Text = forwardRef(function Text(
  { variant = 'body', as = 'p', tone = 'default', className, children, ...props },
  ref,
) {
  const Tag = as
  return (
    <Tag
      ref={ref}
      className={cx('vds-text', `vds-text--${variant}`, TONE[tone], className)}
      {...props}
    >
      {children}
    </Tag>
  )
})

Text.displayName = 'Text'
