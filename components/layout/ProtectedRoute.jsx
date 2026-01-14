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

const ProtectedRoute = ({ children }) => {

    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!user) {
            router.push('/login')
        }

    }, [router, user])
    
    return <>{user ? children : null}</>
}

export default ProtectedRoute