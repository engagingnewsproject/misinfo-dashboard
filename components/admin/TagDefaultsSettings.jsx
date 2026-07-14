/**
 * Admin UI for editing global Topic/Source tag defaults.
 * Saves to tagSystems/defaults and propagates required tags to all agencies.
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
	ensureOtherInRequired,
	fetchTagDefaults,
	isOtherTagName,
	saveAndPropagateTagDefaults,
	validateTagDefaults,
} from '../../utils/tag-defaults'

const MAX_ACTIVE_TOPICS = maxActiveTags[1]
const MAX_ACTIVE_SOURCES = maxActiveTags[2]
const TAG_MAX_LENGTH = 20

/**
 * One required-tag list editor (Topic or Source).
 *
 * @param {{
 *   title: string,
 *   maxActive: number,
 *   tags: string[],
 *   setTags: (next: string[]) => void,
 * }} props
 */
function RequiredTagListEditor({ title, maxActive, tags, setTags }) {
	const [draft, setDraft] = useState('')
	const [editing, setEditing] = useState(null)
	const [editValue, setEditValue] = useState('')
	const [localError, setLocalError] = useState('')

	const handleAdd = (e) => {
		e.preventDefault()
		const value = draft.trim()
		if (!value) return
		if (value.length > TAG_MAX_LENGTH) {
			setLocalError(`Tags cannot exceed ${TAG_MAX_LENGTH} characters.`)
			return
		}
		if (isOtherTagName(value)) {
			setLocalError('Other is already included and cannot be added again.')
			return
		}
		const withoutOther = tags.filter((t) => !isOtherTagName(t))
		if (withoutOther.some((t) => t.toLowerCase() === value.toLowerCase())) {
			setLocalError('This tag already exists.')
			return
		}
		if (tags.length >= maxActive) {
			setLocalError(`Maximum ${maxActive} defaults (including Other).`)
			return
		}
		setTags(ensureOtherInRequired([...withoutOther, value]))
		setDraft('')
		setLocalError('')
	}

	const handleRemove = (tag) => {
		if (isOtherTagName(tag)) return
		setTags(ensureOtherInRequired(tags.filter((t) => t !== tag)))
		setLocalError('')
	}

	const startRename = (tag) => {
		if (isOtherTagName(tag)) return
		setEditing(tag)
		setEditValue(tag)
		setLocalError('')
	}

	const commitRename = (e) => {
		e.preventDefault()
		if (!editing) return
		const value = editValue.trim()
		if (!value || isOtherTagName(value)) {
			setLocalError('Invalid tag name.')
			return
		}
		if (value.length > TAG_MAX_LENGTH) {
			setLocalError(`Tags cannot exceed ${TAG_MAX_LENGTH} characters.`)
			return
		}
		const conflict = tags.some(
			(t) => t !== editing && t.toLowerCase() === value.toLowerCase(),
		)
		if (conflict) {
			setLocalError('This tag already exists.')
			return
		}
		setTags(
			ensureOtherInRequired(tags.map((t) => (t === editing ? value : t))),
		)
		setEditing(null)
		setEditValue('')
		setLocalError('')
	}

	return (
		<div className="flex-1 min-w-[240px]">
			<div className="flex items-baseline justify-between gap-2 mb-2">
				<div className="font-medium text-blue-600">{title}</div>
				<div className="text-xs text-gray-500">
					Maximum: {maxActive - 1} Tags (+Other)
				</div>
			</div>

			<ul className="mb-3 space-y-1">
				{tags.map((tag) => {
					const locked = isOtherTagName(tag)
					if (editing === tag) {
						return (
							<li key={tag} className="flex items-center gap-2">
								<form
									onSubmit={commitRename}
									className="flex flex-1 items-center gap-2">
									<FormInput
										id={`edit-${title}-${tag}`}
										type="text"
										label="Rename tag"
										value={editValue}
										onChange={(e) => setEditValue(e.target.value)}
										required
									/>
									<Button type="submit" size="sm" color="blue">
										Save
									</Button>
									<Button
										type="button"
										size="sm"
										variant="outlined"
										color="gray"
										onClick={() => setEditing(null)}>
										Cancel
									</Button>
								</form>
							</li>
						)
					}
					return (
						<li
							key={tag}
							className="flex items-center justify-between gap-2 rounded-lg bg-blue-gray-50 px-3 py-2 text-sm">
							<span>
								{locked ? 'Other*' : tag}
							</span>
							{!locked && (
								<span className="flex items-center gap-1">
									<button
										type="button"
										className="text-blue-600 hover:text-blue-800 p-1"
										aria-label={`Rename ${tag}`}
										onClick={() => startRename(tag)}>
										<MdModeEditOutline size={18} />
									</button>
									<button
										type="button"
										className="text-red-500 hover:text-red-700 p-1"
										aria-label={`Remove ${tag}`}
										onClick={() => handleRemove(tag)}>
										<TiDelete size={20} />
									</button>
								</span>
							)}
						</li>
					)
				})}
			</ul>

			<form onSubmit={handleAdd} className="flex items-end gap-2">
				<div className="flex-1">
					<FormInput
						id={`add-${title}`}
						type="text"
						label={`New ${title.replace(' Default', '')}`}
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
					/>
				</div>
				<Button type="submit" size="sm" color="blue" className="flex items-center gap-1">
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

	if (loading) {
		return (
			<div className="mb-8 p-4 bg-white rounded-lg border border-blue-gray-100">
				<Typography>Loading global tag defaults…</Typography>
			</div>
		)
	}

	return (
		<div className="mb-8 p-4 bg-white rounded-lg border border-blue-gray-100">
			<div className={globalStyles.heading.h1.blue}>Global Tag Defaults</div>
			<p className="text-sm text-gray-600 mb-4">
				These Topic and Source tags are required for every newsroom. Agencies
				cannot deactivate, rename, or remove them. Saving adds any new required
				tags to all agencies; retired tags already on agencies are left in place.
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
				* &quot;Other&quot; is a default that cannot be edited or removed.
			</p>

			<div className="flex flex-wrap items-center gap-3">
				<Button
					color="blue"
					disabled={busy}
					onClick={handleSaveClick}>
					{busy ? 'Saving…' : 'Save & apply to all agencies'}
				</Button>
				{status && <p className="text-sm text-green-700">{status}</p>}
				{error && <p className="text-sm text-red-600">{error}</p>}
			</div>

			{confirmOpen && (
				<ConfirmModal
					func={handleConfirmSave}
					title="Apply tag defaults?"
					subtitle="This will add these required tags to all agencies. Existing custom or retired tags are kept."
					CTA="Apply"
					closeModal={setConfirmOpen}
				/>
			)}
		</div>
	)
}

export default TagDefaultsSettings
