/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useJarvis } from "../context/JarvisContext";
import {
  Inbox as InboxIcon,
  Sparkles
} from "lucide-react";
import { InboxQuickAdd } from "../components/InboxQuickAdd";
import { TaskCard } from "../components/TaskCard";
import { TaskStatus } from "../types";

export const Inbox: React.FC = () => {
  const { tasks, areas } = useJarvis();

  // Filter tasks in the inbox
  const inboxTasks = tasks.filter(t => 
    (t.status === TaskStatus.INBOX || !t.areaId) && 
    !t.isArchived
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Caixa de Entrada</h1>
        </div>
        <p className="text-sm text-slate-400 font-medium font-sans">Sua caixa de captura imediata. Escreva livremente com nossa inteligência artificial para registrar e classificar tarefas de forma automatizada.</p>
      </div>

      {/* INTELLIGENT CAPTURE WIDGET */}
      <InboxQuickAdd />

      {/* CAPTURED BACKLOG ITEMS */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <InboxIcon className="w-4 h-4 text-slate-500" />
          <span>PILARE DE CAPTURAS AGUARDANDO DESTAQUE ({inboxTasks.length})</span>
        </h3>

        <div className="space-y-2.5" id="inbox-tasks-container">
          {inboxTasks.length > 0 ? (
            inboxTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="py-14 bg-slate-900/10 border border-slate-850 rounded-2xl text-center text-slate-500 flex flex-col items-center justify-center gap-1.5">
              <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
              <span className="text-sm font-semibold text-slate-300">Caixa de entrada vazia!</span>
              <p className="text-xs text-slate-500 font-medium max-w-sm">Tudo capturado já foi devidamente catalogado e distribuído. Parabéns por manter o foco.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
