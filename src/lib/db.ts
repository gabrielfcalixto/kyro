import Database from "@tauri-apps/plugin-sql";
import {
  Area,
  Project,
  Task,
  Note,
  FocusSession,
  WeeklyReview,
  UserSettings,
  ProjectStatus
} from "../types";

const DB_URL = "sqlite:kyro.db";

let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(DB_URL);
  }
  return dbPromise;
}

const toBool = (v: unknown) => v === 1 || v === true;
const toInt = (v: boolean) => (v ? 1 : 0);
const parseJson = <T,>(v: unknown, fallback: T): T => {
  if (v === null || v === undefined) return fallback;
  try {
    return JSON.parse(v as string) as T;
  } catch {
    return fallback;
  }
};

// ---------- Row <-> Domain mappers ----------

function areaFromRow(r: any): Area {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    order: r.sort_order,
    isArchived: toBool(r.is_archived)
  };
}

function projectFromRow(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    areaId: r.area_id,
    status: r.status,
    priority: r.priority,
    startDate: r.start_date ?? undefined,
    dueDate: r.due_date ?? undefined,
    progress: r.progress,
    color: r.color,
    icon: r.icon,
    lastActivityAt: r.last_activity_at
  };
}

function taskFromRow(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    status: r.status,
    priority: r.priority,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    dueDate: r.due_date ?? undefined,
    dueTime: r.due_time ?? undefined,
    completedAt: r.completed_at ?? undefined,
    areaId: r.area_id,
    projectId: r.project_id ?? undefined,
    tags: parseJson<string[]>(r.tags, []),
    subtasks: parseJson(r.subtasks, []),
    notes: r.notes ?? undefined,
    recurrence: r.recurrence,
    estimatedDuration: r.estimated_duration ?? undefined,
    timeSpent: r.time_spent,
    manualOrder: r.manual_order,
    source: r.source,
    isArchived: toBool(r.is_archived)
  };
}

function noteFromRow(r: any): Note {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    tags: parseJson<string[]>(r.tags, []),
    isPinned: toBool(r.is_pinned),
    areaId: r.area_id ?? undefined,
    projectId: r.project_id ?? undefined,
    transcription: r.transcription ?? undefined
  };
}

function focusSessionFromRow(r: any): FocusSession {
  return {
    id: r.id,
    taskId: r.task_id,
    taskTitle: r.task_title,
    startTime: r.start_time,
    duration: r.duration,
    completed: toBool(r.completed)
  };
}

function weeklyReviewFromRow(r: any): WeeklyReview {
  return {
    id: r.id,
    weekStartDate: r.week_start_date,
    completedTasksCount: r.completed_tasks_count,
    delayedTasksCount: r.delayed_tasks_count,
    cancelledTasksCount: r.cancelled_tasks_count,
    stagnantProjectsCount: r.stagnant_projects_count,
    priorities: parseJson<string[]>(r.priorities, []),
    notesAnswers: parseJson(r.notes_answers, {
      q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: ""
    }),
    createdAt: r.created_at
  };
}

function settingsFromRow(r: any): UserSettings {
  return {
    name: r.name,
    avatarUrl: r.avatar_url ?? undefined,
    language: r.language,
    theme: r.theme,
    dateFormat: r.date_format,
    weekStartsOn: r.week_starts_on,
    workingHours: parseJson(r.working_hours, { start: "08:00", end: "18:00" }),
    notificationsEnabled: toBool(r.notifications_enabled),
    hideCompleted: toBool(r.hide_completed),
    confirmBeforeDelete: toBool(r.confirm_before_delete),
    geminiApiKey: r.gemini_api_key ?? undefined
  };
}

// ---------- Areas ----------

export async function listAreas(): Promise<Area[]> {
  const db = await getDb();
  const rows = await db.select<any[]>(
    "SELECT * FROM areas WHERE is_archived = 0 ORDER BY sort_order ASC"
  );
  return rows.map(areaFromRow);
}

