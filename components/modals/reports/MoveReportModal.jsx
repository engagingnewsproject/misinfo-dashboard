import React, { useEffect, useMemo, useState } from 'react'
import {
	Button,
	Dialog,
	DialogBody,
	DialogFooter,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'
import FormSelect from '../../ui/FormSelect'
import ModalCloseButton from '../../ui/ModalCloseButton'
import { useDelayedDialogOpen } from '../../../hooks/useDelayedDialogOpen'
import { agenciesForState } from '../../../utils/move-report'

/**
 * Admin dialog that sends a report to every newsroom in a state.
 *
 * Mainly for reports sitting in Test Agency (per-state overflow, promoted
 * articles). The state starts on the report's detected state; the dialog lists
 * which newsrooms will get it before the admin confirms.
 *
 * @param {Object} props
 * @param {string} props.reportId
 * @param {string} [props.reportState] Detected state on the report
 * @param {string} [props.currentAgencyId]
 * @param {string} [props.currentAgencyName]
 * @param {() => Promise<Array<{ id: string, name: string, state: string }>>} props.loadAgencies
 * @param {(reportId: string, state: string) => Promise<{ agencies: Array<{ name: string }> }>} props.moveReport
 * @param {(result: { agencies: Array<{ name: string }> }) => void} [props.onMoved]
 * @param {(open: boolean) => void} props.closeModal
 */
const MoveReportModal = ({
	reportId,
	reportState = '',
	currentAgencyId = '',
	currentAgencyName = '',
	loadAgencies,
	moveReport,
	onMoved,
	closeModal,
}) => {
	const dialogOpen = useDelayedDialogOpen()
	const [agencies, setAgencies] = useState([])
	const [loading, setLoading] = useState(true)
	const [state, setState] = useState(reportState)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		let active = true
		loadAgencies()
			.then((list) => {
				if (active) setAgencies(list)
			})
			.catch((err) => {
				console.error('Error loading agencies:', err)
				if (active) setError('Could not load newsrooms.')
			})
			.finally(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
		}
		// Load once per open; callers often pass an inline loader.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const stateOptions = useMemo(() => {
		const seen = new Map()
		for (const a of agencies) {
			const key = a.state.trim().toLowerCase()
			if (key && !seen.has(key)) seen.set(key, a.state.trim())
		}
		return [...seen.values()]
			.sort((a, b) => a.localeCompare(b))
			.map((s) => ({ value: s, label: s }))
	}, [agencies])

	const targets = useMemo(
		() => agenciesForState(agencies, state, currentAgencyId),
		[agencies, state, currentAgencyId],
	)

	const handleClose = () => closeModal(false)

	const handleConfirm = async () => {
		setSaving(true)
		setError('')
		try {
			const result = await moveReport(reportId, state)
			onMoved?.(result)
			closeModal(false)
		} catch (err) {
			console.error('Error moving report:', err)
			setError(err?.message || 'Could not move this report.')
		} finally {
			setSaving(false)
		}
	}

	const selectedOption = stateOptions.find(
		(o) => o.value.toLowerCase() === state.trim().toLowerCase(),
	) || null

	return (
		<Dialog
			data-component="MoveReportModal"
			open={dialogOpen}
			handler={handleClose}
			size="sm"
			className="rounded-md">
			<DialogHeader className="justify-between gap-4">
				<div>
					<Typography variant="h3" color="blue" className="mt-0 mb-1">
						Move to agency
					</Typography>
					<Typography variant="small" className="font-normal">
						Sends this report to every newsroom in the state.
						{currentAgencyName ? ` Currently in ${currentAgencyName}.` : ''}
					</Typography>
				</div>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody className="flex flex-col gap-4">
				<FormSelect
					id="move-report-state"
					label="State"
					options={stateOptions}
					value={selectedOption}
					isDisabled={loading || saving}
					onChange={(option) => setState(option?.value || '')}
				/>
				<div>
					<p className="mb-1 text-xs font-semibold text-gray-600">
						Newsrooms that will receive it
					</p>
					{loading ? (
						<p className="text-sm text-gray-500">Loading newsrooms…</p>
					) : targets.length === 0 ? (
						<p className="text-sm text-gray-500">
							{state ? `No newsrooms found for ${state}.` : 'Pick a state.'}
						</p>
					) : (
						<ul className="list-disc pl-5 text-sm text-[#2E3B4E]">
							{targets.map((a) => (
								<li key={a.id}>{a.name}</li>
							))}
						</ul>
					)}
				</div>
				{error && (
					<p className="text-sm text-red-600" role="alert">
						{error}
					</p>
				)}
			</DialogBody>
			<DialogFooter className="justify-between gap-4">
				<Button type="button" variant="outlined" color="red" onClick={handleClose}>
					Cancel
				</Button>
				<Button
					type="button"
					onClick={handleConfirm}
					disabled={saving || loading || targets.length === 0}>
					{saving ? 'Moving…' : 'Confirm move'}
				</Button>
			</DialogFooter>
		</Dialog>
	)
}

export default MoveReportModal
