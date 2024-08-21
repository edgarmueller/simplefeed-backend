import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PostsRepository } from '@simplefeed/post'
import { UsersRepository } from '@simplefeed/user'
import request from 'supertest'
import { initializeTransactionalContext } from 'typeorm-transactional'
import { AppModule } from './app.module'
import { GetFriendRequestDto } from './friends/dto/get-friend-request.dto'
import { createDbSchema } from './test/helpers'

describe('friend request api', () => {
  let app: INestApplication
  let userRepo: UsersRepository
  let postRepo: PostsRepository

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
    await app.init()
  })

  async function registerUser(payload, expectedStatus = 201) {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
      .expect(expectedStatus)
  }

  async function registerFry() {
    await registerUser(
      user('fry', 'Philip J.', 'Fry', 'fry@example.com', 'secret'),
      201
    )
  }

  async function registerLisa() {
    await registerUser(
      user('lisa', 'Lisa', 'Simpson', 'lisa@example.com', 'secret'),
      201
    )
  }

  async function sendFriendRequest(
    userToken: string,
    toUsername: string
  ): Promise<GetFriendRequestDto> {
    const { body } = await request(app.getHttpServer())
      .post(`/api/friend-requests/${toUsername}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send()
      .expect(201)
    return body
  }

  async function confirmFriendRequest(
    userToken: string,
    friendRequestId: string
  ) {
    await request(app.getHttpServer())
      .patch(`/api/friend-requests/${friendRequestId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
  }

  async function declineFriendRequest(
    userToken: string,
    friendRequestId: string
  ) {
    await request(app.getHttpServer())
      .delete(`/api/friend-requests/${friendRequestId}`)
      .set('Authorization', `Bearer ${userToken}`)
  }

  async function getPendingFriendRequests(userToken: string) {
    const { body } = await request(app.getHttpServer())
      .get(`/api/friend-requests/pending`)
      .set('Authorization', `Bearer ${userToken}`)
    return body
  }

  async function getFriendsOf(username: string, userToken: string) {
    const { body } = await request(app.getHttpServer())
      .get(`/api/users/${username}`)
      .set('Authorization', `Bearer ${userToken}`)
    return body.friends
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
    return body.accessToken
  }

  beforeEach(async () => {
    await postRepo.deleteAll()
    await userRepo.deleteAll()
  })

  describe('friends usecases', () => {
    it('should send friend request to another user', async () => {
      await registerFry()
      await registerLisa()
      const fryToken = await login('fry@example.com', 'secret')
      const lisaToken = await login('lisa@example.com', 'secret')

      await sendFriendRequest(fryToken, 'lisa')
      const pendingRequests = await getPendingFriendRequests(lisaToken)

      expect(pendingRequests).toHaveLength(1)
    })

    it('should accept friend request', async () => {
      await registerFry()
      await registerLisa()
      const frysToken = await login('fry@example.com', 'secret')
      const lisasToken = await login('lisa@example.com', 'secret')
      const friendRequest = await sendFriendRequest(frysToken, 'lisa')
      await confirmFriendRequest(lisasToken, friendRequest.id)
      const pendingFriendRequests = await getPendingFriendRequests(lisasToken)
      const frysFriends = await getFriendsOf('fry', frysToken)
      const lisasFriends = await getFriendsOf('lisa', frysToken)

      expect(pendingFriendRequests).toHaveLength(0)
      expect(frysFriends).toHaveLength(1)
      expect(lisasFriends).toHaveLength(1)
    })

    it('should cancel friend request to another user', async () => {
      await registerFry()
      await registerLisa()
      const fryToken = await login('fry@example.com', 'secret')
      const lisaToken = await login('lisa@example.com', 'secret')

      const friendRequest = await sendFriendRequest(fryToken, 'lisa')
      await declineFriendRequest(lisaToken, friendRequest.id)
      const pendingRequests = await getPendingFriendRequests(lisaToken)

      expect(pendingRequests).toHaveLength(0)
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
