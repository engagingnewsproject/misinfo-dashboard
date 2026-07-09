import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import {
	CUSTOM_LABEL_MAX_LENGTH,
	validateCustomLabel,
} from '../../../config/labels'
import FormInput from '../../ui/FormInput'

/**
 * Modal for creating a new custom agency label from Tagging Systems.
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
		label.trim() &&
		existingLower.includes(label.trim().toLowerCase())

	const handleSubmit = (e) => {
		e.preventDefault()
		const trimmed = label.trim()
		if (!trimmed || validationError || isDuplicate) return
		onAdd(trimmed)
	}

	return (
		<div>
			<div className="flex z-[9998] justify-center items-center absolute top-0 left-0 w-full h-full bg-black opacity-60" />
			<div
				onClick={onClose}
				className="flex justify-center items-center z-[9999] absolute top-0 left-0 w-full h-full">
				<div
					className="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10"
					onClick={(e) => e.stopPropagation()}>
					<div className="flex justify-between w-full mb-5">
						<div className="text-md font-bold text-blue-600 tracking-wide">
							Add New Label
						</div>
						<button onClick={onClose} className="text-gray-800" type="button">
							<IoClose size={25} />
						</button>
					</div>
					<form onSubmit={handleSubmit}>
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
						<div className="mt-6 flex justify-between">
							<button
								onClick={onClose}
								className="bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline"
								type="button">
								Cancel
							</button>
							<button
								className="bg-white hover:bg-blue-600 hover:text-white text-sm text-blue-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline"
								type="submit"
								disabled={!label.trim() || Boolean(validationError) || isDuplicate}>
								Add
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default NewLabelModal
