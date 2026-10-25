import { Like } from '@simplefeed/post'

/** A like on one of the requesting user's posts. */
export class GetReceivedLikeDto {
  postId: string
  likedAt: Date

  static fromDomain(like: Like): GetReceivedLikeDto {
    return { postId: like.post.id, likedAt: like.createdAt }
  }
}
