import { loadConfig } from './config'

const required = {
  DATABASE_URL: 'postgres://localhost/test',
  BOT_REGISTRATION_KEY: 'key',
  CHANNEL_PASSWORD: 'password',
}

describe('loadConfig', () => {
  it('reads the intervals', () => {
    const config = loadConfig({
      ...required,
      CHANNELS_POST_INTERVAL_MINUTES: '15',
      CHANNELS_CHAT_INTERVAL_SECONDS: '5',
    })

    expect(config.postIntervalMinutes).toBe(15)
    expect(config.chatIntervalSeconds).toBe(5)
  })

  it.each(['abc', '0', '-5', ''])('falls back to the default interval for %j', (value) => {
    const config = loadConfig({
      ...required,
      CHANNELS_POST_INTERVAL_MINUTES: value,
      CHANNELS_CHAT_INTERVAL_SECONDS: value,
    })

    expect(config.postIntervalMinutes).toBe(60)
    expect(config.chatIntervalSeconds).toBe(30)
  })
})
