import { ServerEvents } from "@nodepolus/framework/src/api/events";
import { Server } from "@nodepolus/framework/src/server";

declare const server: Server;

export type Filter<EventType> = (event: EventType) => boolean;

export type Executor<EventType> = (event: EventType) => void;

export class EventCatcher<EventName extends Extract<keyof ServerEvents, string>> {
  private readonly filters: Filter<ServerEvents[EventName]>[] = [];
  private readonly executors: Executor<ServerEvents[EventName]>[] = [];
  private readonly boundFunction: (event: ServerEvents[EventName]) => void;

  constructor(private readonly eventName: EventName, private readonly owner: unknown) {
    this.boundFunction = this.handle.bind(this);

    server.on<EventName>(eventName, this.boundFunction);
  }

  where(filterFunction: Filter<ServerEvents[EventName]>): this {
    this.filters.push(filterFunction);

    return this;
  }

  execute(executorFunction: Executor<ServerEvents[EventName]>): this {
    this.executors.push(executorFunction);

    return this;
  }

  destroy(): void {
    server.off<EventName>(this.eventName, this.boundFunction);
  }

  private handle(event: ServerEvents[EventName]): void {
    let shouldPreventExecution = false;

    for (let i = 0; i < this.filters.length; i++) {
      shouldPreventExecution ||= !this.filters[i].bind(this.owner)(event);
    }

    if (shouldPreventExecution) {
      return;
    }

    for (let i = 0; i < this.executors.length; i++) {
      this.executors[i].bind(this.owner)(event);
    }
  }
}
