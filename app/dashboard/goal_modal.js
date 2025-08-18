"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_DELETE,
  PRIMARY_COLOR,
} from "../../styles/styles";
import { Trash2 } from "lucide-react";

export default function GoalModal({ onClose, onSave, goal }) {
  const isEdit = !!goal?.id;

  // ---------- State ----------
  const [goalType, setGoalType] = useState("time"); // type: time-based or task-based
  const [title, setTitle] = useState(""); // goal title
  const [subject, setSubject] = useState(""); // subject of the goal
  const [deadline, setDeadline] = useState(""); // deadline date
  const [targetTime, setTargetTime] = useState(""); // target time in hours
  const [tasks, setTasks] = useState([{ id: null, task_text: "" }]); // task list for task-based goal

  // ---------- Load existing goal (for edit) or reset states (for new) ----------
  useEffect(() => {
    if (goal) {
      setGoalType(goal.goal_type || "time");
      setTitle(goal.title || "");
      setSubject(goal.subject || "");
      setDeadline(() => {
        const v = goal.deadline;
        if (!v) return ""; // No deadline → keep the input empty

        // --- If the value is a string ---
        if (typeof v === "string") {
          // Already in "YYYY-MM-DD" → use as-is
          if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

          // Otherwise, parse as Date (e.g., ISO with "T"), then extract LOCAL Y/M/D
          const d = new Date(v);
          if (isNaN(d)) return ""; // Guard against invalid dates

          // Build "YYYY-MM-DD" from local parts (not UTC) to match the user's timezone
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${dd}`;
        }

        // --- If the value is not a string (Date object or timestamp) ---
        // Convert to Date and again extract LOCAL Y/M/D
        const d = new Date(v);
        if (isNaN(d)) return ""; // Guard against invalid dates

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
      });

      setTargetTime(goal.target_time?.toString() || "");
      if (Array.isArray(goal.tasks) && goal.tasks.length > 0) {
        setTasks(
          goal.tasks.map((t) => ({
            id: t.id ?? null,
            task_text: t.task_text ?? "",
          }))
        );
      } else {
        setTasks([{ id: null, task_text: "" }]);
      }
    } else {
      // reset for new goal
      setGoalType("time");
      setTitle("");
      setSubject("");
      setDeadline("");
      setTargetTime("");
      setTasks([{ id: null, task_text: "" }]);
    }
  }, [goal?.id]);

  // ---------- Task Handlers ----------
  const handleAddTask = () =>
    setTasks((prev) => [...prev, { id: null, task_text: "" }]);
  const handleTaskChange = (value, index) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, task_text: value } : t))
    );
  };
  const handleDeleteTask = (index) => {
    setTasks((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ id: null, task_text: "" }];
    });
  };

  // ---------- Validation before submit ----------
  const validate = () => {
    if (!title.trim()) {
      alert("Please enter a goal title.");
      return false;
    }
    if (!subject.trim()) {
      alert("Please enter a subject.");
      return false;
    }
    if (!deadline) {
      alert("Please select a deadline.");
      return false;
    }
    if (goalType === "time") {
      const hrs = Number(targetTime);
      if (!Number.isFinite(hrs) || hrs <= 0) {
        alert("Please set a positive number of target hours.");
        return false;
      }
    } else {
      const nonEmpty = tasks.filter(
        (t) => t.task_text && t.task_text.trim() !== ""
      );
      if (nonEmpty.length === 0) {
        alert("Please add at least one task.");
        return false;
      }
    }
    return true;
  };

  // ---------- Submit handler ----------
  const handleSubmit = async () => {
    if (!validate()) return;

    const formattedDeadline = deadline || ""; // keep as local YYYY-MM-DD string

    // payload structure depends on goal type
    const payload = {
      title: title.trim(),
      subject: subject.trim(),
      deadline: formattedDeadline,
      goal_type: goalType,
      ...(goalType === "time"
        ? { target_time: Number(targetTime) }
        : {
            tasks: tasks
              .map((t) => ({
                id: t.id ?? null,
                task_text: (t.task_text || "").trim(),
              }))
              .filter((t) => t.task_text),
          }),
      ...(isEdit && { id: goal.id }),
    };

    await onSave(payload);

    // reset fields if it's a new goal
    if (!isEdit) {
      setGoalType("time");
      setTitle("");
      setSubject("");
      setDeadline("");
      setTargetTime("");
      setTasks([{ id: null, task_text: "" }]);
    }
  };

  // ---------- Styles ----------
  const ringStyle = { "--tw-ring-color": PRIMARY_COLOR };
  const accentStyle = { accentColor: PRIMARY_COLOR };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <AnimatePresence>
        <motion.div
          key="goal-modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md rounded-2xl bg-white px-6 py-6 shadow-xl sm:px-8"
        >
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: PRIMARY_COLOR }}
          >
            {isEdit ? "✏️ Edit Goal" : "✏️ Add New Goal"}
          </h2>

          {/* Title */}
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: PRIMARY_COLOR }}
          >
            Goal Title
          </label>
          <input
            className="w-full mb-3 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2"
            style={ringStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Finish Chapter 5"
          />

          {/* Subject */}
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: PRIMARY_COLOR }}
          >
            Subject
          </label>
          <input
            className="w-full mb-3 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2"
            style={ringStyle}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Math, Biology"
          />

          {/* Deadline */}
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: PRIMARY_COLOR }}
          >
            Deadline
          </label>
          <input
            type="date"
            className="w-full mb-3 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2"
            style={ringStyle}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          {/* Goal Type*/}
          <div className="mt-3 mb-4">
            <label
              className="block text-sm font-medium"
              style={{ color: PRIMARY_COLOR }}
            >
              Goal Type
              {isEdit && (
                <span
                  className="text-xs ml-2"
                  style={{ color: `${PRIMARY_COLOR}B3` }}
                >
                  (Cannot be changed)
                </span>
              )}
            </label>
            <div className="mt-2 flex items-center gap-6">
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: PRIMARY_COLOR }}
              >
                <input
                  type="radio"
                  name="goalType"
                  style={accentStyle}
                  checked={goalType === "time"}
                  onChange={() => setGoalType("time")}
                  disabled={isEdit}
                />
                <span
                  className={isEdit ? "" : ""}
                  style={{
                    color: isEdit ? `${PRIMARY_COLOR}B3` : PRIMARY_COLOR,
                  }}
                >
                  Time-based
                </span>
              </label>
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: PRIMARY_COLOR }}
              >
                <input
                  type="radio"
                  name="goalType"
                  style={accentStyle}
                  checked={goalType === "task"}
                  onChange={() => setGoalType("task")}
                  disabled={isEdit}
                />
                <span
                  className={isEdit ? "" : ""}
                  style={{
                    color: isEdit ? `${PRIMARY_COLOR}B3` : PRIMARY_COLOR,
                  }}
                >
                  Task-based
                </span>
              </label>
            </div>
          </div>

          {/* Time Goal Input */}
          {goalType === "time" && (
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: PRIMARY_COLOR }}
              >
                Target Hours
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2"
                style={ringStyle}
                type="number"
                min={0}
                step={0.5}
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
          )}

          {/* Task List Input */}
          {goalType === "task" && (
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: PRIMARY_COLOR }}
              >
                Tasks
              </label>
              {tasks.map((task, index) => (
                <div
                  key={task.id ?? `new-${index}`}
                  className="flex items-center gap-2 mb-2"
                >
                  <input
                    className="flex-1 input border px-3 py-2 rounded border-gray-300 focus:outline-none focus:ring-2"
                    style={ringStyle}
                    value={task.task_text}
                    onChange={(e) => handleTaskChange(e.target.value, index)}
                    placeholder={`Task ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(index)}
                    className={`${BUTTON_DELETE} text-xs px-2 py-1`}
                  >
                    <Trash2 className="h-5 w-5 mr-1" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddTask}
                className={`${BUTTON_PRIMARY} text-sm px-3 py-1`}
              >
                + Add Task
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-4">
            <button onClick={onClose} className={BUTTON_SECONDARY}>
              Cancel
            </button>
            <button onClick={handleSubmit} className={BUTTON_PRIMARY}>
              {isEdit ? "Update Goal" : "Save Goal"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
