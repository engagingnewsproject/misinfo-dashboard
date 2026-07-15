/**
 * @fileoverview TagSystem Component - Tag management interface for agencies and admins
 */

import React, { useState, useEffect, useMemo } from 'react'
import { tagSystems, maxActiveTags } from '../../config/tagSystems'
import {
	APP_WIDE_LABELS,
	getLabelColor,
	isAppWideLabel,
	isCustomLabel,
	MAX_CUSTOM_LABELS,
} from '../../config/labels'
import NewTagModal from '../modals/tagging/NewTagModal'
import RenameTagModal from '../modals/tagging/RenameTagModal'
import EditLabelModal from '../modals/tagging/EditLabelModal'
import NewLabelModal from '../modals/tagging/NewLabelModal'
import ConfirmModal from '../modals/common/ConfirmModal'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { AiOutlineSearch } from 'react-icons/ai'
import { FaPlus } from 'react-icons/fa'
import { GoDotFill } from 'react-icons/go'
import { MdModeEditOutline } from 'react-icons/md'
import { TiDelete } from 'react-icons/ti'
import { IoIosRadioButtonOn } from 'react-icons/io'
import { setDoc, getDoc, doc } from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../config/firebase'
import Image from 'next/image'
import {
	countReportsWithLabel,
	deleteAgencyCustomLabel,
	addAgencyCustomLabel,
	fetchAgencyNameById,
	updateAgencyLabelColor,
} from '../../utils/label-tags'
import {
	buildAgencyTagsPayload,
	fetchTagDefaults,
	getRequiredIds,
	isOtherTagName,
	isRequiredTag,
} from '../../utils/tag-defaults'

const maxTags = maxActiveTags

const setData = async (tagSystem, list, active, agency) => {
	const docRef = doc(db, 'tags', agency)
	const docSnap = await getDoc(docRef)
	const key = tagSystems[tagSystem]

	if (docSnap.exists()) {
		const existing = docSnap.data()
		const existingSlice = existing[key] || {}

		await setDoc(doc(db, 'tags', agency), {
			...existing,
			[key]: {
				...existingSlice,
				list,
				active,
			},
		})
	} else {
		await setDoc(doc(db, 'tags', agency), {
			[key]: { list, active },
		})
	}
}

