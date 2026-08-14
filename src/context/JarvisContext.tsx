/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Task,
  Area,
  Project,
  FocusSession,
  WeeklyReview,
  UserSettings,
  Note,
  TaskStatus,
  ProjectStatus
} from "../types";
import * as db from "../lib/db";
import { parseNaturalLanguage as geminiParseText, parseAudioLanguage as geminiParseAudio, transcribeNoteAudio as geminiTranscribeNote, ParsedTaskResult, TranscribedNote } from "../lib/gemini";

interface JarvisContextType {
  tasks: Task[];
  areas: Area[];
  projects: Project[];
  notes: Note[];
  focusSessions: FocusSession[];
  weeklyReviews: WeeklyReview[];
  settings: UserSettings;
  loading: boolean;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  focusTask: Task | null;
  setFocusTask: (task: Task | null) => void;
  refreshData: () => Promise<void>;

  // Task Operations
  createTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<boolean>;

  // Area Operations
  createArea: (area: Partial<Area>) => Promise<Area>;
  updateArea: (id: string, area: Partial<Area>) => Promise<Area>;
  deleteArea: (id: string) => Promise<boolean>;

  // Project Operations
  createProject: (project: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, project: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<boolean>;

  // Note Operations
  createNote: (note: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, note: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string) => Promise<boolean>;
  transcribeNoteAudio: (audioData: string, mimeType: string) => Promise<TranscribedNote>;

  // Focus & Weekly Review
  logFocusSession: (session: Partial<FocusSession>) => Promise<FocusSession>;
  submitWeeklyReview: (review: Partial<WeeklyReview>) => Promise<WeeklyReview>;

  // Settings & Backups
  updateSettings: (settings: Partial<UserSettings>) => Promise<UserSettings>;
  importFullBackup: (data: any) => Promise<boolean>;
  exportBackup: () => Promise<db.FullBackup>;
  resetDatabase: () => Promise<void>;

  // Natural Language Parsing
  parseNaturalLanguage: (text: string) => Promise<ParsedTaskResult>;
  parseAudioLanguage: (audioData: string, mimeType: string) => Promise<ParsedTaskResult>;
}

const JarvisContext = createContext<JarvisContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
  name: "Gabriel",
  language: "pt",
  theme: "dark",
  dateFormat: "DD/MM/YYYY",
  weekStartsOn: 1,
  workingHours: { start: "08:00", end: "18:00" },
  notificationsEnabled: true,
  hideCompleted: false,
  confirmBeforeDelete: true
};

