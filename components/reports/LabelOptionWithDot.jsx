import React from 'react'
import { getLabelColor } from '../../config/labels'

/**
 * Renders a label name with its color dot, used in label pickers and selects.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {Record<string, string>} [props.agencyLabelColors]
 */
const LabelOptionWithDot = ({ label, agencyLabelColors = {} }) => {
	const dotColor = getLabelColor(label, agencyLabelColors)

	return (
		<span data-component="LabelOptionWithDot" className="flex items-center gap-2">
			<span
				className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
				style={{ backgroundColor: dotColor }}
				aria-hidden="true"
			/>
			{label}
		</span>
	)
}

export default LabelOptionWithDot
