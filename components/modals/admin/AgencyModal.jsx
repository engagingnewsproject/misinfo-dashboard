import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import Image from 'next/image'
import ConfirmModal from '../common/ConfirmModal'
import FormInput from '../../ui/FormInput'
import MediaUploadField from '../../ui/MediaUploadField'
import ModalCloseButton from '../../ui/ModalCloseButton'
import {
	Button,
	Dialog,
	DialogBody,
	DialogHeader,
	IconButton,
	Typography,
} from '@material-tailwind/react'

/**
 * Mount when visible; Dialog is always open while mounted.
 */
const AgencyModal = ({
	setAgencyModal,
	handleImageChange,
	handleAddAgencyUsers,
	deleteAdmin,
	handleSubmitClick,
	agencyInfo,
	agencyUsersArr,
	sendEmail,
	setAddAgencyUsers,
	addAgencyUsers,
	setSendEmail,
	images,
	imgPicker,
	uploadedImageURLs,
	handleRemoveImage,
	errors,
}) => {
	const [deleteModal, setDeleteModal] = useState(false)
	const [selectedUserToDelete, setSelectedUserToDelete] = useState('')

	const handleClose = () => setAgencyModal(false)

	const handleDeleteClick = (user, e) => {
		if (e) {
			e.preventDefault()
			e.stopPropagation()
		}
		setSelectedUserToDelete(user)
		setDeleteModal(true)
	}

	const confirmDeleteAdmin = () => {
		deleteAdmin(selectedUserToDelete)
		setDeleteModal(false)
	}

	return (
		<>
			<Dialog
				open
				handler={handleClose}
				size="xl"
				className="agency-modal rounded-md"
				dismiss={{
					escapeKey: !deleteModal,
					outsidePress: (event) => {
						if (deleteModal) return false
						const target = event.target
						if (!(target instanceof Element)) return true
						if (target.closest('.confirm-modal-root')) return false
						return true
					},
				}}>
				<DialogHeader className="justify-between gap-4">
					<Typography variant="h3" color="blue" className="mt-0 mb-0">
						Agency Info
					</Typography>
					<ModalCloseButton onClick={handleClose} />
				</DialogHeader>
				<DialogBody className="overflow-y-auto max-h-[calc(100dvh-8rem)]">
					<form onSubmit={handleSubmitClick} id="agencyModal">
						<div className="grid md:grid-cols-3 md:gap-10 lg:gap-15">
							<Typography variant="small" className="font-semibold tracking-wider mb-4">
								Agency name
							</Typography>
							<div className="col-span-2 text-sm bg-white rounded-md p-4 mb-5 border border-blue-gray-50">
								{agencyInfo.name}
							</div>
							<Typography variant="small" className="font-semibold tracking-wider mb-4">
								Agency location
							</Typography>
							<div className="col-span-2 text-sm bg-white rounded-md p-4 mb-5 border border-blue-gray-50">
								{`${agencyInfo.city}, ${agencyInfo.state}`}
							</div>
							<Typography variant="small" className="font-semibold tracking-wider mb-4">
								Agency admin users
							</Typography>

							<div className="col-span-2 text-sm bg-white rounded-md p-4 mb-5 border border-blue-gray-50">
								{agencyUsersArr.map((txt, i = self.crypto.randomUUID()) => (
									<div className="grid grid-cols-2 py-1" key={i}>
										<div className="flex items-center gap-2">
											<IconButton
												type="button"
												size="sm"
												color="red"
												variant="filled"
												onClick={(e) => handleDeleteClick(txt, e)}
												aria-label={`Remove ${txt}`}>
												<IoClose size={16} />
											</IconButton>
											<p>{txt}</p>
										</div>
									</div>
								))}
							</div>

							<Typography variant="small" className="font-semibold tracking-wider mb-4">
								Add agency user
							</Typography>
							<div className="col-span-2 text-sm rounded-md p-1 mb-5">
								<FormInput
									id="agencyUser"
									type="email"
									label="Agency User Email"
									value={addAgencyUsers}
									onChange={(e) => setAddAgencyUsers(e.target.value)}
									autoComplete="nope"
								/>
								{errors.email ? (
									<p className="error">
										Email should be at least 15 characters long
									</p>
								) : null}
								<Button
									onClick={handleAddAgencyUsers}
									className="mt-2"
									type="submit">
									Add agency user
								</Button>
								{sendEmail && (
									<div className="flex py-2 items-center gap-2">
										<p className="text-green-700">{sendEmail}</p>
										<Button
											size="sm"
											color="green"
											onClick={() => setSendEmail('')}
											type="button">
											Dismiss
										</Button>
									</div>
								)}
							</div>
							<div>
								{images.length === 0 && (
									<>
										{uploadedImageURLs[0] ? (
											<Image
												src={uploadedImageURLs[0]}
												width={100}
												height={100}
												alt="Agency logo preview"
												onLoad={() => URL.revokeObjectURL(uploadedImageURLs[0])}
											/>
										) : agencyInfo.logo?.[0] ? (
											<Image
												src={agencyInfo.logo[0]}
												width={100}
												height={100}
												alt="Agency logo"
											/>
										) : null}
									</>
								)}
								<MediaUploadField
									id="agency_logo_file"
									inputRef={imgPicker}
									onChange={handleImageChange}
									onRemoveFile={handleRemoveImage}
									files={images}
									multiple={false}
									label="Agency logo"
									actionText="Choose image"
								/>
							</div>
							<Button type="submit" size="sm">
								Update Agency
							</Button>
						</div>
					</form>
				</DialogBody>
			</Dialog>
			{deleteModal && (
				<ConfirmModal
					func={confirmDeleteAdmin}
					title="Are you sure you want to remove this admin user?"
					subtitle=""
					CTA="Delete"
					closeModal={() => setDeleteModal(false)}
				/>
			)}
		</>
	)
}

export default AgencyModal
