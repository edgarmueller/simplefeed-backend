import { Post } from "@simplefeed/post";

export class GetPostDto {
	static fromDomain(post: Post): GetPostDto {
		return {
			...post,
			author: {
				...post.author.profile,
				id: post.author.id,
			},
			postedTo: {
				...post.postedTo?.profile,
				id: post.postedTo?.id,
			}
		}
	}
}