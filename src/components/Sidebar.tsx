/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  LayoutDashboard, 
  Calendar, 
  Inbox, 
  CalendarDays, 
  Target, 
  Layers, 
  AlertTriangle, 
  BarChart3, 
  ListChecks, 
  StickyNote,
  Settings, 
  Menu, 
  X, 
  CheckCircle, 
  CloudLightning, 
  CloudCheck,
  Sun,
  Moon,
  Zap,
  Flame,
  User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Sidebar: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    settings,
    updateSettings,
    tasks,
    projects
  } = useJarvis();
  const [isOpen, setIsOpen] = useState(false);

  // Counts for alerts
  const todayStr = new Date().toISOString().split("T")[0];
  const activeTodayTasks = tasks.filter(t => t.dueDate === todayStr && t.status !== "Concluída" && !t.isArchived);
  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== "Concluída" && !t.isArchived);
  const inboxTasks = tasks.filter(t => t.status === "Caixa de entrada" && !t.isArchived);

  // Stagnant projects (no activity for >= 7 days)
  const stagnantProjectsCount = projects.filter(p => {
    const lastAct = new Date(p.lastActivityAt).getTime();
    const diffDays = (Date.now() - lastAct) / (1000 * 60 * 60 * 24);
    return diffDays >= 7 && p.status === "Ativo";
  }).length;

  const menuItems = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { id: "today", label: "Hoje", icon: Sun, badge: activeTodayTasks.length > 0 ? activeTodayTasks.length : undefined, badgeColor: "bg-blue-500/20 text-blue-400" },
    { id: "inbox", label: "Caixa de Entrada", icon: Inbox, badge: inboxTasks.length > 0 ? inboxTasks.length : undefined, badgeColor: "bg-blue-500/20 text-blue-400" },
    { id: "upcoming", label: "Próximos", icon: Calendar },
    { id: "overdue", label: "Atrasados", icon: AlertTriangle, badge: overdueTasks.length > 0 ? overdueTasks.length : undefined, badgeColor: "bg-red-500/20 text-red-400 font-bold" },
    { id: "calendar", label: "Calendário", icon: CalendarDays },
    { id: "projects", label: "Projetos", icon: Target, badge: stagnantProjectsCount > 0 ? stagnantProjectsCount : undefined, badgeLabel: "parado", badgeColor: "bg-orange-500/20 text-orange-400 text-[10px]" },
    { id: "areas", label: "Áreas de Foco", icon: Layers },
    { id: "notes", label: "Anotações", icon: StickyNote },
    { id: "stats", label: "Estatísticas", icon: BarChart3 },
    { id: "reviews", label: "Planejamento Semanal", icon: ListChecks },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === "dark" ? "light" : "dark";
    updateSettings({ theme: nextTheme });
  };

  const currentThemeIcon = settings.theme === "dark" ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-500" />;

  const handleItemClick = (id: string) => {
    setActiveScreen(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header bar */}
      <header className="lg:hidden h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-tight font-sans">KYRO</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          id="mobile-menu-toggle"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar navigation container */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between z-45
        transform transition-transform duration-300 ease-in-out font-sans
        lg:relative lg:transform-none lg:translate-x-0
        ${isOpen ? "translate-x-0 pt-14 lg:pt-0" : "-translate-x-full lg:translate-x-0"}
      `} id="kyro-sidebar">
        
        {/* Top Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-900 hidden lg:flex">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-sm font-sans flex items-center gap-1.5">
                KYRO
              </span>
            </div>
          </div>
        </div>

        {/* Menu Items list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 group font-medium
                  ${isActive 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge} {item.badgeLabel && <span className="text-[9px]">{item.badgeLabel}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Panel - Sync status & user info */}
        <div className="p-4 border-t border-slate-900 bg-slate-950">
          {/* Sync Status bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
            <div className="flex items-center gap-1.5">
              <CloudCheck className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-500 font-medium">Sincronizado</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-slate-900 rounded-lg p-3 mb-2 border border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 overflow-hidden">
                <span className="font-bold text-slate-300 text-sm">
                  {settings.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{settings.name}</p>
                <p className="text-[10px] text-slate-400 truncate">Modo local</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Quick theme action */}
              <button
                onClick={handleToggleTheme}
                className="w-8 h-8 rounded hover:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
                title="Alternar Tema Escuro/Claro"
                id="theme-toggle-btn"
              >
                {currentThemeIcon}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black lg:hidden z-30"
          />
        )}
      </AnimatePresence>
    </>
  );
};
