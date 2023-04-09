import { Comment } from '../../comment'

export class GetCommentDto {
  static fromDomain(comment: Comment): GetCommentDto {
    return {
			id: comment.id,
			postId: comment.post.id,
			content: comment.content,
			createdAt: comment.createdAt.toISOString(),
			author: comment.author.profile.username,
			path: comment.path
		}
  }

	id: string
	postId: string
	content: string
	author: string
	createdAt: string
	path: string;

	constructor(props: Partial<GetCommentDto>) {
		Object.assign(this, props)
	}
}