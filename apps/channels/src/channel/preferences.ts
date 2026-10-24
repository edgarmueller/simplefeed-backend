/** What a channel's subscriber wants to see, tuned through chat. */
export interface Preferences {
  /** topics to favor, e.g. "rust", "databases" */
  interests: string[]
  /** topics to leave out, e.g. "crypto" */
  muted: string[]
  /** ignore items with fewer points than this */
  minScore: number
  maxPostsPerDay: number
  /** anything else the subscriber asked for, in their words */
  notes: string
}

export const DEFAULT_PREFERENCES: Preferences = {
  interests: [],
  muted: [],
  minScore: 100,
  maxPostsPerDay: 10,
  notes: '',
}

const MAX_TOPICS = 30
const MAX_NOTES_LENGTH = 500

function cleanTopics(topics: unknown): string[] {
  if (!Array.isArray(topics)) {
    return []
  }
  const cleaned = topics
    .filter((topic): topic is string => typeof topic === 'string')
    .map((topic) => topic.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(cleaned)].slice(0, MAX_TOPICS)
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return fallback
  }
  return Math.min(max, Math.max(min, Math.round(number)))
}

/** Turns untrusted input (stored JSON, model output) into valid preferences. */
export function normalizePreferences(input: unknown, fallback = DEFAULT_PREFERENCES): Preferences {
  const value = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const interests = 'interests' in value ? cleanTopics(value.interests) : fallback.interests
  const muted = 'muted' in value ? cleanTopics(value.muted) : fallback.muted
  return {
    interests: interests.filter((topic) => !muted.includes(topic)),
    muted,
    minScore: clamp(value.minScore, 0, 5000, fallback.minScore),
    maxPostsPerDay: clamp(value.maxPostsPerDay, 1, 50, fallback.maxPostsPerDay),
    notes:
      typeof value.notes === 'string' ? value.notes.trim().slice(0, MAX_NOTES_LENGTH) : fallback.notes,
  }
}

export function describePreferences(preferences: Preferences): string {
  const lines = [
    `Favoring: ${preferences.interests.length ? preferences.interests.join(', ') : 'nothing in particular'}`,
    `Leaving out: ${preferences.muted.length ? preferences.muted.join(', ') : 'nothing'}`,
    `Minimum score: ${preferences.minScore} points`,
    `At most ${preferences.maxPostsPerDay} posts a day`,
  ]
  if (preferences.notes) {
    lines.push(`Notes: ${preferences.notes}`)
  }
  return lines.join('\n')
}

const containsTopic = (text: string, topic: string) =>
  new RegExp(`(^|[^a-z0-9])${topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(text)

/** The topics from `topics` that `text` mentions as whole words. */
export function matchingTopics(text: string, topics: string[]): string[] {
  return topics.filter((topic) => containsTopic(text, topic))
}
