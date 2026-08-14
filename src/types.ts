/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TaskStatus {
  INBOX = "Caixa de entrada",
  PENDING = "Pendente",
  IN_PROGRESS = "Em andamento",
  BLOCKED = "Bloqueada",
  COMPLETED = "Concluída",
  CANCELLED = "Cancelada",
  ARCHIVED = "Arquivada"
}

export enum TaskPriority {
  NONE = "Sem prioridade",
  LOW = "Baixa",
  MEDIUM = "Média",
  HIGH = "Alta",
  URGENT = "Urgente"
}

export enum ProjectStatus {
  PLANNED = "Planejado",
  ACTIVE = "Ativo",
  PAUSED = "Pausado",
  BLOCKED = "Bloqueado",
  COMPLETED = "Concluído",
  ARCHIVED = "Arquivado"
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  completedAt?: string; // ISO string
  areaId: string; // Belongs to an Area
  projectId?: string; // Optional project association
  tags: string[];
  subtasks: SubTask[];
  notes?: string;
  recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly" | "custom";
  estimatedDuration?: number; // in minutes
  timeSpent: number; // in minutes
  manualOrder: number;
  source: string; // "input", "assistant", etc.
  isArchived: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  areaId: string;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  progress: number; // 0 to 100
  color: string; // hex or tailwind color name
  icon: string; // Lucide icon name
  lastActivityAt: string; // ISO string
}

export interface Area {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // hex or tailwind color name
  order: number;
  isArchived: boolean;
}

export interface FocusSession {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string; // ISO string
  duration: number; // in minutes
  completed: boolean;
}

export interface WeeklyReview {
  id: string;
  weekStartDate: string; // YYYY-MM-DD
  completedTasksCount: number;
  delayedTasksCount: number;
  cancelledTasksCount: number;
  stagnantProjectsCount: number;
  priorities: string[]; // Top 3 priorities for next week
  notesAnswers: {
    q1: string; // O que foi concluído nesta semana?
    q2: string; // O que ficou atrasado?
    q3: string; // Quais tarefas devem ser canceladas?
    q4: string; // Quais projetos estão parados?
    q5: string; // Quais serão as três prioridades da próxima semana?
    q6: string; // Existe alguma tarefa sem área ou projeto?
    q7: string; // Alguma tarefa pode ser delegada ou automatizada?
  };
  createdAt: string;
}

export interface UserSettings {
  name: string;
  avatarUrl?: string;
  language: "pt" | "en";
  theme: "dark" | "light" | "system";
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD";
  weekStartsOn: 0 | 1; // 0: Sunday, 1: Monday
  workingHours: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
  notificationsEnabled: boolean;
  hideCompleted: boolean;
  confirmBeforeDelete: boolean;
  geminiApiKey?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  tags?: string[];
  isPinned?: boolean;
  areaId?: string;
  projectId?: string;
  transcription?: string;
}

export interface DatabaseSchema {
  areas: Area[];
  projects: Project[];
  tasks: Task[];
  notes?: Note[];
  focusSessions: FocusSession[];
  weeklyReviews: WeeklyReview[];
  settings: UserSettings;
}
