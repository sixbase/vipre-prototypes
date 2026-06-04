import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'
import { Surface } from '../Surface/Surface.jsx'
import { Heading } from '../Text/Text.jsx'

/**
 * Card
 *
 * A titled container built on Surface. Optional header (title + actions) above
 * a body. For a bare panel, use Surface directly; for a labelled section of
 * content, use Card.
 *
 * Props:
 * - title:   header text (rendered as a subheading)
 * - actions: node shown on the right of the header (e.g. a Button or menu)
 * - padding: Surface padding step (default 5 → 20px)
 * - all Surface props pass through (radius, elevation, bordered, raised, as…)
 *
 * @example
 * <Card title="Package adoption" actions={<Button size="sm" variant="ghost">View all</Button>}>
 *   …
 * </Card>
 */
export const Card = forwardRef(function Card(
  { title, actions, padding = 5, className, children, ...props },
  ref,
) {
  const hasHeader = title != null || actions != null
  return (
    <Surface ref={ref} padding={padding} className={cx('vds-card', className)} {...props}>
      {hasHeader && (
        <div className="vds-card__header">
          {title != null && (
            <Heading level="subheading" as="h3" className="vds-card__title">
              {title}
            </Heading>
          )}
          {actions != null && <div className="vds-card__actions">{actions}</div>}
        </div>
      )}
      {children}
    </Surface>
  )
})

Card.displayName = 'Card'
