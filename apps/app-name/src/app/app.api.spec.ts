import { initializeTransactionalContext } from 'typeorm-transactional'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { UserNotFoundError, UsersRepository } from '@kittgen/user'
import request from 'supertest'
import { createConnection } from 'typeorm'
import { AppModule } from './app.module'
import { PostsRepository } from '@kittgen/post'

describe('realworld app', () => {
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
      user('fry2', 'Philip J.', 'Fry', 'fry2@example.com', 'secret'),
      201
    )
  }

  async function registerLisa() {
    await registerUser(
      user('lisa2', 'Lisa', 'Simpson', 'lisa2@example.com', 'secret'),
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

  async function createPost(token: string, content: string, expectedStatus = 201) {
    await request(app.getHttpServer())
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        body: content
      })
      .expect(expectedStatus)
  }

  beforeEach(async () => {
    try {
      await postRepo.deleteAll()
      await userRepo.deleteByEmail('fry2@example.com')
      await userRepo.deleteByEmail('lisa2@example.com')
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        // ignore
        return
      }
      throw error
    }
  })

  describe.only('user registration', () => {
    it(`should register an user`, async () => {
      return registerFry()
    })

    it(`should return bad request when user's mail already exists`, async () => {
      const payload = {
        user: {
          username: 'Fry',
          firstName: 'Philip J.',
          lastName: 'Fry',
          email: 'fry2@example.com',
          password: 'secret',
        },
      }
      await registerUser(payload, 201)
      await registerUser(payload, 409)
    })

    it(`should return bad request when DTO is missing `, async () => {
      await registerUser(
        {
          user: {
            name: 'Philip J. Fry',
            email: 'fry2@example.com',
            password: 'secret',
          },
        },
        400
      )
    })
  })

  describe.only('user login', () => {
    it('should login an user', async () => {
      await registerFry()
      const token = await login('fry2@example.com', 'secret', 200)
      expect(token).toBeDefined()
    })
  })

  // TODO disabled, no refresh functionality necessary
  it.skip('should refresh token', async () => {
    await registerFry();
    const body = await login('fry2@example.com', 'secret')
    const { body: updatedBody } = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({
        refreshToken: body.refreshToken,
      })
      .expect(200)
    expect(body.accessToken).not.toBe(updatedBody.accessToken)
  })

  describe('post usecases ', () => {
    it('should allow submitting a new post', async () => {
      await registerFry();
      const resp = await login('fry2@example.com', 'secret')
      await createPost(resp.accessToken, 'All backend implementations need to adhere to our API spec.')
    });

    it('should allow fetching own post', async () => {
      await registerFry();
      const resp = await login('fry2@example.com', 'secret')
      const accessToken = resp.accessToken;
      await createPost(accessToken, 'Hi everyone!');
      await createPost(accessToken, `I'm here, too!`);
      const { body } = await request(app.getHttpServer())
        .get('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      // TODO: no need to expose entire profile for author prop
      // update dto
      expect(body.items).toHaveLength(2);
    })
  })

  it('should update article', async () => {
    await registerFry();
    const resp = await login('fry2@example.com', 'secret')
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${resp.accessToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
          tagList: ['learning'],
        },
      })

    const {
      body: { article },
    } = await request(app.getHttpServer())
      .put('/api/articles/Introduction')
      .set('Authorization', `Bearer ${resp.accessToken}`)
      .send({
        article: {
          title: 'Introduction 2',
          tagList: ['learning', 'foo'],
        },
      })
      .expect(200)

    expect(article.title).toBe('Introduction 2')
    expect(article.tagList).toEqual(['foo', 'learning'])
  })

  it('should delete article', async () => {
    await registerFry();
    await registerLisa();
    const fryToken = await login('fry2@example.com', 'secret')
    const lisaToken = await login('lisa2@example.com', 'secret')
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
          tagList: ['learning'],
        },
      })

    await request(app.getHttpServer())
      .delete('/api/articles/Introduction')
      .set('Authorization', `Bearer ${lisaToken}`)
      .expect(403)

    await request(app.getHttpServer())
      .delete('/api/articles/Introduction')
      .set('Authorization', `Bearer ${fryToken}`)
      .expect(200)
  })

  it('should fetch articles by tag', async () => {
    await registerFry();
    await registerLisa();
    const fryToken = await login('fry2@example.com', 'secret')
    const lisaToken = await login('lisa2@example.com', 'secret')
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${lisaToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
          tagList: ['tutorial'],
        },
      })
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${lisaToken}`)
      .send({
        article: {
          body: 'El Barto was here',
          description: 'El Barto',
          title: 'El Barto',
          tagList: ['simpsons'],
        },
      })

    const { body } = await request(app.getHttpServer())
      .get(`/api/articles?tag=tutorial`)
      .set('Authorization', `Bearer ${fryToken}`)
      .expect(200)

    const { body: emptyResponse } = await request(app.getHttpServer())
      .get(`/api/articles?tag=dogs`)
      .set('Authorization', `Bearer ${fryToken}`)
      .expect(200)

    expect(body.articles).toHaveLength(1)
    expect(emptyResponse.articles).toHaveLength(0)
  })

  it('should get feed of articles', async () => {
    await registerFry();
    await registerLisa();
    const {
      user: { token: fryToken },
    } = await login('fry2@example.com', 'secret')
    const {
      user: { token: lisaToken },
    } = await login('lisa2@example.com', 'secret')
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${lisaToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
        },
      })

    await request(app.getHttpServer())
      .post(`/api/profiles/lisa/follow`)
      .set('Authorization', `Bearer ${fryToken}`)
      .expect(200)

    const { body } = await request(app.getHttpServer())
      .get('/api/articles/feed')
      .set('Authorization', `Bearer ${fryToken}`)

    expect(body.articles).toHaveLength(1)
  })

  it('should add comment', async () => {
    await registerFry();
    const {
      user: { token: fryToken },
    } = await login('fry2@example.com', 'secret')
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
        },
      })

    await request(app.getHttpServer())
      .post(`/api/articles/Introduction/comments`)
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        comment: {
          body: 'A new comment',
        },
      })
      .expect(200)

    const {
      body: { comments },
    } = await request(app.getHttpServer())
      .get('/api/articles/Introduction/comments')
      .set('Authorization', `Bearer ${fryToken}`)

    expect(comments).toHaveLength(1)
  })

  it('should delete comment', async () => {
    await registerFry()
    const {
      user: { token: fryToken },
    } = await login('fry2@example.com', 'secret')
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
        },
      })
    const {
      body: { comment },
    } = await request(app.getHttpServer())
      .post(`/api/articles/Introduction/comments`)
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        comment: {
          body: 'A new comment',
        },
      })
    await request(app.getHttpServer())
      .delete(`/api/articles/Introduction/comments/${comment.id}`)
      .set('Authorization', `Bearer ${fryToken}`)
      .expect(200)

    const {
      body: { comments },
    } = await request(app.getHttpServer())
      .get('/api/articles/Introduction/comments')
      .set('Authorization', `Bearer ${fryToken}`)

    expect(comments).toHaveLength(0)
  })

  it('should favorite article', async () => {
    await registerFry()
    await registerLisa()
    const {
      user: { token: fryToken },
    } = await login('fry2@example.com', 'secret')
    const {
      user: { token: lisaToken },
    } = await login('lisa2@example.com', 'secret')
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
        },
      })
    const {
      body: { article },
    } = await request(app.getHttpServer())
      .post(`/api/articles/Introduction/favorite`)
      .set('Authorization', `Bearer ${lisaToken}`)
      .expect(200)

    expect(article.favoritesCount).toBe(1)
    expect(article.favorited).toBe(true)
  })

  it('should unfavorite article', async () => {
    await registerFry()
    await registerLisa()
    const {
      user: { token: fryToken },
    } = await login('fry2@example.com', 'secret')
    const {
      user: { token: lisaToken },
    } = await login('lisa2@example.com', 'secret')
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
        },
      })
    await request(app.getHttpServer())
      .post(`/api/articles/Introduction/favorite`)
      .set('Authorization', `Bearer ${lisaToken}`)
      .expect(200)
    const {
      body: { article },
    } = await request(app.getHttpServer())
      .delete(`/api/articles/Introduction/favorite`)
      .set('Authorization', `Bearer ${lisaToken}`)
      .expect(200)

    expect(article.favoritesCount).toBe(0)
    expect(article.favorited).toBe(false)
  })

  afterAll(async () => {
    await app.close()
  })
})

export async function createDbSchema(): Promise<void> {
  const connection = await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'admin',
    password: 'admin',
    database: 'kittgen_testing',
  })
  await connection.createQueryRunner().createSchema('kittgen', true)
  await connection.close()
}
