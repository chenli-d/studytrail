'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import GoalModal from './goal_modal';
import StudyLogModal from './studylog_modal';
import GoalCardList from './goal_card_list';
import { useRouter } from 'next/navigation';
/*to do 
- [1] MyGoal progress tracking for time-based goals
- [2 ] Filter MyGoals to display only today's goals (currently buggy)
- [3] Further styling improvements across dashboard
 */
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchGoalProgress();
  }, [user]);

  const fetchGoalProgress = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*, tasks(*), study_logs(*)')
      .eq('user_id', user.id);

    if (error) console.error('Supabase error:', error);
    else setGoals(data);
  };

  const handleAddGoal = async (newGoal) => {
    const { title, subject, deadline, goal_type, target_time, tasks } = newGoal;
    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        title,
        subject,
        deadline,
        goal_type,
        user_id: user.id,
        ...(goal_type === 'time' && { target_time })
      })
      .select()
      .single();

    if (goal_type === 'task' && tasks?.length > 0) {
      await supabase.from('tasks').insert(
        tasks.map((t) => ({ goal_id: goal.id, task_text: t }))
      );
    }
    fetchGoalProgress();
  };

  const handleDeleteGoal = async (goalId) => {
    await supabase.from('goals').delete().eq('id', goalId);
    fetchGoalProgress();
  };

  const handleLogStudy = async (log) => {
    await supabase.from('study_logs').insert({
      ...log,
      user_id: user.id
    });
    fetchGoalProgress();
  };

  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setShowGoalModal(true);
  };

  return (
    <main className="min-h-screen p-6 bg-gray-100 text-gray-800">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📚 StudyTrail</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/")
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </header>

      <GoalCardList
        title="📌 Today's Goals"
        goals={goals}
        onLogClick={(goal) => {
          setSelectedGoal(goal);
          setShowLogModal(true);
        }}
        onDeleteClick={handleDeleteGoal}
        onEditClick={handleEditGoal}
      />

      <GoalCardList
        title="🎯 My Goals"
        goals={goals}
        onLogClick={(goal) => {
          setSelectedGoal(goal);
          setShowLogModal(true);
        }}
        onDeleteClick={handleDeleteGoal}
        onEditClick={handleEditGoal}
      />

      <div className="flex justify-center gap-4">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={() => setShowGoalModal(true)}
        >
          [+ Add Goal]
        </button>
      </div>

      {showGoalModal && (
        <GoalModal
          goal={selectedGoal}
          onClose={() => {
            setShowGoalModal(false);
            setSelectedGoal(null);
          }}
          onSave={(payload) => {
            setShowGoalModal(false);
            setSelectedGoal(null);
            handleAddGoal(payload);
          }}
        />
      )}

      {showLogModal && selectedGoal && (
        <StudyLogModal
          goal={selectedGoal}
          onClose={() => {
            setShowLogModal(false);
            setSelectedGoal(null);
          }}
          onSave={(payload) => {
            setShowLogModal(false);
            setSelectedGoal(null);
            handleLogStudy(payload);
          }}
        />
      )}
    </main>
  );
}