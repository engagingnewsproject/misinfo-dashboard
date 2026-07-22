/**
 * Shared mobile drawer open state for Navbar + Headbar.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const MobileNavContext = createContext(null)

export function MobileNavProvider({ children }) {
	const [open, setOpen] = useState(false)
	const openDrawer = useCallback(() => setOpen(true), [])
	const closeDrawer = useCallback(() => setOpen(false), [])

	const value = useMemo(
		() => ({ open, openDrawer, closeDrawer, setOpen }),
		[open, openDrawer, closeDrawer],
	)

	return (
		<MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>
	)
}

export function useMobileNav() {
	const ctx = useContext(MobileNavContext)
	if (!ctx) {
		return { open: false, openDrawer: null, closeDrawer: () => {}, setOpen: () => {} }
	}
	return ctx
}

export default MobileNavContext
