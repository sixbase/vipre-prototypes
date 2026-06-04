/**
 * cx — tiny className joiner. Filters out falsy values so conditional
 * classes stay readable: cx('base', isActive && 'active', className)
 */
export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}