export async function insertArea(area: Area): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO areas (id, name, icon, color, sort_order, is_archived) VALUES ($1,$2,$3,$4,$5,$6)`,
    [area.id, area.name, area.icon, area.color, area.order, toInt(area.isArchived)]
  );
}

export async function updateAreaRow(id: string, patch: Partial<Area>): Promise<void> {
  const db = await getDb();
  const current = await db.select<any[]>("SELECT * FROM areas WHERE id = $1", [id]);
  if (!current.length) return;
  const merged = { ...areaFromRow(current[0]), ...patch };
  await db.execute(
    `UPDATE areas SET name=$1, icon=$2, color=$3, sort_order=$4, is_archived=$5 WHERE id=$6`,
    [merged.name, merged.icon, merged.color, merged.order, toInt(merged.isArchived), id]
  );
}

export async function archiveAreaRow(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE areas SET is_archived = 1 WHERE id = $1", [id]);
}

// ---------- Projects ----------

export async function listProjects(): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.select<any[]>(
    "SELECT * FROM projects WHERE status != $1 ORDER BY last_activity_at DESC",
    [ProjectStatus.ARCHIVED]
  );
  return rows.map(projectFromRow);
}

export async function insertProject(project: Project): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO projects (id, name, description, area_id, status, priority, start_date, due_date, progress, color, icon, last_activity_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      project.id, project.name, project.description ?? "", project.areaId, project.status,
      project.priority, project.startDate ?? null, project.dueDate ?? null, project.progress,
      project.color, project.icon, project.lastActivityAt
    ]
  );
}

export async function updateProjectRow(id: string, patch: Partial<Project>): Promise<Project | null> {
  const db = await getDb();
  const current = await db.select<any[]>("SELECT * FROM projects WHERE id = $1", [id]);
  if (!current.length) return null;
  const merged: Project = { ...projectFromRow(current[0]), ...patch, id };
  await db.execute(
    `UPDATE projects SET name=$1, description=$2, area_id=$3, status=$4, priority=$5, start_date=$6,
     due_date=$7, progress=$8, color=$9, icon=$10, last_activity_at=$11 WHERE id=$12`,
    [
      merged.name, merged.description ?? "", merged.areaId, merged.status, merged.priority,
      merged.startDate ?? null, merged.dueDate ?? null, merged.progress, merged.color,
      merged.icon, merged.lastActivityAt, id
    ]
  );
  return merged;
}

export async function archiveProjectRow(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE projects SET status = $1 WHERE id = $2", [ProjectStatus.ARCHIVED, id]);
}

export async function recalcProjectProgress(projectId: string): Promise<void> {
  const db = await getDb();
  const rows = await db.select<any[]>(
    "SELECT status FROM tasks WHERE project_id = $1 AND is_archived = 0",
    [projectId]
  );
  const total = rows.length;
  const completed = rows.filter(r => r.status === "Concluída").length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  await db.execute(
    "UPDATE projects SET progress = $1, last_activity_at = $2 WHERE id = $3",
    [progress, new Date().toISOString(), projectId]
  );
}

// ---------- Tasks ----------

export async function listTasks(): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.select<any[]>(
    "SELECT * FROM tasks WHERE is_archived = 0 ORDER BY manual_order ASC"
  );
  return rows.map(taskFromRow);
}

export async function nextManualOrder(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<any[]>("SELECT COALESCE(MAX(manual_order), 0) as m FROM tasks");
  return (rows[0]?.m ?? 0) + 1;
}

export async function insertTask(task: Task): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO tasks (id, title, description, status, priority, created_at, updated_at, due_date, due_time,
      completed_at, area_id, project_id, tags, subtasks, notes, recurrence, estimated_duration, time_spent,
      manual_order, source, is_archived)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      task.id, task.title, task.description ?? "", task.status, task.priority, task.createdAt,
      task.updatedAt, task.dueDate ?? null, task.dueTime ?? null, task.completedAt ?? null,
      task.areaId, task.projectId ?? null, JSON.stringify(task.tags ?? []),
      JSON.stringify(task.subtasks ?? []), task.notes ?? null, task.recurrence,
      task.estimatedDuration ?? null, task.timeSpent ?? 0, task.manualOrder, task.source,
      toInt(task.isArchived)
    ]
  );
}

export async function getTaskRow(id: string): Promise<Task | null> {
  const db = await getDb();
  const rows = await db.select<any[]>("SELECT * FROM tasks WHERE id = $1", [id]);
  return rows.length ? taskFromRow(rows[0]) : null;
}

export async function updateTaskRow(id: string, patch: Partial<Task>): Promise<Task | null> {
  const db = await getDb();
  const current = await db.select<any[]>("SELECT * FROM tasks WHERE id = $1", [id]);
  if (!current.length) return null;
  const merged: Task = { ...taskFromRow(current[0]), ...patch, id };
  await db.execute(
    `UPDATE tasks SET title=$1, description=$2, status=$3, priority=$4, updated_at=$5, due_date=$6,
     due_time=$7, completed_at=$8, area_id=$9, project_id=$10, tags=$11, subtasks=$12, notes=$13,
     recurrence=$14, estimated_duration=$15, time_spent=$16, manual_order=$17, source=$18, is_archived=$19
     WHERE id=$20`,
    [
      merged.title, merged.description ?? "", merged.status, merged.priority, merged.updatedAt,
      merged.dueDate ?? null, merged.dueTime ?? null, merged.completedAt ?? null, merged.areaId,
      merged.projectId ?? null, JSON.stringify(merged.tags ?? []), JSON.stringify(merged.subtasks ?? []),
      merged.notes ?? null, merged.recurrence, merged.estimatedDuration ?? null, merged.timeSpent ?? 0,
      merged.manualOrder, merged.source, toInt(merged.isArchived), id
    ]
  );
  return merged;
}

export async function archiveTaskRow(id: string): Promise<Task | null> {
  const db = await getDb();
  return updateTaskRow(id, { isArchived: true, status: "Arquivada" as Task["status"] });
}

// ---------- Notes ----------

export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.select<any[]>("SELECT * FROM notes ORDER BY is_pinned DESC, created_at DESC");
  return rows.map(noteFromRow);
}

export async function insertNote(note: Note): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO notes (id, title, content, created_at, updated_at, tags, is_pinned, area_id, project_id, transcription)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      note.id, note.title, note.content, note.createdAt, note.updatedAt,
      JSON.stringify(note.tags ?? []), toInt(!!note.isPinned), note.areaId ?? null,
      note.projectId ?? null, note.transcription ?? null
    ]
  );
}

export async function updateNoteRow(id: string, patch: Partial<Note>): Promise<Note | null> {
  const db = await getDb();
  const current = await db.select<any[]>("SELECT * FROM notes WHERE id = $1", [id]);
  if (!current.length) return null;
  const merged: Note = { ...noteFromRow(current[0]), ...patch, id };
  await db.execute(
    `UPDATE notes SET title=$1, content=$2, updated_at=$3, tags=$4, is_pinned=$5, area_id=$6, project_id=$7, transcription=$8
     WHERE id=$9`,
    [
      merged.title, merged.content, merged.updatedAt, JSON.stringify(merged.tags ?? []),
      toInt(!!merged.isPinned), merged.areaId ?? null, merged.projectId ?? null,
      merged.transcription ?? null, id
    ]
  );
  return merged;
}

export async function deleteNoteRow(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM notes WHERE id = $1", [id]);
}

// ---------- Focus sessions ----------

export async function listFocusSessions(): Promise<FocusSession[]> {
  const db = await getDb();
  const rows = await db.select<any[]>("SELECT * FROM focus_sessions ORDER BY start_time DESC");
  return rows.map(focusSessionFromRow);
}

export async function insertFocusSession(session: FocusSession): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO focus_sessions (id, task_id, task_title, start_time, duration, completed) VALUES ($1,$2,$3,$4,$5,$6)`,
    [session.id, session.taskId, session.taskTitle, session.startTime, session.duration, toInt(session.completed)]
  );
}

