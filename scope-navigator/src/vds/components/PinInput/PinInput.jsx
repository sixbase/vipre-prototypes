import { forwardRef, useRef, useState } from 'react'
import { cx } from '../../lib/cx.js'

/**
 * PinInput
 *
 * OTP / code entry: a row of single-character cells. Typing advances focus,
 * Backspace on an empty cell steps back, arrows move, and pasting a full code
 * distributes it across the cells. `onComplete` fires once every cell is full.
 *
 * Props:
 * - length:       number of cells                       (default 6)
 * - value:        controlled string
 * - defaultValue: uncontrolled initial string           (default '')
 * - onChange:     (string) => void — current code
 * - onComplete:   (string) => void — fires when all cells are filled
 * - size:         'sm' | 'md' | 'lg'                     (default 'md')
 * - disabled:     opacity 0.5 + pointer-events none      (default false)
 * - mask:         render cells as password dots          (default false)
 * - type:         'number' | 'text' — 'number' restricts to digits + numeric
 *                 keypad (the DOM input is always text so single-char centering
 *                 works)                                 (default 'number')
 * - all native attributes, spread onto the root
 *
 * Accessibility:
 * - The row is role="group" with an aria-label; each cell is labelled
 *   "Digit N of L". The first cell carries autocomplete="one-time-code" so the
 *   platform can offer to fill an SMS code.
 *
 * @example
 * <PinInput length={6} onComplete={(code) => verify(code)} />
 */
export const PinInput = forwardRef(function PinInput(
  {
    length = 6,
    value,
    defaultValue = '',
    onChange,
    onComplete,
    size = 'md',
    disabled = false,
    mask = false,
    type = 'number',
    className,
    'aria-label': groupLabel = 'Verification code',
    ...props
  },
  ref,
) {
  const isControlled = value != null
  const [inner, setInner] = useState(() => String(defaultValue).slice(0, length))
  const raw = (isControlled ? value : inner) || ''
  const cells = Array.from({ length }, (_, i) => raw[i] ?? '')

  const refs = useRef([])
  const numeric = type === 'number'
  const sanitize = (s) => (numeric ? s.replace(/[^0-9]/g, '') : s)

  const focusCell = (i) => {
    const clamped = Math.max(0, Math.min(length - 1, i))
    const el = refs.current[clamped]
    el?.focus()
    el?.select?.()
  }

  const emit = (arr) => {
    const next = arr.join('')
    if (!isControlled) setInner(next)
    onChange?.(next)
    if (arr.length === length && arr.every((c) => c !== '')) onComplete?.(next)
  }

  const handleChange = (i, e) => {
    const typed = sanitize(e.target.value)
    const arr = [...cells]
    if (!typed) {
      arr[i] = ''
      emit(arr)
      return
    }
    // Fill from this cell forward — supports typing over a cell and multi-char input.
    let idx = i
    for (const ch of typed.split('')) {
      if (idx >= length) break
      arr[idx] = ch
      idx++
    }
    emit(arr)
    focusCell(idx)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const arr = [...cells]
      if (arr[i]) {
        arr[i] = ''
        emit(arr)
      } else if (i > 0) {
        arr[i - 1] = ''
        emit(arr)
        focusCell(i - 1)
      }
    } else if (e.key === 'Delete') {
      e.preventDefault()
      const arr = [...cells]
      arr[i] = ''
      emit(arr)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusCell(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusCell(i + 1)
    }
  }

  const handlePaste = (i, e) => {
    e.preventDefault()
    const text = sanitize(e.clipboardData.getData('text'))
    if (!text) return
    const arr = [...cells]
    let idx = i
    for (const ch of text.split('')) {
      if (idx >= length) break
      arr[idx] = ch
      idx++
    }
    emit(arr)
    focusCell(idx)
  }

  return (
    <div
      ref={ref}
      className={cx('vds-pin', `vds-pin--${size}`, disabled && 'vds-pin--disabled', className)}
      role="group"
      aria-label={groupLabel}
      {...props}
    >
      {cells.map((c, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="vds-pin__cell"
          type={mask ? 'password' : 'text'}
          inputMode={numeric ? 'numeric' : 'text'}
          pattern={numeric ? '[0-9]*' : undefined}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={c}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
})

PinInput.displayName = 'PinInput'
