import { Input } from '@material-tailwind/react'
import {
  FORM_CONTROL_CONTAINER_PROPS,
  FORM_CONTROL_DISABLED_LABEL_CLASS,
  FORM_CONTROL_FIELD_CLASS,
  FORM_CONTROL_LABEL_NOTCH_CLASS,
} from './formFieldStyles'

const AUTOFILL_LABEL_CLASS = [
  'peer-autofill:text-[11px]',
  'peer-autofill:leading-tight',
  'peer-autofill:-top-1.5',
  'peer-autofill:before:!border-blue-gray-200',
  'peer-autofill:after:!border-blue-gray-200',
  'peer-autofill:before:border-t',
  'peer-autofill:before:border-l',
  'peer-autofill:after:border-t',
  'peer-autofill:after:border-r',
].join(' ')

/**
 * Outlined Material Tailwind input with a floating label.
 * Pass field text via `label`; use `placeholder` only for optional hint text.
 */
const FormInput = ({
  variant = 'outlined',
  color = 'gray',
  size = 'md',
  className = '',
  labelProps,
  containerProps,
  shrink,
  value,
  defaultValue,
  ...props
}) => {
  const hasValue =
    shrink !== undefined
      ? shrink
      : (value !== undefined && value !== '') ||
        (defaultValue !== undefined && defaultValue !== '')

  return (
    <Input
      variant={variant}
      color={color}
      size={size}
      value={value}
      defaultValue={defaultValue}
      shrink={hasValue}
      className={[
        FORM_CONTROL_FIELD_CLASS,
        'peer-autofill:!border-t-transparent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
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
        className: [
          '!z-[1]',
          FORM_CONTROL_LABEL_NOTCH_CLASS,
          FORM_CONTROL_DISABLED_LABEL_CLASS,
          AUTOFILL_LABEL_CLASS,
          labelProps?.className,
        ]
          .filter(Boolean)
          .join(' '),
        ...labelProps,
      }}
      {...props}
    />
  )
}

export default FormInput
