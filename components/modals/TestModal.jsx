import React, { useState, useEffect } from "react"
import { db } from "../../config/firebase"
import { doc, updateDoc } from "firebase/firestore"
import Switch from "react-switch"

const TestModal = ({
	report,
	setTestModalShow,
	activeLabels,
	selectedLabel,
	onLabelChange,
	checked,
	onReadChange,
	onFormSubmit,
}) => {

	useEffect(() => {
		console.log(checked)
	}, [onReadChange])
	
	const modal = {
		wrap: "fixed z-[1200] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto",
		inner:
			"absolute flex justify-center items-center z-[1300] top-4 left-0 right-0 sm:overflow-y-scroll",
		content:
			"flex-col justify-center items-center lg:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible",
	}

	return (
		<div className={modal.wrap} onClick={() => setTestModalShow(false)}>
			<div className={modal.inner}>
				<div className={modal.content}>
					<h2>{report.title}</h2>
					<form onSubmit={onFormSubmit}>
						<span
							onClick={(e) => {
								e.stopPropagation()
							}}>
							<Switch
								onChange={(checked) => onReadChange(report.id, checked)}
								checked={checked}
							/>
							<p>read {checked ? "yes" : "no"}.</p>
						</span>
						<select id='labels' onChange={onLabelChange} value={selectedLabel}>
							<option value=''>Choose a label</option>
							{activeLabels.map((label, i) => (
								<option value={label} key={i}>
									{label}
								</option>
							))}
						</select>
						<button type="button">Submit</button>
					</form>
				</div>
			</div>
		</div>
	)
}

export default TestModal
