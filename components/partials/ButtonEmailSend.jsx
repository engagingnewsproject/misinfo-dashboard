import React from 'react'
import { Button } from '@material-tailwind/react'
import { Tooltip } from 'react-tooltip'
import { BsShareFill } from 'react-icons/bs'

/**
 * Button that opens the share-report flow for the current report.
 *
 * @param {Object} props
 * @param {() => void} props.onButtonEmailSendClick - Opens the share modal
 */
const ButtonEmailSend = ({ onButtonEmailSendClick }) => {
	return (
		<Button data-component="ButtonEmailSend"
			type="button"
			variant="outlined"
			className="flex flex-row items-center gap-2 normal-case mb-4 tooltip-share-report"
			onClick={onButtonEmailSendClick}>
			<BsShareFill size={15} />
			Share The Report
			<Tooltip anchorSelect=".tooltip-share-report" place="top" delayShow={500}>
				Share Report
			</Tooltip>
		</Button>
	)
}

export default ButtonEmailSend
