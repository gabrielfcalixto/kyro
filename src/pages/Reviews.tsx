/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  ListChecks, 
  Sparkles, 
  Plus, 
  Calendar, 
  CheckCircle,
  AlertTriangle,
  ClipboardList
} from "lucide-react";
import { WeeklyReviewModal } from "../components/WeeklyReviewModal";

export const Reviews: React.FC = () => {
  const { weeklyReviews } = useJarvis();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Planejamento Semanal</h1>
          </div>
          <p className="text-sm text-slate-400 font-medium">Avalie seus resultados passados e ordene suas prioridades inabaláveis para os próximos dias.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer"
          id="start-weekly-review-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Iniciar Alinhamento</span>
        </button>
      </div>

      {/* REVIEWS ARCHIVE CARDS GRID */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-slate-500" />
          <span>RELATÓRIOS E ALINHAMENTOS RECENTES</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="reviews-grid-container">
          {weeklyReviews.length > 0 ? (
            weeklyReviews.map(rev => (
              <div 
                key={rev.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-48 shadow-sm relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-indigo-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Alinhamento {rev.weekStartDate.split("-").reverse().join("/")}</span>
                    </span>
                    <span className="text-slate-500 font-bold">COMPILADO</span>
                  </div>

                  {/* Highlights notes preview */}
                  <div className="space-y-1 pt-1.5">
                    <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Prioridades da Semana</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 font-medium space-y-1">
                      {rev.priorities.map((pri, i) => (
                        <li key={i} className="truncate">{pri}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Micro stats indicators footer */}
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 border-t border-slate-850 pt-2.5 mt-auto">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{rev.completedTasksCount} Concluídas</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>{rev.delayedTasksCount} Atrasadas</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-16 bg-slate-900/10 border border-slate-850 rounded-2xl text-center text-slate-500 flex flex-col items-center justify-center gap-1.5">
              <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
              <span className="text-sm font-semibold text-slate-300">Nenhum planejamento semanal gravado</span>
              <p className="text-xs text-slate-500 max-w-sm">Você ainda não concluiu seu rito semanal. Clique em &quot;Iniciar Alinhamento&quot; acima para calibrar seu foco operacional agora.</p>
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY RETROSPECTIVE MODAL */}
      {showModal && (
        <WeeklyReviewModal onClose={() => setShowModal(false)} />
      )}

    </div>
  );
};
