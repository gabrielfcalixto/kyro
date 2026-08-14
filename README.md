# Kyro Desktop

App desktop de produtividade (tarefas, projetos, áreas de foco, anotações e captura por voz), construído com Tauri v2 + React. Todos os dados ficam em um banco SQLite local — nada é enviado para nenhum servidor, exceto chamadas opcionais à API do Gemini quando uma chave é configurada em Configurações.

## Rodando em desenvolvimento

**Pré-requisitos:** Node.js e o toolchain do Rust (`rustup`).

1. Instale as dependências:
   `npm install`
2. Rode o app desktop:
   `npm run tauri dev`

## Build de produção

`npm run tauri build`

Gera o instalador nativo em `src-tauri/target/release/bundle`.

## Dados

O banco SQLite (`kyro.db`) fica no diretório de dados do app gerenciado pelo Tauri (não versionado, não fica dentro da pasta do projeto). Use a tela de Configurações para exportar/importar backups em JSON ou restaurar os padrões de fábrica.

## IA (opcional)

Para habilitar a captura de tarefas e anotações por voz/linguagem natural via Gemini, cole sua chave de API em Configurações. Sem chave configurada, o Kyro usa um interpretador de regras local (offline).
