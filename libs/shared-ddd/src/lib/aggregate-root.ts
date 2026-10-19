import { AggregateRoot as NestJsAggregateRoot } from '@nestjs/cqrs'
import { randomUUID } from 'crypto'
import { IDomainEvent } from './events/domain-event.interface'

export abstract class AggregateRoot<
  EventBase extends IDomainEvent = IDomainEvent
> extends NestJsAggregateRoot<EventBase> {
  readonly id: string

  constructor(props: any, id?: string) {
    super()
    Object.assign(this, props)
    this.id = id ? id : randomUUID()
  }

  public emitDomainEvent<T extends EventBase = EventBase>(
    event: T,
    isFromHistory?: boolean
  ): void {
    super.apply<T>(event, isFromHistory)
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
