/**
 * @fileoverview SwitchRead Component - Toggle for marking reports as read/unread
 *
 * This component provides a UI switch to mark a report as read or unread.
 * Features include:
 * - Fetching report and reporter data from Firestore
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
import { useRouter } from "next/router"
import { getDoc, doc, updateDoc, collection, app } from "firebase/firestore"
import { db } from "../../config/firebase"
import { Switch } from "@headlessui/react"
import { MdMarkAsUnread, MdMarkEmailRead } from "react-icons/md"

const dbInstance = collection(db, 'FKSpyOwuX6JoYF1fyv6b');

/**
 * SwitchRead Component
 *
 * Renders a toggle switch for marking a report as read or unread.
 * Fetches report data, updates Firestore, and provides visual feedback.
 *
 * @param {Object} props
 * @param {string} props.setReportModalId - The ID of the report to toggle
 * @returns {JSX.Element} The rendered read/unread toggle UI
 */
export default function SwitchRead({ setReportModalId }) {
	const [info, setInfo] = useState({})
	const [reporterInfo, setReporterInfo] = useState({})
	const [reportRead, setReportRead] = useState("")
	const router = useRouter()
	const reportId = setReportModalId
	// Get firebase data
	const getData = async () => {
		// Reference to the firebase data
		const infoRef = await getDoc(doc(db, "reports", reportId))
		setInfo(infoRef.data())
		// Reference to the user on firebase
		getDoc(doc(db, "mobileUsers", infoRef.data()["userID"])).then((mobileRef) =>
			setReporterInfo(mobileRef.data())
		)
	}

	/**
	 * getData - Fetches report and reporter data from Firestore and updates state.
	 */
	useEffect(() => {
		getData()
	}, [])

	// Set the "read" field on firebase
	useEffect(() => {
		// If firebase info: read field changes set to the value
		if (info["read"]) {
			setReportRead(info["read"])
		}
	}, [info])

	/**
	 * handleReadChange - Handles toggling the read status and updates Firestore.
	 * @param {boolean} e - The current read state
	 */
	async function handleReadChange(e) {
		// Toggle the switch value (true/false)
		e === !e
		// Set a reference to the firebase doc.
		const docRef = doc(db, "reports", reportId)
		// Update firebase doc "read" field
		await updateDoc(docRef, { read: !e })
	}

	return (
		<>
			{/* Toggle read/unread icon on switch change */}
			<div className="font-semibold self-center pr-4">
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
					// Set checked to the initial reportRead value (false)
					checked={reportRead}
					// When switch toggled setReportRead
					onChange={setReportRead}
					// On click handler
					onClick={() => setReportRead(handleReadChange)}
					className={`${
						reportRead ? "bg-blue-600" : "bg-gray-200"
					} relative inline-flex h-6 w-11 items-center rounded-full`}>
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
