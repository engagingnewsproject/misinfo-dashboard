/**
 * @fileoverview SwitchRead Component - Toggle for marking reports as read/unread
 *
 * This component provides a UI switch to mark a report as read or unread.
 * Features include:
 * - Updating the "read" status of a report in Firestore
 * - Visual feedback with icons and text for read/unread state
 * - Accessible and responsive toggle UI
 *
 * Integrates with:
 * - Firebase Firestore for report and user data
 * - @headlessui/react for the switch UI
 * - react-icons for status icons
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import { useEffect, useState } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../../config/firebase"
import { Switch } from "@headlessui/react"
import { MdMarkAsUnread, MdMarkEmailRead } from "react-icons/md"

/**
 * SwitchRead Component
 *
 * Renders a toggle switch for marking a report as read or unread.
 *
 * @param {Object} props
 * @param {string} props.setReportModalId - The ID of the report to toggle
 * @param {boolean} [props.read] - The report's current "read" field
 * @param {boolean} [props.disabled]
 * @returns {JSX.Element} The rendered read/unread toggle UI
 */
export default function SwitchRead({ setReportModalId, read = false, disabled = false }) {
	const [reportRead, setReportRead] = useState(!!read)
	const reportId = setReportModalId

	useEffect(() => {
		setReportRead(!!read)
	}, [read])

	async function handleReadChange(checked) {
		setReportRead(checked)
		try {
			await updateDoc(doc(db, "reports", reportId), { read: checked })
		} catch (error) {
			console.error("Error updating read status:", error)
			setReportRead(!checked)
		}
	}

	return (
		<>
			{/* Toggle read/unread icon on switch change */}
			<div data-component="SwitchRead" className="font-semibold self-center pr-4">
				{reportRead ? (
					<span className="flex gap-2">
						<MdMarkEmailRead size={20} />
					</span>
				) : (
					<span className="flex gap-2">
						<MdMarkAsUnread size={20} />
					</span>
				)}
			</div>
			<div className="text-md font-light flex gap-2">
				<Switch
					checked={reportRead}
					onChange={handleReadChange}
					disabled={disabled}
					className={`${
						reportRead ? "bg-blue-600" : "bg-gray-200"
					} relative inline-flex h-6 w-11 items-center rounded-full disabled:cursor-not-allowed`}>
					<span className="sr-only">Mark me</span>
					<span
						aria-hidden="true"
						className={`${
							reportRead ? "translate-x-6" : "translate-x-1"
						} inline-block h-4 w-4 transform rounded-full bg-white transition`}
					/>
				</Switch>
				{/* Toggle read/unread text on switch change */}
				{reportRead ? (
					<span className="flex gap-2">Read</span>
				) : (
					<span className="flex gap-2">Unread</span>
				)}
			</div>
		</>
	)
}
