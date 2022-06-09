import { useRouter } from 'next/router'
import React from 'react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
    const { user, logout } = useAuth()
    const router = useRouter()
    
    return (
        <div>
            <div>This dashboard route is protected</div>
            { user && <h4>Email: {user.email}</h4> }
            <a onClick={() => {
                logout()
                router.push('/login')
            }}>Logout</a>
        </div>
    )
}

export default Dashboard