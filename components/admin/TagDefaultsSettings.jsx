/**
 * Admin UI for editing global Topic/Source tag defaults with EN/ES labels.
 * Saves to tagSystems/defaults and propagates required ids to all agencies.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Button, Typography } from '@material-tailwind/react'
import { FaPlus } from 'react-icons/fa'
import { MdModeEditOutline } from 'react-icons/md'
import { TiDelete } from 'react-icons/ti'
import { useAuth } from '../../context/AuthContext'
import globalStyles from '../../styles/globalStyles'
import FormInput from '../ui/FormInput'
import ConfirmModal from '../modals/common/ConfirmModal'
import { maxActiveTags } from '../../config/tagSystems'
import {
	TAG_ID_MAX_LENGTH,
	TAG_LABEL_MAX_LENGTH,
	ensureOtherInLabeledRequired,
	fetchTagDefaults,
	isOtherTagName,
	normalizeOtherAliasesForAllAgencies,
	saveAndPropagateTagDefaults,
	validateLabeledTag,
	validateTagDefaults,
} from '../../utils/tag-defaults'

const MAX_ACTIVE_TOPICS = maxActiveTags[1]
const MAX_ACTIVE_SOURCES = maxActiveTags[2]

const emptyDraft = () => ({
	id: '',
	labels: { en: '', es: '' },
})

/**
 * One required-tag list editor (Topic or Source) with bilingual labels.
 *
 * @param {{
 *   title: string,
 *   maxActive: number,
 *   tags: import('../../utils/tag-defaults').LabeledTag[],
 *   setTags: (next: import('../../utils/tag-defaults').LabeledTag[]) => void,
 * }} props
 */
