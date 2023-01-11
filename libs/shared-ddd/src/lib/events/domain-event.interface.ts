import { IEvent } from '@nestjs/cqrs'

export interface IDomainEvent extends IEvent {
  timestamp: Date
  getAggregateId(): string
}
