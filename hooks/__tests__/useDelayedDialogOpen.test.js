import { act, renderHook } from '@testing-library/react'
import { useDelayedDialogOpen } from '../useDelayedDialogOpen'

describe('useDelayedDialogOpen', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it('starts closed, then opens one tick later when open defaults to true', () => {
		const { result } = renderHook(() => useDelayedDialogOpen())

		expect(result.current).toBe(false)

		act(() => {
			jest.runOnlyPendingTimers()
		})

		expect(result.current).toBe(true)
	})

	it('stays closed when open is false', () => {
		const { result } = renderHook(() => useDelayedDialogOpen(false))

		act(() => {
			jest.runOnlyPendingTimers()
		})

		expect(result.current).toBe(false)
	})

	it('opens after a tick when open flips from false to true', () => {
		const { result, rerender } = renderHook(
			({ open }) => useDelayedDialogOpen(open),
			{ initialProps: { open: false } },
		)

		expect(result.current).toBe(false)

		rerender({ open: true })
		expect(result.current).toBe(false)

		act(() => {
			jest.runOnlyPendingTimers()
		})

		expect(result.current).toBe(true)
	})

	it('closes immediately when open flips to false', () => {
		const { result, rerender } = renderHook(
			({ open }) => useDelayedDialogOpen(open),
			{ initialProps: { open: true } },
		)

		act(() => {
			jest.runOnlyPendingTimers()
		})
		expect(result.current).toBe(true)

		rerender({ open: false })
		expect(result.current).toBe(false)
	})
})
