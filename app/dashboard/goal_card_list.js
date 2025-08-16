'use client';
import GoalCard from './goal_card';

export default function GoalCardList({ title, goals, onLogClick, onDeleteClick }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <ul className="space-y-2">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onLog={() => onLogClick(goal)}
            onDelete={() => onDeleteClick(goal.id)}
          />
        ))}
      </ul>
    </section>
  );
}
