/// <reference types="vite/client" />

import type { EnglishChecksApi } from '../../shared/ipc-contracts'

declare global {
  interface Window {
    englishChecks: EnglishChecksApi
  }
}
