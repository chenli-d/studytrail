'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function StudyLogModal({ onClose, onSave, goal, refreshGoals }) {
  const [timeSpent, setTimeSpent] = useState('');
  const [notes, setNotes] = useState('');
  const [checkedTasks, setCheckedTasks] = useState([]);
  const [loggedTime, setLoggedTime] = useState(0); // in minutes

  useEffect(() => {
    if (!goal) return;

    const fetchLoggedTime = async () => {
      if (goal.goal_type !== 'time') return;

      const { data: logs, error } = await supabase
        .from('study_logs')
        .select('logged_time')
        .eq('goal_id', goal.id)
        .eq('user_id', goal.user_id);

      if (!error && logs) {
        const total = logs.reduce((sum, log) => sum + (log.logged_time || 0), 0);
        setLoggedTime(total);
      }
    };

    const preCheckTasks = () => {
      if (goal.goal_type === 'task' && Array.isArray(goal.tasks)) {
        const completed = goal.tasks.filter(t => t.is_completed).map(t => t.id);
        setCheckedTasks(completed);
      }
    };

    fetchLoggedTime();
    preCheckTasks();
  }, [goal]);

  const handleCheck = (taskId) => {
    setCheckedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSubmit = async () => {
    if (!goal) return;

    const remaining = goal.goal_type === 'time'
      ? goal.target_time * 60 - loggedTime
      : null;

    const newLogged = parseFloat(timeSpent) * 60;

    if (goal.goal_type === 'time' && newLogged > remaining) {
      alert(
        `Logging ${newLogged / 60} hrs exceeds the remaining ${remaining / 60} hrs.`
      );
      return;
    }

    const payload = {
      goal_id: goal.id,
      user_id: goal.user_id,
      log_type: goal.goal_type,
      notes,
      created_at: new Date().toISOString(),
      ...(goal.goal_type === 'time'
        ? { logged_time: newLogged }
        : { completed_task_ids: checkedTasks })
    };

    const { error: logError } = await supabase.from('study_logs').insert(payload);
    if (logError) {
      alert('Error saving log: ' + logError.message);
    } else {
      if (goal.goal_type === 'task') {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ is_completed: false })
          .eq('goal_id', goal.id);

        if (!updateError) {
          const { error: completeError } = await supabase
            .from('tasks')
            .update({ is_completed: true })
            .in('id', checkedTasks);

          if (completeError) {
            alert('Error marking completed tasks: ' + completeError.message);
          }
        } else {
          alert('Error resetting task status: ' + updateError.message);
        }
      }

      refreshGoals?.();
      onSave?.(payload);
    }
  };

  const remainingHours = goal?.goal_type === 'time'
    ? Math.max(goal.target_time - loggedTime / 60, 0)
    : null;

  if (!goal) return null;

  if (goal.goal_type === 'time' && remainingHours <= 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md text-center">
          <p className="text-xl font-bold text-green-700">✅ You've completed this time goal!</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 rounded">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Log Study for "{goal.title}"</h2>

        {goal.goal_type === 'time' ? (
          <>
            <p className="text-sm text-gray-600 mb-2">
              ⏱️ {remainingHours} hours left out of {goal.target_time} hours
            </p>
            <label className="block mb-2">Spent Time (hours):</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={timeSpent}
              min={0}
              max={remainingHours}
              onChange={(e) => setTimeSpent(e.target.value)}
            />
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-2">
              ✅ {goal.tasks?.filter(t => t.is_completed).length || 0} / {goal.tasks?.length || 0} tasks completed
            </p>
            <label className="block mb-2">Completed Tasks:</label>
            <ul className="space-y-2">
              {goal.tasks?.map((task) => (
                <li key={task.id}>
                  <label>
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={checkedTasks.includes(task.id)}
                      onChange={() => handleCheck(task.id)}
                    />
                    {task.task_text}
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        <label className="block mt-4 mb-2">Notes:</label>
        <textarea
          className="w-full border p-2 rounded"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">Save Log</button>
        </div>
      </div>
    </div>
  );
}