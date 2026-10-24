export interface ChannelsConfig {
  apiUrl: string
  socketUrl: string
  databaseUrl: string
  botRegistrationKey: string
  /** password for the channel accounts the worker creates */
  channelPassword: string
  hackerNewsApiUrl: string
  /** how often channels collect and post new items */
  postIntervalMinutes: number
  /** how often channels join new subscribers' chats and catch up on messages */
  chatIntervalSeconds: number
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
    socketUrl: env.CHANNELS_SOCKET_URL || 'http://localhost:5001',
    databaseUrl: required(env, 'DATABASE_URL'),
    botRegistrationKey: required(env, 'BOT_REGISTRATION_KEY'),
    channelPassword: required(env, 'CHANNEL_PASSWORD'),
    hackerNewsApiUrl: env.HACKER_NEWS_API_URL || 'https://hacker-news.firebaseio.com/v0',
    postIntervalMinutes: positiveNumber(env.CHANNELS_POST_INTERVAL_MINUTES, 60),
    chatIntervalSeconds: positiveNumber(env.CHANNELS_CHAT_INTERVAL_SECONDS, 30),
    groq: env.GROQ_API_KEY
      ? {
          apiKey: env.GROQ_API_KEY,
          model: env.GROQ_MODEL || 'openai/gpt-oss-20b',
          baseUrl: env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
        }
      : undefined,
  }
}
