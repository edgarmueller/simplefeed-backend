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
import { PaginatedPostQueryDto } from '../dto/paginated-post-query.dto'
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
