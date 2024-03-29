import { ServerEvents } from "@nodepolus/framework/src/api/events";
import { EventCatcher } from ".";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { PlayerInstance } from "@nodepolus/framework/src/api/player";
import { Game } from "@nodepolus/framework/src/api/game";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { BaseInnerNetEntity, BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { Lobby } from "@nodepolus/framework/src/lobby";
import { Player } from "@nodepolus/framework/src/player";
import { StartGameScreenData } from "../services/roleManager/roleManagerService";
import { BaseManager } from "../baseManager/baseManager";
import { RoleDestroyedReason } from "../types/enums/roleDestroyedReason";
import { Services } from "../services";
import { Location, ServiceType } from "../types/enums";
import { AsyncEventCatcher } from "./eventCatcher";

export type Ownable = LobbyInstance | PlayerInstance | Connection | Game | BaseInnerNetEntity | BaseInnerNetObject | undefined;

export enum RoleAlignment {
  Crewmate,
  Impostor,
  Neutral,
  Other,
}

export type RoleMetadata = {
  name: string;
  alignment: RoleAlignment;
  preventBaseEmoji?: boolean;
};

export class BaseRole {
  protected readonly metadata!: RoleMetadata;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly caughtEvents: EventCatcher<any>[] = [];

  constructor(public readonly owner: PlayerInstance) {
    Services.get(ServiceType.Hud).setHudString(owner, Location.TaskText, this.getDescriptionText());
  }

  getDescriptionText(): string { throw new Error("needs to be overwritten") }

  getAssignmentScreen(_player: PlayerInstance, _impostorCount: number): StartGameScreenData { throw new Error("needs to be overwritten") }

  getName(): string {
    return this.metadata.name;
  }

  getAlignment(): RoleAlignment {
    return this.metadata.alignment;
  }

  setAlignment(alignment: RoleAlignment): void {
    this.metadata.alignment = alignment;
  }

  catch<NameType extends Extract<keyof ServerEvents, string>>(eventName: NameType, ownsMethod: (event: ServerEvents[NameType]) => Ownable, async: boolean = false): EventCatcher<NameType> {
    const catcher = new (async ? AsyncEventCatcher : EventCatcher)(eventName, this).where(event => this.owns(ownsMethod.bind(this)(event)));

    this.caughtEvents.push(catcher);

    return catcher;
  }

  owns(thing: Ownable): boolean {
    if (thing === undefined) {
      return false;
    }

    if (thing instanceof Player) {
      return this.owner === thing;
    }

    if (thing instanceof Connection) {
      return this.owner.getConnection() === thing;
    }

    if (thing instanceof Lobby) {
      return this.owner.getLobby() === thing;
    }

    if (thing instanceof Game || thing instanceof BaseInnerNetEntity || thing instanceof BaseInnerNetObject) {
      return this.owner.getLobby() === thing.getLobby();
    }

    throw new Error("Input invalid.");
  }

  getManager<T extends BaseManager>(id: string): T {
    return this.owner.getLobby().getMeta<T>(`pgg.manager.${id}`);
  }

  async onDestroy(_destroyReason: RoleDestroyedReason): Promise<void> {
    for (let i = 0; i < this.caughtEvents.length; i++) {
      this.caughtEvents[i].destroy();
    }
  }

  getManagerType(): typeof BaseManager { throw new Error("needs to be overwritten") }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPartner(role: BaseRole): boolean {
    return false;
  }
}
