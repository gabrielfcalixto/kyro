/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Flag, 
  Layers, 
  Target, 
  Plus, 
  CornerDownLeft, 
  RefreshCw,
  Info,
  CheckCircle2,
  ListRestart,
  Mic,
  MicOff
} from "lucide-react";
import { TaskStatus, TaskPriority } from "../types";

export const InboxQuickAdd: React.FC = () => {
  const { 
    createTask, 
    areas, 
    projects, 
    parseNaturalLanguage,
    parseAudioLanguage
  } = useJarvis();
  
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Parsed result preview state
  const [parsedResult, setParsedResult] = useState<{
    title: string;
    dueDate: string | null;
    dueTime: string | null;
    priority: TaskPriority;
    areaId: string;
    projectId: string | null;
    recurrence: string;
    tags: string[];
    source?: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when Ctrl + Space is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Ctrl+Space or Command+Space
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mimeType
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/ogg";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/mp4";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ""; // default browser format
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
        
        const blobMimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(chunksRef.current, { type: blobMimeType });
        
        if (audioBlob.size === 0) return;

        // Convert Blob to base64
        setIsTranscribing(true);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(",")[1];
          try {
            const data = await parseAudioLanguage(base64Data, blobMimeType);
            if (data && !data.error) {
              setInputText(data.transcription || data.title || "");
              setParsedResult({
                title: data.title || data.transcription || "",
                dueDate: data.dueDate || null,
                dueTime: data.dueTime || null,
                priority: data.priority as TaskPriority || TaskPriority.NONE,
                areaId: data.areaId || "area-4",
                projectId: data.projectId || null,
                recurrence: data.recurrence || "none",
                tags: data.tags || [],
                source: "gemini-3.5-flash-audio"
              });
            } else if (data && data.error) {
              console.error("Erro na resposta do áudio:", data.error);
              alert("Erro ao transcrever áudio: " + data.error);
            }
          } catch (err) {
            console.error("Erro ao enviar áudio:", err);
            alert("Erro ao enviar áudio. Certifique-se de configurar a API Key do Gemini nas configurações de Segredos.");
          } finally {
            setIsTranscribing(false);
          }
        };
      };

      recorder.start(250); // slices of 250ms
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões de gravação de áudio em seu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim() === "") {
      setParsedResult(null);
    }
  };

  // Trigger Gemini or Local rule-based extraction
  const handleParse = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const data = await parseNaturalLanguage(inputText);
      if (data) {
        setParsedResult({
          title: data.title || inputText,
          dueDate: data.dueDate || null,
          dueTime: data.dueTime || null,
          priority: data.priority as TaskPriority || TaskPriority.NONE,
          areaId: data.areaId || "area-4", // Defaults to Pessoal if null
          projectId: data.projectId || null,
          recurrence: data.recurrence || "none",
          tags: data.tags || [],
          source: data.source
        });
      }
    } catch (err) {
      console.error("Erro ao analisar tarefa:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit on Enter or click button
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (parsedResult) {
        saveTask();
      } else {
        handleParse();
      }
    }
  };

  const saveTask = async () => {
    if (!inputText.trim()) return;
    
    // If we haven't parsed yet, perform quick parse
    let taskToSave = parsedResult;
    if (!taskToSave) {
      setIsLoading(true);
      try {
        const data = await parseNaturalLanguage(inputText);
        taskToSave = {
          title: data.title || inputText,
          dueDate: data.dueDate || null,
          dueTime: data.dueTime || null,
          priority: data.priority as TaskPriority || TaskPriority.NONE,
          areaId: data.areaId || "area-4",
          projectId: data.projectId || null,
          recurrence: data.recurrence || "none",
          tags: data.tags || [],
          source: data.source
        };
      } catch (err) {
        // Fallback local fail
        taskToSave = {
          title: inputText,
          dueDate: null,
          dueTime: null,
          priority: TaskPriority.NONE,
          areaId: "area-4",
          projectId: null,
          recurrence: "none",
          tags: []
        };
      } finally {
        setIsLoading(false);
      }
    }

    if (taskToSave) {
      await createTask({
        title: taskToSave.title,
        status: TaskStatus.PENDING,
        priority: taskToSave.priority,
        dueDate: taskToSave.dueDate || undefined,
        dueTime: taskToSave.dueTime || undefined,
        areaId: taskToSave.areaId,
        projectId: taskToSave.projectId || undefined,
        recurrence: taskToSave.recurrence as any,
        tags: taskToSave.tags,
        source: "quick-add",
        subtasks: [],
        timeSpent: 0
      });

      // Reset states
      setInputText("");
      setParsedResult(null);
    }
  };

  const handleCancel = () => {
    setInputText("");
    setParsedResult(null);
  };

  // Quick select items during preview adjustments
  const selectedArea = areas.find(a => a.id === parsedResult?.areaId);
  const selectedProject = projects.find(p => p.id === parsedResult?.projectId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 shadow-xl relative overflow-hidden font-sans" id="quick-add-container">
      {/* Decorative intelligence border */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      
      {/* Search Bar / Input field */}
      <div className={`flex items-center gap-3 bg-slate-950/80 border rounded-lg px-3.5 py-2.5 transition-all ${
        isRecording 
          ? "border-red-500/60 ring-1 ring-red-500/20 shadow-lg shadow-red-500/5 bg-red-950/10" 
          : isTranscribing
          ? "border-cyan-500/60 ring-1 ring-cyan-500/20"
          : "border-slate-800 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/30"
      }`}>
        {isRecording ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <Mic className="w-4 h-4 text-red-500 animate-bounce" />
            <span className="text-xs text-red-400 font-mono font-bold">{formatDuration(recordingDuration)}</span>
          </div>
        ) : isTranscribing ? (
          <RefreshCw className="w-4.5 h-4.5 text-cyan-400 animate-spin shrink-0" />
        ) : (
          <Sparkles className={`w-4.5 h-4.5 shrink-0 ${inputText ? "text-indigo-400 animate-pulse" : "text-slate-500"}`} />
        )}

        <input
          ref={inputRef}
          type="text"
          value={isRecording ? "Gravando áudio... fale agora." : isTranscribing ? "Processando áudio com Gemini..." : inputText}
          onChange={handleTextChange}
          onKeyDown={handleInputKeyDown}
          disabled={isRecording || isTranscribing}
          placeholder="O que precisa ser feito? Escreva ou grave um áudio... (Ctrl+Space)"
          className={`bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none flex-1 font-medium ${
            (isRecording || isTranscribing) ? "select-none text-slate-400 italic" : ""
          }`}
          id="quick-add-input"
        />

        {/* Action Buttons Right Side */}
        <div className="flex items-center gap-2 shrink-0">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="text-xs font-semibold py-1.5 px-3 rounded-md bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Parar gravação e processar"
              id="stop-mic-btn"
              type="button"
            >
              <MicOff className="w-3.5 h-3.5" />
              <span>Parar e Enviar</span>
            </button>
          ) : isTranscribing ? (
            <div className="text-xs font-mono py-1 px-2.5 bg-slate-900 border border-slate-800 rounded-md text-cyan-400 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Transcrevendo...</span>
            </div>
          ) : (
            <>
              {/* Voice record button */}
              <button
                onClick={startRecording}
                className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                title="Gravar tarefa por áudio (Gemini IA)"
                type="button"
                id="start-mic-btn"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>

              {inputText && (
                <>
                  {!parsedResult && (
                    <button
                      onClick={handleParse}
                      disabled={isLoading}
                      className="text-xs font-semibold py-1 px-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
                      title="Analisar frase com IA"
                      id="parse-nlp-btn"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <span>Analisar</span>
                          <Sparkles className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={saveTask}
                    disabled={isLoading}
                    className="text-xs font-semibold py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center gap-1 shadow-sm transition-all"
                    id="save-quick-task-btn"
                  >
                    <span>Salvar</span>
                    <CornerDownLeft className="w-3 h-3 ml-0.5" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Structured Parsing Preview Grid */}
      {parsedResult && (
        <div className="mt-4 border-t border-slate-800/60 pt-3.5 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>KYRO INTELIGÊNCIA COMPILADA</span>
              {parsedResult.source && (
                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 py-0.5 px-1.5 rounded text-indigo-300 ml-1">
                  {parsedResult.source.includes("gemini") ? "Gemini Active ⚡" : "Regras Locais 🤖"}
                </span>
              )}
            </div>
            <button 
              onClick={handleCancel}
              className="text-xs text-slate-500 hover:text-slate-400 font-mono transition-colors"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-950/45 p-3 rounded-lg border border-slate-800/40">
            {/* Title Result */}
            <div className="lg:col-span-2 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider uppercase mb-1">Título da Tarefa</span>
              <input 
                type="text" 
                value={parsedResult.title}
                onChange={(e) => setParsedResult({ ...parsedResult, title: e.target.value })}
                className="text-sm font-semibold text-slate-200 bg-transparent border-b border-transparent hover:border-slate-800 focus:border-indigo-500 focus:outline-none py-0.5"
              />
            </div>

            {/* Date/Time Result */}
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800/60 text-slate-400">
                <Calendar className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">Prazo</span>
                <input 
                  type="date"
                  value={parsedResult.dueDate || ""}
                  onChange={(e) => setParsedResult({ ...parsedResult, dueDate: e.target.value || null })}
                  className="text-xs text-slate-300 font-medium bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Priority Result */}
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800/60 text-slate-400">
                <Flag className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">Prioridade</span>
                <select
                  value={parsedResult.priority}
                  onChange={(e) => setParsedResult({ ...parsedResult, priority: e.target.value as TaskPriority })}
                  className="text-xs text-slate-300 font-medium bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value={TaskPriority.NONE} className="bg-slate-900">Sem prioridade</option>
                  <option value={TaskPriority.LOW} className="bg-slate-900">Baixa</option>
                  <option value={TaskPriority.MEDIUM} className="bg-slate-900">Média</option>
                  <option value={TaskPriority.HIGH} className="bg-slate-900">Alta</option>
                  <option value={TaskPriority.URGENT} className="bg-slate-900">Urgente</option>
                </select>
              </div>
            </div>

            {/* Area Result */}
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800/60 text-slate-400">
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">Área de Foco</span>
                <select
                  value={parsedResult.areaId}
                  onChange={(e) => setParsedResult({ ...parsedResult, areaId: e.target.value })}
                  className="text-xs text-slate-300 font-medium bg-transparent focus:outline-none cursor-pointer"
                >
                  {areas.map(a => (
                    <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Recurrence and Project secondary row */}
          <div className="flex flex-wrap items-center gap-4 mt-2 px-1 text-xs">
            {/* Recurrence tag */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <ListRestart className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Recorrência:</span>
              <select
                value={parsedResult.recurrence}
                onChange={(e) => setParsedResult({ ...parsedResult, recurrence: e.target.value })}
                className="bg-transparent border-none text-slate-300 focus:outline-none font-medium cursor-pointer py-0.5"
              >
                <option value="none" className="bg-slate-950">Não recorrente</option>
                <option value="daily" className="bg-slate-950">Diariamente</option>
                <option value="weekdays" className="bg-slate-950">Dias úteis (Seg-Sex)</option>
                <option value="weekly" className="bg-slate-950">Semanalmente</option>
                <option value="monthly" className="bg-slate-950">Mensalmente</option>
                <option value="yearly" className="bg-slate-950">Anualmente</option>
              </select>
            </div>

            {/* Project association selector */}
            <div className="flex items-center gap-1.5 text-slate-400 border-l border-slate-800 pl-4">
              <Target className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Projeto:</span>
              <select
                value={parsedResult.projectId || "none"}
                onChange={(e) => setParsedResult({ ...parsedResult, projectId: e.target.value === "none" ? null : e.target.value })}
                className="bg-transparent border-none text-slate-300 focus:outline-none font-medium cursor-pointer py-0.5"
              >
                <option value="none" className="bg-slate-950">Sem projeto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-950">{p.name}</option>
                ))}
              </select>
            </div>

            {/* Tag preview pills */}
            {parsedResult.tags.length > 0 && (
              <div className="flex items-center gap-1 ml-auto border-l border-slate-800 pl-4">
                {parsedResult.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Small informative guideline footer */}
      {!parsedResult && (
        <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-500 font-mono px-0.5">
          <Info className="w-3 h-3 text-indigo-500/80" />
          <span>Ex: &quot;Corrigir listagem do TechSelos até amanhã às 15h prioridade alta&quot;</span>
        </div>
      )}
    </div>
  );
};
