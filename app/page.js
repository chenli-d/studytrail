'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [goals, setGoals] = useState([])

  useEffect(() => {
    // fetch current user
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)

      if (error) console.error('Supabase error:', error)
      else setGoals(data)
    }

    fetchGoals()
  }, [user])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setGoals([])
  }

  return (
    <main className="min-h-screen p-6 bg-gray-100 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">📚 StudyTrail</h1>

      {user ? (
        <>
          <p className="mb-4">Welcome, {user.user_metadata?.name}
</p>
          <button
            onClick={handleLogout}
            className="mb-6 px-4 py-2 bg-red-500 text-white rounded"
          >
            Log out
          </button>

          <p className="mb-4">Current Goal Title: </p>
          <ul className="list-disc list-inside space-y-1">
            {goals.map((goal) => (
              <li key={goal.id}>{goal.title}</li>

            ))}    
          </ul>
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Signin with Github
        </button>
      )}
    </main>
  )
}
