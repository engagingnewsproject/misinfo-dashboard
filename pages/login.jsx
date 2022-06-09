import { useRouter } from 'next/router'
import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const router = useRouter()
  const { user, login } = useAuth()
  const [data, setData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState()

  const handleLogin = async (e) => {
    e.preventDefault()

    //console.log(user)
    try {
        await login(data.email, data.password)
        setError(null)
        router.push('/dashboard')
    } catch (err) {
        setError(err)
        console.log(err)
    }
  }

  const handleChange = (e) => {
      setData({ ...data, [e.target.id]: e.target.value})
  }


  return (
    <div class="w-screen h-screen flex justify-center items-center">
        <div class="w-full max-w-sm font-light">
            <div class="flex justify-center mb-4">
                <div class="w-24 h-24 font-extralight rounded-full tracking-widest flex justify-center items-center text-white bg-blue-500">MOODY</div>
            </div>
            <form class="px-8 pt-6 pb-4 mb-4" onChange={handleChange} onSubmit={handleLogin}>
                <div class="mb-4">
                    <input
                        class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="email"
                        type="text"
                        placeholder="Email"
                        required
                        value={data.email}
                        />
                </div>
                <div class="mb-1">
                    <input
                        class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline"
                        id="password"
                        type="password"
                        placeholder="Password"
                        required 
                        value={data.password}
                        />
                </div>
                {error && <span class="text-red-500 text-sm font-light">Incorrect password or username</span>}
                <div class="mt-5 flex-col items-center content-center">
                    <button class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-4 px-6 rounded focus:outline-none focus:shadow-outline" type="submit">
                        Log In
                    </button>
                    <div class="flex items-center justify-between">
                        <div class="content-center">
                            <input type="checkbox" class="form-checkbox rounded-sm border-transparent focus:border-transparent focus:ring-0" />
                            <span class="text-sm p-2">Remember me</span>
                        </div>
                        <Link href="/resetPassword">
                            <a class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">
                                Forgot Password?
                            </a>
                        </Link>
                    </div>
                </div>
            </form>
            <p class="text-center text-gray-500 text-sm">
                Don't have an account?
                <Link href="/signup">
                    <a class="inline-block px-2 align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">
                        Sign Up
                    </a>
                </Link>
            </p>
        </div>
    </div>
  )
}

export default Login