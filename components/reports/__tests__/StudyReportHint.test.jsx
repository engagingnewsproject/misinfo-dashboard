import React from 'react'
import { render, screen } from '@testing-library/react'

const HINT =
	'Click the Report button below to report any potential misinformation that you see.'

function renderHint(isStudyCopy) {
	let Hint
	jest.isolateModules(() => {
		jest.doMock('../../../config/brand', () => ({
			brand: { isStudyCopy },
		}))
		jest.doMock('next-i18next', () => ({
			useTranslation: () => ({
				t: (key) => (key === 'studyReportHint' ? HINT : key),
			}),
		}))
		Hint = require('../StudyReportHint').default
	})
	return render(<Hint />)
}

describe('StudyReportHint', () => {
	it('points study participants at the Report button', () => {
		renderHint(true)
		expect(screen.getByText(HINT)).toBeInTheDocument()
	})

	it('stays hidden on live sites', () => {
		const { container } = renderHint(false)
		expect(container).toBeEmptyDOMElement()
	})
})
