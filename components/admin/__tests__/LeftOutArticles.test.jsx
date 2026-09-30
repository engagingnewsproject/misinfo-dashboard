import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LeftOutArticles from '../LeftOutArticles'

jest.mock('../../../config/firebase', () => ({ db: {} }))

jest.mock('../../../context/AuthContext', () => ({
	useAuth: () => ({ user: { uid: 'admin-1' } }),
}))

const winners = [{ url: 'https://ex.com/w', title: 'Winning article', meatinessScore: 0.9 }]

const articles = [
	{
		id: 'a1',
		runTimestamp: '20260928_070000',
		url: 'https://ex.com/buried',
		title: 'Buried article',
		domain: 'ex.com',
		state: 'Nevada',
		clusterId: 4,
		clusterName: 'Voting Processes',
		meatinessScore: 0.41,
		winners,
		report: { title: 'Buried article' },
		status: 'pending',
	},
	{
		id: 'a2',
		runTimestamp: '20260928_070000',
		url: 'https://ex.com/done',
		title: 'Already promoted article',
		domain: 'ex.com',
		state: 'Arizona',
		clusterId: 4,
		clusterName: 'Voting Processes',
		meatinessScore: 0.3,
		winners,
		report: {},
		status: 'promoted',
	},
]

describe('LeftOutArticles', () => {
	it('lists pending articles with their cluster winners and hides promoted ones', async () => {
		render(<LeftOutArticles fetchArticles={() => Promise.resolve(articles)} promote={jest.fn()} />)

		expect(await screen.findByText('Buried article')).toBeInTheDocument()
		expect(screen.getByText('Night of 2026-09-28')).toBeInTheDocument()
		expect(screen.getByText('Cluster: Voting Processes')).toBeInTheDocument()
		expect(screen.getByText('Winning article')).toBeInTheDocument()
		expect(screen.queryByText('Already promoted article')).not.toBeInTheDocument()

		fireEvent.click(screen.getByLabelText('Show promoted'))
		expect(screen.getByText('Already promoted article')).toBeInTheDocument()
	})

	it('promotes an article and marks it promoted', async () => {
		const promote = jest
			.fn()
			.mockResolvedValue({ reportId: 'r1', agencyName: 'Test Agency' })
		render(<LeftOutArticles fetchArticles={() => Promise.resolve(articles)} promote={promote} />)

		fireEvent.click(await screen.findByRole('button', { name: 'Promote' }))

		await waitFor(() =>
			expect(screen.getByRole('status')).toHaveTextContent(
				'Promoted "Buried article" to Test Agency',
			),
		)
		expect(promote).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1' }), {
			uid: 'admin-1',
		})
		expect(screen.queryByRole('button', { name: 'Promote' })).not.toBeInTheDocument()
	})

	it('shows an error when promote fails', async () => {
		const fetchArticles = jest.fn().mockResolvedValue(articles)
		const promote = jest.fn().mockRejectedValue(new Error('Already promoted'))
		render(<LeftOutArticles fetchArticles={fetchArticles} promote={promote} />)

		fireEvent.click(await screen.findByRole('button', { name: 'Promote' }))

		await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Already promoted'))
	})

	it('shows an empty state', async () => {
		render(<LeftOutArticles fetchArticles={() => Promise.resolve([])} promote={jest.fn()} />)
		expect(await screen.findByText('No left-out articles found')).toBeInTheDocument()
	})
})