function RequiredTagListEditor({ title, maxActive, tags, setTags }) {
	const [draft, setDraft] = useState(emptyDraft)
	const [editingId, setEditingId] = useState(null)
	const [editValue, setEditValue] = useState(emptyDraft)
	const [localError, setLocalError] = useState('')

	const handleAdd = (e) => {
		e.preventDefault()
		const entry = {
			id: draft.id.trim(),
			labels: {
				en: draft.labels.en.trim(),
				es: draft.labels.es.trim(),
			},
		}
		const check = validateLabeledTag(entry)
		if (!check.ok) {
			setLocalError(check.error || 'Invalid tag.')
			return
		}
		if (isOtherTagName(entry.id)) {
			setLocalError('Other is already included and cannot be added again.')
			return
		}
		const withoutOther = tags.filter((t) => !isOtherTagName(t.id))
		if (
			withoutOther.some(
				(t) => t.id.toLowerCase() === entry.id.toLowerCase(),
			)
		) {
			setLocalError('This tag id already exists.')
			return
		}
		if (tags.length >= maxActive) {
			setLocalError(`Maximum ${maxActive} defaults (including Other).`)
			return
		}
		setTags(ensureOtherInLabeledRequired([...withoutOther, entry]))
		setDraft(emptyDraft())
		setLocalError('')
	}

	const handleRemove = (tagId) => {
		if (isOtherTagName(tagId)) return
		setTags(
			ensureOtherInLabeledRequired(tags.filter((t) => t.id !== tagId)),
		)
		setLocalError('')
	}

	const startEdit = (tag) => {
		setEditingId(tag.id)
		setEditValue({
			id: tag.id,
			labels: { en: tag.labels.en, es: tag.labels.es },
		})
		setLocalError('')
	}

	const commitEdit = (e) => {
		e.preventDefault()
		if (!editingId) return
		const locked = isOtherTagName(editingId)
		const entry = {
			id: locked ? 'Other' : editValue.id.trim(),
			labels: {
				en: editValue.labels.en.trim(),
				es: editValue.labels.es.trim(),
			},
		}
		const check = validateLabeledTag(entry)
		if (!check.ok) {
			setLocalError(check.error || 'Invalid tag.')
			return
		}
		if (!locked && isOtherTagName(entry.id)) {
			setLocalError('Cannot rename a tag to Other.')
			return
		}
		const conflict = tags.some(
			(t) =>
				t.id !== editingId &&
				t.id.toLowerCase() === entry.id.toLowerCase(),
		)
		if (conflict) {
			setLocalError('This tag id already exists.')
			return
		}
		if (!locked && entry.id !== editingId) {
			const ok = window.confirm(
				`Change id from "${editingId}" to "${entry.id}"?\n\nExisting agency tag lists and reports still using the old id will not be remapped automatically.`,
			)
			if (!ok) return
		}
		setTags(
			ensureOtherInLabeledRequired(
				tags.map((t) => (t.id === editingId ? entry : t)),
			),
		)
		setEditingId(null)
		setEditValue(emptyDraft())
		setLocalError('')
	}

	return (
		<div className="flex-1 min-w-[280px]">
			<div className="flex items-baseline justify-between gap-2 mb-2">
				<div className="font-medium text-[#2E3B4E]">{title}</div>
				<div className="text-xs text-gray-500">
					Maximum: {maxActive - 1} Tags (+Other)
				</div>
			</div>

			<ul className="mb-3 space-y-2">
				{tags.map((tag) => {
					const locked = isOtherTagName(tag.id)
					if (editingId === tag.id) {
						return (
							<li
								key={tag.id}
								className="rounded-md bg-blue-gray-50 p-3">
								<form
									onSubmit={commitEdit}
									className="flex flex-col gap-2">
									{!locked && (
										<FormInput
											id={`edit-id-${title}-${tag.id}`}
											type="text"
											label="English id (stored)"
											value={editValue.id}
											onChange={(e) =>
												setEditValue((prev) => ({
													...prev,
													id: e.target.value,
												}))
											}
											maxLength={TAG_ID_MAX_LENGTH}
											required
										/>
									)}
									{locked && (
										<p className="text-xs text-gray-500">
											Id: Other (locked)
										</p>
									)}
									<FormInput
										id={`edit-en-${title}-${tag.id}`}
										type="text"
										label="Label (EN)"
										value={editValue.labels.en}
										onChange={(e) =>
											setEditValue((prev) => ({
												...prev,
												labels: {
													...prev.labels,
													en: e.target.value,
												},
											}))
										}
										maxLength={TAG_LABEL_MAX_LENGTH}
										required
									/>
									<FormInput
										id={`edit-es-${title}-${tag.id}`}
										type="text"
										label="Label (ES)"
										value={editValue.labels.es}
										onChange={(e) =>
											setEditValue((prev) => ({
												...prev,
												labels: {
													...prev.labels,
													es: e.target.value,
												},
											}))
										}
										maxLength={TAG_LABEL_MAX_LENGTH}
										required
									/>
									<div className="flex gap-2">
										<Button type="submit" size="sm" color="blue">
											Save
										</Button>
										<Button
											type="button"
											size="sm"
											variant="outlined"
											color="gray"
											onClick={() => setEditingId(null)}>
											Cancel
										</Button>
									</div>
								</form>
							</li>
						)
					}
					return (
						<li
							key={tag.id}
							className="flex items-start justify-between gap-2 rounded-md bg-blue-gray-50 px-3 py-2 text-sm">
							<div>
								<div className="font-medium">
									{tag.labels.en}
									{locked ? ' *' : ''}
								</div>
								<div className="text-gray-600">
									ES: {tag.labels.es}
								</div>
								<div className="text-xs text-gray-400">
									id: {tag.id}
								</div>
							</div>
							<span className="flex items-center gap-1 shrink-0">
								<button
									type="button"
									className="text-[#2E3B4E] hover:text-blue-800 p-1"
									aria-label={`Edit ${tag.id}`}
									onClick={() => startEdit(tag)}>
									<MdModeEditOutline size={18} />
								</button>
								{!locked && (
									<button
										type="button"
										className="text-red-500 hover:text-red-700 p-1"
										aria-label={`Remove ${tag.id}`}
										onClick={() => handleRemove(tag.id)}>
										<TiDelete size={20} />
									</button>
								)}
							</span>
						</li>
					)
				})}
			</ul>

			<form onSubmit={handleAdd} className="flex flex-col gap-2">
				<FormInput
					id={`add-id-${title}`}
					type="text"
					label="English id (stored)"
					value={draft.id}
					onChange={(e) =>
						setDraft((prev) => ({ ...prev, id: e.target.value }))
					}
					maxLength={TAG_ID_MAX_LENGTH}
				/>
				<FormInput
					id={`add-en-${title}`}
					type="text"
					label="Label (EN)"
					value={draft.labels.en}
					onChange={(e) =>
						setDraft((prev) => ({
							...prev,
							labels: { ...prev.labels, en: e.target.value },
						}))
					}
					maxLength={TAG_LABEL_MAX_LENGTH}
				/>
				<FormInput
					id={`add-es-${title}`}
					type="text"
					label="Label (ES)"
					value={draft.labels.es}
					onChange={(e) =>
						setDraft((prev) => ({
							...prev,
							labels: { ...prev.labels, es: e.target.value },
						}))
					}
					maxLength={TAG_LABEL_MAX_LENGTH}
				/>
				<Button
					type="submit"
					size="sm"
					color="blue"
					className="flex items-center gap-1 self-start">
					<FaPlus size={12} /> Add
				</Button>
			</form>
			{localError && (
				<p className="mt-2 text-sm text-red-500 font-light">{localError}</p>
			)}
		</div>
	)
}

/**
 * Admin-only panel to edit and propagate global Topic/Source defaults.
 *
 * @returns {JSX.Element}
 */
