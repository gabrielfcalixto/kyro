/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  Sun, 
  Moon, 
  Coffee, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Clock, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Inbox,
  Play,
  Grid
} from "lucide-react";
import { TaskCard } from "../components/TaskCard";
import { VoiceTaskRecorder } from "../components/VoiceTaskRecorder";
import { TaskStatus, TaskPriority, ProjectStatus } from "../types";

export const Dashboard: React.FC = () => {
  const { 
    tasks, 
    projects, 
    areas, 
    setActiveScreen, 
    setFocusTask, 
    setSelectedTask,
    settings 
  } = useJarvis();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return { text: `Bom dia, ${settings.name}.`, icon: <Coffee className="w-5 h-5 text-orange-400" /> };
    if (hr < 18) return { text: `Boa tarde, ${settings.name}.`, icon: <Sun className="w-5 h-5 text-blue-400" /> };
    return { text: `Boa noite, ${settings.name}.`, icon: <Moon className="w-5 h-5 text-indigo-400" /> };
  };

  const greeting = getGreeting();

  const todayStr = new Date().toISOString().split("T")[0];

  const todayTasks = tasks.filter(t => t.dueDate === todayStr && !t.isArchived);
  const todayPending = todayTasks.filter(t => t.status !== TaskStatus.COMPLETED);

  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== TaskStatus.COMPLETED && !t.isArchived);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const completedThisWeek = tasks.filter(t => 
    t.status === TaskStatus.COMPLETED && 
    t.completedAt && 
    new Date(t.completedAt) >= oneWeekAgo && 
    !t.isArchived
  );

  const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE);
  const noDueDateTasks = tasks.filter(t => !t.dueDate && t.status !== TaskStatus.COMPLETED && !t.isArchived);

  const topFocusTasks = tasks
    .filter(t => t.status !== TaskStatus.COMPLETED && !t.isArchived)
    .sort((a, b) => {
      const aPri = a.priority === TaskPriority.URGENT ? 4 : a.priority === TaskPriority.HIGH ? 3 : a.priority === TaskPriority.MEDIUM ? 2 : 1;
      const bPri = b.priority === TaskPriority.URGENT ? 4 : b.priority === TaskPriority.HIGH ? 3 : b.priority === TaskPriority.MEDIUM ? 2 : 1;
      if (aPri !== bPri) return bPri - aPri;
      if (a.dueDate === todayStr && b.dueDate !== todayStr) return -1;
      if (b.dueDate === todayStr && a.dueDate !== todayStr) return 1;
      return 0;
    })
    .slice(0, 3);

  const upcomingTasks = tasks
    .filter(t => t.status !== TaskStatus.COMPLETED && t.dueDate && t.dueDate >= todayStr && !t.isArchived)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .slice(0, 4);

  const stagnantProjects = projects.filter(p => {
    const lastAct = new Date(p.lastActivityAt).getTime();
    const diffDays = (Date.now() - lastAct) / (1000 * 60 * 60 * 24);
    return diffDays >= 7 && p.status === ProjectStatus.ACTIVE;
  });

  const recentActivities = [...tasks]
    .filter(t => !t.isArchived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);

  return (
    <div className="space-y-8 font-sans">
      
      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">{greeting.text}</h1>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            {todayPending.length > 0 ? (
              <>Você tem <span className="text-white font-medium">{todayPending.length} tarefas pendentes</span> para hoje.</>
            ) : (
              "Sua agenda está livre para hoje."
            )}
            {overdueTasks.length > 0 && (
              <> E <span className="text-red-400 font-medium">{overdueTasks.length} tarefas atrasadas</span>.</>
            )}
          </p>
        </div>
        <button
          onClick={() => setActiveScreen("today")}
          className="self-start sm:self-center py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <span>Focar no Dia</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <VoiceTaskRecorder />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div onClick={() => setActiveScreen("today")} className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Hoje</span>
            <Sun className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{todayTasks.length}</div>
          <div className="text-xs text-slate-500 mt-1">{todayPending.length} pendentes</div>
        </div>

        <div onClick={() => setActiveScreen("overdue")} className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Atrasados</span>
            <AlertTriangle className={`w-4 h-4 ${overdueTasks.length > 0 ? 'text-red-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-semibold ${overdueTasks.length > 0 ? 'text-red-400' : 'text-white'}`}>{overdueTasks.length}</div>
          <div className="text-xs text-slate-500 mt-1">reagendar urgente</div>
        </div>

        <div onClick={() => setActiveScreen("stats")} className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Na Semana</span>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{completedThisWeek.length}</div>
          <div className="text-xs text-slate-500 mt-1">concluídas</div>
        </div>

        <div onClick={() => setActiveScreen("projects")} className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Projetos</span>
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{activeProjects.length}</div>
          <div className="text-xs text-slate-500 mt-1">{projects.length} totais</div>
        </div>

        <div onClick={() => setActiveScreen("inbox")} className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Sem Prazo</span>
            <Inbox className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{noDueDateTasks.length}</div>
          <div className="text-xs text-slate-500 mt-1">na inbox</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Prioridades Máximas</h3>
              <button 
                onClick={() => setActiveScreen("today")} 
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Ver tudo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topFocusTasks.length > 0 ? (
                topFocusTasks.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTask(t)}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: areas.find(a=>a.id===t.areaId)?.color || "#0a84ff" }} />
                        <span className="text-xs font-medium text-slate-500">
                          {t.priority}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-200 line-clamp-2">
                        {t.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                         e.stopPropagation();
                         setFocusTask(t);
                      }}
                      className="mt-4 w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Focar
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-8 bg-slate-900/50 border border-slate-800 border-dashed rounded-xl text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6 text-slate-400" />
                  <span className="text-sm font-medium">Nenhuma prioridade urgente hoje!</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Cronograma Próximo</h3>
              <button 
                onClick={() => setActiveScreen("upcoming")}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <div className="py-8 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-500">
                  <span className="text-sm">Nenhuma tarefa planejada para os próximos dias</span>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-400">Projetos em Andamento</h3>

            <div className="space-y-5">
              {projects.filter(p=>p.status === ProjectStatus.ACTIVE).slice(0, 3).map(proj => {
                const area = areas.find(a => a.id === proj.areaId);
                const isStagnant = stagnantProjects.some(sp => sp.id === proj.id);
                
                return (
                  <div key={proj.id} className="space-y-2 cursor-pointer group" onClick={() => setActiveScreen("projects")}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{proj.name}</span>
                        {area && (
                          <span className="text-xs text-slate-500 block">{area.name}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-blue-400">{proj.progress}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>

                    {isStagnant && (
                      <div className="text-xs text-orange-400 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Sem atividade há 7+ dias</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-400">Atividade Recente</h3>

            <div className="space-y-4">
              {recentActivities.map((act) => {
                const area = areas.find(a=>a.id===act.areaId);
                const isCompleted = act.status === TaskStatus.COMPLETED;
                
                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border ${isCompleted ? 'bg-green-500/20 border-green-500/30' : 'border-slate-700'} flex items-center justify-center shrink-0`}>
                      {isCompleted && <CheckCircle className="w-3 h-3 text-green-400" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-200 hover:text-white cursor-pointer transition-colors block leading-tight" onClick={() => setSelectedTask(act)}>
                        {act.title}
                      </span>
                      <div className="text-xs text-slate-500 mt-1">
                        {area?.name && <span className="mr-2" style={{ color: area.color }}>{area.name}</span>}
                        <span>Recentemente</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
