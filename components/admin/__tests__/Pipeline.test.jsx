/**
 * Smoke tests for the admin Pipeline rundown + Data Studio embed.
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@material-tailwind/react'
import Pipeline from '../Pipeline'
import { DATA_STUDIO_EMBED_SRC } from '../../../utils/pipeline-runs'

jest.mock('../../../utils/fetch-pipeline-runs', () => ({
	fetchPipelineRuns: jest.fn().mockResolvedValue([]),
}))

const sampleRun = {
	run_timestamp: '20260811_070316',
	measurement_run_id: 'production_daily',
	health_status: 'ok',
	duration_seconds: 3720,
	links_rows: 1000,
	extracted_rows: 800,
	election_rows: 120,
	geographic_rows: 40,
	clustered_rows: 30,
	curated_rows: 12,
	dashboard_rows: 12,
	execution_name: 'truth-sleuth-test-abc',
	image_tag: 'sha-123',
	election_classifier_mode: 'bert_primary',
	pipeline_status: 'success',
	issues_json: '[]',
	steps_completed_json: '["link_collection","content_extraction"]',
}

function renderPipeline(fetchRuns) {
	return render(
		<ThemeProvider>
			<Pipeline fetchRuns={fetchRuns} />
		</ThemeProvider>,
	)
}

describe('Pipeline', () => {
	it('renders the title, rundown, and Data Studio embed', async () => {
		const fetchRuns = jest.fn().mockResolvedValue([sampleRun])
		renderPipeline(fetchRuns)

		expect(
			screen.getByRole('heading', { level: 1, name: 'Pipeline' }),
		).toBeInTheDocument()

		expect(
			await screen.findByRole('heading', { name: 'Run details' }),
		).toBeInTheDocument()
		expect(screen.getAllByText('production_daily').length).toBeGreaterThan(0)
		expect(screen.getAllByText('1h 2m').length).toBeGreaterThan(0)
		expect(screen.getByText('truth-sleuth-test-abc')).toBeInTheDocument()

		const iframe = screen.getByTitle(
			'Truth Sleuth Data Studio articles report',
		)
		expect(iframe).toHaveAttribute('src', DATA_STUDIO_EMBED_SRC)
	})

	it('shows an error when the rundown fails to load', async () => {
		const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
		const fetchRuns = jest
			.fn()
			.mockRejectedValue(new Error('Admin privileges required.'))
		renderPipeline(fetchRuns)

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Admin privileges required.',
		)
		expect(
			screen.getByTitle('Truth Sleuth Data Studio articles report'),
		).toHaveAttribute('src', DATA_STUDIO_EMBED_SRC)
		errorSpy.mockRestore()
	})
})
