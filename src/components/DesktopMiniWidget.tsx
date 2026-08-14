/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  X, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Maximize2, 
  Sun, 
  ListTodo, 
  Mic, 
  Sparkles,
  Calendar,
  Layers,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playTaskCompleteSound, playTaskAddSound } from "../lib/audioFX";
import { TaskStatus, TaskPriority } from "../types";

interface DesktopMiniWidgetProps {
  onExpandToFullApp: () => void;
  onClose: () => void;
}

export const DesktopMiniWidget: React.FC<DesktopMiniWidgetProps> = ({
  onExpandToFullApp,
  onClose
}) => {
  const { tasks, updateTask, createTask, parseNaturalLanguage } = useJarvis();
  const [quickInput, setQuickInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Today's tasks
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(t => !t.isArchived && t.status !== TaskStatus.ARCHIVED && (t.dueDate === todayStr || !t.dueDate));

  const handleToggleTask = async (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus = currentStatus === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
    if (nextStatus === TaskStatus.COMPLETED) {
      playTaskCompleteSound();
    }
    await updateTask(taskId, { status: nextStatus });
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Parse with natural language AI
      const parsed = await parseNaturalLanguage(quickInput.trim());
      await createTask({
        title: parsed.title || quickInput.trim(),
        dueDate: parsed.dueDate || todayStr,
        dueTime: parsed.dueTime || undefined,
        priority: parsed.priority || TaskPriority.NONE,
        areaId: parsed.areaId || "area-4",
        projectId: parsed.projectId || undefined,
        tags: parsed.tags || []
      });
      playTaskAddSound();
      setQuickInput("");
    } catch (err) {
      console.error("Quick add error:", err);
      await createTask({
        title: quickInput.trim(),
        dueDate: todayStr,
        areaId: "area-4",
        priority: TaskPriority.NONE
      });
      playTaskAddSound();
      setQuickInput("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[500px]"
    >
      {/* Titlebar header */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white">
            <Sun className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">Meu Dia — Microsoft To Do Style</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onExpandToFullApp}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Expandir para o App Desktop Completo"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Fechar Mini Widget"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleQuickAdd} className="p-3 border-b border-slate-800/80 bg-slate-900/60">
        <div className="relative">
          <input
            type="text"
            placeholder="Adicionar tarefa rápida para hoje..."
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            disabled={isSubmitting}
            className="w-full bg-slate-950 text-white text-xs pl-8 pr-8 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          />
          <Plus className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          {isSubmitting && (
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
          )}
        </div>
      </form>

      {/* Task List */}
      <div className="p-3 overflow-y-auto flex-1 space-y-2 max-h-[320px]">
        {todayTasks.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Tudo pronto por hoje!</p>
            <p className="text-[11px] text-slate-600">Nenhuma tarefa pendente no seu Dia.</p>
          </div>
        ) : (
          todayTasks.map(t => {
            const isDone = t.status === TaskStatus.COMPLETED;
            return (
              <div
                key={t.id}
                onClick={() => handleToggleTask(t.id, t.status)}
                className={`
                  p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5
                  ${isDone 
                    ? "bg-slate-950/40 border-slate-900 opacity-60 line-through text-slate-500" 
                    : "bg-slate-950/80 border-slate-800/80 text-white hover:border-blue-500/50"
                  }
                `}
              >
                <button className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 hover:text-blue-400" />
                  )}
                </button>
                <span className="text-xs font-medium truncate flex-1">
                  {t.title}
                </span>
                {t.dueTime && (
                  <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">
                    {t.dueTime}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>{todayTasks.filter(t => t.status === TaskStatus.COMPLETED).length} de {todayTasks.length} concluídas</span>
        <button
          onClick={onExpandToFullApp}
          className="text-blue-400 hover:underline flex items-center gap-0.5 font-medium"
        >
          <span>Abrir Kyro Completo</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};
