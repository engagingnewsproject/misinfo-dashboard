/**
 * ProtectedRoute Component
 *
 * Restricts access to its children to authenticated users only.
 * Redirects unauthenticated users to the login page.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render if authenticated
 * @returns {JSX.Element|null} The rendered children or null if not authenticated
 */
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

const ProtectedRoute = ({ children }) => {
	const { user, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		// Wait until auth has resolved — redirecting while loading===true and
		// user===null races the post-login onAuthStateChanged → setUser path.
		if (!loading && !user) {
			router.push('/login')
		}
	}, [router, user, loading])

	if (loading) {
		return (
			<div data-component="ProtectedRoute" className="min-h-screen w-full flex flex-col items-center justify-center bg-[#D3D3D3] gap-3">
				<LoadingSpinner className="h-12 w-12 text-[#2E3B4E]" />
				<p className="text-sm text-gray-600">Loading…</p>
			</div>
		)
	}

	return <>{user ? children : null}</>
}

export default ProtectedRoute
