import { Account, ApiError, SimplefeedClient, connectChat, whenApiIsUp } from './api/simplefeed-client'
import { WorkerApi } from './api/worker-api'
import { Channel, HACKER_NEWS_ACCOUNT } from './channel/channel'
import { Curator, ModelCurator, RuleBasedCurator } from './channel/curator'
import { FeedChannels } from './channel/feed-channels'
import { CommandTuner, ModelTuner, Tuner } from './channel/tuning'
import { loadConfig } from './config'
import { GroqModel } from './llm/groq'
import { HackerNewsSource } from './sources/hacker-news'
import { createSafeFetch } from './sources/safe-fetch'
import { Source } from './sources/story'
import { PostgresChannelStore } from './state/postgres-store'

/** Feeds often post a few times a week; their stories stay news longer. */
const FEED_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

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

  let stopping = false
  const timers: NodeJS.Timeout[] = []
  const chats: { close(): void }[] = []
  const createClient = (account: Account) => new SimplefeedClient(config.apiUrl, account, config.channelPassword)

  /** Posts the source's stories as the client's channel and answers its chats. */
  function start(client: SimplefeedClient, source: Source, maxAgeMs?: number) {
    const channel = new Channel({ client, source, curator, tuner, store, maxAgeMs })
    const chat = connectChat(config.socketUrl, client, (message) => {
      channel.handleMessage(message, chat).catch((error) => console.error(`${channel.name} could not answer a message: ${error}`))
    })
    chats.push(chat)
    timers.push(every(config.postIntervalMinutes * 60 * 1000, `${channel.name}: posting stories`, () => channel.postNewStories()))
    // joining chats needs the socket, which connects in the background
    void chat.ready.then(() => {
      if (!stopping) {
        timers.push(every(config.chatIntervalSeconds * 1000, `${channel.name}: syncing chats`, () => channel.syncChats(chat)))
      }
    })
    console.log(`${channel.name} is running`)
  }

  const hackerNews = createClient(HACKER_NEWS_ACCOUNT)
  try {
    await whenApiIsUp(() => hackerNews.ensureAccount(config.botRegistrationKey))
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      throw new Error('the API refused to create the channel account: BOT_REGISTRATION_KEY must be set to the same value for the API and the worker')
    }
    throw error
  }
  start(hackerNews, new HackerNewsSource(config.hackerNewsApiUrl))

  const feeds = new FeedChannels({
    api: new WorkerApi(config.apiUrl, config.botRegistrationKey),
    fetchPage: createSafeFetch({ allowPrivateHosts: config.allowPrivateFeedHosts }),
    registrationKey: config.botRegistrationKey,
    createClient,
    start: (client, source) => start(client, source, FEED_MAX_AGE_MS),
  })
  timers.push(every(config.chatIntervalSeconds * 1000, 'syncing feeds', () => feeds.sync()))

  const shutdown = async () => {
    stopping = true
    timers.forEach(clearInterval)
    chats.forEach((chat) => chat.close())
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
