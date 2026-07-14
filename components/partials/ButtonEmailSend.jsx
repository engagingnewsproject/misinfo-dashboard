import React from 'react'
import { Tooltip } from 'react-tooltip'
import { BsShareFill } from 'react-icons/bs'

/**
 * Button that opens the share-report flow for the current report.
 *
 * @param {Object} props
 * @param {() => void} props.onButtonEmailSendClick - Opens the share modal
 */
const ButtonEmailSend = ({ onButtonEmailSendClick }) => {
	const style =
		'flex flex-row text-sm bg-white px-4 mb-4 border-none text-black py-1 rounded-md shadow hover:shadow-none tooltip-share-report'
	return (
		<button className={style} onClick={onButtonEmailSendClick} type='button'>
			<BsShareFill className='my-1' size={15} />
			<div className='px-3 py-1'>Share The Report</div>
			<Tooltip anchorSelect='.tooltip-share-report' place='top' delayShow={500}>
				Share Report
			</Tooltip>
		</button>
	)
}

export default ButtonEmailSend
