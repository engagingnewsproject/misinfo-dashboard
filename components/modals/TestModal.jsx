import React, {useState} from "react"
import { Switch } from '@headlessui/react'

const TestModal = ({
	// report
	report,
	// modal
	setTestModalShow,
	// labels
	activeLabels,
	selectedLabel,
	onLabelChange,
	// read/unread
	enabled,
	setEnabled,
	// form submit
	onFormSubmit,
}) => {
	const modal = {
		wrap: "fixed z-[1200] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto",
		inner:
			"absolute flex justify-center items-center z-[1300] top-4 left-0 right-0 sm:overflow-y-scroll",
		content:
			"flex-col justify-center items-center lg:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible",
	}

	return (
		<div className={modal.wrap} onClick={() => setTestModalShow(false)}>
			<div
				className={modal.inner}
				onClick={(e) => {
					e.stopPropagation()
				}}>
				<div className={modal.content}>
					<h2>{report.title}</h2>
					<form onSubmit={onFormSubmit}>
						<Switch
							checked={enabled}
							onChange={setEnabled}
							className={`${
								enabled ? "bg-blue-600" : "bg-gray-200"
							} relative inline-flex h-6 w-11 items-center rounded-full`}>
							<span className='sr-only'>Enable notifications</span>
							<span
								className={`${
									enabled ? "translate-x-6" : "translate-x-1"
								} inline-block h-4 w-4 transform rounded-full bg-white transition`}
							/>
						</Switch>
						<select
							id='labels'
							onChange={onLabelChange}
							value={selectedLabel}
							className='text-sm inline-block px-8 border-none bg-yellow-400 py-1 rounded-2xl shadow hover:shadow-none'>
							<option value=''>Choose a label</option>
							{activeLabels.map((label, i) => (
								<option value={label} key={i}>
									{label}
								</option>
							))}
						</select>
						<button type='submit'>Close</button>
					</form>
				</div>
			</div>
		</div>
	)
}

export default TestModal
