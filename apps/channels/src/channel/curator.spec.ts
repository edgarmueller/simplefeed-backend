import { fakeModel, silentLogger, story } from '../test/fixtures'
import { ModelCurator, RuleBasedCurator } from './curator'
import { DEFAULT_PREFERENCES } from './preferences'

const preferences = { ...DEFAULT_PREFERENCES, interests: ['rust'], muted: ['crypto'] }

describe('RuleBasedCurator', () => {
  it('leaves out muted topics and ranks interests before score', async () => {
    const popular = story('A popular essay', { score: 900 })
    const rust = story('Rust in production', { score: 150 })
    const crypto = story('Crypto is back', { score: 1200 })

    const picks = await new RuleBasedCurator().pick([popular, rust, crypto], preferences, 2)

    expect(picks.map((pick) => pick.story)).toEqual([rust, popular])
  })
})

describe('ModelCurator', () => {
  const stories = [story('One'), story('Two'), story('Three')]

  it('uses the picks and summaries the model chose', async () => {
    const model = fakeModel({
      picks: [
        { id: stories[2].id, summary: 'The third one.' },
        { id: stories[0].id, summary: 'The first one.' },
      ],
    })

    const picks = await new ModelCurator(model, undefined, silentLogger).pick(stories, preferences, 3)

    expect(picks).toEqual([
      { story: stories[2], summary: 'The third one.' },
      { story: stories[0], summary: 'The first one.' },
    ])
    expect(JSON.parse(model.inputs[0]).candidates).toHaveLength(3)
  })

  it('ignores made-up and repeated ids and respects the limit', async () => {
    const model = fakeModel({
      picks: [{ id: 999_999 }, { id: stories[1].id }, { id: stories[1].id }, { id: stories[0].id }],
    })

    const picks = await new ModelCurator(model, undefined, silentLogger).pick(stories, preferences, 1)

    expect(picks).toEqual([{ story: stories[1], summary: undefined }])
  })

  it('falls back to the rules when the model fails or answers nonsense', async () => {
    for (const answer of [new Error('rate limited'), { nothing: true }]) {
      const picks = await new ModelCurator(fakeModel(answer), undefined, silentLogger).pick(
        stories,
        DEFAULT_PREFERENCES,
        2
      )
      expect(picks).toHaveLength(2)
    }
  })

  it('does not call the model without candidates', async () => {
    const model = fakeModel({ picks: [] })

    expect(await new ModelCurator(model).pick([], preferences, 3)).toEqual([])
    expect(model.inputs).toHaveLength(0)
  })
})
