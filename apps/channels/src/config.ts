export interface ChannelsConfig {
  apiUrl: string
  /** lets the worker use the API's worker endpoints */
  workerApiKey: string
  hackerNewsApiUrl: string
  /** lets users add feeds on private networks, e.g. localhost; for development only */
  allowPrivateFeedHosts: boolean
  /** how often channels fetch and pick new items */
  postIntervalMinutes: number
  /** how often the worker answers readers' chat messages */
  chatIntervalSeconds: number
  /** how often the worker looks for feeds users added and new subscriptions */
  feedIntervalSeconds: number
  groq?: {
    apiKey: string
    model: string
    baseUrl: string
  }
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]
  if (!value) {
    throw new Error(`${name} must be set`)
  }
  return value
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return value && Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ChannelsConfig {
  return {
    apiUrl: env.CHANNELS_API_URL || 'http://localhost:5001/api',
    workerApiKey: required(env, 'WORKER_API_KEY'),
    hackerNewsApiUrl: env.HACKER_NEWS_API_URL || 'https://hacker-news.firebaseio.com/v0',
    allowPrivateFeedHosts: env.CHANNELS_ALLOW_PRIVATE_FEED_HOSTS === 'true',
    postIntervalMinutes: positiveNumber(env.CHANNELS_POST_INTERVAL_MINUTES, 60),
    chatIntervalSeconds: positiveNumber(env.CHANNELS_CHAT_INTERVAL_SECONDS, 5),
    feedIntervalSeconds: positiveNumber(env.CHANNELS_FEED_INTERVAL_SECONDS, 10),
    groq: env.GROQ_API_KEY
      ? {
          apiKey: env.GROQ_API_KEY,
          model: env.GROQ_MODEL || 'openai/gpt-oss-20b',
          baseUrl: env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
        }
      : undefined,
  }
}
