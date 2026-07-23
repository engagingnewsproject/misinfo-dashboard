import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewUserModal from '../NewUserModal'

function renderModal(overrides = {}) {
	const props = {
		setNewUserModal: jest.fn(),
		onFormSubmit: jest.fn((event) => event.preventDefault()),
		newUserEmail: 'invite@example.com',
		onNewUserEmail: jest.fn(),
		errors: {},
		...overrides,
	}
	return { ...render(<NewUserModal {...props} />), props }
}

describe('NewUserModal', () => {
	it('shows invite form after delayed dialog open', async () => {
		renderModal()

		await waitFor(() => {
			expect(
				screen.getByRole('heading', { name: /invite user/i }),
			).toBeInTheDocument()
		})

		// MT floating labels are not wired as htmlFor associations in jsdom.
		expect(screen.getByDisplayValue('invite@example.com')).toBeInTheDocument()
		expect(screen.getByText(/email to invite/i)).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /send invite/i }),
		).toBeInTheDocument()
	})

	it('shows an email error when provided', async () => {
		renderModal({ errors: { email: 'Enter a valid email' } })

		await waitFor(() => {
			expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
		})
	})

	it('calls onFormSubmit when the form is submitted', async () => {
		const user = userEvent.setup()
		const { props } = renderModal()

		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: /send invite/i }),
			).toBeInTheDocument()
		})

		await user.click(screen.getByRole('button', { name: /send invite/i }))
		expect(props.onFormSubmit).toHaveBeenCalledTimes(1)
	})

	it('calls setNewUserModal(false) when close is clicked', async () => {
		const user = userEvent.setup()
		const { props } = renderModal()

		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: /close/i }),
			).toBeInTheDocument()
		})

		await user.click(screen.getByRole('button', { name: /close/i }))
		expect(props.setNewUserModal).toHaveBeenCalledWith(false)
	})
})
