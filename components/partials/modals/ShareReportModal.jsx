import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import FormInput from '../../ui/FormInput'
import {
	buildReportShareUrl,
	copyReportShareLink,
	openReportShareEmail,
} from '../../../utils/share-report'

/**
 * Modal for sharing a report by email or by copying its dashboard link.
 *
 * Collects an optional recipient address, or lets the user copy the URL
 * to paste elsewhere. Uses shared mailto/clipboard helpers so all share
 * entry points behave the same.
 *
 * @param {Object} props
 * @param {string} props.reportId - Report document id used to build the share URL
 * @param {string} [props.reportTitle] - Included in the email subject when present
 * @param {(open: boolean) => void} props.closeModal - Closes the modal
 */
const ShareReportModal = ({ reportId, reportTitle = '', closeModal }) => {
	const { t } = useTranslation('ShareReport')
	const [email, setEmail] = useState('')
	const [copied, setCopied] = useState(false)
	const [copyError, setCopyError] = useState(false)
	const shareUrl = buildReportShareUrl(reportId)

	useEffect(() => {
		if (!copied) return undefined
		const timer = setTimeout(() => setCopied(false), 2000)
		return () => clearTimeout(timer)
	}, [copied])

	const handleCopyLink = async () => {
		setCopyError(false)
		const ok = await copyReportShareLink(shareUrl)
		if (ok) {
			setCopied(true)
		} else {
			setCopyError(true)
		}
	}

	const handleSubmit = (e) => {
		e.preventDefault()
		openReportShareEmail({
			email,
			title: reportTitle,
			url: shareUrl,
		})
		closeModal(false)
	}

	return (
		<div onClick={(e) => e.stopPropagation()}>
			<div className='flex justify-center items-center z-[10000] fixed top-0 left-0 w-full h-full bg-black opacity-60'></div>
			<div
				className='flex justify-center items-center z-[10001] fixed top-0 left-0 w-full h-full'
				onClick={() => closeModal(false)}>
				<div
					className='flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10'
					onClick={(e) => {
						e.stopPropagation()
					}}>
					<div className='grid justify-items-center mb-4'>
						<div className='flex-col mt-3 mb-2 text-center tracking-wide'>
							<div className='text-lg text-blue-500 font-bold my-2'>
								{t('shareReport')}
							</div>
							<div className='text-xs font-light'>{t('subtitle')}</div>
						</div>
					</div>
					<form onSubmit={handleSubmit}>
						<div className='mt-2 flex flex-col gap-3'>
							<div>
								<label className='block text-xs font-semibold text-gray-600 mb-1'>
									{t('linkLabel')}
								</label>
								<div className='rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-700 break-all'>
									{shareUrl}
								</div>
							</div>
							<button
								type='button'
								onClick={handleCopyLink}
								className='bg-white hover:bg-blue-50 text-sm text-blue-600 font-bold py-1.5 px-6 rounded-md border border-blue-200 focus:outline-none focus:shadow-outline'>
								{copied ? t('copied') : t('copyLink')}
							</button>
							{copyError && (
								<p className='text-xs text-red-500'>{t('copyFailed')}</p>
							)}
							<FormInput
								id='email'
								type='email'
								label={t('emailOptional')}
								placeholder={t('emailPlaceholder')}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
							<div className='mt-2 flex flex-col gap-2'>
								<button
									type='button'
									onClick={() => closeModal(false)}
									className='bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline'>
									{t('cancel')}
								</button>
								<button
									className='bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline'
									type='submit'
									autoFocus>
									{t('share')}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default ShareReportModal
