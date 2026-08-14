/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  Search, 
  Terminal, 
  Zap, 
  CheckSquare, 
  Sun, 
  Settings, 
  Folder, 
  Layers, 
  StickyNote,
  Play, 
  Sparkles,
  Calendar,
  Eye,
  CheckCircle,
  TrendingUp,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TaskStatus } from "../types";

export const CommandPalette: React.FC = () => {
  const { 
    tasks, 
    projects, 
    areas, 
    setActiveScreen, 
    updateTask, 
    setFocusTask 
  } = useJarvis();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Toggle command palette on Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Command and navigation list
  const navigationCommands = [
    { label: "Ir para Visão Geral", action: () => setActiveScreen("overview"), category: "Navegação", icon: Sun },
    { label: "Ir para Hoje", action: () => setActiveScreen("today"), category: "Navegação", icon: Sun },
    { label: "Ir para Caixa de Entrada", action: () => setActiveScreen("inbox"), category: "Navegação", icon: Terminal },
    { label: "Ir para Próximos", action: () => setActiveScreen("upcoming"), category: "Navegação", icon: Calendar },
    { label: "Ir para Projetos", action: () => setActiveScreen("projects"), category: "Navegação", icon: Folder },
    { label: "Ir para Áreas de Foco", action: () => setActiveScreen("areas"), category: "Navegação", icon: Layers },
    { label: "Ir para Anotações & Áudios", action: () => setActiveScreen("notes"), category: "Navegação", icon: StickyNote },
    { label: "Ir para Estatísticas", action: () => setActiveScreen("stats"), category: "Navegação", icon: TrendingUp },
    { label: "Ir para Configurações", action: () => setActiveScreen("settings"), category: "Navegação", icon: Settings },
  ];

  const searchResults = () => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Default return standard quick commands
      return navigationCommands;
    }

    const filtered: any[] = [];

    // Filter Navigation
    navigationCommands.forEach(cmd => {
      if (cmd.label.toLowerCase().includes(q)) {
        filtered.push(cmd);
      }
    });

    // Filter active tasks
    tasks.filter(t => !t.isArchived).forEach(task => {
      if (task.title.toLowerCase().includes(q)) {
        filtered.push({
          label: `Tarefa: ${task.title}`,
          category: "Tarefas",
          icon: CheckSquare,
          action: () => {
            // Trigger focus mode on this task
            setFocusTask(task);
            setActiveScreen("today");
          }
        });
      }
    });

    // Filter projects
    projects.filter(p => p.status !== "Arquivado").forEach(proj => {
      if (proj.name.toLowerCase().includes(q)) {
        filtered.push({
          label: `Projeto: ${proj.name}`,
          category: "Projetos",
          icon: Folder,
          action: () => {
            setActiveScreen("projects");
          }
        });
      }
    });

    return filtered.slice(0, 8); // Top 8 results
  };

  const results = searchResults();

  // Keyboard controls within palette list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  return (
    <>
      {/* Floating terminal trigger button at header */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        title="Abrir Central de Comandos (Ctrl + K)"
        id="global-command-palette-trigger"
      >
        <Search className="w-4 h-4 text-slate-400" />
        <span>Search...</span>
        <kbd className="bg-slate-950 px-1.5 py-0.5 rounded text-xs text-slate-500 font-sans hidden sm:inline-block">⌘K</kbd>
      </button>

      {/* Palette Overlay Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 font-sans">
            {/* Backdrop blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[480px]"
              onKeyDown={handleKeyDown}
            >
              {/* Input header */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Pesquise tarefas, projetos, telas..."
                  className="bg-transparent text-white placeholder-slate-500 focus:outline-none flex-1 text-base font-medium"
                />
                <span className="text-xs text-slate-500 font-medium bg-slate-800 py-1 px-2 rounded-md">ESC fechar</span>
              </div>

              {/* Items listing */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {results.length > 0 ? (
                  results.map((item, index) => {
                    const Icon = item.icon;
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          item.action();
                          setIsOpen(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left font-medium
                          ${isSelected 
                            ? "bg-blue-600 text-white" 
                            : "text-slate-300 hover:bg-slate-800"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                          <span>{item.label}</span>
                        </div>
                        <span className={`text-xs ${isSelected ? "text-blue-200" : "text-slate-500"}`}>
                          {item.category}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <Search className="w-6 h-6 text-slate-600" />
                    <span className="text-sm font-medium">Nenhum resultado encontrado</span>
                  </div>
                )}
              </div>

              {/* Footnotes footer */}
              <div className="py-2.5 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>↑↓ Navegar</span>
                  <span>ENTER Selecionar</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
