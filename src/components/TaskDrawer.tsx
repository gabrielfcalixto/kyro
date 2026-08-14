/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  X, 
  Calendar, 
  Clock, 
  Flag, 
  Layers, 
  Target, 
  Plus, 
  Trash2, 
  Archive, 
  Copy, 
  CheckSquare, 
  Square,
  Sparkles,
  Play,
  History,
  Timer,
  CheckCircle2,
  Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, TaskStatus, TaskPriority, SubTask } from "../types";

export const TaskDrawer: React.FC = () => {
  const {
    selectedTask,
    setSelectedTask,
    updateTask,
    deleteTask,
    createTask,
    areas,
    projects,
    setFocusTask
  } = useJarvis();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.NONE);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [areaId, setAreaId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [recurrence, setRecurrence] = useState<Task["recurrence"]>("none");
  const [estimatedDuration, setEstimatedDuration] = useState<number | "">("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newTagText, setNewTagText] = useState("");

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || "");
      setStatus(selectedTask.status);
      setPriority(selectedTask.priority);
      setDueDate(selectedTask.dueDate || "");
      setDueTime(selectedTask.dueTime || "");
      setAreaId(selectedTask.areaId);
      setProjectId(selectedTask.projectId || "none");
      setRecurrence(selectedTask.recurrence);
      setEstimatedDuration(selectedTask.estimatedDuration || "");
    }
  }, [selectedTask]);

  if (!selectedTask) return null;

  // Auto-saving helpers for inputs
  const handleFieldBlur = async (field: keyof Task, value: any) => {
    let cleanVal = value;
    if (field === "projectId" && value === "none") {
      cleanVal = undefined;
    }
    if (field === "estimatedDuration") {
      cleanVal = value === "" ? undefined : Number(value);
    }
    await updateTask(selectedTask.id, { [field]: cleanVal });
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    const updatedSubtasks = selectedTask.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed } : st
    );
    await updateTask(selectedTask.id, { subtasks: updatedSubtasks });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub: SubTask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false
    };

    const updatedSubtasks = [...selectedTask.subtasks, newSub];
    await updateTask(selectedTask.id, { subtasks: updatedSubtasks });
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = async (subtaskId: string) => {
    const updatedSubtasks = selectedTask.subtasks.filter(st => st.id !== subtaskId);
    await updateTask(selectedTask.id, { subtasks: updatedSubtasks });
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagText.trim()) return;
    const cleanTag = newTagText.trim().toLowerCase();
    if (!selectedTask.tags.includes(cleanTag)) {
      const updatedTags = [...selectedTask.tags, cleanTag];
      await updateTask(selectedTask.id, { tags: updatedTags });
    }
    setNewTagText("");
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = selectedTask.tags.filter(t => t !== tagToRemove);
    await updateTask(selectedTask.id, { tags: updatedTags });
  };

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir esta tarefa permanentemente?")) {
      const ok = await deleteTask(selectedTask.id);
      if (ok) setSelectedTask(null);
    }
  };

  const handleArchive = async () => {
    await updateTask(selectedTask.id, { isArchived: true, status: TaskStatus.ARCHIVED });
    setSelectedTask(null);
  };

  const handleDuplicate = async () => {
    await createTask({
      title: `${selectedTask.title} (Cópia)`,
      description: selectedTask.description,
      status: TaskStatus.PENDING,
      priority: selectedTask.priority,
      dueDate: selectedTask.dueDate,
      dueTime: selectedTask.dueTime,
      areaId: selectedTask.areaId,
      projectId: selectedTask.projectId,
      tags: selectedTask.tags,
      subtasks: selectedTask.subtasks.map(st => ({ ...st, id: `sub-${Date.now()}-${Math.random()}`, completed: false })),
      recurrence: selectedTask.recurrence,
      estimatedDuration: selectedTask.estimatedDuration,
      source: "duplicate"
    });
    alert("Tarefa duplicada com sucesso!");
  };

  const handleStartFocus = () => {
    setFocusTask(selectedTask);
    setSelectedTask(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end font-sans">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedTask(null)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Drawer panel */}
        <motion.div 
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          className="w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl relative z-10 flex flex-col h-full overflow-hidden"
          id="task-drawer"
        >
          {/* Top header actions */}
          <div className="h-14 bg-slate-950/40 border-b border-slate-800/60 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleStartFocus}
                className="py-1.5 px-3 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/25 text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                title="Iniciar Cronômetro de Foco"
                id="drawer-start-focus-btn"
              >
                <Play className="w-3.5 h-3.5 fill-indigo-400" />
                <span>Modo Foco</span>
              </button>
              <button
                onClick={handleDuplicate}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-white rounded-lg"
                title="Duplicar Tarefa"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleArchive}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-white rounded-lg"
                title="Arquivar Tarefa"
                id="drawer-archive-btn"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/25 text-rose-400 hover:text-rose-300 rounded-lg"
                title="Excluir Tarefa"
                id="drawer-delete-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <button 
              onClick={() => setSelectedTask(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
              id="drawer-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer content (scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {/* Inline Title input */}
            <div className="space-y-1">
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleFieldBlur("title", title)}
                className="text-xl font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-800/80 focus:border-indigo-500 focus:outline-none w-full py-1 leading-tight tracking-tight"
                placeholder="Título da Tarefa"
                id="drawer-title-input"
              />
            </div>

            {/* Quick selectors grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/30 p-4 rounded-xl border border-slate-850/60">
              {/* Status field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Status</label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as TaskStatus);
                      updateTask(selectedTask.id, { status: e.target.value as TaskStatus });
                    }}
                    className="bg-transparent text-xs text-slate-200 focus:outline-none w-full font-semibold cursor-pointer"
                  >
                    <option value={TaskStatus.INBOX} className="bg-slate-900">Caixa de entrada</option>
                    <option value={TaskStatus.PENDING} className="bg-slate-900">Pendente</option>
                    <option value={TaskStatus.IN_PROGRESS} className="bg-slate-900">Em andamento</option>
                    <option value={TaskStatus.BLOCKED} className="bg-slate-900">Bloqueada</option>
                    <option value={TaskStatus.COMPLETED} className="bg-slate-900">Concluída</option>
                    <option value={TaskStatus.CANCELLED} className="bg-slate-900">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Priority field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Prioridade</label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                  <Flag className="w-3.5 h-3.5 text-rose-500" />
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value as TaskPriority);
                      updateTask(selectedTask.id, { priority: e.target.value as TaskPriority });
                    }}
                    className="bg-transparent text-xs text-slate-200 focus:outline-none w-full font-semibold cursor-pointer"
                  >
                    <option value={TaskPriority.NONE} className="bg-slate-900">Sem prioridade</option>
                    <option value={TaskPriority.LOW} className="bg-slate-900">Baixa</option>
                    <option value={TaskPriority.MEDIUM} className="bg-slate-900">Média</option>
                    <option value={TaskPriority.HIGH} className="bg-slate-900">Alta</option>
                    <option value={TaskPriority.URGENT} className="bg-slate-900">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Due Date field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Data de Vencimento</label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      updateTask(selectedTask.id, { dueDate: e.target.value || undefined });
                    }}
                    className="bg-transparent text-xs text-slate-300 focus:outline-none w-full cursor-pointer font-medium"
                  />
                </div>
              </div>

              {/* Due Time field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Horário Estimado</label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => {
                      setDueTime(e.target.value);
                      updateTask(selectedTask.id, { dueTime: e.target.value || undefined });
                    }}
                    className="bg-transparent text-xs text-slate-300 focus:outline-none w-full cursor-pointer font-medium"
                  />
                </div>
              </div>

              {/* Area field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Área de Foco</label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={areaId}
                    onChange={(e) => {
                      setAreaId(e.target.value);
                      updateTask(selectedTask.id, { areaId: e.target.value });
                    }}
                    className="bg-transparent text-xs text-slate-200 focus:outline-none w-full cursor-pointer font-semibold"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Project field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Projeto Associado</label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                  <Target className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value);
                      updateTask(selectedTask.id, { projectId: e.target.value === "none" ? undefined : e.target.value });
                    }}
                    className="bg-transparent text-xs text-slate-200 focus:outline-none w-full cursor-pointer font-semibold"
                  >
                    <option value="none" className="bg-slate-900">Sem projeto</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Descrição detalhada</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleFieldBlur("description", description)}
                placeholder="Adicione observações, anotações ou detalhes sobre a execução desta tarefa..."
                className="w-full h-24 bg-slate-950/40 hover:bg-slate-950/60 focus:bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-none"
                id="drawer-desc-textarea"
              />
            </div>

            {/* Subtasks checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subtarefas ({selectedTask.subtasks.filter(s=>s.completed).length}/{selectedTask.subtasks.length})</span>
                </label>
              </div>

              {/* Subtasks listing */}
              <div className="space-y-2">
                {selectedTask.subtasks.map(st => (
                  <div key={st.id} className="flex items-center justify-between group/st bg-slate-950/20 border border-slate-850/45 p-2 rounded-lg hover:border-slate-800 transition-all">
                    <button
                      onClick={() => handleToggleSubtask(st.id, !st.completed)}
                      className="flex items-center gap-3 text-left focus:outline-none"
                    >
                      {st.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 border border-slate-700 hover:border-indigo-500 rounded-md shrink-0" />
                      )}
                      <span className={`text-xs ${st.completed ? "text-slate-500 line-through" : "text-slate-300"} font-medium`}>
                        {st.title}
                      </span>
                    </button>
                    <button
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="opacity-0 group-hover/st:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Subtask Quick Add */}
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Adicionar nova subtarefa..."
                    className="bg-slate-950/35 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none flex-1 transition-all"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Recurrence Pattern & Estimative row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Recurrence field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Recorrência</label>
                <div className="bg-slate-950/20 border border-slate-800/80 rounded-lg p-2 flex items-center">
                  <select
                    value={recurrence}
                    onChange={(e) => {
                      setRecurrence(e.target.value as any);
                      updateTask(selectedTask.id, { recurrence: e.target.value as any });
                    }}
                    className="bg-transparent text-xs text-slate-300 focus:outline-none w-full font-medium cursor-pointer"
                  >
                    <option value="none" className="bg-slate-900">Não recorrente</option>
                    <option value="daily" className="bg-slate-900">Diariamente</option>
                    <option value="weekdays" className="bg-slate-900">Dias úteis (Seg-Sex)</option>
                    <option value="weekly" className="bg-slate-900">Semanalmente</option>
                    <option value="monthly" className="bg-slate-900">Mensalmente</option>
                    <option value="yearly" className="bg-slate-900">Anualmente</option>
                  </select>
                </div>
              </div>

              {/* Estimate duration field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Duração Estimada (min)</label>
                <div className="bg-slate-950/20 border border-slate-800/80 rounded-lg p-2 flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value === "" ? "" : Number(e.target.value))}
                    onBlur={() => handleFieldBlur("estimatedDuration", estimatedDuration)}
                    placeholder="Minutos"
                    className="bg-transparent text-xs text-slate-300 focus:outline-none w-full font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Tags section */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                <span>Etiquetas</span>
              </label>
              
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/20 p-2.5 rounded-lg border border-slate-850/45">
                {selectedTask.tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className="text-[11px] font-semibold bg-slate-850 text-indigo-300 border border-indigo-500/10 py-0.5 px-2 rounded-full flex items-center gap-1 group/tag shadow-sm"
                  >
                    <span>#{tag}</span>
                    <button 
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-500 hover:text-rose-400 shrink-0 text-[10px]"
                    >
                      ×
                    </button>
                  </span>
                ))}
                
                {/* Tag inline creator */}
                <form onSubmit={handleAddTag} className="inline-block">
                  <input
                    type="text"
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    placeholder="+ Tag..."
                    className="bg-transparent focus:outline-none text-[11px] text-slate-400 font-medium placeholder-slate-600 w-16 focus:w-24 transition-all border-none"
                  />
                </form>
              </div>
            </div>

            {/* Timing Tracker (Logged timeSpent vs estimate) */}
            <div className="flex items-center justify-between text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
              <div className="flex items-center gap-2 text-slate-400 font-mono">
                <History className="w-4 h-4 text-slate-500" />
                <span>Tempo total consumido:</span>
              </div>
              <span className="font-bold text-slate-200 font-mono">
                {selectedTask.timeSpent} minutos
                {selectedTask.estimatedDuration ? ` / ${selectedTask.estimatedDuration}m` : ""}
              </span>
            </div>

            {/* Time stamps */}
            <div className="pt-4 border-t border-slate-800/40 flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Criado: {new Date(selectedTask.createdAt).toLocaleDateString("pt-BR")}</span>
              {selectedTask.completedAt && (
                <span className="text-emerald-500">Concluído: {new Date(selectedTask.completedAt).toLocaleDateString("pt-BR")}</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
