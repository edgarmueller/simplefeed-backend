import { FriendUsecases } from '@simplefeed/user';
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth';
import { Controller, Delete, Param, Req, UseGuards } from "@nestjs/common";

@Controller('friends')
export class FriendsController {
  constructor(private readonly usecases: FriendUsecases) {}

  @UseGuards(JwtAuthGuard)
  @Delete(':friendId')
  async removeFriend(
    @Req() req: RequestWithUser,
    @Param('friendId') friendId: string
  ): Promise<void> {
    return this.usecases.removeFriend(req.user.id, friendId);
  }
}