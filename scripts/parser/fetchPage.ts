/**
 * Polite HTTP layer for the listing parser.
 * MerrJep 403s bare fetches, so requests carry browser-like headers, are spaced
 * by a rate limit, and are capped by a hard ceiling. See
 * docs/engineering/PLAN-listing-parser-2026-08-15.md.
 */
export class RateLimiter {
  private last = 0
  private count = 0

  constructor(
    private readonly intervalMs: number,
    private readonly ceiling = Number.POSITIVE_INFINITY,
  ) {}

  async wait(): Promise<void> {
    if (this.count >= this.ceiling) {
      throw new Error(`request ceiling of ${this.ceiling} reached`)
    }
    this.count += 1
    const since = Date.now() - this.last
    if (since < this.intervalMs) {
      await new Promise((r) => setTimeout(r, this.intervalMs - since))
    }
    this.last = Date.now()
  }

  get requests(): number {
    return this.count
  }
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'

/** Hard per-request timeout. Without it a stalled socket hangs the whole run. */
const TIMEOUT_MS = 25_000

export async function fetchPage(url: string, limiter: RateLimiter, attempt = 1): Promise<string> {
  await limiter.wait()
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'sq,en;q=0.8',
    },
  })
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 3) throw new Error(`${res.status} after 3 attempts: ${url}`)
    await new Promise((r) => setTimeout(r, 2000 * attempt))
    return fetchPage(url, limiter, attempt + 1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.text()
}
