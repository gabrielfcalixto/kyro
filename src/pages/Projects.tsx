/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  Target, 
  Layers, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  Inbox,
  AlertTriangle
} from "lucide-react";
import { TaskCard } from "../components/TaskCard";
import { ProjectStatus, TaskStatus, TaskPriority } from "../types";

export const Projects: React.FC = () => {
  const { projects, createProject, tasks, areas, setSelectedTask } = useJarvis();

  // Create project form states
  const [showAddProject, setShowAddProject] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projAreaId, setProjAreaId] = useState("");

  const [activeProjectFilter, setActiveProjectFilter] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projAreaId) return;

    await createProject({
      name: projName.trim(),
      description: projDesc.trim() || undefined,
      areaId: projAreaId,
      status: ProjectStatus.ACTIVE,
      progress: 0,
      lastActivityAt: new Date().toISOString()
    });

    setProjName("");
    setProjDesc("");
    setShowAddProject(false);
    alert("Projeto operacional criado com sucesso!");
  };

  // Calculate stagnant status (no activity in 7 days)
  const isProjectStagnant = (lastAct: string) => {
    const lastDate = new Date(lastAct).getTime();
    const diffDays = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  };

  const selectedProj = projects.find(p => p.id === activeProjectFilter);
  const selectedProjTasks = activeProjectFilter 
    ? tasks.filter(t => t.projectId === activeProjectFilter && !t.isArchived)
    : [];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Projetos Operacionais</h1>
          </div>
          <p className="text-sm text-slate-400 font-medium">Cadastre, acompanhe o progresso e resolva gargalos de projetos ativos.</p>
        </div>
        <button
          onClick={() => setShowAddProject(!showAddProject)}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer"
          id="toggle-add-project-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* CREATE NEW PROJECT FORM */}
      {showAddProject && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl space-y-4 animate-fadeIn" id="add-project-form">
          <h3 className="text-sm font-bold text-slate-200">Criar Novo Projeto</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Nome do Projeto</label>
              <input
                type="text"
                required
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                placeholder="Ex: Refatoração do Histórico..."
                className="bg-slate-950/80 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 w-full transition-colors"
                id="project-name-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Área de Foco</label>
              <select
                required
                value={projAreaId}
                onChange={(e) => setProjAreaId(e.target.value)}
                className="bg-slate-950 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-300 w-full cursor-pointer"
                id="project-area-select"
              >
                <option value="">Selecione uma área...</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Descrição / Notas do Projeto</label>
            <textarea
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Adicione notas, links de documentação ou escopo resumido deste projeto..."
              className="bg-slate-950/80 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-650 w-full h-20 resize-none transition-colors"
              id="project-desc-textarea"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddProject(false)}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-lg text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              id="project-save-btn"
            >
              Salvar Projeto
            </button>
          </div>
        </form>
      )}

      {/* SPLIT SCREEN LAYOUT: LEFT PROJECTS LIST, RIGHT PROJECT DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROJECTS GRID LIST (2 Columns on large, 1 on small) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map(proj => {
            const area = areas.find(a => a.id === proj.areaId);
            const stagnant = isProjectStagnant(proj.lastActivityAt);
            const totalProjTasks = tasks.filter(t => t.projectId === proj.id && !t.isArchived);
            const completedProjTasks = totalProjTasks.filter(t => t.status === "Concluída");

            const isCurrent = activeProjectFilter === proj.id;

            return (
              <div
                key={proj.id}
                onClick={() => setActiveProjectFilter(isCurrent ? null : proj.id)}
                className={`
                  bg-slate-900 border p-4.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-44 shadow-sm relative group/proj-card
                  ${isCurrent 
                    ? "border-indigo-500 ring-1 ring-indigo-500/20 bg-slate-900" 
                    : "border-slate-800 hover:border-slate-700/80 hover:scale-[1.01]"
                  }
                `}
                id={`project-card-${proj.id}`}
              >
                {/* Title & Area badge */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    {area && (
                      <span className="text-[9px] font-bold font-mono py-0.5 px-2 bg-slate-950/45 text-slate-400 border border-slate-850 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: area.color }} />
                        <span>{area.name}</span>
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">{proj.status}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 group-hover/proj-card:text-indigo-400 transition-colors block leading-snug">
                    {proj.name}
                  </h3>
                  {proj.description && (
                    <p className="text-[11px] text-slate-500 font-medium truncate line-clamp-1">{proj.description}</p>
                  )}
                </div>

                {/* Progress bar info */}
                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">{completedProjTasks.length}/{totalProjTasks.length} tarefas concluídas</span>
                    <span className="font-bold text-indigo-400">{proj.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${proj.progress}%` }} />
                  </div>

                  {/* Stagnant Warning Alert */}
                  {stagnant && proj.status === ProjectStatus.ACTIVE && (
                    <div className="text-[9px] text-amber-500 font-mono bg-amber-500/10 border border-amber-500/20 rounded py-0.5 px-1.5 flex items-center gap-1">
                      <span>⚠️ Parado: Sem atividade há +7 dias</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT SIDEBAR: Selected Project Tasks Backlog */}
        <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl h-fit shadow-sm space-y-4">
          {selectedProj ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800/60 pb-3 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest block">Gargalo / Backlog</span>
                <h3 className="text-sm font-bold text-slate-200">{selectedProj.name}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{selectedProj.description || "Nenhuma descrição informada."}</p>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 scrollbar-thin" id="project-tasks-list">
                {selectedProjTasks.length > 0 ? (
                  selectedProjTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-2.5 bg-slate-950/45 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-semibold truncate text-slate-300 ${task.status === "Concluída" ? "line-through text-slate-500" : ""}`}>
                          {task.title}
                        </span>
                      </div>
                      {task.priority !== "none" && (
                        <span className="text-[9px] px-1 bg-slate-900 text-slate-500 rounded font-mono uppercase shrink-0">
                          {task.priority}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-550 italic block text-center py-4">Nenhuma tarefa ativa cadastrada para este projeto</span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2 font-mono text-xs">
              <Target className="w-7 h-7 text-slate-700 animate-pulse" />
              <span>Clique em um projeto para expandir suas tarefas e detalhamento</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
