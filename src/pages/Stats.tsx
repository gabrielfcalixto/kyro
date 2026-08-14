/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Layers,
  Sparkles,
  Award,
  History,
  Timer
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { TaskStatus } from "../types";

export const Stats: React.FC = () => {
  const { tasks, focusSessions, areas, projects } = useJarvis();

  // Calculate high level variables
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED && !t.isArchived);
  const totalTasks = tasks.filter(t => !t.isArchived);
  const completionRate = totalTasks.length > 0 ? Math.round((completedTasks.length / totalTasks.length) * 100) : 0;

  // Sum total logged focus minutes
  const totalFocusMinutes = focusSessions.reduce((acc, sess) => acc + sess.duration, 0);
  const focusHours = (totalFocusMinutes / 60).toFixed(1);

  // Generate completions by Area data for chart
  const areaCompletionsData = areas.map(a => {
    const total = tasks.filter(t => t.areaId === a.id && !t.isArchived).length;
    const completed = tasks.filter(t => t.areaId === a.id && t.status === TaskStatus.COMPLETED && !t.isArchived).length;
    return {
      name: a.name,
      Concluídas: completed,
      Total: total
    };
  });

  // Daily productivity trend data (past 5 days count)
  // Mocking dates since actual dates might be sparse in mocks
  const dailyTrendsData = [
    { date: "13/07", concluídas: 2 },
    { date: "14/07", concluídas: 4 },
    { date: "15/07", concluídas: 3 },
    { date: "16/07", concluídas: 5 },
    { date: "17/07", concluídas: completedTasks.length || 6 } // active today
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Estatísticas de Produtividade</h1>
        </div>
        <p className="text-sm text-slate-400 font-medium font-sans">Métricas consolidadas de tarefas entregues, foco mantido e consistência semanal.</p>
      </div>

      {/* Stats Bento Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="stats-overview-row">
        
        {/* Completion Rate circle card */}
        <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Taxa de Conclusão</span>
            <span className="text-2xl font-bold text-slate-100 font-mono">{completionRate}%</span>
            <span className="text-[10px] text-slate-550 block font-mono">conclusões / totais</span>
          </div>
          {/* Radial visual indicator */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="22" className="stroke-slate-950 stroke-[3px] fill-transparent" />
              <circle 
                cx="28" cy="28" r="22" 
                className="stroke-indigo-500 stroke-[3px] fill-transparent"
                strokeDasharray="138"
                strokeDashoffset={138 - (138 * completionRate) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-slate-300 font-mono">{completionRate}%</span>
          </div>
        </div>

        {/* Total completed */}
        <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Total Entregue</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono">{completedTasks.length}</span>
            <span className="text-[10px] text-slate-550 block font-mono">tarefas catalogadas</span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Focus Hours logged */}
        <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Foco Acumulado</span>
            <span className="text-2xl font-bold text-indigo-400 font-mono">{focusHours}h</span>
            <span className="text-[10px] text-slate-550 block font-mono">{totalFocusMinutes}m pomodoros</span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Level / Streak card */}
        <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Grau de Foco</span>
            <span className="text-xl font-bold text-amber-500 flex items-center gap-1 font-mono">
              <Award className="w-5 h-5 shrink-0" />
              <span>CÉREBRO ALTO</span>
            </span>
            <span className="text-[10px] text-slate-550 block font-mono"> consistência calibrada</span>
          </div>
        </div>

      </div>

      {/* Charts section: Bar Chart Area vs Line Chart trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BAR CHART: Completion metrics by Focus Area */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>ENTREGAS POR ÁREA DE FOCO</span>
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaCompletionsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontStyle="bold" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "10px" }}
                  labelStyle={{ fontWeight: "bold", color: "#f8fafc" }}
                />
                <Bar dataKey="Concluídas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LINE CHART: Daily Completion trend lines */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>VELOCIDADE DE ENTREGA DIÁRIA</span>
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "10px" }}
                  labelStyle={{ fontWeight: "bold", color: "#f8fafc" }}
                />
                <Line type="monotone" dataKey="concluídas" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Focus Stopwatch sessions logs list */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-500" />
          <span>HISTÓRICO DE CICLOS DE FOCO REALIZADOS</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 font-mono text-slate-500 uppercase border-b border-slate-850">
              <tr>
                <th className="p-3">Tarefa Associada</th>
                <th className="p-3">Duração</th>
                <th className="p-3">Data/Hora</th>
                <th className="p-3 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {focusSessions.length > 0 ? (
                focusSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-950/20">
                    <td className="p-3 font-semibold text-slate-200">{sess.taskTitle}</td>
                    <td className="p-3 font-mono">{sess.duration} minutos</td>
                    <td className="p-3 font-mono text-slate-500">{new Date(sess.startTime).toLocaleString("pt-BR")}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded font-bold ${sess.completed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500"}`}>
                        {sess.completed ? "Completado" : "Pausado"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                    Nenhum ciclo de foco Pomodoro registrado ainda nesta máquina.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
