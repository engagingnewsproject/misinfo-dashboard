import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MoveReportModal from '../MoveReportModal'

const AGENCIES = [
	{ id: 'test1', name: 'Test Agency', state: 'Texas' },
	{ id: 'nao', name: 'News & Observer', state: 'North Carolina' },
	{ id: 'enlace', name: 'Enlace NC', state: 'North Carolina' },
	{ id: 'wpsu', name: 'WPSU', state: 'Pennsylvania' },
]

function renderModal(overrides = {}) {
	const props = {
		reportId: 'r1',
		reportState: 'North Carolina',
		currentAgencyId: 'test1',
		currentAgencyName: 'Test Agency',
		loadAgencies: jest.fn().mockResolvedValue(AGENCIES),
		moveReport: jest.fn().mockResolvedValue({ agencies: AGENCIES.slice(1, 3) }),
		onMoved: jest.fn(),
		closeModal: jest.fn(),
		...overrides,
	}
	return { ...render(<MoveReportModal {...props} />), props }
}

describe('MoveReportModal', () => {
	it('lists the newsrooms in the report state', async () => {
		renderModal()
		await waitFor(() => {
			expect(screen.getByText('Enlace NC')).toBeInTheDocument()
		})
		expect(screen.getByText('News & Observer')).toBeInTheDocument()
		expect(screen.queryByText('WPSU')).not.toBeInTheDocument()
		expect(screen.getByText(/currently in test agency/i)).toBeInTheDocument()
	})

	it('confirm calls moveReport with the state and closes', async () => {
		const user = userEvent.setup()
		const { props } = renderModal()
		await waitFor(() => {
			expect(screen.getByRole('button', { name: /confirm move/i })).toBeEnabled()
		})
		await user.click(screen.getByRole('button', { name: /confirm move/i }))
		expect(props.moveReport).toHaveBeenCalledWith('r1', 'North Carolina')
		await waitFor(() => expect(props.closeModal).toHaveBeenCalledWith(false))
		expect(props.onMoved).toHaveBeenCalledWith({ agencies: AGENCIES.slice(1, 3) })
	})

	it('disables confirm when the state has no newsrooms', async () => {
		renderModal({ reportState: 'Nevada' })
		await waitFor(() => {
			expect(screen.getByText(/no newsrooms found for nevada/i)).toBeInTheDocument()
		})
		expect(screen.getByRole('button', { name: /confirm move/i })).toBeDisabled()
	})

	it('shows the error and stays open when the move fails', async () => {
		const user = userEvent.setup()
		const { props } = renderModal({
			moveReport: jest.fn().mockRejectedValue(new Error('boom')),
		})
		await waitFor(() => {
			expect(screen.getByRole('button', { name: /confirm move/i })).toBeEnabled()
		})
		await user.click(screen.getByRole('button', { name: /confirm move/i }))
		expect(await screen.findByRole('alert')).toHaveTextContent('boom')
		expect(props.closeModal).not.toHaveBeenCalled()
	})
})
