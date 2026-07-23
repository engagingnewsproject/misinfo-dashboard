import FormInput from '../../ui/FormInput'
import FormSelect from '../../ui/FormSelect'
import ModalCloseButton from '../../ui/ModalCloseButton'
import { State, City } from 'country-state-city'
import { useDelayedDialogOpen } from '../../../hooks/useDelayedDialogOpen'
import {
	Button,
	Dialog,
	DialogBody,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'

/**
 * Mount when visible; Dialog opens one tick later to avoid Floating UI
 * aria-hidden warnings when mounting with open={true} immediately.
 */
const NewAgencyModal = ({
	setNewAgencyModal,
	newAgencyName,
	onNewAgencyName,
	newAgencyEmails,
	onNewAgencyEmails,
	data,
	onNewAgencyState,
	onNewAgencyCity,
	onFormSubmit,
	errors,
}) => {
	const handleClose = () => setNewAgencyModal(false)
	const dialogOpen = useDelayedDialogOpen()

	return (
		<Dialog data-component="NewAgencyModal"
			open={dialogOpen}
			handler={handleClose}
			size="md"
			className="new-agency-modal rounded-md"
			dismiss={{
				outsidePress: (event) => {
					const target = event.target
					if (!(target instanceof Element)) return true
					if (
						target.closest('.form-select__menu-portal, .form-select__menu')
					) {
						return false
					}
					return true
				},
			}}>
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h3" color="blue" className="mt-0 mb-0">
					Add new Agency
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody className="overflow-y-auto max-h-[70vh]">
				<form
					onSubmit={onFormSubmit}
					id="newAgencyModal"
					className="flex flex-col gap-4">
					<FormInput
						id="agencyName"
						type="text"
						label="Agency Name"
						value={newAgencyName}
						onChange={onNewAgencyName}
						autoComplete="nope"
					/>
					{errors.newAgencyName ? (
						<p className="error">Enter an agency name</p>
					) : null}
					<FormInput
						id="agencyUser"
						type="text"
						inputMode="email"
						label="Admin email(s), comma-separated"
						value={newAgencyEmails}
						onChange={onNewAgencyEmails}
						autoComplete="email"
					/>
					{errors.email ? (
						<p className="error">
							Enter at least one valid email (comma-separated for multiple)
						</p>
					) : null}
					<Typography variant="small" className="font-semibold text-[#2E3B4E] mb-0">
						Location
					</Typography>
					{errors.location ? (
						<p className="error text-red-600 text-sm mb-2">
							Select a state and city
						</p>
					) : null}
					<FormSelect
						id="agencyState"
						label="Select State"
						value={data.state}
						options={State.getStatesOfCountry(data.country)}
						getOptionLabel={(options) => options['name']}
						getOptionValue={(options) => options['name']}
						onChange={onNewAgencyState}
						required
					/>
					<FormSelect
						id="agencyCity"
						label="Select City"
						value={data.city}
						options={City.getCitiesOfState(
							data.state?.countryCode,
							data.state?.isoCode,
						)}
						getOptionLabel={(options) => options['name']}
						getOptionValue={(options) => options['name']}
						onChange={onNewAgencyCity}
						required
					/>
					{errors.submit ? (
						<p className="error text-red-600 text-sm" role="alert">
							{errors.submit}
						</p>
					) : null}
					<Button type="submit" id="agencyNew">
						Add Agency
					</Button>
				</form>
			</DialogBody>
		</Dialog>
	)
}

export default NewAgencyModal
