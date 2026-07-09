import { Textarea } from '@material-tailwind/react'
import {
  FORM_CONTROL_CONTAINER_PROPS,
  FORM_CONTROL_FIELD_CLASS,
  FORM_CONTROL_LABEL_NOTCH_CLASS,
} from './formFieldStyles'

/**
 * Outlined Material Tailwind textarea with a floating label.
 * Pass field text via `label`; use `placeholder` only for optional hint text.
 */
const FormTextarea = ({
  variant = 'outlined',
  color = 'gray',
  size = 'md',
  className = '',
  labelProps,
  containerProps,
  ...props
}) => (
  <Textarea
    variant={variant}
    color={color}
    size={size}
    className={[FORM_CONTROL_FIELD_CLASS, className].filter(Boolean).join(' ')}
    containerProps={{
      ...FORM_CONTROL_CONTAINER_PROPS,
      ...containerProps,
      className: [
        FORM_CONTROL_CONTAINER_PROPS.className,
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

export default FormTextarea
