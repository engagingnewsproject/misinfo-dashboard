/**
 * @fileoverview Smoke tests for BrandLockup role-based labels.
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import BrandLockup, { BrandTitle } from '../BrandLockup'

describe('BrandTitle', () => {
	it('shows Truth Sleuth Local for admin', () => {
		render(<BrandTitle customClaims={{ admin: true }} />)
		expect(screen.getByText('Truth Sleuth Local')).toBeInTheDocument()
	})

	it('shows agency name for agency users', () => {
		render(
			<BrandTitle
				customClaims={{ agency: true }}
				agencyName="Test Agency"
			/>,
		)
		expect(screen.getByText('Test Agency')).toBeInTheDocument()
	})

	it('shows Truth Sleuth Local for public users', () => {
		render(<BrandTitle customClaims={{}} />)
		expect(screen.getByText('Truth Sleuth Local')).toBeInTheDocument()
	})
})

describe('BrandLockup', () => {
	it('renders mark + title text', () => {
		render(
			<BrandLockup
				customClaims={{ admin: true }}
				titleClassName="text-base"
			/>,
		)
		expect(screen.getByText('Truth Sleuth Local')).toBeInTheDocument()
	})
})
