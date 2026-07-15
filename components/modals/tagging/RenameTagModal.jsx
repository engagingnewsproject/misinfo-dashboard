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
 * Modal to rename/edit a custom agency tag id and EN/ES labels.
 *
 * @param {{
 *   replaceTag: (entry: { id: string, labels: { en: string, es: string } }) => void,
 *   selected: string,
 *   list: string[],
 *   setRenameTagModal: (open: boolean) => void,
 *   existingLabels?: { en?: string, es?: string },
 * }} props
 */
const RenameTagModal = ({
	replaceTag,
	selected,
	list,
	setRenameTagModal,
	existingLabels,
}) => {
	const existing = (list || [])
		.filter((el) => el.toLowerCase() !== String(selected || '').toLowerCase())
		.map((el) => el.toLowerCase())

	const [id, setId] = useState(selected || '')
	const [labelEn, setLabelEn] = useState(existingLabels?.en || selected || '')
	const [labelEs, setLabelEs] = useState(existingLabels?.es || '')
	const [error, setError] = useState('')

	const commit = (e) => {
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
			setError('Cannot rename a tag to Other.')
			return
		}
		if (existing.includes(entry.id.toLowerCase())) {
			setError('This tag id already exists.')
			return
		}
		if (entry.id !== selected) {
			const ok = window.confirm(
				`Change id from "${selected}" to "${entry.id}"?\n\nExisting reports still using the old id will not be remapped automatically.`,
			)
			if (!ok) return
		}
		replaceTag(entry)
		setRenameTagModal(false)
	}

	return (
		<div>
			<div className="flex justify-center items-center z-[9998] absolute top-0 left-0 w-full h-full bg-black opacity-60" />
			<div
				onClick={() => setRenameTagModal(false)}
				className="flex justify-center items-center z-[9999] absolute top-0 left-0 w-full h-full">
				<div
					onClick={(e) => e.stopPropagation()}
					className="flex-col justify-center items-center bg-white w-96 max-w-[95vw] h-auto rounded-2xl py-10 px-10">
					<div className="flex justify-between w-full mb-5">
						<div className="text-md font-bold text-blue-600 tracking-wide">
							Edit tag
						</div>
						<button
							onClick={() => setRenameTagModal(false)}
							className="text-gray-800"
							type="button">
							<IoClose size={25} />
						</button>
					</div>
					<form onSubmit={commit} className="flex flex-col gap-2">
						<FormInput
							id="renameTagId"
							type="text"
							label="English id (stored)"
							value={id}
							required
							maxLength={TAG_ID_MAX_LENGTH}
							onChange={(e) => setId(e.target.value)}
						/>
						<FormInput
							id="renameTagEn"
							type="text"
							label="Label (EN)"
							value={labelEn}
							required
							maxLength={TAG_LABEL_MAX_LENGTH}
							onChange={(e) => setLabelEn(e.target.value)}
						/>
						<FormInput
							id="renameTagEs"
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
								onClick={() => setRenameTagModal(false)}
								className="bg-white hover:bg-gray-500 hover:text-white text-sm text-gray-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline"
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

export default RenameTagModal
