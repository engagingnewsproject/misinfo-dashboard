import React,{ useEffect } from "react"
import {Tooltip} from "react-tooltip";
import { BsShareFill } from "react-icons/bs"

const ButtonEmailSend = ({ onUserSendEmail, reportModalId }) => {
	const reportURI = "/reports/" + reportModalId

	const handleClick = () => {
		onUserSendEmail(reportURI)
	}
	useEffect(() => {
		console.log(reportURI)
	}, [])
	const style =
		"flex flex-row text-sm bg-white px-4 mb-4 border-none text-black py-1 rounded-md shadow hover:shadow-none tooltip-share-report"
	return (
		<button className={style} onClick={handleClick} type='button'>
			<BsShareFill className='my-1' size={15} />
			<div className='px-3 py-1'>Share The Report</div>
			<Tooltip anchorSelect='.tooltip-share-report' place='top' delayShow={500}>
				Share Report
			</Tooltip>
		</button>
	)
}

export default ButtonEmailSend
