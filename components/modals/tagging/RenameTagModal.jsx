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
 * Modal to rename/edit a custom agency tag id and EN/ES labels.
 *
 * Mount when visible; Dialog is always open while mounted.
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

	const handleClose = () => setRenameTagModal(false)

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
		<Dialog data-component="RenameTagModal"
			open
			handler={handleClose}
			size="sm"
			className="rename-tag-modal rounded-md">
			<form onSubmit={commit}>
				<DialogHeader className="justify-between gap-4">
					<Typography variant="h3" color="blue" className="mt-0 mb-0">
						Edit tag
					</Typography>
					<ModalCloseButton onClick={handleClose} />
				</DialogHeader>
				<DialogBody className="flex flex-col gap-2">
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
					<Button type="submit">Save</Button>
				</DialogFooter>
			</form>
		</Dialog>
	)
}

export default RenameTagModal
