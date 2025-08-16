'use client';

import { useEffect, useState } from 'react';

export default function GoalModal({ onClose, onSave, initialValues }) {
  const isEdit = !!initialValues;

  const [goalType, setGoalType] = useState(initialValues?.goal_type || 'time');
  const [title, setTitle] = useState(initialValues?.title || '');
  const [subject, setSubject] = useState(initialValues?.subject || '');
  const [deadline, setDeadline] = useState(initialValues?.deadline || '');
  const [targetTime, setTargetTime] = useState(initialValues?.target_time || '');
  const [tasks, setTasks] = useState(
    initialValues?.tasks?.map(t => t.task_text) || ['']
  );

  const handleAddTask = () => setTasks([...tasks, '']);
  const handleTaskChange = (value, index) => {
    const updated = [...tasks];
    updated[index] = value;
    setTasks(updated);
  };

  const handleSubmit = () => {
    const payload = {
      title,
      subject,
      deadline,
      goal_type: goalType,
      ...(goalType === 'time'
        ? { target_time: parseInt(targetTime) }
        : { tasks: tasks.filter(Boolean) }),
      ...(isEdit && { id: initialValues.id })  // include id if editing
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEdit ? 'Edit Goal' : 'Add Goal'}
        </h2>

        <label className="block mb-2">Goal Title:</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

        <label className="block mt-4 mb-2">Subject:</label>
        <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />

        <label className="block mt-4 mb-2">Deadline:</label>
        <input
          type="date"
          className="input"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <div className="mt-4">
          <label className="font-semibold">Goal Type:</label>
          <div className="flex gap-4 mt-2">
            <label><input type="radio" checked={goalType === 'time'} onChange={() => setGoalType('time')} /> Time-based</label>
            <label><input type="radio" checked={goalType === 'task'} onChange={() => setGoalType('task')} /> Task-based</label>
          </div>
        </div>

        {goalType === 'time' && (
          <div className="mt-4">
            <label>Target Hours:</label>
            <input className="input" type="number" value={targetTime} onChange={(e) => setTargetTime(e.target.value)} />
          </div>
        )}

        {goalType === 'task' && (
          <div className="mt-4">
            <label>Tasks:</label>
            {tasks.map((task, index) => (
              <input
                key={index}
                className="input mb-2"
                value={task}
                onChange={(e) => handleTaskChange(e.target.value, index)}
              />
            ))}
            <button onClick={handleAddTask} className="text-blue-500 mt-2">+ Add Task</button>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded">
            {isEdit ? 'Update Goal' : 'Save Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}
