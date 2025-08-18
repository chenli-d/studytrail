"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import GoalModal from "./goal_modal";
import StudyLogModal from "./studylog_modal";
import GoalCardList from "./goal_card_list";
import { useRouter } from "next/navigation";
import {
  BUTTON_LOGOUT_SOFT,
  BUTTON_PRIMARY,
  PRIMARY_COLOR,
  BUTTON_PRIMARY_SOFT,
} from "../../styles/styles";

export default function Dashboard() {
  // ---------- State management ----------
  const [user, setUser] = useState(null); // current logged-in user
  const [goals, setGoals] = useState([]); // all goals
  const [todaysGoals, setTodaysGoals] = useState([]); // goals due today
  const [showGoalModal, setShowGoalModal] = useState(false); // toggle goal form modal
  const [showLogModal, setShowLogModal] = useState(false); // toggle study log modal
  const [selectedGoal, setSelectedGoal] = useState(null); // goal being edited/logged
  const [activeSort, setActiveSort] = useState("dueDate"); // current sorting method
  const router = useRouter();

  // ---------- Fetch current user ----------
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  // ---------- Load goals when user changes ----------
  useEffect(() => {
    if (!user?.id) return;
    loadGoals();
  }, [user?.id, loadGoals]);

  // ---------- Filter today's goals ----------
  useEffect(() => {
    const today = new Date();
    const localToday = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10);

    const filteredTodaysGoals = goals.filter((goal) => {
      if (!goal.deadline) return false;
      // If deadline has time (ISO with "T"), normalize to LOCAL calendar date
      const goalDate = goal.deadline.includes("T")
        ? (() => {
            const d = new Date(goal.deadline);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${dd}`;
          })()
        : goal.deadline.slice(0, 10);
      return goalDate === localToday;
    });

    setTodaysGoals(filteredTodaysGoals);
  }, [goals]);

  const loadGoals = useCallback(async () => {
    if (!user?.id) return;

    try {
      // fetch goals with tasks and logs
      const { data: rawGoals, error } = await supabase
        .from("goals")
        .select("*, tasks(*), study_logs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching goals:", error.message);
        return;
      }

      // fetch study logs for time calculations
      const { data: logs, error: logsError } = await supabase
        .from("study_logs")
        .select("goal_id, logged_time")
        .eq("user_id", user.id);

      if (logsError) {
        console.error("Error fetching logs:", logsError.message);
        setGoals(rawGoals || []);
        return;
      }

      // accumulate total logged time per goal
      const timeMap = {};
      for (const log of logs || []) {
        if (!timeMap[log.goal_id]) timeMap[log.goal_id] = 0;
        timeMap[log.goal_id] += log.logged_time || 0;
      }

      // merge goals with aggregated logged time
      const goalsWithTime = (rawGoals || []).map((goal) => ({
        ...goal,
        logged_time: timeMap[goal.id] || 0,
      }));

      // sort by deadline by default
      const sorted = goalsWithTime.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });

      setGoals(sorted);
      setActiveSort("dueDate");
    } catch (error) {
      console.error("Error in loadGoals:", error);
    }
  }, [user?.id]);

  // ---------- Create new goal ----------
  const handleAddGoal = async (newGoal) => {
    try {
      const { title, subject, deadline, goal_type, target_time, tasks } =
        newGoal;

      // insert into goals table
      const { data: goal, error } = await supabase
        .from("goals")
        .insert({
          title,
          subject,
          deadline,
          goal_type,
          user_id: user.id,
          ...(goal_type === "time" && { target_time }),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating goal:", error);
        throw error;
      }

      // if task-based, insert tasks
      if (goal_type === "task" && tasks?.length > 0) {
        const rows = tasks
          .filter((t) => (t.task_text ?? "").trim() !== "")
          .map((t) => ({ goal_id: goal.id, task_text: t.task_text.trim() }));

        if (rows.length) {
          const { error: taskError } = await supabase
            .from("tasks")
            .insert(rows);
          if (taskError) {
            console.error("Error creating tasks:", taskError);
            throw taskError;
          }
        }
      }
    } catch (error) {
      console.error("Error in handleAddGoal:", error);
      throw error;
    }
  };

  // ---------- Delete goal (with confirm) ----------
  const handleDeleteGoal = async (goalId) => {
    // Optional: show the goal title in the confirm message
    const g = goals.find((x) => x.id === goalId);
    const label = g?.title ? `"${g.title}"` : "this goal";

    const ok = window.confirm(`Delete ${label}? This cannot be undone.`);
    if (!ok) return;

    try {
      await supabase.from("goals").delete().eq("id", goalId).throwOnError();
      await loadGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("Failed to delete. Please try again.");
    }
  };

  // ---------- Edit goal (open modal) ----------
  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setShowGoalModal(true);
  };

  // ---------- Sorting ----------
  const sortByDueDate = () => {
    const sorted = [...goals].sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
    setGoals(sorted);
    setActiveSort("dueDate");
  };

  const sortByTitle = () => {
    const sorted = [...goals].sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    );
    setGoals(sorted);
    setActiveSort("title");
  };

  const timeGoals = goals.filter((g) => g.goal_type === "time");
  const taskGoals = goals.filter((g) => g.goal_type === "task");

  // ---------- Render ----------
  return (
    <main className="min-h-screen p-6 bg-slate-200 text-gray-800">
      {/* Header with app title and logout */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>
          🐌 StudyTrail
        </h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
          }}
          className={BUTTON_LOGOUT_SOFT}
        >
          Logout
        </button>
      </header>

      {/* Section: Today's Goals */}
      <div className="flex items-center mb-6 px-4 py-3 rounded-lg bg-slate-300 shadow-inner ring-1 ring-white/40">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-wide text-slate-800">
          <span className="text-2xl">📌</span>
          <span style={{ color: PRIMARY_COLOR }}>{"Today's Goals"}</span>
        </h2>
      </div>
      <GoalCardList
        title="✍️ Keep Focus"
        goals={todaysGoals}
        onLogClick={(goal) => {
          setSelectedGoal(goal);
          setShowLogModal(true);
        }}
        onDeleteClick={handleDeleteGoal}
        onEditClick={handleEditGoal}
      />

      {/* Section: All Goals with Add + Sort Buttons*/}
      <div className="flex items-center justify-between mb-6 rounded-lg bg-slate-300 px-4 py-3 shadow-inner ring-1 ring-white/40">
        {/* Left group: title + Add */}
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-wide text-slate-800">
            <span className="text-2xl">🎯</span>
            <span style={{ color: PRIMARY_COLOR }}>My Goals</span>
          </h2>

          <button
            className={BUTTON_PRIMARY}
            onClick={() => setShowGoalModal(true)}
          >
            + Add
          </button>
        </div>

        {/* Right group: sort buttons */}
        <div className="flex items-center gap-4">
          <button
            className={
              activeSort === "dueDate" ? BUTTON_PRIMARY : BUTTON_PRIMARY_SOFT
            }
            onClick={sortByDueDate}
          >
            Sort by Due Date
          </button>
          <button
            className={
              activeSort === "title" ? BUTTON_PRIMARY : BUTTON_PRIMARY_SOFT
            }
            onClick={sortByTitle}
          >
            Sort by Title
          </button>
        </div>
      </div>

      <GoalCardList
        title="⏳ Time-based"
        goals={timeGoals}
        onLogClick={(goal) => {
          setSelectedGoal(goal);
          setShowLogModal(true);
        }}
        onDeleteClick={handleDeleteGoal}
        onEditClick={handleEditGoal}
      />

      <div className="h-4" />

      <GoalCardList
        title="🧩 Task-based"
        goals={taskGoals}
        onLogClick={(goal) => {
          setSelectedGoal(goal);
          setShowLogModal(true);
        }}
        onDeleteClick={handleDeleteGoal}
        onEditClick={handleEditGoal}
      />

      {/* Goal modal (add/edit) */}
      {showGoalModal && (
        <GoalModal
          goal={selectedGoal}
          onClose={() => {
            setShowGoalModal(false);
            setSelectedGoal(null);
          }}
          onSave={async (payload) => {
            const isEditing = !!selectedGoal?.id;
            try {
              if (isEditing) {
                // update existing goal
                await supabase
                  .from("goals")
                  .update({
                    title: payload.title,
                    subject: payload.subject,
                    deadline: payload.deadline,
                    target_time: payload.target_time,
                  })
                  .eq("id", selectedGoal.id)
                  .throwOnError();

                // handle tasks update for task-based goals
                if (selectedGoal.goal_type === "task") {
                  const { data: existingTasks } = await supabase
                    .from("tasks")
                    .select("id, task_text")
                    .eq("goal_id", selectedGoal.id)
                    .throwOnError();

                  const incoming = (payload.tasks || [])
                    .map((t) => ({
                      id: t.id ?? null,
                      task_text: (t.task_text || "").trim(),
                    }))
                    .filter((t) => t.task_text !== "");

                  const existingMap = new Map(
                    (existingTasks || []).map((t) => [t.id, t])
                  );
                  const incomingIds = new Set(
                    incoming.filter((t) => t.id != null).map((t) => t.id)
                  );

                  // diff tasks → delete, insert, update
                  const toDelete = (existingTasks || [])
                    .filter((t) => !incomingIds.has(t.id))
                    .map((t) => t.id);

                  const toInsert = incoming.filter((t) => t.id == null);
                  const toUpdate = incoming.filter(
                    (t) =>
                      t.id != null &&
                      existingMap.get(t.id)?.task_text !== t.task_text
                  );

                  if (toDelete.length) {
                    await supabase
                      .from("tasks")
                      .delete()
                      .in("id", toDelete)
                      .throwOnError();
                  }

                  if (toInsert.length) {
                    await supabase
                      .from("tasks")
                      .insert(
                        toInsert.map((t) => ({
                          goal_id: selectedGoal.id,
                          task_text: t.task_text,
                        }))
                      )
                      .throwOnError();
                  }

                  if (toUpdate.length) {
                    await Promise.all(
                      toUpdate.map((row) =>
                        supabase
                          .from("tasks")
                          .update({ task_text: row.task_text })
                          .eq("id", row.id)
                          .throwOnError()
                      )
                    );
                  }
                }
              } else {
                // create new goal
                await handleAddGoal(payload);
              }
              await loadGoals();
              setShowGoalModal(false);
              setSelectedGoal(null);
            } catch (error) {
              console.error("Error saving goal:", error);
            }
          }}
        />
      )}

      {/* Study log modal */}
      {showLogModal && selectedGoal && (
        <StudyLogModal
          goal={selectedGoal}
          onClose={() => {
            setShowLogModal(false);
            setSelectedGoal(null);
          }}
          onSave={async () => {
            setShowLogModal(false);
            setSelectedGoal(null);
            await loadGoals();
          }}
          refreshGoals={loadGoals}
        />
      )}
    </main>
  );
}
