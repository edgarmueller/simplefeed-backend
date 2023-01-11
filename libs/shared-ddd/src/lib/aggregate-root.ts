import { AggregateRoot as NestJsAggregateRoot } from '@nestjs/cqrs'
import { uuid } from 'short-uuid'
import { DomainEvents } from './events/domain-events'
import { IDomainEvent } from './events/domain-event.interface'

export abstract class AggregateRoot<
  EventBase extends IDomainEvent = IDomainEvent
> extends NestJsAggregateRoot<EventBase> {
  readonly id: string

  constructor(props: any, id?: string) {
    super()
    Object.assign(this, props)
    this.id = id ? id : uuid()
  }

  protected emitDomainEvent<T extends EventBase = EventBase>(
    event: T,
    isFromHistory?: boolean
  ): void {
    super.apply<T>(event, isFromHistory)
    DomainEvents.markAggregateForDispatch(this)
  }

  public equals(object?: AggregateRoot): boolean {
    if (object == null || object === undefined) {
      return false
    }

    if (this === object) {
      return true
    }

    return this.id === object.id
  }
}
