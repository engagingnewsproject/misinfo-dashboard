import React, { useState, useEffect } from "react"
import Switch from "react-switch"

const TestModal = ({
	report,
	testModalShow,
	setTestModalShow,
	activeLabels,
	selectedLabel,
	onLabelChange,
	checked,
	onReadChange,
	onModalReadChange,
	onFormSubmit,
}) => {
	// const [localChecked, setLocalChecked] = useState(checked)
	const modal = {
		wrap: "fixed z-[1200] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto",
		inner:
			"absolute flex justify-center items-center z-[1300] top-4 left-0 right-0 sm:overflow-y-scroll",
		content:
			"flex-col justify-center items-center lg:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible",
	}
// Call onModalReadChange when switch state changes
// const handleChange = () => {
//   const newChecked = !localChecked;
//   setLocalChecked(newChecked);
//   onModalReadChange(report.id, newChecked); // Call the parent's function to update the checked prop
//   onReadChange(report.id, newChecked); // Also update Firestore
// };

	
	useEffect(() => {
		console.log(checked)
		console.log(report.id)
	}, [testModalShow])
	
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
						<Switch onChange={onReadChange} checked={checked} />
						<p>read {checked ? "yes" : "no"}.</p>
						<select id='labels' onChange={onLabelChange} value={selectedLabel}>
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
