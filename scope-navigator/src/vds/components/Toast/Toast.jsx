import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Bell, CircleCheck, TriangleAlert, X } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/Icon.jsx'
import { Surface } from '../Surface/Surface.jsx'

// Exit-animation grace period — a touch over --vds-dur-base (200ms).
const EXIT_MS = 240
const DEFAULT_DURATION = 5000

const TONE_ICONS = {
  neutral: null,
  info: Bell,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: TriangleAlert,
}

/* ----------------------------------------------------------------------------
   Toast — the presentational card. The provider below renders these into the
   fixed viewport region; it's also exported on its own so docs (and tests)
   can show a toast without spinning up the provider.
   -------------------------------------------------------------------------- */

/**
 * Toast
 *
 * One notification card. Usually you never render this yourself — call
 * `useToast()` inside a `<ToastProvider>` instead — but it's exported for
 * docs and static composition.
 *
 * Props:
 * - title:       bold first line
 * - description: smaller muted second line
 * - tone:        'neutral' | 'success' | 'warning' | 'danger' | 'info'  (default 'neutral')
 * - action:      { label, onClick } — one optional action button
 * - onDismiss:   () => void — shows the ✕ close button when given
 * - leaving:     plays the exit animation (used by the provider)
 * - all native div attributes spread onto the root
 *
 * Accessibility: role="status" (polite), or role="alert" for the danger tone
 * so screen readers announce it immediately.
 *
 * @example
 * <Toast tone="success" title="Scan complete" description="No threats found." />
 */
export const Toast = forwardRef(function Toast(
  { title, description, tone = 'neutral', action, onDismiss, leaving = false, className, ...props },
  ref,
) {
  const ToneIcon = TONE_ICONS[tone]
  return (
    <Surface
      ref={ref}
      elevation="floating"
      radius="md"
      padding={null}
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx('vds-toast', `vds-toast--${tone}`, leaving && 'vds-toast--leaving', className)}
      {...props}
    >
      {ToneIcon && <Icon as={ToneIcon} size="sm" className="vds-toast__icon" />}
      <div className="vds-toast__content">
        {title != null && <div className="vds-toast__title">{title}</div>}
        {description != null && <div className="vds-toast__desc">{description}</div>}
      </div>
      {action != null && (
        <button type="button" className="vds-toast__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {onDismiss != null && (
        <button type="button" className="vds-toast__close" aria-label="Dismiss" onClick={onDismiss}>
          <Icon as={X} size="xs" />
        </button>
      )}
    </Surface>
  )
})

Toast.displayName = 'Toast'

/* ----------------------------------------------------------------------------
   ToastItem — provider-internal wrapper that owns one toast's auto-dismiss
   timer. Hover (or focus inside) pauses the countdown; leaving resumes it
   with the remaining time.
   -------------------------------------------------------------------------- */
function ToastItem({ toast: t, onDismiss }) {
  const remainingRef = useRef(t.duration)
  const startedAtRef = useRef(null)
  const timerRef = useRef(null)

  const pause = useCallback(() => {
    if (timerRef.current == null) return
    clearTimeout(timerRef.current)
    timerRef.current = null
    remainingRef.current -= Date.now() - startedAtRef.current
  }, [])

  const resume = useCallback(() => {
    if (remainingRef.current == null || timerRef.current != null || t.leaving) return
    startedAtRef.current = Date.now()
    timerRef.current = setTimeout(() => onDismiss(t.id), Math.max(0, remainingRef.current))
  }, [t.id, t.leaving, onDismiss])

  useEffect(() => {
    resume()
    return pause
  }, [resume, pause])

  return (
    <Toast
      title={t.title}
      description={t.description}
      tone={t.tone}
      leaving={t.leaving}
      action={
        t.action
          ? {
              label: t.action.label,
              onClick: () => {
                t.action.onClick?.()
                onDismiss(t.id)
              },
            }
          : null
      }
      onDismiss={() => onDismiss(t.id)}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    />
  )
}

/* ----------------------------------------------------------------------------
   Provider + hook.
   -------------------------------------------------------------------------- */
const ToastContext = createContext(null)

/**
 * useToast
 *
 * Returns `{ toast, dismiss }` from the nearest <ToastProvider>.
 * - toast({ title, description, tone, duration, action }) → id
 *     tone:     'neutral' | 'success' | 'warning' | 'danger' | 'info'  (default 'neutral')
 *     duration: ms before auto-dismiss (default 5000); null = sticky
 *     action:   { label, onClick } — one optional action button
 * - dismiss(id) closes a toast early (e.g. a sticky one).
 *
 * @example
 * const { toast } = useToast()
 * toast({ tone: 'success', title: 'Policy saved' })
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside a <ToastProvider>')
  return ctx
}

/**
 * ToastProvider
 *
 * Wrap the app once. Renders children plus a fixed notification region
 * (bottom-right on desktop, full-width bottom below the sm breakpoint) on
 * --vds-z-toast. Toasts stack newest-on-top, auto-dismiss after their
 * duration (paused while hovered), and animate in/out.
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    // Mark it leaving so the exit animation plays, then remove it.
    setToasts((ts) => ts.map((t) => (t.id === id && !t.leaving ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), EXIT_MS)
  }, [])

  const toast = useCallback((options = {}) => {
    idRef.current += 1
    const id = idRef.current
    setToasts((ts) => [
      { tone: 'neutral', duration: DEFAULT_DURATION, ...options, id, leaving: false },
      ...ts, // newest first = newest on top of the stack
    ])
    return id
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="vds-toaster" role="region" aria-label="Notifications">
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

ToastProvider.displayName = 'ToastProvider'
