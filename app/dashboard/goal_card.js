"use client";
import {
  CARD_BASE,
  BUTTON_PRIMARY,
  BUTTON_DELETE,
  PRIMARY_COLOR,
} from "../../styles/styles";
import { BookOpen, CircleDot, CheckCircle, AlarmClock } from "lucide-react";

export default function GoalCard({ goal, onLog, onDelete, onEdit }) {
  const loggedHours = (goal.logged_time ?? 0) / 60;
  const targetHours = goal.target_time ?? 0;

  const completedTasks = Array.isArray(goal.tasks)
    ? goal.tasks.filter((t) => t.is_completed === true).length
    : 0;

  const totalTasks = Array.isArray(goal.tasks) ? goal.tasks.length : 0;

  const formatDate = (dateLike) => {
    if (!dateLike) return null;
    // If it's a plain "YYYY-MM-DD", build a LOCAL date to avoid UTC shift
    if (typeof dateLike === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateLike)) {
      const [y, m, d] = dateLike.split("-").map(Number);
      const dt = new Date(y, m - 1, d); // local midnight
      return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
    const dt = new Date(dateLike); // ISO string / Date / timestamp
    if (isNaN(dt)) return null;
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <li className={CARD_BASE} onClick={onEdit}>
      <div className="flex justify-between items-start gap-4">
        {/* Goal Info */}
        <div className="flex-1">
          <h3 className="text-xl font-bold capitalize text-slate-600 mb-1">
            {goal.title}
          </h3>
          <div className="flex items-center text-sm text-slate-600 mb-2 gap-1.5 capitalize">
            <BookOpen className="h-6 w-6 text-slate-500" />
            <p>{goal.subject}</p>
          </div>

          {/* Due date */}
          {goal.deadline && (
            <div className="flex items-center text-sm text-slate-600 mb-2 gap-1.5">
              <AlarmClock className="h-6 w-6 text-red-300" />
              <span className="font-medium">
                Due: {formatDate(goal.deadline)}
              </span>
            </div>
          )}

          {/* Progress: Time-based */}
          {goal.goal_type === "time" && (
            <div className="space-y-1">
              <div className="flex items-center text-sm text-slate-600 mb-2 gap-1.5">
                <CircleDot className="h-6 w-6 text-slate-600" />
                <span>
                  {loggedHours.toFixed(1)} / {targetHours} hrs done
                </span>
              </div>
              {loggedHours >= targetHours && targetHours > 0 && (
                <div className="flex items-center text-sm text-green-600 mb-2 gap-1.5">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <p>Completed</p>
                </div>
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
              <div className="flex items-center text-sm text-slate-600 mb-2 gap-1.5">
                <CircleDot className="h-6 w-6 text-slate-600" />
                <p>
                  {" "}
                  {completedTasks} / {totalTasks} tasks done
                </p>
              </div>
              {completedTasks >= totalTasks && totalTasks > 0 && (
                <div className="flex items-center text-sm text-green-600 mb-2 gap-1.5">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <p>Completed</p>
                </div>
              )}
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
          <button onClick={onLog} className={BUTTON_PRIMARY}>
            Log
          </button>
          <button onClick={onDelete} className={BUTTON_DELETE}>
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
