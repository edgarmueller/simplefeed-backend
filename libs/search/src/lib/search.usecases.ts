import { Injectable } from '@nestjs/common';
import { SearchService } from './search.service';

@Injectable()
export class SearchUsecases {
  constructor(private readonly searchService: SearchService) {}
  searchUser(searchText: string) {
    return this.searchService.searchUser(searchText)
  }
}