import type { AppLanguage, WritingContext } from '../../../shared/ipc-contracts'

export interface Translations {
  nav: {
    pronunciationLab: string
    writingCheck: string
    reviewDeck: string
    progressStats: string
    quickCheck: string
    studioTag: string
  }
  titleBar: {
    days: string
    focus: string
    settingsTitle: string
    pomodoroTooltip: string
    minimize: string
    maximize: string
    restore: string
    close: string
  }
  settings: {
    title: string
    subtitle: string
    languageTitle: string
    languageHelp: string
    ptBrLabel: string
    enLabel: string
    geminiEngine: string
    statusSafeStorage: string
    statusEnv: string
    statusNone: string
    replaceKey: string
    enterKey: string
    activeModel: string
    removeStoredKey: string
    neverLeavesMain: string
    close: string
    saveKey: string
    saving: string
    keySavedSuccess: string
    keyClearedSuccess: string
    languageSavedSuccess: string
  }
  lab: {
    defaultMic: string
    refreshDevices: string
    allCategories: string
    shuffleTitle: string
    next: string
    attempts: string
    last: string
    loadingDrills: string
    listenNative: string
    stopNative: string
    recordingLive: string
    captured: string
    micReady: string
    standbyHint: string
    playRecording: string
    stopPlayback: string
    retry: string
    press: string
    spacebar: string
    toRecord: string
    toStop: string
    analyze: string
    analyzing: string
    scoreTitle: string
    analyzed: string
    standby: string
    ready: string
    target: string
    wordBreakdown: string
    geminiEval: string
    previewTokens: string
    accurate: string
    stress: string
    mispronounced: string
    guideTitle: string
    guideSubtitle: string
    defaultTipPrefix: string
    defaultTipSuffix: string
    nextSentence: string
    drillsLoaded: string
    shortcutRecord: string
    shortcutRetry: string
    shortcutShuffle: string
  }
  writing: {
    contextLabel: string
    contexts: Record<WritingContext, string>
    shortcut: string
    originalDraft: string
    words: string
    chars: string
    placeholder: string
    clear: string
    checkBtn: string
    checking: string
    aiEval: string
    aiEvalSubtitle: string
    emptyHint: string
    correctedVersion: string
    replaceDraft: string
    copy: string
    copied: string
    alternatives: string
    notes: string
  }
  review: {
    title: string
    hotspotsSuffix: string
    drillsSuffix: string
    refresh: string
    recurringHotspots: string
    sqliteTracked: string
    noErrorsTitle: string
    noErrorsHint: string
    practiceQueue: string
    orderedByDue: string
    newReady: string
    dueNow: string
    inPrefix: string
    attempts: string
    last: string
    practiceInLab: string
  }
  stats: {
    title: string
    subtitle: string
    refresh: string
    streak: string
    days: string
    totalTime: string
    min: string
    averageScore: string
    totalSessions: string
    recentSessions: string
    last10: string
    emptyHint: string
    colType: string
    colDuration: string
    colScore: string
    colTimestamp: string
    sessionTypes: {
      pronunciation: string
      writing: string
      pomodoro: string
    }
  }
  quickCheck: {
    quickPronunciation: string
    quickGrammar: string
    toggleAccent: string
    closeEsc: string
    placeholderPron: string
    placeholderGrammar: string
    listenNative: string
    listening: string
    audioReady: string
    clickMic: string
    analyze: string
    analyzing: string
    pressEnter: string
    enterKey: string
    toEvaluate: string
    checkGrammar: string
    checking: string
    natural: string
    copyFix: string
    copied: string
    emptyPron: string
    emptyGrammar: string
  }
  hooks: {
    voiceUnavailable: string
    noEnglishVoice: string
    micListError: string
    micUnavailable: string
    micDenied: string
    micAccessError: string
    recordError: string
    playbackError: string
  }
}

