/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  AlertTriangle, 
  Calendar, 
  Trash2, 
  Clock, 
  Sparkles,
  Inbox
} from "lucide-react";
import { Task } from "../types";

export const Overdue: React.FC = () => {
  const { tasks, updateTask, deleteTask, setSelectedTask } = useJarvis();

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter overdue tasks
  const overdueTasks = tasks.filter(t => 
    t.dueDate && 
    t.dueDate < todayStr && 
    t.status !== "Concluída" && 
    !t.isArchived
  );

  const handleReschedule = async (taskId: string, dateOption: "today" | "tomorrow" | "next-week" | "remove") => {
    let finalDate: string | undefined = undefined;
    
    if (dateOption === "today") {
      finalDate = todayStr;
    } else if (dateOption === "tomorrow") {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      finalDate = tom.toISOString().split("T")[0];
    } else if (dateOption === "next-week") {
      const nextWk = new Date();
      nextWk.setDate(nextWk.getDate() + 7);
      finalDate = nextWk.toISOString().split("T")[0];
    }

    await updateTask(taskId, { dueDate: finalDate });
  };

  const handleDelete = async (taskId: string) => {
    if (confirm("Deseja realmente deletar esta tarefa atrasada?")) {
      await deleteTask(taskId);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Tarefas Atrasadas</h1>
        </div>
        <p className="text-sm text-slate-400 font-medium">Itens pendentes que ultrapassaram o prazo planejado. Ajuste-os para manter o fluxo organizado.</p>
      </div>

      {/* Main Backlog List with Action Triggers */}
      <div className="space-y-3" id="overdue-list-container">
        {overdueTasks.length > 0 ? (
          overdueTasks.map(task => {
            const formattedDate = task.dueDate ? task.dueDate.split("-").reverse().join("/") : "";
            
            return (
              <div 
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-4 rounded-xl cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                {/* Title & Date Warning info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg shrink-0 mt-0.5 animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <span className="text-sm font-bold text-slate-100 block truncate leading-tight">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-rose-400 font-semibold">Vencido em: {formattedDate}</span>
                      {task.description && (
                        <>
                          <span className="text-slate-700">|</span>
                          <span className="text-slate-500 truncate max-w-sm">{task.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reschedule Shortcuts buttons bar */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleReschedule(task.id, "today")}
                    className="py-1.5 px-3 bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-lg font-semibold transition-all shadow-sm"
                    title="Mover para hoje"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => handleReschedule(task.id, "tomorrow")}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white rounded-lg font-medium transition-all"
                    title="Mover para amanhã"
                  >
                    Amanhã
                  </button>
                  <button
                    onClick={() => handleReschedule(task.id, "next-week")}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white rounded-lg font-medium transition-all"
                    title="Mover para daqui a 7 dias"
                  >
                    +7 Dias
                  </button>
                  <button
                    onClick={() => handleReschedule(task.id, "remove")}
                    className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-slate-400 hover:text-slate-200 rounded-lg"
                    title="Remover prazo e arquivar na Caixa de Entrada"
                  >
                    Sem data
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 bg-rose-950/20 hover:bg-rose-900/40 border border-rose-500/25 text-rose-400 hover:text-rose-300 rounded-lg"
                    title="Excluir permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 bg-slate-900/20 border border-slate-850 rounded-2xl text-center text-slate-500 flex flex-col items-center justify-center gap-1.5">
            <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-300">Nenhum atraso detectado!</span>
            <span className="text-xs text-slate-550 max-w-sm font-medium">Sua produtividade está 100% calibrada. Todas as tarefas estão em dia.</span>
          </div>
        )}
      </div>

    </div>
  );
};
