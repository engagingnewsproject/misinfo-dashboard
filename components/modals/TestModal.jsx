import React, { useEffect } from "react"
import Switch from "react-switch"

const TestModal = ({
	// report
	report,
	reports,
	// modal
	setTestModalShow,
	// labels
	activeLabels,
	selectedLabel,
	onLabelChange,
	// read/unread
	read,
	checked,
	handleChange,
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
	
  // Function to handle checkbox change and update parent state
  const handleCheckboxChange = () => {
    // Invert the current read state
    const newReadState = !read;
    // Call the function passed from TestComponent to update the read state
    onReadChange(newReadState);
    // Log the value of the read state after toggling
    console.log('Read state after toggling in TestModal:', newReadState);
	};
	
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
						{/* <input
								type="checkbox"
								id="checkbox"
								checked={read}
								onChange={handleCheckboxChange} // Use local function to update parent state
						/> */}
							{/* Render the Switch component */}
							<Switch
								onChange={handleChange} // Use the handleChange function from props
								checked={checked} // Use the checked state from props
							/>
						<p>The switch is {checked ? "on" : "off"}.</p>
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
