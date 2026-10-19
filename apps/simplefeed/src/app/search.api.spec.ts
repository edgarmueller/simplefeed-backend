import { INestApplication } from '@nestjs/common'
import { ApiClient, bart, clearDatabase, createTestApp, fry, homer } from './test/helpers'

describe('search api', () => {
  let app: INestApplication
  let api: ApiClient
  let token: string

  beforeAll(async () => {
    app = await createTestApp()
    api = new ApiClient(app)
  })

  beforeEach(async () => {
    await clearDatabase(app)
    token = await api.signUp(bart)
    await api.register(homer)
    await api.register(fry)
  })

  afterAll(async () => {
    await app.close()
  })

  it('should find users by last name, case-insensitively', async () => {
    const results = await api.searchUsers(token, 'simp')

    expect(results.map((user) => user.username)).toEqual(['bart', 'homer'])
  })

  it('should find users by username', async () => {
    const results = await api.searchUsers(token, 'fry')

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ username: 'fry', firstName: 'Philip J.', lastName: 'Fry' })
  })

  it('should treat LIKE wildcards literally', async () => {
    const results = await api.searchUsers(token, '%')

    expect(results).toHaveLength(0)
  })

  it('should return nothing for an empty search', async () => {
    const results = await api.searchUsers(token, '  ')

    expect(results).toHaveLength(0)
  })
})
