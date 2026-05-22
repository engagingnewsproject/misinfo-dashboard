import {
	Button,
	Menu,
	MenuHandler,
	MenuItem,
	MenuList,
} from '@material-tailwind/react'
import React from 'react'
import { createPortal } from 'react-dom'
import { IoCalendarOutline, IoChevronDownOutline } from 'react-icons/io5'

const DATE_PANEL_WIDTH = 220

const weekOptions = [
	{ value: '4', label: 'Last four weeks' },
	{ value: '3', label: 'Last three weeks' },
	{ value: '2', label: 'Last two weeks' },
	{ value: '1', label: 'Last week' },
	{ value: 'custom', label: 'Select dates' },
	{ value: '100', label: 'All reports' },
]

const formatDateLabel = (isoDate) => {
	if (!isoDate) return ''
	const [year, month, day] = isoDate.split('-').map(Number)
	return new Date(year, month - 1, day).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

const getWeekButtonLabel = (reportWeek, customDateStart, customDateEnd) => {
	if (reportWeek === 'custom') {
		if (customDateStart && customDateEnd) {
			return `${formatDateLabel(customDateStart)} – ${formatDateLabel(customDateEnd)}`
		}
		if (customDateStart) return `From ${formatDateLabel(customDateStart)}`
		if (customDateEnd) return `Until ${formatDateLabel(customDateEnd)}`
		return 'Select dates'
	}
	return (
		weekOptions.find((option) => option.value === reportWeek)?.label ||
		'Select time'
	)
}

const filterButtonClass =
	'flex items-center gap-1 text-sm capitalize border-b-2 border-l-2 border-r-2'

const rowsOptions = [
	{ label: '10 rows', value: 10 },
	{ label: '20 rows', value: 20 },
	{ label: '30 rows', value: 30 },
	{ label: '50 rows', value: 50 },
]

const typeOptions = [
	{ label: 'All types', value: 'all' },
	{ label: 'Community', value: 'public' },
	{ label: 'Agency', value: 'agency' },
	{ label: 'Scraped', value: 'scrape' },
]

export function TableDropdownMenu({
	reportWeek,
	onChange,
	customDateStart = '',
	customDateEnd = '',
	onCustomDateStartChange,
	onCustomDateEndChange,
	rowsPerPage,
	setRowsPerPage,
	setCurrentPage,
	onTypeChange,
	agencies,
	agencyFilter,
	onAgencyChange,
}) {
	const [openMenu, setOpenMenu] = React.useState(false)
	const [openDateMenu, setOpenDateMenu] = React.useState(false)
	const dateMenuRef = React.useRef(null)
	const calendarButtonRef = React.useRef(null)
	const [datePanelPosition, setDatePanelPosition] = React.useState(null)
	const [openRowsMenu, setOpenRowsMenu] = React.useState(false)
	const [openTypesMenu, setOpenTypesMenu] = React.useState(false)
	const [openAgencyMenu, setOpenAgencyMenu] = React.useState(false)
	const [selectedType, setSelectedType] = React.useState(typeOptions[0])

	const agencyOptions = React.useMemo(
		() => [
			{ value: 'all', label: 'All agencies' },
			...(agencies ?? []).map((a) => ({ value: a, label: a })),
		],
		[agencies],
	)

	const selectedAgencyLabel =
		agencyOptions.find((option) => option.value === agencyFilter)?.label ||
		'All agencies'

	const handleWeekMenuOpen = (open) => {
		setOpenMenu(open)
		setOpenDateMenu(false)
	}

	const handleWeekSelect = (value) => {
		onChange(value)
		setOpenMenu(false)
		setOpenDateMenu(false)
	}

	const handleDateInputKeyDown = (event) => {
		if (event.key !== 'Enter') return
		event.preventDefault()
		if (customDateStart && customDateEnd) {
			setOpenDateMenu(false)
		}
	}

	const weekButtonLabel = getWeekButtonLabel(
		reportWeek,
		customDateStart,
		customDateEnd,
	)

	const updateDatePanelPosition = React.useCallback(() => {
		const el = calendarButtonRef.current
		if (!el) return
		const rect = el.getBoundingClientRect()
		setDatePanelPosition({
			top: rect.bottom + 4,
			left: Math.max(8, rect.right - DATE_PANEL_WIDTH),
		})
	}, [])

	React.useEffect(() => {
		if (!openDateMenu) {
			setDatePanelPosition(null)
			return undefined
		}
		updateDatePanelPosition()
		window.addEventListener('resize', updateDatePanelPosition)
		window.addEventListener('scroll', updateDatePanelPosition, true)
		return () => {
			window.removeEventListener('resize', updateDatePanelPosition)
			window.removeEventListener('scroll', updateDatePanelPosition, true)
		}
	}, [openDateMenu, updateDatePanelPosition])

	React.useEffect(() => {
		if (!openDateMenu) return undefined

		const handlePointerDown = (event) => {
			if (dateMenuRef.current?.contains(event.target)) return
			if (calendarButtonRef.current?.contains(event.target)) return
			setOpenDateMenu(false)
		}

		document.addEventListener('mousedown', handlePointerDown)
		return () => document.removeEventListener('mousedown', handlePointerDown)
	}, [openDateMenu, customDateStart, customDateEnd])

	React.useEffect(() => {
		if (reportWeek !== 'custom') {
			setOpenDateMenu(false)
		}
	}, [reportWeek])

	const handleRowsPerPageSelect = (value) => {
		setRowsPerPage(value)
		setCurrentPage(1) // Reset to the first page when rows per page changes
		setOpenRowsMenu(false) // Close menu after selection
	}

	const handleTypeSelect = (option) => {
		// set selected type for display and notify parent to filter
		setSelectedType(option)
		setOpenTypesMenu(false)
		if (onTypeChange) onTypeChange(option.value)
	}

	const handleAgencySelect = (value) => {
		if (onAgencyChange) onAgencyChange(value)
		setOpenAgencyMenu(false)
	}

	return (
		<div className='flex flex-row'>
			{onAgencyChange && (
				<Menu open={openAgencyMenu} handler={setOpenAgencyMenu}>
					<MenuHandler>
						<Button
							variant="text"
							size="sm"
							color="gray"
							className="flex items-center gap-1 text-sm capitalize border-b-2 border-l-2 border-r-2">
							{selectedAgencyLabel}
							<IoChevronDownOutline
								strokeWidth={2.5}
								className={`h-3.5 w-3.5 transition-transform ${openAgencyMenu ? 'rotate-180' : ''}`}
							/>
						</Button>
					</MenuHandler>
					<MenuList>
						{agencyOptions.map((option) => (
							<MenuItem
								key={option.value}
								onClick={() => handleAgencySelect(option.value)}>
								{option.label}
							</MenuItem>
						))}
					</MenuList>
				</Menu>
			)}

			<Menu open={openTypesMenu} handler={setOpenTypesMenu}>
				<MenuHandler>
					<Button
						variant="text"
						size="sm"
						color="gray"
						className="flex items-center gap-1 text-sm capitalize border-b-2 border-l-2 border-r-2">
						{selectedType?.label || 'Type'}
						<IoChevronDownOutline
							strokeWidth={2.5}
							className={`h-3.5 w-3.5 transition-transform ${openTypesMenu ? 'rotate-180' : ''}`}
						/>
					</Button>
				</MenuHandler>
				<MenuList>
					{typeOptions.map((option) => (
						<MenuItem key={option.value} onClick={() => handleTypeSelect(option)}>
							{option.label}
						</MenuItem>
					))}
				</MenuList>
			</Menu>

			<Menu open={openRowsMenu} handler={setOpenRowsMenu}>
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

			<div className="flex flex-row">
				<Menu open={openMenu} handler={handleWeekMenuOpen}>
					<MenuHandler>
						<Button
							variant="text"
							size="sm"
							color="gray"
							className={`${filterButtonClass} ${
								reportWeek === 'custom' ? 'rounded-r-none border-r-0' : ''
							} ${
								reportWeek === 'custom' && (customDateStart || customDateEnd)
									? 'normal-case'
									: ''
							}`}>
							{weekButtonLabel}
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
								className={
									reportWeek === option.value
										? 'bg-blue-gray-50 font-medium'
										: ''
								}
								onClick={() => handleWeekSelect(option.value)}>
								{option.label}
							</MenuItem>
						))}
					</MenuList>
				</Menu>

				{reportWeek === 'custom' &&
					onCustomDateStartChange &&
					onCustomDateEndChange && (
						<span ref={calendarButtonRef} className="inline-flex">
							<Button
								variant="text"
								size="sm"
								color="gray"
								className={`${filterButtonClass} rounded-l-none border-l-0 px-2`}
								aria-label="Choose date range"
								aria-expanded={openDateMenu}
								onClick={() => setOpenDateMenu((open) => !open)}>
								<IoCalendarOutline className="h-4 w-4" />
							</Button>
							{openDateMenu &&
								datePanelPosition &&
								typeof document !== 'undefined' &&
								createPortal(
									<div
										ref={dateMenuRef}
										role="dialog"
										aria-label="Date range"
										style={{
											position: 'fixed',
											top: datePanelPosition.top,
											left: datePanelPosition.left,
											zIndex: 9999,
											minWidth: DATE_PANEL_WIDTH,
										}}
										className="p-3 bg-white border border-blue-gray-50 rounded-md shadow-lg shadow-blue-gray-500/10 font-sans text-sm text-blue-gray-500">
										<div className="flex flex-col gap-2">
											<label className="flex flex-col gap-1">
												<span className="text-xs font-medium text-blue-gray-700">
													Start date
												</span>
												<input
													type="date"
													className="border rounded px-2 py-1 text-sm w-full"
													value={customDateStart}
													max={customDateEnd || undefined}
													onChange={(e) =>
														onCustomDateStartChange(e.target.value)
													}
													onKeyDown={handleDateInputKeyDown}
												/>
											</label>
											<label className="flex flex-col gap-1">
												<span className="text-xs font-medium text-blue-gray-700">
													End date
												</span>
												<input
													type="date"
													className="border rounded px-2 py-1 text-sm w-full"
													value={customDateEnd}
													min={customDateStart || undefined}
													onChange={(e) =>
														onCustomDateEndChange(e.target.value)
													}
													onKeyDown={handleDateInputKeyDown}
												/>
											</label>
										</div>
									</div>,
									document.body,
								)}
						</span>
					)}
			</div>
		</div>
	)
}
