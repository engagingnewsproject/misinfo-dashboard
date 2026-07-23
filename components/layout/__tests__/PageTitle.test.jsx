/**
 * @fileoverview Smoke tests for PageTitle visibility and heading role.
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import PageTitle from '../PageTitle'

describe('PageTitle', () => {
	it('renders as an h1 by default', () => {
		render(<PageTitle>Dashboard</PageTitle>)
		expect(
			screen.getByRole('heading', { level: 1, name: 'Dashboard' }),
		).toBeInTheDocument()
	})

	it('applies shared type + gutter classes by default', () => {
		render(<PageTitle>Profile</PageTitle>)
		const heading = screen.getByRole('heading', { name: 'Profile' })
		expect(heading).toHaveClass(
			'text-xl',
			'font-extrabold',
			'tracking-wide',
			'text-[#2E3B4E]',
			'mb-3',
			'sm:hidden',
		)
	})

	it('omits gutter when gutter is false', () => {
		render(
			<PageTitle mobileOnly={false} gutter={false}>
				Users
			</PageTitle>,
		)
		expect(screen.getByRole('heading', { name: 'Users' })).not.toHaveClass(
			'mb-3',
		)
	})

	it('is visually hidden but available to assistive tech when srOnly', () => {
		render(<PageTitle srOnly>Dashboard</PageTitle>)
		const heading = screen.getByRole('heading', { name: 'Dashboard' })
		expect(heading).toHaveClass('sr-only')
		expect(heading).not.toHaveClass('text-xl')
	})
})
