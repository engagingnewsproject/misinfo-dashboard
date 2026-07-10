import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { CUSTOM_LABEL_DEFAULT_COLOR } from '../../../config/labels'

/**
 * Modal for editing a custom label's color (name is read-only in v1).
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
							Edit Label Color
						</div>
						<button onClick={onClose} className="text-gray-800" type="button">
							<IoClose size={25} />
						</button>
					</div>
					<form onSubmit={handleSave}>
						<div className="mb-4">
							<div className="text-sm font-semibold text-gray-700 mb-1">Label</div>
							<div className="text-sm font-light bg-gray-100 rounded-md py-3 px-3">
								{labelName}
							</div>
						</div>
						<div className="mb-2">
							<label
								htmlFor="label-color"
								className="text-sm font-semibold text-gray-700 mb-1 block">
								Color
							</label>
							<input
								id="label-color"
								type="color"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className="h-10 w-full cursor-pointer rounded-md border border-gray-200"
							/>
						</div>
						<div className="mt-6 flex justify-between">
							<button
								onClick={onClose}
								className="bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline"
								type="button">
								Cancel
							</button>
							<button
								className="bg-white hover:bg-blue-600 hover:text-white text-sm text-blue-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline"
								type="submit">
								Save
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default EditLabelModal
