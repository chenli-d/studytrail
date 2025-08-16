'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user)
        router.push('/dashboard') // ✅ 已登入 → 直接跳轉
      }
    }

    getUser()
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`, // ✅ GitHub OAuth 登入成功後回來的位置
      },
    })
  }

  return (
    <main className="min-h-screen p-6 bg-gray-100 text-gray-800 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">🐌 StudyTrail</h1>
      <p className="mb-4 text-lg">Welcome! Please sign in to continue.</p>

      <button
        onClick={handleLogin}
        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
      >
        Sign in with GitHub
      </button>
    </main>
  )
}
