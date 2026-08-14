/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  HelpCircle, 
  Calendar, 
  CheckCircle,
  AlertTriangle,
  FolderDot,
  TrendingUp,
  Bookmark
} from "lucide-react";
import { WeeklyReview } from "../types";

export const WeeklyReviewModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { 
    tasks, 
    projects, 
    submitWeeklyReview 
  } = useJarvis();

  const [step, setStep] = useState(1);

  // Auto calculate current statistics for review
  const todayStr = new Date().toISOString().split("T")[0];

  // Tasks completed this week (since 7 days ago)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const completedThisWeek = tasks.filter(t => 
    t.status === "Concluída" && 
    t.completedAt && 
    new Date(t.completedAt) >= oneWeekAgo && 
    !t.isArchived
  );

  const delayedTasks = tasks.filter(t => 
    t.dueDate && 
    t.dueDate < todayStr && 
    t.status !== "Concluída" && 
    !t.isArchived
  );

  const cancelledTasks = tasks.filter(t => 
    t.status === "Cancelada" && 
    !t.isArchived
  );

  // Stagnant projects (no action for >= 7 days)
  const stagnantProjects = projects.filter(p => {
    const lastAct = new Date(p.lastActivityAt).getTime();
    const diffDays = (Date.now() - lastAct) / (1000 * 60 * 60 * 24);
    return diffDays >= 7 && p.status === "Ativo";
  });

  const orphanTasks = tasks.filter(t => !t.projectId && t.status !== "Concluída" && !t.isArchived);

  // Questionnaire answers state
  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
    q6: "",
    q7: ""
  });

  // Top 3 priorities for next week
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");

  const handleNext = () => {
    if (step < 9) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    const reviewData: Partial<WeeklyReview> = {
      weekStartDate: todayStr,
      completedTasksCount: completedThisWeek.length,
      delayedTasksCount: delayedTasks.length,
      cancelledTasksCount: cancelledTasks.length,
      stagnantProjectsCount: stagnantProjects.length,
      priorities: [p1, p2, p3].filter(p => p !== ""),
      notesAnswers: answers,
    };

    await submitWeeklyReview(reviewData);
    alert("Revisão semanal compilada e salva com sucesso! Seu cérebro Kyro agradece.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Main wizard modal */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn" id="weekly-review-modal">
        {/* Top brand line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Modal Header */}
        <div className="p-4 bg-slate-950/30 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">KYRO WEEKLY RETROSPECTIVE</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            id="review-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard step contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* STEP 1: Introduction and auto indicators */}
          {step === 1 && (
            <div className="space-y-4.5 text-center sm:text-left">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto sm:mx-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">Rito de Alinhamento Semanal</h2>
                <p className="text-sm text-slate-400 font-medium">
                  Pare, respire e avalie seus resultados operacionais. O objetivo é ajustar prioridades e manter o foco nos projetos ativos sem sobrecarregar sua agenda.
                </p>
              </div>

              {/* Automatic Stats block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/60 text-center">
                  <span className="text-2xl font-bold text-emerald-400 font-mono">{completedThisWeek.length}</span>
                  <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider mt-1">Concluídas</span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/60 text-center">
                  <span className="text-2xl font-bold text-rose-400 font-mono">{delayedTasks.length}</span>
                  <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider mt-1">Atrasadas</span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/60 text-center">
                  <span className="text-2xl font-bold text-amber-500 font-mono">{stagnantProjects.length}</span>
                  <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider mt-1">Projetos parados</span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/60 text-center">
                  <span className="text-2xl font-bold text-cyan-400 font-mono">{orphanTasks.length}</span>
                  <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider mt-1">Sem projeto</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2-8: Question details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                <span className="text-xs font-bold font-mono tracking-wider uppercase">Retrospectiva</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">1. O que foi concluído nesta semana?</h4>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">Reconheça suas conquistas. Abaixo estão suas tarefas concluídas. Comente os principais marcos ou entregas realizadas.</p>
              
              {/* Completed tasks list */}
              <div className="bg-slate-950/35 border border-slate-850 p-2.5 rounded-lg max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                {completedThisWeek.length > 0 ? (
                  completedThisWeek.map(t => (
                    <div key={t.id} className="text-xs text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic block py-2 text-center">Nenhuma tarefa marcada como concluída esta semana</span>
                )}
              </div>
              <textarea
                value={answers.q1}
                onChange={(e) => setAnswers({ ...answers, q1: e.target.value })}
                placeholder="Ex: Finalizei a autenticação do Louvart Mobile e entreguei as correções de listagem do TechSelos..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none font-medium"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                <span className="text-xs font-bold font-mono tracking-wider uppercase">Desvios e Atrasos</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">2. O que ficou atrasado e por quê?</h4>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">Identifique gargalos. O que impediu o cumprimento destas tarefas? É necessário redistribuir esforços?</p>
              
              {/* Overdue list */}
              <div className="bg-slate-950/35 border border-slate-850 p-2.5 rounded-lg max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                {delayedTasks.length > 0 ? (
                  delayedTasks.map(t => (
                    <div key={t.id} className="text-xs text-slate-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic block py-2 text-center">Nenhuma tarefa atrasada! Excelente gestão.</span>
                )}
              </div>
              <textarea
                value={answers.q2}
                onChange={(e) => setAnswers({ ...answers, q2: e.target.value })}
                placeholder="Ex: O bug de histórico demorou mais que o esperado devido a problemas no banco..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none font-medium"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <X className="w-4.5 h-4.5 shrink-0" />
                <span className="text-xs font-bold font-mono tracking-wider uppercase">Filtro de Ruído</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">3. Quais tarefas devem ser canceladas?</h4>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">Ter coragem de descartar. Alguma tarefa perdeu o sentido ou pode ser arquivada para reduzir o ruído mental?</p>
              <textarea
                value={answers.q3}
                onChange={(e) => setAnswers({ ...answers, q3: e.target.value })}
                placeholder="Ex: Cancelei a revisão de modais de Louvart Web, pois vamos reescrever as telas no próximo mês..."
                className="w-full h-28 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none font-medium"
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <FolderDot className="w-4.5 h-4.5 shrink-0" />
                <span className="text-xs font-bold font-mono tracking-wider uppercase">Projetos Ativos</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">4. Quais projetos estão parados?</h4>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">Projetos parados há mais de 7 dias precisam de atenção. Como movimentá-los ou reavaliar o status deles?</p>
              
              <div className="bg-slate-950/35 border border-slate-850 p-2.5 rounded-lg max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                {stagnantProjects.length > 0 ? (
                  stagnantProjects.map(p => (
                    <div key={p.id} className="text-xs text-amber-400 flex items-center justify-between">
                      <span className="truncate">⚠️ {p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Sem ação há +7 dias</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic block py-2 text-center">Todos os projetos ativos registraram atividade recente!</span>
                )}
              </div>
              <textarea
                value={answers.q4}
                onChange={(e) => setAnswers({ ...answers, q4: e.target.value })}
                placeholder="Ex: Preciso retomar o projeto de mudança de casa e cadastrar tarefas para pesquisar apartamentos..."
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none font-medium"
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Bookmark className="w-4.5 h-4.5 shrink-0" />
                <span className="text-xs font-bold font-mono tracking-wider uppercase">Organização Básica</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">5. Existe alguma tarefa sem área ou projeto?</h4>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">Não deixe pontas soltas. Tarefas soltas na Caixa de Entrada devem ser devidamente catalogadas nas suas respectivas áreas ou projetos.</p>
              
              <div className="bg-slate-950/35 border border-slate-850 p-2.5 rounded-lg max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                {orphanTasks.length > 0 ? (
                  <span className="text-xs text-cyan-400 block py-1 font-semibold">⚠️ Existem {orphanTasks.length} tarefas pendentes fora de projetos.</span>
                ) : (
                  <span className="text-xs text-slate-500 italic block py-2 text-center">Excelente! Todas as tarefas estão devidamente associadas.</span>
                )}
              </div>
              <textarea
                value={answers.q6}
                onChange={(e) => setAnswers({ ...answers, q6: e.target.value })}
                placeholder="Ex: Vou categorizar as tarefas de leitura e estudos pendentes..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none font-medium"
              />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-4.5 h-4.5 shrink-0" />
                <span className="text-xs font-bold font-mono tracking-wider uppercase">Estratégias de Futuro</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">6. Alguma tarefa pode ser delegada ou automatizada?</h4>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">Melhore a eficiência de execução. O que você está fazendo que pode ser automatizado por scripts ou terceirizado?</p>
              <textarea
                value={answers.q7}
                onChange={(e) => setAnswers({ ...answers, q7: e.target.value })}
                placeholder="Ex: Posso criar um script bash para automatizar a geração de relatórios do TechSelos..."
                className="w-full h-28 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none font-medium"
              />
            </div>
          )}

          {/* STEP 8: Choosing the Top 3 next week priorities */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-pink-400">
                <Sparkles className="w-4.5 h-4.5 shrink-0" />
                <span className="text-xs font-bold font-mono tracking-wider uppercase">Foco Estratégico</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">7. Quais serão as três prioridades da próxima semana?</h4>
              <p className="text-xs text-slate-550 leading-relaxed font-medium">Assegure direcionamento correto. Escolha até 3 grandes focos inabaláveis. O resto deve se adaptar a estes pilares.</p>
              
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-mono text-indigo-400">#1</span>
                  <input
                    type="text"
                    value={p1}
                    onChange={(e) => setP1(e.target.value)}
                    placeholder="Prioridade Máxima (Ex: Finalizar melhorias de clientes no TechSelos)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-mono text-indigo-400">#2</span>
                  <input
                    type="text"
                    value={p2}
                    onChange={(e) => setP2(e.target.value)}
                    placeholder="Foco Secundário (Ex: Resolver 30 questões Java da OCA)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-mono text-indigo-400">#3</span>
                  <input
                    type="text"
                    value={p3}
                    onChange={(e) => setP3(e.target.value)}
                    placeholder="Foco de Apoio (Ex: Comprar cordas e ensaiar para domingo)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Summary final confirm */}
          {step === 9 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                <span className="text-xs font-bold font-mono tracking-wider uppercase">Alinhamento Compilado</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">Pronto para catalogar sua revisão semanal?</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">Os dados serão agregados ao histórico e servirão para calibrar o Kyro Assistant no planejamento diário de suas tarefas.</p>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3 font-mono text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Data do Alinhamento:</span>
                  <span className="font-bold text-slate-200">{todayStr}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entregas Concluídas:</span>
                  <span className="font-bold text-emerald-400">{completedThisWeek.length} tarefas</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarefas Reagendadas / Atrasadas:</span>
                  <span className="font-bold text-rose-400">{delayedTasks.length} tarefas</span>
                </div>
                <div className="border-t border-slate-800/80 my-2 pt-2">
                  <span className="text-[10px] block text-slate-500 font-bold uppercase mb-1 font-sans">Prioridades definidas:</span>
                  <ol className="list-decimal list-inside pl-1 text-slate-300 font-sans space-y-1">
                    {p1 && <li>{p1}</li>}
                    {p2 && <li>{p2}</li>}
                    {p3 && <li>{p3}</li>}
                  </ol>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-950/45 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">Passo {step} de 9</span>
          
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}

            {step < 9 ? (
              <button
                onClick={handleNext}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-md shadow-indigo-600/10"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="py-1.5 px-4.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-md shadow-emerald-600/15"
                id="review-finalize-btn"
              >
                <span>Finalizar Alinhamento</span>
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
