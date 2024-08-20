import { initializeTransactionalContext } from 'typeorm-transactional'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { UserNotFoundError, UsersRepository } from '@simplefeed/user'
import request from 'supertest'
import { createConnection } from 'typeorm'
import { PostsRepository } from '@simplefeed/post'
import { NotificationCreatedEvent, Notification } from '@simplefeed/notification'
import * as io from 'socket.io-client';
import { AppModule } from '../../app.module'
import { NotificationsGateway } from './notifications.gateway'
import { Outgoing } from './notification.constants'

describe('Notifications gateway', () => {
  let app: INestApplication
  let userRepo: UsersRepository
  let postRepo: PostsRepository
  let notificationsGateway: NotificationsGateway

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
    notificationsGateway = app.get(NotificationsGateway)
    await app.init()
  })

  async function registerUser(payload, expectedStatus = 201) {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
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
    await postRepo.deleteAll()
    await userRepo.deleteAll()
  })

  describe("notification usecases", () => {

    let clientSocket;
    let baseAddress;

    beforeAll(() => {
      const address = app.getHttpServer().listen().address()
      baseAddress = `http://[${address.address}]:${address.port}`
    });

    afterEach(() => {
      clientSocket.disconnect();
    });

    it("should receive messages when connecting", (done) => {
      registerBart()
        .then(() => login('bart@example.com', 'secret'))
        .then((bartToken) => {
          clientSocket = io.connect(`${baseAddress}/notifications`, {
            query: {
              Authorization: bartToken
            }
          });
          clientSocket.on("send_all_notifications", (arg) => {
            // no messages
            expect(arg).toEqual([]);
            done();
          });
        })
    });

    it("should receive notification", (done) => {
      registerBart()
        .then(bart => {
          login('bart@example.com', 'secret')
            .then(token => {
              clientSocket = io.connect(`${baseAddress}/notifications`, {
                query: {
                  Authorization: token
                }
              });
              clientSocket.on("send_all_notifications", (arg) => {
                notificationsGateway.handle(new NotificationCreatedEvent(Notification.create({
                  recipientId: bart.body.user.id,
                  senderId: 'sender-id',
                  content: 'content',
                  opened: false,
                  viewed: false,
                  type: 'type',
                  resourceId: 'resource-id'
                })))
              });
              clientSocket.on(Outgoing.ReceiveNotification, (arg) => {
                // no messages
                expect(arg.recipientId).toEqual(bart.body.user.id);
                done();
              });
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