const TagSystem = ({ tagSystem, setTagSystem, agencyID }) => {
	const [list, setList] = useState([])
	const [active, setActive] = useState([])
	const [labelColors, setLabelColors] = useState({})
	const [agencyName, setAgencyName] = useState('')
	const [requiredTags, setRequiredTags] = useState([])

	const [selected, setSelected] = useState('')
	const [search, setSearch] = useState('')
	const [searchResult, setSearchResult] = useState([])

	const [newTagModal, setNewTagModal] = useState(false)
	const [renameModal, setRenameTagModal] = useState(false)
	const [deleteModal, setDeleteModal] = useState(false)
	const [editLabelModal, setEditLabelModal] = useState(false)
	const [newLabelModal, setNewLabelModal] = useState(false)
	const [deleteSubtitle, setDeleteSubtitle] = useState('')
	const [maxTagsError, setMaxTagsError] = useState(false)
	const [maxLabelsError, setMaxLabelsError] = useState(false)

	const tags = ['Topic', 'Source', 'Labels']
	const { customClaims } = useAuth()
	const isLabelsMode = tagSystem === 3

	const allDisplayLabels = useMemo(() => {
		const merged = [...APP_WIDE_LABELS]
		list.forEach((label) => {
			if (!merged.includes(label)) merged.push(label)
		})
		return merged
	}, [list])

	const customLabels = useMemo(
		() => list.filter((label) => isCustomLabel(label)),
		[list],
	)

	const filteredDisplayLabels = useMemo(() => {
		const term = search.trim().toLowerCase()
		if (!term) return allDisplayLabels
		return allDisplayLabels.filter((label) => label.toLowerCase().includes(term))
	}, [allDisplayLabels, search])

	const filteredCustomLabels = useMemo(() => {
		const term = search.trim().toLowerCase()
		if (!term) return customLabels
		return customLabels.filter((label) => label.toLowerCase().includes(term))
	}, [customLabels, search])

	const selectedIsRequired =
		!isLabelsMode && selected && isRequiredTag(selected, requiredTags)

	const applyTagsToState = (tagsData) => {
		setList(tagsData?.list || [])
		const activeList = [...(tagsData?.active || [])]
		activeList.sort((a, b) => {
			if (isOtherTagName(a)) return 1
			if (isOtherTagName(b)) return -1
			return a.localeCompare(b)
		})
		setActive(activeList)
		if (isLabelsMode) {
			setLabelColors(tagsData?.colors || {})
		}
	}

	const getData = async (id) => {
		if (!id) return

		const name = await fetchAgencyNameById(id)
		setAgencyName(name || '')

		const defaults = await fetchTagDefaults()
		if (tagSystem === 1) {
			setRequiredTags(getRequiredIds(defaults, 'Topic'))
		} else if (tagSystem === 2) {
			setRequiredTags(getRequiredIds(defaults, 'Source'))
		} else {
			setRequiredTags([])
		}

		const docRef = doc(db, 'tags', id)
		const docSnap = await getDoc(docRef)

		if (docSnap.exists()) {
			applyTagsToState(docSnap.get(tags[tagSystem - 1]))
		} else {
			const payload = await buildAgencyTagsPayload(defaults)
			await setDoc(docRef, payload)
			applyTagsToState(payload[tags[tagSystem - 1]])
		}
	}

	useEffect(() => {
		getData(agencyID)
	}, [agencyID, tagSystem])

	const updateTag = (e, updateType) => {
		if (isRequiredTag(search, requiredTags) || isRequiredTag(selected, requiredTags)) {
			if (
				updateType === 'deactivate' ||
				updateType === 'delete' ||
				updateType === 'rename'
			) {
				return
			}
		}

		switch (updateType) {
			case 'activate':
				if (active.length === maxTags[tagSystem]) {
					setMaxTagsError(true)
				} else {
					active.push(search)
				}
				setSelected('')
				break
			case 'deactivate':
				if (active?.includes?.(search)) {
					active.splice(active.indexOf(search), 1)
				}
				setMaxTagsError(false)
				setSelected('')
				break
			case 'delete':
				setSearchResult([])
				setDeleteSubtitle(
					'You will permanently remove this tag. You can not undo this action.',
				)
				setDeleteModal(true)
				break
			case 'rename':
				setSearchResult([])
				setRenameTagModal(true)
				break
		}
		setData(tagSystem, list, active, agencyID)
	}

	const deleteTag = () => {
		if (isLabelsMode) return
		if (isRequiredTag(selected, requiredTags)) {
			setDeleteModal(false)
			return
		}

		if (list?.includes?.(selected)) {
			list.splice(list.indexOf(selected), 1)
		}
		if (active?.includes?.(selected)) {
			active.splice(active.indexOf(selected), 1)
		}
		setSelected('')
		setData(tagSystem, list, active, agencyID)
		setDeleteModal(false)
	}

	const deleteLabel = async () => {
		await deleteAgencyCustomLabel(agencyID, selected)
		setSelected('')
		setDeleteModal(false)
		await getData(agencyID)
	}

	const handleLabelDeletePrompt = async (e) => {
		e.preventDefault()
		const count = await countReportsWithLabel(agencyName, selected)
		if (count > 0) {
			const reportWord = count === 1 ? 'report uses' : 'reports use'
			setDeleteSubtitle(
				`${count} ${reportWord} this label. They will keep the label text, but it will no longer appear in the dropdown.`,
			)
		} else {
			setDeleteSubtitle(
				'You will permanently remove this custom label. You cannot undo this action.',
			)
		}
		setDeleteModal(true)
	}

	const handleLabelColorSave = async (hex) => {
		await updateAgencyLabelColor(agencyID, selected, hex)
		setEditLabelModal(false)
		await getData(agencyID)
	}

	const replaceTag = (tag) => {
		if (isRequiredTag(selected, requiredTags)) return

		if (list?.includes?.(selected)) {
			list[list.indexOf(selected)] = tag
		}
		if (active?.includes?.(selected)) {
			active[active.indexOf(selected)] = tag
		}
		setData(tagSystem, list, active, agencyID)
		setSelected('')
	}

	/**
	 * Adds a newsroom tag to the agency catalog and turns it on immediately when
	 * under the live-tag limit (no separate "Mark as Active" step).
	 *
	 * @param {string} tag - New topic or source label to append.
	 */
	const addNewTag = (tag) => {
		const arr = [...list, tag]
		setList(arr)

		let nextActive = [...active]
		if (!nextActive.includes(tag)) {
			if (nextActive.length >= maxTags[tagSystem]) {
				setMaxTagsError(true)
			} else {
				nextActive = [...nextActive, tag]
				setMaxTagsError(false)
			}
		}
		setActive(nextActive)
		setData(tagSystem, arr, nextActive, agencyID)
		setSearch('')
	}

	const handleAddNew = (e) => {
		e.preventDefault()
		setSearchResult([])
		if (isLabelsMode) {
			if (customLabels.length >= MAX_CUSTOM_LABELS) {
				setMaxLabelsError(true)
				return
			}
			setMaxLabelsError(false)
			setNewLabelModal(true)
			return
		}
		setNewTagModal(true)
	}

	const handleAddNewLabel = async (labelText) => {
		await addAgencyCustomLabel(agencyID, labelText)
		setNewLabelModal(false)
		setSearch('')
		setSelected('')
		await getData(agencyID)
	}

	const handleSearch = (e) => {
		e.preventDefault()
	}

	const handleChange = (e) => {
		const value = e.target.value
		setSearch(value)
		if (isLabelsMode) {
			setSearchResult(
				allDisplayLabels.filter((item) =>
					item.toLowerCase().includes(value.toLowerCase()),
				),
			)
		} else {
			setSearchResult(
				list.filter((item) => item.toLowerCase().includes(value.toLowerCase())),
			)
		}
		setSelected('')
	}

	useEffect(() => {
		if (isLabelsMode) {
			setSearchResult(
				allDisplayLabels.filter((item) =>
					item.toLowerCase().includes(search.toLowerCase()),
				),
			)
		} else {
			setSearchResult(
				list.filter((item) => item.toLowerCase().includes(search.toLowerCase())),
			)
		}
	}, [search, list, allDisplayLabels, isLabelsMode])

	useEffect(() => {
		setSearch(selected)
	}, [selected])

	const renderLabelDot = (label) => (
		<GoDotFill size={25} style={{ color: getLabelColor(label, labelColors) }} />
	)

	const clearSelection = (e) => {
		if (e.target === e.currentTarget) {
			setSearchResult([])
			setSelected('')
		}
	}

	const selectedIsCustom = isLabelsMode && isCustomLabel(selected)

	return (
		<div
			className="z-0 flex flex-col p-4 sm:p-16 h-full"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					setSearchResult([])
					setSelected('')
				}
			}}>
			<div className="flex items-center">
				<button onClick={() => setTagSystem(0)} type="button">
					<IoMdArrowRoundBack size={25} />
				</button>
				<div className="text-xl px-5 font-extrabold text-blue-600 tracking-wider">
					{isLabelsMode ? 'Labels' : `${tagSystems[tagSystem]} Tags`}
				</div>
				<div className="text-sm font-light">
					{isLabelsMode
						? `Maximum: ${MAX_CUSTOM_LABELS} custom labels`
						: `Maximum: ${maxTags[tagSystem] - 1} Tags (+Other)`}
				</div>

				{isLabelsMode ? (
					selectedIsCustom ? (
						<div className="flex items-center ml-auto">
							<button
								className="flex items-center shadow mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
								type="button"
								onClick={() => setEditLabelModal(true)}>
								<MdModeEditOutline className="text-blue-600" size={18} />
								<div className="px-2 font-normal tracking-wide">Edit</div>
							</button>
							<button
								className="flex items-center shadow bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
								type="button"
								onClick={handleLabelDeletePrompt}>
								<TiDelete className="text-red-600" size={20} />
								<div className="px-2 font-normal tracking-wide">Delete</div>
							</button>
						</div>
					) : (
						<button
							className="flex items-center shadow ml-auto mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
							type="button"
							onClick={handleAddNew}>
							<FaPlus className="text-blue-600" size={12} />
							<div className="px-2 font-normal tracking-wide">New Label</div>
						</button>
					)
				) : selected.length === 0 && !customClaims.admin ? (
					<button
						className="flex items-center shadow ml-auto mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
						type="button"
						onClick={handleAddNew}>
						<FaPlus className="text-blue-600" size={12} />
						<div className="px-2 font-normal tracking-wide">
							{`New ${tagSystems[tagSystem]}`}
						</div>
					</button>
				) : selectedIsRequired ? (
					<div className="ml-auto mr-6 text-sm text-gray-500 font-light">
						Required default — cannot edit or deactivate
					</div>
				) : (
					!isLabelsMode && (
						<div className="flex items-center ml-auto">
							<button
								className="flex items-center shadow mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
								type="button"
								onClick={(e) => updateTag(e, 'delete')}>
								<TiDelete className="text-red-600" size={20} />
								<div className="px-2 font-normal tracking-wide">Delete</div>
							</button>
							<button
								className="flex items-center shadow mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
								type="button"
								onClick={(e) => updateTag(e, 'rename')}>
								<MdModeEditOutline className="text-blue-600" size={18} />
								<div className="px-2 font-normal tracking-wide">Rename</div>
							</button>
							<button
								className="flex items-center shadow bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
								type="button"
								onClick={(e) =>
									active.includes(search)
										? updateTag(e, 'deactivate')
										: updateTag(e, 'activate')
								}>
								<IoIosRadioButtonOn
									className={
										active.includes(search) ? 'text-red-600' : 'text-green-600'
									}
									size={18}
								/>
								<div className="px-2 font-normal tracking-wide">
									{active.includes(search) ? 'Mark as Inactive' : 'Mark as Active'}
								</div>
							</button>
						</div>
					)
				)}
			</div>

			<div className="relative">
				<form
					className="w-full mt-7 ml-2 relative"
					onChange={handleChange}
					onSubmit={handleSearch}>
					<button
						className="p-1 absolute right-1 top-1 bg-blue-600 text-white rounded-xl"
						type="submit">
						<AiOutlineSearch size={25} />
					</button>
					<input
						className="shadow border-none rounded-xl w-full p-3 pr-11 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
						id="search"
						type="text"
						placeholder="Search"
						onChange={handleChange}
						value={search}
					/>
				</form>

				{search.length > 0 && (
					<div className="shadow-lg absolute rounded-lg z-20 mt-2 w-1/2">
						<div className="bg-white w-full rounded-lg">
							{searchResult.map((item) => {
								if (!isLabelsMode && isOtherTagName(item)) return null
								if (isLabelsMode && isAppWideLabel(item)) return null
								return (
									<div
										onClick={() => {
											setSelected(item)
											setSearchResult([])
										}}
										className="text-light text-sm rounded-lg leading-tight py-2 pl-4 hover:bg-indigo-100 cursor-pointer"
										key={item}>
										{item}
										{isRequiredTag(item, requiredTags) ? ' *' : ''}
									</div>
								)
							})}
						</div>
					</div>
				)}
			</div>

			<div className="z-10 mt-12 pr-6">
				{isLabelsMode ? (
					<div>
						<div
							className="grid w-full p-4 mb-2 rounded-xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
							onClick={clearSelection}>
							{filteredDisplayLabels.map((item) => (
								<div
									key={item}
									onClick={() => isCustomLabel(item) && setSelected(item)}
									className={`text-md font-light my-5 leading-normal flex items-center justify-center ${
										isCustomLabel(item) ? 'cursor-pointer' : ''
									}`}>
									{renderLabelDot(item)}
									<div className="pl-2">{item}</div>
								</div>
							))}
						</div>

						<div
							className="grid bg-white w-full p-4 mt-10 rounded-xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
							onClick={clearSelection}>
							{maxLabelsError && (
								<div className="col-span-full text-red-500 text-sm font-light pl-2">
									{`You may only have ${MAX_CUSTOM_LABELS} custom labels`}
								</div>
							)}
							{filteredCustomLabels.length === 0 ? (
								<div className="col-span-full py-3 text-sm text-center text-gray-500">
									No custom labels yet. Create one from a report using the Other
									label option. Or the New Label button above.
								</div>
							) : (
								filteredCustomLabels.map((item) => {
									const normStyles =
										'text-md font-light p-2 my-3 md:mx-2 cursor-pointer leading-normal flex items-center justify-center'
									const selectedStyles =
										normStyles + ' bg-blue-600 text-white rounded-lg'
									return (
										<div
											onClick={() => setSelected(item)}
											className={selected === item ? selectedStyles : normStyles}
											key={item}>
											{renderLabelDot(item)}
											<div className="pl-2">{item}</div>
										</div>
									)
								})
							)}
						</div>
					</div>
				) : list.length === 0 ? (
					<div className="grid bg-white w-full py-6 px-4 rounded-xl text-center items-center">
						<Image
							src="svgs/warning.svg"
							width={156}
							height={120}
							className="w-auto"
							alt="warning"
						/>
						<div className="py-3 text-sm">You have no tags right now</div>
					</div>
				) : (
					<div>
						{active.length !== 0 && (
							<div
								className="grid w-full p-4 mb-2 rounded-xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
								onClick={clearSelection}>
								{active.map((item) =>
									!isOtherTagName(item) ? (
										<div
											onClick={() => setSelected(item)}
											className="text-md font-light my-5 cursor-pointer leading-normal flex items-center justify-center"
											key={item}>
											<GoDotFill size={25} className="text-green-600" />
											<div className="pl-2">
												{item}
												{isRequiredTag(item, requiredTags) ? '*' : ''}
											</div>
										</div>
									) : (
										<div
											className="text-md font-light my-5 leading-normal flex items-center justify-center"
											key="other">
											<GoDotFill size={25} className="text-gray-400" />
											<div className="pl-2">Other*</div>
										</div>
									),
								)}
							</div>
						)}
						{maxTagsError && (
							<span className="pl-12 text-red-500 text-sm font-light">
								{`You may only enable ${maxTags[tagSystem]} live tags`}
							</span>
						)}
						<div
							className="grid bg-white w-full p-4 mt-10 rounded-xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
							onClick={clearSelection}>
							{list.map((item) => {
								const normStyles =
									'text-md font-light p-2 my-3 md:mx-2 cursor-pointer leading-normal flex items-center justify-center'
								const selectedStyles =
									normStyles + ' bg-blue-600 text-white rounded-lg'
								if (isOtherTagName(item)) return null
								return (
									<div
										onClick={() => setSelected(item)}
										className={selected === item ? selectedStyles : normStyles}
										key={item}>
										{active.includes(item) && (
											<GoDotFill size={25} className="text-green-600" />
										)}
										<div className="pl-2">
											{item}
											{isRequiredTag(item, requiredTags) ? '*' : ''}
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}
			</div>

			{newTagModal && (
				<NewTagModal
					tagSystems={tagSystems}
					tagSystem={tagSystem}
					list={list}
					setList={setList}
					setNewTagModal={setNewTagModal}
					addNewTag={addNewTag}
				/>
			)}
			{renameModal && (
				<RenameTagModal
					replaceTag={replaceTag}
					selected={selected}
					list={list}
					setRenameTagModal={setRenameTagModal}
					addNewTag={addNewTag}
				/>
			)}
			{newLabelModal && (
				<NewLabelModal
					existingLabels={list}
					onClose={() => setNewLabelModal(false)}
					onAdd={handleAddNewLabel}
				/>
			)}
			{editLabelModal && (
				<EditLabelModal
					labelName={selected}
					currentColor={getLabelColor(selected, labelColors)}
					onSave={handleLabelColorSave}
					onClose={() => setEditLabelModal(false)}
				/>
			)}
			{deleteModal && (
				<ConfirmModal
					func={isLabelsMode ? deleteLabel : deleteTag}
					title={
						isLabelsMode
							? 'Are you sure you want to delete this label?'
							: 'Are you sure you want to delete this tag?'
					}
					subtitle={deleteSubtitle}
					CTA="Delete"
					closeModal={setDeleteModal}
				/>
			)}
			<div className="text-xs flex justify-center text-gray-500 mt-2">
				<p>
					{isLabelsMode
						? 'To Investigate, Misinfo, Not Misinfo, and Other are defaults and cannot be edited or removed.'
						: '* Required defaults (set by admins) cannot be edited, deactivated, or removed. You can still add custom tags.'}
				</p>
			</div>
		</div>
	)
}

export default TagSystem
