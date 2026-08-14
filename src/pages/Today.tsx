/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useJarvis } from "../context/JarvisContext";
import {
  Sun,
  Calendar,
  AlertTriangle,
  Plus,
  Sparkles,
  CheckCircle2,
  Trash2,
  ListRestart,
  Volume2,
  FolderDot
} from "lucide-react";
import { TaskCard } from "../components/TaskCard";
import { TaskStatus, TaskPriority } from "../types";

export const Today: React.FC = () => {
  const {
    tasks,
    createTask,
    updateTask,
    areas,
    projects
  } = useJarvis();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split("T")[0];
  const todayLabel = todayDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });


  // Filter tasks
  const todayTasks = tasks.filter(t => t.dueDate === todayStr && !t.isArchived);
  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== TaskStatus.COMPLETED && !t.isArchived);

  // Divide Today's tasks between Top 3 (High priority) vs others
  const topFocus = todayTasks
    .filter(t => t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT)
    .slice(0, 3);

  const remainingToday = todayTasks.filter(t => 
    !topFocus.some(tf => tf.id === t.id)
  );

  // Quick reschedule overdue tasks to today
  const handleRescheduleAllOverdue = async () => {
    if (confirm(`Deseja reagendar todas as ${overdueTasks.length} tarefas atrasadas para hoje?`)) {
      for (const t of overdueTasks) {
        await updateTask(t.id, { dueDate: todayStr });
      }
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Use selected area or fallback to personal
    const finalAreaId = selectedAreaId || (areas[0]?.id || "area-4");

    await createTask({
      title: newTaskTitle.trim(),
      status: TaskStatus.PENDING,
      priority: TaskPriority.NONE,
      dueDate: todayStr,
      areaId: finalAreaId,
      subtasks: [],
      tags: [],
      source: "today-screen"
    });

    setNewTaskTitle("");
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Foco do Dia</h1>
          </div>
          <p className="text-sm text-slate-400 font-medium">Sua agenda de execução de hoje, {todayLabel}.</p>
        </div>
      </div>

      {/* OVERDUE WARNER BANNER */}
      {overdueTasks.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-500/25 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md shadow-rose-950/15 animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-rose-300">Pendências em atraso detectadas!</h4>
              <p className="text-xs text-rose-400/80 font-medium">Você tem {overdueTasks.length} tarefas vencidas acumulando no histórico. Deseja reajustar seus prazos?</p>
            </div>
          </div>
          <button
            onClick={handleRescheduleAllOverdue}
            className="py-1.5 px-3.5 bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs rounded-lg shadow-sm transition-all whitespace-nowrap self-start sm:self-center"
            id="reschedule-overdue-btn"
          >
            Reagendar todas para Hoje
          </button>
        </div>
      )}

      {/* TOP 3 DO DIA SECTION */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>PILARE-CHAVE / TOP 3 DE FOCO DE HOJE</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topFocus.length > 0 ? (
            topFocus.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="col-span-3 py-7 bg-slate-900/30 border border-slate-850 border-dashed rounded-xl text-center text-slate-500 flex flex-col items-center justify-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Nenhum foco de alta prioridade definido para hoje.</span>
              <p className="text-[10px] text-slate-500 max-w-xs font-mono">Dica: Edite as tarefas e altere a prioridade para Alta ou Urgente para exibi-las no topo do seu dia.</p>
            </div>
          )}
        </div>
      </div>

      {/* OUTRAS TAREFAS LISTING */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>OUTRAS TAREFAS AGENDADAS PARA HOJE ({remainingToday.length})</span>
        </h3>

        <div className="space-y-2.5" id="today-tasks-container">
          {remainingToday.length > 0 ? (
            remainingToday.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            todayTasks.length === 0 && (
              <div className="py-12 bg-slate-900/10 border border-slate-850 rounded-xl text-center text-slate-500 flex flex-col items-center justify-center gap-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-300">Nenhuma tarefa agendada</span>
                <span className="text-[11px] text-slate-550 font-mono">Escreva abaixo para cadastrar algo rapidamente!</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* QUICK INLINE INSERTION FORM */}
      <form onSubmit={handleQuickAdd} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Nova tarefa agendada para hoje..."
            className="bg-slate-950/80 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 flex-1 transition-all"
            id="today-quick-title-input"
          />
          <button
            type="submit"
            className="py-2 px-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
            id="today-quick-add-submit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>

        {/* Association attributes shortcut row */}
        <div className="flex items-center gap-3.5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Área:</span>
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="bg-transparent border-none text-slate-300 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="" className="bg-slate-950">Selecione uma área...</option>
              {areas.map(a => (
                <option key={a.id} value={a.id} className="bg-slate-950">{a.name}</option>
              ))}
            </select>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-[10px] text-slate-500 font-mono">Cadastra com vencimento para HOJE automáticamente</span>
        </div>
      </form>

    </div>
  );
};
