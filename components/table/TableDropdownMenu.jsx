import React from 'react'
import {
	Menu,
	MenuHandler,
	MenuList,
	MenuItem,
	Button,
} from '@material-tailwind/react'
import { IoChevronDownOutline } from 'react-icons/io5'

const weekOptions = [
	{ value: '4', label: 'Last four weeks' },
	{ value: '3', label: 'Last three weeks' },
	{ value: '2', label: 'Last two weeks' },
	{ value: '1', label: 'Last week' },
	{ value: '100', label: 'All reports' },
]

const rowsOptions = [
	{ label: '10 rows', value: 10 },
	{ label: '20 rows', value: 20 },
	{ label: '30 rows', value: 30 },
	{ label: '50 rows', value: 50 },
]

export function TableDropdownMenu({ reportWeek, onChange, rowsPerPage, setRowsPerPage, setCurrentPage }) {
	const [openMenu,setOpenMenu] = React.useState(false)
	const [openRowsMenu, setOpenRowsMenu] = React.useState(false)

	const handleWeekSelect = (value) => {
		onChange(value)
		setOpenMenu(false) // Close the menu after selection
	}
	const handleRowsPerPageSelect = (value) => {
		setRowsPerPage(value)
		setCurrentPage(1) // Reset to the first page when rows per page changes
		setOpenRowsMenu(false) // Close menu after selection
	}
	return (
		<div className='flex flex-row'>
			<Menu open={openRowsMenu} handler={setOpenRowsMenu} allowHover>
				<MenuHandler>
					<Button
						variant="text"
						size="sm"
						color="gray"
						className="flex items-center gap-1 text-sm capitalize border-b-2 border-l-2 border-r-2">
						{`${rowsPerPage} rows`}
						<IoChevronDownOutline
							strokeWidth={2.5}
							className={`h-3.5 w-3.5 transition-transform ${openRowsMenu ? 'rotate-180' : ''}`}
						/>
					</Button>
				</MenuHandler>
				<MenuList>
					{rowsOptions.map((option) => (
						<MenuItem
							key={option.value}
							onClick={() => handleRowsPerPageSelect(option.value)}>
							{option.label}
						</MenuItem>
					))}
				</MenuList>
			</Menu>

			<Menu open={openMenu} handler={setOpenMenu} allowHover>
				<MenuHandler>
					<Button
						variant="text"
						size="sm"
						color="gray"
						className="flex items-center gap-1 text-sm capitalize border-b-2 border-l-2 border-r-2"
						// gap-3 text-base font-normal capitalize tracking-normal"
					>
						{weekOptions.find((option) => option.value === reportWeek)?.label ||
							'Select time'}
						<IoChevronDownOutline
							strokeWidth={2.5}
							className={`h-3.5 w-3.5 transition-transform ${openMenu ? 'rotate-180' : ''}`}
						/>
					</Button>
				</MenuHandler>
				<MenuList>
					{weekOptions.map((option) => (
						<MenuItem
							key={option.value}
							onClick={() => handleWeekSelect(option.value)}>
							{option.label}
						</MenuItem>
					))}
				</MenuList>
			</Menu>
		</div>
	)
}
