/**
 * PWA install banner for mobile browsers.
 * Android: deferred beforeinstallprompt. iOS: Add to Home Screen instructions.
 */
import { useCallback, useEffect, useState } from 'react'
import { IoShareOutline } from 'react-icons/io5'
import { MdClose, MdInstallMobile } from 'react-icons/md'
import useUserAgent from './UseUserAgent'

const DISMISS_KEY = 'tsl-pwa-install-dismissed'
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000

function wasDismissedRecently() {
	if (typeof window === 'undefined') return true
	try {
		const raw = window.localStorage.getItem(DISMISS_KEY)
		if (!raw) return false
		const ts = Number(raw)
		if (Number.isNaN(ts)) return false
		return Date.now() - ts < DISMISS_MS
	} catch {
		return false
	}
}

function markDismissed() {
	try {
		window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
	} catch {
		// ignore quota / private mode
	}
}

export default function PwaInstallBanner() {
	const { isMobile, isIOS, isStandalone } = useUserAgent()
	const [deferredPrompt, setDeferredPrompt] = useState(null)
	const [visible, setVisible] = useState(false)
	const [showIosHelp, setShowIosHelp] = useState(false)

	useEffect(() => {
		if (isMobile === null || isStandalone === null) return
		if (!isMobile || isStandalone || wasDismissedRecently()) {
			setVisible(false)
			return
		}
		// iOS: always eligible for instructional banner. Android: wait for beforeinstallprompt.
		if (isIOS || deferredPrompt) {
			setVisible(true)
		} else {
			setVisible(false)
		}
	}, [isMobile, isStandalone, isIOS, deferredPrompt])

	useEffect(() => {
		if (typeof window === 'undefined') return undefined

		const onBeforeInstall = (event) => {
			event.preventDefault()
			setDeferredPrompt(event)
		}

		const onInstalled = () => {
			setDeferredPrompt(null)
			setVisible(false)
			setShowIosHelp(false)
		}

		window.addEventListener('beforeinstallprompt', onBeforeInstall)
		window.addEventListener('appinstalled', onInstalled)
		return () => {
			window.removeEventListener('beforeinstallprompt', onBeforeInstall)
			window.removeEventListener('appinstalled', onInstalled)
		}
	}, [])

	const dismiss = useCallback(() => {
		markDismissed()
		setVisible(false)
		setShowIosHelp(false)
	}, [])

	const handleInstall = useCallback(async () => {
		if (deferredPrompt) {
			deferredPrompt.prompt()
			try {
				const choice = await deferredPrompt.userChoice
				if (choice?.outcome === 'accepted') {
					setVisible(false)
				}
			} catch {
				// user dismissed system dialog
			}
			setDeferredPrompt(null)
			return
		}
		if (isIOS) {
			setShowIosHelp(true)
		}
	}, [deferredPrompt, isIOS])

	if (!visible) return null

	const canPromptInstall = Boolean(deferredPrompt)
	const title = isIOS ? 'Add Truth Sleuth to your Home Screen' : 'Install Truth Sleuth'
	const subtitle = isIOS
		? 'Use it like an app — full screen, from your home screen.'
		: 'Install for a faster, full-screen experience.'

	return (
		<div data-component="PwaInstallBanner"
			className="fixed inset-x-0 bottom-0 z-[100] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
			role="region"
			aria-label="Install app"
		>
			<div className="pointer-events-auto mx-auto max-w-md rounded-xl bg-[#2E3B4E] text-white shadow-lg ring-1 ring-black/10">
				<div className="flex items-start gap-3 p-4">
					<div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600">
						<MdInstallMobile size={22} aria-hidden />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold leading-snug">{title}</p>
						<p className="mt-1 text-xs text-white/80 leading-relaxed">{subtitle}</p>

						{showIosHelp && isIOS && (
							<ol className="mt-3 space-y-1.5 text-xs text-white/90">
								<li className="flex items-start gap-1.5">
									<span className="shrink-0">1.</span>
									<span className="inline-flex flex-wrap items-center gap-1">
										Tap Share
										<IoShareOutline className="inline" size={14} aria-hidden />
										in Safari
									</span>
								</li>
								<li>
									<span className="shrink-0">2.</span> Scroll and tap{' '}
									<span className="font-semibold">Add to Home Screen</span>
								</li>
								<li>
									<span className="shrink-0">3.</span> Tap <span className="font-semibold">Add</span>
								</li>
							</ol>
						)}

						<div className="mt-3 flex flex-wrap items-center gap-2">
							<button
								type="button"
								onClick={handleInstall}
								className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[#2E3B4E]"
							>
								{isIOS && !canPromptInstall
									? showIosHelp
										? 'Show steps again'
										: 'How to add'
									: 'Install'}
							</button>
							<button
								type="button"
								onClick={dismiss}
								className="rounded-md px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white"
							>
								Not now
							</button>
						</div>
					</div>
					<button
						type="button"
						onClick={dismiss}
						className="shrink-0 rounded p-1 text-white/70 hover:text-white"
						aria-label="Dismiss install banner"
					>
						<MdClose size={18} />
					</button>
				</div>
			</div>
		</div>
	)
}
