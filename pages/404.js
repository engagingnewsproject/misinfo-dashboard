import { useEffect, useState } from 'react';
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext';
import { Button, Typography } from "@material-tailwind/react"
import Link from 'next/link';

export default function Custom404() {
	const router = useRouter()
	const customClaims = useAuth()
	const [homeLink,setHomeLink] = useState('')
	
  useEffect(() => {
    if (customClaims.admin || customClaims.agency) {
      setHomeLink('/dashboard');
      router.prefetch('/dashboard');
    } else {
      setHomeLink('/report');
      router.prefetch('/report');
    }
  }, [customClaims, router]);
	
	return (
		<div className='flex flex-col gap-2 items-center justify-center h-screen'>
			<Typography variant='h2'>404 - Page Not Found</Typography>
			<Link href={homeLink} passHref>
				<Button>Return to home</Button>
			</Link>
		</div>
	)
}