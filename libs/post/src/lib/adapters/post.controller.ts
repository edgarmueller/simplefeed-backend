import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard, RequestWithUser } from '@kittgen/auth'
import { SubmitPostDto } from '../usecases/dto/submit-post.dto'
import { PostUsecases } from '../usecases/post.usecases'
import { Post as PostEntity } from '../post'
import { Pagination } from 'nestjs-typeorm-paginate'

@Controller('posts')
export class PostController {
  constructor(readonly usecases: PostUsecases) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  submitPost(@Body() dto: SubmitPostDto, @Req() req: RequestWithUser) {
    return this.usecases.submitPost(dto.body, req.user, dto.toUserId)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findPosts(
    @Req() req: RequestWithUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10
  ): Promise<Pagination<PostEntity>> {
    return this.usecases.findPosts(req.user, { page, limit })
  }
}
