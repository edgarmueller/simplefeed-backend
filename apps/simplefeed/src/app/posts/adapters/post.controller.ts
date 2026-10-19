import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth'
import {
  Attachment,
  PostUsecases,
} from '@simplefeed/post'
import { Page, mapPage } from '@simplefeed/shared-ddd'
import { PaginatedQueryDto } from '../../infra/paginated-query.dto'
import { PaginatedQueryPipe } from '../../infra/paginated-query.pipe'
import { PaginatedPostQueryDto } from '../dto/paginated-post-query.dto'
import { CommentPostDto } from '../dto/comment-post.dto'
import { GetCommentDto } from '../dto/get-comment.dto'
import { GetPostDto } from '../dto/get-post.dto'
import { SubmitPostDto } from '../dto/submit-post.dto'

type File = Express.Multer.File

@Controller('posts')
export class PostController {
  constructor(readonly usecases: PostUsecases) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async submitPost(
    @Body() dto: SubmitPostDto,
    @Req() req: RequestWithUser,
    @UploadedFiles() files?: File[]
  ): Promise<GetPostDto> {
    let attachments: Attachment[] = []
    if (dto.attachments) {
      attachments = JSON.parse(dto.attachments)
    }
    const post = await this.usecases.submitPost(
      dto.body,
      req.user,
      attachments,
      files,
      dto.toUserId
    )
    return GetPostDto.fromDomain(post)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @Req() req: RequestWithUser,
    @Query() paginationQueryDto: PaginatedPostQueryDto
  ): Promise<Page<GetPostDto>> {
    if (paginationQueryDto.userId) {
      const page =  await this.usecases.getUserActivityFeed(paginationQueryDto.userId, {
        page: paginationQueryDto.page,
        limit: paginationQueryDto.limit,
      })
      return mapPage(page, GetPostDto.fromDomain)
    }
    const page = await this.usecases.getPersonalFeed(req.user.id, {
      page: paginationQueryDto.page,
      limit: paginationQueryDto.limit,
    })
    return mapPage(page, GetPostDto.fromDomain)
  }

  @Get(':postId')
  @UseGuards(JwtAuthGuard)
  async getPost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string
  ): Promise<GetPostDto> {
    const post = await this.usecases.getPost(postId, req.user.id)
    return GetPostDto.fromDomain(post)
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  async postComment(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Body() dto: CommentPostDto
  ): Promise<GetCommentDto> {
    const comment = await this.usecases.postComment(req.user, postId, dto.content, dto.path)
    return GetCommentDto.fromDomain(comment)
  }

  @Get(':postId/comments{/:commentId}')
  @UseGuards(JwtAuthGuard)
  async fetchComments(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Param('commentId') commentId?: string,
    @Query(new PaginatedQueryPipe()) paginationOpts?: PaginatedQueryDto
  ): Promise<Page<GetCommentDto>> {
    const page = await this.usecases.fetchComments(
      postId,
      commentId || postId,
      paginationOpts
    )
    return mapPage(page, GetCommentDto.fromDomain)
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

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string
  ): Promise<void> {
    return this.usecases.deletePost(postId, req.user)
  }
}
