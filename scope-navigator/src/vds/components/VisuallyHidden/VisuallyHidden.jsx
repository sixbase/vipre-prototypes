import { forwardRef } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * VisuallyHidden
 *
 * Renders content that screen readers announce but sighted users never see.
 * Use it for context that is obvious visually but missing from the accessibility
 * tree — e.g. "Opens in a new tab", a table caption, or the text behind an
 * icon-only control. The `.vds-visually-hidden` utility class (shipped in this
 * component's stylesheet) does the same job for non-React markup.
 *
 * Props:
 * - as: element/tag to render (default 'span')
 * - all native attributes
 *
 * Accessibility:
 * - Clips the element to a 1×1px box instead of display:none, so assistive
 *   technology still reads it.
 * - Don't hide focusable elements this way unless they become visible on focus.
 *
 * @example
 * <button>
 *   <Icon as={Trash2} />
 *   <VisuallyHidden>Delete device</VisuallyHidden>
 * </button>
 */
export const VisuallyHidden = forwardRef(function VisuallyHidden(
  { as: Tag = 'span', className, children, ...props },
  ref,
) {
  return (
    <Tag ref={ref} className={cx('vds-visually-hidden', className)} {...props}>
      {children}
    </Tag>
  )
})

VisuallyHidden.displayName = 'VisuallyHidden'
