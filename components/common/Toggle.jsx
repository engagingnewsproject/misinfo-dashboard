/**
 * @fileoverview Toggle Component - Switch between overview and comparison graph views
 *
 * This component renders a toggle UI for switching between the overview and comparison views
 * of the dashboard's trending tag topics.
 * Features include:
 * - Two-button toggle for selecting the current view
 * - Visual indication of the active view
 * - Stateless, controlled via parent props
 *
 * Integrates with:
 * - Parent dashboard or graph components for view state
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import React from 'react'
import { Button } from '@material-tailwind/react'

/**
 * Toggle Component
 *
 * Renders a two-button toggle for switching between overview and comparison views.
 * Calls the parent setter to update the current view.
 *
 * @param {Object} props
 * @param {string} props.viewVal - The current view ("overview" or "comparison")
 * @param {Function} props.setViewVal - Setter function to update the view
 * @returns {JSX.Element} The rendered toggle UI
 */
const Toggle = ({ viewVal, setViewVal }) => (
	<div className="flex justify-center md:block">
		<Button
			id="overview"
			size="sm"
			variant={viewVal === 'overview' ? 'filled' : 'outlined'}
			className="rounded-r-none"
			onClick={() => setViewVal('overview')}>
			Overview
		</Button>
		<Button
			id="comparison"
			size="sm"
			variant={viewVal === 'comparison' ? 'filled' : 'outlined'}
			className="rounded-l-none border-l-0"
			onClick={() => setViewVal('comparison')}>
			Comparison View
		</Button>
	</div>
)

export default Toggle
