import { silentLogger } from '../test/fixtures'
import { ApiError, whenApiIsUp } from './simplefeed-client'

describe('whenApiIsUp', () => {
  it('retries until the API is reachable', async () => {
    let calls = 0
    const task = async () => {
      calls++
      if (calls === 1) throw new TypeError('fetch failed')
      if (calls === 2) throw new ApiError(502, 'bad gateway')
      return 'registered'
    }

    await expect(whenApiIsUp(task, silentLogger, 1)).resolves.toBe('registered')
    expect(calls).toBe(3)
  })

  it('gives up on client errors', async () => {
    let calls = 0
    const task = async () => {
      calls++
      throw new ApiError(403, 'Bot registration is not allowed')
    }

    await expect(whenApiIsUp(task, silentLogger, 1)).rejects.toThrow('not allowed')
    expect(calls).toBe(1)
  })
})
