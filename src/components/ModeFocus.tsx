/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  Play, 
  Pause, 
  Square, 
  Timer, 
  CheckCircle, 
  Circle,
  X,
  Volume2,
  VolumeX,
  Plus,
  Compass,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";
import { Task, TaskStatus } from "../types";

export const ModeFocus: React.FC = () => {
  const { 
    focusTask, 
    setFocusTask, 
    updateTask, 
    logFocusSession 
  } = useJarvis();

  if (!focusTask) return null;

  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"countdown" | "stopwatch">("countdown");
  const [totalSeconds, setTotalSeconds] = useState(25 * 60); // Default 25 min pomodoro
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const timerRef = useRef<any>(null);

  // Audio synthetically generated using Web Audio API for breathing loops/ticks
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSynthesizedTone = (freq: number, type: OscillatorType, dur: number) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        if (mode === "countdown") {
          setSecondsLeft(prev => {
            if (prev <= 1) {
              handleTimerCompletion();
              return 0;
            }
            // Tick sound
            if (prev % 60 === 0) {
              playSynthesizedTone(440, "sine", 0.05); // High tick at minute
            } else if (prev % 5 === 0) {
              playSynthesizedTone(220, "sine", 0.02); // Small tick
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleTimerCompletion = async () => {
    setIsRunning(false);
    playSynthesizedTone(587.33, "triangle", 0.4); // Success high tone
    setTimeout(() => playSynthesizedTone(659.25, "triangle", 0.6), 150);

    // Save Focus Session in DB
    const sessionMinutes = Math.round(elapsedSeconds / 60) || 1;
    await logFocusSession({
      taskId: focusTask.id,
      taskTitle: focusTask.title,
      duration: sessionMinutes,
      completed: true,
      startTime: new Date().toISOString()
    });

    alert(`Parabéns! Você completou um ciclo de foco de ${sessionMinutes} minutos!`);
    resetTimer();
  };

  const handleStartPause = () => {
    // Resume audio context
    if (typeof window !== "undefined") {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    }
    setIsRunning(!isRunning);
    playSynthesizedTone(isRunning ? 330 : 440, "sine", 0.1);
  };

  const handleQuitFocus = async () => {
    if (isRunning) setIsRunning(false);
    
    const sessionMinutes = Math.round(elapsedSeconds / 60);
    if (sessionMinutes > 0) {
      if (confirm(`Deseja salvar e registrar os ${sessionMinutes} minutos de atividade na tarefa?`)) {
        await logFocusSession({
          taskId: focusTask.id,
          taskTitle: focusTask.title,
          duration: sessionMinutes,
          completed: false,
          startTime: new Date().toISOString()
        });
      }
    }
    setFocusTask(null);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    setElapsedSeconds(0);
  };

  const setTimerPreset = (minutes: number) => {
    setIsRunning(false);
    setMode("countdown");
    const secs = minutes * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setElapsedSeconds(0);
  };

  const handleToggleTaskComplete = async () => {
    const isNowCompleted = focusTask.status !== TaskStatus.COMPLETED;
    const nextStatus = isNowCompleted ? TaskStatus.COMPLETED : TaskStatus.PENDING;
    
    await updateTask(focusTask.id, { status: nextStatus });
    
    if (isNowCompleted) {
      // Register whatever was logged and quit
      const sessionMinutes = Math.round(elapsedSeconds / 60) || 1;
      await logFocusSession({
        taskId: focusTask.id,
        taskTitle: focusTask.title,
        duration: sessionMinutes,
        completed: true,
        startTime: new Date().toISOString()
      });
      playSynthesizedTone(880, "triangle", 0.5);
      alert("Tarefa marcada como CONCLUÍDA! Foco encerrado.");
      setFocusTask(null);
    }
  };

  const handleToggleSubtaskComplete = async (subId: string, completed: boolean) => {
    const updatedSub = focusTask.subtasks.map(s => s.id === subId ? { ...s, completed } : s);
    await updateTask(focusTask.id, { subtasks: updatedSub });
    playSynthesizedTone(completed ? 523.25 : 261.63, "sine", 0.08);
  };

  // Progress circle calculate
  const percentLeft = mode === "countdown" ? (secondsLeft / totalSeconds) * 100 : 100;
  const strokeDashoffset = 283 - (283 * percentLeft) / 100;

  // Formatting helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 p-6 font-sans select-none overflow-y-auto">
      {/* Decorative top lighting */}
      <div className="absolute top-0 w-full max-w-4xl h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent blur-md" />

      {/* Floating exit actions */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title={isMuted ? "Ativar Áudio de Cronômetro" : "Mudar para Silencioso"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-indigo-400" />}
        </button>
        <button 
          onClick={handleQuitFocus}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-all shadow-lg flex items-center gap-2 text-xs font-semibold"
          id="focus-exit-btn"
        >
          <span>Sair do Foco</span>
          <X className="w-4 h-4 text-rose-500" />
        </button>
      </div>

      {/* Center container focused */}
      <div className="w-full max-w-xl text-center space-y-8 my-auto">
        {/* Active Task card */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-indigo-500 font-mono uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 py-1 px-3.5 rounded-full">
            MODO FOCO ATIVO
          </span>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight leading-snug max-w-md mx-auto" id="focus-task-title">
            {focusTask.title}
          </h1>
          {focusTask.description && (
            <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">
              {focusTask.description}
            </p>
          )}
        </div>

        {/* Stopwatch Circle Display */}
        <div className="flex justify-center relative">
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90 absolute">
              <circle 
                cx="112" cy="112" r="90" 
                className="stroke-slate-900 stroke-[5px] fill-transparent"
              />
              <motion.circle 
                cx="112" cy="112" r="90" 
                className="stroke-indigo-500 stroke-[5px] fill-transparent"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transition={{ duration: 0.3 }}
              />
            </svg>
            
            {/* Numeric Display */}
            <div className="text-center z-10 flex flex-col justify-center items-center">
              <span className="text-4xl font-bold font-mono text-slate-100 tracking-widest leading-none" id="focus-timer-clock">
                {mode === "countdown" ? formatTime(secondsLeft) : formatTime(elapsedSeconds)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-2">
                {isRunning ? "SESSÃO CORRENDO" : "PAUSADO"}
              </span>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col items-center gap-4.5">
          {/* Main stopwatch play controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={resetTimer}
              className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 shadow-md hover:scale-105 transition-all"
              title="Resetar tempo"
              id="focus-reset-btn"
            >
              <Square className="w-5 h-5 shrink-0" />
            </button>
            <button
              onClick={handleStartPause}
              className={`
                p-5.5 rounded-full text-white shadow-xl shadow-indigo-600/25 border-t border-t-white/20 hover:scale-105 active:scale-95 transition-all
                ${isRunning 
                  ? "bg-slate-800 border-slate-700/80 hover:bg-slate-700" 
                  : "bg-indigo-600 hover:bg-indigo-500"
                }
              `}
              id="focus-play-pause-btn"
            >
              {isRunning ? <Pause className="w-7 h-7 fill-white text-white" /> : <Play className="w-7 h-7 fill-white text-white translate-x-0.5" />}
            </button>
            <button
              onClick={handleToggleTaskComplete}
              className="p-3 rounded-full bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white shadow-md hover:scale-105 transition-all"
              title="Concluir tarefa agora"
              id="focus-complete-btn"
            >
              <CheckCircle className="w-5 h-5 shrink-0" />
            </button>
          </div>

          {/* Presets selecting buttons */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-850/80">
            <button 
              onClick={() => setTimerPreset(25)}
              className={`text-xs font-semibold py-1 px-3 rounded-lg font-mono transition-all ${totalSeconds === 25*60 && mode === "countdown" ? "bg-slate-800 text-indigo-400 border border-slate-700/60" : "text-slate-500 hover:text-slate-300"}`}
            >
              25m
            </button>
            <button 
              onClick={() => setTimerPreset(50)}
              className={`text-xs font-semibold py-1 px-3 rounded-lg font-mono transition-all ${totalSeconds === 50*60 && mode === "countdown" ? "bg-slate-800 text-indigo-400 border border-slate-700/60" : "text-slate-500 hover:text-slate-300"}`}
            >
              50m
            </button>
            <button 
              onClick={() => {
                setIsRunning(false);
                setMode("stopwatch");
                setElapsedSeconds(0);
              }}
              className={`text-xs font-semibold py-1 px-3 rounded-lg font-mono transition-all ${mode === "stopwatch" ? "bg-slate-800 text-indigo-400 border border-slate-700/60" : "text-slate-500 hover:text-slate-300"}`}
            >
              Livre ⏱️
            </button>
          </div>
        </div>

        {/* Subtasks checklists nested inside Focus */}
        {focusTask.subtasks.length > 0 && (
          <div className="max-w-md mx-auto border-t border-slate-900 pt-5 space-y-3 text-left">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest">
              Passos da Tarefa
            </span>
            <div className="space-y-2.5 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {focusTask.subtasks.map(st => (
                <button
                  key={st.id}
                  onClick={() => handleToggleSubtaskComplete(st.id, !st.completed)}
                  className="w-full flex items-center gap-3 bg-slate-900/40 border border-slate-850/50 p-2.5 rounded-xl text-left hover:border-slate-800 transition-all focus:outline-none"
                >
                  {st.completed ? (
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-500 fill-emerald-500/5 shrink-0" />
                  ) : (
                    <Circle className="w-4.5 h-4.5 text-slate-700 shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${st.completed ? "text-slate-500 line-through" : "text-slate-200"}`}>
                    {st.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Breathing guidance / Ambient widget */}
      <div className="mt-auto py-4 flex items-center gap-2 text-xs text-slate-500 font-mono border-t border-slate-950 w-full justify-center">
        <Compass className="w-4 h-4 text-slate-600 animate-spin" style={{ animationDuration: "10s" }} />
        <span>Inspire por 4s... Segure por 4s... Expire por 4s...</span>
      </div>
    </div>
  );
};
