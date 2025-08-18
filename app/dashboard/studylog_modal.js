"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  PRIMARY_COLOR,
} from "../../styles/styles";
import { CheckCircle, AlarmClock } from "lucide-react";

export default function StudyLogModal({ onClose, onSave, goal, refreshGoals }) {
  const [timeSpent, setTimeSpent] = useState("");
  const [notes, setNotes] = useState("");
  const [lastNotes, setLastNotes] = useState(""); // store last saved notes for comparison
  const [checkedTasks, setCheckedTasks] = useState([]);
  const [loggedTime, setLoggedTime] = useState(0);

  useEffect(() => {
    if (!goal) return;

    const fetchLogData = async () => {
      const { data: logs, error } = await supabase
        .from("study_logs")
        .select("logged_time, notes, created_at")
        .eq("goal_id", goal.id)
        .eq("user_id", goal.user_id)
        .order("created_at", { ascending: false });

      if (!error && logs) {
        // calculate total logged time
        const total = logs.reduce(
          (sum, log) => sum + (log.logged_time || 0),
          0
        );
        setLoggedTime(total);

        if (logs.length > 0) {
          // load last notes from the latest log
          setNotes(logs[0].notes || "");
          setLastNotes(logs[0].notes || "");
        } else {
          setNotes("");
          setLastNotes("");
        }
      }
    };

    // Pre-check completed tasks (for task-based goals)
    const preCheckTasks = () => {
      if (goal.goal_type === "task" && Array.isArray(goal.tasks)) {
        const completed = goal.tasks
          .filter((t) => t.is_completed === true)
          .map((t) => t.id);
        setCheckedTasks(completed);
      }
    };

    fetchLogData();
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

    // --- Validation for TIME-based goal ---
    if (goal.goal_type === "time") {
      const hrs = Number(timeSpent);
      if (timeSpent && (!Number.isFinite(hrs) || hrs <= 0)) {
        alert("Please enter a positive number of hours.");
        return;
      }
    }
    // --- Validation for TASK-based goal ---
    else if (goal.goal_type === "task") {
      const currentCompleted = Array.isArray(goal.tasks)
        ? goal.tasks
            .filter((t) => t.is_completed)
            .map((t) => t.id)
            .sort()
        : [];
      const nextCompleted = [...checkedTasks].sort();
      const changed =
        JSON.stringify(currentCompleted) !== JSON.stringify(nextCompleted);

      // Prevent log insert if no task status changed AND notes are the same as last time
      if (!changed && notes.trim() === lastNotes.trim()) {
        alert("No changes to log.");
        return;
      }
    }

    // Calculate remaining time for TIME-based goal
    const remaining =
      goal.goal_type === "time"
        ? Math.max(goal.target_time * 60 - loggedTime, 0)
        : null;
    const newLogged =
      goal.goal_type === "time" && timeSpent ? Number(timeSpent) * 60 : 0;

    // Prevent logging more hours than remaining
    if (goal.goal_type === "time" && newLogged > remaining) {
      alert(
        `Logging ${newLogged / 60} hrs exceeds the remaining ${
          remaining / 60
        } hrs.`
      );
      return;
    }

    // Prevent log insert for TIME-based goal if no hours entered AND notes unchanged
    if (
      goal.goal_type === "time" &&
      newLogged === 0 &&
      notes.trim() === lastNotes.trim()
    ) {
      alert("No changes to log.");
      return;
    }

    // Build payload for insert
    const payload = {
      goal_id: goal.id,
      user_id: goal.user_id,
      log_type: goal.goal_type,
      notes,
      created_at: new Date().toISOString(),
      ...(goal.goal_type === "time" && newLogged > 0
        ? { logged_time: newLogged }
        : goal.goal_type === "task"
        ? { completed_task_ids: checkedTasks }
        : {}),
    };

    // Insert into study_logs
    const { error: logError } = await supabase
      .from("study_logs")
      .insert(payload);
    if (logError) {
      alert("Error saving log: " + logError.message);
    } else {
      // For TASK goals, update tasks table
      if (goal.goal_type === "task") {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ is_completed: false })
          .eq("goal_id", goal.id);

        if (!updateError && checkedTasks.length > 0) {
          const { error: completeError } = await supabase
            .from("tasks")
            .update({ is_completed: true })
            .in("id", checkedTasks);
          if (completeError)
            alert("Error marking completed tasks: " + completeError.message);
        } else if (updateError) {
          alert("Error resetting task status: " + updateError.message);
        }
      }

      onSave?.(payload);
      refreshGoals?.();
    }
  };

  const remainingHours =
    goal?.goal_type === "time"
      ? Math.max(goal.target_time - loggedTime / 60, 0)
      : null;

  if (!goal) return null;

  const completedTaskCount = checkedTasks.length;

  return (
    <div className="fixed inset-0 bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md px-6 py-6 sm:p-8 transition-all">
        <h2
          className="text-2xl font-semibold mb-4"
          style={{ color: PRIMARY_COLOR }}
        >
          📓 Log Study for <span className="font-extrabold">{goal.title}</span>
        </h2>

        {goal.goal_type === "time" ? (
          <>
            {/* Remaining hours info */}
            <div className="flex items-center text-sm mb-2 gap-1.5">
              <AlarmClock className="h-6 w-6 text-slate-600" />
              <p className="font-semibold text-slate-600">
                {remainingHours} hours left out of {goal.target_time} hours
              </p>
            </div>
            {remainingHours <= 0 && goal.target_time > 0 && (
              <div className="flex items-center text-sm text-green-600 mb-2 gap-1.5">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <p>Goal Completed. You can still check/ add notes.</p>
              </div>
            )}

            {remainingHours > 0 && (
              <>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: PRIMARY_COLOR }}
                >
                  Spent Time (hours):
                </label>
                <input
                  type="number"
                  step="0.25"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": PRIMARY_COLOR }}
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  min={0}
                  max={remainingHours}
                />
              </>
            )}
          </>
        ) : (
          <>
            {/* Task completion progress */}
            <p
              className="text-sm font-semibold text-white mb-3 rounded px-3 py-1 inline-block"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {completedTaskCount} / {goal.tasks?.length || 0} tasks completed
            </p>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: PRIMARY_COLOR }}
            >
              Completed Tasks:
            </label>
            <ul className="space-y-2 max-h-56 overflow-y-auto divide-y divide-gray-200 border rounded-lg">
              {goal.tasks?.map((task) => {
                const isChecked = checkedTasks.includes(task.id);
                return (
                  <li
                    key={task.id}
                    className={`flex items-center px-3 py-2 transition-colors rounded-md ${
                      isChecked ? "" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 border-gray-300 rounded"
                      style={{ accentColor: PRIMARY_COLOR }}
                      checked={isChecked}
                      onChange={() => handleCheck(task.id)}
                    />
                    <span
                      className={`ml-3 text-sm font-medium transition-colors ${
                        isChecked ? "line-through decoration-2" : ""
                      }`}
                      style={{ color: PRIMARY_COLOR }}
                    >
                      {task.task_text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* Notes section */}
        <label
          className="block text-sm font-medium mt-6 mb-1"
          style={{ color: PRIMARY_COLOR }}
        >
          Notes:
        </label>
        <textarea
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": PRIMARY_COLOR }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
          rows={4}
        />

        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className={BUTTON_SECONDARY}>
            Cancel
          </button>
          <button onClick={handleSubmit} className={BUTTON_PRIMARY}>
            Save Log
          </button>
        </div>
      </div>
    </div>
  );
}
