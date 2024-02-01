import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PostsRepository } from '@simplefeed/post'
import { UserNotFoundError, UsersRepository } from '@simplefeed/user'
import * as io from 'socket.io-client'
import { Socket } from 'socket.io-client'
import request from 'supertest'
import { createConnection } from 'typeorm'
import { initializeTransactionalContext } from 'typeorm-transactional'
import { AppModule } from '../../app.module'
import { ChatGateway } from './chat.gateway'

describe('Chat gateway', () => {
  let app: INestApplication
  let userRepo: UsersRepository
  let postRepo: PostsRepository
  let chatGateway: ChatGateway

  beforeAll(async () => {
    await createDbSchema()
    initializeTransactionalContext()
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    // TODO unify app config
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        whitelist: true,
      })
    )
    userRepo = app.get(UsersRepository)
    postRepo = app.get(PostsRepository)
    chatGateway = app.get(ChatGateway)
    await app.init()
  })

  async function registerUser(payload, expectedStatus = 201) {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
      .expect(expectedStatus)
  }

  async function sendFriendRequest(toUser, withToken, expectedStatus = 201) {
    const friendRequest = await request(app.getHttpServer())
      .post(`/api/friend-requests/${toUser}`)
      .set('Authorization', withToken)
      .expect(expectedStatus)
    return friendRequest.body
  }

  async function acceptFriendRequest(friendRequestId, withToken, expectedStatus = 200) {
    return request(app.getHttpServer())
      .patch(`/api/friend-requests/${friendRequestId}`)
      .set('Authorization', withToken)
      .expect(expectedStatus)
  }

  async function registerBart() {
    return registerUser(
      user('bart', 'Bart', 'Simpson', 'bart@example.com', 'secret'),
      201
    )
  }

  async function registerHomer() {
    await registerUser(
      user('homer', 'Homer', 'Simpson', 'homer@example.com', 'secret'),
      201
    )
  }
  async function befriend(senderToken, receiverToken, otherUser) {
    const friendRequest = await sendFriendRequest(otherUser, senderToken)
    await acceptFriendRequest(friendRequest.id, receiverToken)
  }

  function user(
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    password
  ) {
    return {
      user: {
        username,
        firstName,
        lastName,
        email,
        password,
      },
    }
  }

  async function login(email: string, password: string, expectedStatus = 200) {
    const { body } = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        user: {
          email,
          password,
        },
      })
      .expect(expectedStatus)
    return body.accessToken;
  }

  beforeEach(async () => {
    try {
      await postRepo.deleteAll()
      await userRepo.deleteByEmail('bart@example.com')
      await userRepo.deleteByEmail('homer@example.com')
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        // ignore
        return
      }
      throw error
    }
  })

  describe("chat usecases", () => {

    let clientSocket: Socket;
    let baseAddress;

    beforeAll(() => {
      const address = app.getHttpServer().listen().address()
      baseAddress = `http://[${address.address}]:${address.port}`
    });

    afterEach(() => {
      clientSocket.disconnect();
    });

    it("should join conversations when connecting", (done) => {
      registerBart()
        .then(() => registerHomer())
        .then(async () => {
          const bartToken = await login('bart@example.com', 'secret')
          const homerToken = await login('homer@example.com', 'secret')
          await befriend(bartToken, homerToken, 'homer')
          return bartToken
        })
        .then((bartToken) => {
          clientSocket = io.connect(`${baseAddress}/chat`, {
            query: {
              Authorization: `Bearer ${bartToken}`,
            },
          });
          clientSocket.on('conversations_joined', convs => {
            expect(convs.conversationIds.length).toEqual(1);
            done();
          })
        })
    });

    it.skip("should receive notification", (done) => {
      registerBart()
        .then(bart => {
          login('bart@example.com', 'secret')
            .then(token => {
              clientSocket = io.connect(`${baseAddress}/notifications`, {
                query: {
                  Authorization: token
                }
              });
              // clientSocket.on("send_all_notifications", (arg) => {
              //   chatGateway.handle(new NotificationCreatedEvent(Notification.create({
              //     recipientId: bart.body.user.id,
              //     senderId: 'sender-id',
              //     content: 'content',
              //     opened: false,
              //     viewed: false,
              //     type: 'type',
              //     resourceId: 'resource-id'
              //   })))
              // });
              // clientSocket.on(Outgoing.ReceiveNotification, (arg) => {
              //   // no messages
              //   expect(arg.recipientId).toEqual(bart.body.user.id);
              //   done();
              // });
            })
        });
    });
  });

  afterAll(async () => {
    await app.close()
  })
})

// FIXME
export async function createDbSchema(): Promise<void> {
  const connection = await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'admin',
    password: 'admin',
    database: 'simplefeed_testing',
  })
  await connection.createQueryRunner().createSchema('simplefeed', true)
  await connection.close()
}
