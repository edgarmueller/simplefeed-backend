import { Module } from '@nestjs/common'
import { PostModule as PostCoreModule } from '@simplefeed/post'
import { PostController } from './post.controller'

@Module({
  imports: [
		PostCoreModule,
	],
	controllers: [PostController],
})
export class PostModule {}
