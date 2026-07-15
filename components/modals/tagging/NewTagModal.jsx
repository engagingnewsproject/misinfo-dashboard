import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import FormInput from '../../ui/FormInput'
import {
	TAG_ID_MAX_LENGTH,
	TAG_LABEL_MAX_LENGTH,
	isOtherTagName,
	validateLabeledTag,
} from '../../../utils/tag-defaults'

/**
 * Modal to add a custom agency Topic/Source tag with EN id + EN/ES labels.
 *
 * @param {{
 *   tagSystems: string[],
 *   tagSystem: number,
 *   list: string[],
 *   setNewTagModal: (open: boolean) => void,
 *   addNewTag: (entry: { id: string, labels: { en: string, es: string } }) => void,
 * }} props
 */
const NewTagModal = ({
	tagSystems,
	tagSystem,
	list,
	setNewTagModal,
	addNewTag,
}) => {
	const existing = (list || []).map((el) => el.toLowerCase())
	const [id, setId] = useState('')
	const [labelEn, setLabelEn] = useState('')
	const [labelEs, setLabelEs] = useState('')
	const [error, setError] = useState('')

	const handleAddNewTag = (e) => {
		e.preventDefault()
		const entry = {
			id: id.trim(),
			labels: { en: labelEn.trim(), es: labelEs.trim() },
		}
		const check = validateLabeledTag(entry)
		if (!check.ok) {
			setError(check.error || 'Invalid tag.')
			return
		}
		if (isOtherTagName(entry.id)) {
			setError('Other is reserved and cannot be added again.')
			return
		}
		if (existing.includes(entry.id.toLowerCase())) {
			setError('This tag already exists, please try another id.')
			return
		}
		addNewTag(entry)
		setNewTagModal(false)
	}

	return (
		<div>
			<div className="flex z-[9998] justify-center items-center absolute top-0 left-0 w-full h-full bg-black opacity-60" />
			<div
				onClick={() => setNewTagModal(false)}
				className="flex justify-center items-center z-[9999] absolute top-0 left-0 w-full h-full">
				<div
					className="flex-col justify-center items-center bg-white w-96 max-w-[95vw] h-auto rounded-2xl py-10 px-10"
					onClick={(e) => e.stopPropagation()}>
					<div className="flex justify-between w-full mb-5">
						<div className="text-md font-bold text-blue-600 tracking-wide">
							{'Add New ' + tagSystems[tagSystem]}
						</div>
						<button
							onClick={() => setNewTagModal(false)}
							className="text-gray-800"
							type="button">
							<IoClose size={25} />
						</button>
					</div>
					<form onSubmit={handleAddNewTag} className="flex flex-col gap-2">
						<FormInput
							id="newTagId"
							type="text"
							label="English id (stored)"
							value={id}
							required
							maxLength={TAG_ID_MAX_LENGTH}
							onChange={(e) => setId(e.target.value)}
						/>
						<FormInput
							id="newTagEn"
							type="text"
							label="Label (EN)"
							value={labelEn}
							required
							maxLength={TAG_LABEL_MAX_LENGTH}
							onChange={(e) => setLabelEn(e.target.value)}
						/>
						<FormInput
							id="newTagEs"
							type="text"
							label="Label (ES)"
							value={labelEs}
							required
							maxLength={TAG_LABEL_MAX_LENGTH}
							onChange={(e) => setLabelEs(e.target.value)}
						/>
						{error && (
							<p className="text-red-500 text-sm font-light">{error}</p>
						)}
						<div className="mt-6 flex justify-between">
							<button
								onClick={() => setNewTagModal(false)}
								className="bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline"
								type="button">
								Cancel
							</button>
							<button
								className="bg-white hover:bg-blue-600 hover:text-white text-sm text-blue-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline"
								type="submit">
								Add
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default NewTagModal
