/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  Play, 
  Flag, 
  Layers, 
  Target, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  ListTodo,
  CheckCircle,
  Archive,
  Trash2,
  Calendar
} from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "../types";
import { playTaskCompleteSound } from "../lib/audioFX";

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { 
    updateTask, 
    deleteTask, 
    setSelectedTask, 
    setFocusTask, 
    areas, 
    projects 
  } = useJarvis();

  const handleCheckboxClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
    if (nextStatus === TaskStatus.COMPLETED) {
      playTaskCompleteSound();
    }
    await updateTask(task.id, { status: nextStatus });
  };

  const handleFocusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFocusTask(task);
  };

  const handleArchiveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateTask(task.id, { isArchived: true, status: TaskStatus.ARCHIVED });
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja realmente deletar esta tarefa?")) {
      await deleteTask(task.id);
    }
  };

  const area = areas.find(a => a.id === task.areaId);
  const project = projects.find(p => p.id === task.projectId);

  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== TaskStatus.COMPLETED;

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return "";
    if (dateStr === todayStr) return "Hoje";

    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split("T")[0];
    if (dateStr === tomStr) return "Amanhã";

    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
    }
    return dateStr;
  };

  const getPriorityInfo = (pri: TaskPriority) => {
    switch (pri) {
      case TaskPriority.URGENT:
        return { color: "text-red-500", label: "Urgente", style: "bg-red-500/10 text-red-500" };
      case TaskPriority.HIGH:
        return { color: "text-orange-500", label: "Alta", style: "bg-orange-500/10 text-orange-500" };
      case TaskPriority.MEDIUM:
        return { color: "text-blue-500", label: "Média", style: "bg-blue-500/10 text-blue-500" };
      case TaskPriority.LOW:
        return { color: "text-green-500", label: "Baixa", style: "bg-green-500/10 text-green-500" };
      default:
        return null;
    }
  };

  const priInfo = getPriorityInfo(task.priority);
  const isCompleted = task.status === TaskStatus.COMPLETED;

  return (
    <div 
      onClick={() => setSelectedTask(task)}
      className={`
        bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors flex flex-col justify-between relative group/card
        ${isCompleted ? "opacity-50 bg-slate-900/50" : ""}
        ${isOverdue ? "border-l-2 border-l-red-500" : ""}
      `}
      id={`task-card-${task.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleCheckboxClick}
          className="mt-0.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-blue-500 transition-colors shrink-0"
          id={`task-check-${task.id}`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/10" />
          ) : (
            <Circle className="w-5 h-5 text-slate-500" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium block truncate ${isCompleted ? "text-slate-500 line-through" : "text-white"}`}>
            {task.title}
          </span>
          {task.description && (
            <p className="text-xs text-slate-500 truncate mt-1">
              {task.description}
            </p>
          )}
        </div>

        {priInfo && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${priInfo.style}`}>
            {priInfo.label}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-medium">
        {area && (
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: area.color }} />
            <span className="truncate max-w-[100px]">{area.name}</span>
          </span>
        )}

        {project && (
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="text-slate-600">•</span>
            <span className="truncate max-w-[100px] text-slate-300">{project.name}</span>
          </span>
        )}

        {task.subtasks.length > 0 && (
          <span className="flex items-center gap-1 text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
            <ListTodo className="w-3 h-3" />
            <span>{task.subtasks.filter(s=>s.completed).length}/{task.subtasks.length}</span>
          </span>
        )}

        {task.recurrence && task.recurrence !== "none" && (
          <span className="text-slate-500">
            ↻
          </span>
        )}

        {task.dueDate && (
          <span className={`
            flex items-center gap-1.5 ml-auto text-xs font-medium
            ${isOverdue ? "text-red-400" : "text-slate-400"}
          `}>
            {isOverdue ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            <span>{formatDueDate(task.dueDate)}</span>
          </span>
        )}
      </div>

      <div className="absolute right-2 top-2 hidden group-hover/card:flex items-center gap-1 bg-slate-800 p-1 rounded-lg shadow-lg">
        <button
          onClick={handleFocusClick}
          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded transition-colors"
          title="Iniciar Modo Foco"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
        <button
          onClick={handleArchiveClick}
          className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
          title="Arquivar"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDeleteClick}
          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
