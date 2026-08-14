/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle, 
  Sparkles,
  Inbox
} from "lucide-react";
import { TaskStatus, TaskPriority } from "../types";

export const CalendarView: React.FC = () => {
  const { tasks, createTask, setSelectedTask, areas } = useJarvis();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed

  const monthsList = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Helper to generate calendar structure for the month
  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: Array<{ dateStr: string | null; dayNum: number | null }> = [];
    
    // Add empty slots for padding
    for (let i = 0; i < firstDay; i++) {
      days.push({ dateStr: null, dayNum: null });
    }
    
    // Add real days
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = (month + 1).toString().padStart(2, "0");
      const dayStr = day.toString().padStart(2, "0");
      const fullDateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({ dateStr: fullDateStr, dayNum: day });
    }
    
    return days;
  };

  const calendarDays = getDaysInMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(now.toISOString().split("T")[0]);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");

  const activeDayTasks = tasks.filter(t => 
    t.dueDate === selectedDate && 
    !t.isArchived
  );

  const handleAddQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !selectedDate) return;

    await createTask({
      title: quickTaskTitle.trim(),
      status: TaskStatus.PENDING,
      priority: TaskPriority.NONE,
      dueDate: selectedDate,
      areaId: areas[0]?.id || "area-4",
      subtasks: [],
      tags: [],
      source: "calendar-view"
    });

    setQuickTaskTitle("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* LEFT & CENTER PANEL: Calendar Grid (Spans 2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Calendar Nav header */}
        <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100 font-sans tracking-wide">
              {monthsList[currentMonth]} {currentYear}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-inner">
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-slate-500 mb-2">
            {daysOfWeek.map(d => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const isSelected = day.dateStr === selectedDate;
              const hasTasks = day.dateStr ? tasks.some(t => t.dueDate === day.dateStr && t.status !== "Concluída" && !t.isArchived) : false;
              const completedTasks = day.dateStr ? tasks.filter(t => t.dueDate === day.dateStr && t.status === "Concluída" && !t.isArchived) : [];
              const pendingTasks = day.dateStr ? tasks.filter(t => t.dueDate === day.dateStr && t.status !== "Concluída" && !t.isArchived) : [];

              return (
                <div
                  key={idx}
                  onClick={() => day.dateStr && setSelectedDate(day.dateStr)}
                  className={`
                    min-h-16 p-1.5 border rounded-lg flex flex-col justify-between transition-all select-none
                    ${day.dayNum ? "cursor-pointer" : "bg-transparent border-transparent pointer-events-none"}
                    ${isSelected 
                      ? "bg-indigo-600/10 border-indigo-500 shadow-inner" 
                      : "bg-slate-950/20 border-slate-850 hover:bg-slate-900/40"
                    }
                  `}
                >
                  <span className={`text-[10px] font-bold font-mono ${isSelected ? "text-indigo-400" : "text-slate-400"}`}>
                    {day.dayNum}
                  </span>

                  {/* Bullet badges */}
                  {day.dateStr && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pendingTasks.slice(0, 3).map((pt, i) => {
                        const area = areas.find(a=>a.id===pt.areaId);
                        return (
                          <div 
                            key={i} 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ backgroundColor: area?.color || "#3b82f6" }}
                            title={pt.title}
                          />
                        );
                      })}
                      {completedTasks.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Item concluído" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT SIDEBAR: Day Agenda & Quick Add task */}
      <div className="space-y-4.5 bg-slate-900 border border-slate-800 p-4.5 rounded-xl shadow-sm h-fit">
        <div className="space-y-1 pb-3 border-b border-slate-800/60">
          <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest block uppercase">Agenda Selecionada</span>
          <h3 className="text-sm font-bold text-slate-200 font-sans flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>{selectedDate ? selectedDate.split("-").reverse().join("/") : "Escolha um dia..."}</span>
          </h3>
        </div>

        {/* Day's Tasks agenda list */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
          {activeDayTasks.length > 0 ? (
            activeDayTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="p-2.5 bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: areas.find(a=>a.id===task.areaId)?.color }} />
                  <span className={`font-semibold truncate text-slate-300 ${task.status === "Concluída" ? "line-through text-slate-600" : ""}`}>
                    {task.title}
                  </span>
                </div>
                {task.priority !== "none" && (
                  <span className="text-[9px] px-1 bg-slate-900 text-slate-500 rounded font-mono shrink-0 uppercase ml-1">
                    {task.priority}
                  </span>
                )}
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic block py-4 text-center">Nenhum compromisso agendado para este dia</span>
          )}
        </div>

        {/* Quick Add with Predefined Date */}
        {selectedDate && (
          <form onSubmit={handleAddQuickTask} className="border-t border-slate-800/60 pt-4.5 space-y-2.5">
            <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">Planejar neste dia:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Ex: Entrega do mockup..."
                className="bg-slate-950/80 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-650 flex-1 transition-colors"
                id="calendar-quick-title-input"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
};