const TagDefaultsSettings = () => {
	const { user } = useAuth()
	const [topicRequired, setTopicRequired] = useState([])
	const [sourceRequired, setSourceRequired] = useState([])
	const [loading, setLoading] = useState(true)
	const [busy, setBusy] = useState(false)
	const [status, setStatus] = useState('')
	const [error, setError] = useState('')
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [normalizeConfirmOpen, setNormalizeConfirmOpen] = useState(false)

	const loadDefaults = useCallback(async () => {
		setLoading(true)
		setError('')
		try {
			const defaults = await fetchTagDefaults()
			setTopicRequired(defaults.Topic.required)
			setSourceRequired(defaults.Source.required)
		} catch (err) {
			console.error(err)
			setError('Could not load tag defaults.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadDefaults()
	}, [loadDefaults])

	const handleSaveClick = (e) => {
		e.preventDefault()
		const validation = validateTagDefaults(topicRequired, sourceRequired)
		if (!validation.ok) {
			setError(validation.error || 'Invalid defaults.')
			return
		}
		setError('')
		setConfirmOpen(true)
	}

	const handleConfirmSave = async () => {
		setConfirmOpen(false)
		setBusy(true)
		setStatus('')
		setError('')
		try {
			const { updated } = await saveAndPropagateTagDefaults({
				topicRequired,
				sourceRequired,
				userId: user?.accountId || user?.uid || null,
			})
			setStatus(
				`Defaults saved and applied to ${updated} agency tag document(s). Existing custom or retired tags were kept.`,
			)
			await loadDefaults()
		} catch (err) {
			console.error(err)
			setError(err?.message || 'Failed to save and propagate defaults.')
		} finally {
			setBusy(false)
		}
	}

	const handleConfirmNormalize = async () => {
		setNormalizeConfirmOpen(false)
		setBusy(true)
		setStatus('')
		setError('')
		try {
			const { updated, scanned } =
				await normalizeOtherAliasesForAllAgencies()
			setStatus(
				`Normalized Other aliases on ${updated} of ${scanned} agency tag document(s).`,
			)
		} catch (err) {
			console.error(err)
			setError(err?.message || 'Failed to normalize Other aliases.')
		} finally {
			setBusy(false)
		}
	}

	if (loading) {
		return (
			<div data-component="TagDefaultsSettings" className="mb-8 p-6 bg-white rounded-md border border-blue-gray-100">
				<Typography>Loading global tag defaults…</Typography>
			</div>
		)
	}

	return (
		<div data-component="TagDefaultsSettings" className="mb-8 p-6 bg-white rounded-md border border-blue-gray-100">
			<div className={globalStyles.heading.h1.blue}>Global Tag Defaults</div>
			<p className="text-sm text-gray-600 mb-4">
				These Topic and Source tags are required for every newsroom. Agencies
				cannot deactivate, rename, or remove them. Enter an English id (stored
				in reports) plus English and Spanish display labels. Saving adds any
				new required ids to all agencies; retired tags already on agencies are
				left in place.
			</p>

			<div className="flex flex-col lg:flex-row gap-8 mb-4">
				<RequiredTagListEditor
					title="Topic Defaults"
					maxActive={MAX_ACTIVE_TOPICS}
					tags={topicRequired}
					setTags={setTopicRequired}
				/>
				<RequiredTagListEditor
					title="Source Defaults"
					maxActive={MAX_ACTIVE_SOURCES}
					tags={sourceRequired}
					setTags={setSourceRequired}
				/>
			</div>

			<p className="text-xs text-gray-500 mb-4">
				* &quot;Other&quot; is required and its id cannot be changed. Both EN
				and ES labels are required for every tag before save.
			</p>

			<div className="flex flex-wrap items-center gap-3">
				<Button color="blue" disabled={busy} onClick={handleSaveClick}>
					{busy ? 'Working…' : 'Save & apply to all agencies'}
				</Button>
				<Button
					color="blue"
					variant="outlined"
					disabled={busy}
					onClick={() => setNormalizeConfirmOpen(true)}>
					Normalize Other aliases
				</Button>
				{status && <p className="text-sm text-green-700">{status}</p>}
				{error && <p className="text-sm text-red-600">{error}</p>}
			</div>

			{confirmOpen && (
				<ConfirmModal
					func={handleConfirmSave}
					title="Apply tag defaults?"
					subtitle="This will add these required tag ids to all agencies and save EN/ES labels. Existing custom or retired tags are kept."
					CTA="Apply"
					closeModal={setConfirmOpen}
				/>
			)}
			{normalizeConfirmOpen && (
				<ConfirmModal
					func={handleConfirmNormalize}
					title="Normalize Other aliases?"
					subtitle="This removes legacy Other/Otro (and similar) from every agency Topic/Source list and active tags, leaving a single Other. Safe to run more than once."
					CTA="Normalize"
					closeModal={setNormalizeConfirmOpen}
				/>
			)}
		</div>
	)
}

export default TagDefaultsSettings
