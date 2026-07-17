import { Children, cloneElement, forwardRef, isValidElement, useEffect, useState } from 'react'
import { User } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'

/* The categorical accent families with semantic --vds-accent-* tokens. */
const FAMILIES = [
  'rose', 'clay', 'amber', 'lime', 'emerald',
  'harbor', 'azure', 'purple', 'orchid', 'magenta',
]

/* Deterministic: the same name always lands on the same accent family. */
function familyOf(name) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return FAMILIES[h % FAMILIES.length]
}

/* "Dana Osei-Mensah" → "DO". Single word → its first letter. */
function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  const first = [...parts[0]][0] ?? ''
  const last = parts.length > 1 ? [...parts[parts.length - 1]][0] : ''
  return (first + last).toUpperCase()
}

const STATUS_LABELS = {
  online: 'Online',
  busy: 'Busy',
  away: 'Away',
  offline: 'Offline',
}

/**
 * Avatar
 *
 * An identity chip. Shows the image when it loads; otherwise falls back to the
 * person's initials on a deterministic accent-family tint (the same name always
 * gets the same color), and to a person glyph when there's no name at all.
 * An optional status dot marks presence.
 *
 * Props:
 * - src:    image URL. A failed load falls back to initials automatically.
 * - alt:    image description                  (defaults to `name`)
 * - name:   person's name → initials + deterministic accent color
 * - size:   'xs' | 'sm' | 'md' | 'lg' | 'xl' → 20 / 24 / 32 / 40 / 56px  (default 'md')
 * - shape:  'circle' | 'square' (square uses radius-md)                  (default 'circle')
 * - status: 'online' | 'busy' | 'away' | 'offline' — presence dot, tone-mapped
 * - all native span attributes
 *
 * Accessibility:
 * - The image gets a real `alt`; the initials fallback is aria-hidden with the
 *   name exposed on the root via aria-label.
 * - The status dot carries role="img" + an aria-label ("Online" …), so
 *   presence is announced, not just colored.
 *
 * @example
 * <Avatar name="Dana Osei" />
 * <Avatar src="/dana.jpg" name="Dana Osei" size="lg" status="online" />
 * <Avatar name="VIPRE Ops" shape="square" size="sm" />
 */
export const Avatar = forwardRef(function Avatar(
  { src, alt, name, size = 'md', shape = 'circle', status, className, ...props },
  ref,
) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src]) // a new src gets a fresh chance

  const showImage = src && !failed
  const initials = name ? initialsOf(name) : ''
  const family = name ? familyOf(name) : null
  const glyphSize = { xs: 'xs', sm: 'xs', md: 'sm', lg: 'md', xl: 'lg' }[size] ?? 'sm'

  return (
    <span
      ref={ref}
      className={cx(
        'vds-avatar',
        `vds-avatar--${size}`,
        `vds-avatar--${shape}`,
        !showImage && family && `vds-avatar--fam-${family}`,
        className,
      )}
      aria-label={!showImage && name ? name : undefined}
      role={!showImage && name ? 'img' : undefined}
      {...props}
    >
      {showImage ? (
        <img
          className="vds-avatar__img"
          src={src}
          alt={alt ?? name ?? ''}
          onError={() => setFailed(true)}
        />
      ) : initials ? (
        <span className="vds-avatar__initials" aria-hidden="true">
          {size === 'xs' ? initials.slice(0, 1) : initials}
        </span>
      ) : (
        <Icon as={User} size={glyphSize} />
      )}
      {status && (
        <span
          className={cx('vds-avatar__status', `vds-avatar__status--${status}`)}
          role="img"
          aria-label={STATUS_LABELS[status]}
        />
      )}
    </span>
  )
})

Avatar.displayName = 'Avatar'

/**
 * AvatarGroup
 *
 * Overlapping avatars for "who's on this" clusters. Shows up to `max` avatars,
 * then a "+N" chip for the rest. Children are sized by the group so the stack
 * stays even.
 *
 * Props:
 * - max:  how many avatars to show before collapsing into "+N"
 * - size: applied to every child avatar and the overflow chip   (default 'md')
 * - all native div attributes
 *
 * @example
 * <AvatarGroup max={3}>
 *   <Avatar name="Dana Osei" />
 *   <Avatar name="Lee Wong" />
 *   <Avatar name="Ana Cruz" />
 *   <Avatar name="Sam Reed" />
 * </AvatarGroup>
 */
export const AvatarGroup = forwardRef(function AvatarGroup(
  { max, size = 'md', className, children, ...props },
  ref,
) {
  const items = Children.toArray(children)
  const shown = max != null && items.length > max ? items.slice(0, max) : items
  const overflow = items.length - shown.length

  return (
    <div ref={ref} role="group" className={cx('vds-avatar-group', className)} {...props}>
      {shown.map((child) => (isValidElement(child) ? cloneElement(child, { size }) : child))}
      {overflow > 0 && (
        <span
          className={cx('vds-avatar', `vds-avatar--${size}`, 'vds-avatar--circle', 'vds-avatar-group__overflow')}
          role="img"
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
})

AvatarGroup.displayName = 'AvatarGroup'
