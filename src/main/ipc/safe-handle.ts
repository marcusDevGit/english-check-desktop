import { ipcMain } from 'electron'
import type { z } from 'zod'
import type { IpcChannel, IpcResult } from '../../shared/ipc-contracts'

/**
 * Registers an IPC invoke handler with Zod payload validation and structured error wrapping.
 */
export function registerValidatedHandler<TInput, TOutput>(
  channel: IpcChannel,
  schema: z.ZodType<TInput> | null,
  handler: (input: TInput) => Promise<TOutput> | TOutput
): void {
  ipcMain.handle(channel, async (_event, rawPayload: unknown): Promise<IpcResult<TOutput>> => {
    try {
      const parsedInput = schema ? schema.parse(rawPayload) : (undefined as TInput)
      const data = await handler(parsedInput)
      return { ok: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected IPC handler error'
      return { ok: false, error: message }
    }
  })
}
