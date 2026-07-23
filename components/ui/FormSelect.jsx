import React, { useState } from 'react'
import Select from 'react-select'
import { getFormSelectControlStyles } from './formFieldStyles'

// Above MT Dialog overlay (z-index 9999) so portaled menus stay clickable
const MENU_Z_INDEX = 10050

/**
 * react-select with a Material Tailwind–style floating label.
 * Pass the visible field name via `label`; do not use placeholder for the label.
 */
const FormSelect = ({
  label,
  value,
  className = '',
  id,
  styles: stylesProp,
  onFocus,
  onBlur,
  ...selectProps
}) => {
  const [focused, setFocused] = useState(false)
  const floated = focused || !!value

  return (
    <div data-component="FormSelect"
      className={`relative w-full min-w-[200px] ${focused ? 'z-30' : 'z-0'} ${className}`}
    >
      {label && (
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-3 z-[1] bg-white px-1 font-normal transition-all duration-200 ${
            floated
              ? `-top-2 text-[11px] leading-tight ${focused ? 'text-gray-900' : 'text-gray-500'}`
              : 'top-2.5 text-sm leading-tight text-blue-gray-500'
          }`}
        >
          {label}
        </label>
      )}
      <Select
        {...selectProps}
        classNamePrefix="form-select"
        inputId={id}
        value={value}
        placeholder=""
        menuPortalTarget={
          typeof document !== 'undefined' ? document.body : null
        }
        menuPosition="fixed"
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        styles={{
          ...stylesProp,
          control: (base, state) => ({
            ...getFormSelectControlStyles(base, state, floated),
            ...(typeof stylesProp?.control === 'function'
              ? stylesProp.control(base, state)
              : stylesProp?.control),
          }),
          singleValue: (base, state) => ({
            ...base,
            fontSize: '0.875rem', // text-sm / 14px — match FormInput
            ...(typeof stylesProp?.singleValue === 'function'
              ? stylesProp.singleValue(base, state)
              : stylesProp?.singleValue),
          }),
          input: (base, state) => ({
            ...base,
            fontSize: '0.875rem',
            ...(typeof stylesProp?.input === 'function'
              ? stylesProp.input(base, state)
              : stylesProp?.input),
          }),
          placeholder: (base, state) => ({
            ...base,
            fontSize: '0.875rem',
            ...(typeof stylesProp?.placeholder === 'function'
              ? stylesProp.placeholder(base, state)
              : stylesProp?.placeholder),
          }),
          option: (base, state) => ({
            ...base,
            fontSize: '0.875rem', // text-sm / 14px — match closed field
            ...(typeof stylesProp?.option === 'function'
              ? stylesProp.option(base, state)
              : stylesProp?.option),
          }),
          menu: (base, state) => ({
            ...base,
            zIndex: MENU_Z_INDEX,
            ...(typeof stylesProp?.menu === 'function'
              ? stylesProp.menu(base, state)
              : stylesProp?.menu),
          }),
          menuPortal: (base, state) => ({
            ...base,
            zIndex: MENU_Z_INDEX,
            ...(typeof stylesProp?.menuPortal === 'function'
              ? stylesProp.menuPortal(base, state)
              : stylesProp?.menuPortal),
          }),
        }}
      />
    </div>
  )
}

export default FormSelect
