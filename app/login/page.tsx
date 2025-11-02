'use client'
import { useState } from 'react'
import { useAuth } from '../context/authcontext'  // make sure the path matches your context file
import Link from 'next/link'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    try {
      // Replace this with your actual FastAPI backend call
      // Example:
      // const res = await fetch('http://127.0.0.1:8000/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // })
      // const data = await res.json()
      // if (res.ok) login(data)

      // Temporary simulation for now
      if (email === '' || password === '') {
        setError('Email and password are required')
        return
      }
      login({ email })  // store minimal user info
    } catch (err) {
      console.error(err)
      setError('Login failed. Please try again.')
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-amber-50">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md p-6 rounded-xl w-96"
      >
        <h1 className="text-2xl font-bold mb-4 text-center text-amber-700">
          Sign In
        </h1>

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-3 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-3 rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
        >
          Login
        </button>

        <div className="text-center mt-4">
          <p>
            Don't have an account?{' '}
            <Link href="/signup" className="text-amber-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
