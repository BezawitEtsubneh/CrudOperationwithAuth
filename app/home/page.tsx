'use client'
import { useAuth } from "../context/authcontext"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Header from "@/components/layout/Header"
import { useState } from "react"
import Album from '../album/page'
import Artist from "../artist/page"
import Song from '../songs/page'
import Dashboard from '../dashboard/page'

export const buttons = {
  num1: '/images/bin.png',
  num2: '/images/plus.png',
  num3: '/images/update.png',
  num4: '/images/artist.png',
  num5: '/images/album.png',
  num6: '/images/song.png'
}

export default function Home() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeView, setActiveView] = useState('dashboard')

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user])

  const renderComponent = () => {
    switch (activeView) {
      case 'artist': return <Artist />
      case 'album': return <Album />
      case 'songs': return <Song />
      default: return <Dashboard />
    }
  }

  if (!user) return null // prevents flicker before redirect

  return (
    <div>
      <div className="bg-amber-500">
        <Header />
      </div>

      <div className='flex mt-10 border-amber-500 justify-center gap-10'>
        <div
          className='w-30 h-30 bg-amber-200 rounded-lg shadow-md flex flex-col items-center justify-center text-lg font-medium cursor-pointer'
          onClick={() => setActiveView('artist')}
        >
          <h1>Artist</h1>
          <img src={buttons.num4} className="w-10 h-10" />
        </div>

        <div
          className='w-30 h-30 bg-amber-200 rounded-lg shadow-md flex flex-col items-center justify-center text-lg font-medium cursor-pointer'
          onClick={() => setActiveView('songs')}
        >
          <h1>Songs</h1>
          <img src={buttons.num5} className="w-10 h-10" />
        </div>

        <div
          className='w-30 h-30 bg-amber-200 rounded-lg shadow-md flex flex-col items-center justify-center text-lg font-medium cursor-pointer'
          onClick={() => setActiveView('album')}
        >
          <h1>Album</h1>
          <img src={buttons.num6} className="w-10 h-10" />
        </div>
      </div>

      <div>{renderComponent()}</div>

      <div className="flex justify-center mt-10">
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
