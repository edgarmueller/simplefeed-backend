import { fakeModel, silentLogger } from '../test/fixtures'
import { DEFAULT_PREFERENCES } from './preferences'
import { CommandTuner, ModelTuner } from './tuning'

describe('CommandTuner', () => {
  const tuner = new CommandTuner()

  it.each([
    ['more rust', { interests: ['rust'] }],
    ['Mute crypto', { muted: ['crypto'] }],
    ['min score 250', { minScore: 250 }],
    ['max 5 per day', { maxPostsPerDay: 5 }],
    ['5 posts a day', { maxPostsPerDay: 5 }],
  ])('understands "%s"', async (message, expected) => {
    const { preferences, reply } = await tuner.tune(message, DEFAULT_PREFERENCES)

    expect(preferences).toMatchObject(expected)
    expect(reply).toContain("Here's what I'm doing now")
  })

  it('moves a topic from interests to muted', async () => {
    const { preferences } = await tuner.tune('mute ai', { ...DEFAULT_PREFERENCES, interests: ['ai', 'rust'] })

    expect(preferences).toMatchObject({ interests: ['rust'], muted: ['ai'] })
  })

  it('explains itself when it does not understand', async () => {
    const { preferences, reply } = await tuner.tune('what is this?', DEFAULT_PREFERENCES)

    expect(preferences).toBe(DEFAULT_PREFERENCES)
    expect(reply).toContain('You can tell me things like')
  })
})

describe('ModelTuner', () => {
  it('applies the settings the model returns and states them', async () => {
    const model = fakeModel({
      preferences: { ...DEFAULT_PREFERENCES, muted: ['crypto', 'web3'], notes: 'no paywalled sites' },
      reply: 'Got it, no more crypto.',
    })

    const { preferences, reply } = await new ModelTuner(model).tune(
      'please stop with the crypto stuff and paywalls',
      DEFAULT_PREFERENCES
    )

    expect(preferences).toMatchObject({ muted: ['crypto', 'web3'], notes: 'no paywalled sites' })
    expect(reply).toContain('Got it, no more crypto.')
    expect(reply).toContain('Leaving out: crypto, web3')
  })

  it('only answers when nothing changed', async () => {
    const model = fakeModel({ preferences: DEFAULT_PREFERENCES, reply: 'Hi! I post the HN front page.' })

    const { reply } = await new ModelTuner(model).tune('hi', DEFAULT_PREFERENCES)

    expect(reply).toBe('Hi! I post the HN front page.')
  })

  it('falls back to commands when the model fails', async () => {
    const { preferences } = await new ModelTuner(fakeModel(new Error('down')), undefined, silentLogger).tune(
      'mute crypto',
      DEFAULT_PREFERENCES
    )

    expect(preferences.muted).toEqual(['crypto'])
  })
})
