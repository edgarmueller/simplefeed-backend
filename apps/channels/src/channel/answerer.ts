import { WorkerApi } from '../api/worker-api'
import { Logger } from '../logger'
import { normalizePreferences } from './preferences'
import { Tuner } from './tuning'

/** Answers readers' chat messages and applies what they asked for. */
export class TuningAnswerer {
  constructor(
    private readonly api: WorkerApi,
    private readonly tuner: Tuner,
    private readonly logger: Logger = console
  ) {}

  async answerAll(): Promise<void> {
    for (const message of await this.api.unansweredMessages()) {
      try {
        const { preferences, reply } = await this.tuner.tune(message.content, normalizePreferences(message.preferences))
        await this.api.answer(message.id, reply, preferences)
      } catch (error) {
        // the message stays unanswered, so the next round tries again
        this.logger.error(`could not answer ${message.id}: ${error}`)
      }
    }
  }
}
