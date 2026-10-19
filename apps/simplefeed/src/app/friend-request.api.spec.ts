import { INestApplication } from '@nestjs/common'
import { ApiClient, clearDatabase, createTestApp, fry, lisa } from './test/helpers'

describe('friend request api', () => {
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

  it('should send friend request to another user', async () => {
    const fryToken = await api.signUp(fry)
    const lisaToken = await api.signUp(lisa)

    await api.sendFriendRequest(fryToken, 'lisa')
    const pendingRequests = await api.getPendingFriendRequests(lisaToken)

    expect(pendingRequests).toHaveLength(1)
  })

  it('should accept friend request', async () => {
    const fryToken = await api.signUp(fry)
    const lisaToken = await api.signUp(lisa)

    await api.befriend(fryToken, lisaToken, 'lisa')
    const pendingRequests = await api.getPendingFriendRequests(lisaToken)
    const frysFriends = await api.getFriendsOf(fryToken, 'fry')
    const lisasFriends = await api.getFriendsOf(fryToken, 'lisa')

    expect(pendingRequests).toHaveLength(0)
    expect(frysFriends).toHaveLength(1)
    expect(lisasFriends).toHaveLength(1)
  })

  it('should decline friend request', async () => {
    const fryToken = await api.signUp(fry)
    const lisaToken = await api.signUp(lisa)

    const friendRequest = await api.sendFriendRequest(fryToken, 'lisa')
    await api.declineFriendRequest(lisaToken, friendRequest.id)
    const pendingRequests = await api.getPendingFriendRequests(lisaToken)

    expect(pendingRequests).toHaveLength(0)
  })
})
