import React, { useState } from 'react'
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
import {
	TAG_ID_MAX_LENGTH,
	TAG_LABEL_MAX_LENGTH,
	isOtherTagName,
	validateLabeledTag,
} from '../../../utils/tag-defaults'

/**
 * Modal to add a custom agency Topic/Source tag with EN id + EN/ES labels.
 *
 * Mount when visible; Dialog is always open while mounted.
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

	const handleClose = () => setNewTagModal(false)

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
		<Dialog data-component="NewTagModal"
			open
			handler={handleClose}
			size="sm"
			className="new-tag-modal rounded-md">
			<form onSubmit={handleAddNewTag}>
				<DialogHeader className="justify-between gap-4">
					<Typography variant="h3" color="blue" className="mt-0 mb-0">
						{'Add New ' + tagSystems[tagSystem]}
					</Typography>
					<ModalCloseButton onClick={handleClose} />
				</DialogHeader>
				<DialogBody className="flex flex-col gap-2">
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
						maxLength={TAG_LABEL_MAX_LENGTH}
						onChange={(e) => setLabelEs(e.target.value)}
					/>
					{error && (
						<p className="text-red-500 text-sm font-light">{error}</p>
					)}
				</DialogBody>
				<DialogFooter className="justify-between gap-4">
					<Button type="button" variant="outlined" color="red" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit">Add</Button>
				</DialogFooter>
			</form>
		</Dialog>
	)
}

export default NewTagModal
