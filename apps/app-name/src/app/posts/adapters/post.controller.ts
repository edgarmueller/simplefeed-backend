import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth'
import { Pagination } from 'nestjs-typeorm-paginate'
import { CommentPostDto } from '../../../../../../libs/post/src/lib/usecases/dto/comment-post.dto'
import { GetCommentDto } from '../../../../../../libs/post/src/lib/usecases/dto/get-comment.dto'
import { GetPostDto } from '../../../../../../libs/post/src/lib/usecases/dto/get-post.dto'
import { SubmitPostDto } from '../../../../../../libs/post/src/lib/usecases/dto/submit-post.dto'
import { PostUsecases } from '../../../../../../libs/post/src/lib/usecases/post.usecases'
import { PaginatedQueryDto } from '../../infra/paginated-query.dto'
import { PaginatedQueryPipe } from '../../infra/paginated-query.pipe'
import { PaginatedPostQueryDto } from './paginated-post-query.dto'

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
    @Query() paginationQueryDto: PaginatedPostQueryDto,
  ): Promise<Pagination<GetPostDto>> {
    if (paginationQueryDto.userId) {
      return this.usecases.getUserActivityFeed(paginationQueryDto.userId, {
        page: paginationQueryDto.page,
        limit: paginationQueryDto.limit,
      })
    }
    return this.usecases.getPersonalFeed(req.user.id, {
      page: paginationQueryDto.page,
      limit: paginationQueryDto.limit,
    })
  }

  @Get(':postId')
  @UseGuards(JwtAuthGuard)
  getPost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string
  ): Promise<GetPostDto> {
    return this.usecases.getPost(postId, req.user.id)
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
    return this.usecases.fetchComments(
      postId,
      commentId || postId,
      paginationOpts
    )
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
  async fetchLikes(@Req() req: RequestWithUser): Promise<any> {
    return this.usecases.findLikedPostsByUser(req.user)
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string
  ): Promise<void> {
    return this.usecases.deletePost(postId, req.user)
  }
}
