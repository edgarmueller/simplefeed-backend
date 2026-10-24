import { ApiError, SimplefeedClient, connectChat, whenApiIsUp } from './api/simplefeed-client'
import { HACKER_NEWS_ACCOUNT, HackerNewsChannel } from './channel/hacker-news-channel'
import { Curator, ModelCurator, RuleBasedCurator } from './channel/curator'
import { CommandTuner, ModelTuner, Tuner } from './channel/tuning'
import { loadConfig } from './config'
import { GroqModel } from './llm/groq'
import { HackerNewsSource } from './sources/hacker-news'
import { PostgresChannelStore } from './state/postgres-store'

/** Runs `task` now and then every `intervalMs`, logging instead of crashing on errors. */
function every(intervalMs: number, name: string, task: () => Promise<unknown>) {
  let running = false
  const run = async () => {
    // skip a tick rather than overlapping a slow run
    if (running) return
    running = true
    try {
      await task()
    } catch (error) {
      console.error(`${name} failed: ${error}`)
    } finally {
      running = false
    }
  }
  void run()
  return setInterval(run, intervalMs)
}

async function main() {
  const config = loadConfig()
  const store = await PostgresChannelStore.connect(config.databaseUrl)
  const model = config.groq ? new GroqModel(config.groq) : undefined
  const curator: Curator = model ? new ModelCurator(model) : new RuleBasedCurator()
  const tuner: Tuner = model ? new ModelTuner(model) : new CommandTuner()
  console.log(model ? `curating with ${model.name}` : 'no GROQ_API_KEY set, curating with rules')

  const client = new SimplefeedClient(config.apiUrl, HACKER_NEWS_ACCOUNT, config.channelPassword)
  try {
    await whenApiIsUp(() => client.ensureAccount(config.botRegistrationKey))
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      throw new Error('the API refused to create the channel account: BOT_REGISTRATION_KEY must be set to the same value for the API and the worker')
    }
    throw error
  }
  const channel = new HackerNewsChannel({
    client,
    source: new HackerNewsSource(config.hackerNewsApiUrl),
    curator,
    tuner,
    store,
  })
  const chat = connectChat(config.socketUrl, client, (message) => {
    channel.handleMessage(message, chat).catch((error) => console.error(`could not answer a message: ${error}`))
  })

  const timers = [
    every(config.chatIntervalSeconds * 1000, 'syncing chats', () => channel.syncChats(chat)),
    every(config.postIntervalMinutes * 60 * 1000, 'posting stories', () => channel.postNewStories()),
  ]
  console.log(`${HACKER_NEWS_ACCOUNT.username} is running`)

  const shutdown = async () => {
    timers.forEach(clearInterval)
    chat.close()
    await store.close()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
