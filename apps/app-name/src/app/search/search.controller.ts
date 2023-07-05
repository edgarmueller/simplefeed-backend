import { BadRequestException, Controller, Get, Optional, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@simplefeed/auth'
import { SearchUsecases } from '@simplefeed/search';

@Controller('search')
export class SearchController {

	constructor(@Optional() readonly usecases?: SearchUsecases) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async searchUsers(@Query('users') search: string) {
    if (!this.usecases) {
      throw new BadRequestException('Search not initialized')
    } 
    return await this.usecases.searchUser(search)
  }
}