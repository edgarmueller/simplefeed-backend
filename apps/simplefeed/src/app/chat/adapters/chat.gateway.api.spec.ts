import { INestApplication } from '@nestjs/common'
import { io, Socket } from 'socket.io-client'
import { ApiClient, bart, clearDatabase, createTestApp, hackerNews, listen } from '../../test/helpers'

describe('chat gateway', () => {
  let app: INestApplication
  let api: ApiClient
  let baseAddress: string
  let clientSocket: Socket

  beforeAll(async () => {
    app = await createTestApp()
    api = new ApiClient(app)
    baseAddress = listen(app)
  })

  beforeEach(async () => {
    await clearDatabase(app)
  })

  afterEach(() => {
    clientSocket?.disconnect()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should join conversations when connecting', async () => {
    const bartToken = await api.signUp(bart)
    await api.registerBot(hackerNews, 'test-bot-registration-key')
    await api.subscribe(bartToken, 'hackernews')

    clientSocket = io(`${baseAddress}/chat`, {
      query: { Authorization: bartToken },
    })
    const joined = await new Promise<{ conversationIds: string[] }>((resolve) =>
      clientSocket.on('conversations_joined', resolve)
    )

    expect(joined.conversationIds).toHaveLength(1)
  })
})
