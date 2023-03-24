import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
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
import { Comment } from '../comment'
import { Pagination } from 'nestjs-typeorm-paginate'
import { CommentPostDto } from '../usecases/dto/comment-post.dto'
import { GetCommentDto } from '../usecases/dto/get-comment.dto';

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

  @Get(':postId/comments')
  @UseGuards(JwtAuthGuard)
  async fetchComments(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
  ): Promise<Pagination<GetCommentDto>> {
    return this.usecases.fetchComments(postId)
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  async postComment(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Body() dto: CommentPostDto
  ): Promise<Comment> {
    return this.usecases.postComment(req.user, postId, dto)
  }

  @Get(':postId/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async fetchNestedComments(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ): Promise<Pagination<GetCommentDto>> {
    return this.usecases.fetchComments(postId, commentId)
  }
}
