'use client';

export default function GoalCard({ goal, onLog, onDelete }) {
  return (
    <li className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center">
        <div>
          <strong>{goal.title}</strong> - {goal.subject}
          {goal.goal_type === 'time' && (
            <p>⏳ {goal.target_time ?? 0} hrs total</p>
          )}
          {goal.goal_type === 'task' && (
            <p>📝 {goal.tasks?.filter(t => t.is_completed).length ?? 0} / {goal.tasks?.length ?? 0} tasks done</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            onClick={onLog}
          >
            [+ Log Study]
          </button>
          <button
            className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
