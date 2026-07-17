import { createContext, forwardRef, useContext, useRef } from 'react'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/Icon.jsx'
import { Popover } from '../Popover/Popover.jsx'
import { menuKeyDown } from '../Popover/menuKeyDown.js'

// Lets MenuItem reach the Popover's close() without prop drilling.
const MenuContext = createContext({ close: () => {} })

// How long a pause resets the typeahead buffer.
const TYPEAHEAD_RESET_MS = 600

/**
 * Menu
 *
 * A dropdown action menu, composed on the Popover primitive — so placement
 * (flip + clamp), outside-click/Escape dismissal, and focus-return all come
 * from one shared implementation. The panel is role="menu"; items are
 * MenuItem (role="menuitem"), with MenuSeparator and MenuLabel for grouping.
 *
 * Keyboard: ArrowUp/Down move (wrapping), Home/End jump, Enter/Space pick,
 * Escape closes and returns focus to the trigger, and typing letters jumps to
 * the first matching item (typeahead).
 *
 * Props:
 * - trigger:    a single focusable element (gets ARIA + toggle wired in)
 * - children:   MenuItem / MenuSeparator / MenuLabel nodes
 * - placement:  Popover placement   (default 'bottom-start')
 * - aria-label: name for the menu (recommended when the trigger is icon-only)
 * - open / defaultOpen / onOpenChange and other Popover props pass through
 *
 * @example
 * <Menu trigger={<Button variant="outline" tone="neutral">Actions</Button>} aria-label="Device actions">
 *   <MenuItem icon={Pencil} onSelect={rename}>Rename</MenuItem>
 *   <MenuItem icon={Copy} onSelect={duplicate}>Duplicate</MenuItem>
 *   <MenuSeparator />
 *   <MenuItem icon={Trash2} danger onSelect={remove}>Delete</MenuItem>
 * </Menu>
 */
export const Menu = forwardRef(function Menu(
  { trigger, children, placement = 'bottom-start', 'aria-label': ariaLabel, className, ...props },
  ref,
) {
  const typeaheadRef = useRef({ query: '', at: 0 })

  const handleKeyDown = (e) => {
    menuKeyDown(e) // arrows / Home / End (wrapping, skips disabled)

    // Typeahead: typing letters focuses the first item that starts with them.
    // A single space is left alone — it activates the focused item natively.
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
    const buf = typeaheadRef.current
    const now = Date.now()
    buf.query = now - buf.at > TYPEAHEAD_RESET_MS ? e.key : buf.query + e.key
    buf.at = now
    if (buf.query === ' ') return
    const items = Array.from(
      e.currentTarget.querySelectorAll('[role="menuitem"]:not([disabled])'),
    )
    const match = items.find((el) =>
      el.textContent.trim().toLowerCase().startsWith(buf.query.toLowerCase()),
    )
    match?.focus()
  }

  return (
    <Popover
      ref={ref}
      role="menu"
      placement={placement}
      trigger={trigger}
      aria-label={ariaLabel}
      className={cx('vds-menu', className)}
      panelClassName="vds-menu__panel"
      {...props}
    >
      {({ close }) => (
        <MenuContext.Provider value={{ close }}>
          <div className="vds-popover__menu vds-menu__list" role="none" onKeyDown={handleKeyDown}>
            {children}
          </div>
        </MenuContext.Provider>
      )}
    </Popover>
  )
})

Menu.displayName = 'Menu'

/**
 * MenuItem
 *
 * One action row. Picking it runs `onSelect` and closes the menu (focus goes
 * back to the trigger). Disabled items are skipped by arrow keys and can't be
 * picked.
 *
 * Props:
 * - icon:     an icon component from '@icons', shown before the label
 * - danger:   red styling for destructive actions   (default false)
 * - disabled: boolean
 * - onSelect: () => void — the action
 * - trailing: node after the label (e.g. a keyboard hint)
 * - all native button attributes spread onto the row
 *
 * @example
 * <MenuItem icon={Trash2} danger onSelect={remove} trailing={<Kbd>⌫</Kbd>}>Delete</MenuItem>
 */
export const MenuItem = forwardRef(function MenuItem(
  { icon, danger = false, disabled = false, onSelect, trailing, onClick, className, children, ...props },
  ref,
) {
  const { close } = useContext(MenuContext)
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cx(
        'vds-popover__item',
        'vds-menu__item',
        danger && 'vds-menu__item--danger',
        className,
      )}
      onClick={(e) => {
        onClick?.(e)
        onSelect?.(e)
        close()
      }}
      {...props}
    >
      {icon != null && <Icon as={icon} size="sm" className="vds-menu__item-icon" />}
      <span className="vds-menu__item-label">{children}</span>
      {trailing != null && <span className="vds-menu__item-trailing">{trailing}</span>}
    </button>
  )
})

MenuItem.displayName = 'MenuItem'

/**
 * MenuSeparator — a hairline between groups of items.
 *
 * @example
 * <MenuSeparator />
 */
export const MenuSeparator = forwardRef(function MenuSeparator({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={cx('vds-menu__separator', className)}
      {...props}
    />
  )
})

MenuSeparator.displayName = 'MenuSeparator'

/**
 * MenuLabel — a small non-interactive heading above a group of items.
 *
 * @example
 * <MenuLabel>Danger zone</MenuLabel>
 */
export const MenuLabel = forwardRef(function MenuLabel({ className, children, ...props }, ref) {
  return (
    <div ref={ref} role="presentation" className={cx('vds-menu__label', className)} {...props}>
      {children}
    </div>
  )
})

MenuLabel.displayName = 'MenuLabel'
