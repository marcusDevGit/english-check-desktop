# English Checks Desktop (`v1.0.0`)

Estúdio pessoal desktop (Windows) para treino de **pronúncia**, **escrita** e **trilhas guiadas em inglês**, com avaliação por IA focada em interferências comuns de falantes de **Português Brasileiro (`pt-BR`)**, Pomodoro integrado à bandeja do Windows, currículo estruturado offline CEFR (`A2`–`C1`), suíte de testes e instalador Windows NSIS (`.exe`).

---

## Recursos (`v1.0.0`)

- **Rich Curriculum Engine & Roleplay Studio (6 Trilhas `A2`–`C1`):**
  - Pipeline _build-time_ (`npm run generate:tracks` via `scripts/generate-tracks.ts` + `scripts/sources/open-curriculum-raw.json`) validado por Zod (`src/shared/tracks-contracts.ts`) gerando `src/main/database/data/curriculum-seed.json` 100% offline.
  - Modelo SQLite em 3 níveis (`learning_tracks` → `lessons` → `lesson_activities`) com suporte a **Pre-Lesson Cheat Sheet** (_Chunking & Phrasal Verbs_ com IPA + áudio nativo), **Starter Chips** clicáveis (_scaffolding_) e player progressivo em **5 etapas**: **Shadowing**, **Listening Repeat**, **Open Q&A** (com timer), **Micro-Writing** e **Roleplay multi-turno** por texto ou áudio.
  - **"+ Criar Trilha de um Conteúdo Meu":** transforma artigos técnicos, anotações ou transcrições de podcast em trilhas offline com _Cheat Sheet_ e 5 etapas via Gemini.
- **Pomodoro no Main Process & Windows System Tray:**
  - Timer centralizado no Main Process (`25 min` foco / `5 min` pausa) sincronizado em tempo real com a barra superior (`TitleBar`) via `pomodoro:tick`.
  - Ícone na bandeja do sistema (_System Tray_) com tooltip ao vivo e menu de contexto (`Abrir English Checks`, `Quick Check`, `Iniciar/Pausar Pomodoro`, `Resetar Pomodoro`, `Sair`).
  - Fechar a janela principal oculta o app para a bandeja mantendo `Ctrl+Shift+E` ativo em segundo plano; blocos de foco concluídos são salvos em `study_sessions` e disparam `Notification` nativa do Windows.
- **Trilhas de Aprendizado (_Learning Tracks_) & 24 Atividades:**
  - 3 trilhas guiadas por nível CEFR (_Fonética Crítica PT-BR_, _Inglês Técnico & Reuniões de Dev_, _Conversação & Situações Reais_) com barra de progresso real em SQLite.
  - 4 modos de exercício: **Pronúncia**, **Pares Mínimos**, **Shadowing** (ouvir com texto oculto) e **Active Recall (`PT-BR → EN`)** com avaliação de sentido pelo Gemini.
- **Laboratório de Pronúncia:**
  - Seleção de microfone / interface de áudio USB (`navigator.mediaDevices.enumerateDevices()`).
  - Captura via Web Audio API / `MediaRecorder` (sem `Web Speech API`) com waveform em tempo real no `<canvas>`.
  - Reprodução comparativa da própria voz e referência nativa via `window.speechSynthesis` (com verificação de pacotes de voz `en-US` / `en-GB` no Windows SAPI).
  - Avaliação por palavra, nota acústica geral e dica articulatória focada em `PT-BR → EN`.
  - Atalhos: `Espaço` (gravar/parar), `R` (refazer), `Ctrl+R` (aleatório), `Enter` (próxima frase).
- **Revisão de Escrita (_Writing Check_):**
  - Avaliação por contexto (_Trabalho / Tech_, _E-mail_, _Conversa_, _Acadêmico_).
  - Nota de naturalidade, versão corrigida, alternativas mais naturais e explicações de gramática/calques do português (`Ctrl+Enter`).
- **Deck de Revisão com IA & Progresso:**
  - Banco SQLite local (`better-sqlite3` + Drizzle ORM) com registro automático de erros recorrentes (`phoneme_errors`) e sessões (`study_sessions`).
  - **Gerador de treinos com IA:** cria novas frases inéditas focadas nos seus principais erros em `phoneme_errors` com destaque visual (`Novo • IA` / `IA Personalizado`) e filtro rápido.
- **Quick Check Overlay (`Ctrl+Shift+E`):**
  - Janela flutuante compacta (`560x340`, `alwaysOnTop`) para checagem rápida de pronúncia ou gramática de qualquer lugar do Windows (`Esc` oculta preservando o estado).
- **Bilíngue (`PT-BR` / `EN`) & Credenciais Seguras:**
  - Alternância de idioma para toda a interface e explicações da IA nas Configurações.
  - Chave da Gemini API armazenada criptografada via Electron `safeStorage` (Windows DPAPI) em `userData`.

---

## Arquitetura e Segurança

```text
src/
├── main/        # Main Process (Electron, SQLite/Drizzle, @google/genai, safeStorage, Pomodoro, Tray, atalho global)
├── preload/     # Ponte segura (contextBridge -> window.englishChecks) com sandbox: true
├── renderer/    # Interface React 19 + TypeScript + Tailwind CSS v4 + Lucide Icons
└── shared/      # Canais IPC e contratos Zod (Single Source of Truth)
```

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Toda comunicação IPC passa por contratos `Zod` com retorno padronizado `{ ok: true, data } | { ok: false, error }`.
- Payloads de áudio são validados como `Uint8Array` + `mimeType` + `accent` (`'US' | 'UK'`).
- O SDK `@google/genai` (`gemini-3.8-flash` por padrão) executa exclusivamente no **Main Process**.

---

## Pré-requisitos e Execução

- **Sistema:** Windows 11 (ou Windows 10)
- **Node.js:** `>= 22.12.0` (testado com `v26.13.1` via `fnm`)

```powershell
# 1. Instalar dependências (postinstall executa install-electron automaticamente)
npm install

# 2. Rodar em desenvolvimento
npm run dev
```

### Scripts Disponíveis

- `npm run dev` — inicia `electron-vite` em modo desenvolvimento.
- `npm test` — executa os testes unitários nativos (`node --test tests/*.test.ts`).
- `npm run generate:tracks` — executa `scripts/generate-tracks.ts` para regenerar `curriculum-seed.json` via Gemini usando `GEMINI_API_KEY` do `.env`.
- `npm run typecheck` — executa `tsc --noEmit` separado para Node (`tsconfig.node.json`) e Web (`tsconfig.web.json`).
- `npm run build` — gera o build de produção em `out/`.
- `npm run dist:win` — gera o instalador Windows NSIS (`.exe`) em `dist/` via `electron-builder.yml`.
- `npm run preview` — pré-visualiza o build gerado.
- `npm run audit:deps` — executa auditoria de dependências (`npm audit`).

---

## Configuração da Gemini API Key

1. **Recomendado:** abra o app, clique no ícone de **engrenagem (Configurações)** na barra superior e salve sua chave do [Google AI Studio](https://aistudio.google.com/) — ela será criptografada localmente via `safeStorage`.
2. **Alternativa em desenvolvimento:** copie `.env.example` para `.env` na raiz e preencha `GEMINI_API_KEY`. Nunca faça commit do `.env`.

---

## Próximas Evoluções (`v1.1.0+`)

- **Pomodoro Avançado:** durações configuráveis de foco/pausa, pausa longa automática a cada 4 blocos e meta diária de pomodoros em `Progress & Stats`.
- **Analytics & Repetição Espaçada:** algoritmo FSRS v4.5 completo e gráficos longitudinais de evolução.
