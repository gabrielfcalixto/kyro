/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { JarvisProvider, useJarvis } from "./context/JarvisContext";
import { Sidebar } from "./components/Sidebar";
import { CommandPalette } from "./components/CommandPalette";
import { TaskDrawer } from "./components/TaskDrawer";
import { ModeFocus } from "./components/ModeFocus";
import { DesktopTitlebar } from "./components/DesktopTitlebar";
import { DesktopMiniWidget } from "./components/DesktopMiniWidget";
import { DesktopShortcutsModal } from "./components/DesktopShortcutsModal";

// Screens
import { Dashboard } from "./pages/Dashboard";
import { Today } from "./pages/Today";
import { Inbox } from "./pages/Inbox";
import { Upcoming } from "./pages/Upcoming";
import { Overdue } from "./pages/Overdue";
import { CalendarView } from "./pages/CalendarView";
import { Projects } from "./pages/Projects";
import { Areas } from "./pages/Areas";
import { Notes } from "./pages/Notes";
import { Stats } from "./pages/Stats";
import { Reviews } from "./pages/Reviews";
import { Settings } from "./pages/Settings";

import { Keyboard } from "lucide-react";

// Inner Application component to consume JarvisContext
const JarvisAppInner: React.FC = () => {
  const { activeScreen, setActiveScreen, focusTask } = useJarvis();

  // Desktop window states
  const [isMiniWidgetOpen, setIsMiniWidgetOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + M -> Toggle Mini Widget
      if (e.ctrlKey && e.shiftKey && (e.key === "M" || e.key === "m")) {
        e.preventDefault();
        setIsMiniWidgetOpen(prev => !prev);
        return;
      }

      // Ctrl + / -> Toggle Shortcuts Modal
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }

      // Ctrl + D -> Go to Today
      if (e.ctrlKey && (e.key === "D" || e.key === "d") && !e.shiftKey) {
        e.preventDefault();
        setActiveScreen("today");
        return;
      }

      // Ctrl + I -> Go to Inbox
      if (e.ctrlKey && (e.key === "I" || e.key === "i") && !e.shiftKey) {
        e.preventDefault();
        setActiveScreen("inbox");
        return;
      }

      // Ctrl + P -> Go to Projects
      if (e.ctrlKey && (e.key === "P" || e.key === "p") && !e.shiftKey) {
        e.preventDefault();
        setActiveScreen("projects");
        return;
      }

      // Ctrl + A -> Go to Notes
      if (e.ctrlKey && (e.key === "A" || e.key === "a") && !e.shiftKey) {
        e.preventDefault();
        setActiveScreen("notes");
        return;
      }

      // Escape -> Close overlays
      if (e.key === "Escape") {
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveScreen]);

  // Screen dispatcher
  const renderActiveScreen = () => {
    switch (activeScreen) {
      case "overview":
        return <Dashboard />;
      case "today":
        return <Today />;
      case "inbox":
        return <Inbox />;
      case "upcoming":
        return <Upcoming />;
      case "overdue":
        return <Overdue />;
      case "calendar":
        return <CalendarView />;
      case "projects":
        return <Projects />;
      case "areas":
        return <Areas />;
      case "notes":
        return <Notes />;
      case "stats":
        return <Stats />;
      case "reviews":
        return <Reviews />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 selection:text-blue-200 font-sans flex flex-col ${isMaximized ? 'p-0' : 'p-0 sm:p-2 bg-gradient-to-br from-slate-950 via-slate-900 to-black'}`}>
      
      {/* Desktop App Outer Frame Wrapper */}
      <div className={`flex-1 flex flex-col bg-slate-950 overflow-hidden shadow-2xl transition-all duration-300 ${isMaximized ? 'rounded-none' : 'rounded-none sm:rounded-2xl border border-slate-800/80'}`}>
        
        {/* Desktop Custom Titlebar */}
        <DesktopTitlebar
          onToggleMiniWidget={() => setIsMiniWidgetOpen(prev => !prev)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onMaximizedChange={setIsMaximized}
        />

        <div className="flex flex-1 min-h-0 relative overflow-hidden">

          {/* Dynamic left side navigation rail */}
          <Sidebar />

          {/* Main viewport container */}
          <div className="flex-1 flex flex-col min-w-0 pt-12 lg:pt-0">

            {/* Global top utility actions header */}
            <header className="h-12 border-b border-slate-900/80 px-6 flex items-center justify-between z-10 shrink-0 bg-slate-950/40 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  {activeScreen === "today" ? "Meu Dia" : activeScreen}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Keyboard shortcut legend indicator */}
                <button
                  onClick={() => setIsShortcutsOpen(true)}
                  className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-800 transition-colors"
                >
                  <Keyboard className="w-3.5 h-3.5 text-blue-400" />
                  <span><kbd className="font-mono text-slate-300">Ctrl+K</kbd> ou <kbd className="font-mono text-slate-300">Ctrl+/</kbd></span>
                </button>

                {/* Integrated floating Command Palette overlay search trigger */}
                <CommandPalette />
              </div>
            </header>

            {/* Primary Page Canvas (Scrollable viewport) */}
            <main className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 max-w-7xl w-full mx-auto">
              {renderActiveScreen()}
            </main>
          </div>

        </div>

      </div>

      {/* FLOATING MINI WIDGET */}
      {isMiniWidgetOpen && (
        <DesktopMiniWidget
          onExpandToFullApp={() => setIsMiniWidgetOpen(false)}
          onClose={() => setIsMiniWidgetOpen(false)}
        />
      )}

      {/* SHORTCUTS MODAL */}
      <DesktopShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* GLOBAL POPUP & SLIDE DRAWER OVERLAYS */}
      {focusTask && <ModeFocus />}
      <TaskDrawer />

    </div>
  );
};

export default function App() {
  return (
    <JarvisProvider>
      <JarvisAppInner />
    </JarvisProvider>
  );
}
