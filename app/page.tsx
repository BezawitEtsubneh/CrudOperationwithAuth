'use client'
import { useAuth } from './context/authcontext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push('/home')
    else router.push('/login')
  }, [user])

  return null
}
