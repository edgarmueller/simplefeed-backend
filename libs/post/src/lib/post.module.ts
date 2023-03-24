import { CommentSchema } from './comment.schema';
import { PostUsecases } from './usecases/post.usecases';
import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsRepository } from './post.repository';
import { PostSchema } from './post.schema';
import { UserModule } from '@kittgen/user';
import { PostController } from './adapters/post.controller';

@Module({
  imports: [
		UserModule,
		TypeOrmModule.forFeature([PostSchema, CommentSchema]),
		CqrsModule
	],
	controllers: [PostController],
	providers: [PostsRepository, PostUsecases],
	exports: [PostsRepository],
})
export class PostModule {}
