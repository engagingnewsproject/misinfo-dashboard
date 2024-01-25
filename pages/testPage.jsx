import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "../context/AuthContext"
import { auth } from "../config/firebase"
import TestComponent from "../components/TestComponent"

const TestPage = () => {
	const router = useRouter()
	return (
		<div className="flex-col">
			<TestComponent />
		</div>
	)
}

export default TestPage