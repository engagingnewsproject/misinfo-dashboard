import { useCallback, useState } from 'react'
import { Textarea } from '@material-tailwind/react'
import {
  FORM_CONTROL_CONTAINER_PROPS,
  FORM_CONTROL_FIELD_CLASS,
  FORM_CONTROL_LABEL_NOTCH_CLASS,
} from './formFieldStyles'

const RESIZE_MIN_HEIGHT_PX = 120

/**
 * Outlined Material Tailwind textarea with a floating label.
 * Pass field text via `label`; use `placeholder` only for optional hint text.
 *
 * @param {boolean} [resizable] - When true, shows a bottom drag grip for vertical resize.
 */
const FormTextarea = ({
  variant = 'outlined',
  color = 'gray',
  size = 'md',
  resizable = false,
  className = '',
  labelProps,
  containerProps,
  style,
  id,
  ...props
}) => {
  const [heightPx, setHeightPx] = useState(null)

  const onResizeGripMouseDown = useCallback(
    (event) => {
      event.preventDefault()
      if (!id || typeof document === 'undefined') return

      const el = document.getElementById(id)
      if (!el) return

      const startY = event.clientY
      const startHeight = el.offsetHeight
      const maxHeightPx = Math.min(
        window.innerHeight * 0.7,
        parseFloat(getComputedStyle(el).maxHeight) || window.innerHeight * 0.7,
      )

      const onMouseMove = (moveEvent) => {
        const nextHeight = Math.max(
          RESIZE_MIN_HEIGHT_PX,
          Math.min(maxHeightPx, startHeight + moveEvent.clientY - startY),
        )
        el.style.height = `${nextHeight}px`
      }

      const onMouseUp = () => {
        setHeightPx(el.offsetHeight)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [id],
  )

  const textarea = (
    <Textarea
      variant={variant}
      color={color}
      size={size}
      id={id}
      resize={false}
      style={
        resizable
          ? {
              resize: 'none',
              minHeight: `${RESIZE_MIN_HEIGHT_PX}px`,
              maxHeight: '70vh',
              overflowY: 'auto',
              ...(heightPx ? { height: `${heightPx}px` } : {}),
              ...style,
            }
          : style
      }
      className={[
        FORM_CONTROL_FIELD_CLASS,
        resizable ? 'h-auto min-h-[120px] max-h-[70vh] !pb-5' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      containerProps={{
        ...FORM_CONTROL_CONTAINER_PROPS,
        ...containerProps,
        className: [
          FORM_CONTROL_CONTAINER_PROPS.className,
          resizable ? '!h-auto !min-h-0 !items-start' : '',
          containerProps?.className,
        ]
          .filter(Boolean)
          .join(' '),
      }}
      labelProps={{
        className: ['!z-[1]', FORM_CONTROL_LABEL_NOTCH_CLASS, labelProps?.className]
          .filter(Boolean)
          .join(' '),
        ...labelProps,
      }}
      {...props}
    />
  )

  if (!resizable) return textarea

  return (
    <div className="relative w-full">
      {textarea}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Drag to resize"
        title="Drag to resize"
        className="absolute inset-x-0 bottom-0 z-[2] flex h-4 cursor-ns-resize items-center justify-center rounded-b-[7px]"
        onMouseDown={onResizeGripMouseDown}
      >
        <span
          className="pointer-events-none h-1 w-10 rounded-full bg-blue-gray-300/80"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export default FormTextarea
