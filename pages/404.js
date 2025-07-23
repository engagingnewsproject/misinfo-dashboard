import { useEffect, useState } from 'react';
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext';
import { Button, Typography } from "@material-tailwind/react"
import Link from 'next/link';
import Head from 'next/head';
/**
 * @fileoverview Custom 404 Page - Not Found handler with role-based redirect
 *
 * This file customizes the Next.js 404 page to:
 * - Display a user-friendly "Page Not Found" message
 * - Redirect users to the appropriate home/dashboard page based on their role
 * - Prefetches the target page for faster navigation
 *
 * Integrates with:
 * - AuthContext for user role detection
 * - next/router for navigation
 * - Material Tailwind for UI components
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
/**
 * Custom404
 *
 * Renders a 404 Not Found page with a role-based home/dashboard redirect button.
 *
 * @returns {JSX.Element} The rendered 404 page
 */
export default function Custom404() {
	const router = useRouter()
	const customClaims = useAuth()
	const [homeLink,setHomeLink] = useState('')
	
  useEffect(() => {
    console.log("customClaims:", customClaims);
    if (customClaims && customClaims.customClaims) {
      if (customClaims.customClaims.admin) {
        console.log("User is admin");
        setHomeLink('/dashboard');
        router.prefetch('/dashboard');
      } else if (customClaims.customClaims.agency) {
        console.log("User is agency");
        setHomeLink('/dashboard');
        router.prefetch('/dashboard');
      } else {
        console.log("User is neither admin nor agency");
        setHomeLink('/report');
        router.prefetch('/report');
      }
    }
  }, [customClaims, router]);
	
  return (
		<>
			<Head>
				<title>Not Found | Truth Sleuth Local</title>
			</Head>
			<div className="flex flex-col gap-2 items-center justify-center h-screen">
				<Typography variant="h2">404 - Page Not Found</Typography>
				<Link href={homeLink} passHref>
					<Button>Return to home</Button>
				</Link>
			</div>
		</>
	)
}