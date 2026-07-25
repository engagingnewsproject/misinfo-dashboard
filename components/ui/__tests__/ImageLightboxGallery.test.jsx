/**
 * @fileoverview Smoke tests for ImageLightboxGallery thumbnails + lightbox open.
 */
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import ImageLightboxGallery from '../ImageLightboxGallery'

describe('ImageLightboxGallery', () => {
	it('renders nothing when images is empty', () => {
		const { container } = render(<ImageLightboxGallery images={[]} />)
		expect(container).toBeEmptyDOMElement()
	})

	it('opens a lightbox when a thumbnail is clicked', () => {
		render(
			<ImageLightboxGallery
				images={['https://example.com/a.png', 'https://example.com/b.png']}
				altPrefix="Report image"
			/>,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'View report image 1' }),
		)

		expect(
			screen.getByRole('dialog', { name: 'Report image 1' }),
		).toBeInTheDocument()
		expect(screen.getByText('1 / 2')).toBeInTheDocument()
	})
})
