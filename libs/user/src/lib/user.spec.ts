import { Profile } from './profile'
import { User } from './user'

describe('User', () => {
  it('hashes a new password', async () => {
    const user = User.create({ email: 'fry@example.com', password: 'old', profile: Profile.create({ username: 'fry' }) })

    await user.updatePassword('secret')

    expect(user.password).not.toBe('secret')
    expect(user.password).toMatch(/^\$2[aby]\$/)
  })

  it('ignores empty updates', async () => {
    const user = User.create({ email: 'fry@example.com', password: 'old', profile: Profile.create({ username: 'fry' }) })

    user.updateEmail('')
    await user.updatePassword('')

    expect(user).toMatchObject({ email: 'fry@example.com', password: 'old' })
  })
})
