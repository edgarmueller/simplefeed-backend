import { UserModule } from '@kittgen/user';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './adapters/post.controller';
import { CommentSchema } from './comment.schema';
import { PostLikedEventHandler } from './event-handlers/post-liked.event-handler';
import { LikeSchema } from './like.schema';
import { PostsRepository } from './post.repository';
import { PostSchema } from './post.schema';
import { PostUsecases } from './usecases/post.usecases';

@Module({
  imports: [
		UserModule,
		TypeOrmModule.forFeature([PostSchema, CommentSchema, LikeSchema]),
		CqrsModule
	],
	controllers: [PostController],
	providers: [PostsRepository, PostUsecases, PostLikedEventHandler],
	exports: [PostsRepository],
})
export class PostModule {}
