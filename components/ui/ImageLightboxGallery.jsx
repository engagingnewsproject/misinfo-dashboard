import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
	IoChevronBackOutline,
	IoChevronForwardOutline,
	IoClose,
} from 'react-icons/io5'

/**
 * Clickable image thumbnails with a full-screen lightbox (prev/next, Esc).
 * Uses plain <img> so Firebase Storage download URLs are not blocked by next/image.
 *
 * @param {Object} props
 * @param {string[]} props.images - Image URLs
 * @param {string} [props.altPrefix='Image'] - Prefix for alt / aria labels
 * @param {string} [props.listClassName] - Wrapper for the thumbnail list
 * @param {string} [props.thumbnailClassName] - Classes on each thumbnail img
 * @param {string} [props.brokenLabel='Image not found'] - Fallback when an img fails
 * @param {(open: boolean) => void} [props.onLightboxChange] - Notifies parent when lightbox opens/closes
 */
const ImageLightboxGallery = ({
	images = [],
	altPrefix = 'Image',
	listClassName = 'grid grid-cols-4 gap-4 w-full overflow-y-auto',
	thumbnailClassName = 'h-auto w-full object-cover',
	brokenLabel = 'Image not found',
	onLightboxChange,
}) => {
	const [lightboxIndex, setLightboxIndex] = useState(null)
	const [brokenImageIndexes, setBrokenImageIndexes] = useState(() => new Set())

	const reportImages = Array.isArray(images) ? images.filter(Boolean) : []
	const lightboxOpen = lightboxIndex !== null
	const activeLightboxImage = lightboxOpen ? reportImages[lightboxIndex] : null
	const lightboxImageBroken =
		lightboxOpen && brokenImageIndexes.has(lightboxIndex)

	const imagesKey = reportImages.join('|')

	useEffect(() => {
		setBrokenImageIndexes(new Set())
		setLightboxIndex(null)
	}, [imagesKey])

	useEffect(() => {
		onLightboxChange?.(lightboxOpen)
	}, [lightboxOpen, onLightboxChange])

	useEffect(() => {
		if (!lightboxOpen) return undefined
		if (lightboxIndex >= reportImages.length) {
			setLightboxIndex(reportImages.length > 0 ? reportImages.length - 1 : null)
			return undefined
		}

		const onKeyDown = (event) => {
			if (event.key === 'Escape') {
				setLightboxIndex(null)
				return
			}
			if (reportImages.length <= 1) return
			if (event.key === 'ArrowLeft') {
				setLightboxIndex(
					(current) =>
						((current ?? 0) - 1 + reportImages.length) % reportImages.length,
				)
			}
			if (event.key === 'ArrowRight') {
				setLightboxIndex(
					(current) => ((current ?? 0) + 1) % reportImages.length,
				)
			}
		}

		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [lightboxOpen, lightboxIndex, reportImages.length])

	if (reportImages.length === 0) return null

	const markImageBroken = (index) => {
		setBrokenImageIndexes((prev) => {
			if (prev.has(index)) return prev
			const next = new Set(prev)
			next.add(index)
			return next
		})
	}

	const showPrevLightbox = (event) => {
		event.stopPropagation()
		setLightboxIndex(
			(current) =>
				((current ?? 0) - 1 + reportImages.length) % reportImages.length,
		)
	}

	const showNextLightbox = (event) => {
		event.stopPropagation()
		setLightboxIndex((current) => ((current ?? 0) + 1) % reportImages.length)
	}

	return (
		<>
			<div className={listClassName}>
				{reportImages.map((image, i) => (
					<div className="grid-cols-subgrid shrink-0" key={`${image}-${i}`}>
						{brokenImageIndexes.has(i) ? (
							<span className="flex min-h-[4.5rem] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 text-center text-xs italic text-gray-400">
								{brokenLabel}
							</span>
						) : (
							<button
								type="button"
								onClick={() => setLightboxIndex(i)}
								className="block w-full overflow-hidden rounded-md border border-slate-200 bg-white transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
								aria-label={`View ${altPrefix.toLowerCase()} ${i + 1}`}>
								<img
									src={image}
									alt={`${altPrefix} ${i + 1}`}
									className={thumbnailClassName}
									onError={() => markImageBroken(i)}
								/>
							</button>
						)}
					</div>
				))}
			</div>

			{activeLightboxImage &&
				typeof document !== 'undefined' &&
				createPortal(
					<div
						className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 p-4"
						onClick={() => setLightboxIndex(null)}
						role="dialog"
						aria-modal="true"
						aria-label={`${altPrefix} ${lightboxIndex + 1}`}>
						<button
							type="button"
							onClick={() => setLightboxIndex(null)}
							className="absolute right-4 top-4 rounded-full p-1 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
							aria-label="Close image preview">
							<IoClose className="h-7 w-7" aria-hidden="true" />
						</button>

						{reportImages.length > 1 && (
							<>
								<button
									type="button"
									onClick={showPrevLightbox}
									className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
									aria-label="Previous image">
									<IoChevronBackOutline className="h-7 w-7" aria-hidden="true" />
								</button>
								<button
									type="button"
									onClick={showNextLightbox}
									className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
									aria-label="Next image">
									<IoChevronForwardOutline className="h-7 w-7" aria-hidden="true" />
								</button>
							</>
						)}

						{lightboxImageBroken ? (
							<p className="rounded-md bg-white/10 px-4 py-3 text-sm italic text-white/90">
								{brokenLabel}
							</p>
						) : (
							<img
								src={activeLightboxImage}
								alt={`${altPrefix} ${lightboxIndex + 1}`}
								className="max-h-[90vh] max-w-full object-contain"
								onClick={(event) => event.stopPropagation()}
								onError={() => markImageBroken(lightboxIndex)}
							/>
						)}

						{reportImages.length > 1 && (
							<p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/90">
								{lightboxIndex + 1} / {reportImages.length}
							</p>
						)}
					</div>,
					document.body,
				)}
		</>
	)
}

export default ImageLightboxGallery
