/** What a reader wants from one channel, tuned through its chat. */
export interface Preferences {
  /** topics to favor, e.g. "rust", "databases" */
  interests: string[]
  /** topics to leave out, e.g. "crypto" */
  muted: string[]
  /** skip items with fewer points than this; only for sources with points */
  minScore: number
  maxPostsPerDay: number
  /** anything else the reader asked for, in their words */
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

function topics(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  const cleaned = value
    .filter((topic): topic is string => typeof topic === 'string')
    .map((topic) => topic.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(cleaned)].slice(0, MAX_TOPICS)
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback
}

/** Turns untrusted input, e.g. from the worker's model, into valid preferences. */
export function normalizePreferences(input: unknown, fallback = DEFAULT_PREFERENCES): Preferences {
  const value = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const muted = 'muted' in value ? topics(value.muted) : fallback.muted
  const interests = 'interests' in value ? topics(value.interests) : fallback.interests
  return {
    interests: interests.filter((topic) => !muted.includes(topic)),
    muted,
    minScore: clamp(value.minScore, 0, 5000, fallback.minScore),
    maxPostsPerDay: clamp(value.maxPostsPerDay, 1, 50, fallback.maxPostsPerDay),
    notes: typeof value.notes === 'string' ? value.notes.trim().slice(0, MAX_NOTES_LENGTH) : fallback.notes,
  }
}
