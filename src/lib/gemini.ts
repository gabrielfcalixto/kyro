import { GoogleGenAI, Type } from "@google/genai";
import { listAreas, listProjects, getSettingsRow } from "./db";
import { TaskPriority } from "../types";

export interface ParsedTaskResult {
  transcription?: string;
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: TaskPriority;
  areaId: string | null;
  projectId: string | null;
  recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";
  tags: string[];
  source?: string;
  error?: string;
}

const MODEL = "gemini-3.5-flash";

async function getApiKey(): Promise<string | null> {
  const settings = await getSettingsRow();
  return settings.geminiApiKey && settings.geminiApiKey.trim().length > 0 ? settings.geminiApiKey.trim() : null;
}

function taskResponseSchema(requireDueDate: boolean) {
  return {
    type: Type.OBJECT,
    properties: {
      transcription: { type: Type.STRING, description: "Transcrição fiel do áudio, se aplicável" },
      title: { type: Type.STRING, description: "Título curto, limpo e direto da tarefa" },
      dueDate: { type: Type.STRING, description: "Data de vencimento YYYY-MM-DD ou null" },
      dueTime: { type: Type.STRING, description: "Horário de vencimento HH:MM ou null" },
      priority: { type: Type.STRING, description: "Urgente, Alta, Média, Baixa, ou Sem prioridade" },
      areaId: { type: Type.STRING, description: "ID da área existente correspondente ou null" },
      projectId: { type: Type.STRING, description: "ID do projeto existente correspondente ou null" },
      recurrence: { type: Type.STRING, description: "recorrência da tarefa" },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags sugeridas" }
    },
    required: requireDueDate
      ? ["title", "dueDate", "priority", "recurrence", "tags"]
      : ["transcription", "title", "dueDate", "priority", "recurrence", "tags"]
  };
}

async function buildTaskPromptContext() {
  const [areas, projects] = await Promise.all([listAreas(), listProjects()]);
  const today = new Date();
  const dateContext = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const areaNames = areas.map(a => a.name).join(", ");
  const projectList = projects.map(p => `"${p.name}" (ID: ${p.id}, Área: ${p.areaId})`).join("\n");
  return { areas, projects, dateContext, areaNames, projectList, todayIso: toIsoDate(today) };
}

function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function buildTaskPrompt(dateContext: string, areaNames: string, projectList: string, extra: string) {
  return `${extra}
A data de hoje é: ${dateContext}.

Áreas existentes no sistema: ${areaNames}
Projetos existentes no sistema:
${projectList}

Por favor, mapeie com precisão os seguintes campos no objeto JSON retornado:
- "title" (string): Título limpo e conciso da tarefa. Remova palavras de tempo/áreas/prioridades do título de forma elegante.
- "dueDate" (string ou null): Data estimada no formato YYYY-MM-DD, relativa à data de hoje informada acima.
- "dueTime" (string ou null): Horário opcional citado (ex: "às 19h" -> "19:00", "à tarde" -> "14:00"). Formato HH:MM.
- "priority" (string): Um destes valores exatos: "Urgente", "Alta", "Média", "Baixa", "Sem prioridade". Priorize "Alta" ou "Urgente" se houver termos como "urgente", "crítico", "rápido", "importante", "até amanhã".
- "areaId" (string ou null): ID da área correspondente se detectada. Caso contrário, sugira a correspondente mais próxima das áreas existentes ou retorne null.
- "projectId" (string ou null): ID do projeto correspondente se detectada forte associação por termos.
- "recurrence" (string): Um destes valores: "none", "daily", "weekdays", "weekly", "monthly", "yearly". Detecte se houver termos de repetição ("diariamente", "todo dia", "toda semana", "todo domingo", "mensalmente").
- "tags" (array de strings): Etiquetas sugeridas relevantes.

Retorne EXCLUSIVAMENTE o objeto JSON correspondente, sem markdown extra.`;
}

// ---------- Natural language text parsing ----------

export async function parseNaturalLanguage(text: string): Promise<ParsedTaskResult> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return { ...runLocalParser(text), source: "local_rules" };
  }

  try {
    const { dateContext, areaNames, projectList } = await buildTaskPromptContext();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildTaskPrompt(
      dateContext,
      areaNames,
      projectList,
      `Analise a frase em linguagem natural do usuário e retorne um objeto JSON contendo dados estruturados para uma tarefa.\n\nEntrada do usuário: "${text}"`
    );

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: taskResponseSchema(true)
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return { ...parsed, source: MODEL };
  } catch (err) {
    console.error("Gemini parsing error, using local rule parser:", err);
    return { ...runLocalParser(text), source: "local_rules_fallback" };
  }
}

// ---------- Audio -> task parsing ----------

