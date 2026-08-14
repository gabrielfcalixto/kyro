/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { useJarvis } from "../context/JarvisContext";
import { Note } from "../types";
import { 
  FileText, 
  Mic, 
  Square, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Tag, 
  X, 
  Sparkles, 
  Layers, 
  Folder, 
  Clock,
  Radio,
  Volume2,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Notes: React.FC = () => {
  const { 
    notes, 
    createNote, 
    updateNote, 
    deleteNote, 
    transcribeNoteAudio,
    areas,
    projects 
  } = useJarvis();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Modal / Drawer states
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form states for Create/Edit
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [formAreaId, setFormAreaId] = useState<string>("");
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formTranscription, setFormTranscription] = useState<string>("");

  // Viewing single note detail
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setFormTitle("");
    setFormContent("");
    setFormTags([]);
    setTagInput("");
    setFormAreaId("");
    setFormProjectId("");
    setFormIsPinned(false);
    setFormTranscription("");
    setIsNoteModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (note: Note, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormTags(note.tags || []);
    setTagInput("");
    setFormAreaId(note.areaId || "");
    setFormProjectId(note.projectId || "");
    setFormIsPinned(!!note.isPinned);
    setFormTranscription(note.transcription || "");
    setIsNoteModalOpen(true);
  };

  // Tag Management in Form
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !formTags.includes(trimmed)) {
      setFormTags([...formTags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter(t => t !== tagToRemove));
  };

  // Save Note
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingNote) {
      await updateNote(editingNote.id, {
        title: formTitle.trim(),
        content: formContent,
        tags: formTags,
        areaId: formAreaId || undefined,
        projectId: formProjectId || undefined,
        isPinned: formIsPinned,
        transcription: formTranscription || undefined
      });
    } else {
      await createNote({
        title: formTitle.trim(),
        content: formContent,
        tags: formTags,
        areaId: formAreaId || undefined,
        projectId: formProjectId || undefined,
        isPinned: formIsPinned,
        transcription: formTranscription || undefined
      });
    }

    setIsNoteModalOpen(false);
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else {
          mimeType = "";
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());

        const blobMimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: blobMimeType });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(",")[1];
          try {
            const data = await transcribeNoteAudio(base64Data, blobMimeType);
            if (data) {
              setEditingNote(null);
              setFormTitle(data.title || "Anotação de Áudio");
              setFormContent(data.content || data.transcription || "");
              setFormTags(data.tags || ["áudio"]);
              setFormAreaId(data.areaId || "");
              setFormProjectId(data.projectId || "");
              setFormIsPinned(false);
              setFormTranscription(data.transcription || "");
              setIsNoteModalOpen(true);
            }
          } catch (err) {
            console.error("Erro na transcrição:", err);
          } finally {
            setIsTranscribing(false);
            setIsAudioModalOpen(false);
          }
        };
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsAudioModalOpen(true);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões do seu navegador.");
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Cancel Recording
  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      setIsRecording(false);
    }
    setIsAudioModalOpen(false);
    setIsTranscribing(false);
  };

  // Toggle Pin
  const handleTogglePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateNote(note.id, { isPinned: !note.isPinned });
  };

  // Delete Note
  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta anotação?")) {
      await deleteNote(id);
      if (viewingNote?.id === id) setViewingNote(null);
    }
  };

  // Copy Note Content
  const handleCopyNote = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extract all unique tags across notes
  const allTags = Array.from(
    new Set(notes.flatMap(n => n.tags || []))
  );

  // Filter notes
  const filteredNotes = notes.filter(n => {
    const matchesQuery = searchQuery === "" || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag = !selectedTag || (n.tags && n.tags.includes(selectedTag));
    const matchesArea = !selectedAreaId || n.areaId === selectedAreaId;

    return matchesQuery && matchesTag && matchesArea;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Anotações & Áudios</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Seu bloco de notas inteligente. Grave áudios para transcrição automática por IA ou crie notas manuais.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleStartRecording}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-purple-500/20 transition-all transform active:scale-95"
            id="voice-note-btn"
          >
            <Mic className="w-4 h-4 animate-pulse text-purple-200" />
            <span>Gravar Áudio</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
            id="new-note-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Anotação</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 backdrop-blur-sm">
        
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar nas anotações ou tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-sm pl-9 pr-4 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {/* Area dropdown filter */}
          <select
            value={selectedAreaId || ""}
            onChange={(e) => setSelectedAreaId(e.target.value || null)}
            className="bg-slate-950 text-slate-300 text-xs py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 shrink-0"
          >
            <option value="">Todas as Áreas</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Tags Filter pills */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 transition-colors"
                >
                  <span>#{selectedTag}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Available Tags Carousel */}
      {allTags.length > 0 && !selectedTag && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-800">
          <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0 font-medium">
            <Tag className="w-3 h-3" /> Tags:
          </span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors shrink-0"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* NOTES GRID CONTAINER */}
      {filteredNotes.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Nenhuma anotação encontrada</h3>
          <p className="text-sm text-slate-400 mt-1">
            {searchQuery || selectedTag || selectedAreaId
              ? "Tente ajustar seus filtros de busca."
              : "Comece criando uma nova anotação ou gravando um áudio transcrito por IA."}
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={handleStartRecording}
              className="px-4 py-2 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-medium hover:bg-purple-600/30 transition-colors flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              Gravar Áudio
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Anotação
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Pinned Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
                <Pin className="w-3.5 h-3.5 fill-amber-400/20" />
                <span>Anotações Fixadas ({pinnedNotes.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedNotes.map(note => renderNoteCard(note))}
              </div>
            </div>
          )}

          {/* Other Notes Section */}
          {otherNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Outras Anotações ({otherNotes.length})</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherNotes.map(note => renderNoteCard(note))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* AUDIO RECORDING OVERLAY MODAL */}
      <AnimatePresence>
        {isAudioModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 relative overflow-hidden"
            >
              {/* Background ambient glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

              {isTranscribing ? (
                <div className="py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 animate-spin">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Transcrevendo Áudio com IA...</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Processando com Gemini para extrair o título, texto formatado e tags da sua anotação.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold mb-3 border border-purple-500/20">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Gravando Anotação de Voz</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight font-mono">
                      {formatTimer(recordingSeconds)}
                    </h3>
                  </div>

                  {/* Pulsing Visualizer Rings */}
                  <div className="relative py-6 flex items-center justify-center">
                    <div className="absolute w-28 h-28 rounded-full bg-purple-500/20 animate-ping" />
                    <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/30">
                      <Mic className="w-10 h-10 animate-pulse" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Fale naturalmente. Quando terminar, clique em <span className="text-white font-medium">Concluir</span> para a IA criar sua nota.
                  </p>

                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelRecording}
                      className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Concluir & Transcrever</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT NOTE MODAL */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">
                    {editingNote ? "Editar Anotação" : "Nova Anotação"}
                  </h2>
                </div>
                <button
                  onClick={() => setIsNoteModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveNote} className="p-6 space-y-4 overflow-y-auto flex-1">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ideias para reunião, Resumo do áudio..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-950 text-white text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Conteúdo da Nota</label>
                  <textarea
                    rows={8}
                    placeholder="Escreva suas anotações aqui..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 text-sm p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 transition-colors font-sans leading-relaxed resize-y"
                  />
                </div>

                {/* Audio Transcription Raw View (If available) */}
                {formTranscription && (
                  <div className="p-3 bg-purple-950/20 border border-purple-800/30 rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-purple-400 flex items-center gap-1">
                      <Mic className="w-3 h-3" /> Transcrição pura do áudio original:
                    </span>
                    <p className="text-xs text-slate-300 italic">{formTranscription}</p>
                  </div>
                )}

                {/* Meta Selectors: Area & Project */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Área de Foco</label>
                    <select
                      value={formAreaId}
                      onChange={(e) => setFormAreaId(e.target.value)}
                      className="w-full bg-slate-950 text-slate-300 text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Nenhuma (Geral)</option>
                      {areas.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Projeto Relacionado</label>
                    <select
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="w-full bg-slate-950 text-slate-300 text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Nenhum</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags input */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Etiquetas / Tags</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Adicionar tag e pressionar Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-xl font-medium transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>

                  {/* Render added tags */}
                  {formTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formTags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 flex items-center gap-1 border border-slate-700"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pin toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="pin-checkbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="pin-checkbox" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fixar esta anotação no topo</span>
                  </label>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
                  >
                    {editingNote ? "Salvar Alterações" : "Criar Anotação"}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL NOTE VIEWER MODAL */}
      <AnimatePresence>
        {viewingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  {viewingNote.isPinned && <Pin className="w-4 h-4 text-amber-400 shrink-0" />}
                  <h2 className="text-lg font-bold text-white truncate">{viewingNote.title}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleCopyNote(viewingNote, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Copiar texto"
                  >
                    {copiedId === viewingNote.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => {
                      const noteToEdit = viewingNote;
                      setViewingNote(null);
                      handleOpenEditModal(noteToEdit, e);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewingNote(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                
                {/* Metadata badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pb-2 border-b border-slate-800/60">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(viewingNote.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>

                  {/* Area badge */}
                  {viewingNote.areaId && (() => {
                    const area = areas.find(a => a.id === viewingNote.areaId);
                    return area ? (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium flex items-center gap-1">
                        <Layers className="w-3 h-3" /> {area.name}
                      </span>
                    ) : null;
                  })()}

                  {/* Project badge */}
                  {viewingNote.projectId && (() => {
                    const proj = projects.find(p => p.id === viewingNote.projectId);
                    return proj ? (
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-medium flex items-center gap-1">
                        <Folder className="w-3 h-3" /> {proj.name}
                      </span>
                    ) : null;
                  })()}

                  {/* Audio Badge */}
                  {viewingNote.transcription && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium flex items-center gap-1">
                      <Mic className="w-3 h-3" /> Gravado via Voz
                    </span>
                  )}
                </div>

                {/* Content text */}
                <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed font-sans pt-1">
                  {viewingNote.content}
                </div>

                {/* Raw Audio Transcription if available */}
                {viewingNote.transcription && (
                  <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <span className="font-semibold text-purple-400 flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5" /> Transcrição pura e completa do áudio:
                    </span>
                    <p className="text-slate-400 italic leading-normal">{viewingNote.transcription}</p>
                  </div>
                )}

                {/* Tags */}
                {viewingNote.tags && viewingNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-800/60">
                    {viewingNote.tags.map(t => (
                      <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  // Helper to render Note Card
  function renderNoteCard(note: Note) {
    const area = note.areaId ? areas.find(a => a.id === note.areaId) : null;
    const project = note.projectId ? projects.find(p => p.id === note.projectId) : null;

    return (
      <motion.div
        key={note.id}
        layout
        onClick={() => setViewingNote(note)}
        className={`
          group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3
          ${note.isPinned 
            ? "bg-slate-900/90 border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-500/5" 
            : "bg-slate-900/50 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
          }
        `}
      >
        <div>
          {/* Card Top Actions & Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">
              {note.title}
            </h3>

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => handleTogglePin(note, e)}
                className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                  note.isPinned ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                }`}
                title={note.isPinned ? "Desafixar" : "Fixar no topo"}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => handleOpenEditModal(note, e)}
                className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                title="Editar"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => handleDeleteNote(note.id, e)}
                className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content snippet */}
          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-sans">
            {note.content || "Sem conteúdo"}
          </p>
        </div>

        {/* Card Footer Meta */}
        <div className="space-y-2 pt-2 border-t border-slate-800/50">
          
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {area && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                {area.name}
              </span>
            )}
            {project && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                {project.name}
              </span>
            )}
            {note.transcription && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium flex items-center gap-1">
                <Mic className="w-2.5 h-2.5" /> Áudio
              </span>
            )}
          </div>

          {/* Tags & Date row */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <div className="flex items-center gap-1 overflow-hidden">
              {note.tags && note.tags.slice(0, 3).map(t => (
                <span key={t} className="text-slate-400 font-mono">
                  #{t}
                </span>
              ))}
            </div>

            <span className="shrink-0 font-sans">
              {new Date(note.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit"
              })}
            </span>
          </div>

        </div>
      </motion.div>
    );
  }
};
