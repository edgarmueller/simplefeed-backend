import { Post } from "@simplefeed/post";

export class GetPostDto {
	static fromDomain(post: Post): GetPostDto {
		return {
			...post,
			author: {
				id: post.author.id,
				firstName: post.author.profile.firstName,
				lastName: post.author.profile.lastName,
				username: post.author.profile.username,
				imageUrl: post.author.profile.imageUrl
			},
			postedTo: {
				id: post.postedTo?.id,
				firstName: post.postedTo?.profile.firstName,
				lastName: post.postedTo?.profile.lastName,
			}
		}
	}
}