import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { ReaderRepository } from '@simplefeed/reader'
import { UsersRepository } from '@simplefeed/user'
import request from 'supertest'
import { initializeTransactionalContext } from 'typeorm-transactional'
import { AppModule } from '../app.module'
import { configureApp } from '../app.setup'

export const WORKER_KEY = 'test-worker-api-key'
export const HACKER_NEWS = 'cha-hackernews'

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

/** Removes everything but the built-in Hacker News channel. */
export async function clearDatabase(app: INestApplication): Promise<void> {
  await app.get(ReaderRepository).deleteAll()
  await app.get(UsersRepository).deleteAll()
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

export const lisa: TestUser = {
  username: 'lisa',
  firstName: 'Lisa',
  lastName: 'Simpson',
  email: 'lisa@example.com',
  password: 'secret',
}

/** Thin wrapper around the HTTP API as a reader sees it, so specs read as user stories. */
export class ApiClient {
  constructor(private readonly app: INestApplication) {}

  private get http() {
    return request(this.app.getHttpServer())
  }

  /** Registers the user and returns the created user's id. */
  async register(user: TestUser): Promise<string> {
    const { body } = await this.http.post('/api/auth/register').send({ user }).expect(201)
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

  async getMe(token: string) {
    const { body } = await this.http.get('/api/users/me').set('Authorization', token).expect(200)
    return body
  }

  async getChannels(token: string) {
    const { body } = await this.http.get('/api/channels').set('Authorization', token).expect(200)
    return body
  }

  async addFeed(token: string, url: string, expectedStatus = 201) {
    const { body } = await this.http.post('/api/channels').set('Authorization', token).send({ url }).expect(expectedStatus)
    return body
  }

  async subscribe(token: string, channelId: string, expectedStatus = 200) {
    const { body } = await this.http
      .put(`/api/channels/${channelId}/subscription`)
      .set('Authorization', token)
      .expect(expectedStatus)
    return body
  }

  async unsubscribe(token: string, channelId: string): Promise<void> {
    await this.http.delete(`/api/channels/${channelId}/subscription`).set('Authorization', token).expect(204)
  }

  async getSubscriptions(token: string) {
    const { body } = await this.http.get('/api/subscriptions').set('Authorization', token).expect(200)
    return body
  }

  async getFeed(token: string, query: Record<string, string> = {}) {
    const { body } = await this.http.get('/api/feed').query(query).set('Authorization', token).expect(200)
    return body
  }

  async markEntry(token: string, entryId: string, state: { read?: boolean; liked?: boolean; saved?: boolean }, expectedStatus = 200) {
    const { body } = await this.http.patch(`/api/feed/${entryId}`).set('Authorization', token).send(state).expect(expectedStatus)
    return body
  }

  async markAllRead(token: string, channelId?: string) {
    const { body } = await this.http.post('/api/feed/read').set('Authorization', token).send({ channelId }).expect(200)
    return body
  }

  async getMessages(token: string, subscriptionId: string, expectedStatus = 200) {
    const { body } = await this.http
      .get(`/api/subscriptions/${subscriptionId}/messages`)
      .set('Authorization', token)
      .expect(expectedStatus)
    return body
  }

  async sendMessage(token: string, subscriptionId: string, content: string) {
    const { body } = await this.http
      .post(`/api/subscriptions/${subscriptionId}/messages`)
      .set('Authorization', token)
      .send({ content })
      .expect(201)
    return body
  }
}

export interface TestItem {
  externalId: string
  title: string
  url: string
  domain: string
  publishedAt: string
  score?: number
  excerpt?: string
}

export const item = (externalId: string, title: string, overrides: Partial<TestItem> = {}): TestItem => ({
  externalId,
  title,
  url: `https://example.com/${externalId}`,
  domain: 'example.com',
  publishedAt: new Date().toISOString(),
  ...overrides,
})

/** The worker API, authenticated with the worker key. */
export class WorkerClient {
  constructor(
    private readonly app: INestApplication,
    private readonly key: string | undefined = WORKER_KEY
  ) {}

  private call(method: 'get' | 'post', path: string) {
    const req = request(this.app.getHttpServer())[method](`/api/worker${path}`)
    return this.key ? req.set('x-worker-key', this.key) : req
  }

  async channels(status = 'active', expectedStatus = 200) {
    const { body } = await this.call('get', `/channels?status=${status}`).expect(expectedStatus)
    return body
  }

  async activate(channelId: string, found: { feedUrl: string; name: string; description?: string }) {
    const { body } = await this.call('post', `/channels/${channelId}/activate`).send(found).expect(201)
    return body
  }

  async fail(channelId: string, error: string) {
    const { body } = await this.call('post', `/channels/${channelId}/fail`).send({ error }).expect(201)
    return body
  }

  async storeItems(channelId: string, items: TestItem[]) {
    const { body } = await this.call('post', `/channels/${channelId}/items`).send({ items }).expect(200)
    return body
  }

  async subscriptions(channelId: string, since = new Date(0)) {
    const { body } = await this.call('get', `/channels/${channelId}/subscriptions?since=${since.toISOString()}`).expect(200)
    return body
  }

  async fresh(since = new Date(0)) {
    const { body } = await this.call('get', `/subscriptions/fresh?since=${since.toISOString()}`).expect(200)
    return body
  }

  async candidates(subscriptionId: string, since = new Date(0)) {
    const { body } = await this.call('get', `/subscriptions/${subscriptionId}/candidates?since=${since.toISOString()}`).expect(200)
    return body
  }

  async pick(subscriptionId: string, picks: { itemId: string; summary?: string }[]) {
    await this.call('post', `/subscriptions/${subscriptionId}/picks`).send({ picks }).expect(204)
  }

  async unanswered() {
    const { body } = await this.call('get', '/messages/unanswered').expect(200)
    return body
  }

  async answer(messageId: string, reply: string, preferences?: object) {
    await this.call('post', `/messages/${messageId}/answer`).send({ reply, preferences }).expect(204)
  }
}
