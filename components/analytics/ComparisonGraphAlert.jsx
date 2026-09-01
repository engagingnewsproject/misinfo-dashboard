/**
 * @fileoverview Dismissible alert for comparison graph setup and plotted views.
 */
import React from 'react'
import { IoMdClose } from 'react-icons/io'
import { Alert, IconButton } from '@material-tailwind/react'

const COMPARISON_ALERT_CLASS = 'py-2 pl-3 pr-9 text-sm shadow-md !w-auto max-w-xl'

/**
 * Small floating alert (green refresh hint or red validation).
 * Custom close button aligns with compact py-2 padding (MT default close uses top-3).
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the alert is visible (supports MT exit animation)
 * @param {string} props.color - Material Tailwind alert color (e.g. green, red)
 * @param {Function} props.onDismiss - Called when the user closes the alert
 * @param {React.ReactNode} props.children - Alert message content
 * @returns {JSX.Element}
 */
export function ComparisonGraphAlert({ open, color, onDismiss, children }) {
  return (
    <Alert
      open={open}
      color={color}
      className={COMPARISON_ALERT_CLASS}
      action={
        <IconButton
          onClick={onDismiss}
          size="sm"
          variant="text"
          color="white"
          className="!absolute top-1 right-1 shrink-0"
          aria-label="Dismiss alert"
        >
          <IoMdClose size={18} />
        </IconButton>
      }
    >
      {children}
    </Alert>
  )
}
