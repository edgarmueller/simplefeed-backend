import { User, Profile } from '@simplefeed/user'
import { Post } from './post'


describe('Post', () => {
  it('can be liked only once by an user', () => {
    const fry = User.create({
      email: 'fry@example.com',
      password: 'secret',
      profile: Profile.create({ username: 'fry' }),
    })
    const post = Post.create({
      body: 'content',
      author: fry
    })
    post.like(fry)
    post.like(fry)
    expect(post.getUncommittedEvents()).toHaveLength(1)
    expect(post.likes).toHaveLength(1)
    expect(post.likes[0].unliked).toBe(false)
  })

  it('can be unliked only by an user', () => {
    const fry = User.create({
      email: 'fry@example.com',
      password: 'secret',
      profile: Profile.create({ username: 'fry' }),
    })
    const post = Post.create({
      body: 'content',
      author: fry
    })
    post.like(fry)
    post.unlike(fry)
    expect(post.getUncommittedEvents()).toHaveLength(2)
    expect(post.likes).toHaveLength(1)
    expect(post.likes[0].unliked).toBe(true)
  })
})
