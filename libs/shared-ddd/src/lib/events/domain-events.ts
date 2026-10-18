import { EventPublisher } from '@nestjs/cqrs'
import { runOnTransactionCommit } from 'typeorm-transactional'
import { AggregateRoot } from '../aggregate-root'

export class DomainEvents {
  /**
   * Publishes the aggregate's pending events once the surrounding transaction
   * has been committed, so handlers never react to state that is later rolled
   * back. Must be called from within a `@Transactional()` method.
   */
  static publishOnCommit(aggregate: AggregateRoot, publisher: EventPublisher): void {
    runOnTransactionCommit(() => {
      publisher.mergeObjectContext(aggregate).commit()
    })
  }
}
