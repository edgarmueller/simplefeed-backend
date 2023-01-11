import { initializeTransactionalContext } from 'typeorm-transactional';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserNotFoundError, UserRepository } from '@realworld/user';
import { ArticleRepository } from '@realworld/article';
import request from 'supertest';
import { createConnection } from 'typeorm';
import { AppModule } from './app.module';

describe('realworld app', () => {
  let app: INestApplication;
  let userRepo: UserRepository;
  let articleRepo: ArticleRepository;

  beforeAll(async () => {
    await createDbSchema()
    initializeTransactionalContext()
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    // TODO unify app config
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        whitelist: true
      })
    );
    userRepo = app.get(UserRepository);
    articleRepo = app.get(ArticleRepository);
    await app.init();
  });

  async function registerUser(payload, expectedStatus = 201) {
    return request(app.getHttpServer())
      .post('/api/users')
      .send(payload)
      .expect(expectedStatus);
  }

  function user(username: string, email: string, password) {
    return {
      user: {
        username,
        email,
        password
      },
    }
  }

  async function login(email: string, password: string, expectedStatus = 200) {
    const { body } = await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email,
          password,
        },
      })
      .expect(expectedStatus);
    return body;
  }

  beforeEach(async () => {
    try {
      const articles = await articleRepo.find({})
      await articleRepo.delete(articles)
      await userRepo.deleteByEmail('fry@example.com')
      await userRepo.deleteByEmail('lisa@example.com')
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        // ignore
        return;
      }
      throw error;
    }
  });

  describe('user registration', () => {
    it(`should register an user`, async () => {
      return registerUser(
        user('Fry', 'fry@example.com', 'secret'),
        201
      );
    });

    it(`should return bad request when user's mail already exists`, async () => {
      const payload = {
        user: {
          username: 'Fry',
          email: 'fry@example.com',
          password: 'secret',
        },
      };
      await registerUser(payload, 201);
      await registerUser(payload, 409);
    });

    it(`should return bad request when DTO is missing `, async () => {
      await registerUser(
        {
          user: {
            name: 'Philip J. Fry',
            email: 'fry@example.com',
            password: 'secret',
          }
        },
        400
      );
    });
  });

  describe('user login', () => {
    it('should login an user', async () => {
      await registerUser(
        user('Fry', 'fry@example.com', 'secret'),
        201
      );
      const body = await login('fry@example.com', 'secret', 200);
      expect(body).toHaveProperty('user.token');
    });
  });

  // TODO disabled, no refresh functionality necessary
  it.skip('should refresh token', async () => {
    await registerUser(
      user('Fry', 'fry@example.com', 'secret'),
      201
    );
    const body = await login('fry@example.com', 'secret');
    const { body: updatedBody } = await request(app.getHttpServer())
      .post('/api/users/refresh')
      .send({
        refreshToken: body.refreshToken,
      })
      .expect(200);
    expect(body.accessToken).not.toBe(updatedBody.accessToken);
  });

  it('should return the current user', async () => {
    await registerUser(
      {
        user: {
          username: 'Fry',
          email: 'fry@example.com',
          password: 'secret',
        },
      },
      201
    );
    const resp = await login('fry@example.com', 'secret');
    const { body } = await request(app.getHttpServer())
      .get('/api/user')
      .set('Authorization', `Bearer ${resp.user.token}`)
      .expect(200);
    expect(body).toHaveProperty('user.email');
  });

  it('should create article', async () => {
    await registerUser(user('Fry','fry@example.com', 'secret'), 201);
    const resp = await login('fry@example.com', 'secret');
    const { body } = await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${resp.user.token}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
          tagList: ['learning']
        }
      })
      .expect(201);

    expect(body).toHaveProperty('article');
    expect(body.article.tagList).toEqual(['learning']);
  })

  it('should update article', async () => {
    await registerUser(user('Fry', 'fry@example.com', 'secret'), 201);
    const resp = await login('fry@example.com', 'secret');
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${resp.user.token}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
          tagList: ['learning']
        }
      })

    const { body: { article } } = await request(app.getHttpServer())
      .put('/api/articles/Introduction')
      .set('Authorization', `Bearer ${resp.user.token}`)
      .send({
        article: {
          title: 'Introduction 2',
          tagList: ['learning', 'foo']
        }
      })
      .expect(200)

    expect(article.title).toBe('Introduction 2')
    expect(article.tagList).toEqual(['foo', 'learning'])
  })

  it('should delete article', async () => {
    await registerUser(user('Fry', 'fry@example.com', 'secret'), 201);
    await registerUser(user('Lisa', 'lisa@example.com', 'secret'), 201);
    const { user: { token: fryToken }} = await login('fry@example.com', 'secret');
    const { user: { token: lisaToken }} = await login('lisa@example.com', 'secret');
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
          tagList: ['learning']
        }
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
    await registerUser(user('fry', 'fry@example.com', 'secret'), 201);
    await registerUser(user('lisa', 'lisa@example.com', 'secret'), 201);
    const { user: { token: fryToken }} = await login('fry@example.com', 'secret');
    const { user: { token: lisaToken }} = await login('lisa@example.com', 'secret');
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${lisaToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
          tagList: ['tutorial']
        }
      })
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${lisaToken}`)
      .send({
        article: {
          body: 'El Barto was here',
          description: 'El Barto',
          title: 'El Barto',
          tagList: ['simpsons']
        }
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
    await registerUser(user('fry', 'fry@example.com', 'secret'), 201);
    await registerUser(user('lisa', 'lisa@example.com', 'secret'), 201);
    const { user: { token: fryToken }} = await login('fry@example.com', 'secret');
    const { user: { token: lisaToken }} = await login('lisa@example.com', 'secret');
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${lisaToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
        }
      })

    await request(app.getHttpServer())
      .post(`/api/profiles/lisa/follow`)
      .set('Authorization', `Bearer ${fryToken}`)
      .expect(200)

    const {body } = await request(app.getHttpServer())
      .get('/api/articles/feed')
      .set('Authorization', `Bearer ${fryToken}`)

    expect(body.articles).toHaveLength(1)
  })

  it('should add comment', async () => {
    await registerUser(user('fry', 'fry@example.com', 'secret'), 201);
    const { user: { token: fryToken }} = await login('fry@example.com', 'secret');
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
        }
      })

    await request(app.getHttpServer())
      .post(`/api/articles/Introduction/comments`)
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        comment: {
          body: 'A new comment'
        }
      })
      .expect(200)

    const { body: { comments } } = await request(app.getHttpServer())
      .get('/api/articles/Introduction/comments')
      .set('Authorization', `Bearer ${fryToken}`)

    expect(comments).toHaveLength(1)
  })

  it('should delete comment', async () => {
    await registerUser(user('fry', 'fry@example.com', 'secret'), 201);
    const { user: { token: fryToken }} = await login('fry@example.com', 'secret');
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
        }
      })
    const { body: { comment } } = await request(app.getHttpServer())
      .post(`/api/articles/Introduction/comments`)
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        comment: {
          body: 'A new comment'
        }
      })
    await request(app.getHttpServer())
      .delete(`/api/articles/Introduction/comments/${comment.id}`)
      .set('Authorization', `Bearer ${fryToken}`)
      .expect(200)

    const { body: { comments } } = await request(app.getHttpServer())
      .get('/api/articles/Introduction/comments')
      .set('Authorization', `Bearer ${fryToken}`)

    expect(comments).toHaveLength(0)
  })

  it('should favorite article', async () => {
    await registerUser(user('fry', 'fry@example.com', 'secret'), 201);
    await registerUser(user('lisa', 'lisa@example.com', 'secret'), 201);
    const { user: { token: fryToken }} = await login('fry@example.com', 'secret');
    const { user: { token: lisaToken }} = await login('lisa@example.com', 'secret');
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
        }
      })
    const { body: { article } } = await request(app.getHttpServer())
      .post(`/api/articles/Introduction/favorite`)
      .set('Authorization', `Bearer ${lisaToken}`)
      .expect(200)

    expect(article.favoritesCount).toBe(1)
    expect(article.favorited).toBe(true)
  })

  it('should unfavorite article', async () => {
    await registerUser(user('fry', 'fry@example.com', 'secret'), 201);
    await registerUser(user('lisa', 'lisa@example.com', 'secret'), 201);
    const { user: { token: fryToken }} = await login('fry@example.com', 'secret');
    const { user: { token: lisaToken }} = await login('lisa@example.com', 'secret');
    await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Bearer ${fryToken}`)
      .send({
        article: {
          body: 'All backend implementations need to adhere to our API spec.',
          description: 'Introduction',
          title: 'Introduction',
        }
      })
    await request(app.getHttpServer())
      .post(`/api/articles/Introduction/favorite`)
      .set('Authorization', `Bearer ${lisaToken}`)
      .expect(200)
    const { body: { article } } = await request(app.getHttpServer())
      .delete(`/api/articles/Introduction/favorite`)
      .set('Authorization', `Bearer ${lisaToken}`)
      .expect(200)

    expect(article.favoritesCount).toBe(0)
    expect(article.favorited).toBe(false)
  })

  afterAll(async () => {
    await app.close();
  });
});

export async function createDbSchema(): Promise<void> {
  const connection = await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'admin',
    password: 'admin',
    database: 'realworld_testing',
  });
  await connection.createQueryRunner().createSchema('realworld', true);
  await connection.close();
}
