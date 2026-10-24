import { DEFAULT_PREFERENCES, matchingTopics, normalizePreferences } from './preferences'

describe('normalizePreferences', () => {
  it('cleans topics and clamps numbers from untrusted input', () => {
    const preferences = normalizePreferences({
      interests: [' Rust ', 'rust', 42, 'Databases'],
      muted: ['crypto'],
      minScore: -5,
      maxPostsPerDay: 1000,
      notes: 'no paywalls',
    })

    expect(preferences).toEqual({
      interests: ['rust', 'databases'],
      muted: ['crypto'],
      minScore: 0,
      maxPostsPerDay: 50,
      notes: 'no paywalls',
    })
  })

  it('keeps the fallback for missing or invalid fields', () => {
    expect(normalizePreferences({ minScore: 'lots' })).toEqual(DEFAULT_PREFERENCES)
    expect(normalizePreferences(null)).toEqual(DEFAULT_PREFERENCES)
  })

  it('lets muting win over interest in the same topic', () => {
    expect(normalizePreferences({ interests: ['ai'], muted: ['ai'] }).interests).toEqual([])
  })
})

describe('matchingTopics', () => {
  it('matches whole words only', () => {
    expect(matchingTopics('Rust 2.0 released', ['rust', 'go'])).toEqual(['rust'])
    expect(matchingTopics('Trusting trust', ['rust'])).toEqual([])
    expect(matchingTopics('A new C++ compiler', ['c++'])).toEqual(['c++'])
  })
})