export async function parseAudioLanguage(audioData: string, mimeType: string): Promise<ParsedTaskResult> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return {
      title: "",
      dueDate: null,
      dueTime: null,
      priority: TaskPriority.NONE,
      areaId: null,
      projectId: null,
      recurrence: "none",
      tags: [],
      error: "A chave de API do Gemini não está configurada. Adicione-a em Configurações para usar a captura por voz."
    };
  }

  try {
    const { dateContext, areaNames, projectList } = await buildTaskPromptContext();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildTaskPrompt(
      dateContext,
      areaNames,
      projectList,
      `Analise este áudio gravado em português pelo usuário.\nPrimeiro, transcreva fielmente o que o usuário disse (remova gaguejos, mantenha o sentido).\nDepois, extraia os dados estruturados para uma tarefa baseada no áudio transcrito.\nInclua também o campo "transcription" com a transcrição completa.`
    );

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ inlineData: { mimeType: mimeType.split(";")[0], data: audioData } }, { text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: taskResponseSchema(false)
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return { ...parsed, source: `${MODEL}-audio` };
  } catch (err) {
    console.error("Erro no processamento de áudio com Gemini:", err);
    return {
      title: "",
      dueDate: null,
      dueTime: null,
      priority: TaskPriority.NONE,
      areaId: null,
      projectId: null,
      recurrence: "none",
      tags: [],
      error: "Erro no processamento de áudio com Gemini: " + (err as Error).message
    };
  }
}

// ---------- Audio -> note transcription ----------

export interface TranscribedNote {
  title: string;
  content: string;
  transcription: string;
  tags: string[];
  areaId: string | null;
  projectId: string | null;
  error?: string;
}

export async function transcribeNoteAudio(audioData: string, mimeType: string): Promise<TranscribedNote> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return {
      title: "Anotação por Áudio",
      content: "Áudio recebido e salvo. Transcrição por IA indisponível sem chave de API configurada.",
      transcription: "Áudio gravado.",
      tags: ["áudio"],
      areaId: null,
      projectId: null
    };
  }

  try {
    const { areaNames, projectList } = await buildTaskPromptContext();
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é um assistente inteligente de anotações.
Analise este áudio gravado em português pelo usuário.
1. Transcreva com fidelidade e clareza o que o usuário disse (corrija gaguejos e mantenha o significado exato).
2. Organize o conteúdo em uma anotação bem estruturada com um título curto e expressivo, e o conteúdo formatado de forma clara em português.
3. Identifique se o assunto se relaciona com alguma Área de Foco: [${areaNames}] ou Projeto: [${projectList}].
4. Sugira 2 a 4 tags/etiquetas para facilitar a organização.

Mapeie os campos no objeto JSON retornado:
- "transcription": (string) Transcrição pura e limpa do áudio em português.
- "title": (string) Título resumido, direto e profissional para a anotação.
- "content": (string) Conteúdo principal da nota organizado de forma legível.
- "tags": (array de strings) Etiquetas relevantes.
- "areaId": (string ou null) ID de uma área existente correspondente ou null.
- "projectId": (string ou null) ID de um projeto existente correspondente ou null.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ inlineData: { mimeType: mimeType.split(";")[0], data: audioData } }, { text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING },
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            areaId: { type: Type.STRING },
            projectId: { type: Type.STRING }
          },
          required: ["transcription", "title", "content", "tags"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (err) {
    console.error("Erro no processamento do áudio para anotação:", err);
    return {
      title: "Anotação de Áudio",
      content: "Áudio recebido com sucesso. Você pode digitar os detalhes da anotação aqui.",
      transcription: "",
      tags: ["áudio"],
      areaId: null,
      projectId: null,
      error: (err as Error).message
    };
  }
}

// ---------- Offline / keyless local rule-based parser (pt-BR) ----------

const WEEKDAYS: { names: string[]; dow: number }[] = [
  { names: ["domingo"], dow: 0 },
  { names: ["segunda-feira", "segunda"], dow: 1 },
  { names: ["terça-feira", "terça", "terca"], dow: 2 },
  { names: ["quarta-feira", "quarta"], dow: 3 },
  { names: ["quinta-feira", "quinta"], dow: 4 },
  { names: ["sexta-feira", "sexta"], dow: 5 },
  { names: ["sábado", "sabado"], dow: 6 }
];