export const JarvisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState("overview");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const refreshData = async () => {
    try {
      const [tasksRes, areasRes, projectsRes, notesRes, focusRes, reviewsRes, settingsRes] = await Promise.all([
        db.listTasks(),
        db.listAreas(),
        db.listProjects(),
        db.listNotes(),
        db.listFocusSessions(),
        db.listWeeklyReviews(),
        db.getSettingsRow()
      ]);

      setTasks(tasksRes);
      setAreas(areasRes);
      setProjects(projectsRes);
      setNotes(notesRes || []);
      setFocusSessions(focusRes);
      setWeeklyReviews(reviewsRes);
      setSettings(settingsRes);
    } catch (err) {
      console.error("Erro ao carregar dados do banco local do Kyro:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Update DOM theme class when settings change
  useEffect(() => {
    const isDark = settings.theme === "dark" ||
      (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

  const refreshProject = async (projectId?: string) => {
    if (!projectId) return;
    await db.recalcProjectProgress(projectId);
    setProjects(await db.listProjects());
  };

  // Task Actions
  const createTask = async (task: Partial<Task>): Promise<Task> => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: task.title || "",
      description: task.description || "",
      status: task.status || TaskStatus.PENDING,
      priority: task.priority || ("Sem prioridade" as Task["priority"]),
      createdAt: now,
      updatedAt: now,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      areaId: task.areaId || "area-4",
      projectId: task.projectId,
      tags: task.tags || [],
      subtasks: task.subtasks || [],
      notes: task.notes,
      recurrence: task.recurrence || "none",
      estimatedDuration: task.estimatedDuration,
      timeSpent: task.timeSpent || 0,
      manualOrder: await db.nextManualOrder(),
      source: task.source || "input",
      isArchived: false,
      ...task
    };

    await db.insertTask(newTask);
    setTasks(prev => [...prev, newTask]);

    if (newTask.projectId) {
      await refreshProject(newTask.projectId);
    }

    return newTask;
  };

  const updateTask = async (id: string, taskUpdates: Partial<Task>): Promise<Task> => {
    const current = await db.getTaskRow(id);
    if (!current) throw new Error("Tarefa não encontrada");

    const oldProjId = current.projectId;
    const isNowCompleted = taskUpdates.status === TaskStatus.COMPLETED && current.status !== TaskStatus.COMPLETED;

    const patch: Partial<Task> = { ...taskUpdates, updatedAt: new Date().toISOString() };
    if (isNowCompleted) {
      patch.completedAt = new Date().toISOString();
    }

    const updated = await db.updateTaskRow(id, patch);
    if (!updated) throw new Error("Tarefa não encontrada");

    if (isNowCompleted && updated.recurrence && updated.recurrence !== "none") {
      await spawnNextRecurrentTask(updated);
    }

    setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
    setSelectedTask(prev => (prev && prev.id === id ? updated : prev));
    setFocusTask(prev => (prev && prev.id === id ? updated : prev));

    await refreshProject(updated.projectId);
    if (oldProjId && oldProjId !== updated.projectId) {
      await refreshProject(oldProjId);
    }

    return updated;
  };

  const spawnNextRecurrentTask = async (completedTask: Task) => {
    let nextDate = new Date();
    if (completedTask.dueDate) {
      nextDate = new Date(completedTask.dueDate + "T00:00:00");
    }

    switch (completedTask.recurrence) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "weekdays":
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 1);
    }

    const now = new Date().toISOString();
    const nextTask: Task = {
      ...completedTask,
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: TaskStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      dueDate: nextDate.toISOString().split("T")[0],
      completedAt: undefined,
      subtasks: completedTask.subtasks.map(st => ({ ...st, completed: false })),
      timeSpent: 0,
      manualOrder: await db.nextManualOrder(),
      source: "recurrence"
    };

    await db.insertTask(nextTask);
    setTasks(prev => [...prev, nextTask]);
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    const current = await db.getTaskRow(id);
    if (!current) return false;

    await db.archiveTaskRow(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    setSelectedTask(prev => (prev && prev.id === id ? null : prev));
    setFocusTask(prev => (prev && prev.id === id ? null : prev));

    await refreshProject(current.projectId);
    return true;
  };

  // Area Actions
  const createArea = async (area: Partial<Area>): Promise<Area> => {
    const newArea: Area = {
      id: `area-${Date.now()}`,
      name: area.name || "Nova Área",
      icon: area.icon || "Folder",
      color: area.color || "#3b82f6",
      order: areas.length + 1,
      isArchived: false,
      ...area
    };
    await db.insertArea(newArea);
    setAreas(prev => [...prev, newArea]);
    return newArea;
  };

  const updateArea = async (id: string, areaUpdates: Partial<Area>): Promise<Area> => {
    await db.updateAreaRow(id, areaUpdates);
    const updatedList = await db.listAreas();
    setAreas(updatedList);
    const updated = updatedList.find(a => a.id === id);
    if (!updated) throw new Error("Área não encontrada");
    return updated;
  };

  const deleteArea = async (id: string): Promise<boolean> => {
    await db.archiveAreaRow(id);
    setAreas(prev => prev.filter(a => a.id !== id));
    return true;
  };

  // Project Actions
  const createProject = async (project: Partial<Project>): Promise<Project> => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: project.name || "Novo Projeto",
      description: project.description || "",
      areaId: project.areaId || "area-1",
      status: project.status || ProjectStatus.PLANNED,
      priority: project.priority || ("Média" as Project["priority"]),
      startDate: project.startDate,
      dueDate: project.dueDate,
      progress: 0,
      color: project.color || "#3b82f6",
      icon: project.icon || "Target",
      lastActivityAt: new Date().toISOString(),
      ...project
    };
    await db.insertProject(newProject);
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = async (id: string, projectUpdates: Partial<Project>): Promise<Project> => {
    const updated = await db.updateProjectRow(id, { ...projectUpdates, lastActivityAt: new Date().toISOString() });
    if (!updated) throw new Error("Projeto não encontrado");
    setProjects(prev => prev.map(p => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    await db.archiveProjectRow(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    return true;
  };

  // Note Actions
  const createNote = async (note: Partial<Note>): Promise<Note> => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: note.title || "Anotação sem título",
      content: note.content || "",
      createdAt: now,
      updatedAt: now,
      tags: note.tags || [],
      isPinned: !!note.isPinned,
      areaId: note.areaId,
      projectId: note.projectId,
      transcription: note.transcription
    };
    await db.insertNote(newNote);
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = async (id: string, noteUpdates: Partial<Note>): Promise<Note> => {
    const updated = await db.updateNoteRow(id, { ...noteUpdates, updatedAt: new Date().toISOString() });
    if (!updated) throw new Error("Anotação não encontrada");
    setNotes(prev => prev.map(n => (n.id === id ? updated : n)));
    return updated;
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    await db.deleteNoteRow(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    return true;
  };

  const transcribeNoteAudio = async (audioData: string, mimeType: string) => {
    return geminiTranscribeNote(audioData, mimeType);
  };

  // Focus Log
  const logFocusSession = async (session: Partial<FocusSession>): Promise<FocusSession> => {
    const newSession: FocusSession = {
      id: `session-${Date.now()}`,
      taskId: session.taskId || "",
      taskTitle: session.taskTitle || "",
      startTime: session.startTime || new Date().toISOString(),
      duration: session.duration || 25,
      completed: session.completed || false
    };
    await db.insertFocusSession(newSession);
    setFocusSessions(prev => [...prev, newSession]);

    if (newSession.completed) {
      const task = await db.getTaskRow(newSession.taskId);
      if (task) {
        await db.updateTaskRow(newSession.taskId, {
          timeSpent: (task.timeSpent || 0) + newSession.duration,
          updatedAt: new Date().toISOString()
        });
        setTasks(await db.listTasks());
      }
    }

    return newSession;
  };

  // Weekly Review Submit
  const submitWeeklyReview = async (review: Partial<WeeklyReview>): Promise<WeeklyReview> => {
    const newReview: WeeklyReview = {
      id: `review-${Date.now()}`,
      weekStartDate: review.weekStartDate || new Date().toISOString().split("T")[0],
      completedTasksCount: review.completedTasksCount || 0,
      delayedTasksCount: review.delayedTasksCount || 0,
      cancelledTasksCount: review.cancelledTasksCount || 0,
      stagnantProjectsCount: review.stagnantProjectsCount || 0,
      priorities: review.priorities || [],
      notesAnswers: review.notesAnswers || { q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "" },
      createdAt: new Date().toISOString()
    };
    await db.insertWeeklyReview(newReview);
    setWeeklyReviews(prev => [...prev, newReview]);
    return newReview;
  };

  // Settings & Backup
  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<UserSettings> => {
    const updated = await db.updateSettingsRow(newSettings);
    setSettings(updated);
    return updated;
  };

  const importFullBackup = async (backupData: any): Promise<boolean> => {
    try {
      await db.importFullBackupRows(backupData);
      await refreshData();
      return true;
    } catch (err) {
      console.error("Erro ao importar backup:", err);
      return false;
    }
  };

  const exportBackup = async (): Promise<db.FullBackup> => {
    return db.exportFullBackup();
  };

  const resetDatabase = async (): Promise<void> => {
    await db.resetToFactoryDefaults();
    setSelectedTask(null);
    setFocusTask(null);
    await refreshData();
  };

  // Parsing API
  const parseNaturalLanguage = async (text: string) => geminiParseText(text);
  const parseAudioLanguage = async (audioData: string, mimeType: string) => geminiParseAudio(audioData, mimeType);

  return (
    <JarvisContext.Provider value={{
      tasks,
      areas,
      projects,
      notes,
      focusSessions,
      weeklyReviews,
      settings,
      loading,
      activeScreen,
      setActiveScreen,
      selectedTask,
      setSelectedTask,
      focusTask,
      setFocusTask,
      refreshData,
      createTask,
      updateTask,
      deleteTask,
      createArea,
      updateArea,
      deleteArea,
      createProject,
      updateProject,
      deleteProject,
      createNote,
      updateNote,
      deleteNote,
      transcribeNoteAudio,
      logFocusSession,
      submitWeeklyReview,
      updateSettings,
      importFullBackup,
      exportBackup,
      resetDatabase,
      parseNaturalLanguage,
      parseAudioLanguage
    }}>
      {children}
    </JarvisContext.Provider>
  );
};

export const useJarvis = () => {
  const context = useContext(JarvisContext);
  if (!context) {
    throw new Error("useJarvis deve ser usado dentro de um JarvisProvider");
  }
  return context;
};
