import {describe, it, expect} from 'vitest'
import {RateLimiter} from '../fetchPage'

describe('RateLimiter', () => {
  it('spaces calls by at least the configured interval', async () => {
    const limiter = new RateLimiter(50)
    const stamps: number[] = []
    const now = () => stamps.push(Date.now())
    await limiter.wait()
    now()
    await limiter.wait()
    now()
    await limiter.wait()
    now()
    expect(stamps[1] - stamps[0]).toBeGreaterThanOrEqual(45)
    expect(stamps[2] - stamps[1]).toBeGreaterThanOrEqual(45)
  })

  it('counts requests and refuses past the ceiling', async () => {
    const limiter = new RateLimiter(1, 2)
    await limiter.wait()
    await limiter.wait()
    await expect(limiter.wait()).rejects.toThrow(/request ceiling/i)
  })
})