// ---------- Weekly reviews ----------

export async function listWeeklyReviews(): Promise<WeeklyReview[]> {
  const db = await getDb();
  const rows = await db.select<any[]>("SELECT * FROM weekly_reviews ORDER BY created_at DESC");
  return rows.map(weeklyReviewFromRow);
}

export async function insertWeeklyReview(review: WeeklyReview): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO weekly_reviews (id, week_start_date, completed_tasks_count, delayed_tasks_count,
      cancelled_tasks_count, stagnant_projects_count, priorities, notes_answers, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      review.id, review.weekStartDate, review.completedTasksCount, review.delayedTasksCount,
      review.cancelledTasksCount, review.stagnantProjectsCount, JSON.stringify(review.priorities ?? []),
      JSON.stringify(review.notesAnswers), review.createdAt
    ]
  );
}

// ---------- Settings ----------

export async function getSettingsRow(): Promise<UserSettings> {
  const db = await getDb();
  const rows = await db.select<any[]>("SELECT * FROM settings WHERE id = 1");
  return settingsFromRow(rows[0]);
}

export async function updateSettingsRow(patch: Partial<UserSettings>): Promise<UserSettings> {
  const db = await getDb();
  const current = await getSettingsRow();
  const merged: UserSettings = { ...current, ...patch };
  await db.execute(
    `UPDATE settings SET name=$1, avatar_url=$2, language=$3, theme=$4, date_format=$5, week_starts_on=$6,
     working_hours=$7, notifications_enabled=$8, hide_completed=$9, confirm_before_delete=$10, gemini_api_key=$11
     WHERE id = 1`,
    [
      merged.name, merged.avatarUrl ?? null, merged.language, merged.theme, merged.dateFormat,
      merged.weekStartsOn, JSON.stringify(merged.workingHours), toInt(merged.notificationsEnabled),
      toInt(merged.hideCompleted), toInt(merged.confirmBeforeDelete), merged.geminiApiKey ?? null
    ]
  );
  return merged;
}

