import { ApiError, ChannelInfo, WorkerApi, whenApiIsUp } from './api/worker-api'
import { TuningAnswerer } from './channel/answerer'
import { Curator, ModelCurator, RuleBasedCurator } from './channel/curator'
import { FeedDiscovery } from './channel/feed-channels'
import { ChannelRunner } from './channel/runner'
import { CommandTuner, ModelTuner, Tuner } from './channel/tuning'
import { loadConfig } from './config'
import { GroqModel } from './llm/groq'
import { HackerNewsSource } from './sources/hacker-news'
import { FeedSource } from './sources/rss'
import { createSafeFetch } from './sources/safe-fetch'

/** Feeds often post a few times a week; their stories stay news longer. */
const FEED_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const HACKER_NEWS_MAX_AGE_MS = 48 * 60 * 60 * 1000

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
  const model = config.groq ? new GroqModel(config.groq) : undefined
  const curator: Curator = model ? new ModelCurator(model) : new RuleBasedCurator()
  const tuner: Tuner = model ? new ModelTuner(model) : new CommandTuner()
  console.log(model ? `curating with ${model.name}` : 'no GROQ_API_KEY set, curating with rules')

  const api = new WorkerApi(config.apiUrl, config.workerApiKey)
  try {
    await whenApiIsUp(() => api.channels(['active']))
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      throw new Error('the API refused the worker: WORKER_API_KEY must be set to the same value for the API and the worker')
    }
    throw error
  }

  const fetchPage = createSafeFetch({ allowPrivateHosts: config.allowPrivateFeedHosts })
  const hackerNews = new HackerNewsSource(config.hackerNewsApiUrl)
  const runner = new ChannelRunner({
    api,
    curator,
    sourceFor: (channel: ChannelInfo) =>
      channel.kind === 'hackernews' ? hackerNews : new FeedSource(channel.feedUrl ?? '', fetchPage),
    maxAgeFor: (channel: ChannelInfo) => (channel.kind === 'hackernews' ? HACKER_NEWS_MAX_AGE_MS : FEED_MAX_AGE_MS),
  })
  const runChannel = (channel: ChannelInfo) =>
    runner.run(channel).catch((error) => console.error(`${channel.name ?? channel.id}: ${error}`))
  const feeds = new FeedDiscovery({ api, fetchPage, onActivated: runChannel })
  const answerer = new TuningAnswerer(api, tuner)

  const timers = [
    every(config.postIntervalMinutes * 60 * 1000, 'fetching and picking', async () => {
      // channels are fetched side by side, so a slow site doesn't hold up the others
      await Promise.all((await api.channels(['active'])).map(runChannel))
    }),
    every(config.feedIntervalSeconds * 1000, 'reading new feeds', async () => {
      await feeds.activatePending()
      await runner.pickForFresh()
    }),
    every(config.chatIntervalSeconds * 1000, 'answering chats', () => answerer.answerAll()),
  ]
  console.log('channels worker is running')

  const shutdown = () => {
    timers.forEach(clearInterval)
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
