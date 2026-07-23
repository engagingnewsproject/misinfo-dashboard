import { useEffect, useState } from 'react'

/**
 * Delays Material Tailwind Dialog `open` by one tick so Floating UI 0.19
 * does not log aria-hidden "not contained inside body" on open/mount.
 *
 * @param {boolean} [open=true] Controlled open prop, or omit when the modal is
 *   only mounted while visible (treated as always open while mounted).
 * @returns {boolean} Value to pass to Dialog's `open` prop
 */
export function useDelayedDialogOpen(open = true) {
	const [dialogOpen, setDialogOpen] = useState(false)

	useEffect(() => {
		if (!open) {
			setDialogOpen(false)
			return
		}
		const id = window.setTimeout(() => setDialogOpen(true), 0)
		return () => window.clearTimeout(id)
	}, [open])

	return dialogOpen
}
