import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { getDoc, doc, updateDoc } from "@firebase/firestore"
import { db } from "../config/firebase"
import { Switch } from "@headlessui/react"
import { MdMarkAsUnread, MdMarkEmailRead } from "react-icons/md"

export default function SwitchRead(props) {
	const userId = localStorage.getItem("userId")
	const router = useRouter()
	const [info, setInfo] = useState({})
	const [reporterInfo, setReporterInfo] = useState({})
	const [reportRead, setReportRead] = useState("")
	const { reportId } = router.query

	const getData = async () => {
		const infoRef = await getDoc(doc(db, "reports", reportId))
		setInfo(infoRef.data())

		getDoc(doc(db, "mobileUsers", infoRef.data()["userID"])).then((mobileRef) =>
			setReporterInfo(mobileRef.data())
		)
	}

	useEffect(() => {
		getData()
	}, [])

	useEffect(() => {
		if (info["read"]) {
			setReportRead(info["read"])
		}
	}, [info])

	async function handleReadChange(e) {
		e === !e
		// Get firebase doc.
		const docRef = doc(db, "reports", reportId)
		// Update firebase doc.
		await updateDoc(docRef, { read: !reportRead })
		return !e
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
					checked={reportRead}
					onChange={setReportRead}
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
