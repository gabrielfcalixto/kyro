/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  Calendar, 
  ArrowRight, 
  Inbox, 
  Clock, 
  CheckCircle2,
  CalendarDays
} from "lucide-react";
import { TaskCard } from "../components/TaskCard";
import { TaskStatus } from "../types";

export const Upcoming: React.FC = () => {
  const { tasks } = useJarvis();

  const todayStr = new Date().toISOString().split("T")[0];

  // Calculate tomorrow's date string
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const tomorrowStr = tom.toISOString().split("T")[0];

  // Calculate next 7 days barrier
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

  // Filters
  const activeTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED && !t.isArchived);

  const tomorrowTasks = activeTasks.filter(t => t.dueDate === tomorrowStr);
  const next7DaysTasks = activeTasks.filter(t => t.dueDate && t.dueDate > tomorrowStr && t.dueDate <= nextWeekStr);
  const futureTasks = activeTasks.filter(t => t.dueDate && t.dueDate > nextWeekStr);
  const noDueDateTasks = activeTasks.filter(t => !t.dueDate);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Cronograma de Próximos</h1>
        </div>
        <p className="text-sm text-slate-400 font-medium">Sua linha de tempo de afazeres organizados cronologicamente.</p>
      </div>

      {/* Grid columns of planning */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="upcoming-grid-container">
        
        {/* Column 1: Amanhã */}
        <div className="space-y-3 bg-slate-950/20 p-3.5 rounded-xl border border-slate-850/50">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Amanhã
            </span>
            <span className="text-[10px] font-mono text-slate-550 font-bold bg-slate-900 py-0.5 px-2 rounded-md">
              {tomorrowTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
            {tomorrowTasks.length > 0 ? (
              tomorrowTasks.map(t => <TaskCard key={t.id} task={t} />)
            ) : (
              <span className="text-xs text-slate-600 italic block py-4 text-center">Nenhum compromisso para amanhã</span>
            )}
          </div>
        </div>

        {/* Column 2: Próximos 7 Dias */}
        <div className="space-y-3 bg-slate-950/20 p-3.5 rounded-xl border border-slate-850/50">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Próximos 7 Dias
            </span>
            <span className="text-[10px] font-mono text-slate-550 font-bold bg-slate-900 py-0.5 px-2 rounded-md">
              {next7DaysTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
            {next7DaysTasks.length > 0 ? (
              next7DaysTasks.map(t => <TaskCard key={t.id} task={t} />)
            ) : (
              <span className="text-xs text-slate-600 italic block py-4 text-center">Agenda limpa para a semana</span>
            )}
          </div>
        </div>

        {/* Column 3: Planejadas para Depois */}
        <div className="space-y-3 bg-slate-950/20 p-3.5 rounded-xl border border-slate-850/50">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Planejadas para Depois
            </span>
            <span className="text-[10px] font-mono text-slate-550 font-bold bg-slate-900 py-0.5 px-2 rounded-md">
              {futureTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
            {futureTasks.length > 0 ? (
              futureTasks.map(t => <TaskCard key={t.id} task={t} />)
            ) : (
              <span className="text-xs text-slate-600 italic block py-4 text-center">Nenhum plano futuro longo</span>
            )}
          </div>
        </div>

        {/* Column 4: Sem Prazo / Inbox */}
        <div className="space-y-3 bg-slate-950/20 p-3.5 rounded-xl border border-slate-850/50">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5 text-cyan-400" />
              Sem prazo definido
            </span>
            <span className="text-[10px] font-mono text-slate-550 font-bold bg-slate-900 py-0.5 px-2 rounded-md">
              {noDueDateTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
            {noDueDateTasks.length > 0 ? (
              noDueDateTasks.map(t => <TaskCard key={t.id} task={t} />)
            ) : (
              <span className="text-xs text-slate-600 italic block py-4 text-center">Todas as tarefas têm prazos!</span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
