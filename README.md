# English Checks Desktop (`v0.1.0`)

Estúdio pessoal desktop (Windows) para treino de **pronúncia** e **escrita em inglês**, com avaliação por IA focada em interferências comuns de falantes de **Português Brasileiro (`pt-BR`)** e persistência local offline-first em SQLite.

---

## Recursos do MVP (`v0.1.0`)

- **Laboratório de Pronúncia:**
  - Seleção de microfone / interface de áudio USB (`navigator.mediaDevices.enumerateDevices()`).
  - Captura via Web Audio API / `MediaRecorder` (sem `Web Speech API`) com waveform em tempo real no `<canvas>`.
  - Reprodução comparativa da própria voz e referência nativa via `window.speechSynthesis` (com verificação de pacotes de voz `en-US` / `en-GB` no Windows SAPI).
  - Avaliação por palavra, nota acústica geral e dica articulatória focada em `PT-BR → EN`.
  - Atalhos: `Espaço` (gravar/parar), `R` (refazer), `Ctrl+R` (aleatório), `Enter` (próxima frase).
- **Revisão de Escrita (*Writing Check*):**
  - Avaliação por contexto (*Trabalho / Tech*, *E-mail*, *Conversa*, *Acadêmico*).
  - Nota de naturalidade, versão corrigida, alternativas mais naturais e explicações de gramática/calques do português (`Ctrl+Enter`).
- **Deck de Revisão & Progresso:**
  - Banco SQLite local (`better-sqlite3` + Drizzle ORM) com seed inicial de 10 frases e registro automático de erros recorrentes (`phoneme_errors`) e sessões (`study_sessions`).
- **Quick Check Overlay (`Ctrl+Shift+E`):**
  - Janela flutuante compacta (`560x340`, `alwaysOnTop`) para checagem rápida de pronúncia ou gramática de qualquer lugar do Windows (`Esc` oculta preservando o estado).
- **Bilíngue (`PT-BR` / `EN`) & Credenciais Seguras:**
  - Alternância de idioma para toda a interface e explicações da IA nas Configurações.
  - Chave da Gemini API armazenada criptografada via Electron `safeStorage` (Windows DPAPI) em `userData`.

---

## Arquitetura e Segurança

```text
src/
├── main/        # Main Process (Electron, SQLite/Drizzle, @google/genai, safeStorage, atalho global)
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
- `npm run typecheck` — executa `tsc --noEmit` separado para Node (`tsconfig.node.json`) e Web (`tsconfig.web.json`).
- `npm run build` — gera o build de produção em `out/`.
- `npm run preview` — pré-visualiza o build gerado.
- `npm run audit:deps` — executa auditoria de dependências (`npm audit`).

---

## Configuração da Gemini API Key

1. **Recomendado:** abra o app, clique no ícone de **engrenagem (Configurações)** na barra superior e salve sua chave do [Google AI Studio](https://aistudio.google.com/) — ela será criptografada localmente via `safeStorage`.
2. **Alternativa em desenvolvimento:** copie `.env.example` para `.env` na raiz e preencha `GEMINI_API_KEY`. Nunca faça commit do `.env`.

---

## Roadmap Planejado

- **`v0.2.0` — Trilhas & Novas Atividades:** trilhas guiadas de aprendizado (*Learning Tracks*), treino de pares mínimos (*Minimal Pairs*), *Active Recall* (`PT-BR → EN`), *Listening/Shadowing* e geração de exercícios sob demanda a partir de `phoneme_errors`.
- **`v0.3.0` — Produtividade Desktop:** Pomodoro centralizado no Main Process, integração com Windows System Tray e notificações nativas.
- **`v1.0.0` — Release Empacotada:** testes automatizados e instalador Windows NSIS (`.exe`) via `electron-builder` com migrations SQL via `extraResources`.
