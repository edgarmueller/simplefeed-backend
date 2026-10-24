import { Logger } from '../logger'
import { JsonModel } from '../llm/llm'
import { DEFAULT_PREFERENCES, Preferences, describePreferences, normalizePreferences } from './preferences'

export interface TuningResult {
  preferences: Preferences
  reply: string
}

/** Turns a subscriber's chat message into new preferences and an answer. */
export interface Tuner {
  tune(message: string, current: Preferences): Promise<TuningResult>
}

const HELP = `You can tell me things like:
- "more rust" or "follow databases" to favor a topic
- "mute crypto" or "less ai" to leave a topic out
- "unmute crypto" to forget a topic
- "min score 200" to skip stories with fewer points
- "max 5 per day" to limit how much I post
- "settings" to see what I'm doing now, "reset" to start over`

const without = (topics: string[], topic: string) => topics.filter((t) => t !== topic)

/** Understands a few fixed commands, so tuning works without a model. */
export class CommandTuner implements Tuner {
  async tune(message: string, current: Preferences): Promise<TuningResult> {
    const text = message.trim().toLowerCase()
    const topic = (pattern: RegExp) => text.match(pattern)?.[1]?.trim()
    let next: Preferences | undefined
    let match: string | undefined

    if ((match = topic(/^(?:more|follow|add)\s+(.+)$/))) {
      next = { ...current, interests: [...current.interests, match], muted: without(current.muted, match) }
    } else if ((match = topic(/^(?:less|mute|hide|no)\s+(.+)$/))) {
      next = { ...current, muted: [...current.muted, match], interests: without(current.interests, match) }
    } else if ((match = topic(/^(?:unmute|forget)\s+(.+)$/))) {
      next = { ...current, muted: without(current.muted, match), interests: without(current.interests, match) }
    } else if ((match = topic(/^min(?:imum)?(?:\s+score)?\s+(\d+)$/))) {
      next = { ...current, minScore: Number(match) }
    } else if ((match = topic(/^(?:max(?:imum)?\s+)?(\d+)(?:\s+posts?)?\s+(?:per|a)\s+day$/) ?? topic(/^max(?:imum)?\s+(\d+)$/))) {
      next = { ...current, maxPostsPerDay: Number(match) }
    } else if (text === 'reset') {
      next = DEFAULT_PREFERENCES
    }

    if (next) {
      const preferences = normalizePreferences(next, current)
      return { preferences, reply: `Done. Here's what I'm doing now:\n${describePreferences(preferences)}` }
    }
    if (/^(settings|status|show)$/.test(text)) {
      return { preferences: current, reply: describePreferences(current) }
    }
    return { preferences: current, reply: `I didn't get that.\n\n${HELP}` }
  }
}

const INSTRUCTIONS = `You manage the settings of a Hacker News channel for its one reader.
The reader writes to you in chat. Update the settings to match what they ask for, then reply.
Settings:
- interests: short lowercase topics to favor
- muted: short lowercase topics to leave out
- minScore: skip stories with fewer points (0-5000)
- maxPostsPerDay: how many stories to post per day (1-50)
- notes: other wishes in the reader's words, e.g. "no paywalled sites", at most 500 characters
If the message asks no change (a question, a greeting), keep the settings as they are and answer briefly.
Keep the reply to one or two friendly sentences, in the reader's language, about what you changed or answered.
Answer with JSON only: {"preferences": {"interests": [...], "muted": [...], "minScore": n, "maxPostsPerDay": n, "notes": "..."}, "reply": "..."}`

/** Lets a language model interpret free-form requests, falling back to commands. */
export class ModelTuner implements Tuner {
  constructor(
    private readonly model: JsonModel,
    private readonly fallback: Tuner = new CommandTuner(),
    private readonly logger: Logger = console
  ) {}

  async tune(message: string, current: Preferences): Promise<TuningResult> {
    try {
      const answer = (await this.model.completeJson(
        INSTRUCTIONS,
        JSON.stringify({ settings: current, message })
      )) as { preferences?: unknown; reply?: unknown }
      if (!answer?.preferences || typeof answer.reply !== 'string') {
        throw new Error('the answer has no preferences or reply')
      }
      const preferences = normalizePreferences(answer.preferences, current)
      const changed = JSON.stringify(preferences) !== JSON.stringify(current)
      // state the stored settings ourselves rather than trusting the model's account of them
      const reply = changed
        ? `${answer.reply.trim()}\n\nHere's what I'm doing now:\n${describePreferences(preferences)}`
        : answer.reply.trim()
      return { preferences, reply }
    } catch (error) {
      this.logger.warn(`${this.model.name} could not tune, using commands instead: ${error}`)
      return this.fallback.tune(message, current)
    }
  }
}
