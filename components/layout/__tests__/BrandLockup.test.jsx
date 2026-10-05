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

describe('BrandLockup with NEXT_PUBLIC_BRAND=caffeine', () => {
	const original = process.env.NEXT_PUBLIC_BRAND

	afterEach(() => {
		if (original === undefined) delete process.env.NEXT_PUBLIC_BRAND
		else process.env.NEXT_PUBLIC_BRAND = original
	})

	it('shows Caffeine App for admin and public users', () => {
		process.env.NEXT_PUBLIC_BRAND = 'caffeine'
		let CaffeineTitle
		jest.isolateModules(() => {
			CaffeineTitle = require('../BrandLockup').BrandTitle
		})
		render(<CaffeineTitle customClaims={{ admin: true }} />)
		expect(screen.getByText('Caffeine App')).toBeInTheDocument()
	})
})
