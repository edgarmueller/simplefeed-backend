import { JwtAuthGuard, RequestWithUser } from '@kittgen/auth';
import { Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { FriendUsecases, GetFriendRequestDto } from '@kittgen/user';

@Controller('friend-requests')
export class FriendRequestsController {
  constructor(private readonly usecases: FriendUsecases) {}

  @UseGuards(JwtAuthGuard)
  @Post(':username')
  async sendFriendRequest(
    @Req() req: RequestWithUser,
    @Param('username') toUserName: string
  ): Promise<GetFriendRequestDto> {
    const fromUser = req.user
    return this.usecases.sendFriendRequest(fromUser, toUserName)
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending')
  async getPendingFriendRequests(
    @Req() req: RequestWithUser
  ): Promise<GetFriendRequestDto[]> {
    return this.usecases.getReceivedFriendRequests(req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Get('sent')
  async getSentFriendRequests(
    @Req() req: RequestWithUser
  ): Promise<GetFriendRequestDto[]> {
    return this.usecases.getSentFriendRequests(req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':friendRequestId')
  async confirmFriendRequest(@Param('friendRequestId') friendRequestId: string) {
    return this.usecases.confirmRequest(friendRequestId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':friendRequestId')
  async cancelFriendRequest(
    @Req() req: RequestWithUser,
    @Param('friendRequestId') friendRequestId: string
  ): Promise<void> {
    return this.usecases.cancelFriendRequest(req.user, friendRequestId);
  }
}