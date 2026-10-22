import React from 'react'
import { render, screen } from '@testing-library/react'

const NOTE =
	'Forgot your password? On Prolific, message the researcher who posted this study. Include the email you signed up with. They will reply in that Prolific message with a temporary password.'

function renderNote(isStudyCopy) {
	let Note
	jest.isolateModules(() => {
		jest.doMock('../../../config/brand', () => ({
			brand: { isStudyCopy },
		}))
		jest.doMock('next-i18next', () => ({
			useTranslation: () => ({
				t: (key) => (key === 'forgotStudyNote' ? NOTE : key),
			}),
		}))
		Note = require('../StudyForgotPasswordNote').default
	})
	return render(<Note />)
}

describe('StudyForgotPasswordNote', () => {
	it('tells study participants to message the researcher on Prolific', () => {
		renderNote(true)
		expect(screen.getByText(NOTE)).toBeInTheDocument()
	})

	it('stays hidden on live sites', () => {
		const { container } = renderNote(false)
		expect(container).toBeEmptyDOMElement()
	})
})
