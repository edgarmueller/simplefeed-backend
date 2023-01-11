import { Injectable } from '@nestjs/common';
import { <%= pluralize(aggregateName) %>Repository } from '../../domain/<%= lowercased(pluralize(aggregateName)) %>.repository.interface';

@Injectable()
export class <%= typeName %>UseCase {
  constructor(readonly <%= lowercased(aggregateName) %>Repository: <%= pluralize(aggregateName) %>Repository) {}

  async execute(): Promise<unknown> {
    // TODO
  }
}
