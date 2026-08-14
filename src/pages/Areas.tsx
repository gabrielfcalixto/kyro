/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  Layers, 
  Plus, 
  Target, 
  CheckSquare, 
  Compass, 
  Sparkles,
  Info
} from "lucide-react";
import { Area } from "../types";

export const Areas: React.FC = () => {
  const { areas, createArea, updateArea, tasks, projects } = useJarvis();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");

  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createArea({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon: "layers"
    });

    setName("");
    setDescription("");
    setShowAdd(false);
    alert("Nova Área de Foco adicionada ao Kyro!");
  };

  const handleSaveEdit = async (areaId: string) => {
    await updateArea(areaId, { description: editDescription });
    setEditingAreaId(null);
  };

  const colorsPreset = [
    "#6366f1", // Indigo
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#ec4899", // Pink
    "#8b5cf6"  // Purple
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Áreas de Foco</h1>
          </div>
          <p className="text-sm text-slate-400 font-medium">Os grandes pilares da sua vida profissional e pessoal. Cada área categoriza seus projetos e rotinas.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer"
          id="toggle-add-area-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Área</span>
        </button>
      </div>

      {/* QUICK ADD AREA FORM */}
      {showAdd && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl space-y-4 animate-fadeIn" id="add-area-form">
          <h3 className="text-sm font-bold text-slate-200">Criar Nova Área de Foco</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Nome do Pilar</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Saúde, Finanças, Empreendimento..."
                className="bg-slate-950/80 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 w-full transition-colors"
                id="area-name-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Cor Visual</label>
              <div className="flex items-center gap-2">
                {colorsPreset.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border transition-all ${color === c ? "border-white scale-110 shadow-md" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Notas e Objetivos da Área</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o escopo desta área de foco..."
              className="bg-slate-950/80 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-650 w-full h-16 resize-none transition-colors"
              id="area-desc-textarea"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-lg text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              id="area-save-btn"
            >
              Criar Área
            </button>
          </div>
        </form>
      )}

      {/* AREAS BENTO CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="areas-grid-container">
        {areas.map(area => {
          // Dynamic calculation of stats
          const areaTasks = tasks.filter(t => t.areaId === area.id && !t.isArchived);
          const activeAreaTasks = areaTasks.filter(t => t.status !== "Concluída");
          const areaProjects = projects.filter(p => p.areaId === area.id && p.status !== "Arquivado");

          const isEditing = editingAreaId === area.id;

          return (
            <div
              key={area.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-56 shadow-sm group/area relative overflow-hidden"
              id={`area-card-${area.id}`}
            >
              {/* Left accent color band */}
              <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ backgroundColor: area.color }} />

              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>{area.name}</span>
                  </h3>
                  
                  {/* Inline Stats */}
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 uppercase font-bold">
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      <span>{areaProjects.length} Proj</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{activeAreaTasks.length} Ativas</span>
                    </span>
                  </div>
                </div>

                {/* Inline Editing or description display */}
                {isEditing ? (
                  <div className="space-y-2 pl-1" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full h-20 bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => setEditingAreaId(null)}
                        className="py-1 px-2.5 bg-slate-800 text-slate-400 rounded text-[10px]"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleSaveEdit(area.id)}
                        className="py-1 px-2.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p 
                    onClick={() => {
                      setEditingAreaId(area.id);
                      setEditDescription(area.description || "");
                    }}
                    className="text-xs text-slate-500 leading-relaxed font-medium pl-1 line-clamp-3 hover:text-slate-300 transition-colors cursor-pointer"
                    title="Clique para editar as anotações desta área"
                  >
                    {area.description || "Nenhuma anotação cadastrada para esta área de foco. Clique para adicionar..."}
                  </p>
                )}
              </div>

              {/* Progress fraction bottom indicator */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-550 font-mono pl-1 mt-auto">
                <Compass className="w-3.5 h-3.5" />
                <span>{areaTasks.filter(t=>t.status === "Concluída").length} tarefas concluídas no histórico</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
