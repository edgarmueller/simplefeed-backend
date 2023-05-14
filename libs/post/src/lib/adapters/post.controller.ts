import { JwtAuthGuard, RequestWithUser } from '@kittgen/auth'
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
  UsePipes
} from '@nestjs/common'
import { Pagination } from 'nestjs-typeorm-paginate'
import { Comment } from '../comment'
import { Post as PostEntity } from '../post'
import { CommentPostDto } from '../usecases/dto/comment-post.dto'
import { GetCommentDto } from '../usecases/dto/get-comment.dto'
import { SubmitPostDto } from '../usecases/dto/submit-post.dto'
import { PostUsecases } from '../usecases/post.usecases'
import { PaginatedQueryPipe } from './paginated-query.pipe'
import { PaginatedQueryDto } from './paginated-query.dto'

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

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  async postComment(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Body() dto: CommentPostDto
  ): Promise<GetCommentDto> {
    const comment = await this.usecases.postComment(req.user, postId, dto)
    return GetCommentDto.fromDomain(comment)
  }

  @Get(':postId/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async fetchComments(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Query(new PaginatedQueryPipe()) paginationOpts: PaginatedQueryDto
  ): Promise<Pagination<GetCommentDto>> {
    return this.usecases.fetchComments(postId, commentId, paginationOpts)
  }

  @Get(':postId/comments')
  @UseGuards(JwtAuthGuard)
  async fetchRootComments(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Query(new PaginatedQueryPipe()) paginationOpts: PaginatedQueryDto
  ): Promise<Pagination<GetCommentDto>> {
    return this.usecases.fetchRootComments(postId, commentId, paginationOpts)
  }

  @Post(':postId/like')
  @UseGuards(JwtAuthGuard)
  async likePost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string
  ): Promise<void> {
    return this.usecases.likePost(postId, req.user)
  }

  @Post('likes')
  @UseGuards(JwtAuthGuard)
  async fetchLikes(
    @Req() req: RequestWithUser,
  ): Promise<any> {
    return this.usecases.findLikedPostsByUser(req.user);
  }
}