const PT_BR: Translations = {
  nav: {
    pronunciationLab: 'Pronúncia',
    writingCheck: 'Escrita',
    reviewDeck: 'Revisão',
    progressStats: 'Progresso',
    quickCheck: 'Quick Check',
    studioTag: 'Estúdio PT-BR → EN'
  },
  titleBar: {
    days: 'dias',
    focus: 'Foco',
    settingsTitle: 'Configurações do Estúdio',
    pomodoroTooltip: 'Sincronia Pomodoro na bandeja prevista para v0.2.0',
    minimize: 'Minimizar janela',
    maximize: 'Maximizar janela',
    restore: 'Restaurar janela',
    close: 'Fechar janela'
  },
  settings: {
    title: 'Configurações do Estúdio',
    subtitle: 'Defina o idioma do aplicativo, das respostas da IA e sua chave Gemini.',
    languageTitle: 'Idioma da Interface e Explicações da IA',
    languageHelp: 'As frases e textos de treino continuam em inglês; menus e dicas da IA seguem este idioma.',
    ptBrLabel: 'Português (PT-BR)',
    enLabel: 'English',
    geminiEngine: 'Motor Gemini AI',
    statusSafeStorage: 'Criptografada via Windows DPAPI safeStorage',
    statusEnv: 'Carregada via .env (Dev)',
    statusNone: 'Não configurada',
    replaceKey: 'Substituir Gemini API Key',
    enterKey: 'Informe sua Gemini API Key',
    activeModel: 'Modelo ativo',
    removeStoredKey: 'Remover chave salva',
    neverLeavesMain: 'A chave nunca sai do Main Process',
    close: 'Fechar',
    saveKey: 'Salvar chave',
    saving: 'Salvando...',
    keySavedSuccess: 'Gemini API Key criptografada e salva com sucesso via Windows DPAPI.',
    keyClearedSuccess: 'Chave armazenada localmente removida.',
    languageSavedSuccess: 'Idioma atualizado com sucesso.'
  },
  lab: {
    defaultMic: 'Microfone padrão',
    refreshDevices: 'Atualizar dispositivos de áudio',
    allCategories: 'Todas',
    shuffleTitle: 'Aleatório [Ctrl+R]',
    next: 'Próxima',
    attempts: 'Tentativas',
    last: 'Última',
    loadingDrills: 'Carregando frases do banco local...',
    listenNative: 'Ouvir Nativo',
    stopNative: 'Parar Áudio',
    recordingLive: 'Gravando entrada ao vivo...',
    captured: 'Capturado',
    micReady: 'Microfone pronto',
    standbyHint: 'Pronto • Pressione Espaço ou clique em Gravar',
    playRecording: 'Ouvir Minha Voz',
    stopPlayback: 'Parar Reprodução',
    retry: 'Refazer',
    press: 'Pressione',
    spacebar: 'Espaço',
    toRecord: 'para gravar',
    toStop: 'para parar',
    analyze: 'Analisar Pronúncia',
    analyzing: 'Analisando...',
    scoreTitle: 'Nota Acústica IA',
    analyzed: 'AVALIADO',
    standby: 'AGUARDANDO',
    ready: 'Pronto',
    target: 'Sotaque',
    wordBreakdown: 'Análise Palavra por Palavra',
    geminiEval: 'Avaliação Gemini',
    previewTokens: 'Prévia das palavras',
    accurate: 'Correto',
    stress: 'Ênfase / Ritmo',
    mispronounced: 'Com erro',
    guideTitle: 'Guia Acústico e Articulatório',
    guideSubtitle: 'Coach de fonética PT-BR → EN',
    defaultTipPrefix: 'Foco em',
    defaultTipSuffix: 'ouça a referência nativa primeiro, depois grave com Espaço e compare as duas vozes.',
    nextSentence: 'Próxima Frase de Treino',
    drillsLoaded: 'SQLite local pronto',
    shortcutRecord: 'Espaço: Gravar',
    shortcutRetry: 'R: Refazer',
    shortcutShuffle: 'Ctrl+R: Aleatório'
  },
  writing: {
    contextLabel: 'Contexto:',
    contexts: {
      work_tech: 'Trabalho / Tech',
      email: 'E-mail',
      conversation: 'Conversa',
      academic: 'Acadêmico'
    },
    shortcut: 'Atalho:',
    originalDraft: 'Rascunho em Inglês',
    words: 'palavras',
    chars: 'caracteres',
    placeholder: 'Escreva ou cole seu texto em inglês aqui para corrigir gramática, naturalidade e interferências do português...',
    clear: 'Limpar',
    checkBtn: 'Verificar Gramática e Naturalidade',
    checking: 'Verificando...',
    aiEval: 'Avaliação da IA',
    aiEvalSubtitle: 'Correções, reescritas naturais e explicações em PT-BR',
    emptyHint: 'Clique em Verificar Gramática e Naturalidade (ou pressione Ctrl+Enter) para avaliar seu texto com o Gemini.',
    correctedVersion: 'Versão Corrigida',
    replaceDraft: 'Usar no Rascunho',
    copy: 'Copiar',
    copied: 'Copiado',
    alternatives: 'Alternativas Mais Naturais',
    notes: 'Notas de Gramática e Interferência do Português'
  },
  review: {
    title: 'Deck de Revisão e Pontos Críticos',
    hotspotsSuffix: 'pontos críticos',
    drillsSuffix: 'frases',
    refresh: 'Atualizar',
    recurringHotspots: 'Erros Recorrentes de Pronúncia',
    sqliteTracked: 'Salvos no SQLite',
    noErrorsTitle: 'Nenhum erro de fonema registrado ainda',
    noErrorsHint: 'Analise uma gravação na aba Pronúncia e os fonemas com erro aparecerão aqui automaticamente.',
    practiceQueue: 'Fila de Prática',
    orderedByDue: 'Ordenada pela próxima revisão',
    newReady: 'Nova • Pronta',
    dueNow: 'Revisar agora',
    inPrefix: 'Em',
    attempts: 'Tentativas',
    last: 'Última',
    practiceInLab: 'Treinar agora'
  },
  stats: {
    title: 'Progresso e Estatísticas de Estudo',
    subtitle: 'Métricas locais persistidas no SQLite (study_sessions)',
    refresh: 'Atualizar',
    streak: 'Sequência de Estudos',
    days: 'dias',
    totalTime: 'Tempo Total',
    min: 'min',
    averageScore: 'Média Geral',
    totalSessions: 'Total de Sessões',
    recentSessions: 'Sessões Recentes',
    last10: 'Últimas 10 sessões',
    emptyHint: 'Nenhuma sessão registrada ainda. Faça uma análise de pronúncia ou escrita para ver seu histórico aqui.',
    colType: 'Tipo',
    colDuration: 'Duração',
    colScore: 'Nota',
    colTimestamp: 'Data / Hora',
    sessionTypes: {
      pronunciation: 'Pronúncia',
      writing: 'Escrita',
      pomodoro: 'Pomodoro'
    }
  },
  quickCheck: {
    quickPronunciation: 'Pronúncia Rápida',
    quickGrammar: 'Gramática Rápida',
    toggleAccent: 'Alternar US / UK',
    closeEsc: 'Fechar (Esc)',
    placeholderPron: 'Cole ou digite uma frase em inglês para treinar...',
    placeholderGrammar: 'Cole ou digite uma frase em inglês para corrigir...',
    listenNative: 'Ouvir Nativo',
    listening: 'Ouvindo...',
    audioReady: 'Áudio pronto',
    clickMic: 'Clique no Mic',
    analyze: 'Analisar',
    analyzing: 'Analisando...',
    pressEnter: 'Pressione',
    enterKey: 'Enter',
    toEvaluate: 'para avaliar',
    checkGrammar: 'Corrigir Gramática',
    checking: 'Verificando...',
    natural: 'Naturalidade',
    copyFix: 'Copiar Correção',
    copied: 'Copiado',
    emptyPron: 'Resultado instantâneo — grave a frase acima para ver a nota por palavra e a dica em português.',
    emptyGrammar: 'Digite ou cole uma frase em inglês e pressione Enter para corrigir na hora.'
  },
  hooks: {
    voiceUnavailable: 'SpeechSynthesis indisponível neste ambiente.',
    noEnglishVoice: 'Nenhuma voz en-US ou en-GB detectada no Windows SAPI. Instale um pacote de voz em inglês nas Configurações do Windows.',
    micListError: 'Não foi possível listar dispositivos de áudio.',
    micUnavailable: 'Captura de áudio indisponível neste ambiente.',
    micDenied: 'Permissão de microfone negada. Habilite o microfone nas configurações do Windows.',
    micAccessError: 'Não foi possível acessar o dispositivo de áudio selecionado.',
    recordError: 'Erro durante a gravação do microfone.',
    playbackError: 'Falha ao reproduzir a gravação.'
  }
}

