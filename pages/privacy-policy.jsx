/**
 * Public privacy policy page at `/privacy-policy` (and locale-prefixed routes) for OAuth / store compliance.
 */
import Head from 'next/head'
import Link from 'next/link'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import PrivacyPolicyContent from '../components/legal/PrivacyPolicyContent'

export default function PrivacyPolicyPage() {
	return (
		<>
			<Head>
				<title>Privacy Policy | Truth Sleuth</title>
			</Head>
			<div className="min-h-screen bg-sky-100 py-8 px-4">
				<div className="max-w-3xl mx-auto shadow-lg">
					<PrivacyPolicyContent />
					<div className="bg-white border-t px-6 py-4 text-center text-sm text-gray-600 rounded-b-2xl">
						<Link href="/login" className="text-blue-600 font-semibold hover:underline">
							Back to login
						</Link>
					</div>
				</div>
			</div>
		</>
	)
}

export async function getStaticProps({ locale }) {
	return {
		props: {
			...(await serverSideTranslations(locale, [])),
		},
	}
}
