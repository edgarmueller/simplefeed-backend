import { Post } from "../../post";

export class GetPostDto {
	static fromDomain(post: Post): GetPostDto {
		return {
			...post,
			author: {
				...post.author.profile
			}
		}
	}
}