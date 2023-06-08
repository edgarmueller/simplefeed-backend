import { JwtAuthGuard, RequestWithUser } from '@kittgen/auth';
import {
  Body,
  Controller,
  DefaultValuePipe, Delete, Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { CommentPostDto } from '../usecases/dto/comment-post.dto';
import { GetCommentDto } from '../usecases/dto/get-comment.dto';
import { SubmitPostDto } from '../usecases/dto/submit-post.dto';
import { PostUsecases } from '../usecases/post.usecases';
import { PaginatedQueryDto } from './paginated-query.dto';
import { PaginatedQueryPipe } from './paginated-query.pipe';
import { GetPostDto } from '../usecases/dto/get-post.dto';

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
  getFeed(
    @Req() req: RequestWithUser,
    @Query('userId') userId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10
  ): Promise<Pagination<GetPostDto>> {
    if (userId) {
      return this.usecases.getUserActivityFeed(userId, { page, limit })
    }
    return this.usecases.getPersonalFeed(req.user.id, { page, limit })
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

  @Get(':postId/comments/:commentId?')
  @UseGuards(JwtAuthGuard)
  async fetchComments(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Param('commentId') commentId?: string,
    @Query(new PaginatedQueryPipe()) paginationOpts?: PaginatedQueryDto
  ): Promise<Pagination<GetCommentDto>> {
    return this.usecases.fetchComments(postId, commentId || postId, paginationOpts)
  }

  @Post(':postId/like')
  @UseGuards(JwtAuthGuard)
  async likePost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string
  ): Promise<void> {
    return this.usecases.likePost(postId, req.user)
  }

  @Delete(':postId/like')
  @UseGuards(JwtAuthGuard)
  async unlikePost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string
  ): Promise<void> {
    return this.usecases.unlikePost(postId, req.user)
  }

  @Post('likes')
  @UseGuards(JwtAuthGuard)
  async fetchLikes(
    @Req() req: RequestWithUser,
  ): Promise<any> {
    return this.usecases.findLikedPostsByUser(req.user);
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Req() req: RequestWithUser, @Param('postId') postId: string): Promise<void> {
    return this.usecases.deletePost(postId, req.user);
  }
}
