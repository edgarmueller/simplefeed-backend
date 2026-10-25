import { DEFAULT_PREFERENCES, keywords, likeAffinity, matchingTopics, normalizePreferences } from './preferences'

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

describe('keywords', () => {
  it('keeps the words that say what a title is about', () => {
    expect(keywords('Show HN: Why we moved from Postgres to SQLite in 2026')).toEqual(
      new Set(['moved', 'postgres', 'sqlite'])
    )
  })

  it('counts the keywords a title shares with liked stories', () => {
    expect(likeAffinity('SQLite is all you need', keywords('Twelve years of distributed SQLite'))).toBe(1)
    expect(likeAffinity('A new JavaScript runtime', keywords('Twelve years of distributed SQLite'))).toBe(0)
  })
})
