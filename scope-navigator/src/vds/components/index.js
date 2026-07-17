// Public component API — the entry consumers import.
//   import { Surface, Stack, Inline, Divider, Button, Badge, Text, Heading } from 'vipre-design-system'

// Layout primitives
export { Surface } from './Surface/index.js'
export { Card } from './Card/index.js'
export { StatTile } from './StatTile/index.js'
export { MetricCard } from './MetricCard/index.js'
export { Sparkline } from './Sparkline/index.js'
export { Table } from './Table/index.js'
export { Stack } from './Stack/index.js'
export { Inline } from './Inline/index.js'
export { Grid } from './Grid/index.js'
export { Divider } from './Divider/index.js'

// Controls & content
export { Icon } from './Icon/index.js'
export { Field } from './Field/index.js'
export { Input } from './Input/index.js'
export { Textarea } from './Textarea/index.js'
export { Checkbox } from './Checkbox/index.js'
export { Radio } from './Radio/index.js'
export { RadioGroup } from './RadioGroup/index.js'
export { Switch } from './Switch/index.js'
export { Select } from './Select/index.js'
export { Slider } from './Slider/index.js'
export { SegmentedControl } from './SegmentedControl/index.js'
export { SearchInput } from './SearchInput/index.js'
export { Combobox } from './Combobox/index.js'
export { PasswordInput } from './PasswordInput/index.js'
export { NumberInput } from './NumberInput/index.js'
export { DatePicker } from './DatePicker/index.js'
export { TimeInput } from './TimeInput/index.js'
export { FileUpload } from './FileUpload/index.js'
export { PinInput } from './PinInput/index.js'
export { TagsInput } from './TagsInput/index.js'
export { Popover, menuKeyDown } from './Popover/index.js'
export { Spinner } from './Spinner/index.js'
export { Button } from './Button/index.js'
export { Badge } from './Badge/index.js'
export { Text, Heading } from './Text/index.js'

// Overlays
export { Modal } from './Modal/index.js'
export { Drawer } from './Drawer/index.js'
export { Toast, ToastProvider, useToast } from './Toast/index.js'
export { Tooltip } from './Tooltip/index.js'
export { Menu, MenuItem, MenuSeparator, MenuLabel } from './Menu/index.js'
export { CommandPalette } from './CommandPalette/index.js'

// Navigation & wayfinding
export { Tabs, TabList, Tab, TabPanel } from './Tabs/index.js'
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion/index.js'
export { Breadcrumb } from './Breadcrumb/index.js'
export { Pagination } from './Pagination/index.js'
export { Stepper } from './Stepper/index.js'
export { Kbd } from './Kbd/index.js'

// Feedback & display
export { Alert } from './Alert/index.js'
export { Progress } from './Progress/index.js'
export { Skeleton } from './Skeleton/index.js'
export { Avatar, AvatarGroup } from './Avatar/index.js'
export { Tag } from './Tag/index.js'
export { EmptyState } from './EmptyState/index.js'
export { DescriptionList, DescriptionListItem } from './DescriptionList/index.js'
export { VisuallyHidden } from './VisuallyHidden/index.js'

// Composites — domain components assembled from the primitives above.
export { SideNav, ProductTile } from './SideNav/index.js'
export { AppShell, AppShellNavTrigger } from './AppShell/index.js'
export { TopBar } from './TopBar/index.js'
export { CurrentLeftNav, CurrentLeftNavLogOutIcon } from './CurrentLeftNav/index.js'
export { PageHeader } from './PageHeader/index.js'
export {
  ScopeNavigator,
  defaultTypeConfig,
  defaultStatusConfig,
  defaultSortOptions,
} from './ScopeNavigator/index.js'
export {
  TimeframeSelect,
  DEFAULT_TIMEFRAMES,
  CALENDAR_TIMEFRAMES,
  resolveTimeframe,
} from './TimeframeSelect/index.js'

// ---- prototype-local additions (not yet upstreamed to the DS) ----
// Appended by scripts/sync-ds.sh — see FORKED there.
export { ScopeTree } from './ScopeNavigator/index.js'
