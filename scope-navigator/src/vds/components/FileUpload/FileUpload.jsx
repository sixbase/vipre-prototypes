import { forwardRef, useId, useRef, useState } from 'react'
import { Upload, X } from '@icons'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/index.js'

/* Icon size follows the dropzone size (matches the field icon-size mapping). */
const ICON_SIZE = { sm: 'sm', md: 'md', lg: 'md' }

/**
 * FileUpload
 *
 * A dropzone: a dashed drop area that also opens the native file picker on
 * click or keyboard. Files can be dragged in OR browsed to; both fire
 * `onFiles`. Selected files list below with a per-file remove button. Nothing
 * is uploaded anywhere — the component only surfaces the picked File objects.
 *
 * Props:
 * - onFiles:  (File[]) => void — called on drop AND on picker change
 * - accept:   native accept string (e.g. 'image/*,.pdf')
 * - multiple: allow more than one file            (default false)
 * - disabled: opacity 0.5 + pointer-events none   (default false)
 * - size:     'sm' | 'md' | 'lg'                  (default 'md')
 * - label:    the zone's prompt text              (default 'Drag files here or browse')
 * - all native attributes, spread onto the root
 *
 * Accessibility:
 * - The zone is a real <button> — reachable by Tab and openable with Enter/Space.
 * - A polite live region announces how many files are selected.
 * - Each remove button gets aria-label "Remove {name}".
 *
 * @example
 * <FileUpload multiple onFiles={(files) => console.log(files.map((f) => f.name))} />
 */
export const FileUpload = forwardRef(function FileUpload(
  {
    onFiles,
    accept,
    multiple = false,
    disabled = false,
    size = 'md',
    label = 'Drag files here or browse',
    className,
    ...props
  },
  ref,
) {
  const inputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const statusId = useId()

  const emit = (list) => {
    const arr = Array.from(list || [])
    const next = multiple ? arr : arr.slice(0, 1)
    setFiles(next)
    onFiles?.(next)
  }

  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    if (e.dataTransfer?.files?.length) emit(e.dataTransfer.files)
  }
  const onDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setDragging(true)
  }
  const onDragLeave = (e) => {
    e.preventDefault()
    setDragging(false)
  }

  const removeAt = (i) => {
    const next = files.filter((_, idx) => idx !== i)
    setFiles(next)
    onFiles?.(next)
    // Clear the native input so re-selecting the same file still fires change.
    if (next.length === 0 && inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      ref={ref}
      className={cx('vds-fileupload', `vds-fileupload--${size}`, disabled && 'vds-fileupload--disabled', className)}
      {...props}
    >
      <button
        type="button"
        className={cx('vds-fileupload__zone', dragging && 'vds-fileupload__zone--dragging')}
        onClick={openPicker}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        disabled={disabled}
        aria-describedby={statusId}
      >
        <Icon as={Upload} size={ICON_SIZE[size] ?? 'md'} className="vds-fileupload__icon" />
        <span className="vds-fileupload__label">{label}</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        className="vds-visually-hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => e.target.files?.length && emit(e.target.files)}
      />

      <span id={statusId} className="vds-visually-hidden" role="status" aria-live="polite">
        {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'No file selected'}
      </span>

      {files.length > 0 && (
        <ul className="vds-fileupload__list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="vds-fileupload__item">
              <span className="vds-fileupload__name">{f.name}</span>
              <button
                type="button"
                className="vds-fileupload__remove"
                aria-label={`Remove ${f.name}`}
                onClick={() => removeAt(i)}
                disabled={disabled}
              >
                <Icon as={X} size="xs" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

FileUpload.displayName = 'FileUpload'
