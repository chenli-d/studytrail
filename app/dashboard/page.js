"use client";

import { useEffect, useState } from "react";
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
} from "../styles";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [todaysGoals, setTodaysGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [activeSort, setActiveSort] = useState("dueDate"); 
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadGoals();
  }, [user]);

  useEffect(() => {
    const today = new Date();
    const localToday = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10);
    const filteredTodaysGoals = goals.filter((goal) => {
      if (!goal.deadline) return false;
      const goalDate = goal.deadline.includes("T")
        ? goal.deadline.split("T")[0]
        : goal.deadline.slice(0, 10);
      return goalDate === localToday;
    });
    setTodaysGoals(filteredTodaysGoals);
  }, [goals]);

  const loadGoals = async () => {
    if (!user?.id) return;

    try {
      const { data: rawGoals, error } = await supabase
        .from("goals")
        .select("*, tasks(*), study_logs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching goals:", error.message);
        return;
      }

      const { data: logs, error: logsError } = await supabase
        .from("study_logs")
        .select("goal_id, logged_time");

      if (logsError) {
        console.error("Error fetching logs:", logsError.message);
        setGoals(rawGoals || []);
        return;
      }

      const timeMap = {};
      for (const log of logs || []) {
        if (!timeMap[log.goal_id]) timeMap[log.goal_id] = 0;
        timeMap[log.goal_id] += log.logged_time || 0;
      }

      const goalsWithTime = (rawGoals || []).map((goal) => ({
        ...goal,
        logged_time: timeMap[goal.id] || 0,
      }));

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
  };

  const handleAddGoal = async (newGoal) => {
    try {
      const { title, subject, deadline, goal_type, target_time, tasks } =
        newGoal;
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

  const handleDeleteGoal = async (goalId) => {
    try {
      await supabase.from("goals").delete().eq("id", goalId);
      await loadGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setShowGoalModal(true);
  };

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

  return (
    <main className="min-h-screen p-6 bg-slate-200 text-gray-800">
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

      <div className="flex justify-center gap-4 mb-6">
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

      <GoalCardList
        title="📌 Today's Goals"
        goals={todaysGoals}
        onLogClick={(goal) => {
          setSelectedGoal(goal);
          setShowLogModal(true);
        }}
        onDeleteClick={handleDeleteGoal}
        onEditClick={handleEditGoal}
      />

      <div className="flex justify-center gap-4">
        <button
          className={BUTTON_PRIMARY}
          onClick={() => setShowGoalModal(true)}
        >
          + Add Goal
        </button>
      </div>

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
                await supabase
                  .from("goals")
                  .update({
                    title: payload.title,
                    subject: payload.subject,
                    deadline: payload.deadline,
                    target_time: payload.target_time,
                  })
                  .eq("id", selectedGoal.id);

                if (selectedGoal.goal_type === "task") {
                  const { data: existingTasks } = await supabase
                    .from("tasks")
                    .select("id, task_text")
                    .eq("goal_id", selectedGoal.id);

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
                    await supabase.from("tasks").delete().in("id", toDelete);
                  }

                  if (toInsert.length) {
                    await supabase.from("tasks").insert(
                      toInsert.map((t) => ({
                        goal_id: selectedGoal.id,
                        task_text: t.task_text,
                      }))
                    );
                  }

                  if (toUpdate.length) {
                    await Promise.all(
                      toUpdate.map((row) =>
                        supabase
                          .from("tasks")
                          .update({ task_text: row.task_text })
                          .eq("id", row.id)
                      )
                    );
                  }
                }
              } else {
                await handleAddGoal(payload);
              }
              await loadGoals();
            } catch (error) {
              console.error("Error saving goal:", error);
            } finally {
              setShowGoalModal(false);
              setSelectedGoal(null);
            }
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
