import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PostsRepository } from '@simplefeed/post'
import { UsersRepository } from '@simplefeed/user'
import { AddressInfo } from 'net'
import request from 'supertest'
import { initializeTransactionalContext } from 'typeorm-transactional'
import { AppModule } from '../app.module'
import { configureApp } from '../app.setup'

/** Boots the full application against the test database, applying pending migrations. */
export async function createTestApp(): Promise<INestApplication> {
  initializeTransactionalContext()
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()
  const app = configureApp(moduleRef.createNestApplication())
  await app.init()
  return app
}

export async function clearDatabase(app: INestApplication): Promise<void> {
  await app.get(PostsRepository).deleteAll()
  await app.get(UsersRepository).deleteAll()
}

/** Starts listening on a random port and returns its base url, for socket clients. */
export function listen(app: INestApplication): string {
  const address = app.getHttpServer().listen().address() as AddressInfo
  return `http://[${address.address}]:${address.port}`
}

export interface TestUser {
  username: string
  firstName: string
  lastName: string
  email: string
  password: string
}

export const bart: TestUser = {
  username: 'bart',
  firstName: 'Bart',
  lastName: 'Simpson',
  email: 'bart@example.com',
  password: 'secret',
}

export const homer: TestUser = {
  username: 'homer',
  firstName: 'Homer',
  lastName: 'Simpson',
  email: 'homer@example.com',
  password: 'secret',
}

export const lisa: TestUser = {
  username: 'lisa',
  firstName: 'Lisa',
  lastName: 'Simpson',
  email: 'lisa@example.com',
  password: 'secret',
}

export const hackerNews: TestUser = {
  username: 'hackernews',
  firstName: 'Hacker',
  lastName: 'News',
  email: 'hackernews@channels.example.com',
  password: 'channel-secret',
}

export const fry: TestUser = {
  username: 'fry',
  firstName: 'Philip J.',
  lastName: 'Fry',
  email: 'fry@example.com',
  password: 'secret',
}

/** Thin wrapper around the HTTP API, so specs read as user stories. */
export class ApiClient {
  constructor(private readonly app: INestApplication) {}

  private get http() {
    return request(this.app.getHttpServer())
  }

  /** Registers the user and returns the created user's id. */
  async register(user: TestUser): Promise<string> {
    const { body } = await this.http
      .post('/api/auth/register')
      .send({ user })
      .expect(201)
    return body.user.id
  }

  /** Logs the user in and returns a bearer token. */
  async login(user: TestUser): Promise<string> {
    const { body } = await this.http
      .post('/api/auth/login')
      .send({ user: { email: user.email, password: user.password } })
      .expect(200)
    return `Bearer ${body.accessToken}`
  }

  /** Registers and logs in the user and returns a bearer token. */
  async signUp(user: TestUser): Promise<string> {
    await this.register(user)
    return this.login(user)
  }

  /** Registers a bot account with the given registration key and returns its id. */
  async registerBot(user: TestUser, registrationKey: string | undefined, expectedStatus = 201) {
    const req = this.http.post('/api/auth/register-bot')
    if (registrationKey) {
      req.set('x-bot-registration-key', registrationKey)
    }
    const { body } = await req.send({ user: { ...user, bio: 'Top stories' } }).expect(expectedStatus)
    return body.user?.id
  }

  async getChannels(token: string) {
    const { body } = await this.http.get('/api/channels').set('Authorization', token).expect(200)
    return body
  }

  async getFeed(token: string) {
    const { body } = await this.http.get('/api/posts').set('Authorization', token).expect(200)
    return body
  }

  async subscribe(token: string, channelUsername: string, expectedStatus = 200) {
    const { body } = await this.http
      .put(`/api/channels/${channelUsername}/subscription`)
      .set('Authorization', token)
      .expect(expectedStatus)
    return body
  }

  async unsubscribe(token: string, channelUsername: string): Promise<void> {
    await this.http
      .delete(`/api/channels/${channelUsername}/subscription`)
      .set('Authorization', token)
      .expect(204)
  }

  async getConversations(token: string) {
    const { body } = await this.http.get('/api/chat').set('Authorization', token).expect(200)
    return body
  }

  async getMe(token: string) {
    const { body } = await this.http.get('/api/users/me').set('Authorization', token).expect(200)
    return body
  }

  async createPost(token: string, content: string): Promise<{ id: string }> {
    const { body } = await this.http
      .post('/api/posts')
      .set('Authorization', token)
      .field('body', content)
      .expect(201)
    return body
  }


  async searchUsers(token: string, text: string) {
    const { body } = await this.http
      .get('/api/search')
      .query({ users: text })
      .set('Authorization', token)
      .expect(200)
    return body
  }
}
