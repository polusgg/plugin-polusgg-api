import { ServerEvents } from "@nodepolus/framework/src/api/events";
import { Server } from "@nodepolus/framework/src/server";

declare const server: Server;

export type Filter<EventType> = (event: EventType) => boolean;

export type AsyncFilter<EventType> = (event: EventType) => Promise<boolean>;

export type Executor<EventType> = (event: EventType) => void;

export type AsyncExecutor<EventType> = (event: EventType) => Promise<void>;

export class EventCatcher<EventName extends Extract<keyof ServerEvents, string>> {
  protected readonly filters: Filter<ServerEvents[EventName]>[] = [];
  protected readonly executors: Executor<ServerEvents[EventName]>[] = [];
  protected readonly boundFunction: (event: ServerEvents[EventName]) => void;

  constructor(protected readonly eventName: EventName, protected readonly owner: unknown) {
    this.boundFunction = this.handle.bind(this);

    if (eventName === "game.ended") {
      //@ts-expect-error
      this.where(e => e.getReason() === 7);
    }

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

  handle(event: ServerEvents[EventName]): void {
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

export class AsyncEventCatcher<EventName extends Extract<keyof ServerEvents, string>> extends EventCatcher<EventName> {
  async handle(event: ServerEvents[EventName]): Promise<void> {
    let shouldPreventExecution = false;

    for (let i = 0; i < this.filters.length; i++) {
      shouldPreventExecution ||= !await this.filters[i].bind(this.owner)(event);
    }

    if (shouldPreventExecution) {
      return;
    }

    for (let i = 0; i < this.executors.length; i++) {
      await this.executors[i].bind(this.owner)(event);
    }
  }
}
