'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { PRIMARY_COLOR, BUTTON_PRIMARY } from './styles'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user)
        router.push('/dashboard') 
      }
    }

    getUser()
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`, 
      },
    })
  }

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center  bg-slate-200"
    >
      <h1 className="text-3xl font-bold mb-6 text-slate-700">🐌 StudyTrail</h1>
      <p className="mb-4 text-lg  text-slate-700">Welcome! Please sign in to continue.</p>

      <button
        onClick={handleLogin}
        className={BUTTON_PRIMARY}
      >
        Sign in with GitHub
      </button>
    </main>
  )
}
