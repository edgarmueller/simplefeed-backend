import { UserSearchDto } from "./user-search.dto";

 
export interface UserSearchResultDto {
  hits: {
    total: number;
    hits: Array<{
      _source: UserSearchDto;
    }>;
  };
}