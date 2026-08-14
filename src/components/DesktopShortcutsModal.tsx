/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Keyboard, Command, Monitor, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DesktopShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopShortcutsModal: React.FC<DesktopShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: "Navegação Desktop",
      shortcuts: [
        { keys: ["Ctrl", "K"], description: "Buscar & Paleta de Comandos" },
        { keys: ["Ctrl", "D"], description: "Ir para 'Meu Dia' (Hoje)" },
        { keys: ["Ctrl", "I"], description: "Ir para Caixa de Entrada (Inbox)" },
        { keys: ["Ctrl", "P"], description: "Ir para Projetos" },
        { keys: ["Ctrl", "A"], description: "Ir para Anotações & Áudios" },
      ]
    },
    {
      title: "Produtividade & Foco",
      shortcuts: [
        { keys: ["Ctrl", "N"], description: "Nova Tarefa Rápida (Smart Input)" },
        { keys: ["Ctrl", "Shift", "M"], description: "Alternar Modo Mini Widget Flutuante" },
        { keys: ["Ctrl", "Shift", "F"], description: "Iniciar Temporizador de Foco" },
        { keys: ["Ctrl", "/"], description: "Abrir esta Guia de Atalhos" },
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-hidden space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Atalhos de Teclado Desktop</h3>
                <p className="text-xs text-slate-400">Navegue como no Microsoft To Do e apps nativos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shortcut lists */}
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
            {shortcutGroups.map((group, idx) => (
              <div key={idx} className="space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  {group.title}
                </h4>
                <div className="space-y-1.5">
                  {group.shortcuts.map((sc, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                    >
                      <span className="text-slate-300 font-medium">{sc.description}</span>
                      <div className="flex items-center gap-1">
                        {sc.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[11px] shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/30 text-xs text-blue-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">Esc</kbd> em qualquer tela para fechar modais ou o widget.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
