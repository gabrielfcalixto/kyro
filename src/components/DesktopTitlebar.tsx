/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Minus,
  Square,
  X,
  Volume2,
  VolumeX,
  Monitor,
  ListTodo,
  Keyboard,
  Minimize2
} from "lucide-react";
import { setSoundEnabled, getSoundEnabled, playTaskCompleteSound } from "../lib/audioFX";

const appWindow = getCurrentWindow();

interface DesktopTitlebarProps {
  onToggleMiniWidget: () => void;
  onOpenShortcuts: () => void;
  onMaximizedChange: (isMaximized: boolean) => void;
}

export const DesktopTitlebar: React.FC<DesktopTitlebarProps> = ({
  onToggleMiniWidget,
  onOpenShortcuts,
  onMaximizedChange
}) => {
  const [soundOn, setSoundOn] = useState(getSoundEnabled());
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    appWindow.isMaximized().then(max => {
      setIsMaximized(max);
      onMaximizedChange(max);
    });
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playTaskCompleteSound();
    }
  };

  const syncMaximizedState = async () => {
    const max = await appWindow.isMaximized();
    setIsMaximized(max);
    onMaximizedChange(max);
  };

  const handleMinimize = () => appWindow.minimize();
  const handleToggleMaximize = async () => {
    await appWindow.toggleMaximize();
    await syncMaximizedState();
  };
  const handleClose = () => appWindow.close();

  return (
    <div
      data-tauri-drag-region
      className="h-9 bg-slate-950 border-b border-slate-800/80 px-3 flex items-center justify-between text-slate-400 text-xs select-none z-50 shrink-0"
    >

      {/* Left: App Logo & Title */}
      <div className="flex items-center gap-2.5 min-w-0" data-tauri-drag-region>
        <div className="flex items-center gap-1.5 font-bold text-white tracking-tight">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
            <ListTodo className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Kyro Desktop
          </span>
        </div>

        <span className="text-slate-700 hidden sm:inline">|</span>

        {/* Sync Status Badge */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Banco local</span>
        </div>
      </div>

      {/* Middle: Quick Window Mode Controls */}
      <div className="flex items-center gap-1">
        {/* Compact Mini Widget Toggle */}
        <button
          onClick={onToggleMiniWidget}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-[11px] font-medium"
          title="Modo Widget Compacto (Ctrl + Shift + M)"
        >
          <Monitor className="w-3 h-3 text-purple-400" />
          <span className="hidden md:inline">Modo Mini Widget</span>
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={handleToggleSound}
          className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${
            soundOn ? "text-blue-400" : "text-slate-600"
          }`}
          title={soundOn ? "Efeitos Sonoros Ativos (Som ao concluir tarefas)" : "Som Desativado"}
        >
          {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Keyboard Shortcuts button */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Atalhos do Teclado (Ctrl + /)"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Windows Controls (Minimize, Maximize, Close) */}
      <div className="flex items-center gap-1">
        {/* Minimize button */}
        <button
          onClick={handleMinimize}
          className="w-7 h-6 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Maximize/Restore button */}
        <button
          onClick={handleToggleMaximize}
          className="w-7 h-6 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
          title={isMaximized ? "Restaurar Janela" : "Maximizar Janela"}
        >
          {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="w-7 h-6 flex items-center justify-center hover:bg-rose-600 text-slate-400 hover:text-white rounded transition-colors"
          title="Fechar Janela"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
