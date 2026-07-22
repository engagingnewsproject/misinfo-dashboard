import React, { useState } from 'react'
import { CUSTOM_LABEL_DEFAULT_COLOR } from '../../../config/labels'
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
 * Modal for editing a custom label's color (name is read-only in v1).
 *
 * Mount when visible; Dialog is always open while mounted.
 *
 * @param {Object} props
 * @param {string} props.labelName
 * @param {string} [props.currentColor]
 * @param {function(string): void} props.onSave
 * @param {function(): void} props.onClose
 */
const EditLabelModal = ({ labelName, currentColor, onSave, onClose }) => {
	const [color, setColor] = useState(currentColor || CUSTOM_LABEL_DEFAULT_COLOR)

	const handleSave = (e) => {
		e.preventDefault()
		onSave(color)
	}

	return (
		<Dialog data-component="EditLabelModal"
			open
			handler={onClose}
			size="xs"
			className="edit-label-modal rounded-md">
			<form onSubmit={handleSave}>
				<DialogHeader className="justify-between gap-4">
					<Typography variant="h3" color="blue" className="mt-0 mb-0">
						Edit Label Color
					</Typography>
					<ModalCloseButton onClick={onClose} />
				</DialogHeader>
				<DialogBody>
					<div className="mb-4">
						<Typography variant="small" className="font-semibold text-gray-700 mb-1">
							Label
						</Typography>
						<div className="text-sm font-light bg-gray-100 rounded-md py-3 px-3">
							{labelName}
						</div>
					</div>
					<div className="mb-2">
						<label htmlFor="label-color" className="block mb-1">
							<Typography variant="small" className="font-semibold text-gray-700 mb-0">
								Color
							</Typography>
						</label>
						<input
							id="label-color"
							type="color"
							value={color}
							onChange={(e) => setColor(e.target.value)}
							className="h-10 w-full cursor-pointer rounded-md border border-gray-200"
						/>
					</div>
				</DialogBody>
				<DialogFooter className="justify-between gap-4">
					<Button type="button" variant="outlined" color="red" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">Save</Button>
				</DialogFooter>
			</form>
		</Dialog>
	)
}

export default EditLabelModal
