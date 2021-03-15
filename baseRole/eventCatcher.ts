import { ServerEvents } from "../../../../lib/api/events";
import { Server } from "../../../../lib/server";

declare const server: Server;

export type Filter<EventType> = (event: EventType) => boolean;

export type Executor<EventType> = (event: EventType) => void;

export class EventCatcher<EventName extends Extract<keyof ServerEvents, string>> {
  private readonly filters: Filter<ServerEvents[EventName]>[] = [];
  private readonly executors: Executor<ServerEvents[EventName]>[] = [];

  constructor(name: EventName) {
    server.on<EventName>(name, this.handle.bind(this));
  }

  where(filterFunction: Filter<ServerEvents[EventName]>): this {
    this.filters.push(filterFunction);

    return this;
  }

  execute(executorFunction: Executor<ServerEvents[EventName]>): this {
    this.executors.push(executorFunction);

    return this;
  }

  private handle(event: ServerEvents[EventName]): void {
    let shouldPreventExecution = false;

    for (let i = 0; i < this.filters.length; i++) {
      shouldPreventExecution ||= !this.filters[i](event);
    }

    if (shouldPreventExecution) {
      return;
    }

    for (let i = 0; i < this.executors.length; i++) {
      this.executors[i](event);
    }
  }
}
