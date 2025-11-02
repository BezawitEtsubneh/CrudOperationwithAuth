'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (!email || !username || !password) {
        setError('All fields are required')
        return
      }

      // Replace this with your FastAPI signup API call
      // const res = await fetch('http://127.0.0.1:8000/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, username, password })
      // })
      // const data = await res.json()
      // if (!res.ok) throw new Error(data.detail || 'Signup failed')

      // For now, simulate success:
      setSuccess('Signup successful! Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err) {
      console.error(err)
      setError('Signup failed. Please try again.')
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-amber-50">
      <form
        onSubmit={handleSignup}
        className="bg-white shadow-md p-6 rounded-xl w-96"
      >
        <h1 className="text-2xl font-bold mb-4 text-center text-amber-700">
          Sign Up
        </h1>

        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-3 text-center">{success}</p>}

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-3 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Username"
          className="border p-2 w-full mb-3 rounded-md"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          Sign Up
        </button>

        <div className="text-center mt-4">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-amber-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
