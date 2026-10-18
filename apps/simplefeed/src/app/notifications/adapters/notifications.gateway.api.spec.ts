import { INestApplication } from '@nestjs/common'
import { Notification, NotificationCreatedEvent } from '@simplefeed/notification'
import { io, Socket } from 'socket.io-client'
import { ApiClient, bart, clearDatabase, createTestApp, listen } from '../../test/helpers'
import { Outgoing } from './notification.constants'
import { NotificationsGateway } from './notifications.gateway'

describe('notifications gateway', () => {
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

  function connect(token: string): Socket {
    return io(`${baseAddress}/notifications`, {
      query: { Authorization: token },
    })
  }

  it('should send all unviewed notifications when connecting', async () => {
    const token = await api.signUp(bart)

    clientSocket = connect(token)
    const notifications = await new Promise((resolve) =>
      clientSocket.on(Outgoing.SendAllNotifications, resolve)
    )

    expect(notifications).toEqual([])
  })

  it('should push new notifications to the recipient', async () => {
    const bartId = await api.register(bart)
    const token = await api.login(bart)

    clientSocket = connect(token)
    await new Promise((resolve) => clientSocket.on(Outgoing.SendAllNotifications, resolve))
    const received = new Promise<{ recipientId: string }>((resolve) =>
      clientSocket.on(Outgoing.ReceiveNotification, resolve)
    )
    app.get(NotificationsGateway).handle(
      new NotificationCreatedEvent(
        Notification.create({
          recipientId: bartId,
          senderId: 'sender-id',
          content: 'content',
          opened: false,
          viewed: false,
          type: 'type',
          resourceId: 'resource-id',
        })
      )
    )

    expect((await received).recipientId).toEqual(bartId)
  })
})
