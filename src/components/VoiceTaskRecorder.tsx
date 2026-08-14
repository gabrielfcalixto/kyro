/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useJarvis } from "../context/JarvisContext";
import { 
  Mic, 
  MicOff, 
  RefreshCw, 
  Check, 
  Calendar, 
  Clock, 
  Tag, 
  AlertCircle,
  Plus
} from "lucide-react";
import { TaskStatus, TaskPriority } from "../types";

export const VoiceTaskRecorder: React.FC = () => {
  const { 
    createTask, 
    areas, 
    projects, 
    parseAudioLanguage 
  } = useJarvis();

  // Recorder states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showPermissionError, setShowPermissionError] = useState(false);
  
  // Timer & Chunks references
  const recordingTimerRef = useRef<any | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Preview / Editing parsed result states
  const [parsedResult, setParsedResult] = useState<{
    transcription: string;
    title: string;
    dueDate: string | null;
    dueTime: string | null;
    priority: TaskPriority;
    areaId: string | null;
    projectId: string | null;
    recurrence: string;
    tags: string[];
  } | null>(null);

  // Success indicator
  const [successTaskTitle, setSuccessTaskTitle] = useState<string | null>(null);

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
      setShowPermissionError(false);
      setSuccessTaskTitle(null);
      setParsedResult(null);
      chunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/ogg";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/mp4";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ""; 
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
        stream.getTracks().forEach(track => track.stop());
        
        const blobMimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(chunksRef.current, { type: blobMimeType });
        
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(",")[1];
          try {
            const data = await parseAudioLanguage(base64Data, blobMimeType);
            if (data && !data.error) {
              setParsedResult({
                transcription: data.transcription || "",
                title: data.title || data.transcription || "Nova Tarefa",
                dueDate: data.dueDate || null,
                dueTime: data.dueTime || null,
                priority: (data.priority as TaskPriority) || TaskPriority.NONE,
                areaId: data.areaId || null,
                projectId: data.projectId || null,
                recurrence: data.recurrence || "none",
                tags: data.tags || []
              });
            } else if (data && data.error) {
              console.error("Erro na resposta do áudio:", data.error);
              alert("Erro ao transcrever áudio: " + data.error);
            }
          } catch (err) {
            console.error("Erro ao enviar áudio:", err);
            alert("Erro ao transcrever áudio.");
          } finally {
            setIsTranscribing(false);
          }
        };
      };

      recorder.start(250); 
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      setShowPermissionError(true);
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

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    chunksRef.current = [];
  };

  const handleSaveParsedTask = async () => {
    if (!parsedResult) return;

    try {
      const taskObj = {
        title: parsedResult.title.trim() || parsedResult.transcription || "Tarefa por Voz",
        status: TaskStatus.INBOX, 
        priority: parsedResult.priority,
        dueDate: parsedResult.dueDate || undefined,
        dueTime: parsedResult.dueTime || undefined,
        areaId: parsedResult.areaId || "area-4", 
        projectId: parsedResult.projectId || undefined,
        recurrence: parsedResult.recurrence as any,
        tags: parsedResult.tags,
        source: "voice-assistant",
        subtasks: [],
        timeSpent: 0,
        isArchived: false
      };

      await createTask(taskObj);
      setSuccessTaskTitle(taskObj.title);
      setParsedResult(null);
    } catch (err) {
      console.error("Erro ao salvar tarefa de áudio:", err);
      alert("Erro ao salvar tarefa: " + (err as Error).message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-200">
            Adicionar Tarefa
          </h3>
        </div>

        {!isRecording && !isTranscribing && !parsedResult && !successTaskTitle && (
          <p className="text-xs text-slate-400 font-medium">
            Fale o que você precisa fazer e a IA criará a tarefa.
          </p>
        )}

        {isRecording && (
          <div className="flex items-center gap-3 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-lg font-medium text-slate-100">{formatDuration(recordingDuration)}</span>
            <span className="text-sm text-slate-400 ml-2">Gravando...</span>
          </div>
        )}

        {isTranscribing && (
          <div className="flex items-center gap-2 mt-2">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
            <span className="text-sm text-slate-400">Processando áudio...</span>
          </div>
        )}

        {successTaskTitle && (
          <div className="flex items-center gap-2 mt-2 text-emerald-400">
            <Check className="w-4 h-4" />
            <span className="text-sm">"{successTaskTitle}" adicionada</span>
          </div>
        )}

        {showPermissionError && (
          <div className="flex items-center gap-2 mt-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Permissão de microfone negada.</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center md:justify-end gap-3 shrink-0">
        {!isRecording && !isTranscribing && !parsedResult && (
          <button
            onClick={startRecording}
            className="p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}

        {isRecording && (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelRecording}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={stopRecording}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <MicOff className="w-4 h-4" />
              <span>Parar</span>
            </button>
          </div>
        )}
      </div>

      {parsedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            
            <div className="flex flex-col space-y-1">
              <h3 className="text-lg font-semibold text-white">Confirmar Tarefa</h3>
              <span className="text-sm text-slate-400 italic">
                "{parsedResult.transcription || parsedResult.title}"
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Título</label>
                <input
                  type="text"
                  value={parsedResult.title}
                  onChange={(e) => setParsedResult({ ...parsedResult, title: e.target.value })}
                  className="w-full bg-slate-800 border-none text-slate-100 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Data</label>
                  <input
                    type="date"
                    value={parsedResult.dueDate || ""}
                    onChange={(e) => setParsedResult({ ...parsedResult, dueDate: e.target.value || null })}
                    className="w-full bg-slate-800 border-none text-slate-100 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Horário</label>
                  <input
                    type="time"
                    value={parsedResult.dueTime || ""}
                    onChange={(e) => setParsedResult({ ...parsedResult, dueTime: e.target.value || null })}
                    className="w-full bg-slate-800 border-none text-slate-100 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setParsedResult(null)}
                className="py-2.5 px-4 rounded-xl hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={handleSaveParsedTask}
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
