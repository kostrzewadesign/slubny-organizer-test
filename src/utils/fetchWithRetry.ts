export async function withTimeout<T>(p: Promise<T>, ms = 30000): Promise<T> {
  let t: ReturnType<typeof setTimeout>
  return await Promise.race([
    p,
    new Promise<never>((_, rej) => (t = setTimeout(() => rej(new Error(`Timed out after ${ms}ms`)), ms)))
  ]).finally(() => clearTimeout(t))
}

export async function retry<T>(fn: () => Promise<T>, attempts = 3) {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      const backoff = 500 * 2 ** i // 0.5s, 1s, 2s
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, backoff))
      }
    }
  }
  throw lastErr
}

export function makeAbortable<T extends any[], R>(fn: (...args: T) => Promise<R>) {
  let controller: AbortController | null = null
  return async (...args: T) => {
    controller?.abort()
    controller = new AbortController()
    try {
      return await fn(...args)
    } finally {
      controller = null
    }
  }
}