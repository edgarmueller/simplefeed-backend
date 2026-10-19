import { INestApplication } from '@nestjs/common'
import { ApiClient, bart, clearDatabase, createTestApp, homer } from './test/helpers'

describe('comment api', () => {
  let app: INestApplication
  let api: ApiClient

  beforeAll(async () => {
    app = await createTestApp()
    api = new ApiClient(app)
  })

  beforeEach(async () => {
    await clearDatabase(app)
  })

  afterAll(async () => {
    await app.close()
  })

  it('should allow commenting a post', async () => {
    const bartToken = await api.signUp(bart)
    const homerToken = await api.signUp(homer)

    const post = await api.createPost(bartToken, 'Hello World')
    await api.commentPost(homerToken, post.id, 'Nice post!')
    const comments = await api.getCommentsOfPost(bartToken, post.id)

    expect(comments.items).toHaveLength(1)
  })
})
