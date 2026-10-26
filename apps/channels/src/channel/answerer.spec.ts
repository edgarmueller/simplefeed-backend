import { FakeWorkerApi } from '../test/fake-api'
import { silentLogger } from '../test/fixtures'
import { TuningAnswerer } from './answerer'
import { DEFAULT_PREFERENCES } from './preferences'
import { CommandTuner, Tuner } from './tuning'

const HN = { id: 'cha-hackernews', kind: 'hackernews' as const, status: 'active' as const }

describe('TuningAnswerer', () => {
  it("answers readers' messages with their updated preferences", async () => {
    const api = new FakeWorkerApi()
    api.messages = [
      { id: 'tun-1', subscriptionId: 'sub-1', channel: HN, content: 'mute crypto', preferences: DEFAULT_PREFERENCES },
      { id: 'tun-2', subscriptionId: 'sub-2', channel: HN, content: 'more rust', preferences: { garbage: true } },
    ]

    await new TuningAnswerer(api.asApi(), new CommandTuner(), silentLogger).answerAll()

    expect(api.answers['tun-1'].preferences.muted).toEqual(['crypto'])
    expect(api.answers['tun-1'].reply).toContain('Leaving out: crypto')
    expect(api.answers['tun-2'].preferences.interests).toEqual(['rust'])
  })

  it('leaves a message unanswered when tuning fails, and answers the others', async () => {
    const api = new FakeWorkerApi()
    api.messages = [
      { id: 'tun-1', subscriptionId: 'sub-1', channel: HN, content: 'boom', preferences: DEFAULT_PREFERENCES },
      { id: 'tun-2', subscriptionId: 'sub-2', channel: HN, content: 'more rust', preferences: DEFAULT_PREFERENCES },
    ]
    const flaky: Tuner = {
      tune: async (message, current) => {
        if (message === 'boom') throw new Error('model down')
        return new CommandTuner().tune(message, current)
      },
    }

    await new TuningAnswerer(api.asApi(), flaky, silentLogger).answerAll()

    expect(Object.keys(api.answers)).toEqual(['tun-2'])
  })
})
