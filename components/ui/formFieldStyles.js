/** Resting outline color (blue-gray-200). */
export const FORM_BORDER_COLOR_REST = '#cfd8dc'

/** Focused / active outline color (gray-900). */
export const FORM_BORDER_COLOR_FOCUS = '#212121'

/** Vertical padding for Material Tailwind Input/Textarea controls. */
export const FORM_FIELD_PADDING_Y = '12px'

/**
 * Tailwind classes for Material Tailwind Input/Textarea padding and height.
 * MT `md` defaults to `py-2.5` (10px) and `h-10`; override to 12px vertical padding.
 */
export const FORM_CONTROL_PADDING_CLASS = '!py-3'

export const FORM_CONTROL_CONTAINER_PROPS = {
  className: '!h-auto !min-h-[44px]',
}

/**
 * Label ::before / ::after notch — blue-gray-200 on focus (overrides MT gray-900).
 * Notch segments stay 1px to match the constant input border width.
 *
 * Notch vertical offset: MT defaults to before:mt-[6.4px] / after:mt-[6.5px], tuned for
 * h-10 + py-2.5 + 2px focus borders. We override padding (FORM_CONTROL_PADDING_CLASS),
 * container height (FORM_CONTROL_CONTAINER_PROPS), and border width (1px constant).
 * Re-tune the mt values below if any of those change — the gap is not arbitrary.
 */
export const FORM_CONTROL_LABEL_NOTCH_CLASS = [
  'peer-focus:before:!border-blue-gray-200',
  'peer-focus:after:!border-blue-gray-200',
  'peer-focus:before:!border-t',
  'peer-focus:before:!border-l',
  'peer-focus:after:!border-t',
  'peer-focus:after:!border-r',
  // Notch alignment — coupled to FORM_CONTROL_PADDING_CLASS + FORM_CONTROL_CONTAINER_PROPS
  'peer-focus:before:!mt-[6.17px]',
  'peer-focus:after:!mt-[6.17px]',
  'peer-focus:before:!border-t-blue-gray-200',
  'peer-focus:before:!border-l-blue-gray-200',
  'peer-focus:after:!border-t-blue-gray-200',
  'peer-focus:after:!border-r-blue-gray-200',
].join(' ')

/** Constant 1px border — override MT focus:border-2 to prevent layout shift. */
export const FORM_CONTROL_BORDER_WIDTH_CLASS = [
  '!border',
  'focus:!border',
].join(' ')

/**
 * Focus: transparent top + blue-gray-200 sides/bottom.
 * Side-specific rules avoid painting the top border behind the floated label.
 */
export const FORM_CONTROL_FOCUS_BORDER_CLASS = [
  'focus:!border-t-transparent',
  'focus:placeholder-shown:!border-l-blue-gray-200',
  'focus:placeholder-shown:!border-r-blue-gray-200',
  'focus:placeholder-shown:!border-b-blue-gray-200',
  'focus:[&:not(:placeholder-shown)]:!border-l-blue-gray-200',
  'focus:[&:not(:placeholder-shown)]:!border-r-blue-gray-200',
  'focus:[&:not(:placeholder-shown)]:!border-b-blue-gray-200',
].join(' ')

/**
 * MT defaults hide the floated label when disabled (`peer-disabled:text-transparent`).
 * Keep a muted label so User ID / Email stay identifiable, but clear the notch
 * (::before / ::after) borders — disabled fields use border-0, so a notch looks wrong.
 */
export const FORM_CONTROL_DISABLED_LABEL_CLASS = [
	'peer-disabled:!text-blue-gray-400',
	'peer-disabled:before:!border-transparent',
	'peer-disabled:after:!border-transparent',
].join(' ')

export const FORM_CONTROL_FIELD_CLASS = [
  '!bg-white',
  'disabled:!bg-blue-gray-50',
  '!shadow-none',
  'focus:!shadow-none',
  FORM_CONTROL_BORDER_WIDTH_CLASS,
  'disabled:!border-0',
  FORM_CONTROL_FOCUS_BORDER_CLASS,
  FORM_CONTROL_PADDING_CLASS,
].join(' ')

/**
 * react-select control styles with the same no-shift border behavior.
 *
 * @param {object} base
 * @param {{ isFocused: boolean }} state
 * @param {boolean} floated
 */
export function getFormSelectControlStyles(base, state, floated) {
  const borderColor = state.isFocused
    ? FORM_BORDER_COLOR_FOCUS
    : FORM_BORDER_COLOR_REST

  return {
    ...base,
    minHeight: '44px',
    borderRadius: '7px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor,
    boxShadow: 'none',
    paddingTop: floated ? '4px' : '2px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor,
    },
  }
}
