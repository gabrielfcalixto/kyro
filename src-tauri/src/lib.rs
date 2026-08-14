use tauri_plugin_sql::{Migration, MigrationKind};

fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_kyro_schema",
        kind: MigrationKind::Up,
        sql: r#"
            CREATE TABLE areas (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT NOT NULL DEFAULT 'Folder',
                color TEXT NOT NULL DEFAULT '#3b82f6',
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                area_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Planejado',
                priority TEXT NOT NULL DEFAULT 'Média',
                start_date TEXT,
                due_date TEXT,
                progress INTEGER NOT NULL DEFAULT 0,
                color TEXT NOT NULL DEFAULT '#3b82f6',
                icon TEXT NOT NULL DEFAULT 'Target',
                last_activity_at TEXT NOT NULL
            );

            CREATE TABLE tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Pendente',
                priority TEXT NOT NULL DEFAULT 'Sem prioridade',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                due_date TEXT,
                due_time TEXT,
                completed_at TEXT,
                area_id TEXT NOT NULL,
                project_id TEXT,
                tags TEXT NOT NULL DEFAULT '[]',
                subtasks TEXT NOT NULL DEFAULT '[]',
                notes TEXT,
                recurrence TEXT NOT NULL DEFAULT 'none',
                estimated_duration INTEGER,
                time_spent INTEGER NOT NULL DEFAULT 0,
                manual_order INTEGER NOT NULL DEFAULT 0,
                source TEXT NOT NULL DEFAULT 'input',
                is_archived INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX idx_tasks_area ON tasks(area_id);
            CREATE INDEX idx_tasks_project ON tasks(project_id);
            CREATE INDEX idx_tasks_archived ON tasks(is_archived);

            CREATE TABLE notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                tags TEXT NOT NULL DEFAULT '[]',
                is_pinned INTEGER NOT NULL DEFAULT 0,
                area_id TEXT,
                project_id TEXT,
                transcription TEXT
            );

            CREATE TABLE focus_sessions (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                task_title TEXT NOT NULL DEFAULT '',
                start_time TEXT NOT NULL,
                duration INTEGER NOT NULL DEFAULT 25,
                completed INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE weekly_reviews (
                id TEXT PRIMARY KEY,
                week_start_date TEXT NOT NULL,
                completed_tasks_count INTEGER NOT NULL DEFAULT 0,
                delayed_tasks_count INTEGER NOT NULL DEFAULT 0,
                cancelled_tasks_count INTEGER NOT NULL DEFAULT 0,
                stagnant_projects_count INTEGER NOT NULL DEFAULT 0,
                priorities TEXT NOT NULL DEFAULT '[]',
                notes_answers TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL
            );

            CREATE TABLE settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                name TEXT NOT NULL DEFAULT 'Usuário',
                avatar_url TEXT,
                language TEXT NOT NULL DEFAULT 'pt',
                theme TEXT NOT NULL DEFAULT 'dark',
                date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
                week_starts_on INTEGER NOT NULL DEFAULT 1,
                working_hours TEXT NOT NULL DEFAULT '{"start":"08:00","end":"18:00"}',
                notifications_enabled INTEGER NOT NULL DEFAULT 1,
                hide_completed INTEGER NOT NULL DEFAULT 0,
                confirm_before_delete INTEGER NOT NULL DEFAULT 1,
                gemini_api_key TEXT
            );

            INSERT INTO areas (id, name, icon, color, sort_order, is_archived) VALUES
                ('area-1', 'TechSelos', 'Cpu', '#3b82f6', 1, 0),
                ('area-2', 'Louvart App Web', 'Globe', '#06b6d4', 2, 0),
                ('area-3', 'Louvart App Mobile', 'Smartphone', '#8b5cf6', 3, 0),
                ('area-4', 'Pessoal', 'User', '#10b981', 4, 0),
                ('area-5', 'Estudos', 'BookOpen', '#f59e0b', 5, 0),
                ('area-6', 'Igreja', 'Church', '#ec4899', 6, 0),
                ('area-7', 'Finanças', 'DollarSign', '#10b981', 7, 0),
                ('area-8', 'Ideias', 'Lightbulb', '#eab308', 8, 0);

            INSERT INTO settings (id, name, language, theme, date_format, week_starts_on, working_hours, notifications_enabled, hide_completed, confirm_before_delete)
            VALUES (1, 'Gabriel', 'pt', 'dark', 'DD/MM/YYYY', 1, '{"start":"08:00","end":"18:00"}', 1, 0, 1);
        "#,
    }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:kyro.db", migrations())
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running Kyro");
}
