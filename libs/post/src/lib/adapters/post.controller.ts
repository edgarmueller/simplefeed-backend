import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, RequestWithUser } from "@kittgen/auth"
import { SubmitPostDto } from "../usecases/dto/submit-post.dto";
import { PostUsecases } from "../usecases/post.usecases";

@Controller('posts')
export class PostController {
	constructor(readonly usecases: PostUsecases) {}

	@Post()
	@UseGuards(JwtAuthGuard)
	submitPost(@Body() dto: SubmitPostDto, @Req() req: RequestWithUser) {
		return this.usecases.submitPost(dto.body, req.user, dto.toUserId)
	}
}