import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PostsRepository } from '@simplefeed/post'
import { UsersRepository } from '@simplefeed/user'
import request from 'supertest'
import { initializeTransactionalContext } from 'typeorm-transactional'
import { AppModule } from './app.module'
import { createDbSchema } from './test/helpers'

describe('comment api', () => {
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

  async function registerBart() {
    await registerUser(
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
    return body.accessToken
  }

  beforeEach(async () => {
    await postRepo.deleteAll()
    await userRepo.deleteAll()
  })

  describe('comment usecases', () => {
    it('should allow commenting a post ', async () => {
      await registerBart()
      await registerHomer()
      const bartToken = await login('bart@example.com', 'secret')
      const homerToken = await login('homer@example.com', 'secret')

      const post = await createPost(bartToken, 'Hello World')
      await commentPost(homerToken, 'Nice post!', post.id)
      const comments = await getCommentsOfPost(bartToken, post.id)

      expect(comments.items).toHaveLength(1)
    })
  })

  afterAll(async () => {
    await app.close()
  })

  async function createPost(
    token: string,
    content: string,
    expectedStatus = 201
  ) {
    try {
      const { body } = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'multipart/form-data')
        .field('body', content)
        .expect(expectedStatus)
      return body
    } catch (error) {
      console.log(error)
    }
  }

  async function commentPost(
    token: string,
    content: string,
    postId: string,
    expectedStatus = 201
  ) {
    await request(app.getHttpServer())
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content,
      })
      .expect(expectedStatus)
  }

  async function getCommentsOfPost(
    token: string,
    postId: string,
    expectedStatus = 200
  ) {
    const { body } = await request(app.getHttpServer())
      .get(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .expect(expectedStatus)
    return body
  }
})
