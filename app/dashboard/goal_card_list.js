"use client";
import GoalCard from "./goal_card";
import { PRIMARY_COLOR } from "../styles";

export default function GoalCardList({
  title,
  goals,
  onLogClick,
  onDeleteClick,
  onEditClick,
}) {
  return (
    <section className="mb-10">
      <h2
        className="text-2xl font-bold mb-4 tracking-tight"
        style={{ color: PRIMARY_COLOR }}
      >
        {title}
      </h2>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="rounded-2xl bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.08)] ring-1 ring-slate-200 transition-transform hover:scale-[1.01]"
          >
            <GoalCard
              goal={goal}
              onLog={() => onLogClick(goal)}
              onDelete={() => onDeleteClick(goal.id)}
              onEdit={() => onEditClick(goal)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
