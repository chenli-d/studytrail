'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [goals, setGoals] = useState([])
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // 获取当前登录用户
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/') // 未登录就跳回首页
      } else {
        setUser(data.user)
      }
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

  return (
    <main className="min-h-screen p-6 bg-gray-100 text-gray-800">
      <h1 className="text-3xl font-bold mb-4">📚 StudyTrail</h1>
      <p className="mb-6">以下是你自己创建的学习目标：</p>

      <ul className="list-disc list-inside space-y-1">
        {goals.map((goal) => (
          <li key={goal.id}>{goal.title}</li>
        ))}
      </ul>
    </main>
  )
}
