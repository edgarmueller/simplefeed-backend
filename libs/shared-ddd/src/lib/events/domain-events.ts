/* eslint-disable @typescript-eslint/member-ordering */
import { EventPublisher } from '@nestjs/cqrs';
import { AggregateRoot } from '../aggregate-root';

export class DomainEvents {
  private static markedAggregates: AggregateRoot<any>[] = [];

  /**
   * @method markAggregateForDispatch
   * @static
   * @desc Called by aggregate root objects that have created domain
   * events to eventually be dispatched when the infrastructure commits
   * the unit of work.
   */

  public static markAggregateForDispatch(aggregate: AggregateRoot<any>): void {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);
    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  private static findMarkedAggregateByID(
    id: string
  ): AggregateRoot<any> | undefined {
    for (const aggregate of this.markedAggregates) {
      if (aggregate.id === id) {
        return aggregate;
      }
    }

    return undefined;
  }

  public static dispatchEventsForAggregate(
    id: string,
    publisher: EventPublisher
  ): void {
    const aggregate = this.findMarkedAggregateByID(id);

    if (aggregate) {
      const aggregateWithPendingEvents =
        publisher.mergeObjectContext(aggregate);
      aggregateWithPendingEvents.commit();
      this.removeAggregateFromMarkedDispatchList(aggregate);
    }
  }

  private static removeAggregateFromMarkedDispatchList(
    aggregate: AggregateRoot<any>
  ): void {
    const index = this.markedAggregates.findIndex((a) => a.equals(aggregate));
    this.markedAggregates.splice(index, 1);
  }

  public static clearMarkedAggregates(): void {
    this.markedAggregates = [];
  }
}