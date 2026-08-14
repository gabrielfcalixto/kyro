/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useJarvis } from "../context/JarvisContext";
import {
  Settings as SettingsIcon,
  User,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Sparkles,
  RefreshCw,
  Info,
  Monitor,
  Volume2,
  VolumeX,
  Keyboard,
  KeyRound
} from "lucide-react";
import { setSoundEnabled, getSoundEnabled, playTaskCompleteSound } from "../lib/audioFX";

export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    tasks,
    projects,
    areas,
    focusSessions,
    weeklyReviews,
    importFullBackup,
    resetDatabase
  } = useJarvis();

  const [name, setName] = useState(settings.name);
  const [isSaving, setIsSaving] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || "");
  const [isSavingKey, setIsSavingKey] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateSettings({ name: name.trim() });
      alert("Configurações atualizadas!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    const fullState = {
      tasks,
      projects,
      areas,
      focusSessions,
      weeklyReviews,
      settings
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kyro-backup-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.tasks && parsed.projects && parsed.areas) {
          const ok = await importFullBackup(parsed);
          if (ok) {
            alert("Backup importado com sucesso! Recarregando banco...");
          }
        } else {
          alert("Arquivo inválido. Certifique-se de carregar um JSON emitido pelo Kyro.");
        }
      } catch (err) {
        alert("Erro ao decodificar JSON de backup.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetDatabase = async () => {
    if (confirm("ATENÇÃO: Isso apagará todas as suas tarefas e projetos cadastrados, restaurando os valores padrão do Kyro. Deseja prosseguir?")) {
      try {
        await resetDatabase();
        alert("Banco de dados restaurado aos padrões de fábrica!");
      } catch (err) {
        console.error(err);
        alert("Erro ao restaurar o banco de dados.");
      }
    }
  };

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKey(true);
    try {
      await updateSettings({ geminiApiKey: geminiApiKey.trim() || undefined });
      alert("Chave de API salva localmente!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Preferências Gerais</h1>
        </div>
        <p className="text-sm text-slate-400 font-medium">Ajuste os parâmetros operacionais do seu segundo cérebro digital.</p>
      </div>

      {/* USER PROFILE CARD */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <User className="w-4 h-4 text-indigo-400" />
          <span>PERFIL OPERACIONAL</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Nome do Usuário</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 w-full transition-colors"
              id="settings-name-input"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              id="settings-save-profile-btn"
            >
              {isSaving && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>Salvar Perfil</span>
            </button>
          </div>
        </form>
      </div>

      {/* GEMINI API KEY CARD */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>INTELIGÊNCIA ARTIFICIAL (GEMINI)</span>
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Cole sua chave de API do Google Gemini para habilitar a captura de tarefas por voz e por linguagem natural. A chave fica salva apenas no seu banco de dados local. Sem chave, o Kyro usa um interpretador de regras offline mais simples.
        </p>

        <form onSubmit={handleSaveGeminiKey} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="Cole sua chave de API do Gemini..."
            className="bg-slate-950 border border-slate-850 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 flex-1 transition-colors"
            id="settings-gemini-key-input"
          />
          <button
            type="submit"
            disabled={isSavingKey}
            className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shrink-0"
            id="settings-save-gemini-key-btn"
          >
            {isSavingKey && <RefreshCw className="w-3 h-3 animate-spin" />}
            <span>Salvar Chave</span>
          </button>
        </form>
      </div>

      {/* DESKTOP & AUDIO EXPERIENCE CARD */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <Monitor className="w-4 h-4 text-blue-400" />
          <span>EXPERIÊNCIA DESKTOP & SONS (MICROSOFT TO DO STYLE)</span>
        </h3>

        <div className="space-y-3">
          {/* Sound FX Toggle & Test */}
          <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200">Som de Conclusão de Tarefas (Bell Chime)</span>
              <p className="text-[10px] text-slate-500 font-medium">Toca um sinal sonoro agradável no estilo Microsoft To Do ao concluir cada item.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => playTaskCompleteSound()}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium"
              >
                Testar Som
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>REGRAS DE VISUALIZAÇÃO</span>
        </h3>

        <div className="space-y-3">
          {/* Hide/Show completed items */}
          <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200">Ocultar Tarefas Concluídas</span>
              <p className="text-[10px] text-slate-500 font-medium">Remove tarefas terminadas da listagem do Hoje para evitar poluição visual.</p>
            </div>
            <button
              onClick={() => updateSettings({ hideCompleted: !settings.hideCompleted })}
              className={`p-1.5 rounded-lg border transition-all ${settings.hideCompleted ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}
              id="toggle-hide-completed-btn"
            >
              {settings.hideCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* BACKUP & EXPORTS CARD */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <Download className="w-4 h-4 text-purple-400" />
          <span>BACKUP E SEGURANÇA</span>
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed font-medium">Você é o proprietário soberano dos seus dados. O Kyro opera localmente por padrão, permitindo exportações completas para preservação.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export button */}
          <button
            onClick={handleExportBackup}
            className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl cursor-pointer text-left transition-colors flex items-center gap-3"
            id="export-backup-btn"
          >
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Fazer Download do Backup</span>
              <span className="text-[10px] text-slate-500 font-mono">Baixa arquivo .json completo</span>
            </div>
          </button>

          {/* Import file input wrapper */}
          <label className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl cursor-pointer text-left transition-colors flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Restaurar de arquivo</span>
              <span className="text-[10px] text-slate-500 font-mono">Selecionar arquivo .json</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
                id="import-backup-input"
              />
            </div>
          </label>
        </div>
      </div>

      {/* FACTORY RESET CARD */}
      <div className="bg-rose-950/5 border border-rose-500/15 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-widest text-rose-400 uppercase flex items-center gap-1.5">
          <Trash2 className="w-4 h-4" />
          <span>ZONA DE PERIGO</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-rose-300 block">Apagar Banco e Restaurar Padrões</span>
            <span className="text-[11px] text-rose-400/70 block font-medium">Isso removerá todas as alterações e reinicializará o Kyro.</span>
          </div>
          <button
            onClick={handleResetDatabase}
            className="py-1.5 px-3.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/20 hover:border-rose-500 text-rose-400 font-semibold text-xs rounded-xl transition-all self-start sm:self-center"
            id="factory-reset-btn"
          >
            Limpar Todo Banco
          </button>
        </div>
      </div>

    </div>
  );
};
