import React, { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import FormInput from '../../ui/FormInput'
import ModalCloseButton from '../../ui/ModalCloseButton'
import { useDelayedDialogOpen } from '../../../hooks/useDelayedDialogOpen'
import {
	Button,
	Dialog,
	DialogBody,
	DialogFooter,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'
import {
	buildReportShareUrl,
	copyReportShareLink,
	openReportShareEmail,
} from '../../../utils/share-report'

/**
 * Modal for sharing a report by email or by copying its dashboard link.
 *
 * Mount when visible; Dialog opens one tick later to avoid Floating UI
 * aria-hidden warnings when mounting with open={true} immediately.
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
	const dialogOpen = useDelayedDialogOpen()
	const shareUrl = buildReportShareUrl(reportId)

	const handleClose = () => closeModal(false)

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
		<Dialog data-component="ShareReportModal"
			open={dialogOpen}
			handler={handleClose}
			size="xs"
			className="share-report-modal rounded-md">
			<form onSubmit={handleSubmit}>
				<DialogHeader className="justify-between gap-4">
					<div>
						<Typography variant="h3" color="blue" className="mt-0 mb-1">
							{t('shareReport')}
						</Typography>
						<Typography variant="small" className="font-normal">
							{t('subtitle')}
						</Typography>
					</div>
					<ModalCloseButton onClick={handleClose} />
				</DialogHeader>
				<DialogBody className="flex flex-col gap-3">
					<div>
						<label className="block text-xs font-semibold text-gray-600 mb-1">
							{t('linkLabel')}
						</label>
						<div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-700 break-all">
							{shareUrl}
						</div>
					</div>
					<Button type="button" variant="outlined" onClick={handleCopyLink}>
						{copied ? t('copied') : t('copyLink')}
					</Button>
					{copyError && (
						<p className="text-xs text-red-500">{t('copyFailed')}</p>
					)}
					<FormInput
						id="email"
						type="email"
						label={t('emailOptional')}
						placeholder={t('emailPlaceholder')}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</DialogBody>
				<DialogFooter className="justify-between gap-4">
					<Button
						type="button"
						variant="outlined"
						color="red"
						onClick={handleClose}>
						{t('cancel')}
					</Button>
					<Button type="submit" autoFocus>
						{t('share')}
					</Button>
				</DialogFooter>
			</form>
		</Dialog>
	)
}

export default ShareReportModal
