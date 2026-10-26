import { INestApplication } from '@nestjs/common'
import { ApiClient, bart, clearDatabase, createTestApp } from './test/helpers'

describe('account api', () => {
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

  it('should sign up and show the reader their account', async () => {
    const token = await api.signUp(bart)

    expect(await api.getMe(token)).toEqual({
      id: expect.stringMatching(/^use-/),
      email: 'bart@example.com',
      username: 'bart',
      firstName: 'Bart',
      lastName: 'Simpson',
    })
  })
})
