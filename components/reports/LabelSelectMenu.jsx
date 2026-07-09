import React, { useState } from 'react'
import {
	Button,
	Menu,
	MenuHandler,
	MenuItem,
	MenuList,
} from '@material-tailwind/react'
import { IoChevronDownOutline } from 'react-icons/io5'
import {
	DEFAULT_REPORT_LABEL,
	displayLabel,
	getLabelBadgeStyle,
} from '../../config/labels'
import LabelOptionWithDot from './LabelOptionWithDot'

/**
 * Label picker using Material Tailwind Menu. The trigger shows the current
 * label as a colored pill (matching table badges); options open in a dropdown.
 *
 * @param {Object} props
 * @param {string} [props.id]
 * @param {string[]} props.labelOptions
 * @param {string} props.selectedLabel
 * @param {Record<string, string>} [props.agencyLabelColors]
 * @param {(e: { preventDefault: () => void, target: { value: string } }) => void} props.onLabelChange
 */
const LabelSelectMenu = ({
	id = 'labels',
	labelOptions = [],
	selectedLabel,
	agencyLabelColors = {},
	onLabelChange,
}) => {
	const [openMenu, setOpenMenu] = useState(false)
	const resolvedLabel = selectedLabel || DEFAULT_REPORT_LABEL
	const handlerStyle = getLabelBadgeStyle(resolvedLabel, agencyLabelColors)

	const handleSelect = (label) => {
		setOpenMenu(false)
		onLabelChange({
			preventDefault: () => {},
			target: { value: label },
		})
	}

	return (
		<Menu open={openMenu} handler={setOpenMenu} placement="bottom-start">
			<MenuHandler>
				<Button
					id={id}
					type="button"
					variant="text"
					size="sm"
					className="flex items-center gap-2 text-sm normal-case px-8 py-1 rounded-2xl shadow hover:shadow-none"
					style={handlerStyle}
					aria-haspopup="listbox"
					aria-expanded={openMenu}>
					{displayLabel(resolvedLabel)}
					<IoChevronDownOutline
						strokeWidth={2.5}
						className={`h-3.5 w-3.5 transition-transform ${openMenu ? 'rotate-180' : ''}`}
					/>
				</Button>
			</MenuHandler>
			<MenuList className="z-[10000] max-h-72">
				{labelOptions.map((label) => {
					const isSelected = label === resolvedLabel

					return (
						<MenuItem
							key={label}
							className={`flex items-center gap-2 ${isSelected ? 'bg-blue-gray-50 font-medium' : ''}`}
							onClick={() => handleSelect(label)}>
							<LabelOptionWithDot
								label={label}
								agencyLabelColors={agencyLabelColors}
							/>
						</MenuItem>
					)
				})}
			</MenuList>
		</Menu>
	)
}

export default LabelSelectMenu
