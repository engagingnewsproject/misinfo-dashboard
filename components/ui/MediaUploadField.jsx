import React, { useEffect, useRef, useState } from 'react'
import {
	IoChevronBackOutline,
	IoChevronForwardOutline,
	IoClose,
	IoCloudUploadOutline,
	IoImagesOutline,
} from 'react-icons/io5'

/**
 * Compact styled image upload with click-to-browse, drag-and-drop, previews,
 * lightbox review, and per-image removal.
 *
 * @param {Object} props
 * @param {string} [props.id]
 * @param {React.RefObject<HTMLInputElement>} [props.inputRef]
 * @param {(e: { target: { files: FileList } }) => void} props.onChange
 * @param {(index: number) => void} [props.onRemoveFile]
 * @param {File[]} [props.files]
 * @param {string} [props.accept]
 * @param {boolean} [props.multiple]
 * @param {string} props.label
 * @param {string} [props.helperText]
 * @param {string} [props.actionText]
 */
const MediaUploadField = ({
	id = 'multiple_files',
	inputRef,
	onChange,
	onRemoveFile,
	files = [],
	accept = 'image/*',
	multiple = true,
	label,
	helperText,
	actionText = 'Click or drag images here',
}) => {
	const [isDragging, setIsDragging] = useState(false)
	const [lightboxIndex, setLightboxIndex] = useState(null)
	const [previews, setPreviews] = useState([])
	const localInputRef = useRef(null)
	const ref = inputRef || localInputRef

	// Create blob URLs in an effect (not useMemo). Strict Mode remounts revoke
	// memoized URLs while keeping the same memo result → broken <img> srcs.
	useEffect(() => {
		const next = files.map((file, index) => ({
			index,
			key: `${file?.name || 'file'}-${file?.size || 0}-${file?.lastModified || 0}-${index}`,
			url:
				typeof Blob !== 'undefined' && file instanceof Blob
					? URL.createObjectURL(file)
					: String(file || ''),
			name: file?.name || `image-${index + 1}`,
		}))
		setPreviews(next)
		return () => {
			next.forEach((preview) => {
				if (preview.url?.startsWith('blob:')) URL.revokeObjectURL(preview.url)
			})
		}
	}, [files])

	useEffect(() => {
		if (lightboxIndex === null) return undefined
		if (lightboxIndex >= previews.length) {
			setLightboxIndex(previews.length > 0 ? previews.length - 1 : null)
			return undefined
		}

		const onKeyDown = (event) => {
			if (event.key === 'Escape') {
				setLightboxIndex(null)
				return
			}
			if (previews.length <= 1) return
			if (event.key === 'ArrowLeft') {
				setLightboxIndex(
					(current) => ((current ?? 0) - 1 + previews.length) % previews.length,
				)
			}
			if (event.key === 'ArrowRight') {
				setLightboxIndex((current) => ((current ?? 0) + 1) % previews.length)
			}
		}

		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [lightboxIndex, previews.length])

	const openPicker = () => ref.current?.click()

	const handleDrag = (event, dragging) => {
		event.preventDefault()
		event.stopPropagation()
		setIsDragging(dragging)
	}

	const handleDrop = (event) => {
		handleDrag(event, false)
		if (!event.dataTransfer.files?.length) return
		onChange({ target: { files: event.dataTransfer.files } })
	}

	const handleRemove = (event, index) => {
		event.preventDefault()
		event.stopPropagation()
		onRemoveFile?.(index)
		if (ref.current) ref.current.value = ''
	}

	const openLightbox = (index) => setLightboxIndex(index)

	const showPrev = (event) => {
		event.stopPropagation()
		setLightboxIndex(
			(current) => ((current ?? 0) - 1 + previews.length) % previews.length,
		)
	}

	const showNext = (event) => {
		event.stopPropagation()
		setLightboxIndex((current) => ((current ?? 0) + 1) % previews.length)
	}

	const activePreview =
		lightboxIndex !== null ? previews[lightboxIndex] : null

	return (
		<div data-component="MediaUploadField">
			<input
				ref={ref}
				id={id}
				type="file"
				className="sr-only"
				accept={accept}
				multiple={multiple}
				onChange={onChange}
			/>
			<button
				type="button"
				onClick={openPicker}
				onDragEnter={(event) => handleDrag(event, true)}
				onDragOver={(event) => handleDrag(event, true)}
				onDragLeave={(event) => handleDrag(event, false)}
				onDrop={handleDrop}
				className={`flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-left transition-colors ${
					isDragging
						? 'border-blue-500 bg-blue-50'
						: 'border-slate-300 bg-white hover:border-blue-400 hover:bg-sky-50'
				}`}
				aria-label={label}>
				<IoCloudUploadOutline className="h-5 w-5 shrink-0 text-[#2E3B4E]" />
				<span className="min-w-0 flex-1 text-sm leading-snug">
					<span className="font-medium text-blue-gray-800">{label}</span>
					<span className="text-gray-500"> · {actionText}</span>
				</span>
			</button>
			{helperText && (
				<p className="mt-1 text-xs leading-snug text-gray-500">{helperText}</p>
			)}

			{previews.length > 0 && (
				<div className="mt-2">
					<p className="mb-1.5 flex items-center gap-1 text-xs text-gray-500">
						<IoImagesOutline className="h-3.5 w-3.5" />
						{previews.length} selected
					</p>
					<div className="flex flex-wrap gap-1.5">
						{previews.map((preview) => (
							<div key={preview.key} className="relative">
								<button
									type="button"
									onClick={() => openLightbox(preview.index)}
									className="overflow-hidden rounded-md border border-slate-200 bg-white transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
									aria-label={`Preview ${preview.name}`}>
									<img
										src={preview.url}
										alt={preview.name}
										className="h-12 w-12 object-cover"
									/>
								</button>
								{onRemoveFile && (
									<button
										type="button"
										onClick={(event) => handleRemove(event, preview.index)}
										className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
										aria-label={`Remove ${preview.name}`}>
										<IoClose className="h-3.5 w-3.5" aria-hidden="true" />
									</button>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{activePreview && (
				<div
					className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 p-4"
					onClick={() => setLightboxIndex(null)}
					role="dialog"
					aria-modal="true"
					aria-label={`Preview ${activePreview.name}`}>
					<button
						type="button"
						onClick={() => setLightboxIndex(null)}
						className="absolute right-4 top-4 rounded-full p-1 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
						aria-label="Close preview">
						<IoClose className="h-7 w-7" aria-hidden="true" />
					</button>

					{previews.length > 1 && (
						<>
							<button
								type="button"
								onClick={showPrev}
								className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
								aria-label="Previous image">
								<IoChevronBackOutline className="h-7 w-7" aria-hidden="true" />
							</button>
							<button
								type="button"
								onClick={showNext}
								className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
								aria-label="Next image">
								<IoChevronForwardOutline className="h-7 w-7" aria-hidden="true" />
							</button>
						</>
					)}

					<img
						src={activePreview.url}
						alt={activePreview.name}
						className="max-h-[90vh] max-w-full object-contain"
						onClick={(event) => event.stopPropagation()}
					/>

					{previews.length > 1 && (
						<p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/90">
							{lightboxIndex + 1} / {previews.length}
						</p>
					)}
				</div>
			)}
		</div>
	)
}

export default MediaUploadField
