import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeProvider } from '@material-tailwind/react'
import UserSettingsForm from '../UserSettingsForm'

jest.mock('next-i18next', () => ({
	useTranslation: () => ({
		t: (key) =>
			({
				account: 'Account',
				cancel: 'Cancel',
				done: 'Done',
				edit: 'Edit',
				email: 'Email',
				editEmail: 'Edit email',
				resetPassword: 'Reset password',
				editPassword: 'Edit password',
			}[key] || key),
	}),
}))

jest.mock('../../partials/forms/LocationUpdate', () => () => (
	<div data-testid="location-update" />
))

function renderForm(isAgency) {
	const onEditEmail = jest.fn()
	render(
		<ThemeProvider>
			<UserSettingsForm
				isAgency={isAgency}
				agency={[]}
				agencyName="Test Agency"
				email="person@example.com"
				user={{ accountId: 'user-1' }}
				userData={null}
				setUserData={jest.fn()}
				onEditEmail={onEditEmail}
				onEditPassword={jest.fn()}
			/>
		</ThemeProvider>,
	)
	return onEditEmail
}

describe('UserSettingsForm email editing', () => {
	it('keeps an agency user email read-only in edit mode', () => {
		renderForm(true)

		fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

		expect(screen.getByText('person@example.com')).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Edit email' }),
		).not.toBeInTheDocument()
	})

	it('keeps email editing available to non-agency users', () => {
		const onEditEmail = renderForm(false)

		fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
		fireEvent.click(screen.getByRole('button', { name: 'Edit email' }))

		expect(onEditEmail).toHaveBeenCalledTimes(1)
	})
})
