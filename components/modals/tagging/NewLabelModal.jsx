import React, { useState } from 'react'
import {
	CUSTOM_LABEL_MAX_LENGTH,
	validateCustomLabel,
} from '../../../config/labels'
import FormInput from '../../ui/FormInput'
import ModalCloseButton from '../../ui/ModalCloseButton'
import {
	Button,
	Dialog,
	DialogBody,
	DialogFooter,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'

/**
 * Modal for creating a new custom agency label from Tagging Systems.
 *
 * Mount when visible; Dialog is always open while mounted.
 *
 * @param {Object} props
 * @param {string[]} props.existingLabels
 * @param {function(): void} props.onClose
 * @param {function(string): void} props.onAdd
 */
const NewLabelModal = ({ existingLabels, onClose, onAdd }) => {
	const [label, setLabel] = useState('')
	const existingLower = existingLabels.map((item) => item.toLowerCase())
	const validationError = validateCustomLabel(label)
	const isDuplicate =
		label.trim() && existingLower.includes(label.trim().toLowerCase())

	const handleSubmit = (e) => {
		e.preventDefault()
		const trimmed = label.trim()
		if (!trimmed || validationError || isDuplicate) return
		onAdd(trimmed)
	}

	return (
		<Dialog
			open
			handler={onClose}
			size="xs"
			className="new-label-modal rounded-md">
			<form onSubmit={handleSubmit}>
				<DialogHeader className="justify-between gap-4">
					<Typography variant="h3" color="blue" className="mt-0 mb-0">
						Add New Label
					</Typography>
					<ModalCloseButton onClick={onClose} />
				</DialogHeader>
				<DialogBody>
					<div className="mb-2">
						<FormInput
							id="newLabel"
							type="text"
							label="New label"
							value={label}
							maxLength={CUSTOM_LABEL_MAX_LENGTH}
							required
							onChange={(e) => setLabel(e.target.value)}
						/>
					</div>
					{isDuplicate && (
						<p className="text-red-500 text-sm font-light">
							This label already exists. Please try another name.
						</p>
					)}
					{validationError && !isDuplicate && (
						<p className="text-red-500 text-sm font-light">{validationError}</p>
					)}
				</DialogBody>
				<DialogFooter className="justify-between gap-4">
					<Button type="button" variant="outlined" color="red" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={!label.trim() || Boolean(validationError) || isDuplicate}>
						Add
					</Button>
				</DialogFooter>
			</form>
		</Dialog>
	)
}

export default NewLabelModal
