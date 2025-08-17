"use client";
import { CARD_BASE, BUTTON_PRIMARY, BUTTON_DELETE, PRIMARY_COLOR } from "../styles";

export default function GoalCard({ goal, onLog, onDelete, onEdit }) {
  const loggedHours = (goal.logged_time ?? 0) / 60;
  const targetHours = goal.target_time ?? 0;
  
  const completedTasks = Array.isArray(goal.tasks)
    ? goal.tasks.filter((t) => t.is_completed === true).length
    : 0;

  const totalTasks = Array.isArray(goal.tasks) ? goal.tasks.length : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date)) return null;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <li
      className={CARD_BASE}
      onClick={onEdit}
    >
      <div className="flex justify-between items-start gap-4">
        {/* Goal Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            {goal.title}
          </h3>
          <p className="text-sm text-slate-500 mb-1">{goal.subject}</p>

          {/* Due date */}
          {goal.deadline && (
            <p className="text-sm text-slate-500 mb-2">
              📅 Due: <span className="font-medium text-slate-700">{formatDate(goal.deadline)}</span>
            </p>
          )}

          {/* Progress: Time-based */}
          {goal.goal_type === "time" && (
            <div className="space-y-1">
              <p className="text-sm text-slate-600">
                ⏳ {loggedHours.toFixed(1)} / {targetHours} hrs done
                
              </p>
              {loggedHours >= targetHours && targetHours > 0 && (
              <p className="ml-2 text-green-600 font-semibold">
                    ✅ Completed
              </p>
                )}
              <div className="h-2 w-full bg-slate-200 rounded">
                <div
                  className="h-2"
                  style={{
                    backgroundColor: PRIMARY_COLOR,
                    width: `${Math.min(
                      targetHours > 0 ? (loggedHours / targetHours) * 100 : 0,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Progress: Task-based */}
          {goal.goal_type === "task" && (
            <div className="space-y-1">
              <p className="text-sm text-slate-600">
                📝 {completedTasks} / {totalTasks} tasks done
                {completedTasks >= totalTasks && totalTasks > 0 && (
                  <span className="ml-2 text-green-600 font-semibold">
                    ✅ Completed
                  </span>
                )}
              </p>
              <div className="h-2 w-full bg-slate-200 rounded">
                <div
                  className="h-2"
                  style={{
                    backgroundColor: PRIMARY_COLOR,
                    width: `${Math.min(
                      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className="flex flex-col gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onLog}
            className={BUTTON_PRIMARY}
          >
            + Log
          </button>
          <button
            onClick={onDelete}
            className={BUTTON_DELETE}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
