/**
 * @fileoverview Smoke test: help request screenshots use ImageLightboxGallery.
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import HelpRequestsModal from '../HelpRequestsModal'

describe('HelpRequestsModal', () => {
	it('renders ImageLightboxGallery for stored screenshots', async () => {
		render(
			<HelpRequestsModal
				helpRequestInfo={{
					name: 'Ada',
					email: 'ada@example.com',
					images: ['https://example.com/shot.png'],
				}}
				handleClose={() => {}}
				mailtoLink="mailto:ada@example.com"
			/>,
		)

		await waitFor(() => {
			expect(
				screen.getByRole('button', {
					name: 'View help request screenshot 1',
				}),
			).toBeInTheDocument()
		})
	})
})
