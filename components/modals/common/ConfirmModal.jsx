/**
 * @fileoverview ConfirmModal - Confirmation Dialog Component
 *
 * This component provides a reusable confirmation dialog that can be used
 * throughout the application for actions that require user confirmation,
 * such as deletions, logouts, or data resets. It supports different
 * action types with appropriate icons and styling.
 *
 * @module components/modals/ConfirmModal
 * @requires react
 * @requires react-icons/ri
 * @requires react-icons/bi
 * @requires react-icons/io
 * @requires @material-tailwind/react
 */

import React from 'react'
import { RiDeleteBin2Fill } from 'react-icons/ri'
import { BiLogOut } from 'react-icons/bi'
import { IoMdRefresh } from 'react-icons/io'
import { useTranslation } from 'next-i18next'
import {
	Button,
	Dialog,
	DialogBody,
	DialogFooter,
	Typography,
} from '@material-tailwind/react'

/**
 * ConfirmModal - A reusable confirmation dialog component.
 *
 * This modal displays a confirmation dialog with customizable title, subtitle,
 * and call-to-action text. It supports different action types (Delete, Log out,
 * Reset Report) with appropriate icons. The modal includes both confirm and
 * cancel buttons, with the confirm action being triggered on form submission.
 *
 * Mount when visible (`{show && <ConfirmModal ... />}`); Dialog is always open
 * while mounted, matching existing call sites.
 *
 * @param {Object} props - Component props
 * @param {Function} props.func - Function to execute when user confirms the action
 * @param {string} props.title - Main title text displayed in the modal
 * @param {string} props.subtitle - Subtitle text providing additional context
 * @param {string} props.CTA - Call-to-action text for the confirm button (also determines icon)
 * @param {Function} props.closeModal - Function to close the modal
 * @returns {JSX.Element} Modal dialog with confirmation interface
 * @example
 * <ConfirmModal
 *   func={handleDelete}
 *   title="Delete Report"
 *   subtitle="This action cannot be undone."
 *   CTA="Delete"
 *   closeModal={setShowModal}
 * />
 */
const ConfirmModal = ({ func, title, subtitle, CTA, closeModal }) => {
	const { t } = useTranslation('Profile')

	/**
	 * Handles form submission when user confirms the action.
	 *
	 * @param {Event} e - Form submission event
	 */
	const handleSubmit = (e) => {
		e.preventDefault()
		func(e)
	}

	/**
	 * Handles cancellation (Cancel button, Escape, or outside click).
	 */
	const handleCancel = () => {
		closeModal(false)
	}

	/**
	 * Renders the appropriate icon based on the CTA type.
	 *
	 * @returns {JSX.Element|null} Icon component for the current action type
	 */
	const renderIcon = () => {
		switch (CTA) {
			case 'Delete':
				return <RiDeleteBin2Fill className="text-[#2E3B4E]" size={30} />
			case 'Log out':
				return <BiLogOut className="text-[#2E3B4E]" size={30} />
			case 'Reset Report':
				return <IoMdRefresh className="text-[#2E3B4E]" size={30} />
			default:
				return null
		}
	}

	return (
		<Dialog
			open
			handler={handleCancel}
			size="xs"
			className="confirm-modal-root confirm-modal rounded-md">
			<form onSubmit={handleSubmit}>
				<DialogBody className="grid justify-items-center">
					{renderIcon()}
					<div className="flex-col mt-3 mb-2 text-center tracking-wide">
						<Typography
							variant="h3"
							color="blue"
							className="mt-0 mb-2 text-center">
							{title}
						</Typography>
						<Typography variant="small" className="text-center">
							{subtitle}
						</Typography>
					</div>
				</DialogBody>
				<DialogFooter className="justify-center gap-4">
					<Button
						type="button"
						onClick={handleCancel}
						variant="outlined"
						color="red">
						{t('cancel')}
					</Button>
					<Button type="submit" autoFocus>
						{CTA}
					</Button>
				</DialogFooter>
			</form>
		</Dialog>
	)
}

export default ConfirmModal
