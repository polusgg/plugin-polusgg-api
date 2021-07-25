import { ServerEvents } from "@nodepolus/framework/src/api/events";
import { Game } from "@nodepolus/framework/src/api/game";
import { LobbyInstance } from "@nodepolus/framework/src/api/lobby";
import { Lobby } from "@nodepolus/framework/src/lobby";
import { Player } from "@nodepolus/framework/src/player";
import { Connection } from "@nodepolus/framework/src/protocol/connection";
import { BaseInnerNetEntity, BaseInnerNetObject } from "@nodepolus/framework/src/protocol/entities/baseEntity";
import { EventCatcher } from "../baseRole";
import { BaseRole, Ownable } from "../baseRole/baseRole";

export class BaseManager {
  constructor(protected readonly owner: LobbyInstance) { }

  catch<NameType extends Extract<keyof ServerEvents, string>>(eventName: NameType, ownsMethod: (event: ServerEvents[NameType]) => Ownable): EventCatcher<NameType> {
    return new EventCatcher(eventName, this).where(event => this.owns(ownsMethod(event)));
  }

  owns(thing: Ownable): boolean {
    if (thing instanceof Player) {
      return this.owner === thing.getLobby() && thing.getMeta<BaseRole | undefined>("pgg.api.role")?.getName() === this.getTypeName();
    }

    if (thing instanceof Connection) {
      return this.owner === thing.getLobby() && thing.getLobby()?.findSafePlayerByConnection(thing).getMeta<BaseRole | undefined>("pgg.api.role")
        ?.getName() === this.getTypeName();
    }

    if (thing instanceof Lobby) {
      return this.owner === thing;
    }

    if (thing instanceof Game || thing instanceof BaseInnerNetEntity || thing instanceof BaseInnerNetObject) {
      return this.owner === thing.getLobby();
    }

    throw new Error("Input invalid.");
  }

  getId(): string { throw new Error("needs to be overridden") }
  getTypeName(): string { throw new Error("needs to be overridden") }
}
