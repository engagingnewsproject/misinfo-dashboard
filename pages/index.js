import { useRouter } from 'next/router'

/**
 * @fileoverview Root Index Page - Redirects to login
 *
 * This file immediately redirects users to the login page.
 * Used as the root entry point for the application.
 *
 * Integrates with:
 * - next/router for navigation
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

export default function Home() {

  const router = useRouter()
  router.push('/login')

  /**
   * Home (Index Page)
   *
   * Redirects users to the login page.
   *
   * @returns {JSX.Element} The loading/redirect UI
   */

  return (
    <div>
      <h1>Loading...</h1>
    </div>
  )
}