// ---------- Full backup / reset ----------

export interface FullBackup {
  areas: Area[];
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  focusSessions: FocusSession[];
  weeklyReviews: WeeklyReview[];
  settings: UserSettings;
}

export async function exportFullBackup(): Promise<FullBackup> {
  const [areas, projects, tasks, notes, focusSessions, weeklyReviews, settings] = await Promise.all([
    listAreas(), listProjects(), listTasks(), listNotes(), listFocusSessions(), listWeeklyReviews(), getSettingsRow()
  ]);
  return { areas, projects, tasks, notes, focusSessions, weeklyReviews, settings };
}

async function clearAllTables(db: Database): Promise<void> {
  await db.execute("DELETE FROM tasks");
  await db.execute("DELETE FROM projects");
  await db.execute("DELETE FROM areas");
  await db.execute("DELETE FROM notes");
  await db.execute("DELETE FROM focus_sessions");
  await db.execute("DELETE FROM weekly_reviews");
}

export async function importFullBackupRows(data: Partial<FullBackup>): Promise<void> {
  const db = await getDb();
  await clearAllTables(db);

  for (const area of data.areas ?? []) await insertArea(area);
  for (const project of data.projects ?? []) await insertProject(project);
  for (const task of data.tasks ?? []) await insertTask(task);
  for (const note of data.notes ?? []) await insertNote(note);
  for (const session of data.focusSessions ?? []) await insertFocusSession(session);
  for (const review of data.weeklyReviews ?? []) await insertWeeklyReview(review);
  if (data.settings) await updateSettingsRow(data.settings);
}

const DEFAULT_AREAS: Area[] = [
  { id: "area-1", name: "TechSelos", icon: "Cpu", color: "#3b82f6", order: 1, isArchived: false },
  { id: "area-2", name: "Louvart App Web", icon: "Globe", color: "#06b6d4", order: 2, isArchived: false },
  { id: "area-3", name: "Louvart App Mobile", icon: "Smartphone", color: "#8b5cf6", order: 3, isArchived: false },
  { id: "area-4", name: "Pessoal", icon: "User", color: "#10b981", order: 4, isArchived: false },
  { id: "area-5", name: "Estudos", icon: "BookOpen", color: "#f59e0b", order: 5, isArchived: false },
  { id: "area-6", name: "Igreja", icon: "Church", color: "#ec4899", order: 6, isArchived: false },
  { id: "area-7", name: "Finanças", icon: "DollarSign", color: "#10b981", order: 7, isArchived: false },
  { id: "area-8", name: "Ideias", icon: "Lightbulb", color: "#eab308", order: 8, isArchived: false }
];

export async function resetToFactoryDefaults(): Promise<void> {
  const db = await getDb();
  await clearAllTables(db);
  for (const area of DEFAULT_AREAS) await insertArea(area);
  await updateSettingsRow({
    name: "Gabriel",
    language: "pt",
    theme: "dark",
    dateFormat: "DD/MM/YYYY",
    weekStartsOn: 1,
    workingHours: { start: "08:00", end: "18:00" },
    notificationsEnabled: true,
    hideCompleted: false,
    confirmBeforeDelete: true,
    geminiApiKey: undefined
  });
}
