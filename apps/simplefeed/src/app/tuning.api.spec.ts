import { INestApplication } from '@nestjs/common'
import { ApiClient, HACKER_NEWS, WorkerClient, bart, clearDatabase, createTestApp, lisa } from './test/helpers'

describe('tuning api', () => {
  let app: INestApplication
  let api: ApiClient
  let worker: WorkerClient

  beforeAll(async () => {
    app = await createTestApp()
    api = new ApiClient(app)
    worker = new WorkerClient(app)
  })

  beforeEach(async () => {
    await clearDatabase(app)
  })

  afterAll(async () => {
    await app.close()
  })

  it("should pass a reader's message to the worker and apply its answer", async () => {
    const token = await api.signUp(bart)
    const subscription = await api.subscribe(token, HACKER_NEWS)

    await api.sendMessage(token, subscription.id, 'mute crypto')
    const [message] = await worker.unanswered()

    expect(message).toMatchObject({ subscriptionId: subscription.id, content: 'mute crypto', channel: { id: HACKER_NEWS } })

    await worker.answer(message.id, 'Leaving out crypto from now on.', { ...message.preferences, muted: ['Crypto'] })

    expect(await api.getMessages(token, subscription.id)).toEqual([
      expect.objectContaining({ author: 'reader', content: 'mute crypto' }),
      expect.objectContaining({ author: 'channel', content: 'Leaving out crypto from now on.' }),
    ])
    expect((await api.getSubscriptions(token))[0].preferences.muted).toEqual(['crypto'])
    expect(await worker.unanswered()).toEqual([])
  })

  it("should keep a reader's chats to themselves", async () => {
    const token = await api.signUp(bart)
    const lisaToken = await api.signUp(lisa)
    const subscription = await api.subscribe(token, HACKER_NEWS)

    await api.getMessages(lisaToken, subscription.id, 403)
  })
})
