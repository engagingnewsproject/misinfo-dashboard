/**
 * Offline fallback shown by the service worker when a navigation fails.
 */
import Head from 'next/head'
import { Typography } from '@material-tailwind/react'
import { GiMagnifyingGlass } from 'react-icons/gi'

const Offline = () => {
	return (
		<>
			<Head>
				<title>Offline | Truth Sleuth Local</title>
			</Head>
			<div className="w-screen min-h-screen flex justify-center items-center bg-[#D3D3D3] px-4">
				<div className="w-full max-w-sm text-center">
					<div className="flex flex-col items-center justify-center mb-6">
						<div className="bg-blue-600 p-7 rounded-full mb-2">
							<GiMagnifyingGlass size={30} className="fill-white" />
						</div>
						<Typography variant="small" className="text-xs font-semibold text-[#2E3B4E]">
							Truth Sleuth Local
						</Typography>
					</div>
					<Typography variant="h5" className="text-[#2E3B4E] font-semibold mb-2">
						You&apos;re offline
					</Typography>
					<Typography className="text-sm text-gray-600 mb-6">
						Reconnect to the internet to continue using Truth Sleuth Local.
					</Typography>
					<button
						type="button"
						onClick={() => typeof window !== 'undefined' && window.location.reload()}
						className="inline-flex items-center justify-center rounded-md bg-[#2E3B4E] px-4 py-2.5 text-sm font-medium text-white"
					>
						Try again
					</button>
				</div>
			</div>
		</>
	)
}

export default Offline
