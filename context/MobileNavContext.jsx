/**
 * Shared nav drawer state: mobile open/close + desktop expand/collapse.
 * Expanded width is content-sized (measured) up to NAV_EXPANDED_MAX_WIDTH.
 */
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'

export const NAV_COLLAPSED_WIDTH = 65
/** Cap for desktop-expanded drawer (MT Drawer `size` → max-width). */
export const NAV_EXPANDED_MAX_WIDTH = 280

const DESKTOP_EXPANDED_KEY = 'tsl-nav-desktop-expanded'

const MobileNavContext = createContext(null)

function readStoredExpanded() {
	if (typeof window === 'undefined') return false
	try {
		return window.localStorage.getItem(DESKTOP_EXPANDED_KEY) === '1'
	} catch {
		return false
	}
}

export function MobileNavProvider({ children }) {
	const [open, setOpen] = useState(false)
	const [desktopExpanded, setDesktopExpanded] = useState(readStoredExpanded)
	const [measuredExpandedWidth, setMeasuredExpandedWidth] = useState(null)

	const openDrawer = useCallback(() => setOpen(true), [])
	const closeDrawer = useCallback(() => setOpen(false), [])

	const toggleDesktopExpanded = useCallback(() => {
		setDesktopExpanded((prev) => {
			const next = !prev
			try {
				window.localStorage.setItem(DESKTOP_EXPANDED_KEY, next ? '1' : '0')
			} catch {
				// ignore
			}
			return next
		})
	}, [])

	const setMeasuredDrawerWidth = useCallback((width) => {
		if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) return
		const next = Math.min(Math.ceil(width), NAV_EXPANDED_MAX_WIDTH)
		setMeasuredExpandedWidth((prev) => (prev === next ? prev : next))
	}, [])

	const drawerWidth = desktopExpanded
		? measuredExpandedWidth ?? NAV_EXPANDED_MAX_WIDTH
		: NAV_COLLAPSED_WIDTH

	const value = useMemo(
		() => ({
			open,
			openDrawer,
			closeDrawer,
			setOpen,
			desktopExpanded,
			toggleDesktopExpanded,
			drawerWidth,
			setMeasuredDrawerWidth,
		}),
		[
			open,
			openDrawer,
			closeDrawer,
			desktopExpanded,
			toggleDesktopExpanded,
			drawerWidth,
			setMeasuredDrawerWidth,
		],
	)

	return (
		<MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>
	)
}

export function useMobileNav() {
	const ctx = useContext(MobileNavContext)
	if (!ctx) {
		return {
			open: false,
			openDrawer: null,
			closeDrawer: () => {},
			setOpen: () => {},
			desktopExpanded: false,
			toggleDesktopExpanded: () => {},
			drawerWidth: NAV_COLLAPSED_WIDTH,
			setMeasuredDrawerWidth: () => {},
		}
	}
	return ctx
}

/**
 * Desktop content offset that tracks sidebar width (fixed drawer).
 * On mobile the drawer overlays, so only base padding applies.
 */
export function useNavContentOffsetStyle() {
	const { drawerWidth } = useMobileNav()
	const [isDesktop, setIsDesktop] = useState(false)

	useEffect(() => {
		const mq = window.matchMedia('(min-width: 640px)')
		const update = () => setIsDesktop(mq.matches)
		update()
		mq.addEventListener('change', update)
		return () => mq.removeEventListener('change', update)
	}, [])

	if (!isDesktop) return undefined
	return {
		paddingLeft: drawerWidth,
		transition: 'padding-left 200ms ease-in-out',
	}
}

export default MobileNavContext