const EN: Translations = {
  nav: {
    pronunciationLab: 'Pronunciation Lab',
    writingCheck: 'Writing Check',
    reviewDeck: 'Review Deck',
    progressStats: 'Progress & Stats',
    quickCheck: 'Quick Check',
    studioTag: 'PT-BR → EN Studio'
  },
  titleBar: {
    days: 'days',
    focus: 'Focus',
    settingsTitle: 'Studio Settings',
    pomodoroTooltip: 'Pomodoro System Tray sync planned for v0.2.0',
    minimize: 'Minimize window',
    maximize: 'Maximize window',
    restore: 'Restore window',
    close: 'Close window'
  },
  settings: {
    title: 'Studio Settings',
    subtitle: 'Configure app language, AI feedback language, and local Gemini credentials.',
    languageTitle: 'Interface & AI Feedback Language',
    languageHelp: 'Practice sentences stay in English; UI controls and AI explanations follow this language.',
    ptBrLabel: 'Português (PT-BR)',
    enLabel: 'English',
    geminiEngine: 'Gemini AI Engine',
    statusSafeStorage: 'Encrypted via Windows DPAPI safeStorage',
    statusEnv: 'Loaded from .env (Dev mode)',
    statusNone: 'Not configured yet',
    replaceKey: 'Replace Gemini API Key',
    enterKey: 'Enter your Gemini API Key',
    activeModel: 'Active Model',
    removeStoredKey: 'Remove Stored Key',
    neverLeavesMain: 'Key never leaves Main Process',
    close: 'Close',
    saveKey: 'Save Key',
    saving: 'Saving...',
    keySavedSuccess: 'Gemini API Key encrypted and saved via Windows DPAPI.',
    keyClearedSuccess: 'Stored API key removed.',
    languageSavedSuccess: 'Language updated successfully.'
  },
  lab: {
    defaultMic: 'Default Microphone',
    refreshDevices: 'Refresh audio devices',
    allCategories: 'All',
    shuffleTitle: 'Shuffle [Ctrl+R]',
    next: 'Next',
    attempts: 'Attempts',
    last: 'Last',
    loadingDrills: 'Loading drills from local database...',
    listenNative: 'Listen Native',
    stopNative: 'Stop Native',
    recordingLive: 'Recording Live Input...',
    captured: 'Captured',
    micReady: 'Microphone Ready',
    standbyHint: 'Standby • Press Spacebar or click Record',
    playRecording: 'Play My Recording',
    stopPlayback: 'Stop Playback',
    retry: 'Retry',
    press: 'Press',
    spacebar: 'Spacebar',
    toRecord: 'to Record',
    toStop: 'to Stop',
    analyze: 'Analyze Pronunciation',
    analyzing: 'Analyzing...',
    scoreTitle: 'AI Acoustic Score',
    analyzed: 'ANALYZED',
    standby: 'STANDBY',
    ready: 'Ready',
    target: 'Target',
    wordBreakdown: 'Word-by-Word Breakdown',
    geminiEval: 'Gemini Evaluation',
    previewTokens: 'Preview tokens',
    accurate: 'Accurate',
    stress: 'Stress',
    mispronounced: 'Mispronounced',
    guideTitle: 'Acoustic & Articulatory Guide',
    guideSubtitle: 'PT-BR → EN Phonetics Coach',
    defaultTipPrefix: 'Focus on',
    defaultTipSuffix: 'listen to the native reference first, then record using Spacebar and compare both playbacks.',
    nextSentence: 'Next Practice Sentence',
    drillsLoaded: 'SQLite Local Ready',
    shortcutRecord: 'Spacebar: Record',
    shortcutRetry: 'R: Retry',
    shortcutShuffle: 'Ctrl+R: Shuffle'
  },
  writing: {
    contextLabel: 'Context:',
    contexts: {
      work_tech: 'Work / Tech',
      email: 'Email',
      conversation: 'Conversation',
      academic: 'Academic'
    },
    shortcut: 'Shortcut:',
    originalDraft: 'Original Draft',
    words: 'words',
    chars: 'chars',
    placeholder: 'Write or paste your English text here to check grammar, naturalness, and PT-BR interference...',
    clear: 'Clear',
    checkBtn: 'Check Grammar & Naturalness',
    checking: 'Checking...',
    aiEval: 'AI Evaluation',
    aiEvalSubtitle: 'Grammar fixes, idiomatic rewrites & L1 notes',
    emptyHint: 'Click Check Grammar & Naturalness (or press Ctrl+Enter) to evaluate your draft with Gemini.',
    correctedVersion: 'Corrected Version',
    replaceDraft: 'Replace Draft',
    copy: 'Copy',
    copied: 'Copied',
    alternatives: 'More Natural Alternatives',
    notes: 'Grammar & L1 Notes'
  },
  review: {
    title: 'Review Deck & Phoneme Hotspots',
    hotspotsSuffix: 'hotspots',
    drillsSuffix: 'drills',
    refresh: 'Refresh',
    recurringHotspots: 'Recurring Phoneme Hotspots',
    sqliteTracked: 'SQLite Tracked',
    noErrorsTitle: 'No phoneme errors recorded yet',
    noErrorsHint: 'Analyze a recording in Pronunciation Lab and flagged phonemes will appear here automatically.',
    practiceQueue: 'Practice Queue',
    orderedByDue: 'Ordered by next due review',
    newReady: 'New • Ready',
    dueNow: 'Due now',
    inPrefix: 'In',
    attempts: 'Attempts',
    last: 'Last',
    practiceInLab: 'Practice in Lab'
  },
  stats: {
    title: 'Progress & Study Statistics',
    subtitle: 'Local metrics persisted in SQLite (study_sessions)',
    refresh: 'Refresh',
    streak: 'Study Streak',
    days: 'days',
    totalTime: 'Total Study Time',
    min: 'min',
    averageScore: 'Average Score',
    totalSessions: 'Total Sessions',
    recentSessions: 'Recent Study Sessions',
    last10: 'Last 10 sessions',
    emptyHint: 'No study sessions logged yet. Complete a pronunciation check or writing evaluation to see your history here.',
    colType: 'Type',
    colDuration: 'Duration',
    colScore: 'Score',
    colTimestamp: 'Timestamp',
    sessionTypes: {
      pronunciation: 'Pronunciation',
      writing: 'Writing',
      pomodoro: 'Pomodoro'
    }
  },
  quickCheck: {
    quickPronunciation: 'Quick Pronunciation',
    quickGrammar: 'Quick Grammar Check',
    toggleAccent: 'Toggle US / UK',
    closeEsc: 'Close (Esc)',
    placeholderPron: 'Paste or type phrase to practice...',
    placeholderGrammar: 'Paste or type sentence to check grammar...',
    listenNative: 'Listen Native',
    listening: 'Listening...',
    audioReady: 'Audio Ready',
    clickMic: 'Click Mic',
    analyze: 'Analyze',
    analyzing: 'Analyzing...',
    pressEnter: 'Press',
    enterKey: 'Enter',
    toEvaluate: 'to evaluate',
    checkGrammar: 'Check Grammar',
    checking: 'Checking...',
    natural: 'Natural',
    copyFix: 'Copy Fix',
    copied: 'Copied',
    emptyPron: 'Instant feedback drawer — record the phrase above to inspect word accuracy and articulatory guidance.',
    emptyGrammar: 'Type or paste a sentence and press Enter for an instant naturalness and grammar check.'
  },
  hooks: {
    voiceUnavailable: 'SpeechSynthesis is unavailable in this environment.',
    noEnglishVoice: 'No en-US or en-GB voice detected in Windows SAPI. Install an English voice pack in Windows Settings.',
    micListError: 'Unable to list audio input devices.',
    micUnavailable: 'Audio capture is unavailable in this environment.',
    micDenied: 'Microphone permission denied. Enable microphone access in Windows Settings.',
    micAccessError: 'Unable to access the selected audio device.',
    recordError: 'Error while recording from microphone.',
    playbackError: 'Failed to play recorded audio.'
  }
}

export function getTranslations(language: AppLanguage): Translations {
  return language === 'en' ? EN : PT_BR
}
