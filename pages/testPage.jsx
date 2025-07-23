/**
 * @fileoverview Test page component for development and testing purposes
 * 
 * This page serves as a development environment for testing components,
 * features, and functionality without affecting the main application.
 * Currently renders the TestComponent for demonstration and testing.
 * 
 * @author Truth Sleuth Local Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "../context/AuthContext"
import { auth } from "../config/firebase"
import TestComponent from "../components/TestComponent"

/**
 * TestPage component for development testing
 * 
 * Provides a sandbox environment for testing components and features.
 * Currently displays the TestComponent for demonstration purposes.
 * 
 * @component
 * @returns {JSX.Element} The test page component
 */
const TestPage = () => {
	const router = useRouter()
	
	return (
		<div className="flex-col">
			{/* Test component for development and demonstration */}
			<TestComponent />
		</div>
	)
}

export default TestPage