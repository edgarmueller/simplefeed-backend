import { initializeTransactionalContext } from 'typeorm-transactional'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { UserNotFoundError, UsersRepository } from '@kittgen/user'
import request from 'supertest'
import { createConnection } from 'typeorm'
import { AppModule } from './app.module'
import { PostsRepository } from '@kittgen/post'

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

  describe("comment usecases", () => {
    it("should allow commenting a post ", async () => {
      await registerBart();
      await registerHomer();
      const bartToken = await login('bart@example.com', 'secret')
      const homerToken = await login('homer@example.com', 'secret')

      const post = await createPost(bartToken, 'Hello World')
      await commentPost(homerToken, 'Nice post!', post.id)
      const comments = await getCommentsOfPost(bartToken, post.id)

      expect(comments.items).toHaveLength(1)
    });
  });

  afterAll(async () => {
    await app.close()
  })

  async function createPost(token: string, content: string, expectedStatus = 201) {
    const { body } = await request(app.getHttpServer())
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        body: content
      })
      .expect(expectedStatus)
    return body;
  }

  async function commentPost(token: string, content: string, postId: string, expectedStatus = 201) {
    await request(app.getHttpServer())
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content
      })
      .expect(expectedStatus)
  }

  async function getCommentsOfPost(token: string, postId: string, expectedStatus = 200) {
    const { body } = await request(app.getHttpServer())
      .get(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
//      .expect(expectedStatus)
    return body;
  }
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