export function runLocalParser(text: string): ParsedTaskResult {
  const lower = text.toLowerCase();
  let title = text;
  let dueDate: string | null = null;
  let dueTime: string | null = null;
  let priority = TaskPriority.NONE;
  let areaId = "area-4"; // Default Pessoal
  let projectId: string | null = null;
  let recurrence: ParsedTaskResult["recurrence"] = "none";
  const tags: string[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Priority
  if (lower.includes("urgente") || lower.includes("crítico") || lower.includes("imediatamente")) {
    priority = TaskPriority.URGENT;
  } else if (lower.includes("alta") || lower.includes("importante") || lower.includes("prioridade")) {
    priority = TaskPriority.HIGH;
  } else if (lower.includes("média") || lower.includes("razoável")) {
    priority = TaskPriority.MEDIUM;
  } else if (lower.includes("baixa") || lower.includes("quando der")) {
    priority = TaskPriority.LOW;
  }

  // Recurrence
  if (lower.includes("diariamente") || lower.includes("todo dia")) {
    recurrence = "daily";
  } else if (lower.includes("dias úteis") || lower.includes("segunda a sexta")) {
    recurrence = "weekdays";
  } else if (lower.includes("semanalmente") || lower.includes("toda semana") || /todo(a)? (domingo|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado)/.test(lower)) {
    recurrence = "weekly";
  } else if (lower.includes("mensalmente") || lower.includes("todo mês") || lower.includes("todo mes")) {
    recurrence = "monthly";
  }

  // Date
  const matchedWeekday = WEEKDAYS.find(w => w.names.some(n => lower.includes(n)));

  if (lower.includes("hoje")) {
    dueDate = toIsoDate(today);
  } else if (lower.includes("depois de amanhã") || lower.includes("depois de amanha")) {
    const d = new Date(today);
    d.setDate(today.getDate() + 2);
    dueDate = toIsoDate(d);
  } else if (lower.includes("amanhã") || lower.includes("amanha")) {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    dueDate = toIsoDate(d);
  } else if (lower.includes("semana que vem") || lower.includes("próxima semana") || lower.includes("proxima semana")) {
    const d = new Date(today);
    d.setDate(today.getDate() + 7);
    dueDate = toIsoDate(d);
  } else if (lower.includes("mês que vem") || lower.includes("mes que vem")) {
    const d = new Date(today);
    d.setMonth(today.getMonth() + 1);
    dueDate = toIsoDate(d);
  } else if (matchedWeekday) {
    const d = new Date(today);
    const offset = (matchedWeekday.dow - today.getDay() + 7) % 7;
    d.setDate(today.getDate() + (lower.includes("próxima") || lower.includes("proxima") ? offset + 7 : offset));
    dueDate = toIsoDate(d);
  }

  // Time (e.g. "às 19h", "às 14:30")
  const timeRegex = /às\s+(\d{1,2})(?:h|:(\d{2}))/i;
  const match = lower.match(timeRegex);
  if (match) {
    const hours = match[1].padStart(2, "0");
    const minutes = (match[2] || "00").padStart(2, "0");
    dueTime = `${hours}:${minutes}`;
  } else if (lower.includes("à tarde") || lower.includes("a tarde")) {
    dueTime = "14:00";
  } else if (lower.includes("à noite") || lower.includes("a noite")) {
    dueTime = "20:00";
  } else if (lower.includes("de manhã") || lower.includes("de manha")) {
    dueTime = "09:00";
  }

  // Area / Project heuristics
  if (lower.includes("techselos") || lower.includes("techselo")) {
    areaId = "area-1";
    projectId = "proj-2";
    tags.push("techselos");
  } else if (lower.includes("louvart") && lower.includes("web")) {
    areaId = "area-2";
    tags.push("louvart", "web");
  } else if (lower.includes("louvart") && lower.includes("mobile")) {
    areaId = "area-3";
    projectId = "proj-3";
    tags.push("louvart", "mobile");
  } else if (lower.includes("estud") || lower.includes("java") || lower.includes("oca")) {
    areaId = "area-5";
    if (lower.includes("java") || lower.includes("oca")) projectId = "proj-1";
    tags.push("estudos");
  } else if (lower.includes("igreja") || lower.includes("ensaio") || lower.includes("bíblia") || lower.includes("biblia") || lower.includes("repertório") || lower.includes("repertorio")) {
    areaId = "area-6";
    tags.push("igreja");
  } else if (lower.includes("finanças") || lower.includes("financas") || lower.includes("orçamento") || lower.includes("orcamento") || lower.includes("dinheiro") || lower.includes("pagar")) {
    areaId = "area-7";
    tags.push("finanças");
  } else if (lower.includes("ideia") || lower.includes("insight")) {
    areaId = "area-8";
    tags.push("ideia");
  }

  // Clean title from common command markers
  title = text
    .replace(/pr[oó]xima\s+(segunda|ter[cç]a|quarta|quinta|sexta)(-feira)?|\b(segunda|ter[cç]a|quarta|quinta|sexta)(-feira)?\b|domingo|s[aá]bado/gi, "")
    .replace(/amanh[ãa] às \d+h\d*|amanh[ãa] às \d+:\d+|depois de amanh[ãa]|amanh[ãa]/gi, "")
    .replace(/hoje às \d+h\d*|hoje às \d+:\d+|hoje/gi, "")
    .replace(/semana que vem|pr[oó]xima semana|m[eê]s que vem/gi, "")
    .replace(/às\s+\d{1,2}(?:h|:\d{2})/gi, "")
    .replace(/à tarde|à noite|de manhã/gi, "")
    .replace(/no\s+techselos|na\s+louvart|para\s+o\s+ensaio|na\s+igreja/gi, "")
    .trim();

  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } else {
    title = text;
  }

  return { title, dueDate, dueTime, priority, areaId, projectId, recurrence, tags };
}
