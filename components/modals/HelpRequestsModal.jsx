import { Button } from '@material-tailwind/react'
import Image from 'next/image'
import Link from 'next/link'
import React, { Fragment } from 'react'
import { IoClose } from 'react-icons/io5'

const style = {
	modal_background:
		'fixed z-[9998] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto',
	modal_container:
		'absolute inset-0 flex justify-center items-center z-[9999] sm:overflow-y-scroll',
	modal_wrapper:
		'flex-col justify-center items-center w-10/12 md:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible',
	modal_header_container: 'grid md:gap-5 lg:gap-5 auto-cols-auto mb-6',
	modal_header_wrapper: 'flex w-full items-baseline justify-between',
	modal_header: 'text-lg font-bold text-blue-600 tracking-wider',
	modal_close: 'text-gray-800',
	modal_form_container:
		'grid justify-center md:gap-5 lg:gap-5 grid-cols-2 auto-cols-auto',
	modal_form_label:
		'text-lg font-bold text-black tracking-wider mb-4 capitalize',
	modal_form_switch: 'flex mb-4 col-span-2',
	modal_form_upload_image:
		'block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer',
	modal_form_radio_container: 'flex gap-2 col-span-2',
	modal_form_radio: 'mr-1',
	modal_form_input:
		'shadow border-none rounded-xl min-w-full col-span-2 p-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
	modal_form_button:
		'bg-blue-600 self-end hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline',
}

// Function to format camelCase or PascalCase labels by adding spaces between words
const formatLabel = (label) => {
	return label.replace(/([a-z])([A-Z])/g, '$1 $2')
}

const HelpRequestsModal = ({ helpRequestInfo, handleClose, mailtoLink }) => {
	return (
		<div className={style.modal_background} onClick={handleClose}>
			<div className={style.modal_container}>
				<div
					className={style.modal_wrapper}
					onClick={(e) => e.stopPropagation()}>
					<div className={style.modal_header_container}>
						<div className={style.modal_header_wrapper}>
							<div className={style.modal_header}>Help Request Info</div>
							<button onClick={handleClose} className={style.modal_close}>
								<IoClose size={25} />
							</button>
						</div>
					</div>

					<div className="mb-8">
						<form>
							<div className={style.modal_form_container}>
								{Object.entries(helpRequestInfo).map(([key, value], index) => (
									<Fragment key={key}>
										<div className={style.modal_form_label}>
											{formatLabel(key)}
										</div>
										<div className={style.modal_form_data}>
											{key === 'images' ? (
												<div className="grid grid-cols-1 gap-y-4">
													{(Array.isArray(value) ? value : [value]).map(
														(image, imgIndex) => (
															<Link
																key={imgIndex}
																href={image}
																passHref={true}
																target="_blank">
																<Image
																	src={`${image}`}
																	width={100}
																	height={100}
																	className="w-auto"
																	alt={`image-${imgIndex}`}
																/>
															</Link>
														),
													)}
												</div>
											) : key === 'email' ? (
												<Link
													href={mailtoLink}
													target="_blank"
													className="underline">
													{value}
												</Link>
											) : (
												<span>{value}</span>
											)}
										</div>
									</Fragment>
								))}
							</div>
						</form>
					</div>

					<Link href={mailtoLink} target="_blank">
						<Button
							color="blue"
							buttonType="filled"
							size="regular"
							rounded={false}
							block={false}
							iconOnly={false}
							ripple="light"
							className={style.modal_form_button}>
							Reply
						</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}

export default HelpRequestsModal
