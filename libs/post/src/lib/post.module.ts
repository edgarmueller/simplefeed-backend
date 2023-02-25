import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsRepository } from './post.repository';
import { PostSchema } from './post.schema';

@Module({
  imports: [
		TypeOrmModule.forFeature([PostSchema]),
		CqrsModule
	],
	controllers: [],
	providers: [PostsRepository],
	exports: [PostsRepository],
})
export class PostModule {}
