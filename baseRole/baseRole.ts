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

export type Ownable = LobbyInstance | PlayerInstance | Connection | Game | BaseInnerNetEntity | BaseInnerNetObject;

export type RoleMetadata = {
  name: string;
};

export class BaseRole {
  protected readonly metadata!: RoleMetadata;

  constructor(private readonly owner: PlayerInstance) {}

  getAssignmentScreen(_player: PlayerInstance): StartGameScreenData { throw new Error("needs to be overwritten") }

  getName(): string {
    return this.metadata.name;
  }

  catch<NameType extends Extract<keyof ServerEvents, string>>(eventName: NameType, ownsMethod: (event: ServerEvents[NameType]) => Ownable): EventCatcher<NameType> {
    return new EventCatcher(eventName).where(event => this.owns(ownsMethod(event)));
  }

  owns(thing: Ownable): boolean {
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

  getManagerType(): typeof BaseManager { throw new Error("needs to be overwritten") }
}
