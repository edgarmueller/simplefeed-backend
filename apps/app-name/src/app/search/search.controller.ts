import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@simplefeed/auth'
import { SearchUsecases } from '@simplefeed/search';

@Controller('search')
export class SearchController {

	constructor(readonly usecases: SearchUsecases) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async searchUsers(@Query('users') search: string) {
    return await this.usecases.searchUser(search)
  }
}