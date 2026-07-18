import React from 'react'
import { RiDeleteBin2Fill } from 'react-icons/ri'
import { useTranslation } from 'next-i18next'
import {
	Button,
	Dialog,
	DialogBody,
	DialogFooter,
	Typography,
} from '@material-tailwind/react'

/**
 * Delete confirmation dialog (Material Tailwind Dialog).
 *
 * Mount when visible (`{show && <DeleteModal ... />}`); Dialog is always open
 * while mounted, matching existing call sites.
 */
const DeleteModal = ({ func, title, subtitle, CTA, closeModal }) => {
	const { t } = useTranslation('Profile')

	const handleSubmit = (e) => {
		e.preventDefault()
		func()
	}

	const handleCancel = () => {
		closeModal(false)
	}

	return (
		<Dialog
			open
			handler={handleCancel}
			size="xs"
			className="delete-modal rounded-md">
			<form onSubmit={handleSubmit}>
				<DialogBody className="grid justify-items-center">
					{CTA === 'Delete' && (
						<RiDeleteBin2Fill className="text-[#2E3B4E]" size={30} />
					)}
					<div className="flex-col mt-3 mb-2 text-center tracking-wide">
						<Typography
							variant="h3"
							color="blue"
							className="mt-0 mb-2 text-center">
							{title}
						</Typography>
						<Typography variant="small" className="text-center">
							{subtitle}
						</Typography>
					</div>
				</DialogBody>
				<DialogFooter className="justify-center gap-4">
					<Button
						type="button"
						onClick={handleCancel}
						variant="outlined"
						color="red">
						{t('cancel')}
					</Button>
					<Button type="submit" autoFocus>
						{CTA}
					</Button>
				</DialogFooter>
			</form>
		</Dialog>
	)
}

export default DeleteModal
